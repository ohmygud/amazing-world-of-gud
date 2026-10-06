/* =====================================================================
   THANK GUD IT'S FRIDAY — shared game engine
   Vanilla JS · Canvas 2D · Web Audio. No dependencies.
   The same engine powers /desktop and /mobile (layout set by GUD_CONFIG).
   ===================================================================== */
(function () {
'use strict';

const CFG = Object.assign({ layout: 'desktop', assetBase: '../assets/' }, window.GUD_CONFIG || {});
const MOBILE = CFG.layout === 'mobile';
const C = { Y: '#FFE600', P: '#FF1493', B: '#FF85C8', L: '#FFD6EA', K: '#111111', W: '#FFF9F1' };
const rand = (a, b) => a + Math.random() * (b - a);
const irand = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const pad = (n, l) => String(Math.max(0, Math.floor(n))).padStart(l, '0');
const $ = id => document.getElementById(id);
const store = {
  get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
};
/* ---- site-wide language + content (shared by every page of the GUD world) ---- */
const EMBED = /[?&]embed=1/.test(location.search);
let LANG = store.get('gud_lang') || ((navigator.language || '').toLowerCase().indexOf('it') === 0 ? 'it' : 'en');
let CONTENT = window.GUD_DEFAULT_CONTENT || {};
const tr = o => (o == null ? '' : typeof o === 'string' ? o : (o[LANG] || o.it || o.en || ''));
const TX = (group, key, vars) => { let s = tr(((CONTENT.text || {})[group] || {})[key]); if (!s) { const d = (((window.GUD_DEFAULT_CONTENT || {}).text || {})[group] || {})[key]; s = tr(d); } Object.keys(vars || {}).forEach(k => { s = s.split('{' + k + '}').join(String(vars[k])); }); return s; };
const LIST = key => ((CONTENT.lists || {})[key] || ((window.GUD_DEFAULT_CONTENT || {}).lists || {})[key] || []);
function loadContent() {
  const base = CFG.contentBase || '../../content/';
  if (location.protocol === 'file:') return Promise.resolve(CONTENT);
  return fetch(base + 'content.json?t=' + Date.now(), { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : null)).catch(() => null)
    .then(j => { if (j && j.sections) CONTENT = j; return CONTENT; });
}
const HOOKS = { lang: [], mute: [], code: [] };
function setLang(l) { LANG = l === 'en' ? 'en' : 'it'; store.set('gud_lang', LANG); document.documentElement.lang = LANG; HOOKS.lang.forEach(f => { try { f(LANG); } catch (e) { console.error(e); } }); }
window.addEventListener('message', e => {
  const d = e.data; if (!d || d.gud !== 1) return;
  if (location.protocol !== 'file:' && e.origin !== location.origin) return;
  if (d.lang) setLang(d.lang);
  if (d.mute != null) HOOKS.mute.forEach(f => f(!!d.mute));
  if (d.code) HOOKS.code.forEach(f => f(String(d.code)));
});
window.addEventListener('storage', e => { if (e.key === 'gud_lang' && e.newValue && e.newValue !== LANG) setLang(e.newValue); });
function tellParent(msg) { try { if (window.parent && window.parent !== window) window.parent.postMessage(Object.assign({ gud: 1 }, msg), location.protocol === 'file:' ? '*' : location.origin); } catch (e) { /* */ } }
if (EMBED) document.documentElement.classList.add('embed');
document.documentElement.lang = LANG;

/* ---------------------------------------------------------------------
   1. PIXEL FONT — custom 5×7 bitmap, uppercase + Italian accents
   --------------------------------------------------------------------- */
const GLYPHS = [
  ['A', '01110,10001,10001,11111,10001,10001,10001'], ['B', '11110,10001,10001,11110,10001,10001,11110'],
  ['C', '01110,10001,10000,10000,10000,10001,01110'], ['D', '11110,10001,10001,10001,10001,10001,11110'],
  ['E', '11111,10000,10000,11110,10000,10000,11111'], ['F', '11111,10000,10000,11110,10000,10000,10000'],
  ['G', '01110,10001,10000,10111,10001,10001,01111'], ['H', '10001,10001,10001,11111,10001,10001,10001'],
  ['I', '01110,00100,00100,00100,00100,00100,01110'], ['J', '00111,00010,00010,00010,00010,10010,01100'],
  ['K', '10001,10010,10100,11000,10100,10010,10001'], ['L', '10000,10000,10000,10000,10000,10000,11111'],
  ['M', '10001,11011,10101,10101,10001,10001,10001'], ['N', '10001,10001,11001,10101,10011,10001,10001'],
  ['O', '01110,10001,10001,10001,10001,10001,01110'], ['P', '11110,10001,10001,11110,10000,10000,10000'],
  ['Q', '01110,10001,10001,10001,10101,10010,01101'], ['R', '11110,10001,10001,11110,10100,10010,10001'],
  ['S', '01111,10000,10000,01110,00001,00001,11110'], ['T', '11111,00100,00100,00100,00100,00100,00100'],
  ['U', '10001,10001,10001,10001,10001,10001,01110'], ['V', '10001,10001,10001,10001,10001,01010,00100'],
  ['W', '10001,10001,10001,10101,10101,10101,01010'], ['X', '10001,10001,01010,00100,01010,10001,10001'],
  ['Y', '10001,10001,01010,00100,00100,00100,00100'], ['Z', '11111,00001,00010,00100,01000,10000,11111'],
  ['0', '01110,10001,10011,10101,11001,10001,01110'], ['1', '00100,01100,00100,00100,00100,00100,01110'],
  ['2', '01110,10001,00001,00010,00100,01000,11111'], ['3', '11111,00010,00100,00010,00001,10001,01110'],
  ['4', '00010,00110,01010,10010,11111,00010,00010'], ['5', '11111,10000,11110,00001,00001,10001,01110'],
  ['6', '00110,01000,10000,11110,10001,10001,01110'], ['7', '11111,00001,00010,00100,01000,01000,01000'],
  ['8', '01110,10001,10001,01110,10001,10001,01110'], ['9', '01110,10001,10001,01111,00001,00010,01100'],
  ['!', '00100,00100,00100,00100,00100,00000,00100'], ['?', '01110,10001,00001,00010,00100,00000,00100'],
  ['.', '00000,00000,00000,00000,00000,01100,01100'], [',', '00000,00000,00000,00000,01100,00100,01000'],
  ["'", '00100,00100,01000,00000,00000,00000,00000'], ['-', '00000,00000,00000,11111,00000,00000,00000'],
  [':', '00000,01100,01100,00000,01100,01100,00000'], ['/', '00001,00001,00010,00100,01000,10000,10000'],
  ['+', '00000,00100,00100,11111,00100,00100,00000'], ['%', '11001,11001,00010,00100,01000,10011,10011'],
  ['(', '00010,00100,01000,01000,01000,00100,00010'], [')', '01000,00100,00010,00010,00010,00100,01000'],
  ['<', '00010,00100,01000,10000,01000,00100,00010'], ['>', '01000,00100,00010,00001,00010,00100,01000'],
  ['=', '00000,00000,11111,00000,11111,00000,00000'], ['_', '00000,00000,00000,00000,00000,00000,11111'],
  ['@', '01110,10001,10111,10101,10111,10000,01110'], ['&', '01100,10010,10100,01000,10101,10010,01101'],
  ['"', '01010,01010,00000,00000,00000,00000,00000'], ['*', '00000,10101,01110,11111,01110,10101,00000'],
  ['#', '01010,11111,01010,01010,01010,11111,01010'],
  ['♥', '00000,01010,11111,11111,01110,00100,00000'],
  ['À', '01000,00100,01110,10001,11111,10001,10001'], ['È', '01000,00100,11111,10000,11110,10000,11111'],
  ['É', '00010,00100,11111,10000,11110,10000,11111'], ['Ì', '01000,00100,01110,00100,00100,00100,01110'],
  ['Ò', '01000,00100,01110,10001,10001,10001,01110'], ['Ù', '01000,00100,10001,10001,10001,10001,01110'],
  [' ', '0,0,0,0,0,0,0']
];
const FONT = {};
GLYPHS.forEach(([k, v]) => { FONT[k] = v.split(',').map(r => parseInt(r, 2)); });
FONT['’'] = FONT["'"]; FONT['‘'] = FONT["'"];

function tw(s, sc) { s = String(s); return s.length ? (s.length * 6 - 1) * (sc || 1) : 0; }
function dtext(c, s, x, y, sc, col, align) {
  s = String(s).toUpperCase(); sc = sc || 1;
  const w = tw(s, sc);
  if (align === 'center') x -= w / 2; else if (align === 'right') x -= w;
  x = Math.round(x); y = Math.round(y); c.fillStyle = col;
  for (let i = 0; i < s.length; i++) {
    const g = FONT[s[i]] || FONT['?'];
    for (let r = 0; r < 7; r++) {
      const row = g[r]; if (!row) continue;
      let cc = 0;
      while (cc < 5) {
        if (row & (16 >> cc)) {
          let e = cc; while (e < 5 && (row & (16 >> e))) e++;
          c.fillRect(x + cc * sc, y + r * sc, (e - cc) * sc, sc); cc = e;
        } else cc++;
      }
    }
    x += 6 * sc;
  }
  return w;
}
function otext(c, s, x, y, sc, col, ocol, align, shadow) {
  sc = sc || 1; const w = tw(s, sc);
  if (align === 'center') x -= w / 2; else if (align === 'right') x -= w;
  x = Math.round(x); y = Math.round(y);
  const o = sc >= 3 ? Math.max(1, Math.round(sc / 3)) : 1;
  if (shadow) dtext(c, s, x + o * 2, y + o * 2, sc, shadow);
  dtext(c, s, x - o, y, sc, ocol); dtext(c, s, x + o, y, sc, ocol);
  dtext(c, s, x, y - o, sc, ocol); dtext(c, s, x, y + o, sc, ocol);
  dtext(c, s, x, y, sc, col);
  return w;
}
function wrap(text, maxC) {
  const words = String(text).toUpperCase().split(/\s+/).filter(Boolean);
  const lines = []; let cur = '';
  for (const w of words) {
    if (!cur) cur = w; else if ((cur + ' ' + w).length <= maxC) cur += ' ' + w; else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

/* ---------------------------------------------------------------------
   2. PIXEL-ART SPRITES — drawn programmatically, auto 1px black outline
   --------------------------------------------------------------------- */
function outline(cv) {
  const w = cv.width, h = cv.height, x = cv.getContext('2d');
  const im = x.getImageData(0, 0, w, h), d = im.data, src = new Uint8ClampedArray(d);
  const col = i => src[i + 3] > 0 && !(src[i] < 40 && src[i + 1] < 40 && src[i + 2] < 40);
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const i = (yy * w + xx) * 4; if (src[i + 3]) continue;
    if ((xx > 0 && col(i - 4)) || (xx < w - 1 && col(i + 4)) || (yy > 0 && col(i - w * 4)) || (yy < h - 1 && col(i + w * 4))) {
      d[i] = 17; d[i + 1] = 17; d[i + 2] = 17; d[i + 3] = 255;
    }
  }
  x.putImageData(im, 0, 0); return cv;
}
function mk(w, h, fn, noOutline) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  const R = (a, b, cw, ch, col) => { x.fillStyle = col; x.fillRect(a, b, cw, ch); };
  fn(R, x); if (!noOutline) outline(c); return c;
}
function disc(R, cx, cy, r, col) {
  for (let dy = -r; dy <= r; dy++) { const hw = Math.floor(Math.sqrt(r * r - dy * dy) + 0.4); R(cx - hw, cy + dy, hw * 2 + 1, 1, col); }
}
const TINT = new Map();
function tinted(cv, col) {
  let m = TINT.get(cv); if (!m) { m = {}; TINT.set(cv, m); }
  if (!m[col]) {
    const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height;
    const x = c.getContext('2d'); x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'source-in';
    x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); m[col] = c;
  }
  return m[col];
}

/* --- GUD, the protagonist (34×34 cell, feet on row 31) --- */
function gudDraw(R, pose, f) {
  const o = (x, y, w, h, c) => R(x + 5, y + 2, w, h, c);
  const SK = C.L, HR = C.K;
  const beach = pose === 'beach' || pose === 'beachjump';
  if (pose === 'duck') {
    const s = f ? 1 : 0;
    o(0, 14 + s, 8, 3, HR); o(1, 13, 6, 1, HR); o(2, 17, 5, 1 + s, HR);
    o(8, 13, 7, 7, SK); o(7, 11, 8, 2, HR); o(6, 12, 3, 5, HR); o(8, 13, 6, 1, HR);
    o(9, 15, 3, 3, C.K); o(10, 16, 1, 1, C.W); o(12, 15, 3, 3, C.K); o(13, 16, 1, 1, C.W);
    o(13, 18, 1, 1, C.P);
    o(8, 20, 8, 4, C.P); o(15, 21, 4, 2, SK);
    o(5, 23, 10, 3, C.B);
    o(9, 26, 7, 2, C.K); o(14, 27, 2, 2, C.K); o(15, 28, 4, 2, C.P);
    o(4, 26, 6, 2, C.K); o(2, 28, 4, 2, C.P);
    return;
  }
  if (pose === 'defeat') {
    o(-4, 26, 6, 3, HR); o(-3, 22, 3, 5, HR);
    o(0, 22, 7, 6, SK); o(0, 21, 7, 1, HR);
    o(1, 23, 3, 3, C.K); o(2, 24, 1, 1, C.P); o(4, 24, 3, 3, C.K); o(5, 25, 1, 1, C.P);
    o(3, 27, 2, 1, C.K);
    o(7, 23, 7, 5, C.P); o(9, 28, 5, 1, SK); o(14, 22, 4, 7, C.B);
    o(18, 23, 7, 2, C.K); o(18, 26, 7, 2, C.K); o(25, 21, 2, 4, C.P); o(25, 26, 2, 3, C.P);
    return;
  }
  const runlike = pose === 'run' || pose === 'shoot';
  const jumpP = pose === 'jump' || pose === 'jumpshoot' || pose === 'beachjump';
  let by = 0;
  if (runlike && f % 2 === 1) by = -1;
  if (pose === 'victory' && f === 1) by = -2;
  // hair (long, behind)
  const hl = jumpP ? 9 : 12 + (runlike ? f % 2 : 0) + (pose === 'idle' ? f : 0);
  o(4, 3 + by, 4, hl, HR); o(3, 6 + by, 2, hl - 3, HR);
  if (jumpP) o(1, 4 + by, 3, 4, HR);
  if (runlike) o(2, 8 + by + (f % 2), 2, 5, HR);
  // head
  o(8, 4 + by, 7, 7, SK);
  o(7, 2 + by, 8, 2, HR); o(6, 3 + by, 3, 5, HR); o(8, 4 + by, 6, 1, HR); o(8, 5 + by, 1, 1, HR);
  // glasses
  if (beach) {
    o(9, 6 + by, 6, 2, C.K); o(9, 8 + by, 2, 1, C.K); o(13, 8 + by, 2, 1, C.K);
    o(10, 6 + by, 1, 1, C.W); o(13, 6 + by, 1, 1, C.W);
  } else {
    o(9, 6 + by, 3, 3, C.K); o(12, 6 + by, 3, 3, C.K);
    const lens = (pose === 'idle' && f === 1) ? C.K : (pose === 'hurt' ? C.P : C.W);
    o(10, 7 + by, 1, 1, lens); o(13, 7 + by, 1, 1, lens);
  }
  // mouth
  if (pose === 'hurt') o(12, 9 + by, 2, 2, C.K);
  else if (['victory', 'collect', 'beach', 'beachjump'].includes(pose)) o(11, 9 + by, 3, 1, C.P);
  else o(13, 9 + by, 1, 1, C.P);
  o(11, 11 + by, 2, 1, SK);
  // outfit
  if (beach) { o(9, 12 + by, 5, 2, C.P); o(9, 14 + by, 5, 3, SK); o(9, 17 + by, 5, 2, C.P); }
  else { o(9, 12 + by, 5, 5, C.P); o(11, 12 + by, 1, 1, C.Y); o(8, 17 + by, 7, 2, C.B); o(7, 19 + by, 9, 1, C.B); }
  // legs
  const LG = beach ? SK : C.K, SH = beach ? SK : C.P;
  const leg = (tx, sx, lift) => { o(tx, 19, 2, 5, LG); o(sx, 24, 2, 4 - lift, LG); o(sx, 28 - lift, 3, 2, SH); };
  if (jumpP) { leg(11, 13, 2); leg(8, 7, 1); }
  else if (runlike) {
    const L = [[[12, 14, 0], [9, 6, 1]], [[11, 12, 0], [10, 9, 2]], [[12, 13, 0], [9, 7, 0]], [[10, 10, 0], [11, 12, 2]]][f % 4];
    leg(...L[0]); leg(...L[1]);
  } else if (pose === 'hurt') { leg(8, 7, 0); leg(12, 14, 0); }
  else { leg(9, 9, 0); leg(12, 12, 0); }
  // arms
  const arm = (x, y, w, h) => o(x, y + by, w, h, SK);
  if (pose === 'shoot' || pose === 'jumpshoot') { arm(13, 13, 7, 2); o(20, 12 + by, 2, 4, C.Y); arm(7, 13, 2, 3); }
  else if (pose === 'victory') { arm(14, 6, 2, 6); arm(7, 6, 2, 6); }
  else if (pose === 'collect') { arm(14, 6, 2, 6); arm(8, 13, 2, 4); }
  else if (pose === 'hurt') { arm(15, 9, 2, 4); arm(6, 9, 2, 4); }
  else if (beach) {
    arm(13, 12, 2, 2); arm(15, 10, 2, 3); arm(8, 13, 2, 4);
    o(14, 4 + by, 7, 1, C.Y); o(15, 5 + by, 5, 1, C.Y); o(16, 6 + by, 3, 1, C.Y);
    o(17, 7 + by, 1, 2, C.Y); o(15, 9 + by, 5, 1, C.Y); o(19, 1 + by, 1, 3, C.P); o(17, 0 + by, 5, 1, C.B);
  }
  else if (jumpP) { arm(14, 9, 2, 4); arm(7, 11, 2, 3); }
  else if (pose === 'run') { if (f % 2 === 0) { arm(14, 13, 3, 2); arm(7, 13, 2, 3); } else arm(13, 13, 2, 4); }
  else arm(13, 13, 2, 4);
}
const GUDC = {};
function gud(pose, f) { const k = pose + f; return GUDC[k] || (GUDC[k] = mk(34, 34, R => gudDraw(R, pose, f))); }

/* --- GUD seen from the front / from behind, same proportions and palette as the side sprites --- */
const LOOKS = {
  gud: { hair: 'long', hc: C.K, skin: C.L, top: C.P, bot: C.B, skirt: true, glasses: true, legs: C.K, shoe: C.P, neck: C.Y },
  mom: { hair: 'short', hc: C.W, skin: C.L, top: C.B, bot: C.P, skirt: true, legs: C.L, shoe: C.K, earrings: true },
  prof: { hair: 'short', hc: C.W, skin: C.L, top: C.W, bot: C.K, glasses: true, legs: C.K, shoe: C.K, coat: true },
  client: { hair: 'bald', hc: C.K, skin: C.L, top: C.W, bot: C.K, tie: true, glasses: 'thin', legs: C.K, shoe: C.K },
  girl: { hair: 'bob', hc: C.Y, skin: C.L, top: C.Y, bot: C.P, skirt: true, legs: C.L, shoe: C.K },
  boy: { hair: 'short', hc: C.K, skin: C.L, top: C.B, bot: C.K, legs: C.K, shoe: C.W },
  teach: { hair: 'bun', hc: C.B, skin: C.L, top: C.K, bot: C.K, skirt: true, glasses: true, legs: C.K, shoe: C.P },
  barista: { hair: 'long', hc: C.P, skin: C.L, top: C.W, bot: C.P, skirt: true, legs: C.L, shoe: C.K, apron: true },
  punk: { hair: 'mohawk', hc: C.P, skin: C.L, top: C.K, bot: C.K, legs: C.K, shoe: C.Y },
  critic: { hair: 'short', hc: C.Y, skin: C.L, top: C.W, bot: C.K, glasses: true, legs: C.K, shoe: C.K },
  libr: { hair: 'bun', hc: C.W, skin: C.L, top: C.B, bot: C.K, skirt: true, glasses: true, legs: C.K, shoe: C.K },
  guard: { hair: 'short', hc: C.K, skin: C.L, top: C.Y, bot: C.K, legs: C.K, shoe: C.K, helmet: true }
};
function personDraw(R, lk, dir, f) {
  const o = (x, y, w, h, c) => R(x + 5, y + 2, w, h, c);
  const SK = lk.skin || C.L, HC = lk.hc;
  const step = f === 1 ? 1 : f === 2 ? 2 : 0;
  const legsFB = () => {
    const la = step === 1 ? 2 : 0, lb = step === 2 ? 2 : 0;
    o(9, 20, 2, 8 - la, lk.legs); o(13, 20, 2, 8 - lb, lk.legs);
    o(8, 28 - la, 3, 2, lk.shoe); o(13, 28 - lb, 3, 2, lk.shoe);
  };
  const body = (front) => {
    const sw = step === 1 ? -1 : step === 2 ? 1 : 0;
    o(9, 12, 6, 5, lk.top);
    if (lk.coat) { o(8, 12, 8, 9, C.W); o(11, 12, 2, 6, C.B); }
    if (front && lk.neck) o(11, 12, 2, 1, lk.neck);
    if (front && lk.tie) { o(11, 12, 2, 1, C.W); o(11, 13, 2, 5, C.P); }
    if (front && lk.apron) o(10, 14, 4, 5, C.B);
    o(7, 12 + sw, 2, 5, lk.coat ? C.W : (lk.tie ? lk.top : SK)); o(15, 12 - sw, 2, 5, lk.coat ? C.W : (lk.tie ? lk.top : SK));
    o(7, 17 + sw, 2, 1, SK); o(15, 17 - sw, 2, 1, SK);
    if (lk.skirt) { o(8, 17, 8, 2, lk.bot); o(7, 19, 10, 1, lk.bot); }
    else if (!lk.coat) o(9, 17, 6, 3, lk.bot);
  };
  if (dir === 'down') {
    if (lk.hair === 'long') { o(5, 4, 3, 13, HC); o(16, 4, 3, 13, HC); }
    if (lk.hair === 'bob') { o(6, 4, 2, 7, HC); o(16, 4, 2, 7, HC); }
    body(true);
    o(8, 4, 8, 7, SK); o(11, 11, 2, 1, SK);
    if (lk.hair === 'bald') { o(8, 3, 8, 1, SK); o(7, 6, 1, 3, HC); o(16, 6, 1, 3, HC); }
    else if (lk.hair === 'mohawk') { o(10, 0, 4, 4, HC); }
    else { o(7, 2, 10, 2, HC); o(8, 4, 8, 1, HC); o(7, 4, 1, 3, HC); o(16, 4, 1, 3, HC); }
    if (lk.hair === 'bun') o(10, 0, 4, 2, HC);
    if (lk.helmet) { o(7, 1, 10, 3, C.W); o(7, 3, 10, 1, C.K); }
    if (lk.glasses === 'thin') { [8, 12].forEach(gx => { o(gx, 5, 4, 1, C.K); o(gx, 8, 4, 1, C.K); o(gx, 6, 1, 2, C.K); o(gx + 3, 6, 1, 2, C.K); }); o(10, 6, 1, 2, C.K); o(13, 6, 1, 2, C.K); }
    else if (lk.glasses) { o(8, 6, 4, 3, C.K); o(12, 6, 4, 3, C.K); o(9, 7, 2, 1, C.W); o(13, 7, 2, 1, C.W); }
    else { o(9, 7, 1, 2, C.K); o(14, 7, 1, 2, C.K); }
    if (lk.earrings) { o(7, 8, 1, 2, C.Y); o(16, 8, 1, 2, C.Y); }
    o(11, 9, 2, 1, C.P);
    legsFB();
  } else if (dir === 'up') {
    body(false);
    if (lk.hair === 'long') { o(6, 2, 12, 15, HC); o(7, 1, 10, 1, HC); }
    else if (lk.hair === 'bald') o(8, 3, 8, 8, SK);
    else if (lk.hair === 'mohawk') { o(8, 4, 8, 7, SK); o(10, 0, 4, 9, HC); }
    else { o(8, 4, 8, 7, SK); o(7, 2, 10, lk.hair === 'bob' ? 9 : 6, HC); if (lk.hair === 'bun') o(10, 0, 4, 3, HC); }
    if (lk.helmet) o(7, 1, 10, 4, C.W);
    legsFB();
  } else {
    // side (facing right)
    const run = step ? 1 : 0;
    if (lk.hair === 'long') { o(4, 3, 4, 12 + run, HC); o(3, 6, 2, 9, HC); }
    if (lk.hair === 'bob') o(5, 3, 3, 8, HC);
    o(9, 12, 5, 5, lk.top); if (lk.coat) o(8, 12, 7, 9, C.W); if (lk.tie) o(13, 13, 1, 4, C.P);
    if (lk.skirt) { o(8, 17, 7, 2, lk.bot); o(7, 19, 9, 1, lk.bot); } else if (!lk.coat) o(9, 17, 5, 3, lk.bot);
    o(8, 4, 7, 7, SK); o(11, 11, 2, 1, SK);
    if (lk.hair === 'bald') o(8, 3, 6, 1, SK);
    else if (lk.hair === 'mohawk') o(9, 0, 4, 4, HC);
    else { o(7, 2, 8, 2, HC); o(6, 3, 3, 5, HC); o(8, 4, 6, 1, HC); }
    if (lk.hair === 'bun') o(6, 1, 3, 3, HC);
    if (lk.helmet) { o(7, 1, 9, 3, C.W); }
    if (lk.glasses === 'thin') { o(12, 5, 3, 1, C.K); o(12, 8, 3, 1, C.K); o(12, 6, 1, 2, C.K); o(14, 6, 1, 2, C.K); o(13, 6, 1, 2, C.K); o(9, 6, 3, 1, C.K); }
    else if (lk.glasses) { o(12, 6, 3, 3, C.K); o(13, 7, 1, 1, C.W); o(10, 7, 2, 1, C.K); } else o(13, 7, 1, 2, C.K);
    if (lk.earrings) o(9, 8, 1, 2, C.Y);
    o(13, 9, 1, 1, C.P);
    const legs = [[[11, 11, 0], [11, 11, 0]], [[12, 14, 0], [9, 6, 1]], [[12, 13, 0], [9, 7, 0]]][step];
    legs.forEach(([tx, sx, lift]) => { o(tx, 20, 2, 4, lk.legs); o(sx, 24, 2, 4 - lift, lk.legs); o(sx, 28 - lift, 3, 2, lk.shoe); });
    o(step === 1 ? 13 : 11, 13, 2, 4, lk.coat ? C.W : SK);
  }
}
/* --- LUDO: GUD's Chinese crested dog. Hairless pink skin, white crest, socks and tail plume --- */
const LUDOC = {};
function ludo(dir, f) {
  f = f ? 1 : 0;
  const key = dir + f; if (LUDOC[key]) return LUDOC[key];
  const side = dir === 'left' || dir === 'right';
  let c = mk(24, 20, R => {
    const SK = C.B, SH = C.P, HW = C.W, SP = C.K;
    if (side) {
      const a = f;
      R(1, 2, 3, 4, HW); R(0, 3, 1, 2, HW); R(3, 5, 1, 2, SK); R(4, 7, 1, 3, SK);      // tail plume + tail
      R(5 + a, 13, 1, 5, SH); R(13 - a, 14, 1, 4, SH);                                   // far legs
      R(5, 9, 11, 4, SK); R(13, 9, 3, 5, SK); R(6, 13, 2, 1, SK);                        // body + chest
      R(8, 10, 2, 1, SP); R(11, 11, 1, 1, SP); R(6, 9, 1, 1, SP);                        // spots
      R(6 - a, 13, 2, 5, SK); R(14 + a, 14, 1, 4, SK);                                   // near legs
      R(4 + a, 17, 3, 2, HW); R(12 - a, 17, 2, 2, HW); R(5 - a, 17, 3, 2, HW); R(13 + a, 17, 3, 2, HW); // socks
      R(14, 6, 3, 4, SK);                                                                // neck
      R(15, 4, 4, 3, SK); R(19, 5, 3, 2, SK); R(22, 5, 1, 1, C.K); R(17, 5, 1, 1, C.K); R(20, 7, 1, 1, C.P);
      R(17, 0, 2, 4, SK); R(19, 0, 1, 3, HW);                                            // ear + fringe
      R(15, 2, 2, 2, HW); R(14, 3, 2, 3, HW); R(13, 5, 2, 2, HW); R(13, 7, 1, 2, HW);    // crest down the neck
    } else if (dir === 'down') {
      const a = f;
      R(16, 9, 2, 3, HW);                                                                // tail plume peeking
      R(7, 1, 2, 4, SK); R(15, 1, 2, 4, SK); R(6, 1, 1, 3, HW); R(17, 1, 1, 3, HW);
      R(9, 10, 6, 4, SK); R(10, 11, 1, 1, SP); R(13, 12, 1, 1, SP);
      R(9, 14, 2, 4 - a, SK); R(13, 14, 2, 3 + a, SK);
      R(8, 17 - a, 3, 2, HW); R(13, 16 + a, 3, 2, HW);
      R(9, 4, 6, 5, SK); R(10, 8, 4, 2, SK);
      R(9, 1, 6, 3, HW); R(10, 0, 4, 1, HW);                                             // crest
      R(10, 6, 1, 1, C.K); R(13, 6, 1, 1, C.K); R(11, 9, 2, 1, C.K); R(11, 10, 2, 1, C.P);
    } else {
      const a = f;
      R(7, 1, 2, 4, SK); R(15, 1, 2, 4, SK); R(6, 1, 1, 3, HW); R(17, 1, 1, 3, HW);
      R(8, 3, 8, 5, SK);
      R(9, 9, 6, 5, SK); R(9, 10, 1, 1, SP); R(14, 12, 1, 1, SP);
      R(9, 14, 2, 4 - a, SK); R(13, 14, 2, 3 + a, SK);
      R(8, 17 - a, 3, 2, HW); R(13, 16 + a, 3, 2, HW);
      R(9, 1, 6, 5, HW); R(10, 0, 4, 1, HW); R(10, 6, 4, 2, HW);                         // crest from behind
      R(11, 12, 2, 2, SK); R(10, 9, 4, 3, HW);                                           // tail + plume
    }
  });
  if (dir === 'left') { const m = document.createElement('canvas'); m.width = 24; m.height = 20; const x = m.getContext('2d'); x.translate(24, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); c = m; }
  return (LUDOC[key] = c);
}
const PCACHE = {};
function person(look, dir, f) {
  f = f || 0;
  const key = look + dir + f; if (PCACHE[key]) return PCACHE[key];
  let c;
  if (look === 'gud' && (dir === 'left' || dir === 'right')) c = gud(f ? 'run' : 'idle', f ? (f === 1 ? 0 : 2) : 0);
  else { const lk = LOOKS[look] || LOOKS.boy; c = mk(34, 34, R => personDraw(R, lk, dir === 'left' ? 'right' : dir, f)); }
  if (dir === 'left') { const m = document.createElement('canvas'); m.width = 34; m.height = 34; const x = m.getContext('2d'); x.translate(34, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); c = m; }
  return (PCACHE[key] = c);
}
function gudBack(f) {
  return mk(34, 34, R => {
    const o = (x, y, w, h, c) => R(x + 5, y + 2, w, h, c);
    const by = f ? -1 : 0;
    o(9, 12 + by, 6, 5, C.P); o(7, 12 + by, 2, 5, C.L); o(15, 12 + by, 2, 5, C.L);
    o(8, 17 + by, 8, 2, C.B); o(7, 19 + by, 10, 1, C.B);
    o(6, 2 + by, 12, 15, C.K); o(7, 1 + by, 10, 1, C.K); o(5, 8 + by, 1, 8, C.K); o(18, 8 + by, 1, 8, C.K);
    o(5, 6 + by, 1, 1, C.K); o(18, 6 + by, 1, 1, C.K);
    o(9, 20, 2, 8, C.K); o(13, 20, 2, 8, C.K); o(8, 28, 3, 2, C.P); o(13, 28, 3, 2, C.P);
  });
}
/* --- GUDMON: GUD's passions, little creatures with a letter on the belly --- */
function monSprite(m, blink) {
  return mk(44, 44, (R, x) => {
    const col = C[m.c] || C.P, dark = m.c === 'K';
    disc(R, 22, 25, 15, col); R(9, 26, 26, 10, col); R(12, 36, 6, 4, col); R(26, 36, 6, 4, col);
    R(9, 10, 5, 7, col); R(30, 10, 5, 7, col); R(10, 8, 3, 3, col); R(31, 8, 3, 3, col);
    R(15, 27, 14, 11, C.W); dtext(x, String(m.l || '?').slice(0, 1), 20, 29, 1, dark ? C.K : C.P);
    const ec = dark ? C.W : C.K;
    if (blink) { R(14, 20, 4, 1, ec); R(26, 20, 4, 1, ec); }
    else { R(14, 17, 4, 5, ec); R(26, 17, 4, 5, ec); R(15, 18, 1, 1, dark ? C.K : C.W); R(27, 18, 1, 1, dark ? C.K : C.W); }
    R(11, 23, 3, 2, C.B); R(30, 23, 3, 2, C.B); R(20, 23, 4, 1, dark ? C.W : C.K);
    const a = m.a;
    if (a === 'glasses') { R(12, 16, 8, 7, C.K); R(24, 16, 8, 7, C.K); R(20, 18, 4, 1, C.K); R(14, 18, 4, 3, blink ? C.K : C.W); R(26, 18, 4, 3, blink ? C.K : C.W); if (!blink) { R(16, 19, 2, 2, C.K); R(28, 19, 2, 2, C.K); } }
    if (a === 'crown') { R(14, 4, 16, 5, C.Y); R(14, 1, 2, 3, C.Y); R(21, 1, 2, 3, C.Y); R(28, 1, 2, 3, C.Y); R(21, 5, 2, 2, C.P); }
    if (a === 'beret') { R(13, 7, 18, 4, C.K); R(16, 5, 12, 2, C.K); R(21, 3, 2, 2, C.K); }
    if (a === 'cap') { R(12, 6, 20, 2, C.K); R(16, 8, 12, 3, C.K); R(30, 7, 1, 6, C.Y); R(29, 12, 3, 2, C.Y); }
    if (a === 'nib') { R(36, 20, 4, 10, C.K); R(37, 30, 2, 3, C.K); R(37, 22, 2, 2, C.W); }
    if (a === 'spark') { R(3, 6, 1, 5, C.Y); R(1, 8, 5, 1, C.Y); R(39, 30, 1, 5, C.Y); R(37, 32, 5, 1, C.Y); }
    if (a === 'bubble') { R(30, 2, 12, 8, C.W); R(32, 10, 3, 2, C.W); R(32, 4, 1, 1, C.K); R(35, 4, 1, 1, C.K); R(38, 4, 1, 1, C.K); }
    if (a === 'book') { R(1, 28, 9, 11, C.Y); R(5, 28, 1, 11, C.K); }
    if (a === 'bow') { R(28, 6, 5, 4, C.P); R(34, 6, 5, 4, C.P); R(32, 7, 3, 2, C.Y); }
    if (a === 'headphones') { R(9, 12, 26, 2, C.K); R(7, 16, 4, 8, C.K); R(33, 16, 4, 8, C.K); }
  });
}
const MON_ACCESSORIES = ['none', 'glasses', 'crown', 'beret', 'cap', 'nib', 'spark', 'bubble', 'book', 'bow', 'headphones'];

/* --- Obstacles, bonuses, bosses, fx --- */
const SPR = { ob: {}, bn: {}, fx: {} };
function buildSprites() {
  const O = SPR.ob, B = SPR.bn, F = SPR.fx;
  O.f24 = [mk(32, 24, (R, x) => {
    R(1, 1, 30, 22, C.W); R(1, 1, 30, 9, C.P); dtext(x, 'F24', 3, 2, 1, C.W);
    R(22, 3, 7, 5, C.W); R(23, 4, 5, 1, C.K); R(23, 6, 5, 1, C.K);
    R(4, 13, 24, 1, C.K); R(4, 16, 15, 1, C.K); R(4, 19, 10, 1, C.K); R(21, 15, 8, 6, C.B); R(22, 17, 6, 1, C.P);
  })];
  O.email = [0, 1].map(f => mk(36, 26, (R, x) => {
    if (f === 0) { R(1, 7, 6, 2, C.B); R(2, 5, 4, 2, C.B); R(29, 7, 6, 2, C.B); R(30, 5, 4, 2, C.B); }
    else { R(1, 13, 6, 2, C.B); R(2, 15, 4, 2, C.B); R(29, 13, 6, 2, C.B); R(30, 15, 4, 2, C.B); }
    R(7, 8, 22, 14, C.W);
    for (let i = 0; i < 11; i++) { const yy = 8 + Math.floor(i * 0.6); R(7 + i, yy, 1, 1, C.K); R(28 - i, yy, 1, 1, C.K); }
    R(11, 16, 2, 2, C.K); R(23, 16, 2, 2, C.K); R(10, 14, 3, 1, C.K); R(23, 14, 3, 1, C.K); R(14, 19, 8, 1, C.K);
    R(23, 1, 11, 9, C.P); R(22, 2, 13, 7, C.P); dtext(x, '98', 23, 2, 1, C.W);
  }));
  O.urgent = [mk(66, 32, (R, x) => {
    R(1, 1, 64, 30, C.W); R(1, 1, 64, 9, C.P); R(1, 10, 64, 1, C.K);
    dtext(x, '!!!', 4, 2, 1, C.W); R(56, 2, 7, 7, C.W); dtext(x, 'X', 57, 2, 1, C.K);
    dtext(x, 'MODIFICHE', 6, 13, 1, C.K); dtext(x, 'URGENTI', 12, 22, 1, C.P);
  })];
  O.call = [0, 1].map(f => mk(18, 28, (R) => {
    R(2, 1, 14, 26, C.K); R(4, 4, 10, 17, f ? C.P : C.B); R(7, 2, 4, 1, C.W); R(7, 23, 4, 2, C.W);
    R(6, 11, 6, 2, C.W); R(6, 12, 2, 3, C.W); R(10, 12, 2, 3, C.W); R(8, 8, 2, 1, C.W); R(7, 6, 4, 1, C.W);
  }));
  O.contradictory = [mk(30, 26, (R) => {
    for (let i = 0; i < 5; i++) R(2 + i, 6 - i, 1, 1 + 2 * i, C.W); R(7, 4, 20, 5, C.W);
    R(3, 15, 20, 5, C.P); for (let i = 0; i < 5; i++) R(27 - i, 17 - i, 1, 1 + 2 * i, C.P);
  })];
  const monitor = (R, screen) => { R(1, 3, 26, 18, C.K); R(3, 5, 22, 14, screen); R(11, 21, 6, 3, C.K); R(6, 24, 16, 3, C.K); };
  O.bug = [mk(28, 28, (R) => {
    monitor(R, C.B); R(17, 1, 7, 3, C.P); R(19, 1, 1, 3, C.K); R(16, 2, 1, 1, C.K); R(24, 2, 1, 1, C.K);
  })];
  O.internet = [mk(28, 28, (R) => {
    monitor(R, C.W); R(12, 15, 3, 2, C.K); R(9, 12, 9, 1, C.K); R(8, 13, 1, 1, C.K); R(18, 13, 1, 1, C.K);
    R(7, 9, 13, 1, C.K); R(6, 10, 1, 1, C.K); R(20, 10, 1, 1, C.K);
    for (let i = 0; i < 5; i++) { R(18 + i, 6 + i, 1, 1, C.P); R(22 - i, 6 + i, 1, 1, C.P); }
  })];
  O.brief = [mk(80, 36, (R, x) => {
    R(8, 9, 64, 22, C.B); R(3, 14, 74, 13, C.B); R(14, 3, 22, 8, C.B); R(38, 1, 24, 9, C.B); R(60, 6, 12, 5, C.B); R(10, 30, 58, 3, C.B);
    dtext(x, 'BRIEF IN', 16, 11, 1, C.K); dtext(x, 'MILANESE', 16, 21, 1, C.K); dtext(x, '?', 68, 15, 1, C.P);
  })];
  O.overtime = [mk(52, 30, (R, x) => {
    disc(R, 26, 11, 10, C.P); disc(R, 26, 11, 8, C.W); R(26, 5, 1, 7, C.K); R(26, 11, 5, 1, C.K);
    R(1, 20, 50, 9, C.P); dtext(x, 'OVERTIME', 3, 21, 1, C.W);
  })];
  O.voice = [mk(98, 32, (R, x) => {
    R(1, 1, 96, 25, C.W); R(2, 26, 7, 3, C.W); R(2, 29, 3, 2, C.W);
    for (let i = 0; i < 4; i++) R(5 + i, 4 + i, 1, 7 - 2 * i, C.K);
    [2, 4, 6, 3, 7, 5, 2, 6, 4, 3, 7, 2, 5, 3, 6, 2].forEach((h, i) => R(13 + i * 3, 7 - Math.floor(h / 2), 2, h, C.P));
    dtext(x, '4:00', 68, 4, 1, C.K); dtext(x, 'VOCALE 4 MINUTI', 4, 16, 1, C.K);
  })];
  O.link404 = [mk(42, 30, (R, x) => {
    R(1, 1, 40, 20, C.W); R(1, 1, 40, 2, C.P); dtext(x, '404', 4, 4, 2, C.P);
    R(3, 23, 10, 5, C.K); x.clearRect(5, 24, 6, 3); R(13, 25, 4, 1, C.K);
    R(25, 25, 4, 1, C.K); R(29, 23, 10, 5, C.K); x.clearRect(31, 24, 6, 3);
    R(20, 23, 2, 1, C.P); R(19, 26, 1, 1, C.P); R(22, 26, 1, 1, C.P);
  })];
  O.update = [mk(78, 24, (R) => { R(1, 10, 76, 12, C.K); R(3, 12, 72, 8, C.W); })];
  O.malessere = [mk(20, 18, (R) => {
    R(2, 3, 7, 7, C.B); R(11, 3, 7, 7, C.B); R(3, 2, 5, 1, C.B); R(12, 2, 5, 1, C.B); R(2, 5, 16, 5, C.B);
    for (let i = 0; i < 7; i++) R(3 + i, 10 + i, 14 - 2 * i, 1, C.B);
    R(10, 3, 1, 3, C.K); R(9, 6, 1, 3, C.K); R(10, 9, 1, 3, C.K); R(9, 12, 1, 2, C.K);
    R(5, 7, 1, 2, C.K); R(14, 7, 1, 2, C.K); R(4, 11, 3, 1, C.K); R(13, 11, 3, 1, C.K);
  })];
  O.martini = [mk(22, 28, (R) => {
    R(1, 3, 20, 2, C.W); for (let i = 0; i < 9; i++) { const hw = 9 - i; R(11 - hw, 5 + i, hw * 2, 1, C.B); }
    R(10, 13, 2, 9, C.W); R(5, 22, 12, 2, C.W);
    for (let i = 0; i < 6; i++) R(17 - i, 1 + i, 1, 1, C.K); R(9, 6, 4, 3, C.P);
  })];
  O.pranzo = [mk(98, 28, (R, x) => {
    R(22, 4, 54, 8, C.B); R(28, 2, 42, 3, C.B); R(18, 8, 62, 6, C.B); R(34, 1, 22, 3, C.P);
    for (let i = 0; i < 12; i++) R(24 + i * 4, 5 + (i % 3), 2, 1, C.P);
    R(4, 13, 90, 4, C.W); R(1, 15, 96, 10, C.W); R(8, 25, 82, 2, C.W); R(3, 16, 92, 1, C.P);
    dtext(x, 'PRANZO DA MAMMA', 4, 17, 1, C.K);
  })];
  O.parmigiana = [mk(68, 28, (R, x) => {
    R(3, 1, 62, 3, C.P); R(3, 4, 62, 2, C.W); R(3, 6, 62, 2, C.B);
    R(1, 8, 66, 19, C.W); R(1, 8, 66, 1, C.K);
    dtext(x, 'PARMIGIANA', 4, 10, 1, C.K); dtext(x, 'PER CENA', 10, 18, 1, C.P);
  })];
  // Bonuses — always ELECTRIC YELLOW
  B.coffee = [mk(18, 18, (R) => {
    R(3, 6, 10, 8, C.Y); R(4, 14, 8, 1, C.Y); R(13, 8, 3, 1, C.Y); R(15, 8, 1, 4, C.Y); R(13, 11, 3, 1, C.Y);
    R(4, 6, 8, 1, C.K); R(1, 15, 16, 2, C.Y);
  })];
  B.cat = [mk(18, 16, (R) => {
    R(2, 5, 14, 9, C.Y); R(2, 2, 3, 3, C.Y); R(3, 1, 1, 1, C.Y); R(13, 2, 3, 3, C.Y); R(14, 1, 1, 1, C.Y);
    R(5, 8, 2, 2, C.K); R(11, 8, 2, 2, C.K); R(8, 10, 2, 1, C.P); R(1, 11, 3, 1, C.K); R(14, 11, 3, 1, C.K);
  })];
  B.dog = [mk(18, 16, (R) => {
    R(4, 2, 10, 11, C.Y); R(1, 3, 3, 8, C.Y); R(14, 3, 3, 8, C.Y); R(4, 3, 1, 6, C.K); R(13, 3, 1, 6, C.K);
    R(6, 6, 2, 2, C.K); R(10, 6, 2, 2, C.K); R(8, 9, 2, 2, C.K); R(8, 11, 2, 2, C.P);
  })];
  B.water = [mk(26, 19, (R, x) => {
    R(1, 1, 22, 2, C.Y); R(2, 3, 20, 13, C.Y); R(3, 16, 18, 1, C.Y); R(3, 4, 18, 1, C.W); dtext(x, 'H2O', 4, 7, 1, C.K);
  })];
  B.salad = [mk(22, 16, (R) => {
    R(1, 8, 20, 4, C.Y); R(3, 12, 16, 2, C.Y); R(6, 14, 10, 1, C.Y);
    R(3, 4, 5, 4, C.B); R(8, 2, 6, 6, C.W); R(13, 4, 5, 4, C.P); R(6, 5, 2, 2, C.P); R(16, 3, 2, 2, C.B);
  })];
  B.oki = [mk(24, 14, (R, x) => { R(1, 1, 22, 12, C.Y); dtext(x, 'OKI', 4, 3, 1, C.K); R(1, 11, 22, 1, C.P); })];
  B.polase = [mk(40, 14, (R, x) => { R(1, 1, 38, 12, C.Y); dtext(x, 'POLASE', 3, 3, 1, C.K); R(1, 11, 38, 1, C.P); })];
  // FX
  F.heart = mk(11, 10, (R) => { R(2, 1, 2, 1, C.Y); R(6, 1, 2, 1, C.Y); R(1, 2, 8, 3, C.Y); R(2, 5, 6, 1, C.Y); R(3, 6, 4, 1, C.Y); R(4, 7, 2, 1, C.Y); R(2, 2, 1, 1, C.W); });
  F.heartP = mk(11, 10, (R) => { R(2, 1, 2, 1, C.P); R(6, 1, 2, 1, C.P); R(1, 2, 8, 3, C.P); R(2, 5, 6, 1, C.P); R(3, 6, 4, 1, C.P); R(4, 7, 2, 1, C.P); R(2, 2, 1, 1, C.W); });
  F.cloud = mk(42, 18, (R) => { R(8, 5, 26, 8, C.W); R(3, 9, 36, 6, C.W); R(13, 2, 10, 4, C.W); R(24, 3, 8, 3, C.W); });
  F.sun = mk(32, 32, (R) => disc(R, 16, 16, 13, C.Y));
  F.cal = mk(28, 26, (R, x) => {
    R(2, 4, 24, 20, C.W); R(2, 4, 24, 8, C.P); dtext(x, 'MON', 6, 5, 1, C.W); R(7, 1, 2, 5, C.K); R(19, 1, 2, 5, C.K);
    dtext(x, '9:00', 3, 14, 1, C.K);
  });
  F.olive = mk(11, 11, (R) => { disc(R, 5, 5, 4, C.P); R(3, 3, 2, 2, C.B); });
  F.ice = mk(12, 12, (R) => { R(1, 1, 10, 10, C.W); R(2, 2, 3, 2, C.L); R(7, 7, 2, 2, C.B); });
  F.wave = [0, 1].map(f => mk(46, 14, (R) => {
    R(2, 6, 42, 7, C.B); R(8, 3, 30, 3, C.B); R(16, 1, 14, 2, C.B);
    R(10 + f * 3, 3, 4, 1, C.W); R(20 - f * 2, 1, 4, 1, C.W); R(30 + f * 2, 3, 4, 1, C.W);
  }));
  F.palm = mk(64, 100, (R) => {
    for (let i = 0; i < 72; i++) { const x = 29 + Math.round(Math.sin(i / 24) * 5); R(x, 26 + i, 5, 1, (Math.floor(i / 4) % 2) ? C.K : C.B); }
    const fr = [[-1.2, -0.25], [1.2, -0.25], [-1, 0.35], [1, 0.35], [0.3, -0.9], [-0.4, -0.85]];
    fr.forEach(([dx, dy], j) => { for (let t = 0; t < 24; t++) R(Math.round(31 + dx * t), Math.round(26 + dy * t + (t * t) / 38), 3, 2, (t + j) % 3 ? C.P : C.B); });
    R(26, 27, 5, 5, C.Y); R(32, 28, 5, 5, C.Y);
  });
  F.umbrella = mk(64, 70, (R) => {
    const cx = 32, top = 2, rr = 28;
    for (let dy = 0; dy < 15; dy++) {
      const hw = Math.round(Math.sqrt(Math.max(0, 1 - Math.pow((14 - dy) / 14, 2))) * rr);
      for (let xx = -hw; xx <= hw; xx++) R(cx + xx, top + dy, 1, 1, (Math.floor((xx + rr) / 7) % 2) ? C.W : C.P);
    }
    R(cx, top + 15, 2, 50, C.K);
  });
  // Bosses
  const bigClient = shirt => [0, 1].map(f => mk(90, 124, (R, x) => {
    R(30, 98, 12, 18, C.K); R(48, 98, 12, 18, C.K); R(26, 114, 18, 6, C.K); R(46, 114, 18, 6, C.K);
    R(30, 115, 3, 1, C.B); R(50, 115, 3, 1, C.B);
    R(20, 42, 50, 6, C.K); R(16, 46, 58, 52, C.K);
    for (let i = 0; i < 24; i++) { const hw = Math.max(1, 9 - Math.floor(i * 0.38)); R(45 - hw, 46 + i, hw * 2, 1, C.W); }
    R(42, 47, 6, 4, C.P); for (let i = 0; i < 22; i++) { const hw = i < 16 ? 2 + Math.floor(i / 6) : Math.max(1, 4 - (i - 16)); R(45 - hw, 51 + i, hw * 2, 1, C.P); }
    for (let i = 0; i < 16; i++) { R(34 + Math.floor(i * 0.6), 46 + i, 1, 1, C.B); R(55 - Math.floor(i * 0.6), 46 + i, 1, 1, C.B); }
    R(60, 58, 6, 3, C.W); R(61, 56, 2, 2, C.P); R(64, 56, 2, 2, C.Y);
    R(43, 92, 4, 3, C.Y);
    R(22, 62, 19, 9, C.W); dtext(x, 'CEO', 23, 63, 1, C.K);
    R(6, 48, 12, 40, C.K); R(72, 48, 12, 40, C.K); R(6, 88, 12, 9, C.L); R(72, 88, 12, 9, C.L);
    R(1, 97, 22, 18, C.B); R(8, 93, 8, 2, C.K); R(8, 93, 2, 5, C.K); R(14, 93, 2, 5, C.K); R(10, 104, 4, 3, C.Y); R(1, 106, 22, 1, C.K);
    R(78, 74, 9, 15, C.K); R(80, 76, 5, 10, C.P);
    R(36, 40, 18, 6, C.L);
    R(22, 8, 46, 36, C.L); R(25, 5, 40, 4, C.L); R(20, 14, 50, 26, C.L);
    R(32, 42, 26, 1, C.B);
    R(16, 20, 5, 12, C.L); R(69, 20, 5, 12, C.L); R(17, 23, 2, 6, C.B); R(71, 23, 2, 6, C.B);
    R(24, 4, 42, 2, C.K); for (let i = 0; i < 7; i++) R(25 + i * 6, 6, 4, 2, C.K); R(20, 10, 4, 10, C.K); R(66, 10, 4, 10, C.K);
    for (let i = 0; i < 12; i++) { R(28 + i, 15 + Math.floor(i / 3), 1, 3, C.K); R(61 - i, 15 + Math.floor(i / 3), 1, 3, C.K); }
    R(30, 21, 9, 5, C.W); R(51, 21, 9, 5, C.W); R(31, 22, 3, 3, C.K); R(52, 22, 3, 3, C.K);
    R(43, 22, 5, 10, C.B); R(42, 29, 7, 3, C.B); R(26, 28, 5, 3, C.B); R(59, 28, 5, 3, C.B);
    if (f === 0) { R(32, 34, 26, 5, C.K); R(34, 35, 22, 2, C.W); R(48, 35, 3, 2, C.Y); }
    else { R(32, 32, 26, 10, C.K); R(34, 33, 22, 2, C.W); R(38, 37, 14, 4, C.P); R(48, 33, 3, 2, C.Y); }
    if (shirt) {
      // GUDQUEST version: white shirt with rolled sleeves, thin reading glasses
      R(16, 46, 58, 52, C.W); R(6, 48, 12, 22, C.W); R(72, 48, 12, 22, C.W); R(6, 68, 12, 3, C.B); R(72, 68, 12, 3, C.B);
      R(6, 71, 12, 26, C.L); R(72, 71, 12, 26, C.L); R(18, 48, 1, 48, C.B); R(71, 48, 1, 48, C.B);
      R(36, 46, 9, 5, C.B); R(46, 46, 9, 5, C.B); R(38, 46, 15, 3, C.W);
      R(42, 47, 6, 4, C.P); for (let i = 0; i < 22; i++) { const hw = i < 16 ? 2 + Math.floor(i / 6) : Math.max(1, 4 - (i - 16)); R(45 - hw, 51 + i, hw * 2, 1, C.P); }
      for (let i = 0; i < 4; i++) R(45, 76 + i * 5, 1, 2, C.K);
      R(56, 56, 10, 9, C.B); R(57, 57, 8, 7, C.W); R(61, 53, 2, 6, C.P); R(64, 54, 1, 5, C.K);
      R(16, 92, 58, 6, C.K); R(43, 92, 4, 3, C.Y);
      const fr = (gx, gy, w, h) => { R(gx, gy, w, 1, C.K); R(gx, gy + h - 1, w, 1, C.K); R(gx, gy, 1, h, C.K); R(gx + w - 1, gy, 1, h, C.K); };
      fr(28, 19, 13, 9); fr(49, 19, 13, 9); R(41, 21, 8, 1, C.K); R(20, 21, 8, 1, C.K); R(62, 21, 8, 1, C.K);
    }
  }));
  SPR.client = bigClient(false);
  SPR.clientQ = bigClient(true);
  SPR.hangover = [0, 1].map(f => mk(100, 122, (R) => {
    R(4, 10, 92, 4, C.W);
    for (let i = 0; i < 50; i++) { const hw = Math.round(46 - i * 0.86); R(50 - hw, 14 + i, hw * 2, 1, C.B); R(50 - hw, 14 + i, 2, 1, C.W); R(50 + hw - 2, 14 + i, 2, 1, C.W); }
    R(8, 15, 84, 1, C.P);
    for (let i = 0; i < 22; i++) R(86 - i, 1 + i, 2, 1, C.K);
    R(70, 4, 11, 9, C.P); R(72, 3, 7, 11, C.P); R(73, 6, 4, 3, C.B);
    R(12, 36, 11, 3, C.K); R(5, 32, 8, 8, C.W); R(77, 36, 11, 3, C.K); R(87, 32, 8, 8, C.W);
    R(18, 22, 26, 11, C.K); R(56, 22, 26, 11, C.K); R(44, 24, 12, 3, C.K);
    R(21, 24, 4, 2, C.W); R(25, 26, 2, 1, C.W); R(59, 24, 4, 2, C.W); R(63, 26, 2, 1, C.W);
    if (f === 0) { R(36, 40, 28, 4, C.K); R(34, 42, 3, 3, C.K); R(63, 42, 3, 3, C.K); }
    else { R(37, 38, 26, 12, C.K); R(39, 39, 22, 2, C.W); R(41, 44, 18, 5, C.P); }
    R(30, 50, 2, 2, C.W); R(62, 54, 2, 2, C.W); R(46, 58, 2, 2, C.W);
    R(46, 64, 8, 44, C.W); R(48, 64, 2, 44, C.L);
    R(30, 107, 40, 3, C.W); R(24, 110, 52, 6, C.W);
  }));
}

/* ---------------------------------------------------------------------
   3. CUSTOM ASSETS — optional PNGs listed in /assets/manifest.js
   --------------------------------------------------------------------- */
const ASSETS = {};
(function loadAssets() {
  const M = window.GUD_ASSETS || {};
  Object.keys(M).forEach(key => {
    const def = typeof M[key] === 'string' ? { src: M[key] } : M[key];
    if (!def || !def.src) return;
    const img = new Image();
    img.onload = () => { ASSETS[key] = { img, frames: Math.max(1, def.frames || 1), fps: def.fps || 10 }; };
    img.onerror = () => { /* fallback to built-in pixel art */ };
    img.src = CFG.assetBase + def.src;
  });
})();
function drawCustom(c, key, x, y, w, h, t) {
  const a = ASSETS[key]; if (!a) return false;
  const fw = a.img.width / a.frames, fh = a.img.height;
  const s = Math.min(w / fw, h / fh), dw = Math.round(fw * s), dh = Math.round(fh * s);
  const fr = Math.floor((t || 0) * a.fps) % a.frames;
  c.drawImage(a.img, fr * fw, 0, fw, fh, Math.round(x + (w - dw) / 2), Math.round(y + h - dh), dw, dh);
  return true;
}

/* ---------------------------------------------------------------------
   4. AUDIO — authentic 8-bit synth (square / triangle / noise)
   --------------------------------------------------------------------- */
const AU = { ctx: null, master: null, noise: null, muted: store.get('gud_muted') === '1' };
AU.init = function () {
  if (!this.ctx) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { return; }
    this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate, b = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = b;
  }
  if (this.ctx.state === 'suspended') this.ctx.resume();
};
AU.setMute = function (m) {
  this.muted = m; store.set('gud_muted', m ? '1' : '0');
  if (this.master) this.master.gain.setValueAtTime(m ? 0 : 0.5, this.ctx.currentTime);
};
HOOKS.mute.push(m => AU.setMute(m));
window.addEventListener('storage', e => { if (e.key === 'gud_muted') AU.setMute(e.newValue === '1'); });
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
function tn(f, d, o) {
  o = o || {}; const a = AU.ctx; if (!a || a.state !== 'running') return;
  const t = o.t != null ? o.t : a.currentTime + (o.at || 0);
  const osc = a.createOscillator(), g = a.createGain();
  osc.type = o.type || 'square'; osc.frequency.setValueAtTime(f, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + d);
  const v = o.vol || 0.1;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.005);
  g.gain.setValueAtTime(v, t + d * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  osc.connect(g); g.connect(AU.master); osc.start(t); osc.stop(t + d + 0.05);
}
function nz(d, o) {
  o = o || {}; const a = AU.ctx; if (!a || a.state !== 'running') return;
  const t = o.t != null ? o.t : a.currentTime + (o.at || 0);
  const s = a.createBufferSource(); s.buffer = AU.noise;
  const fl = a.createBiquadFilter(); fl.type = o.ft || 'lowpass'; fl.frequency.setValueAtTime(o.f || 2000, t);
  if (o.fto) fl.frequency.exponentialRampToValueAtTime(o.fto, t + d);
  const g = a.createGain(); g.gain.setValueAtTime(o.vol || 0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  s.connect(fl); fl.connect(g); g.connect(AU.master); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.05);
}
function mel(notes, step, o) {
  o = o || {};
  notes.forEach((n, i) => { if (n) tn(NOTE(n), (o.len || step) * 0.95, Object.assign({}, o, { at: (o.at || 0) + i * step })); });
}
const SFX = {
  start() { mel([72, 76, 79, 84, 79, 84, 88], 0.07, { vol: 0.08 }); mel([48, 55, 60], 0.15, { type: 'triangle', vol: 0.16 }); },
  jump() { tn(320, 0.13, { to: 760, vol: 0.07 }); },
  shoot() { tn(1400, 0.1, { to: 170, vol: 0.06 }); nz(0.05, { ft: 'highpass', f: 3000, vol: 0.04 }); },
  bonus() { mel([88, 91, 96, 100], 0.05, { vol: 0.07 }); },
  hurt() { tn(220, 0.28, { to: 55, vol: 0.12, type: 'sawtooth' }); nz(0.22, { f: 700, vol: 0.14 }); },
  drain() { tn(300, 0.4, { to: 120, vol: 0.08, type: 'triangle' }); mel([64, 63, 62], 0.12, { vol: 0.04, at: 0.1 }); },
  giant() { for (let i = 0; i < 6; i++) tn(i % 2 ? 1046 : 523, 0.05, { at: i * 0.05, vol: 0.06, type: 'sawtooth' }); nz(0.3, { ft: 'bandpass', f: 1500, vol: 0.12 }); },
  slam() { tn(130, 0.25, { to: 40, type: 'triangle', vol: 0.28 }); nz(0.2, { f: 500, vol: 0.2 }); },
  shatter() { nz(0.3, { ft: 'highpass', f: 2000, fto: 7000, vol: 0.07 }); mel([84, 79, 74, 67], 0.035, { vol: 0.04 }); },
  pop() { tn(600, 0.06, { to: 300, vol: 0.05 }); nz(0.05, { f: 4000, vol: 0.05 }); },
  bossAppear() { for (let i = 0; i < 4; i++) tn(440, 0.22, { to: 880, at: i * 0.26, vol: 0.07 }); tn(55, 1.1, { type: 'triangle', vol: 0.22 }); },
  bossHit() { nz(0.06, { f: 1400, vol: 0.1 }); tn(170, 0.08, { to: 80, vol: 0.07 }); },
  bossDefeat() {
    nz(1.0, { f: 3000, fto: 80, vol: 0.28 }); tn(300, 0.9, { to: 40, vol: 0.09, type: 'sawtooth' });
    mel([72, 76, 79, 84, 79, 84, 88, 91, 96], 0.09, { at: 1.0, vol: 0.08 }); mel([48, 52, 55, 60], 0.18, { at: 1.0, type: 'triangle', vol: 0.15 });
  },
  gameOver() { mel([67, 66, 65, 64], 0.3, { vol: 0.08 }); tn(NOTE(40), 1.0, { at: 1.2, type: 'triangle', vol: 0.2 }); },
  weekend() {
    mel([72, 76, 79, 84, 76, 79, 84, 88, 0, 91, 91, 96], 0.08, { vol: 0.08 });
    mel([48, 0, 55, 0, 52, 0, 57, 0, 60], 0.08, { type: 'triangle', vol: 0.16 });
    [0, 0.32, 0.64, 0.8].forEach(at => nz(0.06, { at, ft: 'highpass', f: 1800, vol: 0.08 }));
  },
  hack() { mel([84, 79, 88, 91, 96], 0.06, { vol: 0.08 }); tn(NOTE(108), 0.3, { at: 0.3, type: 'triangle', vol: 0.05 }); },
  denied() { tn(110, 0.3, { type: 'sawtooth', vol: 0.1 }); tn(104, 0.3, { type: 'square', vol: 0.05, at: 0.05 }); },
  chime() { const n = pick([84, 86, 88, 91, 93, 96]); tn(NOTE(n), 0.45, { type: 'triangle', vol: 0.045 }); tn(NOTE(n + 12), 0.3, { type: 'triangle', vol: 0.015, at: 0.14 }); },
  day() { mel([76, 84, 88], 0.09, { vol: 0.06 }); },
  thud() { tn(90, 0.12, { to: 50, type: 'triangle', vol: 0.15 }); }
};
// Beach chiptune loop
const MUSIC = {
  bpm: 112,
  mel: [76, 0, 79, 81, 84, 0, 81, 79, 76, 0, 74, 76, 79, 0, 0, 0, 72, 0, 74, 76, 79, 0, 76, 74, 72, 0, 69, 72, 74, 0, 0, 0],
  bass: [48, 0, 55, 0, 53, 0, 60, 0, 45, 0, 52, 0, 50, 0, 57, 0, 48, 0, 55, 0, 53, 0, 60, 0, 43, 0, 50, 0, 55, 0, 43, 0],
  timer: null, next: 0, step: 0
};
function startMusic() {
  stopMusic(); if (!AU.ctx) return;
  MUSIC.next = AU.ctx.currentTime + 0.1; MUSIC.step = 0;
  MUSIC.timer = setInterval(() => {
    if (!AU.ctx || AU.ctx.state !== 'running') return;
    const st = 60 / MUSIC.bpm / 2;
    while (MUSIC.next < AU.ctx.currentTime + 0.25) {
      const i = MUSIC.step % 32, t = MUSIC.next;
      if (MUSIC.mel[i]) tn(NOTE(MUSIC.mel[i]), st * 0.85, { t, type: 'square', vol: 0.03 });
      if (MUSIC.bass[i]) tn(NOTE(MUSIC.bass[i]), st * 1.6, { t, type: 'triangle', vol: 0.09 });
      if (i % 2 === 1) nz(0.03, { t, ft: 'highpass', f: 6000, vol: 0.012 });
      MUSIC.next += st; MUSIC.step++;
    }
  }, 60);
}
function stopMusic() { if (MUSIC.timer) clearInterval(MUSIC.timer); MUSIC.timer = null; }

/* @@GAME@@ */
})();
