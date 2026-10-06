/* ---------------------------------------------------------------------
   5. DOM + CANVAS SETUP
   --------------------------------------------------------------------- */
const cvs = $('game'), ctx = cvs.getContext('2d'), stage = $('stage');
const overlay = $('overlay'), hackEl = $('hack'), hackForm = $('hackForm'), hackInput = $('hackInput'), hackMsg = $('hackMsg');
const muteBtn = $('muteBtn'), hackBtn = $('hackBtn'), menuBtn = $('menuBtn');
let W = 480, H = 270, G = 240, HUDH = 16, KS = 1;

function resize() {
  const r = stage.getBoundingClientRect();
  const bw = Math.max(60, r.width), bh = Math.max(60, r.height);
  if (MOBILE) { W = 256; H = Math.round(clamp(W * bh / bw, 300, 440)); }
  else { H = 270; W = Math.round(clamp(H * bw / bh, 400, 720)); }
  const s = Math.min(bw / W, bh / H), dpr = window.devicePixelRatio || 1;
  KS = Math.max(1, Math.ceil(s * dpr));
  cvs.width = W * KS; cvs.height = H * KS;
  cvs.style.width = Math.floor(W * s) + 'px'; cvs.style.height = Math.floor(H * s) + 'px';
  G = H - (MOBILE ? 36 : 30); HUDH = MOBILE ? 26 : 16;
  ctx.imageSmoothingEnabled = false;
}

/* ---------------------------------------------------------------------
   6. GAME DATA
   --------------------------------------------------------------------- */
const WEEK = { get days() { return LANG === 'it' ? ['LUNEDÌ', 'MARTEDÌ', 'MERCOLEDÌ', 'GIOVEDÌ', 'VENERDÌ'] : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']; }, start: [540, 540, 540, 540, 540], end: 1050, bossAt: 840, rate: 510 / 26 };
const WKND = { get days() { return LANG === 'it' ? ['SABATO', 'DOMENICA'] : ['SATURDAY', 'SUNDAY']; }, start: [600, 480], end: 1560, bossAt: 720, rate: 24 };
const FEEDBACK_WEEK_F = () => LIST('feedbackWeek').map(tr).filter(Boolean);
const FEEDBACK_WKND_F = () => LIST('feedbackWeekend').map(tr).filter(Boolean);
const POOL_WEEK = [['email', 'call', 'f24', 'update'], ['urgent', 'voice', 'link404', 'malessere'], ['logo', 'bug', 'brief'], ['internet', 'overtime', 'contradictory'], []];
const OBD = {
  f24: { lvl: 'ground', mul: 1.35, hp: 3 },
  email: { lvl: 'head', mul: 1.15, hp: 1 },
  urgent: { lvl: 'head', mul: 1, hp: 2 },
  call: { lvl: 'ground', mul: 1, hp: 1 },
  logo: { lvl: 'ground', mul: 1, hp: 2 },
  contradictory: { lvl: 'osc', mul: 1, hp: 2 },
  bug: { lvl: 'ground', mul: 1, hp: 2, hb: [1, 1, 26, 26] },
  brief: { lvl: 'head', mul: 0.9, hp: 3, hb: [3, 2, 74, 31] },
  internet: { lvl: 'ground', mul: 1, hp: 2, hb: [1, 3, 26, 24] },
  overtime: { lvl: 'drop', mul: 1, hp: 2 },
  voice: { lvl: 'head', mul: 1.05, hp: 3, hb: [1, 1, 96, 25] },
  link404: { lvl: 'ground', mul: 1, hp: 2 },
  update: { lvl: 'ground', mul: 1, hp: 3, hb: [1, 10, 76, 12] },
  malessere: { lvl: 'low', mul: 0.85, hp: 1 },
  martini: { lvl: 'ground', mul: 1.2, hp: 1, hb: [2, 3, 18, 21] },
  pranzo: { lvl: 'ground', mul: 1, hp: 3, hb: [3, 3, 92, 22] },
  parmigiana: { lvl: 'ground', mul: 1, hp: 3 }
};
const BND = {
  coffee: { fx: 'energy', v: 35, txt: '+COFFEE!' }, cat: { fx: 'morale', v: 5, txt: 'MEOW! MORALE UP' }, dog: { fx: 'morale', v: 5, txt: 'WOOF! MORALE UP' },
  water: { fx: 'energy', v: 25, txt: '+H2O' }, salad: { fx: 'energy', v: 35, txt: '+GREENS', cure: true },
  oki: { fx: 'morale', v: 4, txt: 'OKI! NO PAIN' }, polase: { fx: 'full', txt: 'POLASE! FULL ENERGY' }
};
const CLIENT_WORDS = ['ASAP', 'FYI', 'PING!', '+1', 'REV. 7', 'URGENTE', 'CALL?', 'QUICK Q', 'CC: ALL', 'EXPOSURE'];
const HANG_WORDS = ['BLEAH', 'MAL DI TESTA', 'ZZZ', 'MAI PIÙ', 'HIC!', 'ACQUA...'];

const S = { state: 'intro', mode: 'week', paused: false, hackOpen: false, time: 0, scroll: 0, lastResult: null, best: +(store.get('gud_best') || 0) };
const P = { x: 60, y: 200, vy: 0, onGround: true, duck: false, jumpQ: 0, shootCd: 0, shootAnim: 0, hurtT: 0, invT: 0, morale: 0, slowT: 0, collectT: 0, anim: 0 };
const input = { left: false, right: false, jump: false, duck: false, shoot: false };

function resetRun(mode) {
  Object.assign(S, {
    mode, score: 0, lives: 3, energy: 100, day: 0, min: mode === 'week' ? WEEK.start[0] : WKND.start[0],
    obs: [], bonuses: [], shots: [], eshots: [], parts: [], pops: [], giants: [], papers: [],
    boss: null, bossDone: false, spawnT: 1.4, bonusT: 3.5, giantT: 8, shake: 0, glitch: 0, glitchT: 3,
    banner: null, result: null, endT: 0, speed: 170
  });
  Object.assign(P, { x: Math.round(W * 0.16), y: G - 32, vy: 0, onGround: true, duck: false, jumpQ: 0, shootCd: 0, shootAnim: 0, hurtT: 0, invT: 0, morale: 0, slowT: 0, collectT: 0, anim: 0 });
}
resetRun('week');

const DAYS = () => (S.mode === 'week' ? WEEK : WKND);
function timeStr(m) { m = Math.floor(m); return pad(Math.floor(m / 60) % 24, 2) + ':' + pad(m % 60, 2); }
function progress() {
  if (S.mode === 'week') return clamp((S.day * 510 + (S.min - 540)) / (4 * 510 + 300), 0, 1);
  return clamp(S.day === 0 ? (S.min - 600) / 1200 : (960 + S.min - 480) / 1200, 0, 1);
}

/* ---------------------------------------------------------------------
   7. HELPERS — particles, popups, banners, collisions
   --------------------------------------------------------------------- */
function overlap(a, b, ins) { ins = ins || 0; return a.x + ins < b.x + b.w - ins && a.x + a.w - ins > b.x + ins && a.y + ins < b.y + b.h - ins && a.y + a.h - ins > b.y + ins; }
function pbox() { return P.duck ? { x: P.x + 9, y: P.y + 15, w: 13, h: 17 } : { x: P.x + 12, y: P.y + 6, w: 9, h: 26 }; }
function burst(x, y, n, cols, spd, size, grav) {
  for (let i = 0; i < n && S.parts.length < 900; i++) {
    const a = Math.random() * Math.PI * 2, v = rand(spd * 0.3, spd);
    S.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - spd * 0.3, g: grav == null ? 300 : grav, life: rand(0.35, 0.8), max: 0.8, col: pick(cols), s: size || 1 });
  }
}
function pop(text, x, y, col) { S.pops.push({ text, x, y, t: 0, dur: 1, col: col || C.Y }); }
function banner(text, sub, dur, flash) { S.banner = { text, sub, t: 0, dur: dur || 1.8, flash }; }
function obRect(o) { return o.k === 'logo' ? { x: o.x, y: o.y, w: o.w, h: o.h } : { x: o.x + o.hb[0], y: o.y + o.hb[1], w: o.hb[2], h: o.hb[3] }; }
function breakSprite(o, cols) { const r = obRect(o); burst(r.x + r.w / 2, r.y + r.h / 2, 18 + Math.min(30, r.w / 3), cols || [C.P, C.W, C.K, C.B], 140, 2); }

/* ---------------------------------------------------------------------
   8. OBSTACLES
   --------------------------------------------------------------------- */
function placeY(o) {
  const b = o.hb[1] + o.hb[3];
  if (o.lvl === 'head') return G - 20 - b;
  if (o.lvl === 'low') return G - 3 - b;
  return G - b;
}
function sizeLogo(o) {
  const dist = o.x - (P.x + 21);
  const sc = dist > 150 ? 1 : dist > 90 ? 2 : 3;
  if (sc !== o.sc && o.sc) { SFX.pop(); S.shake = Math.max(S.shake, 0.08); }
  o.sc = sc; o.w = tw('LOGO', sc); o.h = 7 * sc; o.y = G - o.h;
}
function makeOb(k, v) {
  const d = OBD[k], spr = SPR.ob[k], fr = spr ? spr[0] : null;
  const o = { k, t: 0, hp: d.hp, x: W + 8, w: fr ? fr.width : 24, h: fr ? fr.height : 21, mul: d.mul, lvl: d.lvl, vy: 0, hitT: 0, v };
  o.hb = d.hb || [1, 1, o.w - 2, o.h - 2];
  if (k === 'logo') { o.sc = 0; sizeLogo(o); o.baseY = o.y; return o; }
  if (k === 'martini') {
    o.v = v || pick(['slide', 'bounce', 'fly']);
    if (o.v === 'fly') { o.lvl = 'head'; o.mul = 1.1; }
    if (o.v === 'bounce') { o.mul = 1; }
  }
  o.baseY = placeY(o); o.y = o.baseY;
  if (k === 'martini' && o.v === 'bounce') { o.y = G - 90; o.vy = -60; }
  if (o.lvl === 'drop') { o.x = Math.round(W * rand(0.66, 0.85)); o.y = -o.h - 6; o.falling = true; }
  return o;
}
function spawnObstacle() {
  let k;
  if (S.mode === 'week') {
    let pool = []; for (let i = 0; i <= Math.min(S.day, 4); i++) pool = pool.concat(POOL_WEEK[i]);
    if (S.day < 4) pool = pool.concat(POOL_WEEK[S.day]);
    k = pick(pool);
  } else k = pick(['martini', 'martini', 'martini', 'pranzo', 'pranzo', 'parmigiana', 'parmigiana']);
  const o = makeOb(k); S.obs.push(o);
  const p = progress();
  S.spawnT = Math.max(0.75, rand(0.95, 1.75) * (1 - 0.35 * p) + (o.w + 30) / S.speed);
}
function updateObstacles(dt) {
  const pb = pbox();
  for (let i = S.obs.length - 1; i >= 0; i--) {
    const o = S.obs[i]; o.t += dt; o.hitT -= dt;
    if (!o.falling) o.x -= S.speed * o.mul * dt;
    switch (o.k) {
      case 'email': o.y = o.baseY - Math.abs(Math.sin(o.t * 5)) * 4; break;
      case 'brief': o.y = o.baseY - Math.abs(Math.sin(o.t * 2.4)) * 5; o.x += Math.sin(o.t * 3) * 0.5; break;
      case 'contradictory': o.y = o.baseY - (Math.sin(o.t * 3.2) * 0.5 + 0.5) * 34; break;
      case 'malessere': o.y = o.baseY - Math.abs(Math.sin(o.t * 4)) * 3; break;
      case 'logo': sizeLogo(o); break;
      case 'martini':
        if (o.v === 'bounce') { o.vy += 800 * dt; o.y += o.vy * dt; if (o.y >= o.baseY) { o.y = o.baseY; o.vy = -270; } }
        if (o.v === 'fly') o.y = o.baseY - Math.abs(Math.sin(o.t * 6)) * 3;
        break;
      case 'overtime':
        if (o.falling) {
          o.x -= S.speed * 0.2 * dt; o.vy += 900 * dt; o.y += o.vy * dt;
          if (o.y >= o.baseY) { o.y = o.baseY; o.falling = false; S.shake = Math.max(S.shake, 0.12); SFX.thud(); burst(o.x + o.w / 2, G, 8, [C.W, C.B], 60, 1); }
        }
        break;
      case 'f24': if (Math.random() < 0.25) S.parts.push({ x: o.x + o.w, y: G - 2, vx: rand(10, 40), vy: rand(-30, -5), g: 60, life: 0.4, max: 0.4, col: C.W, s: 1 }); break;
    }
    if (o.x + o.w < -30) { S.obs.splice(i, 1); continue; }
    if (S.result) continue;
    if (overlap(pb, obRect(o), 2)) {
      if (P.morale > 0) { breakSprite(o); S.score += 50; pop('+50', o.x, o.y - 4, C.Y); SFX.pop(); S.obs.splice(i, 1); continue; }
      if (o.k === 'malessere') { applyMalessere(); breakSprite(o, [C.B, C.P]); S.obs.splice(i, 1); continue; }
      if (P.invT <= 0) { hurt(o.k === 'call' ? 'RING RING!' : o.k === 'f24' ? 'TAXES!' : 'OUCH!'); breakSprite(o); S.obs.splice(i, 1); }
    }
  }
}
function applyMalessere() {
  S.energy = Math.max(1, S.energy - 25); P.slowT = 4; SFX.drain(); pop('MALESSERE...', P.x, P.y - 6, C.B);
}

/* ---------------------------------------------------------------------
   9. BONUSES
   --------------------------------------------------------------------- */
function spawnBonus() {
  let k;
  if (S.mode === 'week') k = S.energy < 55 ? pick(['coffee', 'coffee', 'coffee', 'cat', 'dog']) : pick(['coffee', 'coffee', 'cat', 'dog']);
  else k = S.energy < 55 ? pick(['water', 'salad', 'polase', 'oki']) : pick(['water', 'salad', 'oki', 'water', 'polase']);
  const spr = SPR.bn[k][0], high = Math.random() < 0.45;
  const b = { k, x: W + 20, w: spr.width, h: spr.height, t: rand(0, 3), sp: 0 };
  b.baseY = high ? G - 46 - b.h : G - 5 - b.h; b.y = b.baseY;
  S.bonuses.push(b);
}
function collect(b) {
  const d = BND[b.k];
  if (d.fx === 'energy') S.energy = Math.min(100, S.energy + d.v);
  if (d.fx === 'full') S.energy = 100;
  if (d.fx === 'morale') { P.morale = Math.max(P.morale, d.v); S.energy = Math.min(100, S.energy + 10); }
  if (d.cure) P.slowT = 0;
  S.score += 100; P.collectT = 0.3; SFX.bonus();
  burst(b.x + b.w / 2, b.y + b.h / 2, 16, [C.Y, C.W, C.Y], 90, 1, 80);
  pop(d.txt, b.x - 10, b.y - 10, C.Y);
}
function updateBonuses(dt) {
  const pb = pbox();
  for (let i = S.bonuses.length - 1; i >= 0; i--) {
    const b = S.bonuses[i]; b.t += dt; b.x -= S.speed * dt; b.y = b.baseY + Math.round(Math.sin(b.t * 5) * 2);
    b.sp -= dt;
    if (b.sp <= 0) { b.sp = 0.16; S.parts.push({ x: b.x + rand(-2, b.w + 2), y: b.y + rand(-2, b.h), vx: 0, vy: -18, g: 0, life: 0.45, max: 0.45, col: pick([C.Y, C.W]), s: 1 }); }
    if (b.x + b.w < -10) { S.bonuses.splice(i, 1); continue; }
    if (!S.result && overlap(pb, b, 0)) { collect(b); S.bonuses.splice(i, 1); }
  }
}

/* ---------------------------------------------------------------------
   10. GIANT FEEDBACK — pixel typographic attacks
   --------------------------------------------------------------------- */
function fitGiant(text, maxW, maxH) {
  const words = text.toUpperCase().split(' ');
  for (let sc = 10; sc >= 1; sc--) {
    const maxC = Math.floor((maxW + sc) / (6 * sc)); if (maxC < 2) continue;
    if (words.some(w => w.length > maxC)) continue;
    const lines = wrap(text, maxC), h = lines.length * 8 * sc - sc;
    if (h <= maxH) return { lines, sc, w: Math.max(...lines.map(l => tw(l, sc))), h };
  }
  return { lines: [text.toUpperCase()], sc: 1, w: tw(text, 1), h: 7 };
}
function spawnGiant(kind, list) {
  const text = pick(list || (S.mode === 'week' ? FEEDBACK_WEEK_F() : FEEDBACK_WKND_F())) || 'MORE WOW!';
  const top = HUDH + (S.boss ? 24 : 6);
  let L, x, y, targetY;
  if (kind === 'sweep') {
    const maxW = S.boss ? Math.min(W * 0.62, S.boss.x - 10) : W * rand(0.6, 0.85);
    L = fitGiant(text, maxW, (G - 20) - top);
    x = (S.boss ? S.boss.x - 4 : W - 6) - L.w; y = G - 20 - L.h; targetY = y;
  } else {
    L = fitGiant(text, W * (MOBILE ? 0.46 : 0.44), G - top - 4);
    x = W - 6 - L.w; y = top; targetY = G - L.h;
  }
  const g = Object.assign({ kind, text, x, y, targetY, t: 0, phase: 'enter', hp: 6, hitT: 0, vy: 0, collide: false }, L);
  S.giants.push(g);
  SFX.giant(); S.glitch = 0.25; S.shake = Math.max(S.shake, 0.15);
  S.spawnT = Math.max(S.spawnT, 2.2);
}
function giantRects(g) {
  const cx = g.x + g.w / 2;
  return g.lines.map((l, i) => { const lw = tw(l, g.sc); return { x: cx - lw / 2, y: g.y + i * 8 * g.sc, w: lw, h: 7 * g.sc }; });
}
function shatterGiant(g, loud) {
  const cx = g.x + g.w / 2; let n = 0;
  const step = g.sc >= 4 ? 2 : 1;
  g.lines.forEach((l, li) => {
    const lw = tw(l, g.sc), lx = cx - lw / 2, ly = g.y + li * 8 * g.sc;
    for (let ci = 0; ci < l.length; ci++) {
      const gl = FONT[l[ci]] || FONT['?'];
      for (let r = 0; r < 7; r += step) for (let c = 0; c < 5; c += step) {
        if (!(gl[r] & (16 >> c)) || S.parts.length > 950) continue;
        const px = lx + ci * 6 * g.sc + c * g.sc, py = ly + r * g.sc;
        S.parts.push({ x: px, y: py, vx: (px - cx) * rand(0.6, 1.8) + rand(-40, 40), vy: rand(-170, -10), g: 520, life: rand(0.5, 1.1), max: 1.1, col: pick([C.P, C.Y, C.K]), s: g.sc * step }); n++;
      }
    }
  });
  if (loud) { SFX.shatter(); S.glitch = 0.15; S.shake = Math.max(S.shake, 0.15); }
}
function updateGiants(dt) {
  const pb = pbox();
  for (let i = S.giants.length - 1; i >= 0; i--) {
    const g = S.giants[i]; g.t += dt; g.hitT -= dt;
    if (g.phase === 'enter') {
      if (g.t >= 0.5) { g.phase = g.kind === 'sweep' ? 'move' : 'drop'; g.t = 0; g.collide = true; }
    } else if (g.phase === 'move') {
      g.x -= (S.speed * 1.05 + 45) * dt;
      if (g.x + g.w < -10) { S.giants.splice(i, 1); continue; }
    } else if (g.phase === 'drop') {
      g.vy += 1500 * dt; g.y += g.vy * dt;
      if (g.y >= g.targetY) { g.y = g.targetY; g.phase = 'hold'; g.t = 0; S.shake = 0.35; SFX.slam(); burst(g.x + g.w / 2, G, 24, [C.W, C.B, C.K], 160, 2); }
    } else if (g.phase === 'hold') {
      if (g.t > 1.6) { shatterGiant(g, true); S.giants.splice(i, 1); continue; }
    }
    if (g.collide && !S.result && P.invT <= 0) {
      if (giantRects(g).some(r => overlap(pb, r, 1))) {
        if (P.morale > 0) { shatterGiant(g, true); S.score += 150; pop('NOPE!', P.x, P.y - 8, C.Y); S.giants.splice(i, 1); continue; }
        hurt('FEEDBACK!');
      }
    }
  }
}
function drawGiant(g) {
  let sc = g.sc;
  if (g.phase === 'enter') { const k = Math.min(1, g.t / 0.45); sc = Math.max(1, Math.ceil(g.sc * (0.12 + 0.88 * k * k))); }
  const cx = g.x + g.w / 2, cy = g.y + g.h / 2 + (g.phase === 'move' ? Math.round(Math.sin(S.time * 30) * 1) : 0);
  const h = g.lines.length * 8 * sc - sc, y0 = Math.round(cy - h / 2);
  const cyc = Math.floor(S.time / (g.phase === 'enter' ? 0.06 : 0.13)) % 3;
  let main = [C.P, C.Y, C.K][cyc]; const out = main === C.K ? C.Y : C.K;
  if (g.hitT > 0) main = C.W;
  if (g.kind === 'slam' && g.phase !== 'hold') { // landing marker
    ctx.fillStyle = Math.floor(S.time * 10) % 2 ? C.K : C.P;
    for (let x = Math.round(g.x); x < g.x + g.w; x += 6) ctx.fillRect(x, G - 3, 4, 2);
  }
  g.lines.forEach((l, i) => {
    const lw = tw(l, sc), lx = Math.round(cx - lw / 2), ly = y0 + i * 8 * sc;
    otext(ctx, l, lx, ly, sc, main, out, null, out === C.K ? C.P : C.K);
  });
}

/* ---------------------------------------------------------------------
   11. PLAYER
   --------------------------------------------------------------------- */
function pressJump() { P.jumpQ = 0.13; }
function fire() {
  const word = S.mode === 'week' ? 'DIRITTI UMANI' : 'TÈ MATCHA';
  const y = P.duck ? P.y + 19 : (P.onGround ? P.y + 13 : P.y + 12);
  S.shots.push({ x: P.x + 21, y, w: tw(word, 1) + 2, h: 9, vx: 390, word, t: 0 });
  P.shootCd = 0.3; P.shootAnim = 0.16; SFX.shoot();
  for (let i = 0; i < 4; i++) S.parts.push({ x: P.x + 26, y: y + 4, vx: rand(20, 80), vy: rand(-40, 40), g: 0, life: 0.15, max: 0.2, col: C.Y, s: 1 });
}
function updatePlayer(dt, ground, canShoot) {
  const slow = P.slowT > 0 ? 0.55 : 1;
  let mv = 0; if (input.left) mv -= 1; if (input.right) mv += 1;
  P.duck = input.duck && P.onGround;
  P.x += mv * 140 * slow * (P.duck ? 0.6 : 1) * dt;
  let maxX = S.state === 'beach' ? W - 50 : Math.round(W * 0.62);
  if (S.boss && !S.boss.dying) maxX = Math.min(maxX, S.boss.x - 40);
  P.x = clamp(P.x, S.state === 'beach' ? 12 : -9, maxX);
  if (P.jumpQ > 0) {
    P.jumpQ -= dt;
    if (P.onGround) { P.vy = -330 * (slow < 1 ? 0.88 : 1); P.onGround = false; P.jumpQ = 0; SFX.jump(); burst(P.x + 16, ground, 4, [C.W, C.B], 40, 1); }
  }
  if (!P.onGround) {
    let gm = 1; if (P.vy < 0 && !input.jump) gm = 2.2; if (input.duck) gm = 2.8;
    P.vy += 980 * gm * dt; P.y += P.vy * dt;
    if (P.y >= ground - 32) { P.y = ground - 32; P.vy = 0; P.onGround = true; burst(P.x + 16, ground - 1, 5, [C.W, C.B], 50, 1); }
  } else P.y = ground - 32;
  P.shootCd -= dt;
  if (canShoot && input.shoot && P.shootCd <= 0) fire();
  P.shootAnim -= dt; P.hurtT -= dt; P.invT -= dt; P.collectT -= dt; P.slowT -= dt;
  if (P.morale > 0) {
    P.morale -= dt;
    if (Math.random() < 0.5) S.parts.push({ x: P.x + rand(8, 24), y: P.y + rand(4, 30), vx: 0, vy: -25, g: 0, life: 0.4, max: 0.4, col: pick([C.Y, C.W]), s: 1 });
  }
  P.anim += dt * 12 * clamp(S.speed / 170, 0.6, 1.6);
}
function hurt(msg) {
  if (P.invT > 0 || P.morale > 0 || S.result) return;
  S.lives--; P.hurtT = 0.45; P.invT = 1.6; S.energy = Math.max(1, S.energy - 8); S.shake = 0.3; SFX.hurt();
  pop(msg || 'OUCH!', P.x, P.y - 8, C.P);
  burst(P.x + 16, P.y + 16, 14, [C.P, C.K, C.W], 120, 1);
  if (S.lives <= 0) lose();
}
function lose() {
  S.result = 'lose'; S.endT = 2.0; S.lives = 0; SFX.gameOver(); P.vy = 0;
  S.giants.forEach(g => shatterGiant(g, false)); S.giants = [];
}
function playerPose() {
  if (S.state === 'beach') return P.onGround ? ['beach', Math.floor(S.time * 2) % 2] : ['beachjump', 0];
  if (S.state === 'intro') return ['idle', Math.floor(S.time * 1.5) % 2];
  const res = S.result || (S.state === 'end' ? S.lastResult : null);
  if (res === 'lose') return ['defeat', 0];
  if (res === 'win') return ['victory', Math.floor(S.time * 4) % 2];
  if (P.hurtT > 0) return ['hurt', 0];
  if (!P.onGround) return [P.shootAnim > 0 ? 'jumpshoot' : 'jump', 0];
  if (P.duck) return ['duck', Math.floor(P.anim / 2) % 2];
  if (P.collectT > 0) return ['collect', 0];
  return [P.shootAnim > 0 ? 'shoot' : 'run', Math.floor(P.anim) % 4];
}
const CUSTOM_POSE = { idle: 'idle', run: 'run', shoot: 'shoot', jump: 'jump', jumpshoot: 'shoot', duck: 'duck', hurt: 'hurt', collect: 'collect', victory: 'victory', defeat: 'defeat', beach: 'beach', beachjump: 'beach' };
function drawPlayer() {
  const [pose, f] = playerPose();
  if (P.invT > 0 && P.morale <= 0 && !S.result && Math.floor(S.time * 14) % 2) return;
  const x = Math.round(P.x), y = Math.round(P.y);
  const key = 'player/' + CUSTOM_POSE[pose];
  if (ASSETS[key]) {
    const hh = pose === 'duck' ? 20 : 32;
    if (P.morale > 0) { ctx.fillStyle = C.Y; ctx.fillRect(x + 4, y + 32 - hh - 2, 26, 2); }
    drawCustom(ctx, key, x, y + 32 - hh, 34, hh, S.time);
    return;
  }
  const spr = gud(pose, f);
  if (P.morale > 0) {
    const t = tinted(spr, Math.floor(S.time * 10) % 2 ? C.Y : C.W);
    ctx.drawImage(t, x - 1, y); ctx.drawImage(t, x + 1, y); ctx.drawImage(t, x, y - 1); ctx.drawImage(t, x, y + 1);
  }
  if (S.state === 'beach') { ctx.drawImage(spr, x - 17, y - 32, 68, 68); return; }
  ctx.drawImage(spr, x, y);
  if (P.slowT > 0 && S.state === 'play') { const b = Math.floor(S.time * 4) % 2; ctx.drawImage(SPR.fx.heartP, x + 22, y - 2 - b); }
  if (pose === 'defeat') dtext(ctx, 'ZZZ', x + 8, y + 12 - Math.floor(S.time * 3) % 3, 1, C.K);
}

/* ---------------------------------------------------------------------
   12. BOSSES — BIG CLIENT & HANGOVER
   --------------------------------------------------------------------- */
function spawnBoss() {
  const week = S.mode === 'week';
  const spr = week ? SPR.client : SPR.hangover;
  const b = { kind: week ? 'client' : 'hangover', name: week ? 'BIG CLIENT' : 'HANGOVER', spr, w: spr[0].width, h: spr[0].height,
    x: W + 10, y: 0, hp: week ? 40 : 44, t: 0, atkT: 2.4, hitT: 0, mouthT: 0, entering: true, dying: false };
  b.maxHp = b.hp; b.shown = b.hp;
  S.boss = b;
  S.obs.forEach(o => breakSprite(o)); S.obs = [];
  S.giants.forEach(g => shatterGiant(g, false)); S.giants = [];
  banner(TX('tgif', 'warning'), b.name + ' ' + TX('tgif', 'approaching'), 2.4, true);
  SFX.bossAppear(); S.shake = 0.4; S.glitch = 0.3;
}
function bossBox(b) {
  return b.kind === 'client' ? { x: b.x + 14, y: b.y + 4, w: b.w - 26, h: b.h - 8 } : { x: b.x + 8, y: b.y + 8, w: b.w - 16, h: b.h - 12 };
}
function eshot(o) { S.eshots.push(Object.assign({ t: 0, g: 0, vy: 0, bounce: 0, hp: 1 }, o)); }
function textShot(word, lvl, vx, dx) {
  const w = tw(word, 1) + 6, h = 11;
  eshot({ kind: 'text', word, x: S.boss.x + 10 + (dx || 0), y: lvl === 'ground' ? G - h : G - 20 - h, w, h, vx });
}
function bossAttack(b) {
  const r = b.hp / b.maxHp; b.mouthT = 0.4;
  if (b.kind === 'client') {
    const opts = ['text', 'text', 'meeting'];
    if (r < 0.7 && !S.giants.length) opts.push('giant');
    if (r < 0.45) opts.push('rain', 'text');
    const a = pick(opts);
    if (a === 'text') { const n = r < 0.5 ? 2 : 1; for (let i = 0; i < n; i++) textShot(pick(CLIENT_WORDS), pick(['ground', 'head']), -rand(170, 240), i * 80); }
    if (a === 'meeting') { const s = SPR.fx.cal; eshot({ kind: 'cal', x: b.x + 4, y: b.y + 60, w: s.width, h: s.height, vx: -rand(140, 190), vy: -rand(200, 280), g: 700, bounce: 0.55 }); }
    if (a === 'giant') spawnGiant('sweep', FEEDBACK_WEEK_F());
    if (a === 'rain') for (let i = 0; i < 3; i++) eshot({ kind: 'drop', word: pick(['@', 'CC', 'RE:']), x: rand(10, b.x - 30), y: HUDH + 24 - i * 40, w: 17, h: 11, vx: 0, vy: 60, g: 240 });
  } else {
    const opts = ['olive', 'text', 'spill'];
    if (r < 0.7) opts.push('ice'); if (r < 0.6 && !S.giants.length) opts.push('giant');
    const a = pick(opts);
    if (a === 'olive') { const n = r < 0.5 ? 3 : 2; for (let i = 0; i < n; i++) eshot({ kind: 'olive', x: b.x + 70, y: b.y + 6, w: 11, h: 11, vx: -rand(130, 210), vy: -rand(150, 260), g: 700, bounce: 0.75 }); }
    if (a === 'text') textShot(pick(HANG_WORDS), pick(['ground', 'head']), -rand(170, 230));
    if (a === 'spill') eshot({ kind: 'wave', x: b.x + 10, y: G - 14, w: 46, h: 14, vx: -rand(210, 250) });
    if (a === 'ice') for (let i = 0; i < 3; i++) eshot({ kind: 'ice', x: rand(10, b.x - 30), y: HUDH + 20 - i * 46, w: 12, h: 12, vx: 0, vy: 50, g: 380 });
    if (a === 'giant') spawnGiant('sweep', FEEDBACK_WKND_F());
  }
}
function updateBoss(dt) {
  const b = S.boss; if (!b) return;
  b.t += dt; b.hitT -= dt; b.mouthT -= dt;
  b.tx = W - b.w - (MOBILE ? 2 : 10);
  const hover = b.kind === 'hangover' ? 10 + Math.sin(b.t * 1.6) * (MOBILE ? 14 : 7) : 0;
  b.y = (b.kind === 'client' ? G - 120 : G - 117 - hover) + (b.dying ? b.sink || 0 : 0);
  b.shown += (b.hp - b.shown) * Math.min(1, dt * 5);
  if (b.dying) {
    b.sink = (b.sink || 0) + 18 * dt; b.bt = (b.bt || 0) - dt;
    if (b.bt <= 0) { b.bt = 0.07; burst(b.x + rand(0, b.w), b.y + rand(0, b.h), 10, [C.Y, C.P, C.W, C.K], 160, 2); S.shake = 0.15; }
    if (b.t > 2.1 && !b.gone) { b.gone = true; burst(b.x + b.w / 2, b.y + b.h / 2, 120, [C.Y, C.P, C.W, C.K], 260, 3); S.shake = 0.5; }
    return;
  }
  if (b.entering) { b.x -= 90 * dt; if (b.x <= b.tx) { b.x = b.tx; b.entering = false; } return; }
  b.x = b.tx + Math.round(Math.sin(b.t * 0.8) * 6);
  if (S.result) return;
  b.atkT -= dt;
  if (b.atkT <= 0) { bossAttack(b); const r = b.hp / b.maxHp; b.atkT = (r > 0.6 ? 1.6 : r > 0.3 ? 1.25 : 0.95) * rand(0.85, 1.15); }
}
function hitBoss(b) {
  b.hp--; b.hitT = 0.08; S.score += 25; SFX.bossHit();
  if (b.hp <= 0) {
    b.hp = 0; b.dying = true; b.t = 0; S.result = 'win'; S.endT = 3.0; S.bossDone = true;
    S.score += 2000; S.eshots.forEach(e => burst(e.x, e.y, 6, [C.Y, C.W], 80, 1)); S.eshots = [];
    S.giants.forEach(g => shatterGiant(g, false)); S.giants = [];
    S.min = S.mode === 'week' ? 1050 : 780; SFX.bossDefeat();
    banner(b.name, TX('tgif', 'defeated'), 2.6, true);
  }
}
function updateEshots(dt) {
  const pb = pbox();
  for (let i = S.eshots.length - 1; i >= 0; i--) {
    const e = S.eshots[i]; e.t += dt;
    e.vy += e.g * dt; e.x += e.vx * dt; e.y += e.vy * dt;
    if (e.y + e.h >= G) {
      if (e.bounce) { e.y = G - e.h; e.vy = -Math.abs(e.vy) * e.bounce; if (Math.abs(e.vy) < 60) e.bounce = 0; }
      else if (e.kind === 'ice' || e.kind === 'drop') { burst(e.x + e.w / 2, G - 2, 8, [C.W, C.B], 70, 1); S.eshots.splice(i, 1); continue; }
      else e.y = G - e.h;
    }
    if (e.x + e.w < -20 || e.x > W + 60) { S.eshots.splice(i, 1); continue; }
    if (!S.result && overlap(pb, e, 1)) {
      if (P.morale > 0) { burst(e.x + e.w / 2, e.y + e.h / 2, 10, [C.Y, C.W], 90, 1); S.eshots.splice(i, 1); continue; }
      if (P.invT <= 0) { hurt(e.kind === 'cal' ? 'MEETING ACCEPTED' : 'OUCH!'); S.eshots.splice(i, 1); }
    }
  }
}
function drawBoss() {
  const b = S.boss; if (!b || b.gone) return;
  if (b.dying && Math.floor(S.time * 16) % 2) return;
  let spr = b.spr[b.mouthT > 0 || b.dying ? 1 : 0];
  if (b.hitT > 0) spr = tinted(spr, C.W);
  const key = 'boss/' + (b.kind === 'client' ? 'bigclient' : 'hangover');
  if (!(b.hitT <= 0 && drawCustom(ctx, key, b.x, b.y, b.w, b.h, S.time))) ctx.drawImage(spr, Math.round(b.x), Math.round(b.y));
  if (b.kind === 'hangover' && !b.dying) { // stink waves
    ctx.fillStyle = C.K;
    for (let i = 0; i < 3; i++) { const yy = Math.round(b.y - 6 - ((S.time * 12 + i * 6) % 18)); ctx.fillRect(Math.round(b.x + 30 + i * 18 + Math.sin(S.time * 5 + i) * 2), yy, 1, 3); }
  }
}
function drawEshot(e) {
  const x = Math.round(e.x), y = Math.round(e.y);
  if (e.kind === 'text' || e.kind === 'drop') {
    ctx.fillStyle = C.K; ctx.fillRect(x, y, e.w, e.h); ctx.fillStyle = C.P; ctx.fillRect(x + 1, y + 1, e.w - 2, e.h - 2);
    dtext(ctx, e.word, x + 3, y + 2, 1, C.W);
    if (e.kind === 'drop') { ctx.fillStyle = Math.floor(S.time * 10) % 2 ? C.K : C.P; ctx.fillRect(x, G - 2, e.w, 2); }
  } else if (e.kind === 'cal') {
    ctx.drawImage(SPR.fx.cal, x, y);
    if (Math.floor(S.time * 6) % 2) otext(ctx, 'MEETING REQUEST', x + e.w / 2, y - 10, 1, C.P, C.W, 'center');
  } else if (e.kind === 'olive') ctx.drawImage(SPR.fx.olive, x, y);
  else if (e.kind === 'ice') { ctx.drawImage(SPR.fx.ice, x, y); ctx.fillStyle = Math.floor(S.time * 10) % 2 ? C.K : C.B; ctx.fillRect(x, G - 2, e.w, 2); }
  else if (e.kind === 'wave') ctx.drawImage(SPR.fx.wave[Math.floor(S.time * 8) % 2], x, y);
}

/* ---------------------------------------------------------------------
   13. PLAYER PROJECTILES — DIRITTI UMANI / TÈ MATCHA
   --------------------------------------------------------------------- */
function updateShots(dt) {
  for (let i = S.shots.length - 1; i >= 0; i--) {
    const s = S.shots[i]; s.t += dt; s.x += s.vx * dt;
    let dead = s.x > W + 10;
    if (!dead) for (let j = S.obs.length - 1; j >= 0; j--) {
      const o = S.obs[j];
      if (overlap(s, obRect(o), 0)) {
        dead = true; o.hp--; o.hitT = 0.08; SFX.bossHit();
        if (o.hp <= 0) { breakSprite(o); S.score += 50; pop('+50', o.x, o.y - 6, C.Y); S.obs.splice(j, 1); }
        break;
      }
    }
    if (!dead) for (let j = S.giants.length - 1; j >= 0; j--) {
      const g = S.giants[j];
      if (g.collide && giantRects(g).some(r => overlap(s, r, 0))) {
        dead = true; g.hp--; g.hitT = 0.07; SFX.bossHit();
        if (g.hp <= 0) { shatterGiant(g, true); S.score += 150; pop('FEEDBACK REJECTED!', Math.max(4, g.x), g.y + g.h / 2, C.Y); S.giants.splice(j, 1); }
        break;
      }
    }
    if (!dead) for (let j = S.eshots.length - 1; j >= 0; j--) {
      const e = S.eshots[j];
      if (overlap(s, e, 0)) { dead = true; burst(e.x + e.w / 2, e.y + e.h / 2, 8, [C.Y, C.W, C.P], 90, 1); S.eshots.splice(j, 1); S.score += 10; break; }
    }
    const b = S.boss;
    if (!dead && b && !b.entering && !b.dying && overlap(s, bossBox(b), 0)) {
      dead = true; hitBoss(b); burst(s.x + s.w, s.y + 4, 8, [C.Y, C.W], 100, 1);
    }
    if (dead) S.shots.splice(i, 1);
  }
}
function drawShot(s) {
  const x = Math.round(s.x), y = Math.round(s.y);
  ctx.fillStyle = C.P;
  for (let k = 1; k <= 3; k++) ctx.fillRect(x - k * 5, y + 2 + (k % 2) * 3, 3, 1);
  otext(ctx, s.word, x + 1, y + 1, 1, C.Y, C.K);
}

/* ---------------------------------------------------------------------
   14. BACKGROUNDS
   --------------------------------------------------------------------- */
const BG = {};
function skyline(mode) {
  if (BG[mode]) return BG[mode];
  const tw_ = 480, th = 110; let seed = mode === 'week' ? 7 : 13;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  BG[mode] = mk(tw_, th, (R) => {
    let x = 0;
    while (x < tw_ - 10) {
      const bw = 18 + Math.floor(rnd() * 30), bh = 36 + Math.floor(rnd() * 66), col = mode === 'week' ? C.B : C.P;
      const w2 = Math.min(bw - 2, tw_ - x - 1);
      R(x, th - bh, w2, bh, col);
      for (let wy = th - bh + 4; wy < th - 6; wy += 6) for (let wx = x + 3; wx < x + w2 - 4; wx += 5) R(wx, wy, 2, 3, rnd() < 0.25 ? C.Y : (mode === 'week' ? C.L : C.K));
      if (rnd() < 0.4) R(x + Math.floor(w2 / 2), th - bh - 6, 1, 6, C.K);
      x += bw;
    }
  }, true);
  return BG[mode];
}
const SIGNS = { week: ['DEADLINE ->', 'OPEN SPACE', 'COFFEE ZONE', 'MEETING ROOM', 'NO WIFI', 'BRAINSTORM', 'ASAP ST.', 'HR ->'],
  weekend: ['APERITIVO', 'DISCO', 'PIZZERIA', 'DA MAMMA', 'KARAOKE', 'BRUNCH', 'SPIAGGIA ->', 'OPEN BAR'] };
function drawBackground() {
  const week = S.mode === 'week';
  const hr = (S.min / 60) % 24;
  const night = !week && (hr >= 21 || hr < 7);
  const sunset = !week && hr >= 18 && hr < 21;
  // sky
  let sky = C.L;
  if (!week) sky = night ? C.K : (S.day === 1 ? C.L : C.Y);
  ctx.fillStyle = sky; ctx.fillRect(-8, -8, W + 16, G + 8);
  if (sunset) { const cols = [C.Y, C.B, C.P]; for (let i = 0; i < 9; i++) { ctx.fillStyle = cols[i % 3]; ctx.fillRect(-8, Math.round(G * 0.25 + i * (G * 0.08)), W + 16, 2 + i); } }
  if (week && S.day === 4 && S.state === 'play') { // Friday alarm stripes
    ctx.fillStyle = C.B; const o = Math.floor(S.time * 20) % 16;
    for (let y = HUDH + 2; y < G * 0.55; y += 4) for (let x = -16 + o + ((y / 4) % 2) * 8; x < W; x += 16) ctx.fillRect(x, y, 2, 2);
  }
  if (night) { // stars
    for (let i = 0; i < 40; i++) {
      const sx = (i * 97 + 13) % W, sy = HUDH + ((i * 53) % Math.max(20, G - 140));
      if ((Math.floor(S.time * 3) + i) % 5) { ctx.fillStyle = i % 3 ? C.Y : C.W; ctx.fillRect(sx, sy, 1, 1); }
    }
    const dx = Math.round(W * 0.5 + Math.sin(S.time) * 4); // disco ball
    ctx.fillStyle = C.W; ctx.fillRect(dx, HUDH, 1, 14);
    ctx.drawImage(tinted(SPR.fx.sun, C.W), dx - 16, HUDH + 4, 32, 32);
    ctx.fillStyle = C.B; for (let i = 0; i < 6; i++) ctx.fillRect(dx - 10 + ((i * 7 + Math.floor(S.time * 8)) % 20), HUDH + 12 + (i % 3) * 6, 3, 3);
  } else {
    // clock-sun showing game time
    const sx = W - (MOBILE ? 28 : 36), sy = HUDH + (MOBILE ? 30 : 24);
    ctx.drawImage(week ? SPR.fx.sun : tinted(SPR.fx.sun, C.P), sx - 16, sy - 16);
    const m = S.min % 60, h = (S.min / 60) % 12;
    const hand = (ang, len) => { for (let r = 0; r < len; r++) ctx.fillRect(Math.round(sx + Math.sin(ang) * r), Math.round(sy - Math.cos(ang) * r), 1, 1); };
    ctx.fillStyle = C.K; hand(m / 60 * Math.PI * 2, 10); hand(h / 12 * Math.PI * 2, 6);
    // clouds
    for (let i = 0; i < 4; i++) { const cx = ((i * 190 - S.scroll * 0.08) % (W + 80) + W + 80) % (W + 80) - 50; ctx.drawImage(SPR.fx.cloud, Math.round(cx), HUDH + 12 + (i % 3) * 22); }
  }
  // skyline
  const sk = skyline(week ? 'week' : 'weekend'), off = Math.floor(S.scroll * 0.2) % sk.width;
  for (let x = -off; x < W; x += sk.width) ctx.drawImage(sk, x, G - sk.height);
  // signs (mid parallax)
  const list = SIGNS[week ? 'week' : 'weekend'], gap = 190, so = S.scroll * 0.55, first = Math.floor(so / gap);
  for (let i = first; i < first + Math.ceil(W / gap) + 2; i++) {
    const sx = Math.round(i * gap - so + 30), txt = list[((i % list.length) + list.length) % list.length], w = tw(txt, 1) + 8;
    ctx.fillStyle = C.K; ctx.fillRect(sx + w / 2 - 1, G - 44, 2, 44);
    const neon = night && Math.floor(S.time * 2 + i) % 4;
    ctx.fillStyle = neon ? C.P : C.K; ctx.fillRect(sx - 1, G - 58, w + 2, 15);
    ctx.fillStyle = night ? C.K : C.W; ctx.fillRect(sx, G - 57, w, 13);
    dtext(ctx, txt, sx + 4, G - 54, 1, night ? (neon ? C.Y : C.B) : C.K);
  }
  // papers (week chaos)
  S.papers && S.papers.forEach(p => { ctx.fillStyle = C.W; ctx.fillRect(Math.round(p.x), Math.round(p.y), 5, 6); ctx.fillStyle = C.K; ctx.fillRect(Math.round(p.x) + 1, Math.round(p.y) + 2, 3, 1); });
  // ground: checker tiles
  ctx.fillStyle = C.K; ctx.fillRect(-8, G, W + 16, 2);
  const t1 = C.P, t2 = week ? C.B : (night ? C.K : C.Y);
  ctx.fillStyle = t1; ctx.fillRect(-8, G + 2, W + 16, H - G + 8);
  ctx.fillStyle = t2; const go = Math.floor(S.scroll) % 16;
  for (let y = G + 2, row = 0; y < H + 8; y += 8, row++) for (let x = -go - 16 + (row % 2) * 8; x < W + 8; x += 16) ctx.fillRect(x, y, 8, 8);
  ctx.fillStyle = C.W; ctx.fillRect(-8, G + 2, W + 16, 1);
}

/* ---------------------------------------------------------------------
   15. BEACH — secret ILOVEGUD scenario
   --------------------------------------------------------------------- */
const BEACH_TEXT_F = () => LIST('beach').map(tr).filter(Boolean);
function beachGround() { return Math.round(H - (MOBILE ? 18 : 14)); }
function startBeach() {
  resetRun(S.mode);
  S.state = 'beach'; S.hearts = []; S.heartT = 0; S.chimeT = 1;
  P.x = Math.round(W * (MOBILE ? 0.3 : 0.36)); P.y = beachGround() - 32;
  hideOverlay(); menuBtn.hidden = false;
  SFX.hack(); setTimeout(startMusic, 500); focusGame();
}
function updateBeach(dt) {
  S.heartT -= dt;
  while (S.heartT <= 0) { S.heartT += MOBILE ? 0.11 : 0.08; if (S.hearts.length < 160) S.hearts.push({ x: rand(-6, W), y: -10, vy: rand(22, 55), ph: rand(0, 6), front: Math.random() < 0.3 }); }
  const gb = beachGround();
  for (let i = S.hearts.length - 1; i >= 0; i--) {
    const h = S.hearts[i]; h.y += h.vy * dt; h.x += Math.sin(S.time * 2 + h.ph) * 12 * dt;
    if (h.y > gb - rand(0, 30)) { if (Math.random() < 0.3) S.parts.push({ x: h.x + 4, y: h.y + 4, vx: 0, vy: -10, g: 0, life: 0.3, max: 0.3, col: C.W, s: 1 }); S.hearts.splice(i, 1); }
  }
  S.chimeT -= dt; if (S.chimeT <= 0) { S.chimeT = rand(1.4, 3.2); SFX.chime(); }
  updatePlayer(dt, gb, false);
  updateParts(dt);
}
function beachPanelLayout() {
  const pw = W - 16, maxBottom = Math.round(H * (MOBILE ? 0.58 : 0.6));
  let sc = 3, lines, h;
  for (; sc >= 1; sc--) {
    const maxC = Math.floor((pw - 16 + sc) / (6 * sc));
    lines = BEACH_TEXT_F().map(p => wrap(p, maxC));
    h = 8 + 12 + lines.reduce((a, l) => a + l.length, 0) * 10 * sc + (lines.length - 1) * 3 * sc + 6;
    if (8 + h <= maxBottom || sc === 1) break;
  }
  return { sc, lines, h, pw, x: 8, y: 8 };
}
function drawBeach() {
  const L = beachPanelLayout(), pb = L.y + L.h + 4;
  const hor = Math.round(clamp(Math.max(H * 0.58, pb + 34), 0, H * 0.7)), sand = Math.round(hor + (H - hor) * 0.4), gb = beachGround();
  ctx.fillStyle = C.L; ctx.fillRect(-8, -8, W + 16, hor + 8);
  for (let i = 0; i < 8; i++) { ctx.fillStyle = i < 4 ? C.B : C.P; ctx.fillRect(-8, Math.round(hor * 0.42 + i * hor * 0.07), W + 16, 1 + i); }
  // striped retro sun
  const sx = Math.round(W * 0.7), rr = Math.max(18, Math.min(MOBILE ? 34 : 40, hor - pb - 2));
  for (let dy = -rr; dy <= 0; dy++) {
    if (dy > -rr * 0.55 && ((-dy) % 7) < 2 + Math.floor((rr + dy) / 14)) continue;
    const hw = Math.floor(Math.sqrt(rr * rr - dy * dy)); ctx.fillStyle = C.Y; ctx.fillRect(sx - hw, hor + dy, hw * 2 + 1, 1);
  }
  // sea
  ctx.fillStyle = C.P; ctx.fillRect(-8, hor, W + 16, sand - hor);
  ctx.fillStyle = C.Y; for (let i = 0; i < 5; i++) { const w = Math.max(4, rr * 1.6 - i * 12); ctx.fillRect(Math.round(sx - w / 2 + Math.sin(S.time * 2 + i) * 2), hor + 3 + i * 5, Math.round(w), 1); }
  ctx.fillStyle = C.W;
  for (let r = 0; r < Math.floor((sand - hor) / 6); r++) { const o = (S.time * (r % 2 ? 14 : -10)) % 22; for (let x = -22 + o + r * 5; x < W; x += 22) ctx.fillRect(Math.round(x), hor + 6 + r * 6, 6, 1); }
  // sand
  ctx.fillStyle = C.Y; ctx.fillRect(-8, sand, W + 16, H - sand + 8);
  ctx.fillStyle = C.W; for (let x = -8; x < W + 8; x += 4) ctx.fillRect(x, sand + Math.round(Math.sin(x * 0.2 + S.time * 3)), 4, 2);
  ctx.fillStyle = C.B; for (let i = 0; i < 40; i++) ctx.fillRect((i * 71) % W, sand + 6 + ((i * 37) % Math.max(8, H - sand - 8)), 1, 1);
  // props
  ctx.drawImage(SPR.fx.palm, Math.round(W * 0.02) - 10, gb - 98);
  const ux = Math.round(W - (MOBILE ? 66 : 84));
  ctx.drawImage(SPR.fx.umbrella, ux, gb - 64);
  ctx.fillStyle = C.K; ctx.fillRect(ux + 2, gb - 4, 46, 4); ctx.fillStyle = C.P; for (let i = 0; i < 6; i++) ctx.fillRect(ux + 3 + i * 8, gb - 3, 4, 2);
  S.hearts.forEach(h => { if (!h.front) drawHeart(h); });
  drawBeachPanel(L);
  drawPlayer();
  const pr = S.panelRect;
  S.hearts.forEach(h => { if (h.front && !(pr && h.x > pr.x - 12 && h.x < pr.x + pr.w + 2 && h.y < pr.y + pr.h + 2)) drawHeart(h); });
  drawParts();
}
function drawBeachPanel(L) {
  const { sc, lines, h, pw, x, y } = L; S.panelRect = { x, y, w: pw + 4, h: h + 4 };
  ctx.fillStyle = C.P; ctx.fillRect(x + 4, y + 4, pw, h);
  ctx.fillStyle = C.K; ctx.fillRect(x - 2, y - 2, pw + 4, h + 4);
  ctx.fillStyle = C.W; ctx.fillRect(x, y, pw, h);
  dtext(ctx, '\u2665 ' + TX('tgif', 'secret') + ' \u2665', W / 2, y + 6, 1, Math.floor(S.time * 3) % 2 ? C.P : C.K, 'center');
  let yy = y + 20;
  lines.forEach((pl, pi) => {
    pl.forEach(l => { otext(ctx, l, W / 2, yy, sc, pi === 1 ? C.P : C.K, C.W, 'center'); yy += 10 * sc; });
    yy += 3 * sc;
  });
  ctx.drawImage(SPR.fx.heartP, x + 4, y + 4); ctx.drawImage(SPR.fx.heartP, x + pw - 15, y + 4);
}
function drawHeart(h) { if (!drawCustom(ctx, 'fx/heart', Math.round(h.x), Math.round(h.y), 11, 10, S.time)) ctx.drawImage(SPR.fx.heart, Math.round(h.x), Math.round(h.y)); }
/* ---------------------------------------------------------------------
   16. PARTICLES, POPUPS, HUD, BANNER
   --------------------------------------------------------------------- */
function updateParts(dt) {
  for (let i = S.parts.length - 1; i >= 0; i--) {
    const p = S.parts[i]; p.life -= dt; if (p.life <= 0) { S.parts.splice(i, 1); continue; }
    p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
  }
  for (let i = S.pops.length - 1; i >= 0; i--) { const p = S.pops[i]; p.t += dt; if (p.t > p.dur) S.pops.splice(i, 1); }
  if (S.banner) { S.banner.t += dt; if (S.banner.t > S.banner.dur) S.banner = null; }
  S.shake = Math.max(0, S.shake - dt); S.glitch = Math.max(0, S.glitch - dt);
}
function drawParts() {
  S.parts.forEach(p => { ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); });
  S.pops.forEach(p => { const x = clamp(p.x, 2, W - tw(p.text, 1) - 2); otext(ctx, p.text, x, p.y - p.t * 22, 1, p.col, C.K); });
}
function drawHUD() {
  ctx.fillStyle = C.W; ctx.fillRect(0, 0, W, HUDH); ctx.fillStyle = C.K; ctx.fillRect(0, HUDH - 1, W, 1); ctx.fillStyle = C.P; ctx.fillRect(0, HUDH, W, 1);
  const D = DAYS(), day = D.days[Math.min(S.day, D.days.length - 1)], tm = timeStr(S.min), score = TX('tgif', 'score') + ' ' + pad(S.score, 6);
  const bar = (x, y) => {
    const lowBlink = S.energy < 25 && Math.floor(S.time * 6) % 2;
    ctx.fillStyle = C.K; ctx.fillRect(x, y, 50, 7); ctx.fillStyle = C.L; ctx.fillRect(x + 1, y + 1, 48, 5);
    ctx.fillStyle = lowBlink ? C.P : C.Y; ctx.fillRect(x + 1, y + 1, Math.round(48 * clamp(S.energy, 0, 100) / 100), 5);
  };
  const hearts = (xr, y) => { for (let i = 0; i < 3; i++) dtext(ctx, '♥', xr - (3 - i) * 7, y, 1, i < S.lives ? C.P : C.B); };
  if (!MOBILE) {
    const x = 4; dtext(ctx, day, x, 4, 1, C.P); dtext(ctx, tm, x + tw(day, 1) + 6, 4, 1, C.K);
    dtext(ctx, score, W / 2, 4, 1, C.K, 'center');
    hearts(W - 3, 4); const bx = W - 3 - 21 - 6 - 50; bar(bx, 4); dtext(ctx, TX('tgif', 'energy'), bx - 4, 4, 1, C.K, 'right');
  } else {
    dtext(ctx, day, 4, 3, 1, C.P); dtext(ctx, tm, 4 + tw(day, 1) + 5, 3, 1, C.K);
    dtext(ctx, score, W - 4, 3, 1, C.K, 'right');
    const en = TX('tgif', 'energy'); dtext(ctx, en, 4, 14, 1, C.K); bar(8 + tw(en, 1), 14); hearts(W - 3, 14);
  }
  const b = S.boss;
  if (b && !b.gone) {
    const bw = Math.min(200, Math.round(W * 0.6)), bx = Math.round((W - bw) / 2), by = HUDH + 13;
    otext(ctx, b.name, W / 2, HUDH + 4, 1, C.P, C.W, 'center');
    ctx.fillStyle = C.K; ctx.fillRect(bx - 1, by - 1, bw + 2, 8); ctx.fillStyle = C.B; ctx.fillRect(bx, by, bw, 6);
    ctx.fillStyle = C.Y; ctx.fillRect(bx, by, Math.round(bw * b.shown / b.maxHp), 6);
    ctx.fillStyle = b.hitT > 0 ? C.W : C.P; ctx.fillRect(bx, by, Math.round(bw * b.hp / b.maxHp), 6);
    ctx.fillStyle = C.K; for (let x = bx + 10; x < bx + bw; x += 10) ctx.fillRect(x, by, 1, 6);
  }
}
function drawBanner() {
  const bn = S.banner; if (!bn) return;
  if (bn.flash && Math.floor(bn.t * 8) % 2 === 0 && bn.t < 1.2) return;
  let sc = MOBILE ? 3 : 4; while (sc > 1 && tw(bn.text, sc) > W - 16) sc--;
  const y = Math.round(HUDH + (G - HUDH) * 0.3);
  otext(ctx, bn.text, W / 2, y, sc, bn.flash ? C.Y : C.P, C.K, 'center', C.K);
  if (bn.sub) { let s2 = 1; if (tw(bn.sub, 2) < W - 20) s2 = 2; otext(ctx, bn.sub, W / 2, y + 7 * sc + 8, s2 === 2 && MOBILE ? 1 : s2, C.K, C.W, 'center'); }
}
function glitchFx() {
  if (S.glitch <= 0) return;
  for (let i = 0; i < 3; i++) {
    const y = irand(HUDH + 2, H - 12), h = irand(2, 8), dx = irand(-12, 12);
    try { ctx.drawImage(cvs, 0, y * KS, cvs.width, h * KS, dx, y, W, h); } catch (e) { /* ignore */ }
  }
  ctx.fillStyle = pick([C.P, C.Y, C.K]); ctx.fillRect(0, irand(HUDH, H), W, 1);
}

/* ---------------------------------------------------------------------
   17. MAIN UPDATE / RENDER
   --------------------------------------------------------------------- */
function update(dt) {
  S.time += dt;
  if (S.paused || S.hackOpen) return;
  if (S.state === 'beach') { updateBeach(dt); return; }
  if (S.state !== 'play') { S.scroll += (S.state === 'intro' ? 40 : 0) * dt; updateParts(dt); return; }

  const D = DAYS(), week = S.mode === 'week';
  if (!S.result) {
    // clock
    const rate = S.boss ? 2 : D.rate;
    S.min += rate * dt;
    if (S.boss) S.min = Math.min(S.min, week ? 1049 : 900);
    else if (S.min >= D.end && S.day < D.days.length - 1) {
      S.day++; S.min = D.start[S.day]; SFX.day();
      banner(D.days[S.day], week ? (S.day === 4 ? TX('tgif', 'almost') : timeStr(S.min) + ' - ' + TX('tgif', 'again2')) : TX('tgif', 'why'), 1.8);
    }
    if (!S.boss && !S.bossDone && S.day === D.days.length - 1 && S.min >= D.bossAt) spawnBoss();
  }
  const p = progress();
  S.speed = S.result === 'lose' ? 0 : S.boss ? 70 : (175 + 105 * p);
  S.scroll += S.speed * dt;

  if (!S.result) {
    S.energy -= (week ? 1.0 + 0.6 * p : 1.3) * dt;
    if (S.energy <= 0) { S.energy = 0; const l = S.lives; hurt('BURNOUT!'); if (S.lives < l) S.energy = 60; else S.energy = 1; }
    S.score += dt * 10 * (1 + p);
    if (!S.boss) {
      if (!S.giants.length) S.spawnT -= dt;
      if (S.spawnT <= 0) spawnObstacle();
      S.giantT -= dt;
      if (S.giantT <= 0 && !S.giants.length && !S.obs.some(o => o.x > W * 0.45)) {
        spawnGiant(Math.random() < 0.55 ? 'sweep' : 'slam'); S.giantT = rand(10, 15) * (1 - 0.3 * p);
      }
    }
    S.bonusT -= dt; if (S.bonusT <= 0) { spawnBonus(); S.bonusT = rand(3.6, 6.4); }
    if (week && S.day >= 1) {
      while (S.papers.length < S.day * 3) S.papers.push({ x: W + rand(0, 200), y: rand(HUDH + 10, G - 70), vx: rand(60, 140), ph: rand(0, 6) });
      S.papers.forEach(pp => { pp.x -= (S.speed * 0.5 + pp.vx) * dt; pp.y += Math.sin(S.time * 3 + pp.ph) * 20 * dt; if (pp.x < -10) { pp.x = W + rand(0, 80); pp.y = rand(HUDH + 10, G - 70); } });
    }
    if (week && S.day >= 3) { S.glitchT -= dt; if (S.glitchT <= 0) { S.glitch = rand(0.05, 0.15); S.glitchT = rand(1.5, 4) * (S.day === 4 ? 0.5 : 1); } }
  }
  updatePlayer(dt, G, !S.result);
  updateObstacles(dt); updateBonuses(dt); updateGiants(dt); updateShots(dt); updateBoss(dt); updateEshots(dt); updateParts(dt);
  if (S.result) { S.endT -= dt; if (S.endT <= 0) showEnd(); }
}
function drawObstacle(o) {
  const x = Math.round(o.x), y = Math.round(o.y);
  if (o.k === 'logo') {
    if (!drawCustom(ctx, 'malus/logo', x, y, o.w, o.h, o.t)) otext(ctx, 'LOGO', x, y, o.sc, o.hitT > 0 ? C.W : C.P, C.K, null, C.Y);
    if (Math.floor(S.time * 6) % 2) otext(ctx, 'BIGGER!', x + o.w / 2, y - 11, 1, C.K, C.W, 'center');
    return;
  }
  const spr = SPR.ob[o.k], fr = spr[spr.length > 1 ? Math.floor(o.t * 6) % spr.length : 0];
  let dx = x;
  if (o.k === 'call') dx += Math.floor(S.time * 30) % 2;
  if (o.falling) { ctx.fillStyle = Math.floor(S.time * 10) % 2 ? C.K : C.P; ctx.fillRect(x + 4, G - 2, o.w - 8, 2); }
  if (!drawCustom(ctx, 'malus/' + o.k, dx, y, o.w, o.h, o.t)) {
    ctx.drawImage(o.hitT > 0 ? tinted(fr, C.W) : fr, dx, y);
    if (o.k === 'bug') { for (let i = 0; i < 6; i++) { ctx.fillStyle = pick([C.P, C.Y, C.K, C.W]); ctx.fillRect(x + irand(3, 20), y + irand(5, 16), irand(2, 6), 1); } }
    if (o.k === 'update') { const pct = Math.floor((o.t * 23) % 100); ctx.fillStyle = C.P; ctx.fillRect(x + 3, y + 12, Math.round(72 * pct / 100), 8); }
  }
  if (o.k === 'update') dtext(ctx, 'UPDATING ' + Math.floor((o.t * 23) % 100) + '%', x + 2, y + 1, 1, C.K);
  if (o.k === 'call' && Math.floor(S.time * 5) % 2) otext(ctx, 'INCOMING CALL', x + o.w / 2, y - 11, 1, C.P, C.W, 'center');
  if (o.k === 'internet' && Math.floor(S.time * 3) % 2) otext(ctx, 'NO SIGNAL', x + o.w / 2, y - 10, 1, C.K, C.W, 'center');
  if (o.k === 'contradictory') otext(ctx, Math.floor(S.time * 3) % 2 ? 'SÌ!' : 'NO!', x + o.w / 2, y - 10, 1, C.P, C.W, 'center');
}
function drawBonus(b) {
  const x = Math.round(b.x), y = Math.round(b.y);
  if (!drawCustom(ctx, 'bonus/' + b.k, x, y, b.w, b.h, b.t)) {
    ctx.drawImage(SPR.bn[b.k][0], x, y);
    if (b.k === 'coffee') { ctx.fillStyle = C.W; const s = Math.floor(b.t * 5) % 3; ctx.fillRect(x + 6 + (s === 1 ? 1 : 0), y + 1 + s, 1, 2); ctx.fillRect(x + 10 - (s === 2 ? 1 : 0), y + 3 - s % 2, 1, 2); }
  }
}
function render() {
  ctx.setTransform(KS, 0, 0, KS, 0, 0); ctx.imageSmoothingEnabled = false;
  let sx = 0, sy = 0;
  if (S.shake > 0) { const m = Math.min(4, Math.ceil(S.shake * 10)); sx = irand(-m, m); sy = irand(-m, m); }
  ctx.save(); ctx.translate(sx, sy);
  if (S.state === 'beach') { drawBeach(); ctx.restore(); return; }
  drawBackground();
  S.bonuses.forEach(drawBonus);
  S.obs.forEach(drawObstacle);
  drawBoss();
  S.giants.forEach(drawGiant);
  S.eshots.forEach(drawEshot);
  S.shots.forEach(drawShot);
  drawPlayer();
  drawParts();
  ctx.restore();
  if (S.state !== 'intro') { drawHUD(); drawBanner(); }
  glitchFx();
}
let last = 0;
function frame(t) {
  requestAnimationFrame(frame);
  if (!last) last = t;
  let dt = (t - last) / 1000; last = t;
  if (dt <= 0) return; if (dt > 0.05) dt = 0.05;
  try { update(dt); render(); } catch (e) { if (window.console) console.error(e); }
}

/* ---------------------------------------------------------------------
   18. SCREENS (DOM overlays)
   --------------------------------------------------------------------- */
const HINT = () => TX('tgif', MOBILE ? 'hintMobile' : 'hint');
const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const X = k => esc(TX('tgif', k));
const SCORELINE = () => `<p class="score">${X('score')} ${pad(S.score, 6)} · ${X('best')} ${pad(S.best, 6)}</p>`;
const SCREENS = {
  intro: () => {
    const li = LIST('tgifIntro').map(tr);
    return `<div class="panel intro">
    <h1 class="title"><span>THANK GUD</span> <span>IT'S FRIDAY</span></h1>
    <p class="sub">${X('subtitle')}</p>
    <div class="msg">${li.map((t, i) => `<p class="${i === 0 || i === li.length - 1 ? 'lead' : ''}">${esc(t)}</p>`).join('')}</div>
    <button class="btn primary blink" data-do="start">${X('start')}</button>
    <p class="hint">${esc(HINT())}</p></div>`;
  },
  weekWin: () => `<div class="panel">
    <h2 class="title big">${X('weekWinTitle')}</h2>
    <div class="msg"><p>${X('weekWin1')}</p><p>${X('weekWin2')}</p><p>${X('weekWin3')}</p><p class="lead">${X('weekWin4')}</p></div>
    ${SCORELINE()}
    <button class="btn primary" data-do="weekend">${X('weekWinCta')}</button></div>`,
  weekLose: () => `<div class="panel dark">
    <h2 class="title big">${X('weekLoseTitle')}</h2><h3 class="title mid">${X('weekLoseSub')}</h3>
    <div class="msg"><p>${X('weekLose1')}</p></div>
    ${SCORELINE()}
    <button class="btn primary" data-do="retry-week">${X('retry')}</button></div>`,
  wkndWin: () => `<div class="panel">
    <h2 class="title big">${X('wkndWinTitle')}</h2>
    <div class="msg"><p>${X('wkndWin1')}</p><p>${X('wkndWin2')}</p><p class="lead">${X('wkndWinUnlock')}</p></div>
    ${SCORELINE()}
    <button class="btn primary blink" data-do="secret">${X('wkndWinCta')}</button><br>
    <button class="btn" data-do="restart">${X('again')}</button></div>`,
  wkndLose: () => `<div class="panel dark">
    <h2 class="title big">${X('wkndLoseTitle')}</h2>
    <div class="msg"><p>${X('wkndLose1')}</p><p>${X('wkndLose2')}</p></div>
    ${SCORELINE()}
    <button class="btn primary" data-do="retry-weekend">${X('retry')}</button></div>`
};
let OVERLAY_NAME = null;
function showOverlay(name, focus) {
  OVERLAY_NAME = name; overlay.innerHTML = SCREENS[name](); overlay.hidden = false;
  if (focus) { const b = overlay.querySelector('.primary'); if (b) setTimeout(() => { try { b.focus({ preventScroll: true }); } catch (e) { /* */ } }, 60); }
}
function hideOverlay() { OVERLAY_NAME = null; overlay.hidden = true; overlay.innerHTML = ''; }
function showEnd() {
  S.state = 'end'; S.lastResult = S.result; S.result = null;
  S.score = Math.floor(S.score);
  if (S.score > S.best) { S.best = S.score; store.set('gud_best', String(S.best)); }
  const n = (S.mode === 'week' ? 'week' : 'wknd') + (S.lastResult === 'win' ? 'Win' : 'Lose');
  showOverlay(n, true);
}
function toIntro() {
  stopMusic(); resetRun('week'); S.state = 'intro'; menuBtn.hidden = true; showOverlay('intro');
}
function startRun(mode, opts) {
  opts = opts || {}; AU.init(); stopMusic();
  resetRun(mode); S.state = 'play'; S.lastResult = null; menuBtn.hidden = true; hideOverlay();
  const D = DAYS();
  if (opts.boss) { S.day = D.days.length - 1; S.min = D.bossAt; spawnBoss(); }
  else banner(D.days[0], mode === 'week' ? TX('tgif', 'goodLuck') : TX('tgif', 'freedom'), 1.8);
  if (!opts.silent) (mode === 'weekend' ? SFX.weekend : SFX.start)();
  focusGame();
}
function focusGame() { try { window.focus(); cvs.focus({ preventScroll: true }); } catch (e) { /* */ } }
overlay.addEventListener('click', e => {
  const b = e.target.closest('[data-do]'); if (!b) return; AU.init();
  const a = b.dataset.do;
  if (a === 'start' || a === 'retry-week' || a === 'restart') startRun('week');
  else if (a === 'weekend' || a === 'retry-weekend') startRun('weekend');
  else if (a === 'secret') startBeach();
});

/* ---------------------------------------------------------------------
   19. HACK PANEL — secret codes, available from every screen
   --------------------------------------------------------------------- */
function resetInputs() { Object.keys(input).forEach(k => { input[k] = false; }); document.querySelectorAll('[data-act].on').forEach(b => b.classList.remove('on')); }
function openHack() {
  AU.init(); S.hackOpen = true; hackEl.hidden = false; hackMsg.textContent = ''; hackInput.value = ''; resetInputs();
  setTimeout(() => { try { hackInput.focus({ preventScroll: true }); } catch (e) { hackInput.focus(); } }, 30);
}
function closeHack() { S.hackOpen = false; hackEl.hidden = true; hackInput.blur(); focusGame(); }
function handleCode(raw) {
  const code = String(raw || '').trim().toLowerCase();
  if (code === 'boss') { closeHack(); SFX.hack(); startRun(S.mode, { boss: true, silent: true }); return true; }
  if (code === 'tequila') { closeHack(); startRun('weekend'); return true; }
  if (code === 'ilovegud') { closeHack(); startBeach(); return true; }
  const adm = String(((CONTENT.settings || {}).adminCode) || 'gudmin').toLowerCase();
  if (code && code === adm) { closeHack(); SFX.hack(); try { (window.top || window).location.href = CFG.adminUrl || '../../admin/'; } catch (e) { location.href = CFG.adminUrl || '../../admin/'; } return true; }
  SFX.denied(); hackMsg.textContent = 'ACCESS DENIED';
  const box = hackForm; box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
  try { hackInput.select(); } catch (e) { /* */ }
  return false;
}
hackBtn.addEventListener('click', () => (S.hackOpen ? closeHack() : openHack()));
$('hackClose').addEventListener('click', closeHack);
hackForm.addEventListener('submit', e => { e.preventDefault(); AU.init(); handleCode(hackInput.value); });
hackInput.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') closeHack(); });
menuBtn.addEventListener('click', () => { AU.init(); toIntro(); });
function syncMute() { muteBtn.textContent = AU.muted ? (LANG === 'it' ? 'AUDIO OFF' : 'SOUND OFF') : (LANG === 'it' ? 'AUDIO ON' : 'SOUND ON'); muteBtn.setAttribute('aria-pressed', AU.muted ? 'true' : 'false'); }
muteBtn.addEventListener('click', () => { AU.init(); AU.setMute(!AU.muted); syncMute(); tellParent({ mute: AU.muted }); focusGame(); });
syncMute();
HOOKS.mute.push(() => syncMute());
const CB_L = { left: ['SINISTRA', 'LEFT'], right: ['DESTRA', 'RIGHT'], duck: ['SCHIVA', 'DODGE'], shoot: ['SPARA', 'SHOOT'], jump: ['SALTA', 'JUMP'] };
function cbLabels() { document.querySelectorAll('.cb[data-act]').forEach(b => { const l = CB_L[b.dataset.act], sp = b.querySelector('span'); if (l && sp) { sp.textContent = l[LANG === 'it' ? 0 : 1]; b.setAttribute('aria-label', l[LANG === 'it' ? 0 : 1]); } }); }
cbLabels();
HOOKS.lang.push(() => { cbLabels(); syncMute(); if (OVERLAY_NAME) showOverlay(OVERLAY_NAME); const lb = $('langBtn'); if (lb) lb.textContent = LANG === 'it' ? 'EN' : 'IT'; });
HOOKS.code.push(c => { AU.init(); handleCode(c); });
{ const lb = $('langBtn'); if (lb) { lb.textContent = LANG === 'it' ? 'EN' : 'IT'; lb.addEventListener('click', () => { AU.init(); setLang(LANG === 'it' ? 'en' : 'it'); tellParent({ lang: LANG }); focusGame(); }); } }

/* ---------------------------------------------------------------------
   20. INPUT — keyboard + touch
   --------------------------------------------------------------------- */
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', Space: 'jump', KeyW: 'jump', ArrowDown: 'duck', KeyS: 'duck', KeyK: 'shoot' };
window.addEventListener('keydown', e => {
  if (S.hackOpen) { if (e.key === 'Escape') closeHack(); return; }
  AU.init();
  const tag = e.target && e.target.tagName;
  const a = KEYMAP[e.code];
  if (tag === 'BUTTON' && (e.code === 'Space' || e.code === 'Enter')) return;
  if (a) e.preventDefault();
  if (S.state === 'intro' && (e.code === 'Enter' || e.code === 'Space')) { startRun('week'); return; }
  if (S.state === 'end' && e.code === 'Enter') { const b = overlay.querySelector('.primary'); if (b) b.click(); return; }
  if (!a) return;
  if (a === 'jump' && !input.jump) pressJump();
  input[a] = true;
});
window.addEventListener('keyup', e => { const a = KEYMAP[e.code]; if (a) input[a] = false; });
window.addEventListener('blur', resetInputs);
document.querySelectorAll('[data-act]').forEach(btn => {
  const a = btn.dataset.act;
  const on = e => { e.preventDefault(); AU.init(); try { btn.setPointerCapture(e.pointerId); } catch (_) { /* */ } if (a === 'jump' && !input.jump) pressJump(); input[a] = true; btn.classList.add('on'); };
  const off = () => { input[a] = false; btn.classList.remove('on'); };
  btn.addEventListener('pointerdown', on); btn.addEventListener('pointerup', off); btn.addEventListener('pointercancel', off);
  btn.addEventListener('lostpointercapture', off); btn.addEventListener('contextmenu', e => e.preventDefault());
});
cvs.addEventListener('pointerdown', () => { AU.init(); if (S.state === 'beach' || (MOBILE && S.state === 'play')) pressJump(); focusGame(); });
document.addEventListener('visibilitychange', () => { S.paused = document.hidden; if (document.hidden) resetInputs(); });

/* ---------------------------------------------------------------------
   21. BOOT
   --------------------------------------------------------------------- */
buildSprites();
resize();
if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));
toIntro();
requestAnimationFrame(frame);
loadContent().then(() => { if (OVERLAY_NAME) showOverlay(OVERLAY_NAME); tellParent({ ready: 'tgif' }); });
// tiny debug/test hook (harmless): window.GUD
window.GUD = { state: S, player: P, input, startRun, handleCode, startBeach, toIntro, get boss() { return S.boss; } };
