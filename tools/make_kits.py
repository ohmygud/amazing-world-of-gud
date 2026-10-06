"""After build.mjs + make_assets.py: brand page + downloadable zips.
python3 tools/make_kits.py"""
import json, os, zipfile, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, SITE = os.path.join(ROOT, 'src'), os.path.join(ROOT, 'docs')
P = lambda *a: os.path.join(SITE, *a)

palette = json.load(open(P('brand', 'palette.json')))['colors']
gifs = sorted(f[:-4] for f in os.listdir(P('assets', 'gud', 'gif')) if f.endswith('.gif'))
poses = sorted(f[:-4] for f in os.listdir(P('assets', 'gud', 'svg')) if f.endswith('.svg'))
order = ['mons', 'npc', 'bonus', 'obstacles', 'bosses', 'fx', 'ui']
icons = {}
for g in order:
    d = P('assets', 'icons', g)
    if os.path.isdir(d): icons[g] = sorted(f[:-4] for f in os.listdir(d) if f.endswith('.svg'))
index = {'palette': palette, 'gifs': gifs, 'poses': poses, 'icons': icons}

css = open(os.path.join(SRC, 'shared.css'), encoding='utf8').read().replace('{{ROOT}}', '../')
page = open(os.path.join(SRC, 'brand.html'), encoding='utf8').read()
page = page.replace('/*@@CSS@@*/', css).replace('/*@@INDEX@@*/null', json.dumps(index, ensure_ascii=False))
os.makedirs(P('brand'), exist_ok=True)
open(P('brand', 'index.html'), 'w', encoding='utf8').write(page)
print('built brand/index.html')

today = datetime.date.today().isoformat()
def add_tree(z, src, arc, skip=()):
    for base, _, files in os.walk(src):
        for f in sorted(files):
            if f.startswith('.') or any(f.endswith(s) for s in skip): continue
            full = os.path.join(base, f)
            z.write(full, os.path.join(arc, os.path.relpath(full, src)))

os.makedirs(P('downloads'), exist_ok=True)
CHAR_README = f"""GUD — CHARACTER PACK  ({today})
==============================

Una sola GUD, la stessa di THANK GUD IT'S FRIDAY, in tutte le pose.
One single GUD, the same as THANK GUD IT'S FRIDAY, in every pose.

png/      ogni frame singolo a 1x (34x34 px), 4x e 8x, sfondo trasparente
          every single frame at 1x (34x34 px), 4x and 8x, transparent
svg/      ogni frame come vettoriale a pixel quadrati (scalabile all'infinito)
          every frame as square-pixel vector (scales forever)
sheets/   sprite sheet orizzontali a 1x 2x 4x + JSON con posizione e durata dei frame
          horizontal sprite sheets at 1x 2x 4x + JSON with frame rects and durations
gif/      animazioni pronte (idle, corsa, salto, sparo, vittoria, spiaggia, camminate...)
          ready-made animations (idle, run, jump, shoot, victory, beach, walks...)
palette/  i sei colori in CSS, JSON, GPL, ASE

Nomi: side-* = di profilo (TGIF), front/back/left = vista dall'alto (GUDQUEST),
battle-back = di spalle nelle lotte, beach = costume da spiaggia.

Regola: ingrandisci sempre per multipli interi (2x, 3x, 4x...) con
image-rendering: pixelated, e non fare il logo più grande.
"""
with zipfile.ZipFile(P('downloads', 'gud-character-pack.zip'), 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('LEGGIMI-README.txt', CHAR_README)
    for sub in ['png', 'svg', 'sheets', 'gif']: add_tree(z, P('assets', 'gud', sub), 'gud-character-pack/' + sub)
    for f in ['favicon.png', 'og-image.png']:
        if os.path.exists(P('assets', 'gud', f)): z.write(P('assets', 'gud', f), 'gud-character-pack/extra/' + f)
    for f in os.listdir(P('brand')):
        if f.startswith('palette'): z.write(P('brand', f), 'gud-character-pack/palette/' + f)
print('zip character pack', os.path.getsize(P('downloads', 'gud-character-pack.zip')) // 1024, 'KB')

BRAND_README = f"""GUD — BRAND KIT  ({today})
=========================

fonts/
  GUD Pixel     (OTF, TTF, WOFF, WOFF2)  titoli e interfaccia · titles & UI
                il carattere 5x7 dei giochi, maiuscolo, monospaziato
  VT323         (WOFF2)  testi · body copy — SIL Open Font License
  Press Start 2P (WOFF2) riserva · fallback — SIL Open Font License
  Installa GUD Pixel aprendo il file .otf. Install GUD Pixel by opening the .otf.

palette/   Electric Yellow #FFE600 · Hot Pink #FF1493 · Bubblegum #FF85C8
           Blush #FFD6EA · Ink #111111 · Cream #FFF9F1
           .css (variabili) .json .gpl (GIMP/Aseprite/Inkscape) .ase (Adobe) .png
icons/     tutte le icone del sito e dei giochi, SVG + PNG 1x 2x 4x
           mons = GUDMON, npc = personaggi, bonus/obstacles/bosses/fx = TGIF, ui = interfaccia
character/ GUD in GIF e SVG (il pacchetto completo è gud-character-pack.zip)
guide/     la pagina della guida (apri brand/index.html dal sito per la versione viva)

CSS:
  --pix: 'GUD Pixel', 'Press Start 2P', monospace;
  --body: 'VT323', monospace;
  image-rendering: pixelated;
"""
with zipfile.ZipFile(P('downloads', 'gud-brand-kit.zip'), 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('LEGGIMI-README.txt', BRAND_README)
    add_tree(z, P('fonts'), 'gud-brand-kit/fonts')
    for f in os.listdir(P('brand')):
        if f.startswith('palette'): z.write(P('brand', f), 'gud-brand-kit/palette/' + f)
    add_tree(z, P('assets', 'icons'), 'gud-brand-kit/icons')
    add_tree(z, P('assets', 'gud', 'gif'), 'gud-brand-kit/character/gif')
    add_tree(z, P('assets', 'gud', 'svg'), 'gud-brand-kit/character/svg')
    z.write(P('brand', 'palette-swatches.png'), 'gud-brand-kit/guide/palette-swatches.png')
print('zip brand kit', os.path.getsize(P('downloads', 'gud-brand-kit.zip')) // 1024, 'KB')
