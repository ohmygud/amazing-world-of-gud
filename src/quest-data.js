/* =====================================================================
   GUDQUEST — data adapter. Everything comes from content.json
   (edited from the CMS); this file only reshapes it for the game.
   ===================================================================== */
const L = (it, en) => ({ it, en });
let CONTACTS = [], CV = { sections: {} }, SECTIONS = [], SECTION_ORDER = [], MONS = [], BAT = {};
const ENEMY_KEYS = ['brief', 'f24', 'logo', 'bug', 'voice', 'email', 'urgent', 'call', 'link404', 'update', 'internet', 'overtime', 'martini', 'pranzo', 'parmigiana', 'malessere', 'contradictory'];
function applyContent() {
  const c = CONTENT || {};
  CONTACTS = (c.contacts || []).map(k => ({ k: k.id, label: k.label, url: k.url, show: k.show }));
  const p = c.profile || {};
  SECTIONS = (c.sections || []).filter(s => s && s.id);
  SECTION_ORDER = SECTIONS.map(s => s.id);
  CV = { name: p.name || 'GUD', full: p.full || '', role: p.role, education: p.education || [], languages: p.languages, studio: p.studio, sections: {} };
  BAT = {};
  SECTIONS.forEach((s, i) => {
    s.items = (s.items || []).filter(Boolean);
    CV.sections[s.id] = s;
    const b = s.battle || {};
    const moves = (b.moves || []).filter(m => m && m.n).map(m => [m.n, +m.p || 10]);
    BAT[s.id] = {
      name: b.name || s.place || s.title, spr: ENEMY_KEYS.includes(b.enemy) ? b.enemy : ENEMY_KEYS[i % 6],
      hp: +b.hp || 72, lv: +b.lv || 30 + i, weak: b.weak == null ? i % 4 : +b.weak,
      moves: moves.length ? moves : [[L('SCADENZA', 'DEADLINE'), 11], [L('URGENTE', 'URGENT'), 10]],
      pre: b.pre || L('Vediamo cosa sai fare!', 'Let\'s see what you can do!'),
      post: b.post || L('Ben fatto.', 'Well done.')
    };
  });
  BAT.client = {
    name: L('BIG CLIENT', 'BIG CLIENT'), spr: 'client', hp: 150, lv: 99, weak: 3, boss: true,
    moves: [[L('LOGO PIÙ GRANDE', 'MAKE IT BIGGER'), 15], [L('CI SIAMO QUASI', 'ALMOST THERE'), 14], [L('MIO CUGINO LO FA', 'MY COUSIN CAN DO IT'), 17], [L('ENTRO IERI', 'BY YESTERDAY'), 16]]
  };
  const ms = (c.mons || []).filter(m => m && m.n);
  MONS = ms.filter(m => !m.legendary).concat(ms.filter(m => m.legendary));
}
const NREG = () => MONS.filter(m => !m.legendary).length;
const NBADGE = () => SECTIONS.length;
const monIdx = id => MONS.findIndex(m => m.id === id || m.n === id);

/* fixed UI strings (game chrome) */
const TXT = {
  pressStart: L('PREMI START', 'PRESS START'),
  newGame: L('NUOVA PARTITA', 'NEW GAME'), cont: L('CONTINUA', 'CONTINUE'), quick: L('CV RAPIDO', 'QUICK CV'),
  menu: [L('GUDDEX', 'GUDDEX'), L('GUD', 'GUD'), L('ZAINO', 'BAG'), L('CV RAPIDO', 'QUICK CV'), L('LINGUA', 'LANGUAGE'), L('SALVA', 'SAVE'), L('ESCI', 'EXIT')],
  fight: L('LOTTA', 'FIGHT'), bag: L('ZAINO', 'BAG'), catchT: L('CATTURA', 'CATCH'), run: L('FUGA', 'RUN'),
  yes: L('SÌ', 'YES'), no: L('NO', 'NO'),
  saved: L('Partita salvata!', 'Game saved!')
};
