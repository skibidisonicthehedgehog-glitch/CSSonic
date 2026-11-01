# CSSonic

A tiny sprite-font engine for web games. Turn any message into glitchy, pixel-perfect Genesis-era Sonic lettering,
with **per-letter font randomization**, auto-fit, balanced line wrapping and `:sonic:` / `:tails:` / `:knuckles:` / `:ring:` replacements.
No dependencies. About 8 KB of JS and 12 KB of CSS.

## Quick start

```html
<link rel="stylesheet" href="dist/sonic-text.css">
<script src="dist/sonic-text.js"></script>

<!-- declarative -->
<div style="width:640px;height:480px"
     data-sonic-text="Found you 🦔"
     data-sf-random="true" data-sf-games="2,3" data-sf-scale="auto" data-sf-glitch="0.6"></div>

<!-- or in code -->
<script>
  SonicText.render(document.querySelector('#msg'), 'Game over :tails:', { random: true, games: [2, 3], scale: 'auto' });
</script>
```

Try everything live in `demo/index.html` (open it from a local server, or just double-click it).

## Building the sprites (required, one time)

Sprite images are **not** in this repo: the rippers ask that their sheets are hosted only on The Spriters Resource,
Sprites Database and SGXP. Download the four sheets listed at the top of `tools/build_atlas.py` into `sheets/`, then:

```bash
pip install pillow numpy
python3 tools/build_atlas.py
```

This cuts out every letter, packs one `dist/sprites/atlas.png`, and writes `dist/sonic-text.css`, `dist/sonic-text.js` and `dist/manifest.json`.
Ship those four files with your game.

## Options

| option | default | meaning |
|---|---|---|
| `random` | `true` | pick a random font **for every letter** from all enabled games. Off: use `base` (plus one random font per extra game) |
| `games` | `[1]` | extra games to mix in: `[2]`, `[3]` or `[2, 3]` (Sonic 1 is always on) |
| `base` | `"s1c"` | font used when `random` is off. Any font id from `SonicText.fonts` (Sonic 1: `s1c`, `s1t`; Sonic 2: `s2t`, `s2m`, `s2o`, `s2y`, `s2s`; Sonic 3: `s3c`, `s3g`, `s3y`) |
| `scale` | `3` | integer pixel scale, or `"auto"` to fit the element's size |
| `glitch` | `0.5` | 0 to 1: jumps, slices, squish, dark boxes |
| `spacing` | `0.5` | 0 to 1: letter and word gaps |
| `position` | `true` | random vertical jumps and uneven gaps between letters. Off: letters sit on one straight line with even spacing (fonts and slice glitches still apply) |
| `ring` | `true` | draw some letter O's as the white ring |
| `emoji` | `"head"` | replacement sprites: `"head"` (Sonic 2 life icons) or `"body"` (special stage poses) |
| `seed` | random | fixed number gives the same layout every time |
| `animate` | `0` | milliseconds between re-rolls (disabled for `prefers-reduced-motion`) |

Replacements in text: `:sonic: :tails: :knuckles: :ring:` or the emoji 🦔 🔵 🦊 🔴 🥊 💍. Line breaks (`\n`) are kept.
Fonts available: `SonicText.fonts` (id, label, game, chars).

## API

```js
SonicText.render(el, text, opts)   // draw into el
SonicText.update(el, { glitch: 0.9, random: false })   // change options, keep the text
SonicText.reroll(el)               // new random layout
SonicText.stop(el)                 // stop animation
SonicText.attach(root?)            // process [data-sonic-text] elements (runs automatically on load)
```

Data attributes: `data-sonic-text`, `data-sf-font`, `data-sf-random`, `data-sf-games`, `data-sf-scale`,
`data-sf-glitch`, `data-sf-spacing`, `data-sf-ring`, `data-sf-position`, `data-sf-emoji`, `data-sf-seed`, `data-sf-animate`.

## CSS only (no JS)

Every sprite is a class, so you can place single letters yourself: `<span class="sf-g sf-s2t-A" style="--sf-scale:4"></span>`.
Class pattern: `sf-<font>-<char>` and `sf-e-<head|body>-<sonic|tails|knuckles>`. Set `--sf-atlas: url(/path/atlas.png)` to move the image.

## In a game canvas

The DOM output works as an overlay. For a canvas game, read `dist/manifest.json` (sprite positions in `atlas.png`)
and `ctx.drawImage` the rectangles with `imageSmoothingEnabled = false`.

## Important information to know

This should not be used in any commercial intentions as this is a personal-use tool allowed to be used by everybody.

## Credits and legal

Code: MIT (see LICENSE). Sprites are © SEGA / Sonic Team; this is an unofficial fan tool and the repo grants no rights to them.
See NOTICE.md for sprite sheet credits.
