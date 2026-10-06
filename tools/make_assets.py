"""Turn exported sprite pixel data into the downloadable asset packs (PNG, sheets+JSON, SVG, GIF, icons, palette)."""
import json, sys, os, base64, struct
from PIL import Image, ImageDraw, ImageFont
data = json.load(open(sys.argv[1])); site = sys.argv[2]; font_path = os.path.join(site, 'fonts', 'GUDPixel-Regular.ttf')
PAL = [('Electric Yellow', '#FFE600'), ('Hot Pink', '#FF1493'), ('Bubblegum Pink', '#FF85C8'), ('Pale Pink', '#FFD6EA'), ('Almost Black', '#111111'), ('Off White', '#FFF9F1')]
def img(name):
    d = data[name]; return Image.frombytes('RGBA', (d['w'], d['h']), base64.b64decode(d['b64']))
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
    fr = [up(f, scale) for f in frames]
    pal = []
    conv = []
    for f in fr:
        p = Image.new('P', f.size, 0)
        canvas = f.convert('RGBA')
        q = canvas.convert('RGB').quantize(colors=15, method=Image.Quantize.FASTOCTREE)
        qp = q.getpalette()[:45]
        out = Image.new('P', f.size, 15)
        out.putpalette(qp + [0] * (45 - len(qp)) + [255, 0, 255] + [0] * (768 - 48))
        a = canvas.getchannel('A').load(); qa = q.load(); o = out.load()
        for y in range(f.height):
            for x in range(f.width):
                o[x, y] = qa[x, y] if a[x, y] > 0 else 15
        conv.append(out)
    conv[0].save(path, save_all=True, append_images=conv[1:], duration=int(1000 / fps), loop=0, transparency=15, disposal=2)
G = os.path.join(site, 'assets', 'gud')
ANIMS = {'idle': (['side-idle-0', 'side-idle-1'], 2), 'run': (['side-run-%d' % i for i in range(4)], 12), 'shoot': (['side-shoot-%d' % i for i in range(4)], 12),
         'duck': (['side-duck-0', 'side-duck-1'], 8), 'victory': (['side-victory-0', 'side-victory-1'], 4), 'beach': (['side-beach-0', 'side-beach-1'], 2),
         'front-walk': (['walk-down-0', 'walk-down-1', 'walk-down-0', 'walk-down-2'], 8), 'back-walk': (['walk-up-0', 'walk-up-1', 'walk-up-0', 'walk-up-2'], 8),
         'left-walk': (['walk-left-0', 'walk-left-1', 'walk-left-0', 'walk-left-2'], 8), 'battle-back': (['battle-back-0', 'battle-back-1'], 2)}
STATIC = ['side-jump-0', 'side-jumpshoot-0', 'side-hurt-0', 'side-collect-0', 'side-defeat-0', 'side-beachjump-0']
gud_names = [k[4:] for k in data if k.startswith('gud/')]
for n in gud_names:
    im = img('gud/' + n)
    for s in (1, 4, 8): up(im, s).save(mk(os.path.join(G, 'png', '%s@%dx.png' % (n, s))))
    open(mk(os.path.join(G, 'svg', n + '.svg')), 'w').write(svg(im))
for a, (fr, fps) in ANIMS.items():
    ims = [img('gud/' + f) for f in fr]; w, h = ims[0].size
    for s in (1, 2, 4):
        sheet = Image.new('RGBA', (w * len(ims) * s, h * s), (0, 0, 0, 0))
        for i, im in enumerate(ims): sheet.paste(up(im, s), (i * w * s, 0))
        sheet.save(mk(os.path.join(G, 'sheets', 'gud-%s@%dx.png' % (a, s))))
    json.dump({'image': 'gud-%s@1x.png' % a, 'frameWidth': w, 'frameHeight': h, 'fps': fps, 'loop': True,
               'frames': [{'x': i * w, 'y': 0, 'w': w, 'h': h, 'source': f} for i, f in enumerate(fr)],
               'note': 'Multiply x/y/w/h by the scale of the @2x / @4x sheets.'}, open(os.path.join(G, 'sheets', 'gud-%s.json' % a), 'w'), indent=1)
    gif(ims, mk(os.path.join(G, 'gif', 'gud-%s.gif' % a)), fps)
# favicon + og image
idle = img('gud/side-idle-0'); up(idle.crop((6, 1, 28, 23)), 3).resize((64, 64), Image.NEAREST).save(os.path.join(G, 'favicon.png'))
og = Image.new('RGB', (1200, 630), PAL[1][1]); d = ImageDraw.Draw(og)
for y in range(0, 630, 12): d.rectangle([0, y, 1200, y + 3], fill=PAL[2][1])
f1 = ImageFont.truetype(font_path, 60); f2 = ImageFont.truetype(font_path, 26)
for txt, y, f, col in [('THE AMAZING', 70, f1, PAL[0][1]), ('WORLD OF GUD', 150, f1, PAL[0][1]), ('TOO MANY BEAUTIFUL THINGS TO DO', 250, f2, PAL[5][1]), ('TO WORRY ABOUT A PORTFOLIO.', 290, f2, PAL[5][1])]:
    d.text((60, y), txt, font=f, fill=col, stroke_width=6, stroke_fill=PAL[4][1])
og.paste(up(img('gud/side-run-0'), 9), (760, 300), up(img('gud/side-run-0'), 9))
k = up(img('mons/kernix'), 5); og.paste(k, (980, 400), k)
og.save(os.path.join(G, 'og-image.png'))
# icons
I = os.path.join(site, 'assets', 'icons')
for key in data:
    if key.startswith('gud/'): continue
    im = img(key); cat, n = key.split('/')
    for s in (1, 2, 4): up(im, s).save(mk(os.path.join(I, cat, '%s@%dx.png' % (n, s))))
    open(mk(os.path.join(I, cat, n + '.svg')), 'w').write(svg(im))
UI = {
 'cv': 'M1 0h5v1h1v1h1v7H1zM2 1v7h5V3H5V1zM3 4h3v1H3zM3 6h3v1H3z', 'tricks': 'M3 0h3v1h1v1h1v2H7v1H6v1H4V4h1V3h1V2H5V1H4v1H3v1H1V2h1V1h1zM4 7h2v2H4z',
 'hack': 'M0 1h9v7H0zM1 2v5h7V2zM2 3h1v1h1v1H3v1H2V5h1V4H2zM5 6h2v1H5z', 'sound': 'M1 3h2l2-2h1v7H5L3 6H1zM7 2h1v5H7z', 'mute': 'M1 3h2l2-2h1v7H5L3 6H1z',
 'arrow-left': 'M2 4h1V3h1V2h1V1h1v7H5V7H4V6H3V5H2z', 'arrow-right': 'M7 4H6V3H5V2H4V1H3v7h1V7h1V6h1V5h1z', 'arrow-up': 'M4 2h1v1h1v1h1v1h1v1H1V5h1V4h1V3h1z',
 'arrow-down': 'M4 7h1V6h1V5h1V4h1V3H1v1h1v1h1v1h1z', 'close': 'M1 1h2v1h1v1h1V2h1V1h2v2H7v1H6v1h1v1h1v2H6V7H5V6H4v1H3v1H1V6h1V5h1V4H2V3H1z',
 'heart': 'M1 1h2v1h1V1h1v1h1V1h2v1h1v3H8v1H7v1H6v1H3V7H2V6H1V5H0V2h1z', 'star': 'M4 0h1v3h3v1H5v1h1v1h1v2H6V7H5V6H4v1H3v1H2V6h1V5h1V4H1V3h3z',
 'play': 'M2 1h1v1h1v1h1v1h1v1H5v1H4v1H3v1H2z', 'download': 'M4 0h1v5h1V4h1v1H6v1H5v1H4V6H3V5H2V4h1v1h1zM1 7h7v1H1z', 'link': 'M1 3h3v1H2v2h2v1H1zM5 3h3v4H5V6h2V4H5zM3 5h3v-1H3z',
 'image': 'M0 1h9v7H0zM1 2v5h7V2zM2 6h1V5h1V4h1v1h1v1h1v1H2zM6 3h1v1H6z', 'video': 'M0 1h9v7H0zM1 2v5h7V2zM3 3h1v1h1v1H4v1H3z', 'globe': 'M3 0h3v1h1v1h1v5H7v1H6v1H3V8H2V7H1V2h1V1h1zM3 1v1H2v5h1v1h3V7h1V2H6V1z',
}
for n, d_ in UI.items():
    s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9" width="72" height="72" shape-rendering="crispEdges"><path fill="#111111" d="%s"/></svg>' % d_
    open(mk(os.path.join(I, 'ui', n + '.svg')), 'w').write(s)
# palette
B = os.path.join(site, 'brand'); os.makedirs(B, exist_ok=True)
json.dump({'name': 'GUD Girlpop Palette', 'colors': [{'name': n, 'hex': h, 'rgb': [int(h[i:i + 2], 16) for i in (1, 3, 5)]} for n, h in PAL]}, open(os.path.join(B, 'palette.json'), 'w'), indent=1)
open(os.path.join(B, 'palette.css'), 'w').write(':root{\n' + ''.join('  --gud-%s:%s;\n' % (n.lower().replace(' ', '-'), h) for n, h in PAL) + '}\n')
open(os.path.join(B, 'palette.gpl'), 'w').write('GIMP Palette\nName: GUD Girlpop\nColumns: 6\n#\n' + ''.join('%3d %3d %3d\t%s\n' % (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16), n) for n, h in PAL))
blocks = b''
for n, h in PAL:
    name = (n + '\0').encode('utf-16-be'); body = struct.pack('>H', len(n) + 1) + name + b'RGB ' + struct.pack('>fff', *[int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]) + struct.pack('>H', 0)
    blocks += struct.pack('>HI', 1, len(body)) + body
open(os.path.join(B, 'palette.ase'), 'wb').write(b'ASEF' + struct.pack('>HHI', 1, 0, len(PAL)) + blocks)
sw = Image.new('RGB', (6 * 200, 260), '#FFF9F1'); d = ImageDraw.Draw(sw); f = ImageFont.truetype(font_path, 16)
for i, (n, h) in enumerate(PAL):
    d.rectangle([i * 200 + 10, 10, i * 200 + 190, 190], fill=h, outline='#111111', width=4)
    d.text((i * 200 + 12, 205), n.upper(), font=f, fill='#111111'); d.text((i * 200 + 12, 230), h, font=f, fill='#FF1493')
sw.save(os.path.join(B, 'palette-swatches.png'))
print('assets ok')
