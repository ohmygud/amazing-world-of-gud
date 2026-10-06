// Exports EVERY visual asset and sound of the games, straight from the real built pages.
// Needs a static server on docs/: python3 -m http.server 8800 --directory docs
// node tools/export_library.mjs build/library.json
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const BASE = process.env.GUD_BASE || 'http://localhost:8800/';
const SITE = p => readFileSync(new URL('../docs/' + p, import.meta.url), 'utf8');

// shared helpers injected in both games (they run inside the engine scope)
const COMMON = `
const __OUT = { img: {}, snd: {} };
function __add(name, c) { if (!c || !c.width) return; const x = c.getContext('2d'); const d = x.getImageData(0, 0, c.width, c.height).data; let s = ''; for (let i = 0; i < d.length; i += 8192) s += String.fromCharCode.apply(null, d.subarray(i, i + 8192)); __OUT.img[name] = { w: c.width, h: c.height, b64: btoa(s) }; }
function __wav(buf) {
  const ch = buf.getChannelData(0), n = ch.length, b = new ArrayBuffer(44 + n * 2), v = new DataView(b);
  const W = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  W(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); W(8, 'WAVE'); W(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, buf.sampleRate, true); v.setUint32(28, buf.sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); W(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, ch[i])) * 32767, true);
  const u = new Uint8Array(b); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s);
}
async function __rec(name, dur, fn) {
  const SR = 44100, off = new OfflineAudioContext(1, Math.ceil(SR * dur), SR);
  const keep = { ctx: AU.ctx, master: AU.master, noise: AU.noise };
  AU.ctx = new Proxy(off, { get(t, k) { if (k === 'state') return 'running'; const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; } });
  AU.master = off.createGain(); AU.master.gain.value = 0.5; AU.master.connect(off.destination);
  const nb = off.createBuffer(1, SR, SR), nd = nb.getChannelData(0); for (let i = 0; i < SR; i++) nd[i] = Math.random() * 2 - 1; AU.noise = nb;
  try { fn(); } catch (e) { console.error(name, e); }
  const buf = await off.startRendering();
  Object.assign(AU, keep);
  __OUT.snd[name] = __wav(buf);
}
async function __song(name, sg, loops, noiseOn) {
  const st = 60 / sg.bpm / 2, steps = 32 * loops;
  await __rec(name, steps * st + 1.2, () => {
    for (let s = 0; s < steps; s++) {
      const i = s % 32, t = 0.05 + s * st;
      if (sg.mel[i]) tn(NOTE(sg.mel[i]), st * (sg.ml || 0.9), { t, type: 'square', vol: sg.mv || 0.028 });
      if (sg.bass[i]) tn(NOTE(sg.bass[i]), st * (sg.bl || 1.5), { t, type: 'triangle', vol: sg.bv || 0.085 });
      if (noiseOn && i % 2) nz(0.03, { t, ft: 'highpass', f: 6000, vol: sg.nv || 0.014 });
    }
  });
}
`;

const QUEST = COMMON + `
window.__EXPORT = async function () {
  const dirs = ['down', 'up', 'left', 'right'];
  Object.keys(LOOKS).forEach(k => dirs.forEach(d => [0, 1, 2].forEach(f => __add('quest-characters/' + k + '/' + k + '-' + d + '-' + f, person(k, d, f)))));
  __add('quest-characters/gud/gud-battle-back-0', gudBack(0)); __add('quest-characters/gud/gud-battle-back-1', gudBack(1));
  dirs.forEach(d => [0, 1].forEach(f => __add('quest-characters/ludo/ludo-' + d + '-' + f, ludo(d, f))));
  MONS.forEach((m, i) => { __add('quest-gudmon/' + m.id, monSprite(m)); __add('quest-gudmon/' + m.id + '-blink', monSprite(m, true)); });
  ENEMY_KEYS.concat(['logo', 'client']).forEach(k => (enemyFrames(k) || []).forEach((c, i) => __add('quest-enemies/' + (k === 'client' ? 'big-client' : k) + '-' + i, c)));
  Object.keys(TILES).forEach(k => { const n = { '.': 'grass', ':': 'flowers', '=': 'path', '"': 'tall-grass', '~0': 'water-0', '~1': 'water-1', '[': 'wall-left', ']': 'wall-right', ' ': 'void', '#': 'wall', 'D': 'door-mat', 'T': 'tree-tile', '_': 'floor', M: 'city-wall', m: 'city-wall-top', o: 'checker-floor', H: 'room-wall-base', h: 'room-wall' }[k] || ('tile-' + k.charCodeAt(0)); __add('quest-tiles/' + n, TILES[k]); });
  const walk = (o, p) => { Object.keys(o).forEach(k => { const v = o[k]; if (v && v.getContext) __add(p + k, v); else if (Array.isArray(v)) v.forEach((c, i) => c && c.getContext && __add(p + k + '-' + i, c)); else if (v && typeof v === 'object') walk(v, p + k + '-'); }); };
  walk(Object.fromEntries(Object.entries(SP).filter(([k]) => k !== 'mons')), 'quest-objects/');
  BUILDINGS.forEach(b => b.spr && __add('quest-buildings/' + b.id, b.spr));
  for (let i = 0; i < 6; i++) [true, false].forEach(own => { ctx.clearRect(0, 0, 20, 20); drawBadge(i, 0, 0, own); const c = document.createElement('canvas'); c.width = 16; c.height = 16; c.getContext('2d').putImageData(ctx.getImageData(0, 0, 16, 16), 0, 0); __add('quest-badges/badge-' + (i + 1) + (own ? '' : '-locked'), c); });
  for (const k of Object.keys(J)) await __rec('gudquest/sfx-' + k, 2.2, () => J[k]());
  for (const k of Object.keys(SONGS)) await __song('gudquest/music-' + k, SONGS[k], 2, k !== 'town' && k !== 'hof');
  __OUT.usage = []; Object.values(MAPS).forEach(m => m.npcs.forEach(n => __OUT.usage.push([n.look, String(tr(n.name) || n.script || ''), String(tr(m.title) || m.id)])));
  return __OUT;
};
`;

const TGIF = COMMON + `
window.__EXPORT = async function () {
  const poses = { idle: 2, run: 4, shoot: 4, jump: 1, jumpshoot: 1, duck: 2, hurt: 1, collect: 1, victory: 2, defeat: 1, beach: 2, beachjump: 1 };
  Object.keys(poses).forEach(p => { for (let f = 0; f < poses[p]; f++) __add('tgif-gud/gud-' + p + '-' + f, gud(p, f)); });
  Object.keys(SPR.bn).forEach(k => SPR.bn[k].forEach((c, i) => __add('tgif-bonus/' + k + '-' + i, c)));
  Object.keys(SPR.ob).forEach(k => SPR.ob[k].forEach((c, i) => __add('tgif-obstacles/' + k + '-' + i, c)));
  SPR.client.forEach((c, i) => __add('tgif-bosses/big-client-' + i, c)); SPR.hangover.forEach((c, i) => __add('tgif-bosses/hangover-' + i, c));
  Object.keys(SPR.fx).forEach(k => { const v = SPR.fx[k]; if (Array.isArray(v)) v.forEach((c, i) => __add('tgif-fx/' + k + '-' + i, c)); else __add('tgif-fx/' + k, v); });
  for (const k of Object.keys(SFX)) await __rec('tgif/sfx-' + k, k === 'bossDefeat' || k === 'gameOver' ? 3.2 : 2.2, () => SFX[k]());
  await __song('tgif/music-beach', { bpm: MUSIC.bpm, mel: MUSIC.mel, bass: MUSIC.bass, ml: 0.85, mv: 0.03, bl: 1.6, bv: 0.09, nv: 0.012 }, 2, true);
  return __OUT;
};
`;

const b = await chromium.launch();
const all = { img: {}, snd: {}, shots: {} };
async function grab(path, marker, code, ready, shots) {
  const ctx = await b.newContext({ viewport: { width: 1100, height: 760 }, locale: 'it-IT' });
  await ctx.addInitScript(() => { try { localStorage.setItem('gud_lang', 'it'); localStorage.setItem('gud_muted', '0'); } catch (e) { /* */ } });
  const html = SITE(path);
  if (!html.includes(marker)) throw new Error('marker not found in ' + path);
  await ctx.route('**/' + path, r => r.fulfill({ contentType: 'text/html', body: html.replace(marker, code + '\n' + marker) }));
  const p = await ctx.newPage(); p.on('pageerror', e => console.error('ERR', path, e.message));
  await p.goto(BASE + path); await p.waitForFunction(ready, null, { timeout: 20000 });
  const out = await p.evaluate(() => window.__EXPORT());
  Object.assign(all.img, out.img); Object.assign(all.snd, out.snd); if (out.usage) all.usage = out.usage;
  if (shots) await shots(p, (n) => p.locator('canvas#game').screenshot().then(buf => { all.shots[n] = buf.toString('base64'); }));
  await ctx.close();
}
await grab('quest/desktop/index.html', 'window.GUDQ = {', QUEST, () => window.GUDQ && window.GUDQ.MAPS && window.GUDQ.MAPS.town, async (p, shot) => {
  await p.waitForTimeout(600); await shot('gudquest-title');
  for (let i = 0; i < 90; i++) { const sc = await p.evaluate(() => GUDQ.S.scene + ':' + GUDQ.S.busy); if (/^world:false/.test(sc)) break; await p.keyboard.press(i % 2 ? 'z' : 'Enter'); await p.waitForTimeout(220); }
  await p.waitForTimeout(500); await shot('gudquest-home');
  for (const [m, x, y] of [['town', 18, 12], ['town', 20, 28], ['town', 26, 36], ['centro', 5, 5], ['teaching', 6, 6], ['lucca', 6, 6]]) {
    try { await p.evaluate(([m, x, y]) => GUDQ.goTo(m, x, y, 'down'), [m, x, y]); await p.waitForTimeout(700); await p.keyboard.down('ArrowDown'); await p.waitForTimeout(260); await p.keyboard.up('ArrowDown'); await p.waitForTimeout(400); await shot('gudquest-' + m + '-' + x + '-' + y); } catch (e) { /* */ }
  }
});
await grab('tgif/desktop/index.html', 'loadContent().then(', TGIF, () => true, async (p, shot) => {
  await p.waitForTimeout(800); await shot('tgif-intro');
  await p.click('[data-do=start]').catch(() => {}); await p.waitForTimeout(3500); await shot('tgif-week');
});
await b.close();
writeFileSync(process.argv[2] || 'build/library.json', JSON.stringify(all));
console.log('images', Object.keys(all.img).length, 'sounds', Object.keys(all.snd).length, 'screens', Object.keys(all.shots).length);
