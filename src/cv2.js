/* ---------------- TEXT HELPERS ---------------- */
const lf = (it, en, v) => { let s = S.lang === 'en' ? en : it; Object.keys(v || {}).forEach(k => { s = s.split('{' + k + '}').join(String(v[k])); }); return s; };
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
  const m = MAPS[map]; S.loc = { text: m.outdoor ? (y >= 32 ? 'LUCCA' : y >= 21 ? L('VIA DEL SEGNO', 'ROUTE OF THE MARK') : L('FIRENZE', 'FLORENCE')) : m.title, t: 0 };
  await fadeTo(0); S.busy = false; save();
}
function onArrive() {
  const m = curMap(), t = tileAt(m, S.px, S.py);
  if (m.outdoor) {
    const w = m.warps.find(v => v.x === S.px && v.y === S.py);
    if (w) { goTo(w.to, 5, 7, 'up'); return; }
    const zone = S.py >= 32 ? 'LUCCA' : S.py >= 21 ? 'ROUTE' : 'FI';
    if (zone !== S.zone) { S.zone = zone; S.loc = { text: zone === 'LUCCA' ? 'LUCCA' : zone === 'ROUTE' ? L('VIA DEL SEGNO', 'ROUTE OF THE MARK') : L('FIRENZE', 'FLORENCE'), t: 0 }; }
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
    if (S.mt >= 1) { S.moving = false; S.mt = 0; S.px += DIRS[S.dir][0]; S.py += DIRS[S.dir][1]; S.step++; onArrive(); }
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
  S.moving = true; S.mt = 0;
}
async function run(fn) { S.busy = true; try { await fn(); } catch (e) { console.error(e); } S.busy = false; }
function interact() {
  const m = curMap(), [dx, dy] = DIRS[S.dir], x = S.px + dx, y = S.py + dy;
  const n = npcAt(m, x, y);
  if (n) { n.dir = OPP[S.dir]; n.tt = 4; run(() => npcScript(n)); return; }
  const o = objAt(m, x, y);
  if (o) { if (o.script) run(() => SCRIPTS[o.script](o)); else run(() => say(Array.isArray(o.text) ? o.text : [o.text])); }
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
function drawChar(look, dir, f, x, y) { ctx.drawImage(person(look, dir, f), x - 1, y - 5); }
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
  m.objs.forEach(o => list.push({ y: o.y + (o.h || 1) - (o.wall ? 1 : 0.6), draw: () => { const s = o.spr; ctx.drawImage(s, o.x * T + Math.round(((o.w || 1) * T - s.width) / 2) - cx, (o.y + (o.h || 1)) * T - s.height - cy); } }));
  m.npcs.forEach(n => list.push({ y: n.y, draw: () => drawChar(n.look, n.dir, 0, n.x * T - cx, n.y * T - cy) }));
  const ox = S.moving ? DIRS[S.dir][0] * S.mt : 0, oy = S.moving ? DIRS[S.dir][1] * S.mt : 0;
  const ppx = Math.round((S.px + ox) * T) - cx, ppy = Math.round((S.py + oy) * T) - cy;
  const f = S.moving && S.mt < 0.55 ? (S.step % 2 ? 1 : 2) : 0;
  list.push({ y: S.py + oy + 0.01, draw: () => {
    drawChar('gud', S.dir, f, ppx, ppy);
    if (!S.moving && tileAt(m, S.px, S.py) === '"') ctx.drawImage(TILES['"'], 0, 9, 16, 7, ppx, ppy + 9, 16, 7);
  } });
  list.sort((a, b) => a.y - b.y).forEach(d => d.draw());
  if (S.rustle > 0) { ctx.fillStyle = C.P; for (let i = 0; i < 4; i++) ctx.fillRect(ppx + 2 + i * 4, ppy + 10 - Math.round(S.rustle * 20) + (i % 2) * 2, 2, 2); }
  if (S.loc) { const t = tr(S.loc.text), w = tw(t, 1) + 16; box(4, 4, w, 20, C.Y); dtext(ctx, t, 12, 11, 1, C.K); }
}

/* ---------------- SCRIPTS ---------------- */
const BAT = {
  teaching: { name: L('BRIEF IN MILANESE', 'MILANESE BRIEF'), spr: 'brief', hp: 70, lv: 31, weak: 0, moves: [[L('SPIEGONE', 'LONG RANT'), 10], [L('NON SO COSA VOGLIO', 'NO IDEA WHAT I WANT'), 12], [L('MA ANCHE NO', 'OR NOT'), 9]],
    pre: L('Per insegnare devi saper tradurre un BRIEF IN MILANESE. Vediamo!', 'To teach, you must decode a MILANESE BRIEF. Let\'s see!'), post: L('Brava. Hai il metodo.', 'Well done. You have the method.') },
  studio: { name: L('F24', 'TAX FORM F24'), spr: 'f24', hp: 74, lv: 32, weak: 3, moves: [[L('SCADENZA', 'DEADLINE'), 12], [L('RAVVEDIMENTO', 'LATE FEE'), 10], [L('BOLLO', 'STAMP DUTY'), 8]],
    pre: L('Aprire uno studio è bellissimo. Poi arrivano gli F24.', 'Opening a studio is wonderful. Then the tax forms arrive.'), post: L('Conti in ordine. Ti meriti questa.', 'Books balanced. You earned this.') },
  library: { name: L('EMAIL NON LETTA', 'UNREAD EMAIL'), spr: 'email', hp: 72, lv: 31, weak: 2, moves: [[L('RE: RE: RE:', 'RE: RE: RE:'), 11], [L('CC: TUTTI', 'CC: ALL'), 12], [L('PROMEMORIA', 'REMINDER'), 9]],
    pre: L('Silenzio! Prima rispondi a questa EMAIL NON LETTA.', 'Silence! First answer this UNREAD EMAIL.'), post: L('Puoi prendere in prestito tutti i libri che vuoi.', 'You may borrow every book you like.') },
  gallery: { name: L('VOCALE 4 MIN', '4-MIN VOICE NOTE'), spr: 'voice', hp: 76, lv: 33, weak: 2, moves: [[L('PREAMBOLO', 'PREAMBLE'), 9], [L('ALLORA, NIENTE...', 'SO, ANYWAY...'), 11], [L('RIASSUNTO', 'RECAP'), 12]],
    pre: L('Prima di parlare d\'arte, ascolta il mio VOCALE di 4 minuti.', 'Before we talk art, listen to my 4-minute VOICE NOTE.'), post: L('Concettualmente ineccepibile.', 'Conceptually flawless.') },
  type: { name: L('SOFTWARE BUG', 'SOFTWARE BUG'), spr: 'bug', hp: 78, lv: 34, weak: 1, moves: [[L('CRASH', 'CRASH'), 12], [L('KERNING ROTTO', 'BROKEN KERNING'), 11], [L('FONT MANCANTE', 'MISSING FONT'), 10]],
    pre: L('Ho piratato un font! E mi porto dietro un BUG.', 'I pirated a font! And I brought a BUG.'), post: L('Va bene, restituisco il font. Con licenza.', 'Fine, I\'ll return the font. Licensed.') },
  lucca: { name: L('LOGO PIÙ GRANDE', 'BIGGER LOGO'), spr: 'logo', hp: 80, lv: 35, weak: 1, moves: [[L('PIÙ GRANDE!', 'BIGGER!'), 12], [L('ANCORA!', 'MORE!'), 11], [L('FA POP?', 'DOES IT POP?'), 10]],
    pre: L('Sulle mura si passa solo se resisti al LOGO PIÙ GRANDE!', 'You only pass the walls if you resist the BIGGER LOGO!'), post: L('Le mura sono tue. Buon compleanno, Lucca.', 'The walls are yours. Happy birthday, Lucca.') },
  client: { name: L('BIG CLIENT', 'BIG CLIENT'), spr: 'client', hp: 150, lv: 99, weak: 3, boss: true,
    moves: [[L('LOGO PIÙ GRANDE', 'MAKE IT BIGGER'), 15], [L('CI SIAMO QUASI', 'ALMOST THERE'), 14], [L('MIO CUGINO LO FA', 'MY COUSIN CAN DO IT'), 17], [L('ENTRO IERI', 'BY YESTERDAY'), 16]] }
};
const MOVES = [
  { n: L('ART DIRECTION', 'ART DIRECTION'), p: 28, a: 95, pp: 15 },
  { n: L('KERNING', 'KERNING'), p: 22, a: 100, pp: 20 },
  { n: L('LETTERING', 'LETTERING'), p: 34, a: 85, pp: 10 },
  { n: L('DIRITTI UMANI', 'HUMAN RIGHTS'), p: 45, a: 90, pp: 5 }
];
const WILD_MOVES = [[L('FASCINO', 'CHARM'), 4], [L('CURIOSITÀ', 'CURIOSITY'), 5], [L('ISPIRAZIONE', 'INSPIRATION'), 3]];
function heal() { S.hp = S.maxhp; S.pp = MOVES.map(m => m.pp); S.coffee = Math.max(S.coffee, 3); }
async function afterLose() {
  heal(); await goTo('centro', 5, 4, 'up');
  await say(L('BARISTA: Un caffè e una pausa, e GUD è di nuovo in piedi. Riprova!', 'BARISTA: A coffee and a break, and GUD is back on her feet. Try again!'));
}
const SCRIPTS = {
  async prof(n) {
    const b = S.badges.length, c = S.caught.filter(i => i < 12).length;
    if (!b && !c) await say([L('PROF. SERIF: Premi START per aprire il menu: GUDDEX, scheda di GUD, zaino e CV rapido.', 'PROF. SERIF: Press START to open the menu: GUDDEX, GUD\'s card, bag and quick CV.'),
      L('Le 6 medaglie si vincono in Accademia, Studio Ergonauth, Biblioteca, Galleria e, a Lucca, in Fonderia Typodiva e Lucca Crea.', 'The 6 badges are won at the Academy, Ergonauth Studio, Library, Gallery and, in Lucca, at Typodiva Foundry and Lucca Crea.')]);
    else if (S.hof && c < 12) await say(L('PROF. SERIF: Sei nella Hall of Fame! Si dice che, catturati tutti i 12 GUDMON, ne appaia un tredicesimo.', 'PROF. SERIF: You made the Hall of Fame! Legend says that once all 12 GUDMON are caught, a 13th appears.'));
    else await say(lf('PROF. SERIF: Hai {b} medaglie su 6 e {c} GUDMON su 12. Ottimo lavoro!', 'PROF. SERIF: You have {b} of 6 badges and {c} of 12 GUDMON. Great work!', { b, c }));
  },
  async leader(n) {
    const id = n.sec, sec = CV.sections[id], bt = BAT[id], name = tr(n.name);
    if (S.badges.includes(id)) { await say(name + ': ' + tr(sec.summary)); return; }
    await say(name + ': ' + tr(bt.pre));
    const r = await battle({ kind: 'trainer', enemy: bt, look: n.look, leader: name });
    if (r !== 'win') return;
    await say(name + ': ' + tr(bt.post));
    S.badges.push(id); J.badge();
    await say(lf('GUD riceve la {b}!', 'GUD received the {b}!', { b: tr(sec.badge) }));
    await say(tr(sec.summary));
    save();
    if (S.badges.length === 6) await say(L('Tutte e 6 le medaglie! BIG CLIENT ti aspetta a Lucca, sotto la Torre Guinigi.', 'All 6 badges! BIG CLIENT is waiting in Lucca, below the Guinigi Tower.'));
  },
  async client(n) {
    if (S.hof) { await say(L('BIG CLIENT: Approvato. Non lo ripeterò.', 'BIG CLIENT: Approved. I won\'t say it twice.')); return; }
    if (S.badges.length < 6) { await say(lf('BIG CLIENT: Ah, sei tu. Torna quando avrai 6 medaglie. Ne hai {b}. Io intanto scrivo a tutti in CC.', 'BIG CLIENT: Oh, it\'s you. Come back with 6 badges. You have {b}. Meanwhile I\'ll email everyone in CC.', { b: S.badges.length })); return; }
    await say(L('BIG CLIENT: Pensavi di aver finito? Ultimo giro di revisioni!', 'BIG CLIENT: Thought you were done? One last round of revisions!'));
    const r = await battle({ kind: 'trainer', enemy: BAT.client, look: 'client', leader: 'BIG CLIENT', boss: true });
    if (r !== 'win') return;
    await say(L('BIG CLIENT: Va bene. Approvato. Così com\'è.', 'BIG CLIENT: Fine. Approved. As it is.'));
    await hallOfFame();
  },
  async heal() {
    await say(L('BARISTA: Benvenuta al CENTRO GUD! Qui ci si ricarica.', 'BARISTA: Welcome to the GUD CENTER! This is where we recharge.'));
    await say(L('Vuoi un caffè e una pausa?', 'Would you like a coffee and a break?'));
    const c = await choose([TXT.yes, TXT.no]);
    if (c !== 0) { await say(L('Torna quando vuoi!', 'Come back anytime!')); return; }
    await say(L('Ecco un caffè. Respira.', 'Here is a coffee. Breathe.'), { auto: 0.6 });
    stopSong(); J.heal(); await wait(1.3); heal(); playSong('town');
    await say(L('GUD è di nuovo in forma. Torna quando vuoi!', 'GUD is back in shape. Come back anytime!')); save();
  },
  async contacts() {
    await say(L('PC di GUD. Contatti per nuovi progetti, docenze e collaborazioni:', 'GUD\'s PC. Contacts for new projects, teaching and collaborations:'));
    await contactsMenu();
  }
};
async function contactsMenu() {
  for (;;) {
    const c = await choose(CONTACTS.map(k => k.label).concat([L('ESCI', 'EXIT')]), { cancel: true, x: 4, y: 6 });
    if (c < 0 || c >= CONTACTS.length) return;
    const k = CONTACTS[c];
    if (k.show) await say(k.show);
    try { window.open(k.url, '_blank', 'noopener'); } catch (e) { /* */ }
  }
}

/* ---------------- BATTLE ---------------- */
function tween(o, k, a, b, dur) { return (async () => { const t0 = S.time; for (;;) { const p = Math.min(1, (S.time - t0) / dur); o[k] = a + (b - a) * p; if (p >= 1) return; await wait(0); } })(); }
const ESPR = {};
function enemySprite(key) {
  if (ESPR[key]) return ESPR[key];
  let c;
  if (key === 'logo') c = mk(108, 40, (R, x) => { otext(x, 'LOGO', 6, 6, 4, C.P, C.K, null, C.Y); }, true);
  else if (key === 'client') c = SPR.client[0];
  else c = SPR.ob[key][0];
  const s = key === 'logo' || key === 'client' ? 1 : clamp(Math.floor(Math.min(W * 0.46 / c.width, 92 / c.height)), 1, 3);
  return { c, s };
}
async function wildEncounter() {
  const pool = [...Array(12).keys()], unc = pool.filter(i => !S.caught.includes(i));
  let mon = !unc.length ? (S.caught.includes(12) ? pick(pool) : 12) : (Math.random() < 0.72 ? pick(unc) : pick(pool));
  run(() => battle({ kind: 'wild', mon }));
}
async function battle(cfg) {
  S.busy = true; J.encounter(); playSong(cfg.boss ? 'boss' : 'battle');
  for (let i = 0; i < 3; i++) { S.flash = 1; await wait(0.07); S.flash = 0; await wait(0.07); }
  const wild = cfg.kind === 'wild';
  const e = wild ? { name: MONS[cfg.mon].n, lv: 18 + cfg.mon * 2, hp: 46, max: 46, moves: WILD_MOVES, mon: cfg.mon }
    : { name: tr(cfg.enemy.name), lv: cfg.enemy.lv, hp: cfg.enemy.hp, max: cfg.enemy.hp, moves: cfg.enemy.moves, weak: cfg.enemy.weak, spr: cfg.enemy.spr };
  const B = S.battle = { wild, e, eOff: W, pOff: -W, eShow: e.hp, pShow: S.hp, blinkE: 0, blinkP: 0, eDrop: 0, pDrop: 0, eVis: true, leader: wild ? null : cfg.look, lunge: 0, eLunge: 0, prompt: null, ball: null };
  if (wild && !S.seen.includes(cfg.mon)) S.seen.push(cfg.mon);
  S.scene = 'battle';
  await Promise.all([tween(B, 'eOff', W, 0, 0.6), tween(B, 'pOff', -W, 0, 0.6)]);
  if (wild) await say(lf('Un GUDMON selvatico: {n}!', 'A wild {n} appeared!', { n: e.name }), { auto: 1.1 });
  else {
    await say(lf('{l} vuole lottare!', '{l} wants to battle!', { l: cfg.leader }), { auto: 1.1 });
    await tween(B, 'eOff', 0, W, 0.3); B.leader = null;
    await say(lf('{l} manda in campo {n}!', '{l} sent out {n}!', { l: cfg.leader, n: e.name }), { auto: 0.4 });
    await tween(B, 'eOff', W, 0, 0.3);
  }
  await say(L('Vai, GUD!', 'Go, GUD!'), { auto: 0.5 });
  let result = null;
  while (!result) {
    B.prompt = L('Cosa farà GUD?', 'What will GUD do?');
    const mw = MOBILE ? 128 : 150;
    const c = await choose([TXT.fight, TXT.bag, wild ? TXT.catchT : L('GUDDEX', 'GUDDEX'), TXT.run], { cols: 2, x: W - mw - 4, y: H - 48, w: mw, h: 46 });
    B.prompt = null;
    if (c === 0) {
      const m = await choose(MOVES.map(mv => mv.n), { cols: 2, x: 4, y: H - 48, w: W - 8, h: 46, cancel: true, info: i => 'PP ' + S.pp[i] + '/' + MOVES[i].pp });
      if (m < 0) continue;
      if (S.pp[m] <= 0) { await say(L('Non ci sono più PP per questa mossa!', 'No PP left for this move!')); continue; }
      result = await playerAttack(m); if (!result) result = await enemyTurn();
    } else if (c === 1) {
      const r = await bagInBattle(); if (r === 'used') result = await enemyTurn(); else if (r === 'caught') result = r; else if (r === 'fail') result = await enemyTurn();
    } else if (c === 2) {
      if (wild) { result = await throwBook(); if (!result) result = await enemyTurn(); } else await openDex();
    } else if (wild) { await say(L('Fuga riuscita!', 'Got away safely!'), { auto: 0.7 }); result = 'run'; }
    else await say(L('Non si scappa da una lotta con un leader!', 'No running from a leader battle!'));
  }
  await fadeTo(1);
  S.scene = 'world'; S.battle = null; playSong('town');
  await fadeTo(0); S.busy = false;
  if (result === 'lose') await afterLose();
  save();
  return result;
}
async function playerAttack(m) {
  const B = S.battle, mv = MOVES[m]; S.pp[m]--;
  await say(lf('GUD usa {m}!', 'GUD used {m}!', { m: tr(mv.n) }), { auto: 0.35 });
  await tween(B, 'lunge', 0, 1, 0.1); await tween(B, 'lunge', 1, 0, 0.12);
  if (Math.random() * 100 > mv.a) { J.miss(); await say(L('Ma manca il bersaglio!', 'But it missed!'), { auto: 0.7 }); return null; }
  const weak = !B.wild && B.e.weak === m, crit = Math.random() < 0.08;
  let dmg = Math.round(mv.p * rand(0.85, 1) * (weak ? 1.6 : 1) * (crit ? 1.5 : 1)); if (B.wild) dmg = Math.round(dmg * 0.6);
  (weak ? J.superHit : J.hit)(); B.blinkE = 0.5; B.e.hp = Math.max(0, B.e.hp - dmg); await wait(0.65);
  if (crit) await say(L('Brutto colpo!', 'A critical hit!'), { auto: 0.6 });
  if (weak) await say(L('È superefficace!', 'It\'s super effective!'), { auto: 0.7 });
  if (B.e.hp <= 0) {
    J.faint(); await tween(B, 'eDrop', 0, 1, 0.45); B.eVis = false;
    if (B.wild) { await say(lf('{n} si è addormentato. Meglio lasciarlo riposare.', '{n} fell asleep. Better let it rest.', { n: B.e.name })); return 'faint'; }
    await say(lf('{n} è KO!', '{n} fainted!', { n: B.e.name }), { auto: 0.8 });
    S.lv++; S.maxhp += 4; S.hp = Math.min(S.maxhp, S.hp + 4); J.lvl();
    await say(lf('GUD sale al LV {l}!', 'GUD grew to LV {l}!', { l: S.lv }));
    return 'win';
  }
  if (B.wild) await say(lf('{n} si incuriosisce!', '{n} is getting curious!', { n: B.e.name }), { auto: 0.6 });
  return null;
}
async function enemyTurn() {
  const B = S.battle, mv = pick(B.e.moves);
  await say(lf('{n} usa {m}!', '{n} used {m}!', { n: B.e.name, m: tr(mv[0]) }), { auto: 0.35 });
  await tween(B, 'eLunge', 0, 1, 0.1); await tween(B, 'eLunge', 1, 0, 0.12);
  if (Math.random() < 0.1) { J.miss(); await say(L('GUD lo schiva!', 'GUD dodged it!'), { auto: 0.7 }); return null; }
  const dmg = Math.round(mv[1] * rand(0.8, 1.15)); J.hit(); B.blinkP = 0.5; S.hp = Math.max(0, S.hp - dmg); await wait(0.65);
  if (B.wild && dmg <= 5) await say(L('GUD si sente ispirata. Un po\' stanca, ma ispirata.', 'GUD feels inspired. A little tired, but inspired.'), { auto: 0.8 });
  if (S.hp <= 0) { J.faint(); await tween(B, 'pDrop', 0, 1, 0.45); await say(L('GUD è stremata!', 'GUD is exhausted!')); await say(L('GUD corre al CENTRO GUD...', 'GUD runs to the GUD CENTER...')); return 'lose'; }
  return null;
}
async function bagInBattle() {
  const B = S.battle;
  const c = await choose([lf('CAFFÈ x{n}', 'COFFEE x{n}', { n: S.coffee }), L('SKETCHBOOK', 'SKETCHBOOK')], { cancel: true });
  if (c === 0) {
    if (S.coffee <= 0) { await say(L('I caffè sono finiti! Ricaricali al CENTRO GUD.', 'Out of coffee! Refill at the GUD CENTER.')); return 'none'; }
    if (S.hp >= S.maxhp) { await say(L('GUD è già carica a mille.', 'GUD is already fully charged.')); return 'none'; }
    S.coffee--; S.hp = Math.min(S.maxhp, S.hp + 40); J.heal();
    await say(L('GUD beve un CAFFÈ. +40 PS!', 'GUD drinks a COFFEE. +40 HP!'), { auto: 0.8 }); return 'used';
  }
  if (c === 1) {
    if (!B.wild) { await say(L('Non si possono catturare i GUDMON degli altri!', 'You can\'t catch someone else\'s GUDMON!')); return 'none'; }
    const r = await throwBook(); return r || 'fail';
  }
  return 'none';
}
async function throwBook() {
  const B = S.battle, n = B.e.name;
  await say(L('GUD lancia lo SKETCHBOOK!', 'GUD threw a SKETCHBOOK!'), { auto: 0.3 }); J.throw();
  B.ball = { t: 0, wig: 0 }; await tween(B.ball, 't', 0, 1, 0.5); B.eVis = false;
  const ok = Math.random() < 0.45 + 0.5 * (1 - B.e.hp / B.e.max), wig = ok ? 3 : irand(1, 2);
  for (let i = 0; i < wig; i++) { await wait(0.25); B.ball.wig = 1; J.wiggle(); await wait(0.15); B.ball.wig = -1; await wait(0.15); B.ball.wig = 0; }
  await wait(0.3);
  if (ok) {
    J.catch(); B.ball.stars = true;
    if (!S.caught.includes(B.e.mon)) S.caught.push(B.e.mon); save();
    await say(lf('Preso! {n} entra nel GUDDEX.', 'Gotcha! {n} was added to the GUDDEX.', { n }));
    await dexEntry(B.e.mon);
    return 'caught';
  }
  B.ball = null; B.eVis = true; J.wiggle();
  await say(lf('Oh no! {n} è uscito dallo sketchbook!', 'Oh no! {n} broke free!', { n }), { auto: 0.8 });
  return null;
}
function hpBar(x, y, w, cur, max) {
  const f = clamp(cur / max, 0, 1);
  dtext(ctx, 'PS', x, y, 1, C.P);
  const bx = x + 14; ctx.fillStyle = C.K; ctx.fillRect(bx, y, w - 14, 7); ctx.fillStyle = C.L; ctx.fillRect(bx + 1, y + 1, w - 16, 5);
  ctx.fillStyle = f > 0.5 ? C.Y : f > 0.2 ? C.B : (Math.floor(S.time * 6) % 2 ? C.P : C.B);
  ctx.fillRect(bx + 1, y + 1, Math.round((w - 16) * f), 5);
}
function platform(cx, cy, rw) { for (let dy = -5; dy <= 5; dy++) { const hw = Math.round(Math.sqrt(1 - (dy / 5) * (dy / 5)) * rw); ctx.fillStyle = Math.abs(dy) === 5 ? C.K : C.B; ctx.fillRect(cx - hw, cy + dy, hw * 2, 1); } ctx.fillStyle = C.K; ctx.fillRect(cx - rw, cy, 1, 1); ctx.fillRect(cx + rw - 1, cy, 1, 1); }
function drawBattle() {
  const B = S.battle; if (!B) return;
  ctx.fillStyle = C.W; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.L; for (let y = 0; y < H - 48; y += 6) ctx.fillRect(0, y, W, 2);
  const ey = H - 102, ex = Math.round(W * 0.73 + B.eOff - B.eLunge * 8);
  platform(Math.round(W * 0.73 + B.eOff), ey - 2, MOBILE ? 44 : 54);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, ey + 1); ctx.clip();
  if (B.leader) { const p = person(B.leader, 'down', 0); ctx.drawImage(p, ex - 27, ey - 66 + 3, 54, 66); }
  else if (B.eVis && !(B.blinkE > 0 && Math.floor(S.time * 20) % 2)) {
    const dy = Math.round(B.eDrop * 110);
    if (B.wild) { const s = SP.mons[B.e.mon]; ctx.drawImage(s, ex - 44, ey - 88 + 4 + dy, 88, 88); }
    else { const { c, s } = enemySprite(B.e.spr); ctx.drawImage(c, ex - Math.round(c.width * s / 2), ey - c.height * s + dy, c.width * s, c.height * s); }
  }
  ctx.restore();
  // ball
  if (B.ball) {
    const t = B.ball.t, sx = W * 0.3, sy = H - 100, tx = W * 0.73, ty = ey - 18;
    const bx = Math.round(sx + (tx - sx) * t + (B.ball.wig || 0) * 2), by = Math.round(sy + (ty - sy) * t - Math.sin(t * Math.PI) * 50);
    ctx.fillStyle = C.K; ctx.fillRect(bx - 7, by - 9, 14, 18); ctx.fillStyle = C.Y; ctx.fillRect(bx - 6, by - 8, 12, 16); ctx.fillStyle = C.K; ctx.fillRect(bx - 6, by - 8, 2, 16); ctx.fillStyle = C.P; ctx.fillRect(bx - 2, by - 3, 6, 2);
    if (B.ball.stars) { ctx.fillStyle = C.Y; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + S.time * 3; ctx.fillRect(Math.round(bx + Math.cos(a) * 16), Math.round(by + Math.sin(a) * 12), 2, 2); } }
  }
  // enemy info
  if (!B.leader && B.eOff < W * 0.5) {
    const iw = MOBILE ? 124 : 150; box(6, 8, iw, 44);
    dtext(ctx, B.e.name.length > 19 ? B.e.name.slice(0, 19) : B.e.name, 13, 14, 1, C.K);
    dtext(ctx, 'LV' + B.e.lv, 13, 25, 1, C.P);
    hpBar(13, 36, iw - 16, B.eShow, B.e.max);
  }
  // player
  const px = Math.round(W * 0.24 + B.pOff + B.lunge * 10), pb = H - 50;
  platform(Math.round(W * 0.24 + B.pOff), pb - 2, MOBILE ? 40 : 50);
  if (!(B.blinkP > 0 && Math.floor(S.time * 20) % 2)) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, pb); ctx.clip(); ctx.drawImage(SP.gudBack, px - 34, pb - 66 + Math.round(B.pDrop * 70), 68, 68); ctx.restore(); }
  const iw = MOBILE ? 118 : 146, ix = W - iw - 6, iy = H - 48 - 42;
  box(ix, iy, iw, 40);
  dtext(ctx, 'GUD', ix + 8, iy + 6, 1, C.K); dtext(ctx, 'LV' + S.lv, ix + iw - 8, iy + 6, 1, C.P, 'right');
  hpBar(ix + 8, iy + 17, iw - 16, B.pShow, S.maxhp);
  dtext(ctx, Math.round(B.pShow) + '/' + S.maxhp, ix + iw - 8, iy + 28, 1, C.K, 'right');
  box(4, H - 48, W - 8, 46);
  if (B.prompt) { const lines = wrap(tr(B.prompt), Math.floor((W - (MOBILE ? 140 : 162) - 16) / 6)); lines.forEach((l, i) => dtext(ctx, l, 12, H - 36 + i * 15, 1, C.K)); }
}
function battleUpdate(dt) {
  const B = S.battle; if (!B) return;
  B.blinkE -= dt; B.blinkP -= dt;
  B.eShow += (B.e.hp - B.eShow) * Math.min(1, dt * 6); B.pShow += (S.hp - B.pShow) * Math.min(1, dt * 6);
}
