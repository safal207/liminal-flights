# Liminal Flights Web — mobile-first frontend demo

No build step and no external runtime dependencies. Open with any static HTTP server:

```sh
python3 -m http.server 8080 --directory web
# http://localhost:8080
```

The website ships **only synthetic routes** for GZP→MOW and AYT→MOW. All times, prices, airline offers, all-in passenger amounts and luggage assumptions are fictional. The frontend never requests live flight inventory, accepts payments, or claims to send price alerts. Round-trips and unlisted corridors show an honest empty state.

## UI priorities

- Warm, calm visual language; no large blocking hero art on mobile.
- A single search form with grouped airport inputs, date, passenger stepper, baggage and direct CTA.
- Large tap targets (44px minimum on mobile), visible keyboard focus, predictable state and reduced-motion support.
- Three ranking modes, price for the **full passenger group**, honest self-transfer warnings.
- Local-only saved searches; no false promise of push or commercial bookings.
- No external fonts, runtime packages, tracking, or image dependencies; maintain static asset URLs relative to `web/` for GitHub Pages subpath compatibility.

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
