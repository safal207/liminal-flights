# Liminal Flights — Rust Flight Graph MVP

A **small, offline proof of concept** for explainable flight search using time-constrained graph traversal, multi-objective Pareto ranking, and evidence-aware alerts.

> **Not a live flight aggregator.** Every itinerary, time, and price in the demo is fictional; there are no airline API integrations, contracts, booking links, authentic flight schedules, verified visa rules, or tickets for sale. This MVP is not flight advice or a production-ready travel service.

**Repository state:** prototype only, not connected to a live provider. No public licensing decision has been made; do not assume permission to redistribute this source.

## Run

Install the Rust toolchain and run:

```sh
cargo generate-lockfile
cargo run --locked
cargo test --locked
cargo fmt --all -- --check # Optional style check; not yet CI-gated
cargo clippy --all-targets --locked -- -D warnings
```

The `cargo test` suite checks graph reachability, self-transfer buffer, party-total pricing, stale quote notification suppression, and Pareto dominance.

## Technical decisions

- A purchasable provider **offer** is an atomic edge; do not fabricate a price for a single segment of a protected multi-leg ticket.
- Split tickets are only combined when time constraints are satisfied. They have a self-transfer penalty and must not be called protected connections.
- Ground transfer is its own priced edge and has a separate time buffer.
- Every quoted fare is a **party total** including selected luggage/services, not a per-adult estimate multiplied by group size.
- `risk_points` is a ranking heuristic, **not** a calibrated risk probability or legal/visa assessment.
- Quote freshness and successful reprice are **not** a booking guarantee. Confirmation requires a provider-specific offer refresh on the actual purchase path.
- The frontier is Pareto-based instead of a single opaque price/time/risk score.
- This bounded DFS is intentionally small and easy to inspect; production needs time-expanded indexing + multicriteria label setting + offer/hyperedge constraints.
- A real Flight Watch worker needs consent, rate-limit-aware permitted API access, reprice, deduplication, quiet hours and correct Web Push handling.


## Provider contract (PR / development)

The Rust module [src/providers.rs](src/providers.rs) models source permissions,
normalized **atomic** single-ticket offers, party totals, quote expiry and an
offline mock reprice flow. This is **not** a live API adapter, booking engine or
approved price-monitoring integration. Mock fixtures are explicitly fictional.

- [Provider licensing / access matrix](docs/PROVIDER_ACCESS.md) — Duffel
  sandbox is the provisional developer target; commercial and background
  monitoring rights are still unverified.
- Search and refresh are different operations. Even a refreshed supplier
  offer is not a guarantee of successful booking.
- Without explicit supplier permissions, **no live monitoring, quote
  storage or cross-provider fare combination is enabled**.

## Roadmap

**Pilot:** GZP/AYT → Moscow (all destination airports), 1–4+ passengers, flexible dates, baggage, safe transfers, configurable alerts; expand geographically after measuring results.

**Phase 1:** source-contract review, provider adapters behind feature flags; stable schema with quote timestamps, fare/ancillary restrictions, availability and no unsupported price certainty.

**Phase 2:** indexed time-dependent path search in Rust; 2–3 comparison modes; streaming partial results with progressive provider updates and results persistence.

**Phase 3:** Price Watch with strict provider-authorized frequency + PWA push; event ledger and explanation receipts; backtest alerts using replayed price observations.

**Phase 4:** consumer experience metrics, affiliate commercialization with transparent placement, broader distribution partnerships.

See `docs/PRODUCT_SPEC.md` for requirements, causal protocol integration and contract constraints.

## Project management

- [Architecture and protocol boundaries](docs/ARCHITECTURE.md)
- [MVP backlog and release gates](docs/BACKLOG.md)
- [Research and product specification](docs/PRODUCT_SPEC.md)

The dependency-free starter includes `Cargo.lock`. Regenerate it with `cargo generate-lockfile` if the manifest changes. The Rust code was not compiled locally in the authoring workspace. GitHub Actions now runs `cargo check`, `cargo test` and strict `cargo clippy` on each push and PR; inspect the latest run before treating the build as passing. Rustfmt is not yet enforced by CI.