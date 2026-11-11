# Architecture v0.1 — Liminal Flights

## Principle: route graph is not a causal graph

The **offer route graph** searches purchasable, time-constrained connections. The **causal decision graph** records why an itinerary was ranked or rejected and what evidence supports that recommendation. A price difference alone is correlation, not a demonstrated cause.

```text
Passenger intent → Rust search gateway → provider adapters (permission-gated)
                                     ↓
                            quote/event normalization
                                     ↓
                     time-dependent offer route graph
                                     ↓
                       constraint + Pareto ranking
                                     ↓
                       results + explanations + reprice
                                     ↓
                       consented alert / partner checkout
```

### Runtime

- **Rust** as the main search and integration language. Use Tokio and Axum for a future concurrent API layer. The present MVP is a standalone no-dependency Rust crate.
- **Offers** are atomic. Do not split a multi-leg protected fare and infer a synthetic price for a leg. A multi-leg ticket may be represented as an offer/hyperedge with the supplier's actual fare and itinerary.
- **Graph algorithm**: bounded DFS for explainability in v0.1; later indexed time-expanded graph + multicriteria label-setting and policy-aware Pareto pruning. Record algorithm version and seed/input hash for reproducible decisions.
- **Data storage**: start with Postgres and Redis after real feed access. Use LiminalDB experimentally for auditable transition logs, not as an assumed production dependency.
- **Evidence interfaces**: T-Trace and LTP-style replay for deterministic decision traces; CML-style ancestry validation for recommendations and notification dispatches.
- **Safety**: never call a self-transfer protected without supplier proof; never assert visa or document eligibility from heuristic data; distinguish observed quote from revalidated bookable offer.
- **Alerts**: opt-in only; respect terms, quotas, quiet hours and dedupe; do not send stale, unverifiable or unconfirmed promotion claims.

## Data contracts (future)

Required quote fields include `provider`, `provider_offer_id`, `observed_at`, `supplier_updated_at?`, `currency`, `total_party_price_minor`, `party_composition`, `baggage`, `service_inclusions`, `departure_at`, `arrival_at`, `ticketing_group`, `refreshed_at?`, `expires_at?`, `source_permissions`, `reprice_verdict`.

### Evidence chain

`search.requested` → `quote.observed` → `candidate.computed` → `constraint.checked` → `recommendation.emitted` → optional `offer.repriced` → optional `alert.sent`.

The event trail documents the source and reasoning. It does **not** prove causality of airline pricing unless a separate identification strategy and evidence support that conclusion.

## Nonclaims

No live fares or ticket inventory, no provider contracts, no verified airport-transfer/visa safety, no guaranteed price or confirmed speed improvement, no production audit of protocols. Do not deploy as a customer-facing booking engine until data and legal gates are passed.
