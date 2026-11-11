# MVP backlog — ordered by dependencies

## P0 — Source access and core validity

- [ ] **LF-001** Obtain terms and developer access to one provider permitting our intended comparison and repricing behavior. Record coverage and API quota costs.
- [ ] **LF-002** Define normalized itinerary/offer schema including families, baggage, currency, fare bundle, source timestamps, and supplier-specific limitations.
- [ ] **LF-003** Implement first Rust adapter behind a feature flag, using mocks in CI and no credentials in code.
- [ ] **LF-004** Reprice a chosen offer and compare all-in total with the original quote; do not mark price as verified until supplier confirms.
- [ ] **LF-005** Define a transfer/visa policy: explicit Unknown and Blocked outcomes; only verified conditions may be called Safe.

## P1 — Algorithm and user-facing evaluation

- [ ] **LF-006** Convert bounded DFS to indexed time-expanded search with Pareto pruning and multi-ticket safeguards.
- [ ] **LF-007** Add graph search property tests, edge cases, currency, time zones and multi-passenger coverage.
- [ ] **LF-008** Build responsive PWA: flexible airports, families, luggage, three recommendation views, quote freshness.
- [ ] **LF-009** Decision trace: request→quotes→candidate→explanation, with replay checks; optional integrations with LTP/CML.

## P2 — Watch, privacy and business validation

- [ ] **LF-010** Consent-based Flight Watch: supplier-approved frequency, quota limits, dedupe, verified alerts, unsubscribe.
- [ ] **LF-011** Web Push registration and delivery including mobile permission UX and browser fallbacks.
- [ ] **LF-012** Comparative benchmark: 30–50 high-intent searches versus chosen baselines; measure click-to-book price mismatch, valid new alternatives, latency (p50/p95) and alert precision.
- [ ] **LF-013** Review affiliate distribution, privacy disclosures, service terms, GDPR/Türkiye KVKK applicability and international travel-data conditions before launch.

## Go/no-go

- Provider access grants our planned use including caching/rechecks/alerts, or affected functions remain disabled.
- A selected fare is repriced on the supplier path, and availability errors are truthfully shown.
- No unsafe self-transfer is silently labeled protected; unknown visa/document conditions are explicitly not verified.
- CI passes, source secrets are absent, and performance claims are backed by measurements.
- Quantitative acceptance thresholds are set from the first pilot baseline, not invented in advance.
