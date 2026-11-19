// Vice Story cover engine: draws a multi-panel GTA-style poster onto any canvas.
// Everything is drawn in fractions of the canvas size, so the same state renders a
// live preview and a full-size export (1080x1080, 1080x1350 or 1920x1080) identically.
// All art is original vector work: a retro slitted sun, palm silhouettes, white gutters
// and a sunset / neon colour grade. No Rockstar logo, artwork or font is used anywhere.

export const LAYOUTS = {
  split: { name: 'Sunset Split', panels: 3 },
  grid: { name: 'Neon Grid', panels: 3 },
  strip: { name: 'Vice Strip', panels: 3 },
};

export const GRADES = {
  sunset: { name: 'Vice Sunset', top: '#ff9a3d', mid: '#ff5e7a', bottom: '#7b2ff7', glow: '#ffd166' },
  neon: { name: 'Neon Nights', top: '#22e6ff', mid: '#ff2fb3', bottom: '#4b1cff', glow: '#7df9ff' },
  gold: { name: 'Palm Gold', top: '#ffe08a', mid: '#ff8a3d', bottom: '#8a2b12', glow: '#fff3c4' },
  midnight: { name: 'Midnight', top: '#5e7bff', mid: '#9b2ff7', bottom: '#12061f', glow: '#c9b8ff' },
};

export const SIZES = {
  square: { name: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { name: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  wide: { name: 'Wide 1920 x 1080', w: 1920, h: 1080 },
};

/** A fresh cover state: three chapter panels, a title and a subtitle. */
export function freshState() {
  return {
    layout: 'split',
    grade: 'sunset',
    size: 'portrait',
    title: 'Sunset Heist',
    subtitle: 'One city. One night. No way back.',
    panels: [
      { photo: 0, zoom: 1, ox: 0, oy: 0, tag: '01 · Arrival' },
      { photo: 1, zoom: 1, ox: 0, oy: 0, tag: '02 · The Hustle' },
      { photo: 0, zoom: 1.15, ox: 0, oy: 0, tag: '03 · Sunset' },
    ],
  };
}

/** Panel rectangles for a layout, as fractions of the cover [x, y, w, h]. */
export function panelRects(layout, W, H) {
  const g = 0.014; // white gutter, as a fraction of the short side
  const s = Math.min(W, H);
  const gap = g * s;
  if (layout === 'grid') {
    return [
      [0, 0, W * 0.62 - gap / 2, H],
      [W * 0.62 + gap / 2, 0, W * 0.38 - gap / 2, H / 2 - gap / 2],
      [W * 0.62 + gap / 2, H / 2 + gap / 2, W * 0.38 - gap / 2, H / 2 - gap / 2],
    ];
  }
  if (layout === 'strip') {
    const pw = (W - gap * 2) / 3;
    return [
      [0, 0, pw, H],
      [pw + gap, 0, pw, H],
      [pw * 2 + gap * 2, 0, pw, H],
    ];
  }
  // split: big hero on top, two small panels along the foot.
  return [
    [0, 0, W, H * 0.62 - gap / 2],
    [0, H * 0.62 + gap / 2, W / 2 - gap / 2, H * 0.38 - gap / 2],
    [W / 2 + gap / 2, H * 0.62 + gap / 2, W / 2 - gap / 2, H * 0.38 - gap / 2],
  ];
}

/** Fits a photo into a panel like CSS cover, with the panel's zoom and pan. */
function drawPhoto(ctx, photo, rect, panel) {
  const [x, y, w, h] = rect;
  if (!photo) {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, '#3a1445');
    grad.addColorStop(1, '#12061f');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `600 ${Math.max(14, w * 0.045)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', x + w / 2, y + h / 2);
    return;
  }
  const base = Math.max(w / photo.naturalWidth, h / photo.naturalHeight) * panel.zoom;
  const pw = photo.naturalWidth * base;
  const ph = photo.naturalHeight * base;
  const cx = x + (w - pw) / 2 + panel.ox * w;
  const cy = y + (h - ph) / 2 + panel.oy * h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = '#12061f';
  ctx.fillRect(x, y, w, h);
  ctx.filter = 'saturate(1.25) contrast(1.08)';
  ctx.drawImage(photo, cx, cy, pw, ph);
  ctx.filter = 'none';
  ctx.restore();
}

/** Washes a panel with the chosen colour grade, warm at the top, deep at the foot. */
function gradePanel(ctx, rect, grade) {
  const [x, y, w, h] = rect;
  const wash = ctx.createLinearGradient(x, y, x, y + h);
  wash.addColorStop(0, grade.top + '00');
  wash.addColorStop(0.55, grade.mid + '2e');
  wash.addColorStop(1, grade.bottom + '73');
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
  const shade = ctx.createLinearGradient(x, y + h * 0.55, x, y + h);
  shade.addColorStop(0, 'rgba(10,4,24,0)');
  shade.addColorStop(1, 'rgba(10,4,24,0.45)');
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, w, h);
}

/** A retro sun: a glowing disc cut by horizontal slits, drawn in the hero panel. */
function drawRetroSun(ctx, cx, cy, r, grade) {
  ctx.save();
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.9);
  glow.addColorStop(0, grade.glow + 'aa');
  glow.addColorStop(1, grade.glow + '00');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const sun = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  sun.addColorStop(0, '#ffe66d');
  sun.addColorStop(0.5, grade.top);
  sun.addColorStop(1, grade.mid);
  ctx.fillStyle = sun;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.globalCompositeOperation = 'destination-out';
  let slitY = cy + r * 0.08;
  let slitH = r * 0.05;
  while (slitY < cy + r) {
    ctx.fillRect(cx - r, slitY, r * 2, slitH);
    slitY += slitH + r * 0.13;
    slitH += r * 0.035;
  }
  ctx.restore();
}

/** A small chapter pill in a panel's top corner. */
function drawTag(ctx, rect, text) {
  const [x, y, w] = rect;
  if (!text) return;
  const size = Math.max(13, w * 0.038);
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  const tw = ctx.measureText(text.toUpperCase()).width;
  const pad = size * 0.7;
  const bx = x + size * 0.7;
  const by = y + size * 0.7;
  ctx.fillStyle = 'rgba(10,4,24,0.82)';
  ctx.beginPath();
  ctx.roundRect(bx, by, tw + pad * 2, size * 2.1, size);
  ctx.fill();
  ctx.fillStyle = '#ffe66d';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), bx + pad, by + size * 1.08);
  ctx.textBaseline = 'alphabetic';
}

/** The big title: Anton, gradient-filled, black-outlined, with a hard shadow. */
function drawTitle(ctx, W, H, state, grade) {
  const bandH = H * (state.layout === 'strip' ? 0.27 : 0.24);
  const bandY = H - bandH;
  const band = ctx.createLinearGradient(0, bandY, 0, H);
  band.addColorStop(0, 'rgba(12,4,26,0.25)');
  band.addColorStop(1, 'rgba(12,4,26,0.92)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, W, bandH);

  const title = (state.title || 'VICE STORY').toUpperCase();
  let size = H * 0.105;
  ctx.font = `${size}px Anton, sans-serif`;
  while (ctx.measureText(title).width > W * 0.92 && size > 20) {
    size -= 4;
    ctx.font = `${size}px Anton, sans-serif`;
  }
  const tx = W / 2;
  const ty = bandY + bandH * 0.44;
  const fill = ctx.createLinearGradient(0, ty - size, 0, ty + size * 0.15);
  fill.addColorStop(0, '#ffffff');
  fill.addColorStop(0.55, grade.glow);
  fill.addColorStop(1, grade.mid);
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = size * 0.12;
  ctx.shadowOffsetY = size * 0.05;
  ctx.strokeStyle = '#12061f';
  ctx.lineWidth = size * 0.11;
  ctx.strokeText(title, tx, ty);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = fill;
  ctx.fillText(title, tx, ty);

  const sub = (state.subtitle || '').trim().toUpperCase();
  if (sub) {
    const ss = Math.max(14, H * 0.02);
    ctx.font = `700 ${ss}px system-ui, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sub, tx, ty + size * 0.42);
  }
  // Bottom credit strip.
  const cs = Math.max(12, H * 0.015);
  ctx.font = `700 ${cs}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('★  STARRING YOU  ·  VICE CITY  ·  EP. 01  ★', tx, H - H * 0.016);
}

/** Draws the whole cover. `photos` is an array of loaded images (or nulls). */
export function drawCover(canvas, photos, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.fillStyle = '#f5efe6';
  ctx.fillRect(0, 0, W, H);
  const rects = panelRects(state.layout, W, H);
  const s = Math.min(W, H);
  rects.forEach((rect, i) => {
    const panel = state.panels[i];
    drawPhoto(ctx, photos[panel.photo] ?? null, rect, panel);
    gradePanel(ctx, rect, grade);
    drawTag(ctx, rect, panel.tag);
  });
  // Retro sun in the hero panel's sky corner: top-right, except in the strip
  // layout, where the hero is a narrow panel and the sky sits top-left.
  const hero = rects[0];
  const sunR = Math.min(hero[2], hero[3]) * 0.12;
  const sunX = state.layout === 'strip' ? hero[0] + hero[2] * 0.14 : hero[0] + hero[2] * 0.88;
  drawRetroSun(ctx, sunX, hero[1] + hero[3] * 0.15, sunR, grade);
  drawTitle(ctx, W, H, state, grade);
  return rects;
}
