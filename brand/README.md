# Vector Humanities brand kit

The mark is the rhombicuboctahedron from Luca Pacioli's *De divina proportione* (1509), drawn by Leonardo, here as a wireframe: visible edges bold, hidden edges thin and pale. It stands on a square face, turned 23° and seen 21° from above (a canonical three-quarter view, with no face within 8° of edge-on). The social card and site hero set it hovering over an intarsia pavement in perspective (the README banner shows the pavement alone), after the inlaid-wood panels of Fra Giovanni da Verona. On the site it turns slowly, can be spun by dragging, and five faint white points travel along its edges; spun hard, the points are thrown off, fall and return.

| File | Use |
|:--|:--|
| `mark-full-*.svg` | 80 px and up: every edge, hidden edges thin and pale |
| `mark-front-*.svg` | 28 to 80 px: visible edges only (those bordering a face turned to the viewer) |
| `mark-icon-*.svg` | 16 to 28 px: visible edges only, heavier strokes |
| `favicon.svg` | icon level, follows the browser's light or dark scheme |
| `avatar-1024.png` | organisation avatar |
| `banner-2560x720.png` | README banner |
| `social-card-1200x630.png` | link previews |

Grounds: `paper` (#f6f2e9, beams #1a1aff), `night` (#0c0e1c, beams #8a90ff), `electric` (#1a1aff, beams white). Vermilion #ff4a24. Wood: maple #e9c891, walnut #7a4a26. Type: Cormorant Garamond 600 caps, tracked, for the wordmark; Source Serif 4 and IBM Plex Mono for text.

`src/` holds the generators: `poly.py` (the mark), `intarsia.py` (banner and card), `export.py` (writes the files above).
