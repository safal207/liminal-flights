use liminal_flights::{demo_offers, demo_request, eligible_for_alert, pareto_frontier, search, AlertRule};

fn main() {
    let offers = demo_offers();
    let routes = pareto_frontier(&search(&offers, &demo_request()));
    let alert = AlertRule { max_party_total_eur_cents:85_000, max_risk_points:20, max_quote_age_min:15 };
    println!("LIMINAL FLIGHTS / OFFLINE DEMO — FICTIONAL DATA ONLY");
    for route in &routes {
        let path = route.offer_indices.iter()
            .map(|&index| offers[index].id)
            .collect::<Vec<_>>()
            .join(" -> ");
        println!(
            "EUR {:.2} | {} min | risk={} (heuristic) | alert={} | {}",
            route.party_total_eur_cents as f64 / 100.0,
            route.duration_min,
            route.risk_points,
            eligible_for_alert(route, &offers, &alert),
            path,
        );
    }
    println!("Quotes are not live, availability and visas are NOT verified.");
}
