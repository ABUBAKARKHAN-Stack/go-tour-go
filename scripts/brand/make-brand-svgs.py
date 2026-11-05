"""
Builds the GoTourGo brand SVGs (logo concept 3: location pin with Karakoram
peaks and a sun) into assets/brand/. PNGs are rendered from these by
scripts/brand/render-brand-pngs.cjs.

    python3 scripts/brand/make-brand-svgs.py && node scripts/brand/render-brand-pngs.cjs

The symbol is drawn in its own coordinates: the pin's round head is centred on
(0, 0) with radius 230 and the tip is at (0, 420). Its bounding box is
x -230..230, y -230..~414, with its visual centre at (0, 92).
"""

import os
import sys

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'brand')

TEAL = '#0F4C4A'
CREAM = '#FBF8F3'
TERRACOTTA = '#C8643B'

# Pin: head circle r=230 at the origin, straight sides tangent to it, slightly rounded tip.
PIN = 'M -15.3 396.6 L -192.5 125.9 A 230 230 0 1 1 192.5 125.9 L 15.3 396.6 Q 0 420 -15.3 396.6 Z'
# Two peaks with a flat base, kept well inside the head so they survive at 48 px.
PEAKS = 'M -150 90 L -60 -15 L -15 35 L 65 -115 L 155 90 Z'
SUN = (-75, -100, 36)
CENTRE_Y = 92  # visual centre of the symbol's bounding box


def symbol(uid: str, mono: str | None = None) -> str:
    """The symbol's SVG elements. With `mono`, one colour with the peaks and sun cut out."""
    sx, sy, sr = SUN
    if mono:
        return f'''<defs>
    <mask id="m{uid}" maskUnits="userSpaceOnUse" x="-300" y="-300" width="600" height="800">
      <path d="{PIN}" fill="#fff"/>
      <path d="{PEAKS}" fill="#000"/>
      <circle cx="{sx}" cy="{sy}" r="{sr}" fill="#000"/>
    </mask>
  </defs>
  <path d="{PIN}" fill="{mono}" mask="url(#m{uid})"/>'''
    return f'''<path d="{PIN}" fill="{TEAL}"/>
  <path d="{PEAKS}" fill="{CREAM}"/>
  <circle cx="{sx}" cy="{sy}" r="{sr}" fill="{TERRACOTTA}"/>'''


def placed(uid: str, cx: float, cy: float, scale: float, mono: str | None = None) -> str:
    """The symbol scaled and centred (by its bounding box) on (cx, cy)."""
    return f'<g transform="translate({cx} {cy - CENTRE_Y * scale}) scale({scale})">\n  {symbol(uid, mono)}\n</g>'


def svg(w: int, h: int, body: str, background: str | None = None) -> str:
    bg = f'<rect width="{w}" height="{h}" fill="{background}"/>\n' if background else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">\n{bg}{body}\n</svg>\n'


def pair_kerning(font: TTFont) -> dict[tuple[str, str], int]:
    """Pair adjustments (x advance) from the font's GPOS 'kern' feature."""
    kerns: dict[tuple[str, str], int] = {}
    gpos = font['GPOS'].table
    lookups = {i for fr in gpos.FeatureList.FeatureRecord if fr.FeatureTag == 'kern' for i in fr.Feature.LookupListIndex}
    for i in lookups:
        lookup = gpos.LookupList.Lookup[i]
        for st in lookup.SubTable:
            if lookup.LookupType == 9:
                st = st.ExtSubTable
            if getattr(st, 'LookupType', 2) != 2 and lookup.LookupType != 9:
                continue
            if st.Format == 1:
                for first, pset in zip(st.Coverage.glyphs, st.PairSet):
                    for rec in pset.PairValueRecord:
                        v = getattr(rec.Value1, 'XAdvance', 0) if rec.Value1 else 0
                        kerns.setdefault((first, rec.SecondGlyph), v)
            elif st.Format == 2:
                c1 = st.ClassDef1.classDefs
                c2 = st.ClassDef2.classDefs
                for first in st.Coverage.glyphs:
                    row = st.Class1Record[c1.get(first, 0)]
                    for second, k2 in c2.items():
                        rec = row.Class2Record[k2]
                        v = getattr(rec.Value1, 'XAdvance', 0) if rec.Value1 else 0
                        if v:
                            kerns.setdefault((first, second), v)
    return kerns


def text_path(text: str, font_file: str, size: float, x: float, baseline: float) -> tuple[str, float]:
    """Outlines `text` as one SVG path (no font needed to display it), with kerning. Returns (d, advance width)."""
    font = TTFont(font_file)
    kerns = pair_kerning(font)
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    scale = size / font['head'].unitsPerEm
    pen = SVGPathPen(glyphs)
    cursor = 0.0
    previous = None
    for ch in text:
        name = cmap[ord(ch)]
        if previous:
            cursor += kerns.get((previous, name), 0)
        glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x + cursor * scale, baseline)))
        cursor += font['hmtx'][name][0]
        previous = name
    return pen.getCommands(), cursor * scale


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    fraunces = os.path.join(ROOT, 'node_modules/@expo-google-fonts/fraunces/600SemiBold/Fraunces_600SemiBold.ttf')
    if not os.path.exists(fraunces):
        sys.exit('Run bun install first (Fraunces font not found).')

    files = {
        # The symbol alone on transparent, for in-app use.
        'logo-symbol.svg': svg(512, 700, placed('a', 256, 350, 1.0)),
        # Legacy / store icon: cream square, symbol inside the middle 66%.
        'icon.svg': svg(1024, 1024, placed('b', 512, 512, 1.0), CREAM),
        # Adaptive icon foreground: transparent, symbol inside the 66 dp safe circle (radius ~313 of 1024).
        'adaptive-foreground.svg': svg(1024, 1024, placed('c', 512, 512, 0.86)),
        'adaptive-background.svg': svg(1024, 1024, '', CREAM),
        # Themed (monochrome) icon: one opaque colour; Android tints it.
        'monochrome.svg': svg(1024, 1024, placed('d', 512, 512, 0.86, mono='#000000')),
        # Splash: symbol only on transparent; the splash background colour is set in app.json.
        'splash-icon.svg': svg(1024, 1024, placed('e', 512, 512, 1.35)),
    }

    # Wordmark lockups in Fraunces SemiBold (the app's display face), outlined.
    d, width = text_path('GoTourGo', fraunces, 220, 0, 0)
    sym_h = 644 * 0.5
    gap = 56
    pad = 48
    w = int(pad + 460 * 0.5 + gap + width + pad)
    h = int(sym_h + pad * 2)
    text_x = pad + 460 * 0.5 + gap
    baseline = h / 2 + 220 * 0.36  # cap height of Fraunces is ~0.7 em; centre caps on the symbol
    files['wordmark-horizontal.svg'] = svg(
        w,
        h,
        placed('f', pad + 115, h / 2, 0.5) + f'\n<path transform="translate({text_x} {baseline})" d="{d}" fill="{TEAL}"/>',
    )

    sym_s = 0.75
    sw = int(max(width, 460 * sym_s) + pad * 2)
    sh = int(pad + 644 * sym_s + 60 + 160 + pad)
    stacked_text, stacked_w = text_path('GoTourGo', fraunces, 200, 0, 0)
    files['wordmark-stacked.svg'] = svg(
        sw,
        sh,
        placed('g', sw / 2, pad + 644 * sym_s / 2, sym_s)
        + f'\n<path transform="translate({(sw - stacked_w) / 2} {pad + 644 * sym_s + 60 + 140})" d="{stacked_text}" fill="{TEAL}"/>',
    )

    for name, content in files.items():
        with open(os.path.join(OUT, name), 'w') as f:
            f.write(content)
        print('wrote', os.path.join('assets/brand', name))


if __name__ == '__main__':
    main()
