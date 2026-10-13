## CheapAssGas city outlook

A working mobile dashboard for actual US metro gas averages, weekly history, market and news signals, and three daily projected price paths on an interactive geographic map.

### Run locally

Use Node.js 22 or later. No dependency installation is required:

```powershell
npm run dev
```

Open `http://127.0.0.1:4173`. Run `npm test` for data-integrity checks and `npm run build` to create the standalone Cloudflare Worker in `dist/server/index.js`.

### Data status

There is no sample-price mode. Source failures are reported; unavailable or stale prices are never replaced with invented values.

- **Prices:** AAA public daily state and metro tables. All states can be selected, with their currently published metros. City/ZIP search and browser geolocation resolve a matching or nearby known metro, otherwise explicitly use a state average. This is area-level coverage, not individual station quotes.
- **History:** actual EIA weekly regular gasoline observations. Prefer a city series, then its state/region, then the US national series. The displayed geography and source are always identified.
- **Markets:** daily WTI crude futures (`CL=F`), RBOB gasoline futures (`RB=F`), and adjusted XLE energy ETF history from Yahoo Finance's chart feed. This unauthenticated feed is unofficial and may change or throttle requests. Failed series are excluded.
- **Media:** GDELT DOC article metadata, with AAA and Guardian publisher RSS feeds as an identified fallback. Headline counts describe the retrieved sample, not total news coverage. Keyword pressure cues are not full article sentiment.
- **Map:** Leaflet with attributed OpenStreetMap tiles and Photon US geocoding. Major metro markers use observed AAA prices and national-history projections; the selected metro is recalculated with its own available city/region history. Zoom and pan work on mobile, and marker values change with the selected day and positive/average/negative scenario.

Sources are retrieved on demand and cached at the server: AAA 6 hours, EIA 12 hours, markets 1 hour, news 2 hours, geocoding 7 days. Refresh reloads the latest server-cached observations. Each observation retains its original date and source link. No paid API key is needed for these integrations.

### Forecast methodology

Fit standardized ridge regression (penalty 8, unpenalized intercept) to up to 160 weekly EIA observations aligned with the available market history. Predict the next weekly price change from the previous price change and prior-week market returns. The most recent 16 eligible weekly targets are evaluated in expanding historical windows; future observations are excluded from their training data. Report mean absolute error and the unchanged-price baseline.

The weekly prediction is blended 70/30 with observed local AAA momentum (weekly, monthly, yesterday comparisons), capped at historical volatility, and damped across 14 days. Lower and upper historical residual quantiles produce positive/lower-price and negative/higher-price scenario paths. The average is the central estimate. These approximate bands are not calibrated probability guarantees. A small bounded headline-keyword adjustment is disclosed and has not been backtested; the reported error validates the weekly regression, not the daily interpolation/news adjustment. More than 14-day-old starting prices suppress forecasts.

### Source and deployment

`server/data.mjs` contains bounded source retrieval, parsers, caching, and forecasting; `server/worker.mjs` contains API routes; `web/index.html` and `app.js` contain the responsive UI. The build embeds both UI assets in the Worker, so there is no separate static asset deployment. `.openai/hosting.json` retains the existing private Site identity. Source-page layout changes, geocoder availability, futures rollovers, or missing feeds may reduce coverage; failures are visible in the UI.
