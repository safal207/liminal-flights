# Liminal Flights Web — mobile-first frontend demo

No build step. Main search UI has no external runtime dependencies. The optional flight map lazily loads Leaflet 1.9.4 and browser-visible OpenStreetMap tiles **only after the user opens a route map**. An embedded geographic sketch remains available when offline or when remote maps fail. Open with any static HTTP server:

```sh
python3 -m http.server 8080 --directory web
# http://localhost:8080
```

The website ships **only synthetic routes** for GZP→MOW and AYT→MOW. All times, prices, airline offers, all-in passenger amounts and luggage assumptions are fictional. The frontend never requests live flight inventory, accepts payments, or claims to send price alerts. Round-trips and unlisted corridors show an honest empty state.

## Languages

The entire demo UI is available in **Russian (RU)**, **English (EN)** and **Turkish (TR)** via
the 44px header language switch on desktop and mobile.

- The saved preference in localStorage takes precedence; browsers configured
  for English or Turkish start in their respective language; others default to Russian.
- All static headings, input labels, ARIA labels, options, helper text, footer,
  passenger stepper and navigation are translated, including the 320px mobile header.
- Dynamically generated route cards, hypothetical fare descriptions, warnings,
  empty states, validation messages, saved route actions, price and duration
  formats are translated too; routes, dates, sort order and saved state persist
  through language changes.
- Translating interface text never changes the original fare calculation,
  demonstrates real inventory or claims availability.
- Turkish airport names, fare tags, risk descriptions and locale-specific EUR
  prices/durations are translated without altering synthetic fare arithmetic.
- No remote translation API or extra client dependencies.

Tests:

```sh
node --test web/tests/*.test.mjs
node --check web/app.js
```

## Flight map preview

Every demonstration itinerary has a **View map / На карте / Haritada gör** action.
On mobile, it opens a bottom-sheet dialog showing an approximate route and
mock stop airports. The sketch works without remote services.

The path follows a great-circle approximation between fictional example
waypoints, not the real filed airway route. **No actual aircraft position,
delays, schedules or arrival predictions are supplied.** A moving aircraft
icon is intentionally absent until verified live flight IDs and licensed
positions exist. This distinction is reflected in all three languages.

For an interactive geographic basemap, the user may open a map manually.
Leaflet 1.9.4 is pinned with SRI; raster map tiles are fetched from the
standard OSM endpoint with visible copyright attribution. Do not bulk
download, prefetch or use the community tile servers as a production SLA.
Public operation requires its own mapping provider/terms review, visible
attribution, and a contactable project owner.

See [flight tracking provider review](../docs/FLIGHT_MAP_AND_TRACKING.md).
Tests:

```sh
node --test web/tests/*.test.mjs
node --check web/flight-map.mjs
node --check web/flight-map-ui.mjs
```

## Personal journey map

The **View map / На карте / Haritada gör** action is tied to the *selected search result*, not a global flight map. It carries forward the search date and party size without treating them as a confirmed ticket or flight occurrence.

- Select **Entire route** or an individual segment; the approximate path and displayed distance update together (Leaflet if available, local SVG fallback otherwise).
- The flight-status panel explicitly says **no flight data received**, **delay unknown**, **current aircraft position unavailable**, and **last update: no data**. It never substitutes the current browser time as an observation timestamp.
- RU/EN/TR translations and 44px targets work in the map's mobile bottom sheet, with reduced-motion and offline fallback.
- The map is synthetic preview only; real monitoring requires approved source permissions and a verified flight identity. See [Flight tracking gate](../docs/FLIGHT_MAP_AND_TRACKING.md).

## UI priorities

- Warm, calm visual language; no large blocking hero art on mobile.
- A single search form with grouped airport inputs, date, passenger stepper, baggage and direct CTA.
- Large tap targets (44px minimum on mobile), visible keyboard focus, predictable state and reduced-motion support.
- Three ranking modes, price for the **full passenger group**, honest self-transfer warnings.
- Local-only saved searches; no false promise of push or commercial bookings.
- No external fonts, analytics tracking or image dependencies in the initial search page. The optional on-demand map uses Leaflet / OSM; maintain static asset URLs relative to `web/` for GitHub Pages subpath compatibility.

## Verify

```sh
node --test web/tests/core.test.mjs
node --check web/app.js
```

Manual browser smoke: mobile 320/360/390/430, desktop 768/1024/1440, 200% zoom, keyboard navigation, empty-state, passenger caps, reverse route, sorting, saving, `localStorage` disabled, reduced motion, Chromium/Firefox/WebKit if available. This MVP does **not** claim complete cross-browser coverage without runs.

## Next

- Wire the Rust engine through a dedicated API after approved supplier credentials and source rights exist.
- Keep quote model and adapter permissions server-side. No token or direct third-party API secret in the browser.
- Add browser E2E assertions to CI, live-source badges, skeleton loading and actual permitted alert subscriptions later.
