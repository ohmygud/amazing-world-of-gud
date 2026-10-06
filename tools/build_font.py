"""Build the GUD Pixel font (TTF, OTF, WOFF, WOFF2) from the 5x7 bitmap glyphs used in the games."""
import re, sys, os
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.ttLib import TTFont
import pathops

src = open(sys.argv[1], encoding='utf8').read()
out = sys.argv[2]
glyphs = {}
for a, b, rows in re.findall(r"\[(?:'(\\u[0-9A-F]{4}|\\'|.)'|\"(.)\"), '([01,]+)'\]", src):
    ch = a or b
    if ch.startswith('\\u'): ch = chr(int(ch[2:], 16))
    elif ch == "\\'": ch = "'"
    glyphs[ch] = [int(r, 2) for r in rows.split(',')]
glyphs['·'] = [0, 0, 0, 0b00100, 0, 0, 0]
glyphs['–'] = glyphs['-']; glyphs['—'] = [0, 0, 0, 0b11111, 0, 0, 0]
glyphs['’'] = glyphs["'"]; glyphs['‘'] = glyphs["'"]
glyphs['“'] = glyphs['"']; glyphs['”'] = glyphs['"']
glyphs['…'] = [0, 0, 0, 0, 0, 0, 0b10101]
glyphs['$'] = [0b00100, 0b01111, 0b10100, 0b01110, 0b00101, 0b11110, 0b00100]
glyphs[';'] = [0, 0b01100, 0b01100, 0, 0b01100, 0b00100, 0b01000]
glyphs['['] = [0b01110, 0b01000, 0b01000, 0b01000, 0b01000, 0b01000, 0b01110]
glyphs[']'] = [0b01110, 0b00010, 0b00010, 0b00010, 0b00010, 0b00010, 0b01110]
glyphs['|'] = [0b00100] * 7
glyphs['€'] = [0b00111, 0b01000, 0b11110, 0b01000, 0b11110, 0b01000, 0b00111]
PX = 100; ADV = 600
def glyph_name(ch):
    if ch == ' ': return 'space'
    if ch.isalnum() and ch.isascii(): return ch if not ch.isdigit() else 'digit' + ch
    return 'uni%04X' % ord(ch)
def path_for(rows):
    p = pathops.Path()
    for r, bits in enumerate(rows):
        for c in range(5):
            if bits & (16 >> c):
                x0, x1 = c * PX, (c + 1) * PX
                y1 = (7 - r) * PX; y0 = y1 - PX
                p.moveTo(x0, y0); p.lineTo(x0, y1); p.lineTo(x1, y1); p.lineTo(x1, y0); p.close()
    return pathops.simplify(p, clockwise=True)
order = ['.notdef'] + sorted({glyph_name(c) for c in glyphs})
cmap = {}
for ch in glyphs:
    cmap[ord(ch)] = glyph_name(ch)
    lo = ch.lower()
    if lo != ch and len(lo) == 1 and ord(lo) not in cmap: cmap[ord(lo)] = glyph_name(ch)
for acc, base in {'Á': 'À', 'Í': 'Ì', 'Ó': 'Ò', 'Ú': 'Ù'}.items():
    cmap[ord(acc)] = glyph_name(base); cmap[ord(acc.lower())] = glyph_name(base)
cmap[0xA0] = 'space'
paths = {glyph_name(c): path_for(r) for c, r in glyphs.items()}
def build(cff):
    fb = FontBuilder(1000, isTTF=not cff)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    if cff:
        cs = {}
        for name in order:
            pen = T2CharStringPen(ADV, None)
            if name in paths: paths[name].draw(pen)
            cs[name] = pen.getCharString()
        fb.setupCFF('GUDPixel-Regular', {'FullName': 'GUD Pixel Regular'}, cs, {})
    else:
        gl = {}
        for name in order:
            pen = TTGlyphPen(None)
            if name in paths: paths[name].draw(pen)
            gl[name] = pen.glyph()
        fb.setupGlyf(gl)
    def lsb(n):
        if n not in paths: return 0
        b = paths[n].bounds
        return int(b[0]) if b and b[2] > b[0] else 0
    fb.setupHorizontalMetrics({n: (ADV, lsb(n)) for n in order})
    fb.setupHorizontalHeader(ascent=900, descent=-200)
    fb.setupNameTable({'familyName': 'GUD Pixel', 'styleName': 'Regular', 'uniqueFontIdentifier': 'GUDPixel-Regular-1.0',
                       'fullName': 'GUD Pixel Regular', 'psName': 'GUDPixel-Regular', 'version': 'Version 1.000',
                       'copyright': '(c) 2026 GUD / Typodiva', 'designer': 'GUD (Giulia Ursenna Dorati Gherardi)',
                       'manufacturer': 'Typodiva', 'description': '5x7 pixel typeface of the Amazing World of GUD'})
    fb.setupOS2(sTypoAscender=900, sTypoDescender=-200, sTypoLineGap=100, usWinAscent=900, usWinDescent=200, sCapHeight=700, sxHeight=700, achVendID='TYPD', fsType=0)
    fb.setupPost(isFixedPitch=1)
    fb.setupHead(unitsPerEm=1000)
    return fb.font
os.makedirs(out, exist_ok=True)
build(False).save(os.path.join(out, 'GUDPixel-Regular.ttf'))
build(True).save(os.path.join(out, 'GUDPixel-Regular.otf'))
for flavor in ('woff', 'woff2'):
    f = TTFont(os.path.join(out, 'GUDPixel-Regular.ttf')); f.flavor = flavor; f.save(os.path.join(out, 'GUDPixel-Regular.' + flavor))
print('glyphs', len(order), 'codepoints', len(cmap))
