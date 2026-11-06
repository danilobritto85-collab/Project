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
  const scaleY = height / 572;
  return [
    { x: 0, y: Math.round(88 * scaleY), w: Math.round(512 * scaleX), h: Math.round(282 * scaleY) },
    { x: Math.round(512 * scaleX), y: Math.round(88 * scaleY),
      w: width - Math.round(512 * scaleX), h: Math.round(282 * scaleY) },
  ];
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
