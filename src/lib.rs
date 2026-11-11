pub mod providers;

//! Liminal Flights MVP: deterministic time-constrained search over complete,
//! independently purchasable offers (rather than guessing segment fares).
//! All prices are party totals, in EUR cents, in this offline demonstration.

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Mode {
    Flight,
    Ground,
}

/// One independently purchasable offer. A real provider's multi-segment/single-
/// ticket offer must be kept atomic; never sum individual legs of that ticket.
#[derive(Clone, Debug)]
pub struct Offer {
    pub id: &'static str,
    pub source: &'static str,
    pub origin: &'static str,
    pub destination: &'static str,
    pub departure_utc_min: i64,
    pub arrival_utc_min: i64,
    pub mode: Mode,
    /// Total for all travellers, with selected baggage/services included.
    pub party_total_eur_cents: u64,
    pub quote_age_min: u64,
    /// Provider reprice/refresh succeeded. This is NOT a ticket guarantee.
    pub refreshed: bool,
}

#[derive(Clone, Debug)]
pub struct SearchRequest {
    pub origin: &'static str,
    pub destination: &'static str,
    pub earliest_utc_min: i64,
    pub latest_arrival_utc_min: i64,
    pub max_offers: usize,
    /// Minimum buffer between two separately purchased flights.
    pub self_transfer_min: i64,
    /// Minimum buffer after a ground leg before check-in for a flight.
    pub ground_to_flight_min: i64,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Route {
    pub offer_indices: Vec<usize>,
    pub party_total_eur_cents: u64,
    pub duration_min: i64,
    /// Heuristic *routing penalty*, not a quantified probability of failure.
    pub risk_points: u32,
    pub stale_or_unverified: bool,
}

#[derive(Clone, Debug)]
struct State {
    airport: &'static str,
    last_arrival: i64,
    first_departure: Option<i64>,
    last_mode: Option<Mode>,
    prior_flight: bool,
    visited: Vec<&'static str>,
    path: Vec<usize>,
    total: u64,
    risk: u32,
    stale_or_unverified: bool,
}

/// Enumerate time-feasible independent offers with a bounded hop count.
/// This PoC deliberately DOES NOT validate visas, MCT, ticket protection,
/// regional availability, fare brands, currencies, passenger inventories, etc.
/// Those are hard production prerequisites, not implied by low risk_points.
pub fn search(offers: &[Offer], request: &SearchRequest) -> Vec<Route> {
    let initial = State {
        airport: request.origin,
        last_arrival: request.earliest_utc_min,
        first_departure: None,
        last_mode: None,
        prior_flight: false,
        visited: vec![request.origin],
        path: Vec::new(),
        total: 0,
        risk: 0,
        stale_or_unverified: false,
    };
    let mut found = Vec::new();
    dfs(offers, request, initial, &mut found);
    found.sort_by_key(|r| (r.party_total_eur_cents, r.duration_min, r.risk_points));
    found
}

fn dfs(offers: &[Offer], req: &SearchRequest, state: State, found: &mut Vec<Route>) {
    if state.airport == req.destination && !state.path.is_empty() {
        found.push(Route {
            offer_indices: state.path,
            party_total_eur_cents: state.total,
            duration_min: state.last_arrival - state.first_departure.unwrap_or(state.last_arrival),
            risk_points: state.risk,
            stale_or_unverified: state.stale_or_unverified,
        });
        return;
    }
    if state.path.len() >= req.max_offers {
        return;
    }
    for (index, offer) in offers.iter().enumerate() {
        if offer.origin != state.airport
            || state.visited.contains(&offer.destination)
            || offer.arrival_utc_min <= offer.departure_utc_min
            || offer.arrival_utc_min > req.latest_arrival_utc_min
        {
            continue;
        }
        let buffer = match (state.last_mode, offer.mode) {
            (Some(Mode::Flight), Mode::Flight) => req.self_transfer_min,
            (Some(Mode::Ground), Mode::Flight) => req.ground_to_flight_min,
            _ => 0,
        };
        if offer.departure_utc_min < state.last_arrival + buffer {
            continue;
        }
        let Some(total) = state.total.checked_add(offer.party_total_eur_cents) else {
            continue;
        };
        let mut next = state.clone();
        next.airport = offer.destination;
        next.last_arrival = offer.arrival_utc_min;
        next.first_departure = Some(next.first_departure.unwrap_or(offer.departure_utc_min));
        // Independently issued flight offers imply an unprotected self-transfer.
        if next.prior_flight && offer.mode == Mode::Flight {
            next.risk = next.risk.saturating_add(35);
        }
        // Ground travel is a separate dependency that may have variable time.
        if offer.mode == Mode::Ground {
            next.risk = next.risk.saturating_add(12);
        }
        next.stale_or_unverified |= offer.mode == Mode::Flight
            && (!offer.refreshed || offer.quote_age_min > 15);
        next.prior_flight |= offer.mode == Mode::Flight;
        next.last_mode = Some(offer.mode);
        next.visited.push(offer.destination);
        next.path.push(index);
        next.total = total;
        dfs(offers, req, next, found);
    }
}

/// Multi-objective Pareto frontier over party cost, duration and risk heuristic.
/// A route disappears only if another is at least as good on ALL dimensions.
pub fn pareto_frontier(routes: &[Route]) -> Vec<Route> {
    routes.iter().enumerate().filter_map(|(i, candidate)| {
        let dominated = routes.iter().enumerate().any(|(j, other)| {
            i != j
                && other.party_total_eur_cents <= candidate.party_total_eur_cents
                && other.duration_min <= candidate.duration_min
                && other.risk_points <= candidate.risk_points
                // An unverified quote must not suppress a verified route.
                && (!other.stale_or_unverified || candidate.stale_or_unverified)
                && (other.party_total_eur_cents < candidate.party_total_eur_cents
                    || other.duration_min < candidate.duration_min
                    || other.risk_points < candidate.risk_points
                    || (candidate.stale_or_unverified && !other.stale_or_unverified))
        });
        (!dominated).then_some(candidate.clone())
    }).collect()
}

#[derive(Clone, Debug)]
pub struct AlertRule {
    pub max_party_total_eur_cents: u64,
    pub max_risk_points: u32,
    pub max_quote_age_min: u64,
}

/// Checks a user-configured condition. The call-site must still validate
/// provider rights, duplicate suppression, consent and booking availability.
pub fn eligible_for_alert(
    route: &Route,
    offers: &[Offer],
    rule: &AlertRule,
) -> bool {
    route.party_total_eur_cents <= rule.max_party_total_eur_cents
        && route.risk_points <= rule.max_risk_points
        && !route.stale_or_unverified
        && route.offer_indices.iter().all(|index| {
            offers.get(*index).is_some_and(|offer| {
                offer.mode == Mode::Ground
                    || (offer.refreshed && offer.quote_age_min <= rule.max_quote_age_min)
            })
        })
}

/// Clearly fictional demonstration data; timestamps are minutes on a sample
/// UTC timeline, not actual timetabled service or live prices.
pub fn demo_offers() -> Vec<Offer> {
    vec![
        Offer { id:"demo-direct",source:"mock",origin:"GZP",destination:"VKO",departure_utc_min:670,arrival_utc_min:950,mode:Mode::Flight,party_total_eur_cents:80_000,quote_age_min:1,refreshed:true },
        Offer { id:"demo-leg-a",source:"mock",origin:"GZP",destination:"IST",departure_utc_min:660,arrival_utc_min:740,mode:Mode::Flight,party_total_eur_cents:23_000,quote_age_min:3,refreshed:true },
        Offer { id:"demo-leg-b",source:"mock",origin:"IST",destination:"VKO",departure_utc_min:930,arrival_utc_min:1150,mode:Mode::Flight,party_total_eur_cents:28_000,quote_age_min:6,refreshed:true },
        Offer { id:"demo-transfer",source:"mock",origin:"GZP",destination:"AYT",departure_utc_min:600,arrival_utc_min:750,mode:Mode::Ground,party_total_eur_cents:9_000,quote_age_min:0,refreshed:true },
        Offer { id:"demo-ayt-flight",source:"mock",origin:"AYT",destination:"VKO",departure_utc_min:900,arrival_utc_min:1180,mode:Mode::Flight,party_total_eur_cents:61_000,quote_age_min:4,refreshed:true },
        // Should be rejected as impossible with the configured split-ticket buffer.
        Offer { id:"demo-too-tight",source:"mock",origin:"IST",destination:"VKO",departure_utc_min:790,arrival_utc_min:1010,mode:Mode::Flight,party_total_eur_cents:10_000,quote_age_min:1,refreshed:true },
        Offer { id:"demo-stale",source:"mock",origin:"GZP",destination:"VKO",departure_utc_min:700,arrival_utc_min:1000,mode:Mode::Flight,party_total_eur_cents:35_000,quote_age_min:120,refreshed:false },
    ]
}

pub fn demo_request() -> SearchRequest {
    SearchRequest { origin:"GZP", destination:"VKO", earliest_utc_min:600, latest_arrival_utc_min:1_400, max_offers:3, self_transfer_min:180, ground_to_flight_min:60 }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_direct_and_split_and_ground_routes() {
        let offers = demo_offers();
        let routes = search(&offers, &demo_request());
        assert!(routes.iter().any(|r| r.offer_indices == vec![0]));
        assert!(routes.iter().any(|r| r.offer_indices == vec![1, 2]));
        assert!(routes.iter().any(|r| r.offer_indices == vec![3, 4]));
    }

    #[test]
    fn blocks_unsafe_short_split_connection() {
        let offers = demo_offers();
        let routes = search(&offers, &demo_request());
        assert!(!routes.iter().any(|r| r.offer_indices == vec![1, 5]));
    }

    #[test]
    fn price_is_party_total_and_not_per_passenger() {
        let offers = demo_offers();
        let routes = search(&offers, &demo_request());
        let split = routes.iter().find(|r| r.offer_indices == vec![1, 2]).unwrap();
        assert_eq!(split.party_total_eur_cents, 51_000);
        assert_eq!(split.risk_points, 35);
    }

    #[test]
    fn stale_unverified_prices_never_trigger_alert() {
        let offers = demo_offers();
        let routes = search(&offers, &demo_request());
        let stale = routes.iter().find(|r| r.offer_indices == vec![6]).unwrap();
        let rule = AlertRule { max_party_total_eur_cents:85_000, max_risk_points:50, max_quote_age_min:15 };
        assert!(!eligible_for_alert(stale, &offers, &rule));
        let direct = routes.iter().find(|r| r.offer_indices == vec![0]).unwrap();
        assert!(eligible_for_alert(direct, &offers, &rule));
    }

    #[test]
    fn unverified_fare_cannot_dominate_verified_itinerary() {
        let candidates = vec![
            Route { offer_indices:vec![0],party_total_eur_cents:40_000,duration_min:300,risk_points:0,stale_or_unverified:true },
            Route { offer_indices:vec![1],party_total_eur_cents:70_000,duration_min:400,risk_points:12,stale_or_unverified:false },
        ];
        assert_eq!(pareto_frontier(&candidates).len(), 2);
    }

    #[test]
    fn pareto_drops_strictly_dominated_route() {
        let candidates = vec![
            Route { offer_indices:vec![0],party_total_eur_cents:50_000,duration_min:300,risk_points:0,stale_or_unverified:false },
            Route { offer_indices:vec![1],party_total_eur_cents:60_000,duration_min:400,risk_points:10,stale_or_unverified:false },
            Route { offer_indices:vec![2],party_total_eur_cents:40_000,duration_min:500,risk_points:30,stale_or_unverified:false },
        ];
        let frontier = pareto_frontier(&candidates);
        assert_eq!(frontier.len(), 2);
        assert!(!frontier.iter().any(|r| r.offer_indices == vec![1]));
    }
}
