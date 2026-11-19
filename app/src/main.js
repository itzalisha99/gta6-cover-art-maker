// Vice Story wiring: photos in, panels cropped, caption typed, PNG out.
// Three steps: 1) add photos (or tap a sample), 2) pick a layout and grade,
// 3) export in one of three post sizes. Photos are read on this machine only.
import { drawCover, freshState, GRADES, LAYOUTS, panelRects, SIZES } from './cover.js';

const state = freshState();
const photos = [null, null, null];
const preview = document.getElementById('preview');
const status = document.getElementById('status');
let selectedPanel = 0;

const $ = (id) => document.getElementById(id);

function redraw() {
  preview.width = 720;
  preview.height = Math.round(720 * (SIZES[state.size].h / SIZES[state.size].w));
  drawCover(preview, photos, state);
  syncPanelControls();
}

function note(text) {
  status.textContent = text;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function setPhoto(slot, fileOrUrl) {
  const img = typeof fileOrUrl === 'string' ? await loadImage(fileOrUrl) : await loadImage(URL.createObjectURL(fileOrUrl));
  photos[slot] = img;
  // Every panel pointing at this slot updates at once.
  redraw();
  note(`Photo ${slot + 1} loaded — drag its sliders to crop it.`);
}

function buildButtons(box, items, current, onPick) {
  box.innerHTML = '';
  Object.entries(items).forEach(([key, item]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (key === current ? ' on' : '');
    b.textContent = item.name;
    b.addEventListener('click', () => { onPick(key); buildButtons(box, items, key, onPick); redraw(); });
    box.appendChild(b);
  });
}

function syncPanelControls() {
  const panel = state.panels[selectedPanel];
  $('zoom').value = panel.zoom;
  $('panx').value = panel.ox;
  $('pany').value = panel.oy;
  $('tag').value = panel.tag;
  $('zoomVal').textContent = `${Math.round(panel.zoom * 100)}%`;
  document.querySelectorAll('#panelTabs button').forEach((b, i) => b.classList.toggle('on', i === selectedPanel));
  $('panelName').textContent = `Panel ${selectedPanel + 1} — ${panel.tag}`;
}

// Photo pickers: one file input per slot, plus "one photo for all panels".
[0, 1, 2].forEach((slot) => {
  $(`photo${slot}`).addEventListener('change', async (e) => {
    if (e.target.files[0]) await setPhoto(slot, e.target.files[0]);
  });
});
$('fillAll').addEventListener('click', () => {
  const first = photos.find((p) => p);
  if (!first) { note('Add a photo first, then fill all panels with it.'); return; }
  state.panels.forEach((p) => { p.photo = photos.indexOf(first); });
  redraw();
  note('All three panels now use the same photo — different crops each.');
});
$('samplePier').addEventListener('click', async () => { await setPhoto(0, 'samples/pier.jpg'); await setPhoto(1, 'samples/boulevard.jpg'); });
$('sampleBoulevard').addEventListener('click', async () => { await setPhoto(0, 'samples/boulevard.jpg'); await setPhoto(1, 'samples/pier.jpg'); });

// Panel tabs and crop sliders.
const tabs = $('panelTabs');
state.panels.forEach((_, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.textContent = `Panel ${i + 1}`;
  b.addEventListener('click', () => { selectedPanel = i; syncPanelControls(); redraw(); });
  tabs.appendChild(b);
});
$('zoom').addEventListener('input', (e) => { state.panels[selectedPanel].zoom = Number(e.target.value); redraw(); });
$('panx').addEventListener('input', (e) => { state.panels[selectedPanel].ox = Number(e.target.value); redraw(); });
$('pany').addEventListener('input', (e) => { state.panels[selectedPanel].oy = Number(e.target.value); redraw(); });
$('tag').addEventListener('input', (e) => { state.panels[selectedPanel].tag = e.target.value; redraw(); });

// Click the preview to pick the panel under the cursor.
preview.addEventListener('click', (e) => {
  const box = preview.getBoundingClientRect();
  const x = (e.clientX - box.left) / box.width * preview.width;
  const y = (e.clientY - box.top) / box.height * preview.height;
  const rects = panelRects(state.layout, preview.width, preview.height);
  const hit = rects.findIndex(([rx, ry, rw, rh]) => x >= rx && x <= rx + rw && y >= ry && y <= ry + rh);
  if (hit >= 0) { selectedPanel = hit; syncPanelControls(); note(`Panel ${hit + 1} selected — crop it with the sliders.`); }
});

// Caption, layout, grade and size.
$('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
buildButtons($('layouts'), LAYOUTS, state.layout, (k) => { state.layout = k; });
buildButtons($('grades'), GRADES, state.grade, (k) => { state.grade = k; });
buildButtons($('sizes'), SIZES, state.size, (k) => { state.size = k; });

// Export: render the same state at full post size and download the PNG.
$('export').addEventListener('click', () => {
  const size = SIZES[state.size];
  const out = document.createElement('canvas');
  out.width = size.w;
  out.height = size.h;
  drawCover(out, photos, state);
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-story-${size.w}x${size.h}.png`;
    a.click();
    note(`Saved vice-story-${size.w}x${size.h}.png — share it anywhere.`);
  }, 'image/png');
});

/** Lets a screenshot scene export the exact PNG the app writes. */
window.__exportPNG = async () => {
  const size = SIZES[state.size];
  const out = document.createElement('canvas');
  out.width = size.w;
  out.height = size.h;
  drawCover(out, photos, state);
  return new Promise((resolve) => out.toBlob((b) => resolve(b), 'image/png'));
};
window.__viceState = state;
window.__vicePhotos = photos;

const query = new URLSearchParams(location.search);
if (query.get('shot')) {
  const { runShot } = await import('./shots.js');
  await runShot(query, state, photos, setPhoto, redraw);
} else {
  // Wait for Anton so the first preview already has the real lettering.
  if (document.fonts) await document.fonts.load('80px Anton').catch(() => {});
  redraw();
  note('Add a photo, or tap a sample, then export your cover.');
}
