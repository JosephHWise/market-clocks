# Refreshing the map data

The page's escrow and blasted-out numbers are baked into `index.html`. To refresh:

1. Pull from monday.com, board "👑 Kingdom Homes" (3746279460):
   - In Escrow = group `new_group45220` (skip Escrow Purgatory `new_group25264`).
   - Blasted out = group "Dispo - 💥 Live Properties" `new_group91040`.
   - City and state come from each item's name (the property address); fall back to the `market` column for the state. Strip prefixes like "EMD - ".
2. Rewrite `tools/data.json`: `asof` (YYYY-MM-DD), and per city `{st, city, n, lon, lat}` for `escrow` and `blasted`. Reuse coordinates already in the file; add lon/lat for any new city.
3. `node tools/refresh.js` (no install needed) rewrites the arrays, the nine clocks' counts and city lists, and the "as of" text.
4. Commit and push to `main`; Vercel deploys automatically. Skip the commit if nothing but the date changed.

## Time zone exceptions
A city whose zone differs from its state (East Tennessee is Eastern) goes in `CITY_TZ` in index.html, keyed "ST:City". refresh.js never touches it.
