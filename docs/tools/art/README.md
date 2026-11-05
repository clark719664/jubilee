# Art generators

The holiday scenes and stickers in `src/art` are drawn with code. These scripts rebuild them.

```sh
node docs/tools/art/kit/build-scene.mjs bonfire-night   # scenes/<id>/{back,mid,front}.svg, scene.json and stickers/<id>.svg
```

- `gen-xmas/lib.mjs` — path, color, gradient and geometry helpers shared by every generator.
- `gen-kw/people.mjs` — the ART.md §13 people recipe (`figure`, `head`, `headwrap`).
- `kit/scenekit.mjs` — scene pieces: bare trees, fires, string lights, bobble hats, scarves, critters, terraces.
- `kit/stickerkit.mjs` — Sticker 2.0 (ART.md §7): badge shapes, tiled motif patterns, ink outlines, faces, the die-cut.
- `t2/<id>/scene.mjs` and `t2/<id>/sticker.mjs` — one holiday each. `scene.mjs` exports `back`, `mid`, `front`
  and `sceneData`; `sticker.mjs` exports `sticker`.

Check every build with `npx vitest run test/art.test.ts` and a zoomed render before committing (ART.md §11).
