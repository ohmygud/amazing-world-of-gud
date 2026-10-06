/* ---------------- TEXT HELPERS ---------------- */
const lf = (it, en, v) => { let s = LANG === 'en' ? en : it; Object.keys(v || {}).forEach(k => { s = s.split('{' + k + '}').join(String(v[k])); }); return s; };
const cpl = () => Math.floor((W - 8 - 16 + 1) / 6);

/* ---------------- UI LAYERS ---------------- */
function say(items, opts) {
  opts = opts || {}; if (!Array.isArray(items)) items = [items];
  const pages = [];
  items.forEach(it => { const lines = wrap(tr(it), cpl()); for (let i = 0; i < lines.length; i += 2) pages.push(lines.slice(i, i + 2)); });
  if (!pages.length) return Promise.resolve();
  return pushUI({ type: 'say', pages, p: 0, chars: 0, auto: opts.auto, at: 0 });
}
function choose(items, opts) {
  opts = opts || {};
  return pushUI({ type: 'menu', items: items.map(tr), idx: opts.idx || 0, cols: opts.cols || 1, x: opts.x, y: opts.y, w: opts.w, h: opts.h, cancel: !!opts.cancel, info: opts.info, title: opts.title });
}
function pushScreen(scr) { scr.type = 'screen'; return pushUI(scr); }
function waitPress() { return pushUI({ type: 'wait' }); }
function updateUI(dt) {
  const u = topUI(); if (!u) return;
  const A = pressed.has('a'), Bk = pressed.has('b'), St = pressed.has('start');
  if (u.type === 'say') {
    const page = u.pages[u.p], total = page.join('').length;
    if (u.chars < total) { u.chars += dt * 70; if (A || Bk) u.chars = total; return; }
    u.at += dt;
    if (A || Bk || (u.auto && u.at > u.auto)) { if (A || Bk) J.blip(); u.p++; u.chars = 0; u.at = 0; if (u.p >= u.pages.length) u.resolve(); }
  } else if (u.type === 'menu') {
    const n = u.items.length, c = u.cols;
    if (pressed.has('up')) { u.idx = (u.idx - c + n) % n; J.blip(); }
    if (pressed.has('down')) { u.idx = (u.idx + c) % n; J.blip(); }
    if (c > 1 && pressed.has('left')) { u.idx = (u.idx - 1 + n) % n; J.blip(); }
    if (c > 1 && pressed.has('right')) { u.idx = (u.idx + 1) % n; J.blip(); }
    if (A) { J.select(); u.resolve(u.idx); } else if (Bk && u.cancel) { J.blip(); u.resolve(-1); }
  } else if (u.type === 'wait') { if (A || St) { J.select(); u.resolve(); } }
  else if (u.type === 'screen') u.update(dt);
}
function box(x, y, w, h, fill) {
  ctx.fillStyle = C.K; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill || C.W; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.fillStyle = C.P; ctx.fillRect(x + 3, y + 3, w - 6, 1); ctx.fillRect(x + 3, y + h - 4, w - 6, 1); ctx.fillRect(x + 3, y + 3, 1, h - 6); ctx.fillRect(x + w - 4, y + 3, 1, h - 6);
}
function cursor(x, y, col) { ctx.fillStyle = col || C.K; for (let i = 0; i < 4; i++) ctx.fillRect(x + i, y + i, 1, 7 - i * 2); }
function drawUI() {
  S.ui.forEach(u => {
    if (u.type === 'say') {
      const y = H - 48; box(4, y, W - 8, 46);
      let left = Math.floor(u.chars);
      u.pages[u.p].forEach((l, i) => { const s = l.slice(0, Math.max(0, left)); left -= l.length; dtext(ctx, s, 12, y + 12 + i * 15, 1, C.K); });
      if (u.chars >= u.pages[u.p].join('').length && Math.floor(S.time * 3) % 2) { ctx.fillStyle = C.P; ctx.fillRect(W - 20, y + 34, 7, 2); ctx.fillRect(W - 19, y + 36, 5, 1); ctx.fillRect(W - 18, y + 37, 3, 1); ctx.fillRect(W - 17, y + 38, 1, 1); }
    } else if (u.type === 'menu') {
      const c = u.cols, rows = Math.ceil(u.items.length / c);
      const colW = Math.max(...u.items.map(s => tw(s, 1))) + 18;
      const w = u.w || colW * c + 12, h = u.h || rows * 14 + 14;
      const x = u.x != null ? u.x : W - w - 4, y = u.y != null ? u.y : H - 48 - h - 2;
      if (u.title) { const tw_ = tw(tr(u.title), 1) + 14; box(x, y - 18, Math.max(tw_, 40), 18, C.Y); dtext(ctx, tr(u.title), x + 7, y - 12, 1, C.K); }
      box(x, y, w, h);
      const cw = (w - 12) / c;
      u.items.forEach((s, i) => {
        const cx = Math.round(x + 14 + (i % c) * cw), cy = Math.round(y + 9 + Math.floor(i / c) * (rows > 2 || !u.h ? 14 : (h - 14) / rows));
        dtext(ctx, s, cx, cy, 1, C.K);
        if (i === u.idx) cursor(cx - 8, cy, C.P);
      });
      if (u.info) { const t = u.info(u.idx); if (t) { const iw = tw(t, 1) + 14; box(W - iw - 4, y - 20, iw, 18, C.Y); dtext(ctx, t, W - iw + 3, y - 14, 1, C.K); } }
    } else if (u.type === 'screen') u.draw();
  });
}

/* ---------------- WORLD ---------------- */
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
const curMap = () => MAPS[S.map];
function tileAt(m, x, y) { if (x < 0 || y < 0 || x >= m.w || y >= m.h) return m.outdoor ? 'T' : ' '; return m.g[y][x]; }
function objAt(m, x, y) { return m.objs.find(o => x >= o.x && x < o.x + (o.w || 1) && y >= o.y && y < o.y + (o.h || 1)); }
function npcAt(m, x, y) { return m.npcs.find(n => n.x === x && n.y === y); }
function blocked(m, x, y) {
  if (SOLID.has(tileAt(m, x, y))) return true;
  for (const b of (m.blds || [])) if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return !(x === b.x + b.door && y === b.y + b.h - 1);
  return !!(objAt(m, x, y) || npcAt(m, x, y));
}
function fadeTo(v) { return (async () => { const a = S.fade; for (let i = 1; i <= 4; i++) { S.fade = a + (v - a) * i / 4; await wait(0.05); } })(); }
async function goTo(map, x, y, dir) {
  S.busy = true; J.door(); await fadeTo(1);
  S.map = map; S.px = x; S.py = y; S.dir = dir; S.moving = false;
  const m = MAPS[map]; placeDog(); S.zone = m.outdoor ? zoneOf(y) : null; S.loc = { text: m.outdoor ? zoneName(S.zone) : m.title, t: 0 };
  await fadeTo(0); S.busy = false; save();
}
/* ---------------- LUDO, GUD's Chinese crested, follows her everywhere ---------------- */
function placeDog() {
  const m = curMap(); if (!m) return;
  const [dx, dy] = DIRS[S.dir] || [0, 1];
  const cand = [[-dx, -dy], [dy, dx], [-dy, -dx], [dx, dy], [1, 1], [-1, 1], [1, -1], [-1, -1]];
  let bx = S.px, by = S.py;
  for (const [ax, ay] of cand) { const x = S.px + ax, y = S.py + ay; if (!blocked(m, x, y) && tileAt(m, x, y) !== 'D' && !(m.warps || []).some(w => w.x === x && w.y === y)) { bx = x; by = y; break; } }
  S.dog = { map: S.map, x: bx, y: by, fx: bx, fy: by, dir: S.dir, moving: false };
}
function dogStartMove() {
  const d = S.dog; if (!d || d.map !== S.map) { placeDog(); return; }
  d.fx = d.x; d.fy = d.y;
  if (d.x === S.px && d.y === S.py) { d.moving = false; return; }
  d.tx = S.px; d.ty = S.py; d.moving = true;
  d.dir = d.tx > d.x ? 'right' : d.tx < d.x ? 'left' : d.ty > d.y ? 'down' : 'up';
}
function dogArrive() { const d = S.dog; if (d && d.moving) { d.x = d.tx; d.y = d.ty; d.moving = false; } }
function onArrive() {
  const m = curMap(), t = tileAt(m, S.px, S.py);
  if (m.outdoor) {
    const w = m.warps.find(v => v.x === S.px && v.y === S.py);
    if (w) { const [ex, ey] = entryPos(w.to); goTo(w.to, ex, ey, 'up'); return; }
    const zone = zoneOf(S.py);
    if (zone !== S.zone) { S.zone = zone; S.loc = { text: zoneName(zone), t: 0 }; }
    if (t === '"') { J.grass(); S.rustle = 0.25; if (Math.random() < 0.13) wildEncounter(); }
  } else if (t === 'D') {
    const b = BUILDINGS.find(v => v.id === m.id); goTo('town', b.x + b.door, b.y + b.h, 'down');
  }
}
function worldUpdate(dt) {
  S.bump -= dt;
  if (S.loc) { S.loc.t += dt; if (S.loc.t > 2.4) S.loc = null; }
  S.rustle = Math.max(0, (S.rustle || 0) - dt);
  const m = curMap();
  m.npcs.forEach(n => { if (n.script === 'leader' || n.script === 'client' || n.script === 'heal') return; n.tt = (n.tt || rand(2, 5)) - dt; if (n.tt <= 0) { n.tt = rand(2.5, 6); n.dir = pick(['up', 'down', 'left', 'right']); } });
  if (S.moving) {
    S.mt += dt * 4.6;
    if (S.mt >= 1) { S.moving = false; S.mt = 0; S.px += DIRS[S.dir][0]; S.py += DIRS[S.dir][1]; S.step++; dogArrive(); onArrive(); }
    if (S.moving || S.busy || S.ui.length) return;
  }
  if (S.ui.length || S.busy || S.fade > 0) return;
  if (pressed.has('start')) { startMenu(); return; }
  if (pressed.has('a')) { interact(); return; }
  const d = held.up ? 'up' : held.down ? 'down' : held.left ? 'left' : held.right ? 'right' : null;
  if (!d) { S.turnT = 0; return; }
  if (S.dir !== d) { S.dir = d; S.turnT = 0.09; return; }
  if (S.turnT > 0) { S.turnT -= dt; return; }
  const nx = S.px + DIRS[d][0], ny = S.py + DIRS[d][1];
  if (blocked(m, nx, ny)) { if (S.bump <= 0) { J.bump(); S.bump = 0.3; } return; }
  dogStartMove(); S.moving = true; S.mt = 0;
}
async function run(fn) { S.busy = true; try { await fn(); } catch (e) { console.error(e); } S.busy = false; }
function interact() {
  const m = curMap(), [dx, dy] = DIRS[S.dir], x = S.px + dx, y = S.py + dy;
  if (S.dog && S.dog.map === S.map && S.dog.x === x && S.dog.y === y && !(x === S.px && y === S.py)) { S.dog.dir = OPP[S.dir]; run(() => ludoScript()); return; }
  const n = npcAt(m, x, y);
  if (n) { n.dir = OPP[S.dir]; n.tt = 4; run(() => npcScript(n)); return; }
  const o = objAt(m, x, y);
  if (o) { if (o.script) run(() => SCRIPTS[o.script](o)); else run(() => itemScript(o)); }
}
function npcScript(n) {
  if (n.script) return SCRIPTS[n.script](n);
  return say(tr(n.name) ? tr(n.name) + ': ' + tr(n.say) : n.say);
}
function camera(m) {
  const mw = m.w * T, mh = m.h * T;
  const ox = S.moving ? DIRS[S.dir][0] * S.mt : 0, oy = S.moving ? DIRS[S.dir][1] * S.mt : 0;
  let cx = (S.px + ox) * T + 8 - W / 2, cy = (S.py + oy) * T + 8 - H / 2;
  cx = mw <= W ? (mw - W) / 2 : clamp(cx, 0, mw - W);
  cy = mh <= H ? (mh - H) / 2 : clamp(cy, 0, mh - H);
  return [Math.round(cx), Math.round(cy)];
}
function drawChar(look, dir, f, x, y) { ctx.drawImage(person(look, dir, f), x - 8, y - 16); }
function drawWorld() {
  const m = curMap(); ctx.fillStyle = C.K; ctx.fillRect(0, 0, W, H);
  const [cx, cy] = camera(m);
  const x0 = Math.floor(cx / T), y0 = Math.floor(cy / T), x1 = Math.ceil((cx + W) / T), y1 = Math.ceil((cy + H) / T);
  const wf = Math.floor(S.time * 2) % 2;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    let t = tileAt(m, x, y); if (t === '~') t = '~' + wf;
    ctx.drawImage(TILES[t] || TILES['.'], x * T - cx, y * T - cy);
  }
  const list = [];
  (m.blds || []).forEach(b => list.push({ y: b.y + b.h - 0.5, draw: () => ctx.drawImage(b.spr, b.x * T - cx, (b.y + b.h) * T - b.spr.height - cy) }));
  m.objs.forEach(o => list.push({ y: o.y + (o.h || 1) - (o.wall ? 1 : 0.6), draw: () => { const s = o.spr, ox = o.x * T + Math.round(((o.w || 1) * T - s.width) / 2) - cx, oy = (o.y + (o.h || 1)) * T - s.height - cy; ctx.drawImage(s, ox, oy); if (o.item && o.item.media && o.item.media.length) sparkle(ox + s.width - 3, oy + 1, o.x * 7); } }));
  m.npcs.forEach(n => list.push({ y: n.y, draw: () => drawChar(n.look, n.dir, 0, n.x * T - cx, n.y * T - cy) }));
  if (!S.dog || S.dog.map !== S.map) placeDog();
  { const d = S.dog, k = d.moving && S.moving ? S.mt : 0;
    const dxp = (d.moving ? d.fx + (d.tx - d.fx) * k : d.x), dyp = (d.moving ? d.fy + (d.ty - d.fy) * k : d.y);
    const df = d.moving && S.moving ? (S.mt < 0.5 ? 1 : 0) : (Math.floor(S.time * 1.5) % 4 === 0 ? 1 : 0) * 0;
    const same = !d.moving && d.x === S.px && d.y === S.py;
    list.push({ y: dyp + (same ? -0.02 : 0), draw: () => {
      const sx = Math.round(dxp * T) - cx - 4, sy = Math.round(dyp * T) - cy - 3 - (d.moving && S.moving && S.mt > 0.25 && S.mt < 0.75 ? 1 : 0);
      ctx.drawImage(ludo(d.dir, df), sx, sy);
      if (!d.moving && tileAt(m, d.x, d.y) === '"') ctx.drawImage(TILES['"'], 0, 8, 16, 8, Math.round(dxp * T) - cx, Math.round(dyp * T) - cy + 8, 16, 8);
    } });
  }
  const ox = S.moving ? DIRS[S.dir][0] * S.mt : 0, oy = S.moving ? DIRS[S.dir][1] * S.mt : 0;
  const ppx = Math.round((S.px + ox) * T) - cx, ppy = Math.round((S.py + oy) * T) - cy;
  const f = S.moving && S.mt < 0.55 ? (S.step % 2 ? 1 : 2) : 0;
  list.push({ y: S.py + oy + 0.01, draw: () => {
    drawChar('gud', S.dir, f, ppx, ppy);
    if (!S.moving && tileAt(m, S.px, S.py) === '"') ctx.drawImage(TILES['"'], 0, 8, 16, 8, ppx, ppy + 8, 16, 8);
  } });
  list.sort((a, b) => a.y - b.y).forEach(d => d.draw());
  if (S.rustle > 0) { ctx.fillStyle = C.P; for (let i = 0; i < 4; i++) ctx.fillRect(ppx + 2 + i * 4, ppy + 10 - Math.round(S.rustle * 20) + (i % 2) * 2, 2, 2); }
  if (S.loc) { const t = tr(S.loc.text), w = tw(t, 1) + 16; box(4, 4, w, 20, C.Y); dtext(ctx, t, 12, 11, 1, C.K); }
}

function zoneOf(y) { return y >= 41 ? 'NEW' : y >= 32 ? 'LUCCA' : y >= 21 ? 'ROUTE' : 'FI'; }
function zoneName(z) { return z === 'NEW' ? L('QUARTIERE NUOVO', 'NEW DISTRICT') : z === 'LUCCA' ? 'LUCCA' : z === 'ROUTE' ? L('VIA DEL SEGNO', 'ROUTE OF THE MARK') : L('FIRENZE', 'FLORENCE'); }
function sparkle(x, y, ph) {
  const t = (S.time * 3 + ph) % 3; if (t > 1.6) return;
  const s = t < 0.8 ? 1 : 2; ctx.fillStyle = C.Y;
  ctx.fillRect(x - s, y, s * 2 + 1, 1); ctx.fillRect(x, y - s, 1, s * 2 + 1); ctx.fillStyle = C.W; ctx.fillRect(x, y, 1, 1);
}

