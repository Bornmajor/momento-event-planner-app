/**
 * Generates the Momento logo SVGs (design/logo/) and the PNG app assets (assets/images/) from one geometry.
 * Logo: "Calendar M" — a solid calendar page with two binder tabs and a cut-out "M" (design/README.md).
 *
 * Run: node scripts/generate-logo.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const PINK = '#EA4C89';
const WHITE = '#FFFFFF';

// The mark in its own 72 × 76 coordinate box (origin at the top-left of the tabs' bounding box).
const MARK_W = 72;
const MARK_H = 76;

/**
 * The mark as SVG elements, scaled and centred in a square canvas. The M is cut out with a mask, so whatever is
 * behind the mark shows through it.
 */
function mark({ canvas, heightRatio, color, id }) {
  const scale = (canvas * heightRatio) / MARK_H;
  const x = (canvas - MARK_W * scale) / 2;
  const y = (canvas - MARK_H * scale) / 2;
  const t = `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(4)})`;
  return `
  <defs>
    <mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${MARK_W}" height="${MARK_H}">
      <rect x="0" y="0" width="${MARK_W}" height="${MARK_H}" fill="#fff"/>
      <polyline points="16,64 16,32 36,52 56,32 56,64" fill="none" stroke="#000" stroke-width="9"
        stroke-linecap="round" stroke-linejoin="round"/>
    </mask>
  </defs>
  <g transform="${t}" mask="url(#${id})" fill="${color}">
    <rect x="16" y="0" width="8" height="20" rx="4"/>
    <rect x="48" y="0" width="8" height="20" rx="4"/>
    <rect x="0" y="10" width="72" height="66" rx="12"/>
  </g>`;
}

const svg = (canvas, body, background) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}">` +
  (background ? `<rect width="${canvas}" height="${canvas}" fill="${background}"/>` : '') +
  body +
  `</svg>\n`;

const S = 1024;
const outputs = {
  // Logo sources (transparent, for docs and in-app use)
  'design/logo/momento-logo.svg': svg(S, mark({ canvas: S, heightRatio: 0.9, color: PINK, id: 'm' })),
  'design/logo/momento-logo-white.svg': svg(S, mark({ canvas: S, heightRatio: 0.9, color: WHITE, id: 'm' })),
  // App icon: white mark on a full-bleed pink square (the OS applies the corner mask)
  'assets/images/icon.png': svg(S, mark({ canvas: S, heightRatio: 0.56, color: WHITE, id: 'm' }), PINK),
  // Android adaptive icon: keep the mark inside the 66% safe zone
  'assets/images/android-icon-foreground.png': svg(S, mark({ canvas: S, heightRatio: 0.42, color: WHITE, id: 'm' })),
  'assets/images/android-icon-background.png': svg(S, '', PINK),
  'assets/images/android-icon-monochrome.png': svg(S, mark({ canvas: S, heightRatio: 0.42, color: WHITE, id: 'm' })),
  // Splash: pink mark on transparent (the splash background colour comes from app.json)
  'assets/images/splash-icon.png': svg(S, mark({ canvas: S, heightRatio: 0.8, color: PINK, id: 'm' })),
  // Favicon
  'assets/images/favicon.png': svg(48, mark({ canvas: 48, heightRatio: 0.84, color: PINK, id: 'm' })),
  // In-app logo (welcome screen, headers)
  'assets/images/logo.png': svg(S, mark({ canvas: S, heightRatio: 0.9, color: PINK, id: 'm' })),
};

mkdirSync('design/logo', { recursive: true });
for (const [path, content] of Object.entries(outputs)) {
  if (path.endsWith('.svg')) {
    writeFileSync(path, content);
  } else {
    writeFileSync(path, new Resvg(content).render().asPng());
  }
  console.log('wrote', path);
}
