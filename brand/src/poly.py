"""Vector Humanities mark: the rhombicuboctahedron from Pacioli's De divina proportione, as a wireframe.

Two poses. 'stand': resting on a square face, turned 23 degrees and seen 21 degrees from above, the
three-quarter view people find easiest to read (and the way Leonardo drew the solids for Pacioli).
'hang': hung from a vertex on a thread, for the intarsia scenes.

Visible edges (those bordering a face turned to the eye) are drawn bold; hidden edges thin and pale.
Levels: 'full' draws both, 'front' and 'icon' draw only the visible edges, heavier for small sizes.
"""
import math, itertools

A = 1 + math.sqrt(2)
DIST = 11.0
AZ, EL = math.radians(23), math.radians(21)       # stand pose
SPIN, TILT = 2.051, 0.05                          # hang pose: suspension vertex highest, no face near edge-on

def rhombi():
    vs = set()
    for base in [(1, 1, A), (1, A, 1), (A, 1, 1)]:
        for sx, sy, sz in itertools.product((1, -1), repeat=3):
            vs.add((base[0] * sx, base[1] * sy, base[2] * sz))
    vs = sorted(vs)
    edges = [(i, j) for i in range(len(vs)) for j in range(i + 1, len(vs))
             if abs(math.dist(vs[i], vs[j]) - 2) < 1e-6]
    return vs, edges

def face_normals():
    ns = []
    for i in range(3):
        for sg in (1, -1):
            n = [0.0, 0.0, 0.0]; n[i] = sg; ns.append(tuple(n))
    for i, j in ((0, 1), (0, 2), (1, 2)):
        for a, b in itertools.product((1, -1), repeat=2):
            n = [0.0, 0.0, 0.0]; n[i] = a; n[j] = b; ns.append(tuple(n))
    ns += list(itertools.product((1, -1), repeat=3))
    return ns

def faces(vs):
    """(normal, vertex indices) for each of the 26 faces."""
    out = []
    for n in face_normals():
        d = [sum(n[k] * v[k] for k in range(3)) for v in vs]
        m = max(d)
        out.append((n, [q for q in range(len(vs)) if abs(d[q] - m) < 1e-6]))
    return out

def rot(p, ax, ay, az):
    x, y, z = p
    y, z = y * math.cos(ax) - z * math.sin(ax), y * math.sin(ax) + z * math.cos(ax)
    x, z = x * math.cos(ay) + z * math.sin(ay), -x * math.sin(ay) + z * math.cos(ay)
    x, y = x * math.cos(az) - y * math.sin(az), x * math.sin(az) + y * math.cos(az)
    return (x, y, z)

def _hang(v, top=(1.0, 1.0, A)):
    """Rotate so the suspension vertex points straight up: a hung solid has its centre below it."""
    n = math.sqrt(sum(t * t for t in top)); a = [t / n for t in top]
    b = (0.0, 1.0, 0.0)
    ax = (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
    s_ = math.sqrt(sum(t * t for t in ax)); c_ = sum(a[i] * b[i] for i in range(3))
    k = [t / s_ for t in ax]
    dot = sum(k[i] * v[i] for i in range(3))
    cr = (k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0])
    return tuple(v[i] * c_ + cr[i] * s_ + k[i] * dot * (1 - c_) for i in range(3))

def geometry(pose='stand', box=(8.0, 8.0, 92.0, 92.0), spin=None, tilt=None):
    """Projected vertices fitted to box. Returns R (3D), P (2D), edges, suspension vertex, visible flags."""
    vs, edges = rhombi()
    if pose == 'hang':
        sp = SPIN if spin is None else spin; tl = TILT if tilt is None else tilt
        turn = lambda v: rot(rot(_hang(v), 0.0, sp, 0.0), tl, 0.0, 0.0)
    else:
        az = AZ if spin is None else spin; el = EL if tilt is None else tilt
        turn = lambda v: rot(rot(v, 0.0, az, 0.0), el, 0.0, 0.0)
    R = [turn(v) for v in vs]
    # an edge is visible when either of its faces turns towards the eye at z = -DIST
    seen = set()
    for n, fv in faces(vs):
        nr = turn(n)
        c = [sum(R[q][k] for q in fv) / len(fv) for k in range(3)]
        if nr[0] * c[0] + nr[1] * c[1] + nr[2] * (c[2] + DIST) < 0:
            for e in edges:
                if e[0] in fv and e[1] in fv:
                    seen.add(e)
    vis = [(e in seen) for e in edges]
    P = [(v[0] * DIST / (DIST + v[2]), -v[1] * DIST / (DIST + v[2])) for v in R]
    top = max(range(len(vs)), key=lambda i: _hang(vs[i])[1])
    xs = [p[0] for p in P]; ys = [p[1] for p in P]
    x0, y0, x1, y1 = box
    sc = min((x1 - x0) / (max(xs) - min(xs)), (y1 - y0) / (max(ys) - min(ys)))
    if pose == 'hang':
        ox = (x0 + x1) / 2 - P[top][0] * sc            # thread on the axis through the centre of the box
    else:
        ox = (x0 + x1) / 2 - (min(xs) + max(xs)) / 2 * sc
    oy = (y0 + y1) / 2 - (min(ys) + max(ys)) / 2 * sc
    P = [(x * sc + ox, y * sc + oy) for x, y in P]
    return R, P, edges, top, vis

def mix(a, b, t):
    """Colour t of the way from a to b; CSS color-mix when either is a variable."""
    if a.startswith('#') and b.startswith('#'):
        ca = [int(a[i:i + 2], 16) for i in (1, 3, 5)]; cb = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
        return '#' + ''.join(f'{round(x + (y - x) * t):02x}' for x, y in zip(ca, cb))
    return f'color-mix(in srgb, {a} {round((1 - t) * 100)}%, {b})'

PALETTES = {
    'paper':    dict(bg='#f6f2e9', beam='#1a1aff', thread='#141518', accent='#ff4a24'),
    'electric': dict(bg='#1a1aff', beam='#ffffff', thread='#ffffff', accent='#ff6a45'),
    'night':    dict(bg='#0c0e1c', beam='#8a90ff', thread='#c9c7d6', accent='#ff6a45'),
    'ink':      dict(bg='#141518', beam='#f6f2e9', thread='#f6f2e9', accent='#ff4a24'),
    'wood':     dict(bg='#e7c48e', beam='#1a1aff', thread='#3b2412', accent='#ff4a24'),
}

def level_for(px):
    return 'full' if px >= 80 else 'front' if px >= 28 else 'icon'

def body(c, level='full', px=400, box=None, weight=1.0, pose='stand', hang=False, thread_top=0.0):
    """SVG elements for the mark in a 100x100 box (or the given box)."""
    u = 100.0 / px
    R, P, edges, top, vis = geometry(pose, box or (8.0, 8.0, 92.0, 92.0))
    out = []
    if hang:
        out.append(f'<path d="M{P[top][0]:.2f},{P[top][1]:.2f} V{thread_top}" stroke="{c["thread"]}" stroke-width="{max(0.5, 0.9 * u):.2f}"/>')
    order = sorted(range(len(edges)), key=lambda n: -(R[edges[n][0]][2] + R[edges[n][1]][2]))
    back_col = mix(c['beam'], c['bg'], 0.55)
    if level == 'full':
        wf, wb = 1.0 * weight, 0.45 * weight
    elif level == 'front':
        wf, wb = max(2.6, 1.6 * u), None
    else:
        wf, wb = max(4.8, 1.9 * u), None
    for n in order:
        i, j = edges[n]
        seg = f'M{P[i][0]:.2f},{P[i][1]:.2f} L{P[j][0]:.2f},{P[j][1]:.2f}'
        if vis[n]:
            out.append(f'<path d="{seg}" style="stroke:{c["beam"]}" stroke-width="{wf:.2f}" stroke-linecap="round"/>')
        elif wb:
            out.append(f'<path d="{seg}" style="stroke:{back_col}" stroke-width="{wb:.2f}" stroke-linecap="round"/>')
    if hang:
        out.append(f'<circle cx="{P[top][0]:.2f}" cy="{P[top][1]:.2f}" r="{max(1.9, 1.3 * u):.2f}" fill="{c["accent"]}"/>')
    return ''.join(out)

def mark_svg(c, px=400, level=None, bg=True):
    level = level or level_for(px)
    rect = f'<rect width="100" height="100" fill="{c["bg"]}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{px}" height="{px}">'
            f'{rect}{body(c, level, px)}</svg>')

if __name__ == '__main__':
    import sys
    S = sys.argv[1]
    cells = []
    for name in ('paper', 'electric', 'night'):
        c = PALETTES[name]
        cells.append(f'<div class="c"><div class="t">{name}</div>{mark_svg(c, 340)}'
                     f'<div class="sm">' + ''.join(mark_svg(c, s) for s in (128, 64, 48, 32, 24, 16)) + '</div></div>')
    html = ('<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:18px;background:#d8d4ca}'
            '.g{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.c{background:#fff;border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:12px;align-items:center}'
            '.t{align-self:flex-start;font:12px Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:#555}'
            '.sm{display:flex;gap:12px;align-items:flex-end}</style><div class="g">' + ''.join(cells) + '</div>')
    open(f'{S}/poly-sheet.html', 'w').write(html)
    print('ok')
