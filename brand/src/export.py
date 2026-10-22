"""Export the Vector Humanities identity: marks, favicon, avatar, header and page marks."""
import sys
S, SITE, BR = sys.argv[1:4]
sys.path.insert(0, S)
import poly as p
P = p.PALETTES
def write(path, txt):
    open(path, 'w').write(txt)
for name in ('paper', 'night', 'electric', 'mono'):
    for lv in ('full', 'front', 'icon'):
        write(f'{BR}/mark-{lv}-{name}.svg', p.mark_svg(P[name], 400, lv, bg=True))
icon = p.body(P['paper'], 'icon', 32)
fav = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><style>'
       '.b{stroke:#1a1aff}.t{stroke:#141518}@media (prefers-color-scheme: dark){.b{stroke:#8a90ff}.t{stroke:#e8e6f0}}</style>'
       + icon.replace('style="stroke:#1a1aff"', 'class="b"') + '</svg>')
write(f'{SITE}/favicon.svg', fav); write(f'{BR}/favicon.svg', fav)
css = dict(bg='var(--bg)', beam='var(--blue)', thread='var(--ink)', accent='var(--red)')
write(f'{S}/header-mark.txt', p.body(css, 'front', 36))
write(f'{S}/full-mark.txt', p.body(css, 'full', 320))
av = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="1024" height="1024">'
      f'<rect width="100" height="100" fill="{P["paper"]["bg"]}"/>'
      + p.body(P['paper'], 'full', 1024, box=(14.0, 14.0, 86.0, 86.0), weight=1.4) + '</svg>')
write(f'{BR}/avatar.svg', av)
# black on white, for book imprint pages: the avatar's drawing in the mono palette
mono = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="1024" height="1024">'
        f'<rect width="100" height="100" fill="{P["mono"]["bg"]}"/>'
        + p.body(P['mono'], 'full', 1024, box=(14.0, 14.0, 86.0, 86.0), weight=1.4) + '</svg>')
write(f'{BR}/mark-mono.svg', mono)
print('ok')
