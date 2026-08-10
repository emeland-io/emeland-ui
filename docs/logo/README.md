# Logo

The EmELand mark: two filled peaks, derived from the original line-art favicon.

The original drew outlined peaks with snowcaps over a second row of hills. That
reads at 192px and turns to mush at 16px, where a favicon actually lives — the
strokes collide and the silhouette is lost. This version keeps the layered-peak
idea but carries it in solid shapes with a single notch, and replaces the second
outline with a tonal back peak, so the mark survives every size it is used at.

| File                             | Use                                                        |
| -------------------------------- | ---------------------------------------------------------- |
| `emeland-mark.svg`               | Anything scalable. Follows the viewer's light/dark scheme. |
| `emeland-mark-1024-on-dark.png`  | Fixed light mark, for placing on dark backgrounds.         |
| `emeland-mark-1024-on-light.png` | Fixed dark mark, for placing on light backgrounds.         |

The same geometry lives in two more places, and all of them must be kept in
sync when the shape changes:

- `src/components/BrandMark.vue` — the in-app mark (topbar). Uses
  `currentColor`, so it themes with the text around it.
- `public/favicon.svg` — the browser tab, and the source artwork for every
  other file in `public/`.

## Regenerating the favicons

The tab icons are the mark on an opaque `#12151a` tile — a bare mark would be
invisible on one tab-bar colour or the other, and iOS/Android mask theirs into
a square anyway. Everything is rendered from `public/favicon.svg`:

```sh
for s in 16 32 48 180 192 512; do
  sips -s format png --resampleHeightWidth $s $s public/favicon.svg --out /tmp/icon-$s.png
done
# then: 16 -> favicon-16x16.png, 32 -> favicon-32x32.png, 180 -> apple-touch-icon.png,
#       192/512 -> android-chrome-*.png, and 16+32+48 packed into favicon.ico
```

`favicon.ico` is a PNG-embedded ICO holding 16/32/48 (every browser since IE11
reads that form). There is no ImageMagick in this repo's toolchain, so it is
packed by hand — an ICONDIR header, one 16-byte ICONDIRENTRY per size, then the
PNG bytes.
