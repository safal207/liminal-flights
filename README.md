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
cargo fmt --all -- --check
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

The dependency-free starter includes `Cargo.lock`. Regenerate it with `cargo generate-lockfile` if the manifest changes. The Rust code has not been compiled or verified in this workspace; GitHub Actions will be the first executable gate once the repository is published.