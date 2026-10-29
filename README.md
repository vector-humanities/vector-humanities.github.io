# vector-humanities.github.io

Landing page for [Vector Humanities](https://github.com/vector-humanities), served by GitHub Pages at <https://vector-humanities.github.io>.

Static HTML, CSS and JavaScript with no build step. `index.html` is the page; `assets/intarsia.js` builds the hero, an intarsia scene with the rhombicuboctahedron turning on its thread; `assets/style.css` holds the light and dark themes. `brand/` holds the mark, favicon, avatar, banner and social card, with the Python generators in `brand/src/`. To preview locally:

```bash
python3 -m http.server 8842
```

## Licence

The site's text and images are licensed under [CC BY 4.0](LICENSE), except third-party images, which keep their own licences as recorded in the HTML comment beside each one. The code (`assets/intarsia.js` and the generators in `brand/src/`) is licensed under the [GNU GPL, version 3 or later](COPYING).

## Citation

Citation metadata is in [`CITATION.cff`](CITATION.cff). Each release is archived on Zenodo with its own DOI.
