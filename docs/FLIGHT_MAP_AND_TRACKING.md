# Flight map and tracking architecture — evaluation (2026-11-11)

## Product objective

A calm map that answers three different questions without conflating evidence:

1. Where might my chosen route go? **Approximate geographic preview**.
2. Is this specific scheduled flight on time? **Airline/airport status data**.
3. Where is the aircraft currently? **Licensed aircraft position data**.

These are separate APIs, expectations and levels of certainty. A search offer,
flight number, airframe, callsign and scheduled instance may change or need
supplier-specific correlation. Never assume a search result includes a live
tracking identifier.

## Current implementation

- web/flight-map.mjs: six synthetic itinerary paths with airport coordinates.
- Spherical great-circle interpolation for a geographically approximate line;
  NOT the real airspace routing, flight plan, waypoints or ADS-B track.
- web/flight-map-ui.mjs: card-to-map dialog; accessible mobile bottom sheet;
  visible DEMO / NOT LIVE disclosures; stop labels and self-transfer warning.
- Instant SVG sketch requiring no remote tiles. Optional Leaflet 1.9.4 + OSM
  raster tiles load only after a user opens the map.
- No simulated moving plane: a floating plane could be misread as live GPS.
- Mock delays and arrival forecasts deliberately absent.
- RU/EN/TR labels, fallback states and source-quality disclosures.
- No keys, web scraping, telemetry or background location requests.

## Map hosting and attribution

Tile policy: https://operations.osmfoundation.org/policies/tiles/

The public OSMF servers are not a free commercial map hosting SLA. Browser
tiles must retain attribution, honest Referer, caching and no-prefetch limits.
An explicit map click loads only the visible route area; production needs a
suitable contracted tile host, operator contact, quota and spend controls.
The SVG fallback remains functional if a tile endpoint is unavailable.

## Flight tracking provider candidates

| Provider | Capability / documented restriction | Decision |
| --- | --- | --- |
| **FlightAware AeroAPI** | On-demand flight position, track, route and status. Commercial B2C rights begin with Standard; currently published minimum **$100/month**, plus usage fees. Personal is not a product license. | Preferred for commercial status/position due diligence; not connected |
| **Flightradar24 Flight Data API** | Live flight tracking and historical summaries. FR24 states live endpoints only show an aircraft while actually tracked, not a future scheduled flight. Contract and data redistribution rights must be confirmed. | Alternative / coverage comparison; not connected |
| **OpenSky Network** | Research API supplies state vectors and tracks, but not airline schedules or delay status. Operational REST and commercial use require prior written approval. | NO-GO as an unlicensed free live backend |
| **Airline/airport status sources** | Delays, gates, cancellations and terminals require a separate status source; missing ADS-B is not evidence of a delay. | Required for operational delay claims |

References:
- FlightAware AeroAPI: https://www.flightaware.com/commercial/aeroapi/
- FR24 API FAQ: https://fr24api.flightradar24.com/docs/faq
- OpenSky terms: https://opensky-network.org/about/terms-of-use
- OpenSky data scope: https://openskynetwork.github.io/opensky-api/

Pricing, terms and allowed uses may change; obtain a signed or explicit written
agreement before integrating a commercial provider.

## Future typed data contract (server-side only)

- flight_id: supplier-scoped stable identifier, operating carrier, marketed
  flight number, flight date and departure/arrival airports.
- offer_id and flight_id are different. A multi-flight itinerary needs a
  separate flight occurrence and possibly a different aircraft for each leg.
- scheduled_departure_utc, scheduled_arrival_utc, actual_departure_utc?,
  estimated_arrival_utc?, status, delay_minutes?.
- position: nullable latitude/longitude, altitude, heading, groundspeed,
  aircraft identity, observed_at_utc, source, last_received_at.
- track: provider-authorized past positions and separate *estimated* future
  path; never connect these into one unmarked path.
- source_rights, observed_age, provider_coverage, conflict_verdict,
  status_reason and explicit disclaimer.

## Evidence thresholds

- **Approximate / demo**: airport points and fictional demo stops; never
  claim current location.
- **Scheduled**: confirmed future flight; still no location until tracking.
- **Live**: validated flight occurrence and permitted source position with
  timestamp and stale flag; live does not mean zero latency.
- **Last seen / coverage gap**: age exceeds provider-specific threshold;
  freeze the position and show age, not "still here."
- **Delayed/cancelled**: confirmed flight-status verdict, not guessed
  from a missing position ping.
- **Landed**: confirmed completed-flight status, not inferred only from
  proximity to an airport.

## UX and QA gates

- Open the map with one click, close with large target/Escape, return focus,
  contain scrolling and respect mobile safe areas.
- Clearly label mock transit points, separate tickets, airspace uncertainty.
- Follow-flight subscription must be opt-in, without permanent polling.
- Report last observed timestamp, provider attribution and coverage.
- Resilient empty, error, offline and coverage-gap states for RU/EN/TR.
- API rate-limit/cost budget and tenant isolation for paid tracking.
- Accessible text route description independent of map visual.
- Browser smoke: Android Chrome, iOS Safari, Firefox, Edge; reduced-motion,
  320px mobile and 200% zoom.
- Check real provider IDs and geographic/redistribution rights before live.
