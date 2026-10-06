/* ---------------- SCRIPTS ---------------- */
const MOVES = [
  { n: L('ART DIRECTION', 'ART DIRECTION'), p: 28, a: 95, pp: 15, fx: 'artdir' },
  { n: L('KERNING', 'KERNING'), p: 22, a: 100, pp: 20, fx: 'kerning' },
  { n: L('LETTERING', 'LETTERING'), p: 34, a: 85, pp: 10, fx: 'lettering' },
  { n: L('DIRITTI UMANI', 'HUMAN RIGHTS'), p: 45, a: 90, pp: 5, fx: 'rights' }
];
const WILD_MOVES = [[L('FASCINO', 'CHARM'), 4], [L('CURIOSITÀ', 'CURIOSITY'), 5], [L('ISPIRAZIONE', 'INSPIRATION'), 3]];
function heal() { S.hp = S.maxhp; S.pp = MOVES.map(m => m.pp); S.coffee = Math.max(S.coffee, 3); }
async function afterLose() {
  heal(); await goTo('centro', 5, 4, 'up');
  await say('BARISTA: ' + tr(TQ('lose')));
}
async function ludoScript() {
  J.bark();
  const lines = ['ludo1', 'ludo2', 'ludo3', 'ludo4'].map(k => TQ(k)).filter(Boolean);
  await say('LUDO: ' + tr(pick(lines)));
}
async function itemScript(o) {
  await say(Array.isArray(o.text) ? o.text : [o.text]);
  const it = o.item;
  if (it && it.media && it.media.length) {
    await say(TQ('seeProject'));
    const c = await choose([TQ('seeYes'), TQ('seeNo')]);
    if (c === 0 && window.GUDViewer) { stopSong(); await GUDViewer.open(it, { base: CFG.contentBase }); playSong('town'); }
  }
}
const SCRIPTS = {
  async prof() {
    const b = S.badges.filter(id => CV.sections[id]).length, c = S.caught.filter(i => MONS[i] && !MONS[i].legendary).length;
    if (!b && !c) await say('PROF. SERIF: ' + tr(TQ('profStart')));
    else if (S.hof && c < NREG()) await say('PROF. SERIF: ' + tr(TQ('profLegend')));
    else await say('PROF. SERIF: ' + fmt(tr(TQ('profProgress')), { b, B: NBADGE(), c, C: NREG() }));
  },
  async leader(n) {
    const id = n.sec, sec = CV.sections[id], bt = BAT[id], name = tr(n.name);
    if (!sec) return;
    if (S.badges.includes(id)) { await say(name + ': ' + tr(sec.summary)); return; }
    await say(name + ': ' + tr(bt.pre));
    const r = await battle({ kind: 'trainer', enemy: bt, look: n.look, leader: name });
    if (r !== 'win') return;
    await say(name + ': ' + tr(bt.post));
    S.badges.push(id); J.badge();
    await say(lf('GUD riceve la {b}!', 'GUD received the {b}!', { b: tr(sec.badge) }));
    await say(tr(sec.summary));
    save();
    if (allBadges()) await say(TQ('allBadges'));
  },
  async client() {
    if (S.hof) { await say('BIG CLIENT: ' + tr(TQ('clientAfter'))); return; }
    if (!allBadges()) { await say('BIG CLIENT: ' + fmt(tr(TQ('clientEarly')), { b: S.badges.filter(id => CV.sections[id]).length })); return; }
    await say('BIG CLIENT: ' + tr(TQ('clientPre')));
    const r = await battle({ kind: 'trainer', enemy: BAT.client, look: 'client', leader: 'BIG CLIENT', boss: true });
    if (r !== 'win') return;
    await say('BIG CLIENT: ' + tr(TQ('clientPost')));
    await hallOfFame();
  },
  async heal() {
    await say('BARISTA: ' + tr(TQ('barista1')));
    await say(TQ('barista2'));
    const c = await choose([TXT.yes, TXT.no]);
    if (c !== 0) { await say(L('Torna quando vuoi!', 'Come back anytime!')); return; }
    stopSong(); J.heal(); await wait(1.3); heal(); playSong('town');
    await say(TQ('barista3')); save();
  },
  async contacts() {
    await say(TQ('pcContacts'));
    await contactsMenu();
  }
};
const fmt = (s, v) => { Object.keys(v).forEach(k => { s = s.split('{' + k + '}').join(String(v[k])); }); return s; };
const allBadges = () => SECTIONS.length > 0 && SECTIONS.every(s => S.badges.includes(s.id));
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
function enemyFrames(key) {
  if (ESPR[key]) return ESPR[key];
  let frames;
  if (key === 'logo') frames = [mk(108, 40, (R, x) => { otext(x, 'LOGO', 6, 6, 4, C.P, C.K, null, C.Y); }, true), mk(108, 40, (R, x) => { otext(x, 'LOGO', 6, 6, 4, C.Y, C.K, null, C.P); }, true)];
  else if (key === 'client') frames = SPR.clientQ || SPR.client;
  else frames = SPR.ob[key] || SPR.ob.brief;
  return (ESPR[key] = frames);
}
function enemyScale(c) { return clamp(Math.floor(Math.min(W * 0.46 / c.width, 92 / c.height)), 1, 3); }
const MONBLINK = {};
function monBlink(i) { return MONBLINK[i] || (MONBLINK[i] = monSprite(MONS[i], true)); }
async function wildEncounter() {
  const reg = MONS.map((m, i) => i).filter(i => !MONS[i].legendary), leg = MONS.map((m, i) => i).filter(i => MONS[i].legendary);
  if (!reg.length) return;
  const unc = reg.filter(i => !S.caught.includes(i));
  let mon;
  if (!unc.length) { const ul = leg.filter(i => !S.caught.includes(i)); mon = ul.length ? ul[0] : pick(reg.concat(leg)); }
  else mon = Math.random() < 0.72 ? pick(unc) : pick(reg);
  run(() => battle({ kind: 'wild', mon }));
}
async function battle(cfg) {
  S.busy = true; J.encounter(); playSong(cfg.boss ? 'boss' : 'battle');
  for (let i = 0; i < 3; i++) { S.flash = 1; await wait(0.07); S.flash = 0; await wait(0.07); }
  const wild = cfg.kind === 'wild';
  const e = wild ? { name: MONS[cfg.mon].n, lv: 18 + cfg.mon * 2, hp: MONS[cfg.mon].legendary ? 70 : 46, max: MONS[cfg.mon].legendary ? 70 : 46, moves: WILD_MOVES, mon: cfg.mon, fx: 'wild' }
    : { name: tr(cfg.enemy.name), lv: cfg.enemy.lv, hp: cfg.enemy.hp, max: cfg.enemy.hp, moves: cfg.enemy.moves, weak: cfg.enemy.weak, spr: cfg.enemy.spr, fx: cfg.enemy.spr };
  const B = S.battle = { wild, e, eOff: W, pOff: -W, eShow: e.hp, pShow: S.hp, blinkE: 0, blinkP: 0, eDrop: 0, pDrop: 0, eVis: true, leader: wild ? null : cfg.look, lunge: 0, eLunge: 0, prompt: null, ball: null, fx: null, parts: [], shake: 0, mouth: 0 };
  if (wild && !S.seen.includes(cfg.mon)) S.seen.push(cfg.mon);
  S.scene = 'battle';
  await Promise.all([tween(B, 'eOff', W, 0, 0.6), tween(B, 'pOff', -W, 0, 0.6)]);
  if (wild) await say(lf('Un GUDMON selvatico: {n}!', 'A wild {n} appeared!', { n: e.name }), { auto: 1.1 });
  else {
    await say(lf('{l} vuole lottare!', '{l} wants to battle!', { l: cfg.leader }), { auto: 1.1 });
    await tween(B, 'eOff', 0, W, 0.3); B.leader = null;
    await say(lf('{l} manda in campo {n}!', '{l} sent out {n}!', { l: cfg.leader, n: e.name }), { auto: 0.4 });
    await tween(B, 'eOff', W, 0, 0.3); burst(ecxy()[0], ecxy()[1], 18, [C.Y, C.W, C.P], 90);
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
/* positions */
function ecxy() { return [Math.round(W * 0.73), H - 102 - 34]; }
function pcxy() { return [Math.round(W * 0.24), H - 50 - 36]; }
function burst(x, y, n, cols, spd) {
  const B = S.battle; if (!B) return;
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = rand(spd * 0.3, spd); B.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - spd * 0.3, life: rand(0.3, 0.7), col: pick(cols), s: pick([1, 2, 2, 3]) }); }
}
async function playFX(kind, dur, data) {
  const B = S.battle; if (!B) return;
  B.fx = { kind, t0: S.time, dur, data: data || {} };
  await wait(dur);
  if (B.fx && B.fx.kind === kind) B.fx = null;
}
async function playerAttack(m) {
  const B = S.battle, mv = MOVES[m]; S.pp[m]--;
  await say(lf('GUD usa {m}!', 'GUD used {m}!', { m: tr(mv.n) }), { auto: 0.3 });
  await tween(B, 'lunge', 0, 1, 0.1); await tween(B, 'lunge', 1, 0, 0.12);
  J.throw();
  await playFX(mv.fx, mv.fx === 'lettering' ? 0.9 : 0.8, { word: tr(mv.n) });
  const [ex, ey] = ecxy();
  if (Math.random() * 100 > mv.a) { J.miss(); B.fx = null; await say(L('Ma manca il bersaglio!', 'But it missed!'), { auto: 0.7 }); return null; }
  const weak = !B.wild && B.e.weak === m, crit = Math.random() < 0.08;
  let dmg = Math.round(mv.p * rand(0.85, 1) * (weak ? 1.6 : 1) * (crit ? 1.5 : 1)); if (B.wild) dmg = Math.round(dmg * 0.6);
  (weak ? J.superHit : J.hit)(); B.blinkE = 0.5; B.shake = weak ? 0.35 : 0.2; burst(ex, ey, weak ? 30 : 16, [C.Y, C.P, C.W, C.K], weak ? 150 : 100);
  B.e.hp = Math.max(0, B.e.hp - dmg); await wait(0.65);
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
  B.mouth = 1.4;
  await say(lf('{n} usa {m}!', '{n} used {m}!', { n: B.e.name, m: tr(mv[0]) }), { auto: 0.3 });
  await tween(B, 'eLunge', 0, 1, 0.1); await tween(B, 'eLunge', 1, 0, 0.12);
  await playFX('e_' + (B.e.fx || 'brief'), 0.9);
  const [px, py] = pcxy();
  if (Math.random() < 0.1) { J.miss(); await say(L('GUD lo schiva!', 'GUD dodged it!'), { auto: 0.7 }); return null; }
  const dmg = Math.round(mv[1] * rand(0.8, 1.15)); J.hit(); B.blinkP = 0.5; B.shake = 0.25; burst(px, py, 12, B.wild ? [C.Y, C.W, C.B] : [C.P, C.K, C.W], 90);
  S.hp = Math.max(0, S.hp - dmg); await wait(0.6);
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
    S.coffee--; S.hp = Math.min(S.maxhp, S.hp + 40); J.heal(); const [px, py] = pcxy(); burst(px, py, 20, [C.Y, C.W], 70);
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
  B.ball = { t: 0, wig: 0 }; await tween(B.ball, 't', 0, 1, 0.5); B.eVis = false; const [ex, ey] = ecxy(); burst(ex, ey + 14, 14, [C.W, C.Y], 80);
  const legendary = MONS[B.e.mon] && MONS[B.e.mon].legendary;
  const ok = Math.random() < (legendary ? 0.3 : 0.45) + 0.5 * (1 - B.e.hp / B.e.max), wig = ok ? 3 : irand(1, 2);
  for (let i = 0; i < wig; i++) { await wait(0.25); B.ball.wig = 1; J.wiggle(); await wait(0.15); B.ball.wig = -1; await wait(0.15); B.ball.wig = 0; }
  await wait(0.3);
  if (ok) {
    J.catch(); B.ball.stars = true;
    if (!S.caught.includes(B.e.mon)) S.caught.push(B.e.mon); save();
    await say(lf('Preso! {n} entra nel GUDDEX.', 'Gotcha! {n} was added to the GUDDEX.', { n }));
    await dexEntry(B.e.mon);
    return 'caught';
  }
  B.ball = null; B.eVis = true; J.wiggle(); burst(ex, ey, 16, [C.Y, C.W, C.P], 110);
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
let GUDBACK = null;
function drawBattle() {
  const B = S.battle; if (!B) return;
  if (!GUDBACK) GUDBACK = [gudBack(0), gudBack(1)];
  ctx.fillStyle = C.W; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.L; const so = Math.floor(S.time * 6) % 6; for (let y = -6 + so; y < H - 48; y += 6) ctx.fillRect(0, y, W, 2);
  ctx.save();
  if (B.shake > 0) ctx.translate(irand(-3, 3), irand(-2, 2));
  const ey = H - 102, bob = Math.round(Math.sin(S.time * 2.4) * 2), ex = Math.round(W * 0.73 + B.eOff - B.eLunge * 10);
  platform(Math.round(W * 0.73 + B.eOff), ey - 2, MOBILE ? 44 : 54);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, ey + 1); ctx.clip();
  if (B.leader) { const p = person(B.leader, 'down', 0); ctx.drawImage(p, ex - 34, ey - 64 + 2 + bob, 68, 68); }
  else if (B.eVis && !(B.blinkE > 0 && Math.floor(S.time * 20) % 2)) {
    const dy = Math.round(B.eDrop * 110);
    if (B.wild) {
      const blink = (S.time % 3.1) < 0.14, s = blink ? monBlink(B.e.mon) : SP.mons[B.e.mon];
      const hop = Math.abs(Math.sin(S.time * 3)) * 4 | 0;
      ctx.drawImage(s, ex - 44, ey - 88 + 4 + dy - hop, 88, 88);
    } else {
      const fr = enemyFrames(B.e.spr);
      let c = fr[0];
      if (B.e.spr === 'client') c = B.mouth > 0 && Math.floor(S.time * 8) % 2 ? fr[1] : fr[0];
      else if (fr.length > 1) c = fr[Math.floor(S.time * 5) % fr.length];
      const s = B.e.spr === 'logo' || B.e.spr === 'client' ? 1 : enemyScale(c);
      const sx = B.e.spr === 'bug' && Math.random() < 0.08 ? irand(-3, 3) : 0;
      ctx.drawImage(c, ex - Math.round(c.width * s / 2) + sx, ey - c.height * s + dy + bob, c.width * s, c.height * s);
      if (B.e.spr === 'bug' && Math.floor(S.time * 10) % 7 === 0) { ctx.fillStyle = pick([C.P, C.Y, C.K]); ctx.fillRect(ex - 30, ey - irand(10, 60), 60, 2); }
    }
  }
  ctx.restore();
  if (B.ball) {
    const t = B.ball.t, sx = W * 0.3, sy = H - 100, tx = W * 0.73, ty = ey - 18;
    const bx = Math.round(sx + (tx - sx) * t + (B.ball.wig || 0) * 2), by = Math.round(sy + (ty - sy) * t - Math.sin(t * Math.PI) * 50);
    ctx.fillStyle = C.K; ctx.fillRect(bx - 7, by - 9, 14, 18); ctx.fillStyle = C.Y; ctx.fillRect(bx - 6, by - 8, 12, 16); ctx.fillStyle = C.K; ctx.fillRect(bx - 6, by - 8, 2, 16); ctx.fillStyle = C.P; ctx.fillRect(bx - 2, by - 3, 6, 2);
    if (B.ball.stars) { ctx.fillStyle = C.Y; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + S.time * 3; ctx.fillRect(Math.round(bx + Math.cos(a) * 16), Math.round(by + Math.sin(a) * 12), 2, 2); } }
  }
  if (!B.leader && B.eOff < W * 0.5) {
    const iw = MOBILE ? 124 : 150; box(6, 8, iw, 44);
    dtext(ctx, B.e.name.length > 19 ? B.e.name.slice(0, 19) : B.e.name, 13, 14, 1, C.K);
    dtext(ctx, 'LV' + B.e.lv, 13, 25, 1, C.P);
    hpBar(13, 36, iw - 16, B.eShow, B.e.max);
  }
  const px = Math.round(W * 0.24 + B.pOff + B.lunge * 12), pb = H - 50;
  platform(Math.round(W * 0.24 + B.pOff), pb - 2, MOBILE ? 40 : 50);
  if (!(B.blinkP > 0 && Math.floor(S.time * 20) % 2)) {
    const fr = GUDBACK[Math.floor(S.time * 1.6) % 2];
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, pb); ctx.clip(); ctx.drawImage(fr, px - 34, pb - 66 + Math.round(B.pDrop * 70), 68, 68); ctx.restore();
  }
  drawFX(B);
  B.parts.forEach(p => { ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); });
  ctx.restore();
  const iw = MOBILE ? 118 : 146, ix = W - iw - 6, iy = H - 48 - 42;
  box(ix, iy, iw, 40);
  dtext(ctx, 'GUD', ix + 8, iy + 6, 1, C.K); dtext(ctx, 'LV' + S.lv, ix + iw - 8, iy + 6, 1, C.P, 'right');
  hpBar(ix + 8, iy + 17, iw - 16, B.pShow, S.maxhp);
  dtext(ctx, Math.round(B.pShow) + '/' + S.maxhp, ix + iw - 8, iy + 28, 1, C.K, 'right');
  box(4, H - 48, W - 8, 46);
  if (B.prompt) { const lines = wrap(tr(B.prompt), Math.floor((W - (MOBILE ? 140 : 162) - 16) / 6)); lines.forEach((l, i) => dtext(ctx, l, 12, H - 36 + i * 15, 1, C.K)); }
}
/* --- move & attack effects --- */
const lerp = (a, b, t) => a + (b - a) * t;
function drawFX(B) {
  const f = B.fx; if (!f) return;
  const p = clamp((S.time - f.t0) / f.dur, 0, 1);
  const [px, py] = pcxy(), [ex, ey] = ecxy();
  switch (f.kind) {
    case 'kerning': {
      const q = Math.min(1, p / 0.55), x = lerp(px + 20, ex, q), y = lerp(py - 10, ey - 6, q) - Math.sin(q * Math.PI) * 40;
      const gap = p < 0.55 ? 22 : Math.round(lerp(22, -2, (p - 0.55) / 0.45));
      otext(ctx, 'A', x - 12 - gap / 2, y - 14, 4, C.Y, C.K); otext(ctx, 'V', x - 8 + gap / 2, y - 14, 4, C.P, C.K);
      if (p > 0.55) { ctx.fillStyle = C.K; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 22, 2, 6); ctx.fillRect(Math.round(x) - 1, Math.round(y) + 16, 2, 6); }
      if (p > 0.9) { ctx.fillStyle = C.W; ctx.globalAlpha = 0.6; ctx.fillRect(0, 0, W, H - 48); ctx.globalAlpha = 1; }
      break;
    }
    case 'lettering': {
      const n = 46;
      for (let i = 0; i <= n * p; i++) {
        const u = i / n, x = lerp(px + 20, ex, u), y = lerp(py - 6, ey, u) + Math.sin(u * Math.PI * 3) * 16, th = 2 + Math.round(Math.sin(u * Math.PI) * 3);
        ctx.fillStyle = C.K; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, th + 2, th + 2);
        ctx.fillStyle = C.P; ctx.fillRect(Math.round(x), Math.round(y), th, th);
      }
      const u = p, hx = lerp(px + 20, ex, u), hy = lerp(py - 6, ey, u) + Math.sin(u * Math.PI * 3) * 16;
      ctx.fillStyle = C.Y; ctx.fillRect(Math.round(hx) - 3, Math.round(hy), 7, 1); ctx.fillRect(Math.round(hx), Math.round(hy) - 3, 1, 7);
      break;
    }
    case 'artdir': {
      const q = Math.min(1, p / 0.7), bw = lerp(W - 20, 70, q), bh = lerp(H - 70, 70, q), cx = lerp(W / 2, ex, q), cy = lerp((H - 48) / 2, ey - 6, q);
      const x0 = Math.round(cx - bw / 2), y0 = Math.round(cy - bh / 2), x1 = Math.round(cx + bw / 2), y1 = Math.round(cy + bh / 2), L_ = 10;
      ctx.fillStyle = C.K;
      [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([x, y, sx, sy]) => { ctx.fillRect(sx > 0 ? x : x - L_, y - (sy > 0 ? 0 : 2), L_, 3); ctx.fillRect(x - (sx > 0 ? 0 : 2), sy > 0 ? y : y - L_, 3, L_); });
      ctx.fillRect(Math.round(cx) - 4, Math.round(cy), 9, 1); ctx.fillRect(Math.round(cx), Math.round(cy) - 4, 1, 9);
      if (p > 0.75) { ctx.globalAlpha = p > 0.85 ? 0.85 : 0.4; ctx.fillStyle = C.Y; ctx.fillRect(0, 0, W, H - 48); ctx.globalAlpha = 1; otext(ctx, 'CLICK!', cx, cy - 40, 2, C.P, C.K, 'center'); }
      break;
    }
    case 'rights': {
      const word = f.data.word || 'DIRITTI UMANI', x = lerp(px, ex + 10, Math.min(1, p / 0.85)), y = Math.round(lerp(py - 4, ey - 4, p));
      ctx.fillStyle = C.P; for (let k = 1; k <= 6; k++) ctx.fillRect(Math.round(x - tw(word, 2) / 2 - k * 9), y + 2 + (k % 3) * 4, 6, 2);
      otext(ctx, word, x, y, 2, C.Y, C.K, 'center');
      if (p > 0.85) { ctx.globalAlpha = 0.5; ctx.fillStyle = C.W; ctx.fillRect(0, 0, W, H - 48); ctx.globalAlpha = 1; }
      break;
    }
    case 'e_brief': {
      for (let k = 0; k < 6; k++) { const q = clamp(p * 1.6 - k * 0.12, 0, 1); if (q <= 0 || q >= 1) continue; const x = lerp(ex, px, q) + Math.sin(q * 9 + k) * 12, y = lerp(ey - 20, py, q) - Math.sin(q * Math.PI) * 30; otext(ctx, '?', x, y, 3, k % 2 ? C.P : C.Y, C.K, 'center'); }
      break;
    }
    case 'e_f24': {
      const s = SPR.ob.f24[0];
      for (let k = 0; k < 4; k++) { const q = clamp(p * 1.5 - k * 0.15, 0, 1); if (q <= 0 || q >= 1) continue; ctx.drawImage(s, Math.round(lerp(ex, px, q) - 16 + (k - 1.5) * 12), Math.round(lerp(ey - 10, py - 10, q) - Math.sin(q * Math.PI) * (20 + k * 10))); }
      break;
    }
    case 'e_logo': {
      const sc = Math.max(1, Math.round(lerp(1, MOBILE ? 5 : 7, p))), col = [C.P, C.Y, C.K][Math.floor(S.time * 14) % 3];
      otext(ctx, 'LOGO', lerp(ex, px, Math.min(1, p * 1.4)), lerp(ey - 10, py - 7 * sc / 2, Math.min(1, p * 1.4)), sc, col, col === C.K ? C.Y : C.K, 'center');
      break;
    }
    case 'e_bug': {
      for (let k = 0; k < 5; k++) { ctx.fillStyle = pick([C.P, C.Y, C.K, C.B]); ctx.fillRect(irand(-10, W), irand(0, H - 60), irand(20, 120), irand(1, 4)); }
      try { const y = irand(10, H - 70), h = irand(4, 14); ctx.drawImage(cvs, 0, y * KS, cvs.width, h * KS, irand(-14, 14), y, W, h); } catch (e) { /* */ }
      otext(ctx, 'ERROR', px + irand(-4, 4), py - 40, 2, C.P, C.K, 'center');
      break;
    }
    case 'e_voice': {
      for (let k = 0; k < 14; k++) { const q = clamp(p * 1.4 - k * 0.04, 0, 1); if (q <= 0 || q >= 1) continue; const x = lerp(ex - 20, px + 10, q), h = 4 + Math.abs(Math.sin(k * 1.7 + S.time * 20)) * 18, y = lerp(ey - 10, py, q); ctx.fillStyle = C.K; ctx.fillRect(Math.round(x) - 1, Math.round(y - h / 2) - 1, 5, Math.round(h) + 2); ctx.fillStyle = C.P; ctx.fillRect(Math.round(x), Math.round(y - h / 2), 3, Math.round(h)); }
      break;
    }
    case 'e_email': {
      const s = SPR.ob.email[Math.floor(S.time * 8) % 2];
      for (let k = 0; k < 5; k++) { const q = clamp(p * 1.5 - k * 0.12, 0, 1); if (q <= 0 || q >= 1) continue; ctx.drawImage(s, Math.round(px - 18 + (k - 2) * 18 + Math.sin(q * 6 + k) * 6), Math.round(lerp(-30, py - 14, q))); }
      break;
    }
    case 'e_client': {
      const list = LIST('feedbackWeek'); f.data.txt = f.data.txt || tr(pick(list) || 'MORE WOW!');
      const lines = wrap(f.data.txt, MOBILE ? 9 : 14), sc = MOBILE ? 2 : 3, q = Math.min(1, p / 0.5), y0 = lerp(-60, H - 48 - lines.length * 8 * sc - 20, q * q);
      lines.forEach((l, i) => otext(ctx, l, W * 0.3, y0 + i * 8 * sc, sc, [C.P, C.Y, C.K][Math.floor(S.time * 10) % 3], C.K, 'center', C.P));
      break;
    }
    case 'e_wild': {
      const h = SPR.fx.heartP;
      for (let k = 0; k < 7; k++) { const q = clamp(p * 1.4 - k * 0.07, 0, 1); if (q <= 0 || q >= 1) continue; ctx.drawImage(h, Math.round(lerp(ex, px, q) + Math.sin(q * 8 + k) * 10), Math.round(lerp(ey - 10, py - 10, q) - Math.sin(q * Math.PI) * 26)); }
      break;
    }
    default: {
      const s = SPR.ob[f.kind.slice(2)]; if (!s) break; const fr = s[0];
      for (let k = 0; k < 3; k++) { const q = clamp(p * 1.4 - k * 0.15, 0, 1); if (q <= 0 || q >= 1) continue; ctx.drawImage(fr, Math.round(lerp(ex, px, q) - fr.width / 2), Math.round(lerp(ey - 10, py - 10, q) - Math.sin(q * Math.PI) * 30)); }
    }
  }
}
function battleUpdate(dt) {
  const B = S.battle; if (!B) return;
  B.blinkE -= dt; B.blinkP -= dt; B.shake -= dt; B.mouth -= dt;
  B.eShow += (B.e.hp - B.eShow) * Math.min(1, dt * 6); B.pShow += (S.hp - B.pShow) * Math.min(1, dt * 6);
  for (let i = B.parts.length - 1; i >= 0; i--) { const q = B.parts[i]; q.life -= dt; if (q.life <= 0) { B.parts.splice(i, 1); continue; } q.vy += 260 * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
}
