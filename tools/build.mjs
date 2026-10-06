// GUD WORLD build: node tools/build.mjs  → writes everything into ./docs
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { dirname } from 'node:path';
const R = p => readFileSync(new URL('../src/' + p, import.meta.url), 'utf8');
const OUT = p => new URL('../docs/' + p, import.meta.url);
const write = (p, s) => { const u = OUT(p); mkdirSync(dirname(u.pathname), { recursive: true }); writeFileSync(u, s); console.log('built', p, (s.length / 1024).toFixed(1) + ' KB'); };
const content = JSON.parse(R('content.default.json'));
const contentJS = 'window.GUD_DEFAULT_CONTENT=' + JSON.stringify(content) + ';';
const css = root => R('shared.css').split('{{ROOT}}').join(root);
const engine = code => R('engine.js').replace('/* @@GAME@@ */', () => code);
const GFONTS = /<link rel="preconnect"[^\n]*\n<link href="https:\/\/fonts\.googleapis[^\n]*\n/;
function page(tpl, opts) {
  let h = R(tpl).replace(GFONTS, '');
  h = h.replace('/*@@CSS@@*/', () => css(opts.root) + (opts.extraCss || ''));
  h = h.replace('/*@@CVCSS@@*/', () => opts.cvcss || '');
  h = h.replace('<!--@@HACK@@-->', () => R('hack.html')).replace('<!--@@CVPANEL@@-->', () => R('cvpanel.html'));
  h = h.replace(/window\.GUD_CONFIG=\{layout:'(\w+)',assetBase:'[^']*'\};/, (m, l) => `window.GUD_CONFIG={layout:'${l}',assetBase:'${opts.root}assets/',contentBase:'${opts.root}content/',adminUrl:'${opts.root}admin/'};`);
  h = h.replace('<script src="../assets/manifest.js"></script>', `<script src="${opts.root}assets/manifest.js"></script>`);
  h = h.replace('<script>\n/*@@ENGINE@@*/\n</script>', () => `<script>${contentJS}</script>\n${opts.pre || ''}<script>\n${opts.engine}\n</script>`);
  if (opts.patch) h = opts.patch(h);
  return h;
}
const langBtn = h => h.replace('<button id="muteBtn"', '<button id="langBtn" class="tbtn" type="button">EN</button>\n      <button id="muteBtn"');
// TGIF
const tgif = engine(R('game.js'));
for (const t of ['desktop', 'mobile']) write(`tgif/${t}/index.html`, page(`${t}.template.html`, { root: '../../', engine: tgif, patch: langBtn }));
// GUDQUEST
const questCode = ['quest-data.js', 'quest1.js', 'quest-maps.js', 'quest2.js', 'quest-battle.js', 'quest3.js'].map(R).join('\n');
const quest = engine(questCode);
const viewer = `<script>\n${R('viewer.js')}\n</script>\n`;
for (const t of ['desktop', 'mobile']) write(`quest/${t}/index.html`, page(`cv-${t}.template.html`, { root: '../../', engine: quest, cvcss: R('cv.css') + R('viewer.css'), pre: viewer,
  patch: h => h.replace('GUDQUEST <b>&hearts;&#xFE0E;</b> PINK VERSION', 'GUDQUEST <b>&hearts;&#xFE0E;</b> PINK ADVENTURE').replace('<title>GUDQUEST · Pink Version</title>', '<title>GUDQUEST · Pink Adventure</title>') }));
// other pages (shell, cv, tricks, admin) are plain templates with {{ROOT}} css + content
const simple = (tpl, out, root, extra) => {
  if (!existsSync(new URL('../src/' + tpl, import.meta.url))) return;
  let h = R(tpl).split('/*@@CSS@@*/').join(css(root)).split('/*@@CONTENT@@*/').join(contentJS).split('/*@@VIEWERCSS@@*/').join(R('viewer.css')).split('/*@@VIEWERJS@@*/').join(R('viewer.js'));
  if (extra) h = extra(h);
  write(out, h);
};
simple('shell.html', 'index.html', '');
simple('cvpage.html', 'cv/index.html', '../');
simple('tricks.html', 'tricks/index.html', '../');
simple('admin.html', 'admin/index.html', '../', h => h.split('/*@@PIXELKIT@@*/').join(engine('window.PIXEL = { C, dtext, otext, tw, mk, monSprite, person, gud, buildSprites, SPR, MON_ACCESSORIES, LOOKS };')));
// PHP CMS + server files
const cp = (from, to) => { const u = OUT(to); mkdirSync(dirname(u.pathname), { recursive: true }); copyFileSync(new URL('../src/php/' + from, import.meta.url), u); };
cp('api/index.php', 'api/index.php'); cp('api/.user.ini', 'api/.user.ini'); cp('htaccess-root', '.htaccess');
// default content for the server
mkdirSync(OUT('content/media').pathname, { recursive: true });
writeFileSync(OUT('content/content.json'), JSON.stringify(content, null, 1));
writeFileSync(OUT('content/content.default.json'), JSON.stringify(content, null, 1));
if (!existsSync(OUT('assets/manifest.js'))) { mkdirSync(OUT('assets').pathname, { recursive: true }); copyFileSync(new URL('../../tgif/assets/manifest.js', import.meta.url), OUT('assets/manifest.js')); }
