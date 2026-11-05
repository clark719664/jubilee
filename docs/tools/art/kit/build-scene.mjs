// node build-scene.mjs <holiday-id> — builds scenes/<id>/{back,mid,front}.svg + scene.json (and the sticker) from ../t2/<id>/
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
const id = process.argv[2];
const ROOT = new URL('../../../../src/art', import.meta.url).pathname;
const dir = new URL(`../t2/${id}/`, import.meta.url).pathname;
const out = [];
mkdirSync(`${ROOT}/scenes/${id}`, { recursive: true });
const kb = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(1)} KB`;
if (existsSync(`${dir}scene.mjs`)) {
  const m = await import(`${dir}scene.mjs?${Date.now()}`);
  const back = m.back(); writeFileSync(`${ROOT}/scenes/${id}/back.svg`, back); out.push(`back ${kb(back)}`);
  const mid = m.mid(); writeFileSync(`${ROOT}/scenes/${id}/mid.svg`, mid.svg); out.push(`mid ${kb(mid.svg)}`);
  const front = m.front(); writeFileSync(`${ROOT}/scenes/${id}/front.svg`, front); out.push(`front ${kb(front)}`);
  writeFileSync(`${ROOT}/scenes/${id}/scene.json`, JSON.stringify(m.sceneData(mid.ppl), null, 2) + '\n'); out.push('scene.json');
}
if (existsSync(`${dir}sticker.mjs`)) {
  const st = await import(`${dir}sticker.mjs?${Date.now()}`);
  const s = st.sticker(); writeFileSync(`${ROOT}/stickers/${id}.svg`, s); out.push(`sticker ${kb(s)}`);
}
console.log(`${id}: ${out.join(' · ')}`);
