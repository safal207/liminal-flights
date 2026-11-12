# Liminal Flights — conversion measurement and revenue gates

Status: product-demo instrumentation only. No commercial supplier agreement,
checkout, real booking, analytics collector, order confirmations or commission
ledger is connected. The website must not claim sales or profitability.

## Decision funnel (customer-facing)

1. First screen: family-focused promise; one-way only because round-trip
   mock results are not implemented. A disabled coming-soon control avoids
   the old dead-end.
2. Choose a preference: balanced / lower group total / shorter duration.
   Priority controls are synchronized with results sorting and do not
   secretly reprice a flight.
3. Search example routes: explicit DEMO and fictional fare disclaimer.
4. Compare cards: risk, group total, bag count, route preview; card ranks
   (1-based positions) are stored for per-slot measurement.
5. Select example: visually selected card plus a summary; explicitly not a
   booking and no fabricated checkout.
6. Share example: a filtered route URL (no UTM/auth carry-over), optional
   native share or clipboard. Result remains synthetic.
7. Future: partner handoff, verified booking, payable commission — these
   need licensed inventory, partner links and a server-side reconciliation.

## Event contract (v1)

The static GitHub Pages site stores at most 180 **local session** events in
sessionStorage, falling back to memory when storage is unavailable. This is
privacy-conservative prototyping, NOT aggregated analytics across visitors.

| Event | Trigger | Detail | Data source |
| --- | --- | --- | --- |
| landing_view | Page load | timestamp, permitted UTMs | local browser |
| priority_selected | Intent chip/sort | priority | local browser |
| search_submitted | Valid explicit search | search_index, IATA origin/destination, trip, group size, bags, priority | local browser |
| search_invalid | Invalid/unsupported search | coarse reason | local browser |
| offer_impression | Card reaches 50% visible after a real search, de-duplicated per search+rank | offer_id, rank, route, priority, search_index | IntersectionObserver |
| offer_selected | Explicit Choose sample button | offer_id, displayed rank, route, priority, search_index | local browser |
| map_opened | Open card's map | offer_id, rank, search_index | local browser |
| offer_saved | Save example (not removal) | offer_id, search_index | local browser |
| offer_shared | Successful native share or clipboard write | offer_id, search_index | local browser |

UTM allowlist: utm_source, utm_medium, utm_campaign, utm_content. Values limited
to 80 ASCII characters [A-Za-z0-9_.:-] — no untrusted arbitrary URL, tokens,
names, email addresses, payment data, IP addresses or long-term visitor IDs.

Local session QA: open the site with ?lf_debug=1 appended to the normal URL,
perform sample actions and export a JSON event report. It only describes
**that browser tab**. It is not a secure admin dashboard.

Never send partner_outbound, booking_confirmed, commission_confirmed or
booking_refunded from untrusted browser code. The client event validator
blocks those names. If the future partner allows conversion postbacks and
order processing, implement these in a separate authenticated backend with
idempotency, authorization, contract and privacy review before claiming
real conversions.

## Measuring paid orders and profit (future server model)

Recommended minimum keys:
- Search event: session/referrer campaign, departure/arrival, displayed offer
  order and time, sort priority.
- Partner outbound: **server-issued** opaque click_id, offer ID, placement
  position, approved partner, permitted attribution, time.
- Partner booking: partner_order_id (unique), click_id, gross basket
  currency, status, verified_at, cancellation/refund adjustment.
- Commission ledger: partner_order_id, agreed affiliate basis, payable
  commission in original currency, FX treatment, approved timestamp,
  reversal and actual settlement.
- Costs: paid channel spend, provider/API costs, tile hosting,
  chargebacks, support and taxes (the chosen profitability definition
  must say exactly which costs are included).

Recommended KPIs per **1,000 offer impressions**, by route and ranked slot:

- CTR: verified partner outbound clicks / visible offer impressions.
- Selection rate: offer_selected / visible offer impressions.
- Confirmed-booking CVR: confirmed partner bookings / verified outbound clicks.
- Commission per order: net payable commission / confirmed bookings.
- Net commission per 1,000 impressions:
  (approved commission - reversals) / visible impressions * 1000.
- Contribution: approved commission - reversals - attributable marketing
  - attributed API and transaction costs. Net profit needs all additional
  company operating costs and tax rules.

Distinguish:
- Partner gross booking value (GMV): belongs to the ticket seller, not
  necessarily our revenue.
- Commission booked/payable vs actually settled, with cancellations.
- Attribution unknown/missing: report separately. Never silently drop.
- Rank biases: top-position impression/CTR is not evidence of quality
  or independent causality. Compare per-1,000 impressions and randomized
  experiments; never silently prioritize larger affiliate payouts above
  customer outcome. Clearly mark paid placements.

No booking or commission values should appear in the public product or a
site-wide dashboard before trusted partner evidence exists.

## Next commercial gate

1. Obtain written supplier affiliate/API rights and market coverage.
2. Implement approved outbound partner links via a server-issued click_id.
3. Add consent/privacy and retention policies, a consented product-analytics
   collector or another approved aggregate measurement route.
4. Validate conversion postbacks vs real partner exports (idempotent,
   refunds, multi-currency, fraud and order identity).
5. Only then enable commission reports and controlled upsell tests.
