// Renders every sprite with the real engine in Chromium and dumps RGBA data to JSON.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const R = p => readFileSync(new URL('../src/' + p, import.meta.url), 'utf8');
const content = JSON.parse(R('content.default.json'));
const code = `
buildSprites();
const OUT = {};
function add(name, c) { const x = c.getContext('2d'); const d = x.getImageData(0, 0, c.width, c.height).data; let s = ''; for (let i = 0; i < d.length; i++) s += String.fromCharCode(d[i]); OUT[name] = { w: c.width, h: c.height, b64: btoa(s) }; }
const poses = { idle: 2, run: 4, shoot: 4, jump: 1, jumpshoot: 1, duck: 2, hurt: 1, collect: 1, victory: 2, defeat: 1, beach: 2, beachjump: 1 };
Object.keys(poses).forEach(p => { for (let f = 0; f < poses[p]; f++) add('gud/side-' + p + '-' + f, gud(p, f)); });
['down', 'up', 'left', 'right'].forEach(d => { for (let f = 0; f < 3; f++) add('gud/walk-' + d + '-' + f, person('gud', d, f)); });
add('gud/battle-back-0', gudBack(0)); add('gud/battle-back-1', gudBack(1));
Object.keys(LOOKS).filter(k => k !== 'gud').forEach(k => add('npc/' + k, person(k, 'down', 0)));
add('npc/ludo', ludo('right', 0));
(window.GUD_DEFAULT_CONTENT.mons || []).forEach(m => add('mons/' + m.id, monSprite(m)));
Object.keys(SPR.bn).forEach(k => add('bonus/' + k, SPR.bn[k][0]));
Object.keys(SPR.ob).forEach(k => SPR.ob[k].forEach((c, i) => add('obstacles/' + k + (SPR.ob[k].length > 1 ? '-' + i : ''), c)));
add('bosses/bigclient', SPR.client[0]); add('bosses/bigclient-yell', SPR.client[1]); add('bosses/hangover', SPR.hangover[0]); add('bosses/hangover-yell', SPR.hangover[1]);
['heart', 'heartP', 'cloud', 'sun', 'cal', 'olive', 'ice', 'palm', 'umbrella'].forEach(k => add('fx/' + k, SPR.fx[k]));
add('fx/wave', SPR.fx.wave[0]);
window.__OUT = OUT;
`;
const html = `<!doctype html><html><body><script>window.GUD_CONFIG={layout:'desktop',assetBase:'./',contentBase:'./'};window.GUD_DEFAULT_CONTENT=${JSON.stringify(content)};</script><script>${R('engine.js').replace('/* @@GAME@@ */', code)}</script></body></html>`;
const b = await chromium.launch(); const p = await b.newPage();
p.on('pageerror', e => console.error('ERR', e.message));
await p.setContent(html); await p.waitForFunction(() => window.__OUT);
const out = await p.evaluate(() => window.__OUT);
writeFileSync(process.argv[2], JSON.stringify(out)); console.log('sprites', Object.keys(out).length);
await b.close();
