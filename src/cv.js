/* =====================================================================
   GUDQUEST · PINK VERSION — an interactive CV with handheld-RPG logic
   Uses the same font, palette, sprites and synth as Thank GUD It's Friday.
   ===================================================================== */
const cvs = $('game'), ctx = cvs.getContext('2d'), stage = $('stage');
const T = 16;
let W = 384, H = 240, KS = 1;
function resize() {
  const r = stage.getBoundingClientRect();
  const bw = Math.max(60, r.width), bh = Math.max(60, r.height);
  if (MOBILE) { W = 240; H = Math.round(clamp(W * bh / bw, 224, 420)); }
  else { H = 240; W = Math.round(clamp(H * bw / bh, 320, 432)); }
  const s = Math.min(bw / W, bh / H), dpr = window.devicePixelRatio || 1;
  KS = Math.max(1, Math.ceil(s * dpr));
  cvs.width = W * KS; cvs.height = H * KS;
  cvs.style.width = Math.floor(W * s) + 'px'; cvs.style.height = Math.floor(H * s) + 'px';
}

/* ---------------- STATE ---------------- */
const SAVE_KEY = 'gudquest_v1';
const S = {
  scene: 'boot', time: 0, lang: null, paused: false,
  map: 'home', px: 6, py: 5, dir: 'down', moving: false, mt: 0, fx: 0, fy: 0, step: 0, bump: 0,
  ui: [], busy: false, timers: [], fade: 0, battle: null,
  lv: 30, hp: 120, maxhp: 120, pp: [15, 20, 10, 5], coffee: 3,
  badges: [], caught: [], seen: [], hof: false, introDone: false
};
const tr = o => (o == null ? '' : typeof o === 'string' ? o : (o[S.lang || 'it'] || o.it));
function save() {
  const d = { lang: S.lang, map: S.map, px: S.px, py: S.py, dir: S.dir, lv: S.lv, hp: S.hp, maxhp: S.maxhp, pp: S.pp, coffee: S.coffee, badges: S.badges, caught: S.caught, seen: S.seen, hof: S.hof, introDone: S.introDone };
  store.set(SAVE_KEY, JSON.stringify(d));
}
function load() { try { const d = JSON.parse(store.get(SAVE_KEY) || 'null'); return d && d.introDone ? d : null; } catch (e) { return null; } }

/* ---------------- INPUT ---------------- */
const held = { up: false, down: false, left: false, right: false };
const pressed = new Set();
function press(k) { pressed.add(k); AU.init(); }
const KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'a', Space: 'a', KeyX: 'b', Escape: 'b', Backspace: 'b', Enter: 'start', KeyM: 'start' };
window.addEventListener('keydown', e => {
  if (cvOpen) { if (e.key === 'Escape') closeQuickCV(); return; }
  const k = KEYS[e.code]; if (!k) return;
  const tag = e.target && e.target.tagName; if (tag === 'BUTTON' && (k === 'a' || k === 'start')) return;
  e.preventDefault();
  if (held[k] !== undefined) { if (!held[k]) press(k); held[k] = true; } else if (!e.repeat) press(k);
});
window.addEventListener('keyup', e => { const k = KEYS[e.code]; if (k && held[k] !== undefined) held[k] = false; });
window.addEventListener('blur', () => { Object.keys(held).forEach(k => { held[k] = false; }); });
document.querySelectorAll('[data-k]').forEach(btn => {
  const k = btn.dataset.k;
  const on = e => { e.preventDefault(); try { btn.setPointerCapture(e.pointerId); } catch (_) { /* */ } btn.classList.add('on'); if (held[k] !== undefined) held[k] = true; press(k); };
  const off = () => { btn.classList.remove('on'); if (held[k] !== undefined) held[k] = false; };
  btn.addEventListener('pointerdown', on); btn.addEventListener('pointerup', off); btn.addEventListener('pointercancel', off);
  btn.addEventListener('lostpointercapture', off); btn.addEventListener('contextmenu', e => e.preventDefault());
});
cvs.addEventListener('pointerdown', () => { AU.init(); try { cvs.focus({ preventScroll: true }); } catch (e) { /* */ } });
document.addEventListener('visibilitychange', () => { S.paused = document.hidden; });

/* ---------------- ASYNC HELPERS ---------------- */
function wait(sec) { return new Promise(res => S.timers.push({ t: sec, res })); }
function pushUI(layer) { return new Promise(res => { layer.resolve = v => { S.ui.splice(S.ui.indexOf(layer), 1); res(v); }; S.ui.push(layer); }); }
const topUI = () => S.ui[S.ui.length - 1];

/* ---------------- AUDIO (reuses the arcade synth) ---------------- */
const SONGS = {
  town: { bpm: 118, mel: [72, 0, 76, 79, 77, 76, 74, 0, 72, 0, 74, 76, 74, 0, 0, 0, 69, 0, 72, 76, 74, 72, 71, 0, 72, 0, 67, 0, 72, 0, 0, 0],
    bass: [48, 0, 55, 0, 53, 0, 55, 0, 48, 0, 55, 0, 50, 0, 55, 0, 45, 0, 52, 0, 50, 0, 55, 0, 48, 0, 43, 0, 48, 0, 55, 0] },
  battle: { bpm: 152, mel: [69, 72, 76, 72, 69, 72, 76, 79, 77, 76, 74, 72, 74, 0, 71, 0, 69, 72, 76, 72, 81, 79, 77, 76, 74, 76, 77, 74, 76, 0, 0, 0],
    bass: [45, 45, 57, 45, 45, 45, 57, 45, 41, 41, 53, 41, 43, 43, 55, 43, 45, 45, 57, 45, 41, 41, 53, 41, 43, 43, 55, 43, 45, 0, 45, 0] },
  boss: { bpm: 164, mel: [64, 0, 64, 67, 64, 0, 70, 69, 64, 0, 64, 67, 71, 72, 71, 67, 64, 0, 64, 67, 64, 0, 70, 69, 76, 74, 72, 71, 72, 71, 69, 0],
    bass: [40, 40, 52, 40, 40, 40, 52, 40, 43, 43, 55, 43, 38, 38, 50, 38, 40, 40, 52, 40, 40, 40, 52, 40, 36, 36, 48, 36, 38, 38, 50, 38] },
  hof: { bpm: 96, mel: [72, 0, 79, 0, 77, 76, 74, 76, 72, 0, 79, 0, 84, 0, 0, 0, 81, 0, 79, 77, 76, 77, 79, 0, 77, 76, 74, 72, 72, 0, 0, 0],
    bass: [48, 0, 48, 0, 53, 0, 53, 0, 48, 0, 48, 0, 55, 0, 55, 0, 53, 0, 53, 0, 48, 0, 48, 0, 55, 0, 43, 0, 48, 0, 48, 0] },
  title: { bpm: 126, mel: [76, 79, 84, 0, 83, 81, 79, 0, 76, 79, 81, 79, 76, 0, 0, 0, 77, 81, 84, 0, 83, 81, 79, 76, 74, 76, 77, 74, 72, 0, 0, 0],
    bass: [48, 0, 55, 0, 52, 0, 55, 0, 45, 0, 52, 0, 48, 0, 52, 0, 41, 0, 48, 0, 45, 0, 48, 0, 43, 0, 50, 0, 48, 0, 43, 0] }
};
const MUS = { name: null, timer: null, next: 0, step: 0 };
function playSong(name) {
  if (MUS.name === name && MUS.timer) return;
  stopSong(); MUS.name = name; if (!AU.ctx) return;
  MUS.next = AU.ctx.currentTime + 0.08; MUS.step = 0;
  MUS.timer = setInterval(() => {
    if (!AU.ctx || AU.ctx.state !== 'running' || S.paused) return;
    const sg = SONGS[MUS.name]; if (!sg) return; const st = 60 / sg.bpm / 2;
    if (MUS.next < AU.ctx.currentTime - 0.5) MUS.next = AU.ctx.currentTime + 0.05;
    while (MUS.next < AU.ctx.currentTime + 0.25) {
      const i = MUS.step % 32, t = MUS.next;
      if (sg.mel[i]) tn(NOTE(sg.mel[i]), st * 0.9, { t, type: 'square', vol: 0.028 });
      if (sg.bass[i]) tn(NOTE(sg.bass[i]), st * 1.5, { t, type: 'triangle', vol: 0.085 });
      if (MUS.name !== 'town' && MUS.name !== 'hof' && i % 2) nz(0.03, { t, ft: 'highpass', f: 6000, vol: 0.014 });
      MUS.next += st; MUS.step++;
    }
  }, 60);
}
function stopSong() { if (MUS.timer) clearInterval(MUS.timer); MUS.timer = null; }
function ensureSong() { if (MUS.name && !MUS.timer && AU.ctx) { const n = MUS.name; MUS.name = null; playSong(n); } }
const J = {
  blip() { tn(1200, 0.03, { vol: 0.03 }); },
  select() { tn(880, 0.05, { vol: 0.05 }); tn(1320, 0.06, { vol: 0.04, at: 0.05 }); },
  bump() { tn(110, 0.08, { type: 'triangle', vol: 0.12 }); },
  door() { nz(0.12, { f: 1200, vol: 0.08 }); tn(300, 0.1, { to: 200, vol: 0.05, at: 0.05 }); },
  heal() { mel([72, 76, 79, 84, 79, 84, 88], 0.11, { vol: 0.06, type: 'triangle' }); mel([72, 76, 79, 84, 79, 84, 88], 0.11, { vol: 0.03 }); },
  badge() { mel([72, 72, 72, 76, 79, 0, 76, 79, 84, 84], 0.1, { vol: 0.07 }); mel([48, 0, 52, 0, 55, 0, 52, 55, 60, 60], 0.1, { type: 'triangle', vol: 0.14 }); },
  catch() { mel([79, 84, 88, 91, 0, 88, 91, 96], 0.07, { vol: 0.06 }); },
  lvl() { mel([72, 76, 79, 84], 0.06, { vol: 0.06 }); },
  hit() { nz(0.12, { f: 1600, vol: 0.14 }); tn(160, 0.1, { to: 60, vol: 0.08 }); },
  superHit() { nz(0.2, { f: 2600, vol: 0.18 }); tn(220, 0.18, { to: 50, vol: 0.1, type: 'sawtooth' }); },
  miss() { tn(400, 0.15, { to: 900, vol: 0.04, type: 'triangle' }); },
  faint() { tn(600, 0.6, { to: 60, vol: 0.08 }); },
  grass() { nz(0.06, { ft: 'highpass', f: 3000, vol: 0.03 }); },
  encounter() { for (let i = 0; i < 6; i++) tn(i % 2 ? 1046 : 784, 0.06, { at: i * 0.06, vol: 0.05 }); },
  throw() { tn(500, 0.25, { to: 1200, vol: 0.05, type: 'triangle' }); },
  wiggle() { tn(220, 0.06, { vol: 0.06, type: 'triangle' }); }
};

/* ---------------- SPRITES ---------------- */
const SP = {};
const LOOKS = {
  gud: { hair: 'long', hc: C.K, top: C.P, bot: C.B, glasses: true, legs: C.K, shoe: C.P },
  mom: { hair: 'long', hc: C.B, top: C.W, bot: C.P, legs: C.L, shoe: C.K },
  prof: { hair: 'short', hc: C.W, top: C.W, bot: C.K, glasses: true, legs: C.K, shoe: C.K },
  client: { hair: 'bald', hc: C.K, top: C.K, bot: C.K, tie: true, legs: C.K, shoe: C.K },
  girl: { hair: 'long', hc: C.Y, top: C.Y, bot: C.P, legs: C.L, shoe: C.K },
  boy: { hair: 'short', hc: C.K, top: C.B, bot: C.K, legs: C.K, shoe: C.W },
  teach: { hair: 'short', hc: C.B, top: C.K, bot: C.K, glasses: true, legs: C.K, shoe: C.P },
  barista: { hair: 'long', hc: C.P, top: C.W, bot: C.P, legs: C.L, shoe: C.K },
  punk: { hair: 'short', hc: C.P, top: C.K, bot: C.K, legs: C.K, shoe: C.Y },
  critic: { hair: 'short', hc: C.Y, top: C.W, bot: C.K, glasses: true, legs: C.K, shoe: C.K },
  libr: { hair: 'long', hc: C.W, top: C.B, bot: C.K, glasses: true, legs: C.K, shoe: C.K },
  guard: { hair: 'short', hc: C.K, top: C.Y, bot: C.K, legs: C.K, shoe: C.K }
};
function personDraw(R, lk, dir, f) {
  const o = (x, y, w, h, c) => R(x + 1, y + 1, w, h, c);
  const SK = C.L;
  const legs = (a, b) => { o(5, 15, 2, a, lk.legs); o(9, 15, 2, b, lk.legs); o(4, 14 + a + 1, 3, 2, lk.shoe); o(9, 14 + b + 1, 3, 2, lk.shoe); };
  if (dir === 'down' || dir === 'up') {
    const front = dir === 'down';
    if (front) {
      o(4, 2, 8, 7, SK);
      if (lk.hair === 'long') { o(3, 0, 10, 3, lk.hc); o(2, 2, 3, 11, lk.hc); o(11, 2, 3, 11, lk.hc); o(4, 2, 8, 2, lk.hc); }
      if (lk.hair === 'short') { o(3, 0, 10, 3, lk.hc); o(2, 2, 2, 4, lk.hc); o(12, 2, 2, 4, lk.hc); o(4, 2, 8, 1, lk.hc); }
      if (lk.hair === 'bald') { o(4, 1, 8, 2, SK); o(3, 3, 1, 3, lk.hc); o(12, 3, 1, 3, lk.hc); }
      if (lk.glasses) { o(4, 4, 3, 3, C.K); o(9, 4, 3, 3, C.K); o(5, 5, 1, 1, C.W); o(10, 5, 1, 1, C.W); o(7, 5, 2, 1, C.K); }
      else { o(5, 5, 1, 2, C.K); o(10, 5, 1, 2, C.K); }
      o(7, 7, 2, 1, C.P);
    } else {
      if (lk.hair === 'long') o(3, 0, 10, 13, lk.hc);
      else if (lk.hair === 'short') { o(4, 2, 8, 7, SK); o(3, 0, 10, 7, lk.hc); }
      else { o(4, 1, 8, 8, SK); o(3, 3, 1, 3, lk.hc); o(12, 3, 1, 3, lk.hc); }
    }
    o(4, 9, 8, 5, lk.top);
    if (lk.tie && front) { o(7, 9, 2, 1, C.W); o(7, 10, 2, 4, C.P); }
    const aw = f === 1 ? 1 : 0;
    o(2, 10 - aw, 2, 4, SK); o(12, 10 - (f === 2 ? 1 : 0), 2, 4, SK);
    if (lk.hair === 'long' && front) { o(2, 9, 2, 3, lk.hc); o(12, 9, 2, 3, lk.hc); }
    o(3, 13, 10, 2, lk.bot);
    if (f === 1) legs(2, 3); else if (f === 2) legs(3, 2); else legs(3, 3);
  } else {
    o(5, 2, 7, 7, SK);
    if (lk.hair === 'long') { o(4, 0, 8, 3, lk.hc); o(2, 1, 5, 12, lk.hc); }
    if (lk.hair === 'short') { o(4, 0, 8, 3, lk.hc); o(3, 1, 4, 6, lk.hc); }
    if (lk.hair === 'bald') o(5, 1, 7, 2, SK);
    if (lk.glasses) { o(9, 4, 3, 3, C.K); o(10, 5, 1, 1, C.W); o(7, 5, 2, 1, C.K); } else o(10, 5, 1, 2, C.K);
    o(10, 7, 2, 1, C.P);
    o(5, 9, 6, 5, lk.top); if (lk.tie) o(10, 10, 1, 4, C.P);
    o(4, 13, 8, 2, lk.bot);
    if (f === 0) { o(6, 15, 3, 3, lk.legs); o(6, 18, 4, 1, lk.shoe); o(7, 10, 2, 4, SK); }
    else { o(4, 15, 2, 3, lk.legs); o(9, 15, 2, 3, lk.legs); o(3, 18, 3, 1, lk.shoe); o(9, 18, 3, 1, lk.shoe); o(f === 1 ? 9 : 5, 10, 2, 4, SK); }
  }
}
const PCACHE = {};
function person(look, dir, f) {
  const key = look + dir + f; if (PCACHE[key]) return PCACHE[key];
  const lk = LOOKS[look] || LOOKS.boy;
  const d = dir === 'left' ? 'right' : dir;
  let c = mk(18, 22, R => personDraw(R, lk, d, f));
  if (dir === 'left') { const m = document.createElement('canvas'); m.width = 18; m.height = 22; const x = m.getContext('2d'); x.translate(18, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); c = m; }
  return (PCACHE[key] = c);
}
// GUD seen from behind (battle)
function gudBack() {
  return mk(34, 34, R => {
    const o = (x, y, w, h, c) => R(x + 5, y + 2, w, h, c);
    o(7, 2, 9, 3, C.K); o(6, 4, 11, 14, C.K); o(5, 8, 2, 9, C.K); o(16, 8, 2, 9, C.K);
    o(4, 6, 2, 1, C.K); o(17, 6, 2, 1, C.K);
    o(3, 13, 3, 6, C.L); o(17, 13, 3, 6, C.L);
    o(6, 17, 11, 5, C.P); o(5, 21, 13, 3, C.B);
    o(8, 24, 3, 5, C.K); o(12, 24, 3, 5, C.K);
  });
}
// GUDMON: letters that came alive
function monSprite(m) {
  return mk(44, 44, (R, x) => {
    const col = C[m.c], dark = m.c === 'K';
    disc(R, 22, 25, 15, col); R(9, 26, 26, 10, col); R(12, 36, 6, 4, col); R(26, 36, 6, 4, col);
    // ears
    R(9, 10, 5, 7, col); R(30, 10, 5, 7, col); R(10, 8, 3, 3, col); R(31, 8, 3, 3, col);
    // belly letter
    R(15, 27, 14, 11, dark ? C.W : C.W); dtext(x, m.l, 20, 29, 1, dark ? C.K : C.P);
    // eyes
    const ec = dark ? C.W : C.K;
    R(14, 17, 4, 5, ec); R(26, 17, 4, 5, ec); R(15, 18, 1, 1, dark ? C.K : C.W); R(27, 18, 1, 1, dark ? C.K : C.W);
    R(11, 23, 3, 2, C.B); R(30, 23, 3, 2, C.B); R(20, 23, 4, 1, dark ? C.W : C.K);
    // accessories
    if (m.a === 'glasses') { R(12, 16, 8, 7, C.K); R(24, 16, 8, 7, C.K); R(20, 18, 4, 1, C.K); R(14, 18, 4, 3, C.W); R(26, 18, 4, 3, C.W); R(16, 19, 2, 2, C.K); R(28, 19, 2, 2, C.K); }
    if (m.a === 'crown') { R(14, 4, 16, 5, C.Y); R(14, 1, 2, 3, C.Y); R(21, 1, 2, 3, C.Y); R(28, 1, 2, 3, C.Y); R(21, 5, 2, 2, C.P); }
    if (m.a === 'beret') { R(13, 7, 18, 4, C.K); R(16, 5, 12, 2, C.K); R(21, 3, 2, 2, C.K); }
    if (m.a === 'cap') { R(12, 6, 20, 2, C.K); R(16, 8, 12, 3, C.K); R(30, 7, 1, 6, C.Y); R(29, 12, 3, 2, C.Y); }
    if (m.a === 'nib') { R(36, 20, 4, 10, C.K); R(37, 30, 2, 3, C.K); R(37, 22, 2, 2, C.W); }
    if (m.a === 'spark') { R(3, 6, 1, 5, C.Y); R(1, 8, 5, 1, C.Y); R(39, 30, 1, 5, C.Y); R(37, 32, 5, 1, C.Y); }
    if (m.a === 'bubble') { R(30, 2, 12, 8, C.W); R(32, 10, 3, 2, C.W); R(32, 4, 1, 1, C.K); R(35, 4, 1, 1, C.K); R(38, 4, 1, 1, C.K); }
    if (m.a === 'book') { R(1, 28, 9, 11, C.Y); R(5, 28, 1, 11, C.K); }
  });
}
function signSprite() { return mk(16, 18, R => { R(7, 9, 2, 8, C.K); R(1, 2, 14, 8, C.W); R(3, 4, 10, 1, C.B); R(3, 6, 7, 1, C.B); }); }
function treeSprite() { return mk(16, 16, R => { disc(R, 8, 6, 6, C.P); R(4, 3, 3, 2, C.B); R(9, 9, 2, 2, C.B); R(7, 12, 2, 3, C.K); }); }

/* --- tiles --- */
const TILES = {};
function tileCanvas(fn) { const c = document.createElement('canvas'); c.width = T; c.height = T; const x = c.getContext('2d'); fn((a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); }, x); return c; }
function buildTiles() {
  const grass = R => { R(0, 0, 16, 16, C.L); R(3, 4, 1, 2, C.B); R(4, 3, 1, 1, C.B); R(11, 10, 1, 2, C.B); R(12, 9, 1, 1, C.B); R(7, 13, 1, 1, C.B); };
  TILES['.'] = tileCanvas(grass);
  TILES[':'] = tileCanvas(R => { grass(R); [[3, 3], [10, 9]].forEach(([a, b]) => { R(a, b + 1, 3, 1, C.Y); R(a + 1, b, 1, 3, C.Y); R(a + 1, b + 1, 1, 1, C.P); }); R(12, 2, 1, 1, C.P); R(4, 12, 1, 1, C.Y); });
  TILES['='] = tileCanvas(R => { R(0, 0, 16, 16, C.W); R(2, 3, 1, 1, C.B); R(9, 12, 2, 1, C.B); R(13, 5, 1, 1, C.B); R(5, 9, 1, 1, C.L); });
  TILES['"'] = tileCanvas(R => {
    R(0, 0, 16, 16, C.L);
    [[1, 1], [9, 1], [5, 9], [13, 9]].forEach(([a, b]) => { R(a, b + 2, 5, 4, C.P); R(a, b, 1, 3, C.P); R(a + 2, b + 1, 1, 2, C.P); R(a + 4, b, 1, 3, C.P); R(a, b + 6, 5, 1, C.K); R(a + 1, b + 3, 1, 1, C.B); });
    R(0, 7, 3, 1, C.K);
  });
  const tree = treeSprite();
  TILES.T = tileCanvas((R, x) => { grass(R); x.drawImage(tree, 0, 0); });
  TILES['~0'] = tileCanvas(R => { R(0, 0, 16, 16, C.B); R(2, 4, 5, 1, C.W); R(10, 11, 4, 1, C.W); R(0, 0, 16, 1, C.P); });
  TILES['~1'] = tileCanvas(R => { R(0, 0, 16, 16, C.B); R(5, 4, 5, 1, C.W); R(7, 11, 4, 1, C.W); R(0, 0, 16, 1, C.P); });
  TILES['['] = tileCanvas(R => { R(0, 0, 16, 16, C.W); for (let y = 3; y < 16; y += 4) R(0, y, 16, 1, C.B); R(0, 0, 2, 16, C.K); R(2, 0, 1, 16, C.P); });
  TILES[']'] = tileCanvas(R => { R(0, 0, 16, 16, C.W); for (let y = 3; y < 16; y += 4) R(0, y, 16, 1, C.B); R(14, 0, 2, 16, C.K); R(13, 0, 1, 16, C.P); });
  TILES.M = tileCanvas(R => { R(0, 0, 16, 16, C.P); R(0, 0, 16, 1, C.K); for (let y = 4; y < 16; y += 5) R(0, y, 16, 1, C.K); R(5, 1, 1, 3, C.K); R(12, 5, 1, 4, C.K); R(4, 10, 1, 4, C.K); R(1, 1, 3, 1, C.B); });
  TILES.m = tileCanvas(R => { R(0, 0, 16, 16, C.P); R(0, 0, 4, 4, C.L); R(8, 0, 4, 4, C.L); R(0, 4, 16, 1, C.K); R(0, 9, 16, 1, C.K); R(6, 5, 1, 4, C.K); R(12, 10, 1, 6, C.K); R(3, 10, 1, 6, C.K); });
  TILES.o = tileCanvas(R => { R(0, 0, 16, 16, C.W); R(0, 0, 8, 8, C.L); R(8, 8, 8, 8, C.L); });
  TILES.H = tileCanvas(R => { R(0, 0, 16, 16, C.B); for (let x = 1; x < 16; x += 4) R(x, 0, 1, 16, C.L); R(0, 13, 16, 3, C.P); R(0, 12, 16, 1, C.K); });
  TILES.h = tileCanvas(R => { R(0, 0, 16, 16, C.B); for (let x = 1; x < 16; x += 4) R(x, 0, 1, 16, C.L); });
  TILES.D = tileCanvas(R => { R(0, 0, 16, 16, C.W); R(1, 4, 14, 10, C.P); R(2, 5, 12, 8, C.B); R(4, 8, 8, 2, C.W); });
  TILES[' '] = tileCanvas(R => R(0, 0, 16, 16, C.K));
}
const SOLID = new Set(['T', '~0', '~', 'M', 'm', 'H', 'h', ' ']);

/* --- buildings --- */
function buildingSprite(b) {
  const w = b.w * T, h = b.h * T + 10;
  return mk(w, h, (R, x) => {
    const roofH = 10 + (b.h >= 5 ? 26 : 20), wallTop = roofH;
    // walls
    R(1, wallTop, w - 2, h - wallTop - 1, b.wall || C.W);
    // windows
    for (let i = 0; i < b.w; i++) {
      if (i === b.door) continue;
      const wx = i * T + 3, wy = wallTop + 6;
      if (wy + 10 > h - 4) continue;
      R(wx, wy, 10, 9, C.K); R(wx + 1, wy + 1, 8, 7, C.B); R(wx + 1, wy + 4, 8, 1, C.W); R(wx + 5, wy + 1, 1, 7, C.W); R(wx + 2, wy + 2, 2, 1, C.W);
    }
    // roof
    if (b.style === 'castle') {
      R(1, 6, w - 2, roofH - 6, b.roof); for (let i = 1; i < w - 4; i += 8) R(i, 1, 5, 6, b.roof);
      for (let y = 10; y < roofH; y += 5) R(1, y, w - 2, 1, C.K);
    } else if (b.style === 'temple') {
      for (let i = 0; i < 10; i++) R(Math.round(w / 2 - i * (w / 20)), 1 + i, Math.round(i * (w / 10)), 1, b.roof);
      R(1, 11, w - 2, roofH - 11, b.roof); R(1, roofH - 3, w - 2, 1, C.K);
      for (let i = 0; i < b.w; i++) if (i !== b.door) R(i * T + 6, wallTop, 4, h - wallTop - 2, C.W);
    } else {
      R(1, 1, w - 2, roofH - 1, b.roof);
      for (let y = 4; y < roofH - 2; y += 4) R(2, y, w - 4, 1, b.roof2 || C.K);
      R(1, roofH - 2, w - 2, 2, C.K);
    }
    // extras
    if (b.icon === 'heart') { const hx = w / 2 - 6; R(hx + 1, 4, 4, 2, C.Y); R(hx + 7, 4, 4, 2, C.Y); R(hx, 6, 12, 4, C.Y); R(hx + 2, 10, 8, 2, C.Y); R(hx + 4, 12, 4, 2, C.Y); }
    if (b.icon === 'chimney') { R(w - 18, 0, 8, 9, C.K); }
    if (b.icon === 'frame') { R(w / 2 - 14, wallTop + 3, 28, 4, C.Y); }
    // door
    const dx = b.door * T + 3, dh = 15;
    R(dx - 1, h - dh - 2, 12, dh + 1, C.P); R(dx, h - dh - 1, 10, dh, C.K); R(dx + 7, h - 9, 2, 2, C.Y);
    // sign
    const label = b.label, lw = tw(label, 1) + 6, lx = Math.round(w / 2 - lw / 2), ly = roofH - 13 + (b.style === 'castle' ? 2 : 0);
    R(lx, ly, lw, 11, C.K); R(lx + 1, ly + 1, lw - 2, 9, b.signBg || C.W); dtext(x, label, lx + 3, ly + 2, 1, b.signFg || C.K);
  });
}
function towerSprite() {
  return mk(48, 104, R => {
    R(8, 30, 32, 72, C.P); for (let y = 36; y < 100; y += 6) R(8, y, 32, 1, C.K);
    R(20, 44, 3, 8, C.K); R(26, 60, 3, 8, C.K); R(20, 76, 3, 8, C.K); R(19, 88, 10, 12, C.K);
    R(6, 24, 36, 7, C.P); for (let i = 6; i < 40; i += 8) R(i, 19, 5, 6, C.P);
    disc(R, 16, 12, 8, C.B); disc(R, 30, 10, 9, C.B); disc(R, 24, 6, 5, C.B); R(13, 8, 3, 2, C.W); R(28, 5, 3, 2, C.W);
    R(22, 16, 2, 8, C.K);
  });
}
function monumentSprite() { return mk(34, 42, (R, x) => { R(3, 30, 28, 10, C.W); R(1, 37, 32, 4, C.W); dtext(x, 'G', 7, 1, 4, C.Y); R(8, 33, 18, 1, C.B); }); }

/* --- furniture --- */
function buildFurniture() {
  const F = SP.f = {};
  F.shelf = mk(18, 26, R => { R(1, 1, 16, 24, C.K); R(2, 2, 14, 22, C.B); [3, 10, 17].forEach((y, j) => { for (let i = 0; i < 6; i++) R(3 + i * 2 + (j % 2), y, 2, 6, [C.P, C.Y, C.W][(i + j) % 3]); R(2, y + 6, 14, 1, C.K); }); });
  F.desk = mk(18, 18, R => { R(1, 4, 16, 6, C.W); R(1, 9, 16, 2, C.B); R(2, 11, 2, 6, C.K); R(14, 11, 2, 6, C.K); R(5, 2, 6, 3, C.Y); });
  F.pc = mk(18, 20, R => { R(1, 10, 16, 5, C.W); R(2, 15, 2, 4, C.K); R(14, 15, 2, 4, C.K); R(4, 1, 10, 8, C.K); R(5, 2, 8, 6, C.P); R(6, 3, 3, 1, C.W); R(8, 9, 2, 1, C.K); });
  F.plant = mk(16, 20, R => { R(4, 12, 8, 7, C.P); R(3, 12, 10, 2, C.K); disc(R, 8, 7, 5, C.B); R(5, 4, 2, 2, C.L); R(2, 8, 3, 2, C.B); R(11, 6, 3, 2, C.B); });
  F.poster = mk(16, 16, (R, x) => { R(2, 1, 12, 14, C.W); R(3, 2, 10, 5, C.P); R(3, 9, 8, 1, C.K); R(3, 11, 6, 1, C.K); R(10, 10, 3, 3, C.Y); });
  F.posterY = mk(16, 16, R => { R(2, 1, 12, 14, C.Y); R(4, 3, 8, 8, C.K); R(5, 4, 3, 3, C.P); R(3, 12, 9, 1, C.K); });
  F.frame = mk(16, 16, R => { R(1, 1, 14, 13, C.Y); R(3, 3, 10, 9, C.W); R(4, 8, 3, 3, C.P); R(8, 5, 4, 4, C.B); R(6, 4, 2, 2, C.K); });
  F.board = mk(16, 16, R => { R(0, 1, 16, 12, C.K); R(2, 4, 7, 1, C.W); R(3, 7, 9, 1, C.W); R(2, 10, 5, 1, C.W); R(10, 3, 3, 3, C.Y); R(0, 13, 16, 2, C.W); });
  F.window = mk(16, 16, R => { R(1, 1, 14, 12, C.W); R(2, 2, 12, 10, C.B); R(7, 2, 1, 10, C.W); R(2, 6, 12, 1, C.W); R(3, 3, 2, 1, C.W); });
  F.bed = mk(18, 30, R => { R(1, 1, 16, 28, C.W); R(1, 1, 16, 3, C.K); R(3, 5, 12, 6, C.W); R(1, 12, 16, 16, C.P); R(1, 12, 16, 2, C.B); });
  F.tv = mk(18, 18, R => { R(1, 3, 16, 12, C.K); R(3, 5, 12, 8, C.B); R(4, 6, 4, 2, C.W); R(4, 15, 3, 2, C.K); R(11, 15, 3, 2, C.K); R(6, 0, 1, 3, C.K); R(11, 0, 1, 3, C.K); });
  F.counter = mk(16, 18, R => { R(0, 2, 16, 4, C.W); R(0, 6, 16, 10, C.P); R(0, 6, 16, 1, C.K); R(3, 9, 10, 1, C.B); });
  F.coffee = mk(16, 18, R => { R(0, 2, 16, 4, C.W); R(0, 6, 16, 10, C.P); R(0, 6, 16, 1, C.K); R(3, 0, 10, 8, C.K); R(5, 2, 6, 3, C.Y); R(6, 9, 4, 3, C.W); });
  F.press = mk(18, 20, R => { R(2, 10, 14, 9, C.K); R(4, 3, 10, 7, C.K); R(5, 4, 8, 5, C.B); R(14, 1, 2, 8, C.Y); R(13, 0, 4, 2, C.Y); R(4, 12, 10, 3, C.W); });
  F.typecase = mk(18, 18, R => { R(1, 3, 16, 14, C.B); for (let y = 5; y < 16; y += 4) { R(1, y - 1, 16, 1, C.K); R(5, y, 2, 1, C.K); R(11, y, 2, 1, C.K); } R(1, 3, 16, 1, C.K); });
  F.pedestal = mk(16, 20, R => { R(3, 6, 10, 12, C.W); R(2, 4, 12, 2, C.W); R(2, 17, 12, 2, C.W); R(5, 9, 6, 1, C.B); });
  F.easel = mk(16, 22, R => { R(3, 1, 10, 10, C.W); R(4, 2, 8, 8, C.P); R(6, 4, 3, 3, C.Y); R(4, 11, 1, 10, C.K); R(11, 11, 1, 10, C.K); R(7, 11, 2, 8, C.K); });
  F.vault = mk(18, 20, R => { R(1, 2, 16, 17, C.K); R(3, 4, 12, 13, C.W); disc(R, 9, 10, 4, C.Y); R(8, 9, 2, 2, C.K); R(15, 8, 2, 4, C.Y); });
  F.stripsTree = mk(18, 26, R => { disc(R, 9, 9, 8, C.B); R(8, 16, 3, 9, C.K); R(3, 6, 4, 4, C.W); R(11, 4, 4, 4, C.W); R(8, 11, 4, 4, C.W); R(4, 7, 2, 2, C.P); R(12, 5, 2, 2, C.Y); });
  F.legacy = mk(16, 16, R => { R(0, 1, 16, 12, C.K); for (let i = 0; i < 4; i++) R(1 + i * 4, 3, 3, 4, [C.P, C.Y, C.W, C.B][i]); R(1, 9, 14, 1, C.W); R(3, 11, 1, 1, C.Y); R(9, 11, 1, 1, C.P); R(0, 13, 16, 2, C.W); });
  F.books = mk(16, 16, R => { R(1, 1, 14, 13, C.K); for (let i = 0; i < 6; i++) R(2 + i * 2, 3 + (i % 2), 2, 10 - (i % 2), [C.P, C.Y, C.W][i % 3]); });
}

/* ---------------- MAPS ---------------- */
const MAPS = {};
const BUILDINGS = [
  { id: 'home', x: 4, y: 4, w: 5, h: 4, door: 2, roof: C.P, label: 'GUD', sign: L('Casa di GUD.', 'GUD\'s house.') },
  { id: 'centro', x: 11, y: 4, w: 6, h: 4, door: 3, roof: C.P, roof2: C.B, icon: 'heart', label: 'CENTRO GUD', signBg: C.P, signFg: C.W, sign: L('CENTRO GUD. Caffè, pause e contatti.', 'GUD CENTER. Coffee, breaks and contacts.') },
  { id: 'teaching', x: 24, y: 2, w: 8, h: 6, door: 4, roof: C.Y, roof2: C.W, style: 'temple', label: 'ACCADEMIA', sign: L('ACCADEMIA. Si insegna come si progetta.', 'ACADEMY. Teach the way you design.') },
  { id: 'studio', x: 4, y: 12, w: 7, h: 5, door: 3, roof: C.B, roof2: C.W, label: 'ERGONAUTH', sign: L('STUDIO ERGONAUTH. Firenze, dal 2016.', 'ERGONAUTH STUDIO. Florence, since 2016.') },
  { id: 'library', x: 13, y: 12, w: 6, h: 5, door: 3, roof: C.K, roof2: C.B, label: 'BIBLIOTECA', sign: L('BIBLIOTECA. Le parole di GUD.', 'LIBRARY. GUD\'s words.') },
  { id: 'gallery', x: 23, y: 12, w: 8, h: 5, door: 4, roof: C.W, roof2: C.B, icon: 'frame', label: 'GALLERIA', signBg: C.Y, sign: L('GALLERIA. Curatela e arte.', 'GALLERY. Curation and art.') },
  { id: 'type', x: 4, y: 33, w: 7, h: 5, door: 3, roof: C.K, roof2: C.P, icon: 'chimney', label: 'TYPODIVA', signBg: C.K, signFg: C.Y, sign: L('FONDERIA TYPODIVA. Lettere fuse ogni giorno.', 'TYPODIVA FOUNDRY. Letters cast daily.') },
  { id: 'lucca', x: 23, y: 33, w: 8, h: 5, door: 4, roof: C.P, style: 'castle', label: 'LUCCA CREA', signBg: C.Y, sign: L('LUCCA CREA. La città del fumetto e del gioco.', 'LUCCA CREA. The city of comics and games.') }
];
function genTown() {
  const w = 40, h = 42, g = [];
  for (let j = 0; j < h; j++) g.push(new Array(w).fill('.'));
  const rect = (x, y, ww, hh, c) => { for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) if (g[j] && g[j][i] !== undefined) g[j][i] = c; };
  let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let j = 2; j < h - 2; j++) for (let i = 2; i < w - 2; i++) if (rnd() < 0.08) g[j][i] = ':';
  rect(0, 0, w, 2, 'T'); rect(0, h - 2, w, 2, 'T'); rect(0, 0, 2, h, 'T'); rect(w - 2, 0, 2, h, 'T');
  rect(19, 2, 2, 38, '=');
  rect(2, 9, 36, 2, '='); rect(2, 17, 36, 1, '=');
  rect(2, 19, 36, 2, '~'); g[19][19] = '['; g[19][20] = ']'; g[20][19] = '['; g[20][20] = ']';
  rect(4, 22, 9, 4, '"'); rect(26, 22, 9, 4, '"'); rect(6, 27, 9, 4, '"'); rect(25, 27, 8, 4, '"');
  [[14, 22], [15, 22], [14, 23], [23, 24], [35, 22], [3, 27], [17, 29], [22, 29], [36, 29], [3, 34], [13, 34], [16, 35], [33, 13], [35, 15], [3, 13], [36, 4], [9, 3]].forEach(([x, y]) => { g[y][x] = 'T'; });
  rect(2, 32, 36, 1, 'M'); g[32][19] = '='; g[32][20] = '=';
  rect(3, 38, 34, 1, '=');
  BUILDINGS.forEach(b => { for (let y = b.y + b.h; y < 40; y++) { const c = g[y][b.x + b.door]; if (c === '=') break; g[y][b.x + b.door] = '='; } });
  rect(32, 12, 5, 5, ':'); g[13][33] = 'T'; g[15][35] = 'T';
  return { w, h, g };
}
function makeTown() {
  const { w, h, g } = genTown();
  const m = { id: 'town', w, h, g, outdoor: true, objs: [], npcs: [], warps: [], blds: [] };
  BUILDINGS.forEach(b => {
    b.spr = buildingSprite(b);
    m.blds.push(b);
    m.warps.push({ x: b.x + b.door, y: b.y + b.h - 1, to: b.id });
  });
  const sign = (x, y, text) => m.objs.push({ x, y, spr: SP.sign, text });
  const B = id => BUILDINGS.find(b => b.id === id);
  sign(8, 8, B('home').sign); sign(17, 8, B('centro').sign); sign(23, 8, B('teaching').sign);
  sign(21, 3, L('FIRENZE. Dove tutto è cominciato.', 'FLORENCE. Where it all began.'));
  sign(8, 18, B('studio').sign); sign(17, 18, B('library').sign); sign(28, 18, B('gallery').sign);
  sign(21, 21, L('VIA DEL SEGNO. Attenzione: erba alta. Ci vivono i GUDMON selvatici!', 'ROUTE OF THE MARK. Warning: tall grass. Wild GUDMON live here!'));
  sign(21, 33, L('LUCCA. Città del fumetto e del gioco.', 'LUCCA. City of comics and games.'));
  sign(11, 37, B('type').sign); sign(22, 37, B('lucca').sign);
  sign(32, 37, L('TORRE GUINIGI. Sì, in cima ci sono gli alberi.', 'GUINIGI TOWER. Yes, there are trees on top.'));
  m.objs.push({ x: 33, y: 4, w: 2, h: 2, spr: SP.monument, text: L('MONUMENTO ALLA G. Per qualcuno è una lettera. Per GUD è un\'identità.', 'MONUMENT TO THE G. For some, a letter. For GUD, an identity.') });
  m.objs.push({ x: 33, y: 33, w: 3, h: 5, spr: SP.tower, text: L('La Torre Guinigi. Da quassù si vede tutta la storia di Lucca Comics.', 'The Guinigi Tower. From up here you can see all of Lucca Comics\' history.') });
  m.npcs.push(
    { x: 9, y: 10, dir: 'down', look: 'prof', name: 'PROF. SERIF', script: 'prof' },
    { x: 24, y: 10, dir: 'left', look: 'boy', say: L('Il David? No, io sono qui per il kerning perfetto.', 'The David? No, I came for the perfect kerning.') },
    { x: 31, y: 18, dir: 'down', look: 'girl', say: L('Ho fatto il workshop Brividi all\'ISIA. Brividi, appunto.', 'I took the Brividi workshop at ISIA. Chills, indeed.') },
    { x: 17, y: 23, dir: 'down', look: 'girl', say: L('Nell\'erba alta vivono i GUDMON: sono le passioni di GUD! Usa lo SKETCHBOOK per catturarli.', 'GUDMON live in the tall grass: they are GUD\'s passions! Use the SKETCHBOOK to catch them.') },
    { x: 22, y: 27, dir: 'left', look: 'teach', say: L('Ogni GUDMON catturato entra nel GUDDEX. Premi START per vederlo.', 'Every GUDMON you catch goes into the GUDDEX. Press START to see it.') },
    { x: 14, y: 38, dir: 'right', look: 'punk', say: L('Mi sono vestito da BIG CLIENT. Nessuno ha riso.', 'I came dressed as BIG CLIENT. Nobody laughed.') },
    { x: 26, y: 35, dir: 'down', look: 'guard', say: L('Lucca Comics & Games ha 60 anni. GUD ne ha disegnato la festa.', 'Lucca Comics & Games turned 60. GUD designed the party.') },
    { x: 34, y: 38, dir: 'down', look: 'client', name: 'BIG CLIENT', script: 'client' }
  );
  return m;
}
function makeInterior(id, cfg) {
  const w = 12, h = 9, g = [];
  for (let j = 0; j < h; j++) g.push(new Array(w).fill('o'));
  for (let i = 0; i < w; i++) { g[0][i] = 'h'; g[1][i] = 'H'; g[8][i] = 'H'; }
  g[8][5] = 'D'; g[8][6] = 'D';
  const m = { id, w, h, g, outdoor: false, objs: [], npcs: [], warps: [], exits: [[5, 8], [6, 8]], title: cfg.title };
  (cfg.wall || []).forEach(o => m.objs.push(Object.assign({ y: 1, wall: true }, o)));
  (cfg.floor || []).forEach(o => m.objs.push(o));
  (cfg.npcs || []).forEach(n => m.npcs.push(n));
  return m;
}
function sectionInterior(id, look, leaderName, wallSpr, floorSpr, extraNpc) {
  const sec = CV.sections[id];
  const wallX = [1, 3, 8, 10], floorP = [[1, 4], [10, 4], [1, 6], [10, 6]];
  const wall = [], floor = [];
  sec.items.forEach((it, i) => {
    const text = [it.t + '.', it.d];
    if (i < 4) wall.push({ x: wallX[i], spr: SP.f[wallSpr[i % wallSpr.length]], text });
    else { const [x, y] = floorP[i - 4]; floor.push({ x, y, spr: SP.f[floorSpr[(i - 4) % floorSpr.length]], text }); }
  });
  wall.push({ x: 5, spr: SP.f.window, text: L('Fuori splende il sole. Dentro, si lavora.', 'The sun is shining outside. Inside, work goes on.') });
  wall.push({ x: 6, spr: SP.f.window, text: L('Una finestra. Vista su tutta la carriera di GUD.', 'A window. A view over GUD\'s whole career.') });
  const npcs = [{ x: 5, y: 3, dir: 'down', look, name: leaderName, script: 'leader', sec: id }];
  if (extraNpc) npcs.push(extraNpc);
  return makeInterior(id, { title: sec.place, wall, floor, npcs });
}
function buildMaps() {
  MAPS.town = makeTown();
  MAPS.home = makeInterior('home', {
    title: L('CASA DI GUD', 'GUD\'S HOUSE'),
    wall: [
      { x: 1, spr: SP.f.shelf, text: L('Libri di tipografia. Tanti. Troppi? Mai troppi.', 'Typography books. Many. Too many? Never.') },
      { x: 3, spr: SP.f.posterY, text: L('Un poster: THANK GUD IT\'S FRIDAY. Un arcade girlpop: si gioca sul sito di GUD.', 'A poster: THANK GUD IT\'S FRIDAY. A girlpop arcade: play it on GUD\'s website.') },
      { x: 6, spr: SP.f.window, text: L('Fuori c\'è Firenze. E una scadenza.', 'Outside: Florence. And a deadline.') },
      { x: 9, spr: SP.f.board, text: L('Una bacheca: moodboard, post-it, un biglietto per Lucca.', 'A pinboard: moodboard, post-its, a ticket to Lucca.') }
    ],
    floor: [
      { x: 1, y: 2, spr: SP.f.bed, oy: 0, text: L('Il letto di GUD. Ci dorme poco: troppe idee.', 'GUD\'s bed. She barely sleeps: too many ideas.') },
      { x: 10, y: 2, spr: SP.f.pc, text: L('Il PC di GUD. Una cartella si chiama definitivo_v8_ultimo.', 'GUD\'s PC. A folder is called final_v8_really_final.') },
      { x: 3, y: 5, spr: SP.f.tv, text: L('In TV: un\'art director attraversa Firenze cercando il weekend.', 'On TV: an art director crosses Florence looking for the weekend.') },
      { x: 10, y: 6, spr: SP.f.plant, text: L('Una pianta. Sopravvive. Come GUD.', 'A plant. It survives. Like GUD.') }
    ],
    npcs: [{ x: 7, y: 4, dir: 'left', look: 'mom', name: L('MAMMA', 'MOM'), say: L('GUD! Il tuo ufficio è tutta la città, a quanto pare. Ricordati di mangiare: stasera parmigiana.', 'GUD! Your office is the whole town, apparently. Remember to eat: parmigiana tonight.') }]
  });
  MAPS.home.objs.find(o => o.spr === SP.f.bed).h = 2;
  MAPS.centro = makeInterior('centro', {
    title: L('CENTRO GUD', 'GUD CENTER'),
    wall: [{ x: 2, spr: SP.f.posterY, text: L('Un poster: "Il riposo fa parte del progetto."', 'A poster: "Rest is part of the project."') }, { x: 9, spr: SP.f.window, text: L('Una finestra sul Lungarno.', 'A window over the Arno.') }],
    floor: [
      { x: 3, y: 3, spr: SP.f.counter, text: L('Il bancone del CENTRO GUD.', 'The GUD CENTER counter.') },
      { x: 4, y: 3, spr: SP.f.coffee, text: L('Una macchina del caffè. Profuma di scadenze rispettate.', 'A coffee machine. It smells of met deadlines.') },
      { x: 6, y: 3, spr: SP.f.counter, text: L('Il bancone del CENTRO GUD.', 'The GUD CENTER counter.') },
      { x: 7, y: 3, spr: SP.f.counter, text: L('Il bancone del CENTRO GUD.', 'The GUD CENTER counter.') },
      { x: 10, y: 3, spr: SP.f.pc, script: 'contacts' },
      { x: 1, y: 6, spr: SP.f.plant, text: L('Una pianta molto rilassata.', 'A very relaxed plant.') }
    ],
    npcs: [
      { x: 5, y: 3, dir: 'down', look: 'barista', name: L('BARISTA', 'BARISTA'), script: 'heal' },
      { x: 8, y: 6, dir: 'left', look: 'boy', say: L('Ho sentito che GUD è disponibile per nuovi progetti. Il PC a destra ha tutti i suoi contatti.', 'I heard GUD is open to new projects. The PC on the right has all her contacts.') }
    ]
  });
  MAPS.teaching = sectionInterior('teaching', 'teach', L('PROF.SSA GRIGLIA', 'PROF. GRID'), ['board', 'poster', 'board', 'poster'], ['desk'],
    { x: 8, y: 5, dir: 'left', look: 'boy', say: L('Con la prof GUD abbiamo fatto progetti veri: Jaguar Land Rover, Artribune, Mondadori.', 'With GUD we did real projects: Jaguar Land Rover, Artribune, Mondadori.') });
  MAPS.studio = sectionInterior('studio', 'boy', L('IL COMMERCIALISTA', 'THE ACCOUNTANT'), ['posterY', 'frame', 'poster', 'frame'], ['pc'],
    { x: 8, y: 5, dir: 'left', look: 'girl', say: L('Qui si fa art direction, branding, naming, lettering. E si beve molto caffè.', 'Here we do art direction, branding, naming, lettering. And drink a lot of coffee.') });
  MAPS.library = sectionInterior('library', 'libr', L('LA BIBLIOTECARIA', 'THE LIBRARIAN'), ['books', 'shelf', 'books', 'shelf'], ['shelf'],
    { x: 8, y: 5, dir: 'left', look: 'critic', say: L('Shhh. Qui si legge GUD.', 'Shhh. We are reading GUD.') });
  MAPS.gallery = sectionInterior('gallery', 'critic', L('LA CRITICA', 'THE CRITIC'), ['frame', 'frame', 'posterY', 'frame'], ['pedestal', 'easel'],
    { x: 8, y: 5, dir: 'up', look: 'boy', say: L('Quel piedistallo vuoto è un\'opera concettuale. Si intitola "Brief".', 'That empty pedestal is a conceptual work. It is called "Brief".') });
  MAPS.type = sectionInterior('type', 'punk', L('IL FONT PIRATA', 'THE FONT PIRATE'), ['poster', 'typecase', 'posterY', 'typecase'], ['press', 'typecase', 'press'],
    { x: 8, y: 5, dir: 'left', look: 'girl', say: L('Ogni lettera qui dentro è stata disegnata, spaziata, provata. Poi ridisegnata.', 'Every letter in here was drawn, spaced, tested. Then redrawn.') });
  MAPS.lucca = sectionInterior('lucca', 'guard', L('IL GUARDIANO DELLE MURA', 'THE WALL KEEPER'), ['legacy', 'posterY', 'legacy', 'poster'], ['vault', 'stripsTree'],
    { x: 8, y: 5, dir: 'left', look: 'punk', say: L('Nella Legacy Board ognuno scrive il suo evento canonico con i Posca.', 'On the Legacy Board everyone writes their canon event with Posca markers.') });
}
