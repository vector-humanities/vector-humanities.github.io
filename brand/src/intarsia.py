"""Intarsia scene: maple wall, walnut and maple pavement in perspective, the polyhedron hung in front.

scene(w, h, ...) returns SVG markup in a w x h box. Grain comes from stretched turbulence,
laid crosswise in alternate tiles.
"""
import math, sys
S = sys.argv[1] if len(sys.argv) > 1 else '.'
sys.path.insert(0, S)
import poly

MAPLE, MAPLE_D, WALNUT, WALNUT_D, STRING = '#e9c891', '#d9ae6f', '#7a4a26', '#5e3519', '#3b2412'

def defs():
    return ('<filter id="grainH" x="0" y="0" width="100%" height="100%">'
            '<feTurbulence type="fractalNoise" baseFrequency="0.0018 0.16" numOctaves="4" seed="3"/>'
            '<feColorMatrix values="0 0 0 0 0.24  0 0 0 0 0.13  0 0 0 0 0.05  0 0 0 0.38 -0.10"/>'
            '<feComposite in2="SourceGraphic" operator="in"/></filter>'
            '<filter id="grainV" x="0" y="0" width="100%" height="100%">'
            '<feTurbulence type="fractalNoise" baseFrequency="0.16 0.0018" numOctaves="4" seed="8"/>'
            '<feColorMatrix values="0 0 0 0 0.24  0 0 0 0 0.13  0 0 0 0 0.05  0 0 0 0.38 -0.10"/>'
            '<feComposite in2="SourceGraphic" operator="in"/></filter>')

def pavement(w, h, hor, vx, tile, rows=90, extra=60):
    """The endless checkered floor below the horizon at y = hor. tile is a tile's width on the front edge."""
    dist = tile * 3.2
    base = h
    def ty(k):
        return hor + (base - hor) * dist / (dist + k * tile * 1.0)
    def xat(xb, y):
        return vx + (xb - vx) * (y - hor) / (base - hor)
    a, b = [], []
    n0 = int(-(vx / tile) - extra); n1 = int((w - vx) / tile + extra)
    for k in range(rows):
        ya, yb = ty(k + 1), ty(k)
        for i in range(n0, n1):
            xa0 = vx + i * tile; xa1 = xa0 + tile
            poly_ = [(xat(xa0, ya), ya), (xat(xa1, ya), ya), (xat(xa1, yb), yb), (xat(xa0, yb), yb)]
            pts = ' '.join(f'{x:.1f},{y:.1f}' for x, y in poly_)
            (a if (i + k) % 2 == 0 else b).append(f'<polygon points="{pts}"/>')
    base_fill = f'<rect y="{hor:.1f}" width="{w}" height="{h - hor:.1f}" fill="#b2895c"/>'
    return (base_fill + f'<g fill="{WALNUT}">{"".join(a)}</g><g fill="{WALNUT}" filter="url(#grainV)" opacity=".9">{"".join(a)}</g>'
            f'<g fill="{MAPLE}">{"".join(b)}</g><g fill="{MAPLE}" filter="url(#grainH)" opacity=".9">{"".join(b)}</g>'), hor + (h - hor) * shadow_at

shadow_at = 0.55

def wall(w, hor):
    return (f'<rect width="{w}" height="{hor}" fill="{MAPLE}"/>'
            f'<rect width="{w}" height="{hor}" fill="{MAPLE}" filter="url(#grainH)" opacity=".45"/>')

def hung_polyhedron(cx, top_y, size, palette, thread_from=0):
    """The solid as a wireframe, standing in its three-quarter view, in a size x size box whose top edge is top_y."""
    x0, y0 = cx - size / 2, top_y
    R, P, edges, top, vis = poly.geometry('stand', (x0 + size * 0.08, y0 + size * 0.10, x0 + size * 0.92, y0 + size * 0.95))
    u = size / 100.0
    c = palette
    out = []
    back = poly.mix(c['beam'], MAPLE, 0.55)
    for n in sorted(range(len(edges)), key=lambda n: -(R[edges[n][0]][2] + R[edges[n][1]][2])):
        i, j = edges[n]
        seg = f'M{P[i][0]:.1f},{P[i][1]:.1f} L{P[j][0]:.1f},{P[j][1]:.1f}'
        if vis[n]:
            out.append(f'<path d="{seg}" stroke="{c["beam"]}" stroke-width="{0.85 * u:.2f}" stroke-linecap="round"/>')
        else:
            out.append(f'<path d="{seg}" stroke="{back}" stroke-width="{0.45 * u:.2f}" stroke-linecap="round"/>')
    return ''.join(out), P

WOOD_MARK = dict(beam='#1a1aff', hole='#f6f2e9', thread=STRING, accent='#ff4a24')

def scene(w, h, hor_frac=0.62, vx_frac=0.72, poly_frac=(0.72, 0.10, 0.62), tile_frac=0.11, shadow=True, shadow_frac=0.55, solid=True):
    hor = h * hor_frac
    vx = w * vx_frac
    px, py, ps = w * poly_frac[0], h * poly_frac[1], h * poly_frac[2]
    pm, P = hung_polyhedron(px, py, ps, WOOD_MARK) if solid else ('', [])
    floor, shadow_y = pavement(w, h, hor, vx, w * tile_frac)
    ys = [p[1] for p in P]
    sh = ''
    if shadow and solid:
        # a soft shadow on the floor under the hung solid
        sy = shadow_y
        sh = (f'<ellipse cx="{px:.1f}" cy="{sy:.1f}" rx="{ps * 0.34:.1f}" ry="{ps * 0.05:.1f}" fill="{STRING}" opacity=".45" filter="url(#soft)"/>')
    d = defs() + '<filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>'
    return (f'<defs>{d}</defs>{wall(w, hor)}<g>{floor}</g>{sh}'
            f'{pm}')

if __name__ == '__main__':
    W, H = 1280, 360
    banner = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
              + scene(W, H, hor_frac=0.76, vx_frac=0.79, poly_frac=(0.79, 0.04, 0.64), tile_frac=0.07, shadow_frac=0.55, solid=False) + '</svg>')
    html = ('<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Source+Serif+4:ital,opsz@1,8..60&family=IBM+Plex+Mono&display=swap">'
            '<style>body{margin:0}.b{position:relative;width:1280px;height:360px;overflow:hidden}'
            '.t{position:absolute;left:72px;top:44px;color:#141518}'
            '.k{font:12px "IBM Plex Mono",monospace;letter-spacing:.22em;color:#5e3519;margin-bottom:14px}'
            '.w{font:600 62px/1 "Cormorant Garamond",serif;letter-spacing:.14em}'
            '.s{font:italic 22px "Source Serif 4",serif;color:#3b2412;margin-top:14px}</style>'
            f'<div class="b">{banner}<div class="t"><div class="k">GITHUB.COM/VECTOR-HUMANITIES</div>'
            '<div class="w">VECTOR<br>HUMANITIES</div><div class="s">Humanities research in the vector medium</div></div></div>')
    open(f'{S}/banner.html', 'w').write(html)
    W2, H2 = 1200, 630
    card = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W2} {H2}" width="{W2}" height="{H2}">'
            + scene(W2, H2, hor_frac=0.74, vx_frac=0.73, poly_frac=(0.73, 0.04, 0.62), tile_frac=0.085, shadow_frac=0.5) + '</svg>')
    html2 = html.replace('width:1280px;height:360px', 'width:1200px;height:630px').replace(banner, card)
    html2 = html2.replace('.t{position:absolute;left:72px;top:44px;', '.t{position:absolute;left:64px;top:120px;')
    html2 = html2.replace('font:600 62px/1', 'font:600 70px/1')
    open(f'{S}/card.html', 'w').write(html2)
    print('ok')
