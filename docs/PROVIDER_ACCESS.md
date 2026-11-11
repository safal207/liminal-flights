# Provider access and flight-offer data rights — evaluation, 2026-11-11

## Decision
**Provisional developer target: Duffel test mode**, not production/live launch.
No credentials, supplier agreements, background price-monitoring rights, geographic coverage
or approval have been acquired or verified for this repository. MockProvider is
the only implemented adapter and returns fictional offers exclusively.

## Provider matrix

| Source | User-initiated live search | Reprice workflow | Server-side recurring watch | Cross-source price comparison | Assessment |
| --- | --- | --- | --- | --- | --- |
| Offline MockProvider | Local demo only | Simulated | Disabled | Disabled | **GO for development only** |
| Duffel | API documented; **our live access unverified** | Get selected offer / pricing documented; **contract needed** | **Unknown; written approval required** | **Unknown; terms review required** | **GO to sandbox evaluation; NO-GO live** |
| Skyscanner Live Prices | Commercial approval required | Refresh itinerary documented | **Unknown; written approval required** | **Unknown; terms review required** | **NO-GO without approved commercial agreement** |
| Travelpayouts Search API | Access approval + user-initiated requests only | Its own booking flow requirements | **Prohibited automatic harvesting / queries for prices** | **Prohibits combining with other metasearch APIs** | **NO-GO for planned multi-source Flight Watch** |

**Unknown is not permitted.** The permission model is deny-by-default until a specific
contract is reviewed. Public documentation of an endpoint is not permission to use
it in production or to collect historical prices.

## Official references reviewed

- Duffel test mode: https://duffel.com/docs/api/overview/test-mode
  - Test tokens are separate from live; sandbox routes/prices may be unrealistic.
- Duffel Offers: https://duffel.com/docs/api/offers
  - Offers expire; price and availability may change.
  - Re-fetching an offer does not guarantee availability when booking.
  - Extra services and payment methods may affect final amount.
- Skyscanner access: https://www.partners.skyscanner.net/contact/travel-api
  - Commercial selection; currently describes established-audience eligibility.
- Skyscanner Live Prices: https://developers.skyscanner.net/docs/flights-live-prices/overview
  - Search create/poll can progressively deliver results.
- Skyscanner refresh: https://developers.skyscanner.net/docs/flights-live-prices/refresh-prices
  - Itinerary refresh flow.
- Travelpayouts restrictions: https://support.travelpayouts.com/hc/en-us/articles/34788165535250-Search-API-usage-rules
  - User-initiated searches; automatic scraping / mixing metasearch APIs restricted.

## Approval questions to resolve before live traffic

1. Can this exact product display, compare and rank provider fares alongside other data sources?
2. Are quote storage, historical price analytics and re-polling allowed? For how long?
3. Are background notifications permitted, with what request budget and conversion conditions?
4. Does the service support 2 adults + 2 children and checked-baggage inclusions in a single priced offer?
5. Which carriers/routes are supplied for GZP, AYT, VKO, SVO, DME and ZIA, and which markets are restricted?
6. What is the exact handoff/checkout agreement? What fees or financial responsibilities apply?
7. How are cancellations, API errors, expiry, payment fees, refunds and stale prices handled?
8. Is storing hashed decision evidence and trace data allowed, and how long may it be retained?

## Implementation guardrails

- API keys must be server-side secrets, never committed to this repository or browser code.
- Test-mode offers remain explicitly **fictional/non-bookable**; their simulated
  reprice outcome is not proof of booking.
- Supplier segments within one ticket are atomic and must not be priced separately.
- Each offer carries provider scope, party composition, baggage, currency, UTC timestamps,
  an expiry and a reprice flag. Time/price validation is separate from legal and transfer safety.
- Alerts remain disabled until explicit permission, independent repricing, deduplication,
  consent, unsubscribe and quiet-hours tests pass.
- Re-evaluate references and signed terms when onboarding: external rules can change.

## Next gate

- Register Duffel developer sandbox if the project owner chooses.
- Put the sandbox API token in a secure secret manager (not chat or git).
- Implement an opt-in sandbox HTTP adapter, contract fixtures and one end-to-end
  offer search → get offer → changed-price test before requesting live production access.
- Retain **NO-GO for real offers and push notifications** until supplier permission is documented.
