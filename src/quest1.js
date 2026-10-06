/* =====================================================================
   GUDQUEST · PINK ADVENTURE — an interactive CV with handheld-RPG logic
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
  scene: 'boot', time: 0, paused: false,
  map: 'home', px: 6, py: 5, dir: 'down', moving: false, mt: 0, fx: 0, fy: 0, step: 0, bump: 0,
  ui: [], busy: false, timers: [], fade: 0, battle: null,
  lv: 30, hp: 120, maxhp: 120, pp: [15, 20, 10, 5], coffee: 3,
  badges: [], caught: [], seen: [], hof: false, introDone: false
};
function save() {
  const d = { map: S.map, px: S.px, py: S.py, dir: S.dir, lv: S.lv, hp: S.hp, maxhp: S.maxhp, pp: S.pp, coffee: S.coffee, badges: S.badges, caught: S.caught, seen: S.seen, hof: S.hof, introDone: S.introDone };
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
  if (modalOpen()) { if (e.key === 'Escape') closeModals(); return; }
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
  wiggle() { tn(220, 0.06, { vol: 0.06, type: 'triangle' }); },
  bark() { tn(520, 0.07, { to: 380, vol: 0.07 }); tn(560, 0.08, { to: 400, vol: 0.07, at: 0.14 }); nz(0.04, { f: 2500, vol: 0.03 }); }
};

/* ---------------- SPRITES ---------------- */
const SP = {};
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
