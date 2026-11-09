// Usage: node scripts/prepare-collage.cjs design/reference/welcome-collage-source.png assets/images/welcome-collage.png <preview.png>
// Crops the empty white bottom and turns the white background (and the white fade into it) transparent,
// using colour-to-alpha against white, so the collage sits on any theme background.
const { PNG } = require(process.cwd() + '/node_modules/pngjs');
const fs = require('fs');
const [inp, out, preview] = process.argv.slice(2);
const src = PNG.sync.read(fs.readFileSync(inp));
const { width: w, height: h, data } = src;
const minc = (i) => Math.min(data[i], data[i + 1], data[i + 2]);
// Flood fill from pure-white border pixels through near-white pixels.
const T_SEED = 252, T_GROW = 200;
const bg = new Uint8Array(w * h), stack = [];
for (let x = 0; x < w; x++) for (const y of [0, h - 1]) stack.push(y * w + x);
for (let y = 0; y < h; y++) for (const x of [0, w - 1]) stack.push(y * w + x);
const seeds = stack.filter((p) => minc(p * 4) >= T_SEED);
stack.length = 0; stack.push(...seeds);
while (stack.length) {
  const p = stack.pop();
  if (bg[p] || minc(p * 4) < T_GROW) continue;
  bg[p] = 1;
  const x = p % w, y = (p / w) | 0;
  if (x > 0) stack.push(p - 1); if (x < w - 1) stack.push(p + 1);
  if (y > 0) stack.push(p - w); if (y < h - 1) stack.push(p + w);
}
// Last row with any non-background pixel.
let bottom = 0;
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!bg[y * w + x] && minc((y * w + x) * 4) < 250) bottom = y;
const outH = Math.min(h, bottom + 4);
// Mask: the background, plus a vertical ramp over the white fade baked into the bottom-left photo
// (left of the bottom-right tile's tilted edge), so that fade stays smooth on dark themes.
const m = Float32Array.from(bg);
const RAMP_TOP = +process.env.RT || 440, RAMP_END = +process.env.RE || 545;
for (let y = RAMP_TOP; y < h; y++) {
  const k = Math.min(1, (y - RAMP_TOP) / (RAMP_END - RAMP_TOP));
  const edge = 300 - ((y - 310) * 125) / 270 - 6; // bottom-right tile's left edge, with margin
  for (let x = 0; x < Math.min(w, edge); x++) m[y * w + x] = Math.max(m[y * w + x], k);
}
const dst = new PNG({ width: w, height: outH });
for (let p = 0; p < w * outH; p++) {
  const i = p * 4;
  let [r, g, b] = [data[i], data[i + 1], data[i + 2]];
  // Colour-to-alpha against white, blended in by the feathered mask. On white it looks identical to the original.
  const af = Math.max(255 - r, 255 - g, 255 - b) / 255, k = m[p];
  const fa = (1 - k) + k * af; // final alpha
  const prem = (c) => (1 - k) * c + k * (c - 255 * (1 - af)); // premultiplied colour
  const a = Math.round(fa * 255);
  if (fa > 0) { r = Math.round(prem(r) / fa); g = Math.round(prem(g) / fa); b = Math.round(prem(b) / fa); } else r = g = b = 0;
  dst.data[i] = r; dst.data[i + 1] = g; dst.data[i + 2] = b; dst.data[i + 3] = a;
}
fs.writeFileSync(out, PNG.sync.write(dst));
// Dark preview: composite on the dark theme background (#111113) beside a light one.
const pv = new PNG({ width: w * 2, height: outH });
for (let y = 0; y < outH; y++) for (let x = 0; x < w; x++) {
  const i = (y * w + x) * 4, a = dst.data[i + 3] / 255;
  for (const [ox, bgc] of [[0, [247, 247, 249]], [w, [17, 17, 19]]]) {
    const j = (y * w * 2 + x + ox) * 4;
    for (let c = 0; c < 3; c++) pv.data[j + c] = Math.round(dst.data[i + c] * a + bgc[c] * (1 - a));
    pv.data[j + 3] = 255;
  }
}
fs.writeFileSync(preview, PNG.sync.write(pv));
console.log('size', w, 'x', outH, 'bg pixels', bg.reduce((s, v) => s + v, 0));
