// Rewrites the escrow / blasted-out data baked into index.html from tools/data.json.
// Usage: node tools/refresh.js   (no npm install needed; d3-geo is vendored)
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = {};
for (const f of ["d3-array.min.js", "d3-geo.min.js"]) vm.runInNewContext(fs.readFileSync(path.join(__dirname, "vendor", f), "utf8"), ctx);
// same projection the page's pre-projected state shapes use
const proj = ctx.d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "data.json"), "utf8"));
const r = v => Math.round(v * 2) / 2;
const asof = new Date(data.asof + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function rows(list) {
  return list.map(c => {
    const xy = proj([c.lon, c.lat]);
    if (!xy) throw new Error(`${c.city}, ${c.st} falls outside the map`);
    return `  { st: ${JSON.stringify(c.st)}, name: ${JSON.stringify(c.city)}, n: ${c.n}, at: [${r(xy[0])},${r(xy[1])}] },`;
  }).join("\n");
}
function replaceBlock(html, start, body) {
  const i = html.indexOf(start);
  if (i < 0) throw new Error("missing " + start);
  const j = html.indexOf("\n];", i);
  return html.slice(0, i + start.length) + "\n" + body + html.slice(j);
}

let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
html = replaceBlock(html, "const CITIES = [", rows(data.escrow));
html = replaceBlock(html, "const BLASTED = [", rows(data.blasted));

// the nine clocks keep their states; counts and city lists follow the escrow data
html = html.replace(/(\{ id: "([A-Z]{2})", name: [^\n]*?count: )\d+(, cities: )"[^"]*"/g, (m, a, st, b) => {
  const cs = data.escrow.filter(c => c.st === st).sort((u, v) => v.n - u.n);
  const total = cs.reduce((s, c) => s + c.n, 0);
  const text = total ? cs.map(c => (c.n > 1 ? `${c.city} ${c.n}` : c.city)).join(" · ") : "No deals in escrow right now";
  return `${a}${total}${b}${JSON.stringify(text)}`;
});

const nEscrow = data.escrow.reduce((s, c) => s + c.n, 0);
const nBlast = data.blasted.reduce((s, c) => s + c.n, 0);
html = html.replace(/Nine market clocks · [^<]*/, `Nine market clocks · ${nEscrow} in escrow · ${nBlast} blasted out as of ${asof}`);
html = html.replace(/pulled [A-Z][a-z]{2} \d{1,2}, \d{4}/g, `pulled ${asof}`);

fs.writeFileSync(path.join(root, "index.html"), html);
console.log(`escrow ${nEscrow} in ${data.escrow.length} cities, blasted ${nBlast} in ${data.blasted.length} cities, as of ${asof}`);
