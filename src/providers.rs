//! Provider-neutral, non-networked contract. All fixture data is fictional.
//! Live adapters must independently verify legal rights and supplier API terms.

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Capability {
    UserSearch,
    BackgroundWatch,
    CrossSourceComparison,
    QuoteStorage,
    Reprice,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Authorization {
    SyntheticFixtures,
    Pending,
    Approved { evidence_reference: String },
}

#[derive(Clone, Debug)]
pub struct ProviderPermissions {
    pub authorization: Authorization,
    pub allow_user_search: bool,
    pub allow_background_watch: bool,
    pub allow_cross_source_comparison: bool,
    pub allow_quote_storage: bool,
    pub allow_reprice: bool,
}

impl ProviderPermissions {
    /// No provider rights are assumed from public documentation alone.
    pub fn pending() -> Self {
        Self {
            authorization: Authorization::Pending,
            allow_user_search: false,
            allow_background_watch: false,
            allow_cross_source_comparison: false,
            allow_quote_storage: false,
            allow_reprice: false,
        }
    }

    pub fn mock_only() -> Self {
        Self {
            authorization: Authorization::SyntheticFixtures,
            allow_user_search: true,
            allow_background_watch: false,
            allow_cross_source_comparison: false,
            allow_quote_storage: false,
            allow_reprice: true,
        }
    }

    pub fn permits(&self, capability: Capability) -> bool {
        if matches!(self.authorization, Authorization::Pending) {
            return false;
        }
        let operation_allowed = match capability {
            Capability::UserSearch => self.allow_user_search,
            Capability::BackgroundWatch => self.allow_background_watch,
            Capability::CrossSourceComparison => self.allow_cross_source_comparison,
            Capability::QuoteStorage => self.allow_quote_storage,
            Capability::Reprice => self.allow_reprice,
        };
        operation_allowed
            && (!matches!(self.authorization, Authorization::SyntheticFixtures)
                || matches!(capability, Capability::UserSearch | Capability::Reprice))
    }

    /// No implicit right to combine results from independently contracted providers.
    pub fn permits_comparison_with(&self, other: &Self) -> bool {
        self.permits(Capability::CrossSourceComparison)
            && other.permits(Capability::CrossSourceComparison)
            && matches!(self.authorization, Authorization::Approved { .. })
            && matches!(other.authorization, Authorization::Approved { .. })
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PassengerKind {
    Adult,
    Child,
    Infant,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PassengerMix {
    pub adults: u8,
    pub children: u8,
    pub infants: u8,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ProviderQuery {
    pub origin: String,
    pub destination: String,
    /// YYYY-MM-DD. Real adapters must validate provider-specific calendar rules.
    pub departure_date: String,
    pub passengers: PassengerMix,
    pub requested_checked_bags: u8,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Money {
    pub currency: String,
    pub minor_units: u64,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct FlightSegment {
    pub departure_airport: String,
    pub arrival_airport: String,
    pub departure_utc_secs: i64,
    pub arrival_utc_secs: i64,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct NormalizedOffer {
    pub provider: String,
    pub offer_id: String,
    pub live: bool,
    /// The complete supplier ticket is one atomic offer, even if it has many segments.
    pub segments: Vec<FlightSegment>,
    pub passengers: PassengerMix,
    pub included_checked_bags: u8,
    pub party_total: Money,
    pub observed_at_utc_secs: i64,
    pub expires_at_utc_secs: i64,
    pub was_repriced: bool,
}

impl NormalizedOffer {
    pub fn is_valid(&self) -> bool {
        let airports = |code: &str| code.len() == 3 && code.bytes().all(|c| c.is_ascii_uppercase());
        let currency = &self.party_total.currency;
        if self.segments.is_empty()
            || self.provider.is_empty()
            || self.offer_id.is_empty()
            || currency.len() != 3
            || !currency.bytes().all(|c| c.is_ascii_uppercase())
            || self.expires_at_utc_secs <= self.observed_at_utc_secs
        {
            return false;
        }
        for (index, segment) in self.segments.iter().enumerate() {
            if !airports(&segment.departure_airport)
                || !airports(&segment.arrival_airport)
                || segment.arrival_utc_secs <= segment.departure_utc_secs
            {
                return false;
            }
            if index > 0 {
                let prior = &self.segments[index - 1];
                if prior.arrival_airport != segment.departure_airport
                    || prior.arrival_utc_secs > segment.departure_utc_secs
                {
                    return false;
                }
            }
        }
        true
    }

    pub fn is_expired(&self, now_utc_secs: i64) -> bool {
        now_utc_secs >= self.expires_at_utc_secs
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ProviderError {
    Unauthorized(Capability),
    InvalidQuery,
    UnknownOffer,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum RepriceOutcome {
    /// Refreshed supplier amount, not a promise that booking will succeed.
    SamePrice { latest: Money, checked_at_utc_secs: i64 },
    PriceChanged { latest: Money, checked_at_utc_secs: i64 },
    Expired,
    Unavailable,
}

pub trait FlightProvider {
    fn provider_name(&self) -> &str;
    fn permissions(&self) -> ProviderPermissions;
    fn search(&self, query: &ProviderQuery, now_utc_secs: i64)
        -> Result<Vec<NormalizedOffer>, ProviderError>;
    fn reprice(&self, offer: &NormalizedOffer, now_utc_secs: i64)
        -> Result<RepriceOutcome, ProviderError>;
}

/// Synthetic local fixture; never returns live inventory or external purchase links.
pub struct MockProvider;

impl FlightProvider for MockProvider {
    fn provider_name(&self) -> &str {
        "mock"
    }

    fn permissions(&self) -> ProviderPermissions {
        ProviderPermissions::mock_only()
    }

    fn search(
        &self,
        query: &ProviderQuery,
        now_utc_secs: i64,
    ) -> Result<Vec<NormalizedOffer>, ProviderError> {
        if !self.permissions().permits(Capability::UserSearch) {
            return Err(ProviderError::Unauthorized(Capability::UserSearch));
        }
        let is_iata = |code: &str| code.len() == 3 && code.bytes().all(|c| c.is_ascii_uppercase());
        let count = u16::from(query.passengers.adults)
            + u16::from(query.passengers.children)
            + u16::from(query.passengers.infants);
        if !is_iata(&query.origin)
            || !is_iata(&query.destination)
            || query.origin == query.destination
            || query.passengers.adults == 0
            || count == 0
            || count > 9
            || query.departure_date.len() != 10
            || !query.departure_date.is_ascii()
        {
            return Err(ProviderError::InvalidQuery);
        }
        if query.origin != "GZP" || query.destination != "VKO" {
            return Ok(Vec::new());
        }

        let make_offer = |id: &str, segments: Vec<FlightSegment>, minor_units: u64| {
            NormalizedOffer {
                provider: "mock".into(),
                offer_id: id.into(),
                live: false,
                segments,
                passengers: query.passengers.clone(),
                included_checked_bags: query.requested_checked_bags,
                party_total: Money { currency: "EUR".into(), minor_units },
                observed_at_utc_secs: now_utc_secs,
                expires_at_utc_secs: now_utc_secs + 900,
                was_repriced: false,
            }
        };

        // These times are offsets on a synthetic clock, not airline schedules.
        let seg = |from: &str, to: &str, depart: i64, arrive: i64| FlightSegment {
            departure_airport: from.into(),
            arrival_airport: to.into(),
            departure_utc_secs: now_utc_secs + depart,
            arrival_utc_secs: now_utc_secs + arrive,
        };
        Ok(vec![
            make_offer("mock-direct", vec![seg("GZP", "VKO", 3600, 18_000)], 76_500),
            make_offer("mock-connecting-single-ticket",
                vec![seg("GZP", "IST", 1800, 5400), seg("IST", "VKO", 11_400, 23_400)],
                64_500),
            make_offer("mock-price-changed", vec![seg("GZP", "VKO", 3600, 20_000)], 55_000),
        ])
    }

    fn reprice(
        &self,
        offer: &NormalizedOffer,
        now_utc_secs: i64,
    ) -> Result<RepriceOutcome, ProviderError> {
        if !self.permissions().permits(Capability::Reprice) {
            return Err(ProviderError::Unauthorized(Capability::Reprice));
        }
        if offer.provider != self.provider_name() || offer.live {
            return Err(ProviderError::UnknownOffer);
        }
        if offer.is_expired(now_utc_secs) {
            return Ok(RepriceOutcome::Expired);
        }
        match offer.offer_id.as_str() {
            "mock-direct" | "mock-connecting-single-ticket" => Ok(RepriceOutcome::SamePrice {
                latest: offer.party_total.clone(),
                checked_at_utc_secs: now_utc_secs,
            }),
            "mock-price-changed" => Ok(RepriceOutcome::PriceChanged {
                latest: Money { currency: "EUR".into(), minor_units: 61_000 },
                checked_at_utc_secs: now_utc_secs,
            }),
            "mock-unavailable" => Ok(RepriceOutcome::Unavailable),
            _ => Err(ProviderError::UnknownOffer),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn query() -> ProviderQuery {
        ProviderQuery {
            origin: "GZP".into(), destination: "VKO".into(),
            departure_date: "2027-01-15".into(),
            passengers: PassengerMix { adults: 2, children: 2, infants: 0 },
            requested_checked_bags: 2,
        }
    }

    #[test]
    fn pending_provider_denies_everything() {
        let policy = ProviderPermissions::pending();
        for cap in [Capability::UserSearch, Capability::BackgroundWatch,
            Capability::CrossSourceComparison, Capability::QuoteStorage, Capability::Reprice] {
            assert!(!policy.permits(cap));
        }
    }

    #[test]
    fn mock_never_authorizes_background_watch_or_cross_source() {
        let policy = MockProvider.permissions();
        assert!(policy.permits(Capability::UserSearch));
        assert!(!policy.permits(Capability::BackgroundWatch));
        assert!(!policy.permits(Capability::CrossSourceComparison));
        assert!(!policy.permits_comparison_with(&policy));
    }

    #[test]
    fn mock_offers_are_valid_and_party_priced() {
        let offers = MockProvider.search(&query(), 1_800_000_000).unwrap();
        assert_eq!(offers.len(), 3);
        assert!(offers.iter().all(|offer| !offer.live && !offer.was_repriced));
        assert!(offers.iter().all(NormalizedOffer::is_valid));
        assert_eq!(offers[1].segments.len(), 2);
        assert_eq!(offers[1].party_total.minor_units, 64_500);
        assert_eq!(offers[1].passengers.children, 2);
        assert_eq!(offers[1].included_checked_bags, 2);
    }

    #[test]
    fn reprice_has_same_changed_and_expired_outcomes() {
        let now = 1_800_000_000;
        let offers = MockProvider.search(&query(), now).unwrap();
        assert!(matches!(MockProvider.reprice(&offers[0], now + 60).unwrap(),
            RepriceOutcome::SamePrice { .. }));
        assert!(matches!(MockProvider.reprice(&offers[2], now + 60).unwrap(),
            RepriceOutcome::PriceChanged { latest: Money { minor_units: 61_000, .. }, .. }));
        assert_eq!(MockProvider.reprice(&offers[1], now + 901).unwrap(),
            RepriceOutcome::Expired);
    }

    #[test]
    fn query_rejects_invalid_airports_and_zero_adults() {
        let mut request = query();
        request.origin = "invalid".into();
        assert_eq!(MockProvider.search(&request, 1).unwrap_err(), ProviderError::InvalidQuery);
        request = query();
        request.passengers.adults = 0;
        assert_eq!(MockProvider.search(&request, 1).unwrap_err(), ProviderError::InvalidQuery);
    }
}
