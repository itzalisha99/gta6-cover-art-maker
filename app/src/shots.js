// Fixed scenes for screenshots, driven by the query string:
// ?shot=cover&photo=pier&caption=Sunset%20Heist&layout=split&grade=sunset&size=wide
// ?shot=editor&photo=boulevard&caption=Boulevard%20Queen&layout=grid&grade=neon
// `photo` picks the sample for panel 1 (and the other sample for panel 2).
// window.__shotReady is set once the scene has painted.
export async function runShot(query, state, photos, setPhoto, redraw) {
  const photo = query.get('photo') ?? 'pier';
  const other = photo === 'pier' ? 'boulevard' : 'pier';
  state.title = query.get('caption') ?? 'Sunset Heist';
  state.subtitle = query.get('subtitle') ?? 'One city. One night. No way back.';
  state.layout = query.get('layout') ?? 'split';
  state.grade = query.get('grade') ?? 'sunset';
  state.size = query.get('size') ?? 'portrait';
  const titleInput = document.getElementById('title');
  if (titleInput) titleInput.value = state.title;
  const subInput = document.getElementById('subtitle');
  if (subInput) subInput.value = state.subtitle;
  if (query.get('shot') === 'cover') document.body.classList.add('shot-cover');
  if (document.fonts) await document.fonts.load('80px Anton').catch(() => {});
  await setPhoto(0, `samples/${photo}.jpg`);
  await setPhoto(1, `samples/${other}.jpg`);
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
