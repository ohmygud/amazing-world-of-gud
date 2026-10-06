"""Turn build/library.json into the full asset library + GUDQUEST characters folder.
python3 tools/make_library.py build/library.json build/out"""
import json, sys, os, base64, io, shutil, struct, subprocess, wave, array
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'docs')
data = json.load(open(sys.argv[1])); OUT = sys.argv[2]
LIB = os.path.join(OUT, 'gud-asset-library'); CHR = os.path.join(OUT, 'gudquest-characters')
for d in (LIB, CHR): shutil.rmtree(d, ignore_errors=True)
FONT = os.path.join(SITE, 'fonts', 'GUDPixel-Regular.ttf'); BODY = os.path.join(SITE, 'fonts', 'VT323-latin.woff2')
def font(sz):
    return ImageFont.truetype(FONT, sz)
Y, P, B, L, K, W = '#FFE600', '#FF1493', '#FF85C8', '#FFD6EA', '#111111', '#FFF9F1'
def img(name): d = data['img'][name]; return Image.frombytes('RGBA', (d['w'], d['h']), base64.b64decode(d['b64']))
def up(im, s): return im.resize((im.width * s, im.height * s), Image.NEAREST)
def mk(p): os.makedirs(os.path.dirname(p), exist_ok=True); return p
def svg(im):
    w, h = im.size; px = im.load(); out = []
    for y in range(h):
        x = 0
        while x < w:
            r, g, b, a = px[x, y]
            if a == 0: x += 1; continue
            x2 = x
            while x2 + 1 < w and px[x2 + 1, y] == px[x, y]: x2 += 1
            out.append('<rect x="%d" y="%d" width="%d" height="1" fill="#%02X%02X%02X"/>' % (x, y, x2 - x + 1, r, g, b)); x = x2 + 1
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" shape-rendering="crispEdges">%s</svg>' % (w, h, w * 8, h * 8, ''.join(out))
def gif(frames, path, fps, scale=4):
    conv = []
    for f in [up(f, scale) for f in frames]:
        q = f.convert('RGB').quantize(colors=15, method=Image.Quantize.FASTOCTREE)
        out = Image.new('P', f.size, 15); qp = q.getpalette()[:45]
        out.putpalette(qp + [0] * (45 - len(qp)) + [255, 0, 255] + [0] * (768 - 48))
        a = f.getchannel('A').load(); qa = q.load(); o = out.load()
        for y in range(f.height):
            for x in range(f.width): o[x, y] = qa[x, y] if a[x, y] > 0 else 15
        conv.append(out)
    conv[0].save(mk(path), save_all=True, append_images=conv[1:], duration=int(1000 / fps), loop=0, transparency=15, disposal=2)
def save_set(name, im, folder, scales=(1, 4), with_svg=True):
    for s in scales: up(im, s).save(mk(os.path.join(folder, 'png', '%s@%dx.png' % (name, s))))
    if with_svg: open(mk(os.path.join(folder, 'svg', name + '.svg')), 'w').write(svg(im))

LOOK_NAMES = {'gud': 'GUD', 'mom': 'MAMMA', 'prof': 'PROFESSORE', 'client': 'BIG CLIENT', 'girl': 'RAGAZZA', 'boy': 'RAGAZZO', 'teach': 'DOCENTE',
              'barista': 'BARISTA', 'punk': 'PUNK', 'critic': 'CRITICA', 'libr': 'BIBLIOTECARIA', 'guard': 'GUARDIA', 'ludo': 'LUDO'}
DIR_IT = {'down': 'FRONTE', 'up': 'SPALLE', 'left': 'SINISTRA', 'right': 'DESTRA'}
usage = {}
for look, name, where in data.get('usage', []):
    usage.setdefault(look, []).append((name + ' · ' if name and name != where else '') + where)

# ---------------------------------------------------------------- GUDQUEST characters
looks = sorted({k.split('/')[1] for k in data['img'] if k.startswith('quest-characters/')}, key=lambda k: list(LOOK_NAMES).index(k) if k in LOOK_NAMES else 99)
for look in looks:
    names = sorted(k for k in data['img'] if k.startswith('quest-characters/%s/' % look))
    folder = os.path.join(CHR, '%s-%s' % (look, LOOK_NAMES.get(look, look).lower().replace(' ', '-')))
    for k in names: save_set(k.split('/')[-1], img(k), folder, (1, 4, 8))
    # walk sheets + gifs per direction
    dirs = ['down', 'up', 'left', 'right']
    frames_n = 2 if look == 'ludo' else 3
    rows = []
    for d in dirs:
        fr = [img('quest-characters/%s/%s-%s-%d' % (look, look, d, f)) for f in range(frames_n) if 'quest-characters/%s/%s-%s-%d' % (look, look, d, f) in data['img']]
        if not fr: continue
        seq = [fr[0], fr[1], fr[0], fr[2]] if len(fr) == 3 else [fr[0], fr[1]]
        gif(seq, os.path.join(folder, 'gif', '%s-walk-%s.gif' % (look, d)), 6, 6)
        rows.append(fr)
    w, h = rows[0][0].size
    sheet = Image.new('RGBA', (w * frames_n, h * len(rows)), (0, 0, 0, 0))
    for r, fr in enumerate(rows):
        for c, im in enumerate(fr): sheet.paste(im, (c * w, r * h))
    for s in (1, 4): up(sheet, s).save(mk(os.path.join(folder, 'sheet', '%s-sheet@%dx.png' % (look, s))))
    json.dump({'frameWidth': w, 'frameHeight': h, 'rows': [d for d in dirs][:len(rows)], 'framesPerRow': frames_n,
               'note': 'righe: fronte, spalle, sinistra, destra · rows: down, up, left, right'}, open(os.path.join(folder, 'sheet', '%s-sheet.json' % look), 'w'), indent=1)
for k in [k for k in data['img'] if k.startswith('quest-enemies/big-client')]:
    save_set(k.split('/')[-1], img(k), os.path.join(CHR, 'client-big-client', 'battle'), (1, 4))
for k in [k for k in data['img'] if 'battle-back' in k]:
    save_set(k.split('/')[-1], img(k), os.path.join(CHR, 'gud-gud', 'battle'), (1, 4))

# overview sheet with labels, so every character can be named in a message
def overview():
    S = 4; cell = 34 * S; lab = 380; pad = 24
    rows = [l for l in looks]
    H = 140 + len(rows) * (cell + 46) + 420
    Wd = lab + 12 * (cell + 8) + pad * 2
    im = Image.new('RGB', (Wd, H), L); dr = ImageDraw.Draw(im)
    dr.rectangle([0, 0, Wd, 110], fill=P)
    dr.text((pad, 26), 'GUDQUEST · PERSONAGGI', font=font(40), fill=Y, stroke_width=3, stroke_fill=K)
    dr.text((pad, 78), 'Ogni riga ha un nome: dimmi riga + colonna per le modifiche.', font=font(16), fill=W)
    y = 130
    hdr = [(d, f) for d in ['down', 'up', 'left', 'right'] for f in range(3)]
    for i, (d, f) in enumerate(hdr):
        dr.text((pad + lab + i * (cell + 8) + 4, y), '%s %d' % (DIR_IT[d], f + 1), font=font(12), fill=K)
    y += 26
    for look in rows:
        dr.rectangle([pad - 8, y - 6, Wd - pad + 8, y + cell + 30], fill=W, outline=K, width=3)
        dr.text((pad, y + 6), LOOK_NAMES.get(look, look.upper()), font=font(22), fill=P)
        dr.text((pad, y + 40), 'id: ' + look, font=font(12), fill=K)
        us = usage.get(look, []) if look != 'ludo' else ['segue GUD ovunque']
        yy = y + 62
        for u in us[:5]:
            dr.text((pad, yy), '· ' + u[:30], font=font(10), fill=K); yy += 16
        for i, (d, f) in enumerate(hdr):
            k = 'quest-characters/%s/%s-%s-%d' % (look, look, d, f)
            if k not in data['img']: continue
            c = img(k); s = S if look != 'ludo' else 6
            tile = Image.new('RGBA', (cell, cell), (255, 214, 234, 255))
            spr = up(c, s); tile.paste(spr, ((cell - spr.width) // 2, cell - spr.height), spr)
            im.paste(tile, (pad + lab + i * (cell + 8), y + 8))
        y += cell + 46
    # battle sprites
    dr.text((pad, y + 6), 'IN BATTAGLIA', font=font(22), fill=P); y += 44
    x = pad
    for k in ['quest-characters/gud/gud-battle-back-0', 'quest-characters/gud/gud-battle-back-1', 'quest-enemies/big-client-0', 'quest-enemies/big-client-1']:
        if k not in data['img']: continue
        c = up(img(k), 3 if 'client' in k else 6); im.paste(c, (x, y), c); dr.text((x, y + c.height + 6), k.split('/')[-1].upper(), font=font(10), fill=K); x += c.width + 30
    im.save(mk(os.path.join(CHR, '00-PANORAMICA-personaggi.png')))
    return im
ov = overview()
open(os.path.join(CHR, 'LEGGIMI.txt'), 'w').write("""GUDQUEST — PERSONAGGI
=====================
00-PANORAMICA-personaggi.png  tutti i personaggi in una tavola: ogni riga ha un nome
                              (MAMMA, BIG CLIENT, LUDO...) e ogni colonna una direzione
                              (FRONTE, SPALLE, SINISTRA, DESTRA) e un passo (1 fermo, 2 e 3 cammina).

Per ogni personaggio:
  png/    ogni frame a 1x (34x34 px, Ludo 22x18), 4x e 8x
  svg/    ogni frame vettoriale
  sheet/  la tavola dei passi (righe: fronte, spalle, sinistra, destra) + JSON
  gif/    la camminata animata nelle 4 direzioni
  battle/ (GUD e Big Client) le pose della lotta

Per chiedere una modifica basta scrivere, per esempio:
  "MAMMA, FRONTE 1: orecchini rosa invece che gialli"
""")

# ---------------------------------------------------------------- full library
def copytree(src, dst):
    if os.path.isdir(src): shutil.copytree(src, dst, dirs_exist_ok=True)
copytree(CHR, os.path.join(LIB, 'gudquest', 'personaggi'))
GROUPS = {'quest-gudmon': 'gudquest/gudmon', 'quest-enemies': 'gudquest/nemici', 'quest-tiles': 'gudquest/mappa-tile', 'quest-objects': 'gudquest/oggetti-e-arredi',
          'quest-buildings': 'gudquest/edifici', 'quest-badges': 'gudquest/medaglie', 'tgif-gud': 'tgif/gud', 'tgif-obstacles': 'tgif/ostacoli', 'tgif-bonus': 'tgif/bonus',
          'tgif-bosses': 'tgif/boss', 'tgif-fx': 'tgif/scenario-ed-effetti'}
for k in data['img']:
    g = k.split('/')[0]
    if g in GROUPS: save_set(k.split('/')[-1], img(k), os.path.join(LIB, GROUPS[g]), (1, 4))
# gud character pack, icons, brand, fonts from the docs
copytree(os.path.join(SITE, 'assets', 'gud'), os.path.join(LIB, 'gud-personaggio'))
copytree(os.path.join(SITE, 'assets', 'icons'), os.path.join(LIB, 'icone'))
copytree(os.path.join(SITE, 'fonts'), os.path.join(LIB, 'brand', 'font'))
for f in os.listdir(os.path.join(SITE, 'brand')):
    if f.startswith('palette'): shutil.copy(os.path.join(SITE, 'brand', f), mk(os.path.join(LIB, 'brand', 'palette', f)))
for n, b64 in data.get('shots', {}).items():
    open(mk(os.path.join(LIB, 'schermate', n + '.png')), 'wb').write(base64.b64decode(b64))

# contact sheets per group
def contact(title, keys, path, scale=4, cols=8):
    ims = [(k.split('/')[-1], up(img(k), scale)) for k in keys]
    if not ims: return
    cw = max(max(i.width for _, i in ims), 150) + 20; ch = max(i.height for _, i in ims) + 40
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * cw + 40, rows * ch + 110), L); dr = ImageDraw.Draw(sheet)
    dr.text((20, 22), title, font=font(30), fill=P, stroke_width=2, stroke_fill=K)
    for i, (n, im) in enumerate(ims):
        x = 20 + (i % cols) * cw; y = 80 + (i // cols) * ch
        dr.rectangle([x, y, x + cw - 10, y + ch - 10], fill=W, outline=K, width=2)
        sheet.paste(im, (x + (cw - 10 - im.width) // 2, y + 6), im)
        dr.text((x + 6, y + ch - 28), n[:22], font=font(10), fill=K)
    sheet.save(mk(path))
PANO = os.path.join(LIB, '00-panoramiche')
shutil.copy(os.path.join(CHR, '00-PANORAMICA-personaggi.png'), mk(os.path.join(PANO, '01-gudquest-personaggi.png')))
pick = lambda p: sorted(k for k in data['img'] if k.startswith(p))
contact('GUDMON', [k for k in pick('quest-gudmon/') if not k.endswith('-blink')], os.path.join(PANO, '02-gudquest-gudmon.png'), 3, 7)
contact('GUDQUEST · NEMICI', pick('quest-enemies/'), os.path.join(PANO, '03-gudquest-nemici.png'), 2, 6)
contact('GUDQUEST · EDIFICI', pick('quest-buildings/'), os.path.join(PANO, '04-gudquest-edifici.png'), 2, 4)
contact('GUDQUEST · OGGETTI, TILE, MEDAGLIE', pick('quest-objects/') + pick('quest-tiles/') + pick('quest-badges/'), os.path.join(PANO, '05-gudquest-oggetti-tile.png'), 4, 10)
contact('TGIF · GUD', pick('tgif-gud/'), os.path.join(PANO, '06-tgif-gud.png'), 4, 8)
contact('TGIF · OSTACOLI, BONUS, EFFETTI', pick('tgif-obstacles/') + pick('tgif-bonus/') + pick('tgif-fx/'), os.path.join(PANO, '07-tgif-ostacoli-bonus.png'), 3, 8)
contact('TGIF · BOSS', pick('tgif-bosses/'), os.path.join(PANO, '08-tgif-boss.png'), 2, 4)

# sounds: wav (trimmed) + mp3
have_ff = shutil.which('ffmpeg') is not None
nsnd = 0
for name, b64 in data['snd'].items():
    raw = base64.b64decode(b64)
    with wave.open(io.BytesIO(raw)) as w: sr = w.getframerate(); frames = array.array('h', w.readframes(w.getnframes()))
    end = len(frames)
    while end > 0 and abs(frames[end - 1]) < 40: end -= 1
    end = min(len(frames), end + int(sr * 0.08))
    pk = max(1, max((abs(x) for x in frames), default=1)); g = 29000 / pk
    frames = array.array('h', (max(-32767, min(32767, int(x * g))) for x in frames))
    group, n = name.split('/')
    folder = os.path.join(LIB, 'suoni', group)
    p = mk(os.path.join(folder, 'wav', n + '.wav'))
    with wave.open(p, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(frames[:end].tobytes())
    if have_ff:
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', p, '-codec:a', 'libmp3lame', '-q:a', '3', mk(os.path.join(folder, 'mp3', n + '.mp3'))], check=False)
    nsnd += 1

open(os.path.join(LIB, 'LEGGIMI.txt'), 'w').write("""THE AMAZING WORLD OF GUD — LIBRERIA COMPLETA DEGLI ASSET
=========================================================
Tutto quello che si vede e si sente nei giochi, esportato dal codice vero.

00-panoramiche/      tavole riassuntive con i nomi: il modo più veloce per guardare tutto
gud-personaggio/     GUD (la stessa ovunque): png 1x 4x 8x, svg, sprite sheet + json, gif
gudquest/
  personaggi/        tutti i personaggi della Quest (anche Ludo e la mamma), con tavola dei passi e gif
  gudmon/            le passioni da catturare (normale e occhi chiusi)
  nemici/            i nemici delle lotte, compreso il Big Client in camicia
  edifici/           gli edifici della mappa
  oggetti-e-arredi/  cartelli, alberi, monumento, torre, mobili delle stanze
  mappa-tile/        le piastrelle 16x16 della mappa
  medaglie/          le 6 medaglie (vinta e da vincere)
tgif/
  gud/               tutte le pose di GUD nel gioco a scorrimento
  ostacoli/ bonus/ boss/ scenario-ed-effetti/
icone/               le icone del sito e dei giochi (svg + png)
brand/               font (GUD Pixel, VT323, Press Start 2P) e palette (css, json, gpl, ase)
schermate/           schermate dei giochi
suoni/
  tgif/              effetti (salto, sparo, bonus, boss...) e la musica della spiaggia
  gudquest/          effetti (passi, porte, lotte, cattura, Ludo che abbaia...) e le 5 musiche
                     ogni suono in WAV (qualità piena) e MP3, a volume pieno; le musiche sono 2 giri del loop

Tutti i pixel art: ingrandire sempre per multipli interi, con image-rendering: pixelated.
""")
print('characters', len(looks), 'sounds', nsnd)
