/* ---------------- MAPS (generated from content) ---------------- */
const MAPS = {};
let BUILDINGS = [];
const BUILTIN_POS = {
  teaching: { x: 24, y: 2, w: 8, h: 6, door: 4, roof: C.Y, roof2: C.W, style: 'temple', sign: [23, 8], wallSpr: ['board', 'poster', 'board', 'poster'], floorSpr: ['desk'] },
  studio: { x: 4, y: 12, w: 7, h: 5, door: 3, roof: C.B, roof2: C.W, sign: [8, 18], wallSpr: ['posterY', 'frame', 'poster', 'frame'], floorSpr: ['pc'] },
  library: { x: 13, y: 12, w: 6, h: 5, door: 3, roof: C.K, roof2: C.B, sign: [17, 18], wallSpr: ['books', 'shelf', 'books', 'shelf'], floorSpr: ['shelf'] },
  gallery: { x: 23, y: 12, w: 8, h: 5, door: 4, roof: C.W, roof2: C.B, icon: 'frame', signBg: C.Y, sign: [28, 18], wallSpr: ['frame', 'frame', 'posterY', 'frame'], floorSpr: ['pedestal', 'easel'] },
  type: { x: 4, y: 33, w: 7, h: 5, door: 3, roof: C.K, roof2: C.P, icon: 'chimney', signBg: C.K, signFg: C.Y, sign: [11, 37], wallSpr: ['poster', 'typecase', 'posterY', 'typecase'], floorSpr: ['press', 'typecase'] },
  lucca: { x: 23, y: 33, w: 8, h: 5, door: 4, roof: C.P, style: 'castle', signBg: C.Y, sign: [22, 37], wallSpr: ['legacy', 'posterY', 'legacy', 'poster'], floorSpr: ['vault', 'stripsTree'] }
};
const NEW_STYLES = [
  { roof: C.Y, roof2: C.P }, { roof: C.B, roof2: C.K, icon: 'frame', signBg: C.Y }, { roof: C.P, style: 'castle', signBg: C.Y },
  { roof: C.W, roof2: C.P }, { roof: C.K, roof2: C.Y, signBg: C.K, signFg: C.Y }, { roof: C.Y, roof2: C.W, style: 'temple' }
];
const NEW_SLOTS_X = [3, 12, 22, 31];
function shortLabel(s) {
  s = tr(s).toUpperCase().trim();
  if (s.length <= 12) return s;
  const w = s.split(/\s+/).sort((a, b) => b.length - a.length)[0];
  return w.slice(0, 12);
}
function newSections() { return SECTIONS.filter(s => !BUILTIN_POS[s.id]); }
function genTown() {
  const extra = newSections().length, rows = Math.ceil(extra / 4);
  const w = 40, h = 42 + (rows ? rows * 9 + 1 : 0), g = [];
  for (let j = 0; j < h; j++) g.push(new Array(w).fill('.'));
  const rect = (x, y, ww, hh, c) => { for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) if (g[j] && g[j][i] !== undefined) g[j][i] = c; };
  let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let j = 2; j < h - 2; j++) for (let i = 2; i < w - 2; i++) if (rnd() < 0.08) g[j][i] = ':';
  rect(0, 0, w, 2, 'T'); rect(0, h - 2, w, 2, 'T'); rect(0, 0, 2, h, 'T'); rect(w - 2, 0, 2, h, 'T');
  rect(19, 2, 2, h - 4, '=');
  rect(2, 9, 36, 2, '='); rect(2, 17, 36, 1, '=');
  rect(2, 19, 36, 2, '~'); g[19][19] = '['; g[19][20] = ']'; g[20][19] = '['; g[20][20] = ']';
  rect(4, 22, 9, 4, '"'); rect(26, 22, 9, 4, '"'); rect(6, 27, 9, 4, '"'); rect(25, 27, 8, 4, '"');
  [[14, 22], [15, 22], [14, 23], [23, 24], [35, 22], [3, 27], [17, 29], [22, 29], [36, 29], [3, 34], [13, 34], [16, 35], [33, 13], [35, 15], [3, 13], [36, 4], [9, 3]].forEach(([x, y]) => { g[y][x] = 'T'; });
  rect(2, 32, 36, 1, 'M'); g[32][19] = '='; g[32][20] = '=';
  rect(3, 38, 34, 1, '=');
  if (rows) {
    rect(2, 40, 36, 1, 'M'); g[40][19] = '='; g[40][20] = '=';
    for (let r = 0; r < rows; r++) rect(3, 41 + r * 9 + 7, 34, 1, '=');
  }
  BUILDINGS.forEach(b => { for (let y = b.y + b.h; y < h - 2; y++) { const c = g[y][b.x + b.door]; if (c === '=') break; g[y][b.x + b.door] = '='; } });
  rect(32, 12, 5, 5, ':'); g[13][33] = 'T'; g[15][35] = 'T';
  return { w, h, g };
}
function makeBuildings() {
  BUILDINGS = [
    { id: 'home', x: 4, y: 4, w: 5, h: 4, door: 2, roof: C.P, label: 'GUD' },
    { id: 'centro', x: 11, y: 4, w: 6, h: 4, door: 3, roof: C.P, roof2: C.B, icon: 'heart', label: LANG === 'en' ? 'GUD CENTER' : 'CENTRO GUD', signBg: C.P, signFg: C.W }
  ];
  SECTIONS.forEach(s => {
    const p = BUILTIN_POS[s.id];
    if (p) BUILDINGS.push(Object.assign({ id: s.id, label: shortLabel(s.place || s.title), sec: s }, p));
  });
  newSections().forEach((s, i) => {
    const st = NEW_STYLES[i % NEW_STYLES.length], r = Math.floor(i / 4), x = NEW_SLOTS_X[i % 4], y = 41 + r * 9 + 2;
    BUILDINGS.push(Object.assign({ id: s.id, x, y, w: 7, h: 5, door: 3, label: shortLabel(s.place || s.title), sec: s, sign: [x - 1, y + 4], wallSpr: ['poster', 'frame', 'posterY', 'board'], floorSpr: ['desk', 'plant', 'pedestal'] }, st));
  });
}
function makeTown() {
  const { w, h, g } = genTown();
  const m = { id: 'town', w, h, g, outdoor: true, objs: [], npcs: [], warps: [], blds: [] };
  BUILDINGS.forEach(b => { b.spr = buildingSprite(b); m.blds.push(b); m.warps.push({ x: b.x + b.door, y: b.y + b.h - 1, to: b.id }); });
  const sign = (x, y, text) => { if (g[y] && g[y][x] !== undefined && g[y][x] !== '=' && !m.objs.some(o => o.x === x && o.y === y)) m.objs.push({ x, y, spr: SP.sign, text }); };
  sign(8, 8, TQ('signHome')); sign(17, 8, TQ('signCentro'));
  sign(21, 3, TQ('signFirenze'));
  BUILDINGS.forEach(b => { if (b.sec && b.sign) sign(b.sign[0], b.sign[1], b.sec.sign || b.sec.place); });
  sign(21, 21, TQ('signRoute'));
  sign(21, 33, TQ('signLucca'));
  sign(32, 37, TQ('signTower'));
  if (h > 42) sign(21, 41, TQ('signNew'));
  m.objs.push({ x: 33, y: 4, w: 2, h: 2, spr: SP.monument, text: TQ('monument') });
  m.objs.push({ x: 33, y: 33, w: 3, h: 5, spr: SP.tower, text: TQ('tower') });
  m.npcs.push(
    { x: 9, y: 10, dir: 'down', look: 'prof', name: 'PROF. SERIF', script: 'prof' },
    { x: 24, y: 10, dir: 'left', look: 'boy', say: TQ('npcTourist') },
    { x: 31, y: 18, dir: 'down', look: 'girl', say: TQ('npcBrividi') },
    { x: 17, y: 23, dir: 'down', look: 'girl', say: TQ('npcGrass') },
    { x: 22, y: 27, dir: 'left', look: 'teach', say: TQ('npcDex') },
    { x: 14, y: 38, dir: 'right', look: 'punk', say: TQ('npcCosplay') },
    { x: 26, y: 35, dir: 'down', look: 'guard', say: TQ('npcGuard') },
    { x: 34, y: 38, dir: 'down', look: 'client', name: 'BIG CLIENT', script: 'client' }
  );
  return m;
}
const TQ = k => ((CONTENT.text || {}).quest || {})[k] || (((window.GUD_DEFAULT_CONTENT || {}).text || {}).quest || {})[k] || '';
function makeInterior(id, cfg) {
  const w = cfg.w || 12, h = 9, g = [], cx = w / 2;
  for (let j = 0; j < h; j++) g.push(new Array(w).fill('o'));
  for (let i = 0; i < w; i++) { g[0][i] = 'h'; g[1][i] = 'H'; g[8][i] = 'H'; }
  g[8][cx - 1] = 'D'; g[8][cx] = 'D';
  const m = { id, w, h, g, outdoor: false, objs: [], npcs: [], warps: [], title: cfg.title, cx };
  (cfg.wall || []).forEach(o => m.objs.push(Object.assign({ y: 1, wall: true }, o)));
  (cfg.floor || []).forEach(o => m.objs.push(o));
  (cfg.npcs || []).forEach(n => m.npcs.push(n));
  return m;
}
function wallSlots(w) { const cx = w / 2, out = []; for (let x = 1; x < w - 1; x += 2) if (x !== cx - 1 && x !== cx) out.push(x); return out; }
function sectionInterior(b) {
  const sec = b.sec, n = sec.items.length;
  let w = 12; while (wallSlots(w).length + 4 < n) w += 2;
  const cx = w / 2, wallX = wallSlots(w), floorP = [[1, 4], [w - 2, 4], [1, 6], [w - 2, 6]];
  const wall = [], floor = [];
  sec.items.forEach((it, i) => {
    const text = [tr(it.t) + '.', it.d];
    if (i < wallX.length) wall.push({ x: wallX[i], spr: SP.f[b.wallSpr[i % b.wallSpr.length]], text, item: it });
    else { const fp = floorP[i - wallX.length]; if (fp) floor.push({ x: fp[0], y: fp[1], spr: SP.f[b.floorSpr[(i - wallX.length) % b.floorSpr.length]], text, item: it }); }
  });
  wall.push({ x: cx - 1, spr: SP.f.window, text: L('Fuori splende il sole. Dentro, si lavora.', 'The sun is shining outside. Inside, work goes on.') });
  wall.push({ x: cx, spr: SP.f.window, text: L('Una finestra. Vista su tutta la carriera di GUD.', 'A window. A view over GUD\'s whole career.') });
  const ld = sec.leader || {};
  const npcs = [{ x: cx - 1, y: 3, dir: 'down', look: ld.look || 'teach', name: ld.name || 'LEADER', script: 'leader', sec: sec.id }];
  if (sec.npc && sec.npc.say) npcs.push({ x: cx + 2, y: 5, dir: 'left', look: sec.npc.look || 'boy', say: sec.npc.say });
  return makeInterior(sec.id, { w, title: sec.place || sec.title, wall, floor, npcs });
}
function buildMaps() {
  Object.keys(MAPS).forEach(k => delete MAPS[k]);
  makeBuildings();
  MAPS.town = makeTown();
  MAPS.home = makeInterior('home', {
    title: L('CASA DI GUD', 'GUD\'S HOUSE'),
    wall: [
      { x: 1, spr: SP.f.shelf, text: TQ('homeShelf') },
      { x: 3, spr: SP.f.posterY, text: TQ('homePoster') },
      { x: 6, spr: SP.f.window, text: TQ('homeWindow') },
      { x: 9, spr: SP.f.board, text: TQ('homeBoard') }
    ],
    floor: [
      { x: 1, y: 2, h: 2, spr: SP.f.bed, text: TQ('homeBed') },
      { x: 10, y: 2, spr: SP.f.pc, text: TQ('homePc') },
      { x: 3, y: 5, spr: SP.f.tv, text: TQ('homeTv') },
      { x: 10, y: 6, spr: SP.f.plant, text: TQ('homePlant') }
    ],
    npcs: [{ x: 8, y: 4, dir: 'left', look: 'mom', name: L('MAMMA', 'MOM'), say: TQ('mom') }]
  });
  MAPS.centro = makeInterior('centro', {
    title: L('CENTRO GUD', 'GUD CENTER'),
    wall: [{ x: 2, spr: SP.f.posterY, text: TQ('centroPoster') }, { x: 9, spr: SP.f.window, text: L('Una finestra sul Lungarno.', 'A window over the Arno.') }],
    floor: [
      { x: 3, y: 3, spr: SP.f.counter, text: L('Il bancone del CENTRO GUD.', 'The GUD CENTER counter.') },
      { x: 4, y: 3, spr: SP.f.coffee, text: L('Una macchina del caffè. Profuma di scadenze rispettate.', 'A coffee machine. It smells of met deadlines.') },
      { x: 6, y: 3, spr: SP.f.counter, text: L('Il bancone del CENTRO GUD.', 'The GUD CENTER counter.') },
      { x: 7, y: 3, spr: SP.f.counter, text: L('Il bancone del CENTRO GUD.', 'The GUD CENTER counter.') },
      { x: 10, y: 3, spr: SP.f.pc, script: 'contacts' },
      { x: 1, y: 6, spr: SP.f.plant, text: L('Una pianta molto rilassata.', 'A very relaxed plant.') }
    ],
    npcs: [
      { x: 5, y: 3, dir: 'down', look: 'barista', name: 'BARISTA', script: 'heal' },
      { x: 8, y: 6, dir: 'left', look: 'boy', say: TQ('recruiter') }
    ]
  });
  BUILDINGS.forEach(b => { if (b.sec) MAPS[b.id] = sectionInterior(b); });
}
function entryPos(mapId) { const m = MAPS[mapId]; return [m.cx - 1, m.h - 2]; }
