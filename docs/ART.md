# Jubilee art guide

How to draw a holiday scene or sticker that matches the reference set. The Christmas scene
(`src/art/scenes/christmas/`) is the reference for night scenes with snow, Diwali (`src/art/scenes/diwali/`) for night
scenes with architecture, and `src/art/stickers/{christmas,diwali,halloween,easter}.svg` for stickers. Copy their
construction, not their content: every holiday gets its own place, light and objects.

Everything here comes from building those files and from the defects a magnified review found in them. The rules in §9
exist because each one was broken once. §12 is the bar above "correct": what two independent art directors said the
reference set still lacked. A piece that obeys §9 but not §12 is clean, not finished.

## 1. Files and hard limits

| what | path | artboard | budget |
|---|---|---|---|
| far plane | `src/art/scenes/<id>/back.svg` | `viewBox="0 0 1600 900"` | ≤ 40 KB |
| main plane | `src/art/scenes/<id>/mid.svg` | same | ≤ 60 KB |
| foreground | `src/art/scenes/<id>/front.svg` | same | ≤ 30 KB |
| interaction data | `src/art/scenes/<id>/scene.json` | artboard units | — |
| sticker | `src/art/stickers/<id>.svg` | `viewBox="0 0 512 512"` | ≤ 30 KB |

- Plain SVG 1.1 with `xmlns="http://www.w3.org/2000/svg"` (add `xmlns:xlink` when you use `<use xlink:href>`). No
  `<text>`, `<image>`, `<script>`, `<foreignObject>`, `<style>`, fonts, CSS animation, event attributes, or any
  reference that isn't `#fragment`. `npx vitest run test/art.test.ts` checks all of this plus the budgets.
- Every gradient, filter, clip-path and symbol id starts with the holiday id (`christmas-win`, `diwali-st-flame`).
  Two scenes are often on one page; unprefixed ids collide.
- Filters: `feGaussianBlur` only, at most two per file, only in `back`/`mid`, only for soft things (smoke, a row of
  light halos). Everything else that glows is a radial gradient.
- Coordinates are whole numbers or one decimal. Opacities, offsets and stroke widths keep two decimals (see §10).
- Each file opens with a comment saying what it is; each group has a comment naming it. `mid.svg` opens with the
  concept: the scene, the focal point with its box, and the light story.
- The sky is never drawn. It is the theme's CSS gradient (`bg1` at the top, `bg2` at the horizon) from
  `src/theme/themes.ts`, so the layers are transparent wherever there is sky.

## 2. Composition contract

The hero stacks `sky → back → mid → effect canvas → front`, each layer `object-fit: cover; object-position: 50% 100%`.

```
 x: 0        300        520        800        1080       1300        1600
 y 0 ┌──────────┬──────────────────────────────────────────┬───────────┐
     │          │  COPY ZONE  x 300–1300, y 0–430:          │           │
     │  sides:  │  empty sky. Only thin things hanging from │  sides:   │
     │  tall    │  the very top edge, ≤ 60 deep.            │  tall     │
 430 │  shapes  ├─────────┬─────────────────────┬──────────┤  shapes   │
     │  allowed │         │ FOCAL BOX           │          │  allowed  │
     │          │         │ x 620–980, y 430–860│          │           │
     │          │ phone strip x 520–1080 (all a phone sees)│           │
 900 └──────────┴──────────────────────────────────────────┴───────────┘
```

- **Desktop** (about 2.3:1) crops the top: at 1280×560 only y ≳ 200 shows. Keep anything important (domes, finials,
  the moon) below y 220.
- **Phone** (about 0.6:1) shows only x 520–1080. The focal subject must read there on its own, at 390 px wide.
- **Ground** reaches y 900 across the full width in `mid` or `front`; no sky shows below y 860. Every layer spans
  x 0–1600 with no gaps at the sides (overdraw to −20 and 1620).
- **Effect space**: the canvas draws between `mid` and `front`. Leave its space clear and never draw what it draws
  (the brief lists them). Diwali's diyas and rangoli sit in the bottom center, so the Diwali courtyard there is plain
  warm stone with a soft pool of light and nothing else.
- **`front.svg`** frames the bottom and corners only: under 22% of the height in the center (y ≥ 700 at x 520–1080),
  and it never covers the focal point. It is the darkest or most saturated plane.
- **Three planes**: `back` low contrast and tinted toward the sky; `mid` full color and crisp; `front` darkest or most
  saturated. If you squint, the planes separate into three values.

## 3. Palette recipe

Start from the holiday's theme (`bg1`, `bg2`, `ink`, `accent`, `accent2`, `glow`) and derive every color from it with
a few mixing functions. Write them as code; never eyedrop.

```js
const mix = (a, b, t) => /* per-channel lerp of two hex colors */;
const night = (c, k = 0.32) => mix(c, NIGHT, k); // local color sinking into the night
const lit   = (c, k = 0.30) => mix(c, WARM,  k); // local color catching lamp light
const haze  = (k) => mix(T.bg2, MIST, k);        // far plane: sky color lifted toward a pale mist
```

### Night (Christmas, Diwali, Halloween, Hanukkah, Eid, …)

| role | Christmas | Diwali | rule |
|---|---|---|---|
| `NIGHT` (deepest local tone) | `#1a2c3d` blue slate | `#2a0d3a` plum | the sky hue taken very dark; pick one that keeps warm walls from going muddy (a green sky + black makes olive, so Christmas uses slate) |
| `WARM` (lamp light) | `#ffd98a` | `#ffc46b` | theme `glow` pushed toward cream |
| far plane | pale: `haze(.2–.7)` with `MIST` `#d8f3e8` (snowy peaks lit by the moon) | dark: silhouettes `mix(NIGHT, bg2, .55–.72)` against a rose glow, the farthest skyline `mix(bg2, '#d9708a', .32)` | either lighter or darker than the sky, never both; lightness spread inside `back.svg` stays small |
| walls facing us | `night(c, .30–.40)` | same | then a vertical gradient: top `darken(c, .18–.22)` (eave shadow), `c` at .6, foot `mix(c, warm bounce, .12–.22)` |
| walls facing the light | `lit(c, .22–.30)` | a 6–7 unit `WARM` strip at 35–40% on each wall edge that faces the center | the focal light's side of every building |
| accents | `accent`, `accent2` | marigold, pink | small doses, densest near the focal point |

Two traps from the Diwali revision: a green or teal wall sunk toward plum turns gray, so sink greens toward a cool dark
(`#14102a`) and give them a contrasting warm trim (trims mixed toward the green go olive); and shade the tops of walls
toward the scene's `NIGHT` hue, never toward black, which turns saturated ochre to mud.

Distance is a color, not an overlay: a farther house uses `dim = 0.1–0.22` mixed into every one of its colors
(walls, roof, snow, door). Translucent dark overlays double up where shapes overlap and show seams.

Snow is the brightest cool surface at night and comes in four values (the revised Christmas scene): `#eef8ff` moonlit,
`#fff4dc` where it faces a lamp, `#c6d9eb` in shade, and `#a8c1d9` on its cut edge. The far plane stays hazy
(`haze(.1–.44)`), and a snowy front bank is the darkest plane (`#4d7e9a` → `#203f58`). Ground is one radial gradient
centered under the focal point: warmest and lightest there, cooler at the edges.

### Day (Easter, Holi, Nowruz, Mother's Day, …)

- Sun from the upper left. Light faces: `mix(c, '#ffffff', .3–.5)` on upper-left edges; shadow faces:
  `mix(c, COOL, .2–.3)` where `COOL` is `bg2` desaturated (lavender for Easter, blue-gray for snow days).
- Far plane: `mix(c, bg1, .55–.75)`. Cast shadows are soft ellipses of a cool dark at 12–20%.
- No glows except the sun's. Pastels need one saturated anchor color (the Easter sticker: theme `accent` violet in
  the zigzag, `accent2` pink in the band) or they wash out on the light sky.

## 4. Light recipe

One light story per scene, said in the `mid.svg` comment, then obeyed by every object.

- **Night**: one warm key at the focal point (the tree and its star; the kandil and the haveli doorway), many small
  practical lights (windows, lanterns, strings), a cool fill from the sky. Everything facing the key catches it; the
  rest sits in the cool night color.
- **Glows are radial gradients that reach zero at their edge**: `glow` at opacity .55 → .22 at 35% → 0 at 100%.
  Size the halo 1.3–1.5× the light plus 10. A glow with a visible edge is a defect.
- **Spill**: every lit door and ground-floor window throws an ellipse of light on the ground below it (radial, .5 → 0,
  about 1.3× its width, 11 tall).
- **Rim light**: a 3–4 unit warm stroke on edges that face a light (the snowman's lantern side; the skyline facing the
  city glow).
- **Contact shadows**: a 14–16 unit band of `#000` .3 → 0 under every eave and along the foot of every wall, so
  buildings sit on the ground. Under small objects, a soft ellipse at 18–45%.
- **Sparkle, not sticks**: a star's flare is a symmetric four-point sparkle whose arms fade to nothing (§6.5). A
  one-sided horizontal ray reads as a stick at zoom.

## 5. Shape language

- **Chunky and rounded.** Every polygon corner is rounded (2–8 units on scene objects, up to 36 on big masses such
  as tree tiers). Minimum feature 6 units, minimum stroke 2.5 units: anything smaller vanishes on a phone.
- **Silhouette first.** Each object reads as one shape at a glance; interior detail is 2–3 values of its own color.
- **Repetition with variation.** Drips, merlons, bulbs, icicles and tiles repeat with seeded jitter (thickness
  × 0.72–1.0, an occasional longer drip). Use a seeded RNG so a rebuild is identical.
- **One perspective.** The reference scenes now use flat front elevations only: no building shows a side wall, which
  reads as picture-book art and never mixes. If a scene does show side walls, every one recedes along one fixed vector,
  mirrored across x 800 so everything leans toward the focal point. Never mix the two in one street.
- **Scale ladder.** Nearer means bigger, lower and more saturated; farther means smaller, higher and hazier.
- **Faces** only where allowed (snowmen, pumpkins, chicks, eggs): eyes level, evenly spaced, a catchlight up-left,
  cheeks at 50–75% opacity, a friendly mouth. Never on sacred objects (diya, menorah, kinara, crescent, cross), never
  on deities or saints.
- **Architecture is inspired, not copied**: domes, spires, arches and chhatris as generic forms. No real buildings,
  logos, flags or lettering.

## 6. Reusable motifs

The snippets are real, rendered and checked. Rename the ids for your holiday.

### 6.1 Glowing window

Draw the window once as a symbol and place it with `<use x y color>`. The frame is `currentColor`, so one symbol
serves every house trim. Halo first, glass, frame, bars, sill, then snow on the sill (at night in winter).

```svg
<defs>
  <radialGradient id="christmas-win" cx="0.5" cy="0.62" r="0.75">
    <stop offset="0" stop-color="#fffbe6"/><stop offset="0.45" stop-color="#ffe08e"/><stop offset="1" stop-color="#ffa83e"/>
  </radialGradient>
  <radialGradient id="christmas-halo" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#ffd166" stop-opacity="0.55"/><stop offset="0.35" stop-color="#ffd166" stop-opacity="0.22"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/>
  </radialGradient>
  <g id="christmas-w36x46">
    <ellipse cx="18" cy="23" rx="64" ry="70" fill="url(#christmas-halo)"/>        <!-- halo: 1.5w+10, 1.3h+10 -->
    <rect width="36" height="46" rx="3" fill="url(#christmas-win)"/>               <!-- warm glass -->
    <rect width="36" height="46" rx="3" fill="none" stroke="currentColor" stroke-width="5"/>
    <path d="M18 2V44M2 23H34" stroke="currentColor" stroke-width="3.5"/>         <!-- glazing bars -->
    <rect x="-7" y="45" width="50" height="7" rx="2.5" fill="currentColor"/>      <!-- sill -->
    <path d="M-9 46L9 39L23 41L45 46V48H-9Z" fill="#eaf7f1"/>                      <!-- snow on the sill -->
  </g>
</defs>
<use xlink:href="#christmas-w36x46" x="240" y="580" color="#f6e6d4"/>
```

Little stories go inside the glass after the `<use>`: a cat silhouette, a tiny tree, a candle. They are the best
findables. Diwali's version is an arched opening with a pearl-beaded arch (a dotted stroke, §6.6) and no snow.

### 6.2 String lights anchored at both ends

Hooks first, then a wire whose ends are exactly the hook points, then bulbs sampled from the same curve. A quadratic
whose control point sits `2 × sag` below the chord's midpoint dips by exactly `sag`.

```svg
<!-- hooks: a brass finial on each roof peak (or a nail on an eave) -->
<path d="M40 120V103M360 120V103" stroke="#d9b45e" stroke-width="4" stroke-linecap="round"/>
<circle cx="40" cy="100" r="4.5" fill="#d9b45e"/><circle cx="360" cy="100" r="4.5" fill="#d9b45e"/>
<!-- the wire: from hook to hook, sag 30 -->
<path d="M40 107Q200 167 360 107" fill="none" stroke="#1d2a25" stroke-width="2.5"/>
<!-- bulbs at B(t) = (1-t)²·P0 + 2(1-t)t·C + t²·P2 for t = 1/6 … 5/6; a bulb's (0,0) is where its cap meets the wire -->
<use xlink:href="#christmas-bulb-r" x="93" y="124"/><use xlink:href="#christmas-bulb-r" x="147" y="134"/>
<use xlink:href="#christmas-bulb-r" x="200" y="137"/><use xlink:href="#christmas-bulb-r" x="253" y="134"/>
<use xlink:href="#christmas-bulb-r" x="307" y="124"/>
```

```svg
<g id="christmas-bulb-r">  <!-- glow, cap, glass, glint -->
  <circle cy="10" r="19" fill="url(#christmas-bh-r)"/>
  <rect x="-3" y="-1" width="6" height="6" rx="1" fill="#25302b"/>
  <path d="M0 4c5.5 0 7 6.5 4.4 11.4q-1.8 3.6-4.4 3.6t-4.4-3.6c-2.6-4.9-1.1-11.4 4.4-11.4z" fill="#ff4d5e"/>
  <ellipse cx="-1.6" cy="9.5" rx="1.4" ry="2.4" fill="#fff" opacity="0.75"/>
</g>
```

Garlands on a tree wrap round it: start and end each swag beyond the tier's silhouette, clip the wire to the tree's
own shape, and keep only the bulbs that fall inside the tier with a margin. Then no wire ends on the branches or in
the air.

### 6.3 Snow that lies on its roof

The roof is built first (wall, roof plane, bargeboards or fascia, icicles); the snow is generated from the roof's own
edge points, never drawn freehand, and never one stock cap copied onto every roof (the first Christmas village did that
and read as marshmallows).

- **Gable:** a thin layer along the bargeboard, lifted about 10 and 4–5 thick, with a few drips, so the board still
  shows under it.
- **Hipped or mansard roof:** a snow surface bounded exactly by the hips and the ridge, plus a darker lip along the eave
  that shows the snow's thickness, with drips hanging over it.
- Snow is cool white; only the end facing the focal light is warmed.
- **Icicles** hang from their board: the top tucks 1–2 units into it and stays within its width.
- A chimney stands on the roof plane, drawn after it, with its foot buried in a heap of the roof's snow.

```svg
<!-- the wall is one closed shape: a gable triangle always has wall under it -->
<path d="M0 210V90L80 30L160 90V210Z" fill="#c27a3e"/>
<!-- bargeboards run the full rake and overhang the wall corners by 8 -->
<path d="M-8 96L80 26L168 96" fill="none" stroke="#4f2a14" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>
<!-- gable snow: the rake lifted 10, 4–5 thick, drips sampled along it -->
<path d="M-6 88L80 18L166 88" fill="none" stroke="#eef8ff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
```

A long side facing us gets a hipped roof, never a rectangle of white with a vertical end.

### 6.4 Pine (fir) with snow

One unit symbol (base center at (0,0), 100 tall), colored by its `<use>`: body `currentColor`, snow `fill`. Push
both colors toward the sky for distance.

```svg
<g id="christmas-fir">
  <path fill="currentColor" d="M-1 -97Q0 -100 1 -97L19 -53Q20 -50 17 -51L11 -53Q8 -53 10 -51L24 -32Q26 -30 23 -31L13 -33
    Q10 -33 12 -31L30 -12Q32 -10 29 -10L8 -10Q5 -10 5 -7L5 -3Q5 0 2 0L-2 0Q-5 0 -5 -3L-5 -7Q-5 -10 -8 -10L-29 -10
    Q-32 -10 -30 -12L-12 -31Q-10 -33 -13 -33L-23 -31Q-26 -30 -24 -32L-10 -51Q-8 -53 -11 -53L-17 -51Q-20 -50 -19 -53Z"/>
  <path d="M-1 -97Q0 -100 1 -97L14 -75Q16 -72 13 -73L8 -76Q6 -77 4 -75L3 -73Q1 -71 -1 -73L-2 -74Q-4 -76 -7 -75
    L-13 -73Q-16 -72 -14 -75ZM-2 -53Q0 -55 2 -53L17 -41Q19 -39 16 -41L10 -43Q7 -44 5 -42L4 -41Q2 -38 -1 -40L-3 -42
    Q-6 -43 -9 -43L-16 -40Q-19 -39 -17 -41ZM-2 -33Q0 -35 2 -33L20 -21Q23 -20 20 -21L12 -23Q9 -25 7 -23L4 -20Q2 -19
    -1 -20L-4 -22Q-7 -24 -10 -23L-20 -20Q-23 -20 -20 -21Z"/>
</g>
<g color="#0f4431" fill="#e2f2ea"><use xlink:href="#christmas-fir" transform="matrix(1.9 0 0 1.9 110 650)"/></g>  <!-- near -->
<g color="#5f9a86" fill="#b8ddd0"><use xlink:href="#christmas-fir" transform="matrix(.7 0 0 .7 300 620)"/></g>   <!-- far -->
```

Plant the base on the ground line (or below it, hidden by a drift); a fir standing on nothing is a defect.

### 6.5 Star with a soft sparkle

```svg
<g transform="translate(800 474)">
  <circle r="100" fill="url(#christmas-starglow)"/>   <!-- #fff3c4 .8 → glow .34 at 25% → 0 -->
  <path d="M0 -74Q0 0 74 0Q0 0 0 74Q0 0 -74 0Q0 0 0 -74Z" fill="url(#christmas-sparkle)"/>  <!-- #fffbe8 .95 → .5 at 30% → 0 -->
  <path d="M0 -44Q0 0 44 0Q0 0 0 44Q0 0 -44 0Q0 0 0 -44Z" fill="url(#christmas-sparkle)" transform="rotate(45)"/>
  <!-- rounded 5-point star: R 40, r 18, corner radius 6; darker rim; pale inner star offset up-left -->
  <path fill="url(#christmas-star)" stroke="#e89a1c" stroke-width="2.5" stroke-opacity="0.6" d="M-2 -34Q0 -40 2 -34L8 -20
    Q11 -15 17 -14L32 -13Q38 -12 33 -8L22 2Q17 6 19 11L22 27Q24 32 18 29L5 21Q0 18 -5 21L-18 29Q-24 32 -22 27L-19 11
    Q-17 6 -22 2L-33 -8Q-38 -12 -32 -13L-17 -14Q-11 -15 -8 -20Z"/>
  <path fill="#fffbe8" opacity="0.85" d="M-4 -18Q-3 -20 -2 -18L0 -13Q1 -11 4 -10L9 -10Q11 -10 9 -8L6 -5Q4 -3 4 0L5 5
    Q6 7 4 6L-1 3Q-3 2 -5 3L-10 6Q-12 7 -11 5L-10 0Q-10 -3 -12 -5L-15 -8Q-17 -10 -15 -10L-10 -10Q-7 -11 -6 -13Z"/>
</g>
```

The sparkle's gradient is in object-bounding-box units, so its arms always fade to zero at their tips. The star
covers the tree's apex: attached.

### 6.6 Beads, marigolds and merlons from one stroke

A dashed stroke with zero-length dashes and round caps draws a row of perfect dots along any path: bulbs on a far
roofline, a pearl-beaded arch, rounded merlons on a parapet, or a marigold garland (three passes: dark orange, orange
offset by half a gap, small gold centers).

```svg
<path d="M622 628Q683 654 744 628" fill="none" stroke="#e0640c" stroke-width="12" stroke-linecap="round" stroke-dasharray="0 8.8"/>
<path d="M622 628Q683 654 744 628" fill="none" stroke="#ff9a1a" stroke-width="11" stroke-linecap="round" stroke-dasharray="0 8.8" stroke-dashoffset="-4.4"/>
<path d="M622 628Q683 654 744 628" fill="none" stroke="#ffc928" stroke-width="6" stroke-linecap="round" stroke-dasharray="0 17.6" stroke-dashoffset="-2.2"/>
<circle cx="622" cy="628" r="3.5" fill="#e3b04b"/><circle cx="744" cy="628" r="3.5" fill="#e3b04b"/>  <!-- its two hooks -->
```

A toran is this garland across a doorway, with marigold strands hanging from it, each finished by a mango leaf. A
hanging lantern (the akash kandil) hangs on a cord from a brass bracket fixed to the wall plate, never from the sky.

## 7. Sticker recipe

Every sticker is a **collectible badge**: a hero that belongs to one holiday, standing on a badge that could only be
that holiday's. No two stickers share a badge shape and colorway, so a page of them reads as a set of different
things, not one template.

```
die-cut   white border + soft shadow round the union of badge and hero
badge     the holiday's own shape, two-tone enamel, a pattern of its motifs, a bevel, a stitched ring, an ink rim
hero      the character or object, a dark ink outline traced from its silhouette, the paint
extras    sparkles, a prop, sparks or steam breaking out past the badge
```

- **Kit:** build stickers with the Sticker 2.0 kit (`badge`, `tiled` + `MARKS`, `inkUnder`, `face`, `sparkle`,
  `stickerDoc`). The badge outline is defined once and reused (fill, clip, bevel, stitch, rim, die-cut); patterns are
  one symbol per mark placed with `<use>`. Both keep a sticker inside its 30 KB.
- **Badge:** pick a shape that says the holiday (a firework burst for Bonfire Night, a mosque-window arch for Eid, a
  rangoli flower for Diwali, a shield for the Fourth of July, an egg for Easter, a heart for Valentine's). Its pattern
  is the holiday's own motif (marigolds, kente, crescents, snowflakes, little π signs), and color bands inside it can
  tell a bit of story (a kente band, a rainbow, a row of bonfire flames, flag stripes).
- **Hero:** larger than feels safe, so it breaks out of the badge somewhere (sparks, a stick, a flame, a puddle). Its
  ink outline is a darker shade of its own main color, 6–7 units wide. Parts of the silhouette that only widen the
  die-cut (a glow halo, extra-thick arm strokes) get no ink and no white underlay.
- **Faces** are optional and come from the expression library (happy, joy, wink, gasp, sleepy, cheeky, starry, proud,
  shy, sing, determined): vary them across the set. Painted eyes stay dark plum `#2b1a4d` (or a darker shade of the
  hero on red or orange), each with a big white catchlight up-left and a small glint low-right. Sacred objects never
  get a face; a companion carries it instead (the Diwali kitten).
- **Read at 40 px:** one silhouette, the badge color against the hero color, a strong light/dark split. Delight at
  256 px: highlights, a pattern, small finishing details.
- **Die-cut:** border stroke 40; hairline stroke 43 `#2b1a4d` at 0.1; shadow `#1a1030` as stroke 40 at 0.2 shifted 6
  down plus stroke 48 at 0.08 shifted 10 down.
- **Extent:** check by pixel-scanning the silhouette alone: at least 24 from the sides, 22 from the top, and no lower
  than 478 at the bottom. Glows stay inside the silhouette, never as a halo on the border.

## 8. scene.json

Data for the hero hotspots and Seek & Find, in artboard units (`SceneData` in `src/art/index.ts`):

```json
{
  "hotspots": [ { "activity": "wish", "x": 800, "y": 474, "r": 52, "label": "Make a wish on the star" } ],
  "findables": [ { "id": "cat-window", "label": "a cat", "x": 263, "y": 612, "r": 20 } ]
}
```

- **4–6 hotspots**, each on an object that fits its activity: `wish` on the star or lantern, `doors` on a front door,
  `card` on presents or a sweet box, `catch` on a sled or basket, `seek` on windows to peek into, `color` on a painted
  thing, `memory` on a shop counter of matching things, `dressup` on a snowman or a clothes rail. Labels are short
  invitations ("Open a countdown door").
- Hotspot centers sit inside **x 520–1080** wherever possible (that is all a phone shows). `r` covers the object and
  stays ≥ 30, so the touch target is big enough on a phone.
- **6–8 findables**: small, charming details drawn in `mid.svg` (never in the effect or `front`), each with a unique
  kebab-case `id`, a label that reads after "Find…" and names the thing, never its spot ("a ginger cat", not "a cat on the roof
  terrace"; `test/art.test.ts` enforces this), and `r` 16–36 around the thing. Two alike in one scene become
  "a cat" and "a second cat".
  Spread them across the whole width; the wide picture is where they hide.
- Compute the numbers from the same layout constants the drawing uses (the Diwali scene.json is generated from the
  same layout object as its houses), so moving a house moves its hotspot. Then check them on an overlay render (rings
  over the art).

## 9. Construction rules

Every rule below is a defect that was found at 3× zoom and fixed. Check each one before handing a file over.

1. **Attach everything.** Every object overlaps what holds it by at least 2 units: a pom-pom overlaps the hat crown
   (it was floating 3 units above it); a chimney stands on a roof plane with its foot in a heap of snow (one stood
   alone in front of a mountain); a lantern stands on the ground in a drift, on a post or on a bracket (one hung in
   mid-air); birds and animals stand on something, with a contact shadow; baubles hang from a visible loop on a
   branch; a star covers its tree's apex.
2. **Anchor every wire.** Wires, garlands, ropes and cords start and end on a hook you can see: a finial, a nail, a
   bracket, an eave. Compute the end points from the object they hang from, draw the hook, then sample the bulbs from
   the same curve (one string started in mid-air). A garland on a tree is clipped to the tree so its ends disappear
   behind the silhouette.
3. **Close every roof.** Every gable triangle has wall under it (brown wedges once peeked out with nothing below);
   every visible roof plane is bounded by its eave, ridge and rake; a long roof facing us is a hipped or gabled roof,
   never a flat slab with a vertical edge; overhangs are ≤ 16 at the eaves and ≤ 8 at an outer rake, or they read as
   sticks. Snow caps are generated from the roof's edges (§6.3).
4. **No stray shapes.** Nothing peeks out that isn't a readable object: a bow under a box that carries another box was
   a stray gold circle; a bauble behind the sticker's star was a stray white disc; a trunk stub above a tub rim was a
   dark sliver. If something is hidden, don't draw it; if it shows, make it a thing.
5. **One perspective, one light.** Side walls recede along the scene's vector; glows sit on the side of the light; the
   rim light faces the source.
6. **Soft light, hard objects.** Glows fade to zero; flares are symmetric sparkles; objects have crisp edges. A
   one-sided ray, a glow with an edge, or a blurred object is a defect.
7. **Sit on the ground.** Contact shadows under walls, eaves and objects; drifts round anything in snow; the ground
   reaches y 900.
8. **Keep the copy zone empty** (x 300–1300, y 0–430) except thin things hanging from the top edge. Check the desktop
   crop for tops cut off (domes, finials) and the phone crop for a focal point that still reads.
9. **Paths stay simple.** No self-intersecting paths (a mirrored triangle drawn in the wrong order made a sliver in
   the jack-o'-lantern's eye); no sampled outlines with steps between samples (the first grin was jagged): build sharp
   features from exact points and curves from exact curves.
10. **Readable at phone size.** Features ≥ 6 units, strokes ≥ 2.5. Footprints are a trail of sole-and-heel prints
    evenly spaced along a path, not a few loose dots.

From the reference revision (each was a defect at 3–4× zoom):

11. **Facets share vertices.** When a shape splits into lit and shaded parts, draw it once whole, then draw the same
    shape clipped to the lit face. Two separate polygons meant to meet leave notches and tongues.
12. **Rim light is a fill inside the shape** (an off-center radial gradient with stops at 0.8–1, or a clipped
    crescent), never a stroke.
13. **Clip garlands to everything painted**: if a tier is painted twice (a lit hem plus the body), the clip includes
    both.
14. **Every look-alike of a findable is listed, or not drawn.** Seek & Find accepts a tap on any listed circle, so an
    unlisted twin gives a child no credit.
15. **Held means gripped:** the hand closes over the handle, with the handle visible on both sides of it.
16. **Figures:** children about 60–65 units tall near the focal point, adults about 1.4×; dot eyes with a white
    catchlight so they read on every skin tone; eyes below a hat's cuff; a contact shadow under every figure. In a
    doorway, the lowest toran or garland tip stays above the figure's hair.
17. **Pots:** a row of dots above a curved band on a round pot reads as a face. Paint pots with straight bands or
    zigzags between two lines.
18. **Floors:** reflections are radial ellipses centered on the foot of the wall, drawn before the building so it hides
    their top half (trapezoids leave hard edges); every floor joint ends where it meets another joint, never in open
    floor.
19. **Neighboring railings** at the same height merge into one long fence: offset them by at least 20 units.
20. **A swinging lantern** rotates about its cord's hook, and its hotspot is computed with the same rotation.
21. **Ids are unique and every `url(#…)`/`href` resolves.** A shared gradient and clip id silently dropped a clip.
22. **Carving:** a carved cut wall is an even-width band drawn inside the hole, never an offset copy of it; ribs and
    grooves stay at least 10 units from every carved edge and corner (move the teeth if the ribs can't move).
23. **Containers:** the inside of an opened container is a lens between the front and back rims that tapers to nothing
    at both ends; a limb of a character inside a container is drawn before the container's front wall, so its root
    tucks behind the rim. A hat overlaps the head by at least 10 units, and what it hides is not drawn.
24. **A diya's wick** is drawn before the oil so its tail slips under the surface; only a short stub shows.
25. **Windows are glass, not stages.** Anything seen through a window (a cat, a paper ghost, a lamp, a family) is
    clipped to the glass and drawn before the mullions and frame; nothing crosses the frame onto the wall or roof. The
    Halloween attic cat's tail curled out over the frame onto the shingles, and the owner noticed.

## 10. Drawing with code

All the reference files are generated by small JavaScript modules (helpers for color mixing, rounded polygons,
smooth curves through points, sagging wires and snow blankets), then compacted. That is how the rules above stay true
when something moves. Two traps the reference work fell into:

- **Rounding style numbers with coordinates.** Rounding every number to whole units turned `opacity="0.22"` into `0`
  and erased every shadow, and turned a radial gradient's `cx="0.5" cy="0.5" r="0.5"` into `1 1 1`, which moved a
  city's glow to the corner of its shape. Round coordinates; keep opacities, offsets, stroke widths and every
  bounding-box gradient value at two decimals.
- **kebab-casing attribute names.** `patternUnits`, `patternTransform`, `gradientUnits`, `gradientTransform` and
  `stdDeviation` are camelCase in SVG; written as `pattern-units` they are silently ignored (the roof tiles vanished).

Budget tricks that kept the revised `mid.svg` files under 60 KB with characters added: define each wall, roof and tier
shape once and reuse it for clip, fill and pattern; place repeated things (dozens of lamps, bulbs) with one `<symbol>`
and `<use>` (about 45 bytes each); draw a sagging wire as one exact curve instead of many sampled points; draw a ring of
icing dots or a wreath as one dotted stroke instead of many circles.

## 11. Review loop

1. Render the hero at desktop (1280×560) and phone (390×640) sizes over the real sky, and the sticker on light and
   dark cards at 256, 64 and 40 px.
2. Render the full artboard at 3× as a 4×3 grid of tiles with artboard-coordinate rulers, plus each layer alone to
   find which file a defect is in. Stickers: four quadrants at 4×.
3. Read every tile against §9 and the brief's zoom checklist. Fix, re-render, repeat until a fresh look finds nothing
   worse than a nit.
4. Overlay the scene.json rings and check that each one sits on its object.
5. `npx vitest run test/art.test.ts`.

## 12. Beyond correct: story, value, hand and charm

Two art directors scored the first reference set 5.5–7 out of 10: clean and cozy, but "the most expected version of
everything" and "a set waiting for actors". These rules are what lifts a piece to 8–9. They apply to every scene and
sticker, the references included.

1. **Someone is doing something.** Every hero has a small story beat with a character in `mid.svg`, near the focal
   box: a family lighting diyas on the steps, a child with a sparkler, kids hanging a paper lantern, an elf on a
   rooftop, Santa's sleigh as a tiny silhouette crossing the moon (in `back.svg`). People are simple rounded figures
   (head, body, arms as soft shapes, dot eyes at most), with a range of skin tones across the set, clothing that fits
   the holiday without costume clichés, and the same friendly proportions as the stickers. Never draw deities, saints,
   prophets or religious leaders; worship is shown through objects and gatherings, not figures praying.
2. **Design the values before the colors.** Squint at the render (or view it in grayscale): the light source and the
   surfaces it hits are the lightest values, `front.svg` the darkest, and the `mid` walls separate clearly from the sky
   behind them. On snow at night, snow is the brightest cool surface (moonlit blue-white `#eef8ff`–`#fff4dc`), not a
   muddy sky-tinted green. Same-hue-on-same-hue is the most common failure (green walls on a green sky, mauve floor on
   a mauve sky); push one of them lighter, darker or warmer until it separates.
3. **Light lands somewhere.** The focal light throws a big warm pool on the ground (radial, 2–3× the light's width) and
   rims the tops and facing edges of everything near it; every lit window and doorway spills onto the ground or snow
   below; a doorway glows with something inside it (a lamp, a table, a silhouette), never an empty bright slab.
4. **Hand, not kit.** No module repeats unchanged more than twice: houses differ in width, roof pitch, chimney, door
   and window rhythm; rooflines, parapets and tree tiers get small irregularities from the seeded RNG; tree tiers end
   in branch-tip scallops, not smooth saucer rims. One perspective per street (§5): either every building shows a side
   wall on the scene's vector, or none does.
5. **One ownable signature shape.** Each scene has one bold, slightly exaggerated focal object a child would remember
   and could draw from memory (a crooked hero tree, a giant swinging kandil with a halo, a dragon-headed lantern). Make
   it bigger than feels safe: at least a third of the phone strip's width.
6. **Use the phone's sky.** On a phone the countdown sits at the top and the focal point sits low, so the sky between
   them shows. Give `back.svg` very low-contrast atmosphere there (a star field, a faint aurora, a far kite or sleigh,
   wisps of cloud): at most 0.18 opacity, or within 12% lightness of the sky, so text over it stays readable.
7. **Every detail earns its place.** A "detail that rewards a close look" must read at 2× on a phone: give small
   animals and props value contrast with what they sit on, or cut them. Corners hold one strong shape each, not
   clipped fragments.
8. **Stickers are collectible characters.** A sticker is one object with personality, posture or a gag, not a stock
   icon: the pumpkin has a dark carved face with a warm candle glow inside, the tree has snow on its boughs and a gift
   peeking out, a non-sacred object gets a face. Sacred objects (diya, menorah, kinara, crescent) never get faces;
   they get charm from setting instead (a ring of marigolds, a tiny cat beside them, a glow). Flames are short and
   round like oil-lamp flames, not tall candle teardrops. The die-cut border stays at least 18 units thick everywhere,
   including leaf tips.
9. **Judge the real layout.** The hero's countdown is centered at the top over the sky (the copy zone); the review
   render (`render.mjs`) mocks it there. Composition problems are judged against that, not against a label in a
   corner.


## 13. People

A child looks at the faces first, so every person in every scene is built from this one recipe and the set reads as
one cast. The Hanukkah window family, the Eid doorway and the Easter garden get it right; the first Christmas and Diwali
casts did not (eyes like colons, no mouths, hair like a helmet or a one-sided blob, rim-light lines down a grandmother's
sides), and the owner noticed straight away.

- **Head:** a circle, a touch taller than wide. One skin fill, plus at most one soft shade on the side away from the
  light as a fill clipped to the head. Children are about 2.7 heads tall (a 22–24 unit head at the 60–65 unit size in
  §9.16), adults about 3.2.
- **Eyes:** two solid ovals in `#2b1a4d`, level, about a sixth of the head's width tall, a third of the head's width apart
  center to center, just below the middle of the head. Exactly **one** white catchlight per eye, up and to the left,
  about a third of the eye's width. Two dots stacked in one eye read as a colon or a button. Glasses are round rims with
  a bridge and no lens fill.
- **Mouth:** every face has one, halfway between the eyes and the chin: a short smile arc (stroke 2–2.5, round caps, a
  dark warm tone such as `#6b2b3a`), or a small open D-shape (dark fill, pink tongue) for laughing or singing.
- **Cheeks:** two soft blush ovals (`#ff8fb8` at 0.45–0.6) just below and outside the eyes, entirely inside the face;
  never on its edge and never over a scarf or collar. A nose is optional: a tiny arc or dot, never a big pink oval.
- **Hair:** one shape that fits the head like a cap, in two parts: the back hair behind the head, and a fringe or
  hairline in front of it that meets the face in a smooth curve (never a straight vertical or horizontal cut across the
  face). Volume is balanced on both sides unless the style is deliberately one-sided (a side ponytail), and never larger
  than the head on one side. Styles are built from named parts: crop (cap + fringe), bob (cap + side panels to the jaw),
  ponytail, pigtails or puffs (cap + tails or circles fixed with a hair tie), bun (cap + circle), curls and coils (a cap
  of overlapping circles), braids (a tapering chain of ovals), and gray or white hair for elders. Across the set use
  every texture: straight, wavy, curly and coily.
- **Head coverings:** a hat or beanie sits on the hair, which shows only below the brim as small balanced tufts or a
  fringe; a hijab or headscarf is one smooth shape framing the face and covering the hair and neck; a kippah sits on
  the crown.
- **No lines on people:** no outlines, strokes or rim-light lines anywhere on a person. Shading and rim light are fills
  clipped inside the shape (§9.12). The only strokes on a person are a mouth and a pair of glasses.
- **Bodies:** a rounded torso in clothes; arms as tapered tubes that bend at the elbow and end in a round hand or
  mitten (never a straight plank from the shoulder); hands close over what they hold (§9.15); legs as rounded tubes
  with shoes; a contact shadow under the feet.
- **Check:** render every head at 8× (`node $S/shots/people-zoom.mjs <outDir> <id> x0 y0 x1 y1 8`, an artboard box
  around the head) and compare it with this list. A face that reads as a mask or a robot, a face with a missing
  feature, or hair like a helmet or a blob is a must-fix. Coloring pages follow the same features in line art.
