import type { KaratePose } from './karateSprites';

// Native coordinates of the supplied 765×1024 sheet; rows are not an equal grid.
export const LAURA_IDLE: KaratePose[] = Array.from({ length: 5 }, (_, i) => ({
  x: i * 153, y: 15, w: 153, h: 201,
}));
export const LAURA_WALK: KaratePose[] = Array.from({ length: 6 }, (_, i) => ({
  x: i * 127, y: 220, w: 127, h: 198,
}));
export const LAURA_PUNCHES: KaratePose[] = Array.from({ length: 6 }, (_, i) => ({
  x: i * 127, y: 426, w: 127, h: 193,
}));
export const LAURA_KICKS: KaratePose[] = [
  { x: 0, y: 623, w: 161, h: 205 },
  { x: 138, y: 623, w: 170, h: 205 },
  { x: 285, y: 623, w: 135, h: 205 },
  { x: 399, y: 623, w: 98, h: 205 },
  { x: 459, y: 623, w: 185, h: 205 },
  { x: 642, y: 623, w: 123, h: 205 },
];
export const LAURA_HURT: KaratePose[] = [
  { x: 0, y: 837, w: 153, h: 187 },
  { x: 145, y: 837, w: 166, h: 187 },
  { x: 278, y: 837, w: 177, h: 187 },
];
export const LAURA = {
  idle: LAURA_IDLE[0], walk: LAURA_WALK[0], run: LAURA_WALK[3],
  hurt: LAURA_HURT[0],
  down: { x: 455, y: 916, w: 202, h: 108 },
  defeated: { x: 455, y: 916, w: 202, h: 108 },
};
export const LAURA_ATTACKS = [
  LAURA_PUNCHES[1], LAURA_PUNCHES[2], LAURA_PUNCHES[5],
  ...LAURA_KICKS.slice(0, 5),
];
export const LAURA_GUARD = [LAURA_PUNCHES[0], LAURA_PUNCHES[3], LAURA_PUNCHES[4], LAURA_KICKS[5]];

export function lauraVictorySequenceFrames(width: number, height: number): KaratePose[] {
  const scaleX = width / 1024;
  const scaleY = height / 765;
  return [
    { x: 0, y: Math.round(88 * scaleY), w: Math.round(512 * scaleX), h: Math.round(282 * scaleY) },
    { x: Math.round(512 * scaleX), y: Math.round(88 * scaleY),
      w: width - Math.round(512 * scaleX), h: Math.round(282 * scaleY) },
  ];
}

/** Laura's victory storyboard uses gray (#141413 / #51504c) checkers. */
export function prepareLauraVictorySheet(
  image: HTMLImageElement,
  frames: KaratePose[],
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D indisponível para a sequência da Laura.');
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const visited = new Uint8Array(canvas.width * canvas.height);
  const queue = new Int32Array(visited.length);
  let tail = 0;
  const enqueue = (x: number, y: number, bounds: KaratePose) => {
    if (x < bounds.x || y < bounds.y || x >= bounds.x + bounds.w || y >= bounds.y + bounds.h) return;
    const p = y * canvas.width + x, o = p * 4;
    if (visited[p]) return;
    const r = pixels.data[o], g = pixels.data[o + 1], b = pixels.data[o + 2];
    if (pixels.data[o + 3] < 20 || Math.min(r, g, b) < 10 ||
        Math.max(r, g, b) > 112 || Math.max(r, g, b) - Math.min(r, g, b) > 30) return;
    visited[p] = 1;
    queue[tail++] = p;
  };
  for (const frame of frames) {
    const left = Math.round(frame.x), top = Math.round(frame.y);
    const right = Math.round(frame.x + frame.w) - 1, bottom = Math.round(frame.y + frame.h) - 1;
    for (let x = left; x <= right; x++) { enqueue(x, top, frame); enqueue(x, bottom, frame); }
    for (let y = top + 1; y < bottom; y++) { enqueue(left, y, frame); enqueue(right, y, frame); }
  }
  for (let head = 0; head < tail; head++) {
    const p = queue[head], x = p % canvas.width, y = Math.floor(p / canvas.width);
    pixels.data[p * 4 + 3] = 0;
    for (const frame of frames) {
      if (x < frame.x || x >= frame.x + frame.w || y < frame.y || y >= frame.y + frame.h) continue;
      enqueue(x - 1, y, frame); enqueue(x + 1, y, frame);
      enqueue(x, y - 1, frame); enqueue(x, y + 1, frame);
      break;
    }
  }
  // Exact source checker tones catch enclosed tiles that cannot be reached
  // from panel edges; warm/green character pixels remain outside this palette.
  for (const frame of frames) {
    for (let y = frame.y; y < frame.y + frame.h; y++) {
      for (let x = frame.x; x < frame.x + frame.w; x++) {
        const o = (y * canvas.width + x) * 4;
        const r = pixels.data[o], g = pixels.data[o + 1], b = pixels.data[o + 2];
        const tone = (tr: number, tg: number, tb: number) =>
          Math.hypot(r - tr, g - tg, b - tb) < 17;
        const midpoint = Math.max(Math.abs(r - 50), Math.abs(g - 50), Math.abs(b - 48)) < 12;
        if (tone(20, 20, 20) || tone(81, 80, 76) || midpoint) pixels.data[o + 3] = 0;
      }
    }
  }
  // Neutral checker islands trapped between outlined figures are not edge-
  // connected. Drop gray-only components while retaining connected dark linework.
  for (const frame of frames) {
    const left = Math.round(frame.x), top = Math.round(frame.y);
    const right = Math.round(frame.x + frame.w), bottom = Math.round(frame.y + frame.h);
    const seen = new Uint8Array(frame.w * frame.h);
    const component = new Int32Array(seen.length);
    for (let start = 0; start < seen.length; start++) {
      const sx = start % frame.w, sy = Math.floor(start / frame.w);
      const global = (top + sy) * canvas.width + left + sx;
      if (seen[start] || pixels.data[global * 4 + 3] < 20) continue;
      let end = 1, hasColor = false;
      component[0] = start;
      seen[start] = 1;
      for (let head = 0; head < end; head++) {
        const point = component[head], x = point % frame.w, y = Math.floor(point / frame.w);
        const p = (top + y) * canvas.width + left + x, o = p * 4;
        const r = pixels.data[o], g = pixels.data[o + 1], b = pixels.data[o + 2];
        if (Math.max(r, g, b) - Math.min(r, g, b) > 24 ||
            Math.abs(g - r) > 7 || Math.abs(b - r) > 9) hasColor = true;
        const neighbors = [x > 0 ? point - 1 : -1, x + 1 < frame.w ? point + 1 : -1,
          y > 0 ? point - frame.w : -1, y + 1 < frame.h ? point + frame.w : -1];
        for (const next of neighbors) {
          if (next < 0 || seen[next]) continue;
          const nx = next % frame.w, ny = Math.floor(next / frame.w);
          const no = ((top + ny) * canvas.width + left + nx) * 4;
          if (pixels.data[no + 3] < 20) continue;
          seen[next] = 1;
          component[end++] = next;
        }
      }
      if (!hasColor) {
        for (let i = 0; i < end; i++) {
          const point = component[i], x = point % frame.w, y = Math.floor(point / frame.w);
          pixels.data[((top + y) * canvas.width + left + x) * 4 + 3] = 0;
        }
      }
    }
    if (right > canvas.width || bottom > canvas.height) {
      throw new RangeError('Quadro da sequência da Laura está fora da folha.');
    }
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

// The kick artwork overlaps neighboring cells. These source-space masks remove
// neighboring heads/feet before connected-component isolation.
const KICK_MASKS = [
  [[0,623],[160,623],[165,653],[132,686],[112,719],[104,828],[0,828]],
  [[169,643],[230,638],[233,663],[280,646],[302,650],[300,675],[224,714],[220,828],[145,828],[159,725],[143,700],[156,676],[168,664]],
  [[302,634],[343,634],[347,682],[374,658],[376,630],[415,628],[420,655],[365,719],[365,828],[285,828],[296,727],[285,697],[305,676]],
  [[403,636],[450,631],[459,663],[481,679],[495,697],[493,752],[471,758],[462,721],[454,714],[456,828],[399,828],[415,732],[399,707]],
  [[459,648],[480,643],[496,657],[542,690],[548,650],[596,637],[628,646],[644,683],[626,724],[595,725],[585,828],[535,828],[548,723],[500,700]],
];

export function isolateLauraKick(
  sheet: HTMLCanvasElement, frame: KaratePose, index: number,
): HTMLCanvasElement {
  const result = document.createElement('canvas');
  result.width = frame.w; result.height = frame.h;
  const ctx = result.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível para o chute da Laura.');
  ctx.beginPath();
  KICK_MASKS[index].forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x - frame.x, y - frame.y);
    else ctx.lineTo(x - frame.x, y - frame.y);
  });
  ctx.closePath(); ctx.clip();
  ctx.drawImage(sheet, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);
  return result;
}

/** Remove only edge-connected black backdrop, preserving dark hair and outlines. */
export function prepareLauraSheet(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D indisponível para Laura.');
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const visited = new Uint8Array(canvas.width * canvas.height);
  const queue = new Int32Array(visited.length);
  let tail = 0;
  const add = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
    const p = y * canvas.width + x, o = p * 4;
    if (visited[p] || Math.max(data.data[o], data.data[o + 1], data.data[o + 2]) > 18) return;
    visited[p] = 1;
    queue[tail++] = p;
  };
  for (let x = 0; x < canvas.width; x++) { add(x, 0); add(x, canvas.height - 1); }
  for (let y = 0; y < canvas.height; y++) { add(0, y); add(canvas.width - 1, y); }
  for (let head = 0; head < tail; head++) {
    const p = queue[head], x = p % canvas.width, y = Math.floor(p / canvas.width);
    data.data[p * 4 + 3] = 0;
    add(x - 1, y); add(x + 1, y); add(x, y - 1); add(x, y + 1);
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}
