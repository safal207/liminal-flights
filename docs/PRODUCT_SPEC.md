# Liminal Flights — Product and architecture draft (2026-11-11)

## Positioning

"Find a flight you can actually book, with an explanation of trade-offs and timely alerts." Compete on family-sized exact total, traceable quotes, and realistic transfers rather than merely declaring that we are faster than Google Flights.

## First customer

A family or price-sensitive traveler departing from secondary airports who can flex dates/airports but needs honest transfers, baggage inclusions, and reliable alerts. Pilot routes: GZP/AYT → Moscow airports; later bidirectional and worldwide corridors.

## Journey

1. Enter origin city/airports, destination city/airports, age groups, exact dates +/-N days, luggage and constraints (night flights, airport changes, connection tolerance).
2. Show last-seen indicative options quickly, clearly tagged "estimate / observed at ...", never confused with bookable fares.
3. Run approved real-time searches asynchronously via adapters; progressively update cards, rankings, provider coverage and timestamp.
4. Offer 3 explainable views: cheapest full-party total, best balance, fastest / fewest risks.
5. Reprice a selected offer at the source before redirect or booking. Do not claim an offer is guaranteed: availability is ultimately determined by provider.
6. Subscribe to flight watch, define threshold and preferences; push only on material, reverified change and within notification consent policy.

## Data plane vs causal plane

Data plane: official supplier offers, airline schedules, terminal/ground transfers, route graph, prices, currencies, checked bags, baggage transfer conditions, passenger inventory and provider booking URLs where licensed.

Causal plane: search intent, observed quote and its timestamp, comparison baseline, hypothesized price driver (never a proven cause without independent evidence), candidate graph path, rejected alternatives, evidence quality, reprice response, user notification. These records form a deterministic explanation trail.

Suggested domain events:
- `search.requested`: request_id, passengers, preferences, consent
- `source.quote.observed`: quote_id, provider, source_timestamp, observed_timestamp, quote_status, expiry
- `route.candidate.computed`: parent quote_ids, routing_profile, constraint_verdicts
- `offer.repriced`: original quote_id, updated_price, availability_status
- `recommendation.emitted`: rationale, alternatives, evidence_verdict
- `alert.sent`: matched_rule_id, dedupe_key, deliverability, quote_ref

CML can later audit the decision lineage; LTP/T-Trace can replay reasons; LiminalDB can persist event history and knowledge-time/valid-time. None should be assumed certified for production just because they exist in the public GitHub repos.

## Algorithms

Real graph vertices are time-indexed airports with optional terminal and baggage/entry states. Edges include flights, ground transfers, and waits. A multi-segment same-ticket provider offer is **atomic** or modeled as a hyperedge: full fare and protected transfer conditions cannot be recovered by adding leg prices.

Use indexed multi-criteria label-setting / label-correcting and Pareto pruning, upper bounds on stops/travel days/connection time, explicit self-transfer policy, proper minimum connection times, time zones / daylight savings, and dynamic passenger/fare constraints. Validate schedules, protected connection guarantees and visa rules with authoritative providers; if unknown, flag and do not mark "safe".

Latency strategy: cached indicative snapshot + concurrently refreshed priced offers + streaming updates + exact repricing upon selection. Rust helps control CPU and memory costs, but upstream API latency, quotas and quality dominate end-to-end speed.

## Provider limitations and due diligence

- Duffel: Offers expire and may reprice; its doc recommends retrieving the selected offer before buying. Confirm cost, geographical coverage and purchase model.
- Skyscanner: Live Prices and Refresh APIs have distinct workflows, data freshness and partnership access. Confirm access/usage rights.
- Travelpayouts/Aviasales: Search API rules restrict user initiated searches, automated harvesting and combining with other metasearch APIs. Never build a monitoring crawler from this API without explicit written authorization. Data API is cached 2–7 days and not appropriate to assert live availability.
- IATA NDC is a distribution data standard, not a free global flight-price feed.
- Supplier permission precedes any long-lived cache, cross-source comparison or proactive price watcher.

## Acceptance gates

Search quality: % of suggestions still bookable at landing, difference between listed and final all-in party total, route coverage vs a benchmark, valid alternatives found, and blocked unsafe self-transfers.

Speed: median/p95 time to first result, median/p95 time to fully priced result, upstream contribution, compute budget/request.

Alerts: verified actionable notification rate, deduplication, false positive count, opt-out rate, successful click-to-book rate; no promotional claims of "lowest ever" without evidence.

Operations: supplier quota/budget, retries with exponential backoff, job cancellation, privacy/retention, trace completeness, monitoring and error budgets.

## Launch decision

Start with one concrete vertical and one legally authorized provider with repricing; measure 30–50 real purchase-intent searches and compare 3 baselines; add data sources only under contracts. Expand globally once the exact-price mismatch and inventory coverage gates are met.

## Source documentation

- Google Flights: https://support.google.com/travel/answer/7664728
- KAYAK: https://www.kayak.com/c/help/pricing/
- Duffel: https://duffel.com/docs/api/v2/offers
- Skyscanner refresh: https://developers.skyscanner.net/docs/flights-live-prices/refresh-prices
- Travelpayouts rules: https://support.travelpayouts.com/hc/en-us/articles/34788165535250-Search-API-usage-rules
- IATA NDC: https://www.iata.org/en/programs/airline-distribution/retailing/ndc/
