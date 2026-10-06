/* ---------------- SCREENS: GUDDEX, CARD, BAG ---------------- */
function drawBadge(i, x, y, own) {
  ctx.fillStyle = C.K; ctx.fillRect(x, y, 16, 16);
  if (!own) { ctx.fillStyle = C.L; ctx.fillRect(x + 1, y + 1, 14, 14); ctx.fillStyle = C.B; ctx.fillRect(x + 7, y + 4, 2, 2); ctx.fillRect(x + 7, y + 7, 2, 5); return; }
  const R = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
  R(1, 1, 14, 14, C.Y);
  if (i === 0) { R(3, 3, 10, 10, C.W); R(3, 6, 10, 1, C.K); R(3, 9, 10, 1, C.K); R(6, 3, 1, 10, C.K); R(9, 3, 1, 10, C.K); }
  if (i === 1) { for (let k = 0; k < 5; k++) R(7 - k, 3 + k, 2 + k * 2, 1, C.P); for (let k = 0; k < 5; k++) R(3 + k, 8 + k, 10 - k * 2, 1, C.P); R(7, 6, 2, 2, C.K); }
  if (i === 2) { R(2, 7, 12, 6, C.P); R(2, 4, 3, 3, C.P); R(7, 4, 2, 3, C.P); R(11, 4, 3, 3, C.P); R(7, 10, 2, 3, C.K); }
  if (i === 3) { R(3, 3, 10, 10, C.K); dtext(ctx, 'G', x + 5, y + 4, 1, C.Y); }
  if (i === 4) { R(3, 3, 10, 10, C.K); R(4, 4, 8, 8, C.P); R(6, 6, 4, 4, C.W); }
  if (i === 5) { R(7, 2, 2, 3, C.B); R(6, 5, 4, 2, C.B); R(4, 7, 8, 5, C.B); R(5, 12, 6, 1, C.B); R(6, 8, 1, 2, C.W); }
}
function screenBg(title) {
  ctx.fillStyle = C.W; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.P; ctx.fillRect(0, 0, W, 18); ctx.fillStyle = C.K; ctx.fillRect(0, 18, W, 2);
  dtext(ctx, title, 8, 6, 1, C.W);
}
function openDex() {
  let idx = 0, top = 0;
  const rows = () => Math.floor((H - 30) / 13);
  return pushScreen({
    update() {
      const n = MONS.length;
      if (pressed.has('up')) { idx = (idx - 1 + n) % n; J.blip(); }
      if (pressed.has('down')) { idx = (idx + 1) % n; J.blip(); }
      if (idx < top) top = idx; if (idx >= top + rows()) top = idx - rows() + 1;
      if (pressed.has('a')) { if (S.seen.includes(idx) || S.caught.includes(idx)) { J.select(); dexEntry(idx); } else J.bump(); }
      if (pressed.has('b') || pressed.has('start')) { J.blip(); this.resolve(); }
    },
    draw() {
      const caught = S.caught.filter(i => i < 12).length, seen = S.seen.filter(i => i < 12).length;
      screenBg('GUDDEX'); dtext(ctx, lf('VISTI {s}  PRESI {c}/12', 'SEEN {s}  CAUGHT {c}/12', { s: seen, c: caught }), W - 8, 6, 1, C.W, 'right');
      const listW = W >= 320 ? Math.round(W * 0.58) : W;
      for (let r = 0; r < rows() && top + r < MONS.length; r++) {
        const i = top + r, y = 26 + r * 13, known = S.seen.includes(i) || S.caught.includes(i);
        if (i === idx) { ctx.fillStyle = C.Y; ctx.fillRect(4, y - 3, listW - 8, 13); cursor(8, y, C.P); }
        dtext(ctx, '#' + pad(i + 1, 3), 16, y, 1, C.P);
        dtext(ctx, known ? MONS[i].n : (i === 12 ? '???' : '----------'), 48, y, 1, C.K);
        if (S.caught.includes(i)) dtext(ctx, '♥', listW - 16, y, 1, C.P);
      }
      if (W >= 320) {
        const known = S.seen.includes(idx) || S.caught.includes(idx), cx = Math.round(W * 0.79);
        box(Math.round(W * 0.6), 28, Math.round(W * 0.38), 104, C.L);
        if (known) { ctx.drawImage(SP.mons[idx], cx - 22, 40); dtext(ctx, tr(MONS[idx].type), cx, 96, 1, C.P, 'center'); dtext(ctx, S.caught.includes(idx) ? lf('PRESO', 'CAUGHT', {}) : lf('VISTO', 'SEEN', {}), cx, 110, 1, C.K, 'center'); }
        else dtext(ctx, '?', cx, 70, 3, C.B, 'center');
        dtext(ctx, lf('A: SCHEDA  B: ESCI', 'A: ENTRY  B: EXIT', {}), cx, H - 14, 1, C.K, 'center');
      }
    }
  });
}
function dexEntry(i) {
  const m = MONS[i];
  return pushScreen({
    update() { if (pressed.has('a') || pressed.has('b') || pressed.has('start')) { J.blip(); this.resolve(); } },
    draw() {
      screenBg('GUDDEX #' + pad(i + 1, 3));
      box(6, 26, 100, 100, C.L); ctx.drawImage(SP.mons[i], 12, 32, 88, 88);
      const x = 116;
      dtext(ctx, m.n, x, 32, W >= 320 ? 2 : 1, C.K);
      dtext(ctx, lf('TIPO: {t}', 'TYPE: {t}', { t: tr(m.type) }), x, W >= 320 ? 52 : 46, 1, C.P);
      dtext(ctx, S.caught.includes(i) ? lf('♥ PRESO', '♥ CAUGHT', {}) : lf('VISTO', 'SEEN', {}), x, W >= 320 ? 66 : 60, 1, C.K);
      const lines = wrap(S.caught.includes(i) ? tr(m.d) : lf('Cattura {n} per leggere la sua scheda.', 'Catch {n} to read its entry.', { n: m.n }), Math.floor((W - 20) / 6));
      lines.forEach((l, k) => dtext(ctx, l, 10, 136 + k * 12, 1, C.K));
    }
  });
}
function openCard() {
  let page = 0;
  return pushScreen({
    update() {
      if (pressed.has('a') || pressed.has('right') || pressed.has('left')) { J.blip(); page = 1 - page; }
      if (pressed.has('b') || pressed.has('start')) { J.blip(); this.resolve(); }
    },
    draw() {
      screenBg(lf('SCHEDA DI GUD  {p}/2', 'GUD CARD  {p}/2', { p: page + 1 }));
      const cw = Math.floor((W - 20) / 6);
      if (page === 0) {
        box(8, 26, 64, 76, C.L); ctx.drawImage(person('gud', 'down', 0), 13, 30, 54, 66);
        const x = 82, n = Math.floor((W - x - 8) / 6);
        let y = 30;
        dtext(ctx, 'GUD', x, y, 2, C.P); y += 20;
        wrap(CV.full, n).forEach(l => { dtext(ctx, l, x, y, 1, C.K); y += 11; });
        dtext(ctx, 'LV ' + S.lv + '   PS ' + S.hp + '/' + S.maxhp, x, y + 2, 1, C.K); y += 13;
        dtext(ctx, lf('BASE: FIRENZE', 'BASE: FLORENCE', {}), x, y + 2, 1, C.K); y += 13;
        dtext(ctx, 'GUDDEX: ' + S.caught.filter(i => i < 12).length + '/12', x, y + 2, 1, C.K);
        let yy = 112; wrap(tr(CV.role), cw).forEach(l => { dtext(ctx, l, 10, yy, 1, C.P); yy += 11; });
        yy += 4; dtext(ctx, lf('MEDAGLIE', 'BADGES', {}), 10, yy, 1, C.K); yy += 11;
        SECTION_ORDER.forEach((id, i) => drawBadge(i, 10 + i * 20, yy, S.badges.includes(id)));
      } else {
        let y = 28;
        dtext(ctx, lf('FORMAZIONE', 'EDUCATION', {}), 10, y, 1, C.P); y += 13;
        CV.education.forEach(e => { wrap(tr(e), cw).forEach(l => { dtext(ctx, l, 10, y, 1, C.K); y += 11; }); y += 3; });
        y += 4; dtext(ctx, lf('LINGUE', 'LANGUAGES', {}), 10, y, 1, C.P); y += 13;
        wrap(tr(CV.languages), cw).forEach(l => { dtext(ctx, l, 10, y, 1, C.K); y += 11; });
        y += 6; dtext(ctx, lf('STUDIO', 'STUDIO', {}), 10, y, 1, C.P); y += 13;
        wrap(lf('Ergonauth S.a.s., Firenze. Fondatrice e Creative Director dal 2016.', 'Ergonauth S.a.s., Florence. Founder and Creative Director since 2016.', {}), cw).forEach(l => { dtext(ctx, l, 10, y, 1, C.K); y += 11; });
      }
      dtext(ctx, lf('A: PAGINA  B: ESCI', 'A: PAGE  B: EXIT', {}), W - 8, H - 12, 1, C.B, 'right');
    }
  });
}
const BAG = [
  { n: () => lf('CAFFÈ x{n}', 'COFFEE x{n}', { n: S.coffee }), d: L('Ricarica 40 PS. Il carburante ufficiale di GUD.', 'Restores 40 HP. GUD\'s official fuel.'), use: true },
  { n: () => 'SKETCHBOOK', d: L('Per catturare i GUDMON nell\'erba alta. Infinito, come le idee.', 'Catches GUDMON in the tall grass. Endless, like ideas.') },
  { n: () => 'GLYPHS', d: L('Strumento chiave: qui nascono i font di Typodiva.', 'Key item: where Typodiva fonts are born.') },
  { n: () => 'ROBOFONT', d: L('Strumento chiave: per disegnare e ridisegnare lettere.', 'Key item: for drawing and redrawing letters.') },
  { n: () => 'FONTTOOLS', d: L('Python per i font. Per quando le lettere vanno automatizzate.', 'Python for fonts. For when letters need automating.') },
  { n: () => 'POSCA', d: L('I pennarelli della Legacy Board di Lucca.', 'The markers of the Lucca Legacy Board.') },
  { n: () => lf('PASS LUCCA', 'LUCCA PASS', {}), d: L('Pass per Lucca Comics & Games. Validità: 60 anni.', 'Lucca Comics & Games pass. Valid for 60 years.') }
];
function openBag() {
  let idx = 0;
  return pushScreen({
    update() {
      if (pressed.has('up')) { idx = (idx - 1 + BAG.length) % BAG.length; J.blip(); this.msg = null; }
      if (pressed.has('down')) { idx = (idx + 1) % BAG.length; J.blip(); this.msg = null; }
      if (pressed.has('a') && BAG[idx].use) {
        if (S.coffee > 0 && S.hp < S.maxhp) { S.coffee--; S.hp = Math.min(S.maxhp, S.hp + 40); J.heal(); this.msg = lf('GUD beve un caffè. PS {h}/{m}', 'GUD drinks a coffee. HP {h}/{m}', { h: S.hp, m: S.maxhp }); }
        else { J.bump(); this.msg = S.coffee <= 0 ? lf('Caffè finiti!', 'Out of coffee!', {}) : lf('GUD è già in forma.', 'GUD is already fine.', {}); }
      }
      if (pressed.has('b') || pressed.has('start')) { J.blip(); this.resolve(); }
    },
    draw() {
      screenBg(lf('ZAINO', 'BAG', {}));
      BAG.forEach((it, i) => { const y = 28 + i * 14; if (i === idx) { ctx.fillStyle = C.Y; ctx.fillRect(4, y - 3, W - 8, 13); cursor(8, y, C.P); } dtext(ctx, it.n(), 18, y, 1, C.K); });
      box(4, H - 52, W - 8, 48);
      wrap(this.msg || tr(BAG[idx].d), cpl()).slice(0, 3).forEach((l, k) => dtext(ctx, l, 12, H - 42 + k * 12, 1, C.K));
    }
  });
}
async function startMenu() {
  await run(async () => {
    for (;;) {
      const c = await choose(TXT.menu, { cancel: true, x: W - 104, y: 4, w: 100 });
      if (c < 0 || c === 6) return;
      if (c === 0) await openDex();
      if (c === 1) await openCard();
      if (c === 2) await openBag();
      if (c === 3) { openQuickCV(); return; }
      if (c === 4) { const l = await choose(['ITALIANO', 'ENGLISH'], { cancel: true, idx: S.lang === 'en' ? 1 : 0 }); if (l >= 0) setLang(l === 1 ? 'en' : 'it'); }
      if (c === 5) { save(); J.select(); await say(TXT.saved); }
    }
  });
}

/* ---------------- QUICK CV (accessible DOM panel) ---------------- */
let cvOpen = false;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function quickCVHTML() {
  const t = o => esc(tr(o));
  let h = `<header><h2>GUD</h2><p class="full">${esc(CV.full)}</p><p>${t(CV.role)}</p></header>`;
  SECTION_ORDER.forEach(id => {
    const s = CV.sections[id];
    h += `<section><h3>${t(s.title)}</h3><ul>${s.items.map(i => `<li><b>${esc(i.t)}</b> ${t(i.d)}</li>`).join('')}</ul></section>`;
  });
  h += `<section><h3>${S.lang === 'en' ? 'Education' : 'Formazione'}</h3><ul>${CV.education.map(e => `<li>${t(e)}</li>`).join('')}</ul></section>`;
  h += `<section><h3>${S.lang === 'en' ? 'Passions' : 'Passioni'}</h3><ul>${MONS.slice(0, 12).map(m => `<li><b>${esc(tr(m.type))}</b> ${t(m.d)}</li>`).join('')}</ul></section>`;
  h += `<section class="contacts"><h3>${S.lang === 'en' ? 'Contacts' : 'Contatti'}</h3><p>${CONTACTS.map(k => `<a href="${esc(k.url)}" target="_blank" rel="noopener">${esc(k.show || k.label)}</a>`).join('')}</p></section>`;
  return h;
}
function openQuickCV() {
  const p = $('cvPanel'); $('cvBody').innerHTML = quickCVHTML(); p.hidden = false; cvOpen = true;
  $('cvTitle').textContent = S.lang === 'en' ? 'QUICK CV' : 'CV RAPIDO';
  $('cvBody').scrollTop = 0;
  setTimeout(() => { try { $('cvClose').focus({ preventScroll: true }); } catch (e) { /* */ } }, 30);
}
function closeQuickCV() { $('cvPanel').hidden = true; cvOpen = false; try { cvs.focus({ preventScroll: true }); } catch (e) { /* */ } }
$('cvClose').addEventListener('click', closeQuickCV);
$('cvBtn').addEventListener('click', () => { AU.init(); cvOpen ? closeQuickCV() : openQuickCV(); });
function setLang(l) { S.lang = l; store.set('gudquest_lang', l); syncLang(); save(); if (cvOpen) $('cvBody').innerHTML = quickCVHTML(); }
function syncLang() {
  document.documentElement.lang = S.lang || 'it';
  $('cvBtn').textContent = S.lang === 'en' ? 'QUICK CV' : 'CV RAPIDO';
  $('langBtn').textContent = S.lang === 'en' ? 'IT' : 'EN';
  $('langBtn').setAttribute('aria-label', S.lang === 'en' ? 'Passa all\'italiano' : 'Switch to English');
  syncMute();
}
$('langBtn').addEventListener('click', () => { AU.init(); setLang(S.lang === 'en' ? 'it' : 'en'); try { cvs.focus({ preventScroll: true }); } catch (e) { /* */ } });
function syncMute() { const b = $('muteBtn'); b.textContent = AU.muted ? (S.lang === 'en' ? 'SOUND OFF' : 'AUDIO OFF') : (S.lang === 'en' ? 'SOUND ON' : 'AUDIO ON'); b.setAttribute('aria-pressed', AU.muted ? 'true' : 'false'); }
$('muteBtn').addEventListener('click', () => { AU.init(); AU.setMute(!AU.muted); syncMute(); });

/* ---------------- SCENES ---------------- */
function drawLang() {
  ctx.fillStyle = C.K; ctx.fillRect(0, 0, W, H);
  otext(ctx, 'GUDQUEST', W / 2, 30, W >= 320 ? 4 : 3, C.Y, C.P, 'center');
  dtext(ctx, 'SCEGLI LA LINGUA', W / 2, H / 2 - 34, 1, C.W, 'center');
  dtext(ctx, 'CHOOSE YOUR LANGUAGE', W / 2, H / 2 - 22, 1, C.B, 'center');
}
function drawTitle() {
  ctx.fillStyle = C.P; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.B; for (let y = 0; y < H; y += 8) ctx.fillRect(0, y + Math.floor(S.time * 8) % 8, W, 2);
  for (let i = 0; i < 20; i++) if ((Math.floor(S.time * 2) + i) % 4) { ctx.fillStyle = i % 2 ? C.Y : C.W; ctx.fillRect((i * 67 + 13) % W, (i * 41 + 7) % Math.round(H * 0.4), 2, 2); }
  const sc = W >= 380 ? 7 : W >= 320 ? 6 : 4, ty = MOBILE ? 34 : 22;
  otext(ctx, 'GUDQUEST', W / 2, ty, sc, C.Y, C.K, 'center', C.K);
  const by = ty + sc * 7 + 10;
  ctx.fillStyle = C.K; ctx.fillRect(0, by, W, 22);
  dtext(ctx, 'PINK VERSION', W / 2, by + 4, 2, C.W, 'center');
  dtext(ctx, lf('UN CV INTERATTIVO', 'AN INTERACTIVE CV', {}), W / 2, by + 30, 1, C.K, 'center');
  const gy = H - (MOBILE ? 118 : 104), f = Math.floor(S.time * 4) % 4;
  ctx.fillStyle = C.L; ctx.fillRect(0, gy + 64, W, H - gy - 64);
  ctx.drawImage(person('gud', 'down', [0, 1, 0, 2][f]), Math.round(W * 0.3) - 27, gy, 54, 66);
  const b = Math.abs(Math.sin(S.time * 3)) * 6;
  ctx.drawImage(SP.mons[0], Math.round(W * 0.68) - 22, gy + 20 - Math.round(b));
  if (S.titleWait && Math.floor(S.time * 2) % 2) otext(ctx, tr(TXT.pressStart), W / 2, H - 22, 1, C.P, C.W, 'center');
  dtext(ctx, '(C) 2026 GUD / ERGONAUTH', W / 2, H - 10, 1, C.B, 'center');
}
function drawIntro() {
  ctx.fillStyle = C.W; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.L; for (let y = 0; y < H - 50; y += 6) ctx.fillRect(0, y, W, 2);
  const cx = Math.round(W / 2), by = Math.round((H - 50) * 0.75);
  platform(cx, by, 50);
  ctx.drawImage(person(S.introWho || 'prof', 'down', 0), cx - 36, by - 86, 72, 88);
  if (S.introWho === 'gud') ctx.drawImage(SP.mons[1], cx + 40, by - 46);
  else ctx.drawImage(SP.mons[0], cx + 40, by - 46);
}
function drawHof() {
  ctx.fillStyle = C.P; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.B; for (let y = 0; y < H; y += 8) ctx.fillRect(0, y + Math.floor(S.time * 6) % 8, W, 2);
  for (let i = 0; i < 30; i++) if ((Math.floor(S.time * 3) + i) % 5) { ctx.fillStyle = i % 3 ? C.Y : C.W; ctx.fillRect((i * 53 + 7) % W, (i * 37 + 11) % (H - 50), 2, 2); }
  const sc = W >= 320 ? 3 : 2;
  otext(ctx, 'HALL OF FAME', W / 2, 8, sc, C.Y, C.K, 'center', C.K);
  const top = 8 + sc * 7 + 8, cx = Math.round(W / 2);
  const R = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(a, b, w, h); };
  disc(R, cx, top + 34, 34, C.Y); disc(R, cx, top + 34, 30, C.W);
  ctx.drawImage(person('gud', 'down', Math.floor(S.time * 4) % 2 ? 0 : 1), cx - 27, top + 2, 54, 66);
  SECTION_ORDER.forEach((id, i) => drawBadge(i, cx - 58 + i * 20, top + 74, true));
  const team = S.caught.slice(0, 6), n = team.length, gap = Math.min(46, Math.floor((W - 16) / Math.max(1, n)));
  team.forEach((i, k) => ctx.drawImage(SP.mons[i], Math.round(W / 2 - (n * gap) / 2 + k * gap + (gap - 44) / 2), top + 94 + Math.round(Math.sin(S.time * 4 + k) * 2)));
}
async function hallOfFame() {
  S.hof = true; save();
  await fadeTo(1); S.scene = 'hof'; playSong('hof'); await fadeTo(0);
  await say([L('Congratulazioni! GUD e il suo team entrano nella HALL OF FAME!', 'Congratulations! GUD and her team enter the HALL OF FAME!'),
    CV.role,
    L('Hai esplorato tutto il CV di GUD. Il sito è in costruzione, ma GUD è disponibile per nuovi progetti, docenze e collaborazioni.', 'You explored GUD\'s whole CV. The website is under construction, but GUD is available for new projects, teaching and collaborations.')]);
  const c = await choose([L('CONTATTI', 'CONTACTS'), L('CONTINUA A ESPLORARE', 'KEEP EXPLORING')]);
  if (c === 0) await contactsMenu();
  await fadeTo(1); heal(); S.scene = 'world'; S.map = 'centro'; S.px = 5; S.py = 5; S.dir = 'up'; playSong('town'); await fadeTo(0); save();
}
async function enterWorld() {
  await fadeTo(1); S.scene = 'world'; playSong('town'); S.zone = null;
  const m = curMap(); S.loc = m.outdoor ? null : { text: m.title, t: 0 };
  await fadeTo(0); save();
}
async function newGame() {
  Object.assign(S, { lv: 30, hp: 120, maxhp: 120, pp: MOVES.map(m => m.pp), coffee: 3, badges: [], caught: [], seen: [], hof: false, introDone: false });
  await fadeTo(1); S.scene = 'intro'; S.introWho = 'prof'; playSong('town'); await fadeTo(0);
  for (let i = 0; i < PROF_INTRO.length; i++) { if (i === 2) S.introWho = 'gud'; await say(i < 2 ? 'PROF. SERIF: ' + tr(PROF_INTRO[i]) : PROF_INTRO[i]); }
  await say(MOBILE ? TXT.hintMob : TXT.hint);
  S.introDone = true; S.map = 'home'; S.px = 5; S.py = 5; S.dir = 'down';
  await enterWorld();
}
async function main() {
  const sv = load(), ln = store.get('gudquest_lang');
  if (sv) Object.assign(S, sv);
  if (ln) S.lang = ln;
  if (!S.lang) {
    S.scene = 'lang';
    const c = await choose(['ITALIANO', 'ENGLISH'], { x: Math.round(W / 2 - 52), y: Math.round(H / 2), w: 104 });
    setLang(c === 1 ? 'en' : 'it');
  }
  syncLang();
  for (;;) {
    S.scene = 'title'; playSong('title'); S.titleWait = true; await waitPress(); S.titleWait = false;
    const has = !!load();
    const opts = has ? [TXT.cont, TXT.newGame, TXT.quick] : [TXT.newGame, TXT.quick];
    const c = await choose(opts, { cancel: true, x: Math.round(W / 2 - 62), y: H - (MOBILE ? 92 : 78), w: 124 });
    if (c < 0) continue;
    const o = opts[c];
    if (o === TXT.quick) { openQuickCV(); continue; }
    if (o === TXT.cont) { Object.assign(S, load()); await enterWorld(); return; }
    await newGame(); return;
  }
}

/* ---------------- LOOP ---------------- */
function update(dt) {
  S.time += dt;
  for (let i = S.timers.length - 1; i >= 0; i--) { const t = S.timers[i]; t.t -= dt; if (t.t <= 0) { S.timers.splice(i, 1); t.res(); } }
  if (cvOpen || S.paused) { pressed.clear(); return; }
  ensureSong();
  if (pressed.has('select')) openQuickCV();
  const hadUI = S.ui.length > 0;
  if (hadUI) updateUI(dt);
  if (S.scene === 'world') { if (hadUI) { const keep = new Set(pressed); pressed.clear(); worldUpdate(dt); keep.forEach(k => pressed.add(k)); } else worldUpdate(dt); }
  if (S.scene === 'battle') battleUpdate(dt);
  pressed.clear();
}
function render() {
  ctx.setTransform(KS, 0, 0, KS, 0, 0); ctx.imageSmoothingEnabled = false;
  if (S.scene === 'lang') drawLang(); else if (S.scene === 'title') drawTitle(); else if (S.scene === 'intro') drawIntro();
  else if (S.scene === 'world') drawWorld(); else if (S.scene === 'battle') drawBattle(); else if (S.scene === 'hof') drawHof();
  else { ctx.fillStyle = C.K; ctx.fillRect(0, 0, W, H); }
  drawUI();
  if (S.flash) { ctx.fillStyle = C.K; ctx.fillRect(0, 0, W, H); }
  if (S.fade > 0) { ctx.globalAlpha = S.fade; ctx.fillStyle = C.K; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}
let last = 0;
function frame(t) {
  requestAnimationFrame(frame);
  if (!last) last = t; let dt = (t - last) / 1000; last = t;
  if (dt <= 0) return; if (dt > 0.05) dt = 0.05;
  try { update(dt); render(); } catch (e) { console.error(e); }
}

/* ---------------- BOOT ---------------- */
buildSprites(); buildTiles(); buildFurniture();
SP.sign = signSprite(); SP.monument = monumentSprite(); SP.tower = towerSprite(); SP.gudBack = gudBack(); SP.mons = MONS.map(monSprite);
buildMaps();
resize();
if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
window.addEventListener('resize', resize);
syncMute();
requestAnimationFrame(frame);
main();
window.GUDQ = { S, MAPS, CV, press, held, say, battle, hallOfFame, openQuickCV, setLang, heal, goTo };
