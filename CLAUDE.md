# ConstellationsWebApp — Claude Context

## Project Overview
A mobile-first Web Planetarium / real-time stargazer app. The user points their phone at the sky and the app identifies stars and constellations using GPS + device orientation sensors.

**No external API calls. No AI services. Fully offline-capable.**

## Stack
- Pure HTML/CSS/JS — no build step, no framework
- `data/stars.js` — local star catalog (RA/Dec in degrees, magnitude, constellation)
- `data/constellations.js` — constellation metadata and star-link pairs
- IndexedDB (via `db.js`) — local browser database for user observations and settings
- Served as static files (open `index.html` directly or via any static server)

## File Structure
```
ConstellationsWebApp/
├── CLAUDE.md               ← you are here
├── index.html              ← main app shell + UI
├── app.js                  ← sensor handling, astronomy math, targeting logic
├── db.js                   ← IndexedDB wrapper (observations, settings)
├── data/
│   ├── stars.js            ← ~100 named stars with RA, Dec, magnitude, constellation
│   └── constellations.js   ← 20 constellations with display name and star-link pairs
└── style.css               ← all styles extracted from inline
```

## Key Concepts

### Astronomy Math
- Input: Right Ascension (RA) and Declination (Dec) in degrees
- Convert to Altitude/Azimuth using user's GPS lat/lon + current UTC time
- Julian Date → GMST → LST → Hour Angle → Alt/Az (spherical trig)
- See `app.js → getAltAz()`

### Sensor Pipeline
1. `DeviceOrientationEvent` → compass heading (azimuth) + tilt (altitude)
2. Compare phone pointing vector to each star's computed Alt/Az
3. Match within configurable field-of-view threshold (default 10°)

### IndexedDB Schema (managed by `db.js`)
- **observations** store: `{ id, timestamp, objectName, lat, lon, az, alt, note }`
- **settings** store: `{ key, value }` — e.g. `fovDegrees`, `showMagnitudeLimit`

## Improvement Targets (next sessions)
- [ ] Canvas-based sky overlay (render star field on `<canvas>`)
- [ ] Constellation line drawing on canvas
- [ ] Observation log UI (list past sightings from IndexedDB)
- [ ] Magnitude filter (hide stars below user-set brightness limit)
- [ ] Offline PWA support (service worker + manifest)
- [ ] Night mode (deep red UI to preserve dark adaptation)
- [ ] Compass calibration helper

## What NOT to do
- Do NOT add external API calls (weather, ephemeris services, AI)
- Do NOT add npm/bundler — keep it zero-dependency static files
- Do NOT store user data anywhere except local IndexedDB/localStorage
