export interface KaratePose {
  x: number;
  y: number;
  w: number;
  h: number;
}

function cells(width: number, y: number, height: number, columns = 5): KaratePose[] {
  const step = width / columns;
  return Array.from({ length: columns }, (_, index) => ({
    x: Math.round(index * step),
    y,
    w: Math.round((index + 1) * step) - Math.round(index * step),
    h: height,
  }));
}

export const KARATE_BLONDE_WALK = cells(765, 0, 265);
export const KARATE_EBONY_WALK = cells(748, 0, 265);

export const KARATE_BLONDE = {
  idle: { x: 0, y: 265, w: 153, h: 260 },
  walk: KARATE_BLONDE_WALK[0],
  run: KARATE_BLONDE_WALK[2],
  punch: { x: 612, y: 265, w: 153, h: 260 },
  hurt: { x: 306, y: 265, w: 153, h: 260 },
  down: { x: 306, y: 265, w: 153, h: 260 },
  defeated: { x: 306, y: 265, w: 153, h: 260 },
  kick: { x: 0, y: 535, w: 460, h: 489 },
  spin: { x: 265, y: 775, w: 200, h: 249 },
  highKick: { x: 465, y: 535, w: 300, h: 489 },
};

export const KARATE_EBONY = {
  idle: { x: 0, y: 265, w: 150, h: 245 },
  walk: KARATE_EBONY_WALK[0],
  run: KARATE_EBONY_WALK[2],
  punch: { x: 598, y: 265, w: 150, h: 245 },
  hurt: { x: 298, y: 265, w: 150, h: 245 },
  down: { x: 298, y: 265, w: 150, h: 245 },
  defeated: { x: 298, y: 265, w: 150, h: 245 },
  kick: { x: 0, y: 510, w: 453, h: 490 },
  spin: { x: 242, y: 737, w: 239, h: 263 },
  highKick: { x: 451, y: 505, w: 297, h: 495 },
};

export const KARATE_BLONDE_ATTACKS = [
  KARATE_BLONDE.punch,
  { x: 459, y: 265, w: 153, h: 260 },
  KARATE_BLONDE.kick,
  KARATE_BLONDE.spin,
  KARATE_BLONDE.kick,
];
export const KARATE_EBONY_ATTACKS = [
  KARATE_EBONY.punch,
  { x: 448, y: 265, w: 150, h: 245 },
  KARATE_EBONY.kick,
  KARATE_EBONY.spin,
  KARATE_EBONY.highKick,
];

const MINERVA_SCALE_X = 428 / 765;
const MINERVA_SCALE_Y = 572 / 1024;
function scaleMinervaPose(pose: KaratePose): KaratePose {
  return {
    x: Math.round(pose.x * MINERVA_SCALE_X),
    y: Math.round(pose.y * MINERVA_SCALE_Y),
    w: Math.round(pose.w * MINERVA_SCALE_X),
    h: Math.round(pose.h * MINERVA_SCALE_Y),
  };
}

/** Coordinates for Minerva's compact 428×572 sheet, mapped from the same layout. */
export const MINERVA = {
  idle: scaleMinervaPose(KARATE_BLONDE.idle),
  walk: KARATE_BLONDE_WALK.map(scaleMinervaPose),
  run: scaleMinervaPose(KARATE_BLONDE.run),
  punch: scaleMinervaPose(KARATE_BLONDE.punch),
  hurt: scaleMinervaPose(KARATE_BLONDE.hurt),
  down: scaleMinervaPose(KARATE_BLONDE.down),
  defeated: scaleMinervaPose(KARATE_BLONDE.defeated),
  kick: scaleMinervaPose(KARATE_BLONDE.kick),
  spin: scaleMinervaPose(KARATE_BLONDE.spin),
  highKick: scaleMinervaPose(KARATE_BLONDE.highKick),
};
export const MINERVA_ATTACKS = KARATE_BLONDE_ATTACKS.map(scaleMinervaPose);
export const MINERVA_WALK = MINERVA.walk;

export const MAY_IDLE_FRAMES: KaratePose[] = [
  { x: 0, y: 38, w: 192, h: 278 },
  { x: 192, y: 38, w: 190, h: 278 },
  { x: 382, y: 38, w: 191, h: 278 },
  { x: 573, y: 38, w: 192, h: 278 },
];

/** Walk row of the May sheet (second row): stride + forward lunge, mixed with idle. */
export const MAY_WALK_FRAMES: KaratePose[] = [
  MAY_IDLE_FRAMES[0],
  { x: 175, y: 390, w: 190, h: 250 },
  MAY_IDLE_FRAMES[2],
  { x: 540, y: 390, w: 210, h: 250 },
];
export const MAY_ATTACKS: KaratePose[] = [
  MAY_IDLE_FRAMES[1], // Guard-frame lunge; the sheet has no dedicated punch drawing
  MAY_IDLE_FRAMES[2],
  MAY_IDLE_FRAMES[3], // Upper-body strike pose
  { x: 184, y: 382, w: 190, h: 270 }, // Low-kick preparation
  { x: 0, y: 382, w: 230, h: 292 }, // Front kick
  { x: 400, y: 352, w: 225, h: 292 }, // High roundhouse
  { x: 190, y: 680, w: 220, h: 344 }, // Spinning follow-through
  { x: 610, y: 394, w: 155, h: 250 }, // Side/sweeping kick
];

export const MAY = {
  idle: MAY_IDLE_FRAMES[0],
  walk: MAY_WALK_FRAMES[1],
  run: MAY_WALK_FRAMES[3],
  punch: MAY_ATTACKS[0],
  hurt: MAY_ATTACKS[3],
  down: MAY_ATTACKS[3],
  defeated: MAY_ATTACKS[3],
  kick: MAY_ATTACKS[4],
  spin: MAY_ATTACKS[5],
  highKick: MAY_ATTACKS[6],
  block: MAY_IDLE_FRAMES[3],
};

function gridFrames(
  columns: number,
  rows: number,
  width: number,
  height: number,
  topInset: number,
): KaratePose[] {
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  return Array.from({ length: columns * rows }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = Math.round(column * cellWidth);
    const y = Math.round(row * cellHeight + topInset);
    const right = Math.round((column + 1) * cellWidth);
    const bottom = Math.round((row + 1) * cellHeight);
    return { x, y, w: right - x, h: bottom - y };
  });
}

function countTransparentPixels(pixels: Uint8ClampedArray) {
  let count = 0;
  for (let offset = 3; offset < pixels.length; offset += 4) {
    if (pixels[offset] < 20) count += 1;
  }
  return count;
}

function sheetHasRealAlpha(pixels: Uint8ClampedArray, width: number, height: number) {
  return countTransparentPixels(pixels) > width * height * 0.12;
}

/** Drop leftover Photoshop gray/white checker without touching dark outlines. */
export function dropLightCheckerIslands(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return canvas;
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  const width = canvas.width;
  const height = canvas.height;
  const isLightChecker = (offset: number) => {
    const red = data[offset], green = data[offset + 1], blue = data[offset + 2];
    const chroma = Math.max(red, green, blue) - Math.min(red, green, blue);
    const luma = (red + green + blue) / 3;
    return data[offset + 3] >= 20 && chroma < 22 && luma >= 168;
  };
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  for (let start = 0; start < seen.length; start += 1) {
    if (seen[start] || !isLightChecker(start * 4)) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    seen[start] = 1;
    while (head < tail) {
      const point = queue[head++];
      const x = point % width, y = Math.floor(point / width);
      const neighbors = [point - 1, point + 1, point - width, point + width];
      const valid = [
        x > 0, x + 1 < width, y > 0, y + 1 < height,
      ];
      for (let i = 0; i < 4; i += 1) {
        if (!valid[i]) continue;
        const next = neighbors[i];
        if (seen[next] || !isLightChecker(next * 4)) continue;
        seen[next] = 1;
        queue[tail++] = next;
      }
    }
    if (tail >= 16) {
      for (let i = 0; i < tail; i += 1) data[queue[i] * 4 + 3] = 0;
    }
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

export function karateBlondeSequenceFrames(width: number, height: number): KaratePose[] {
  const cellWidth = width / 3;
  const titleInset = 0;
  const x = [0, 1, 2].map((column) => Math.round(column * cellWidth));
  const right = [1, 2, 3].map((column) => Math.round(column * cellWidth));
  const top: KaratePose[] = x.map((left, index) => ({
    x: left, y: titleInset, w: right[index] - left,
    h: Math.max(1, Math.round(height / 2) - titleInset),
  }));
  const bottom: KaratePose[] = x.map((left, index) => ({
    x: left, y: Math.round(height / 2) + titleInset,
    w: right[index] - left, h: Math.max(1, height - Math.round(height / 2) - titleInset),
  }));
  return [...top, ...bottom];
}

export function karateEbonySequenceFrames(width: number, height: number): KaratePose[] {
  // The storyboard is not an evenly spaced grid: the third row's heads
  // begin above y=500. Uniform 250px cells cut those heads off.
  const rows = [0, 230, 475, 710, 1000].map((y) => Math.round(y * height / 1000));
  return rows.slice(0, -1).flatMap((y, row) => [0, 1].map((column) => ({
    x: Math.round(column * width / 2),
    y,
    w: Math.round((column + 1) * width / 2) - Math.round(column * width / 2),
    h: rows[row + 1] - y,
  })));
}

/** Solo Ebony plays the 8-panel takedown, then the 4-panel submission sheet. */
export function karateEbonyPunishmentSequence(
  takedownWidth: number,
  takedownHeight: number,
  submissionWidth: number,
  submissionHeight: number,
): { sheet: 'takedown' | 'submission'; frame: KaratePose }[] {
  return [
    ...karateEbonySequenceFrames(takedownWidth, takedownHeight).map((frame) => ({
      sheet: 'takedown' as const,
      frame,
    })),
    ...karateDuoSequenceFrames(submissionWidth, submissionHeight).map((frame) => ({
      sheet: 'submission' as const,
      frame,
    })),
  ];
}

export const KARATE_EBONY_PUNISHMENT_COUNT = 12;
export const KARATE_EBONY_DEFEAT_DURATION = 14;
export const KARATE_BLONDE_DEFEAT_DURATION = 16;

/** Isolate a single combat pose, never an adjacent figure in the collage. */
export function extractKarateCombatPose(sheet: HTMLCanvasElement, frame: KaratePose) {
  const canvas = document.createElement('canvas');
  canvas.width = frame.w;
  canvas.height = frame.h;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D indisponível para recortar o golpe.');
  context.drawImage(sheet, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);
  const image = context.getImageData(0, 0, frame.w, frame.h);
  const visited = new Uint8Array(frame.w * frame.h);
  let largest: number[] = [];
  for (let seed = 0; seed < visited.length; seed++) {
    if (visited[seed] || image.data[seed * 4 + 3] < 32) continue;
    visited[seed] = 1;
    const component: number[] = [];
    const stack = [seed];
    while (stack.length) {
      const point = stack.pop()!;
      component.push(point);
      const x = point % frame.w, y = Math.floor(point / frame.w);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= frame.w || ny >= frame.h) continue;
        const neighbor = ny * frame.w + nx;
        if (visited[neighbor]) continue;
        visited[neighbor] = 1;
        if (image.data[neighbor * 4 + 3] >= 32) stack.push(neighbor);
      }
    }
    if (component.length > largest.length) largest = component;
  }
  const keep = new Uint8Array(visited.length);
  largest.forEach((point) => { keep[point] = 1; });
  for (let point = 0; point < keep.length; point++) {
    if (!keep[point]) image.data[point * 4 + 3] = 0;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

export function extractKarateEbonyTaunt(sheet: HTMLCanvasElement): HTMLCanvasElement {
  const cellWidth = Math.round(sheet.width / 2);
  const cellHeight = Math.round(sheet.height / 4);
  const topInset = Math.round(cellHeight * 0.2);
  const width = Math.min(Math.round(cellWidth * 0.65), cellWidth);
  const height = Math.max(1, cellHeight - topInset);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D indisponível para a provocação da Ebony.');
  // The first storyboard cell contains both fighters. Crop its left side so the
  // taunt is a standalone Ebony sprite rather than a miniature pair scene.
  context.drawImage(sheet, 0, topInset, width, height, 0, 0, width, height);
  return canvas;
}

export function karateDuoSequenceFrames(width: number, height: number): KaratePose[] {
  return gridFrames(2, 2, width, height, 0);
}

/** May's storyboard has a wide caption gap between its two rows. */
export function mayStorySequenceFrames(width: number, height: number): KaratePose[] {
  const halfWidth = Math.round(width / 2);
  const scaleY = height / 572;
  return [
    { x: 0, y: Math.round(70 * scaleY), w: halfWidth, h: Math.round(240 * scaleY) },
    { x: halfWidth, y: Math.round(65 * scaleY), w: width - halfWidth, h: Math.round(245 * scaleY) },
    { x: 0, y: Math.round(310 * scaleY), w: halfWidth, h: height - Math.round(310 * scaleY) },
    { x: halfWidth, y: Math.round(350 * scaleY), w: width - halfWidth, h: height - Math.round(350 * scaleY) },
  ];
}

export function prepareKarateSheet(image: HTMLImageElement, checkerboard = false) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D indisponível para os sprites de karatê.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const sheet = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = sheet.data;
  if (sheetHasRealAlpha(pixels, canvas.width, canvas.height)) {
    context.putImageData(sheet, 0, 0);
    return dropLightCheckerIslands(canvas);
  }
  const edgePalette = new Map<string, { r: number; g: number; b: number; count: number }>();
  const sample = (x: number, y: number) => {
    const index = (y * canvas.width + x) * 4;
    const r = pixels[index], g = pixels[index + 1], b = pixels[index + 2];
    const bucket = [r, g, b].map((value) => Math.floor(value / 12)).join(':');
    const color = edgePalette.get(bucket) ?? { r: 0, g: 0, b: 0, count: 0 };
    color.r += r;
    color.g += g;
    color.b += b;
    color.count += 1;
    edgePalette.set(bucket, color);
  };
  const edgeStep = 5;
  for (let x = 0; x < canvas.width; x += edgeStep) {
    sample(x, 2);
    sample(x, canvas.height - 3);
  }
  for (let y = 0; y < canvas.height; y += edgeStep) {
    sample(2, y);
    sample(canvas.width - 3, y);
  }
  let backgroundTones: number[][];
  if (checkerboard) {
    const palette = new Map<string, { r: number; g: number; b: number; count: number }>();
    for (let y = 1; y < canvas.height; y += 3) {
      for (let x = 1; x < canvas.width; x += 3) {
        const index = (y * canvas.width + x) * 4;
        const r = pixels[index], g = pixels[index + 1], b = pixels[index + 2];
        const min = Math.min(r, g, b), max = Math.max(r, g, b);
        if (min < 12 || max > 125 || max - min > 10) continue;
        const bucket = [r, g, b].map((value) => Math.floor(value / 8)).join(':');
        const color = palette.get(bucket) ?? { r: 0, g: 0, b: 0, count: 0 };
        color.r += r;
        color.g += g;
        color.b += b;
        color.count += 1;
        palette.set(bucket, color);
      }
    }
    backgroundTones = [...palette.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 16)
      .map(({ r, g, b, count }) => [r / count, g / count, b / count]);
  } else {
    backgroundTones = [...edgePalette.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 1)
      .map(({ r, g, b, count }) => [r / count, g / count, b / count]);
  }

  const matchesBackground = (pixel: number) =>
    pixels[pixel + 3] > 0 &&
    Math.max(pixels[pixel], pixels[pixel + 1], pixels[pixel + 2]) -
      Math.min(pixels[pixel], pixels[pixel + 1], pixels[pixel + 2]) <= 12 &&
    backgroundTones.some(([br, bg, bb]) =>
      Math.hypot(pixels[pixel] - br, pixels[pixel + 1] - bg, pixels[pixel + 2] - bb) < 14);
  for (let pixel = 0; pixel < pixels.length; pixel += 4) {
    if (matchesBackground(pixel)) pixels[pixel + 3] = 0;
  }
  context.putImageData(sheet, 0, 0);
  // Some uploaded JPEG sheets have a white one-pixel outer border.
  // It is not part of any pose and otherwise becomes a tall floating line.
  context.clearRect(0, 0, 2, canvas.height);
  context.clearRect(canvas.width - 2, 0, 2, canvas.height);
  context.clearRect(0, 0, canvas.width, 2);
  context.clearRect(0, canvas.height - 2, canvas.width, 2);
  return dropLightCheckerIslands(canvas);
}

/** Removes the pale gray isometric guide grid while preserving outlined gi sprites. */
export function prepareMaySheet(image: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D indisponível para a folha da May.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  if (sheetHasRealAlpha(pixels, canvas.width, canvas.height)) {
    context.putImageData(imageData, 0, 0);
    return canvas;
  }
  const pixelCount = canvas.width * canvas.height;
  const candidates = new Uint8Array(pixelCount);
  const visited = new Uint8Array(pixelCount);
  const queue = new Uint32Array(pixelCount);
  for (let index = 0; index < pixelCount; index += 1) {
    const offset = index * 4;
    const red = pixels[offset], green = pixels[offset + 1], blue = pixels[offset + 2];
    const min = Math.min(red, green, blue);
    const max = Math.max(red, green, blue);
    candidates[index] = Number(min >= 175 && max <= 248 && max - min <= 26);
  }

  let tail = 0;
  const enqueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
    const index = y * canvas.width + x;
    if (visited[index] || pixels[index * 4 + 3] < 20 || !candidates[index]) return;
    visited[index] = 1;
    queue[tail++] = index;
  };
  for (let x = 0; x < canvas.width; x += 1) {
    enqueue(x, 0);
    enqueue(x, canvas.height - 1);
  }
  for (let y = 1; y < canvas.height - 1; y += 1) {
    enqueue(0, y);
    enqueue(canvas.width - 1, y);
  }
  for (let head = 0; head < tail; head += 1) {
    const index = queue[head];
    const x = index % canvas.width;
    const y = Math.floor(index / canvas.width);
    pixels[index * 4 + 3] = 0;
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }
  context.putImageData(imageData, 0, 0);
  return canvas;
}

/** Flood-fills the neutral dark checkerboard on Minerva's story sheet per panel. */
export function prepareMinervaStorySheet(image: HTMLImageElement, frames: KaratePose[]) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D indisponível para as cenas da Minerva.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  if (sheetHasRealAlpha(pixels, canvas.width, canvas.height)) {
    context.putImageData(imageData, 0, 0);
    return canvas;
  }
  const pixelCount = canvas.width * canvas.height;
  const candidates = new Uint8Array(pixelCount);
  const visited = new Uint8Array(pixelCount);
  const queue = new Uint32Array(pixelCount);
  for (let index = 0; index < pixelCount; index += 1) {
    const offset = index * 4;
    const red = pixels[offset], green = pixels[offset + 1], blue = pixels[offset + 2];
    const min = Math.min(red, green, blue);
    const max = Math.max(red, green, blue);
    candidates[index] = Number(min >= 24 && max <= 125 && max - min <= 24);
  }

  let tail = 0;
  const enqueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
    const index = y * canvas.width + x;
    if (visited[index] || pixels[index * 4 + 3] < 20 || !candidates[index]) return;
    visited[index] = 1;
    queue[tail++] = index;
  };
  for (const frame of frames) {
    const left = Math.max(0, Math.round(frame.x));
    const top = Math.max(0, Math.round(frame.y));
    const right = Math.min(canvas.width - 1, Math.round(frame.x + frame.w) - 1);
    const bottom = Math.min(canvas.height - 1, Math.round(frame.y + frame.h) - 1);
    for (let x = left; x <= right; x += 1) {
      enqueue(x, top);
      enqueue(x, bottom);
    }
    for (let y = top + 1; y < bottom; y += 1) {
      enqueue(left, y);
      enqueue(right, y);
    }
  }
  for (let head = 0; head < tail; head += 1) {
    const index = queue[head];
    const x = index % canvas.width;
    const y = Math.floor(index / canvas.width);
    pixels[index * 4 + 3] = 0;
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }
  context.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * The Ebony duo storyboard uses an olive/charcoal checkerboard rather than
 * the neutral gray used by the other karate sheets. Flood-fill the muted
 * checker colors from each frame edge so the key does not eat the figures.
 */
export type StoryboardCheckerPalette = 'ebony' | 'may' | 'laura';

export function prepareKarateDuoSheet(
  image: HTMLImageElement,
  frames: KaratePose[],
  palette: StoryboardCheckerPalette = 'ebony',
) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D indisponível para a folha em dupla da Ebony.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  if (sheetHasRealAlpha(pixels, canvas.width, canvas.height)) {
    context.putImageData(imageData, 0, 0);
    return dropLightCheckerIslands(canvas);
  }
  const pixelCount = canvas.width * canvas.height;
  const candidates = new Uint8Array(pixelCount);
  const visited = new Uint8Array(pixelCount);
  const queue = new Uint32Array(pixelCount);
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const offset = pixel * 4;
    const red = pixels[offset], green = pixels[offset + 1], blue = pixels[offset + 2];
    const nearCheckerTone = (
      tone: readonly [number, number, number],
      tolerance: number,
    ) => Math.hypot(red - tone[0], green - tone[1], blue - tone[2]) < tolerance;
    // The source uses olive-brown (#403420) and near-black green (#0c0c08)
    // squares, plus JPEG blends at their boundaries. Pure black sprite
    // outlines are intentionally outside these ranges.
    if (palette === 'may') {
      candidates[pixel] = Number(
        Math.max(red, green, blue) < 15 ||
        (red >= 20 && red <= 85 && red - green >= -3 && red - green <= 8 &&
          green - blue >= 5 && green - blue <= 27));
    } else if (palette === 'laura') {
      candidates[pixel] = Number(
        Math.max(red, green, blue) < 12 ||
        nearCheckerTone([20, 20, 19], 15) ||
        nearCheckerTone([81, 80, 76], 18) ||
        nearCheckerTone([50, 50, 48], 14));
    } else {
      candidates[pixel] = Number(
        nearCheckerTone([12, 12, 8], 12) ||
        nearCheckerTone([36, 32, 16], 14) ||
        nearCheckerTone([64, 52, 32], 17));
    }
  }

  let tail = 0;
  const enqueueIfBackground = (x: number, y: number) => {
    const pixel = y * canvas.width + x;
    if (!visited[pixel] && pixels[pixel * 4 + 3] >= 20 && candidates[pixel]) {
      visited[pixel] = 1;
      queue[tail++] = pixel;
    }
  };
  for (const frame of frames) {
    const left = Math.max(0, Math.round(frame.x));
    const top = Math.max(0, Math.round(frame.y));
    const right = Math.min(canvas.width - 1, Math.round(frame.x + frame.w) - 1);
    const bottom = Math.min(canvas.height - 1, Math.round(frame.y + frame.h) - 1);
    for (let x = left; x <= right; x += 1) {
      enqueueIfBackground(x, top);
      enqueueIfBackground(x, bottom);
    }
    for (let y = top + 1; y < bottom; y += 1) {
      enqueueIfBackground(left, y);
      enqueueIfBackground(right, y);
    }
  }

  for (let head = 0; head < tail; head += 1) {
    const pixel = queue[head];
    const x = pixel % canvas.width;
    if (x > 0) enqueueIfBackground(x - 1, Math.floor(pixel / canvas.width));
    if (x + 1 < canvas.width) enqueueIfBackground(x + 1, Math.floor(pixel / canvas.width));
    if (pixel >= canvas.width) enqueueIfBackground(x, Math.floor(pixel / canvas.width) - 1);
    if (pixel + canvas.width < pixelCount) enqueueIfBackground(x, Math.floor(pixel / canvas.width) + 1);
    pixels[pixel * 4 + 3] = 0;
  }
  if (palette === 'may') {
    visited.fill(0);
    for (const frame of frames) {
      const left = Math.round(frame.x), top = Math.round(frame.y);
      const right = Math.min(canvas.width, left + Math.round(frame.w));
      const bottom = Math.min(canvas.height, top + Math.round(frame.h));
      for (let y = top; y < bottom; y += 1) {
        for (let x = left; x < right; x += 1) {
          const seed = y * canvas.width + x;
          if (visited[seed] || pixels[seed * 4 + 3] < 20) continue;
          let end = 1;
          let hasForegroundColor = false;
          queue[0] = seed;
          visited[seed] = 1;
          const add = (nx: number, ny: number) => {
            if (nx < left || nx >= right || ny < top || ny >= bottom) return;
            const next = ny * canvas.width + nx;
            if (visited[next] || pixels[next * 4 + 3] < 20) return;
            visited[next] = 1;
            queue[end++] = next;
          };
          for (let head = 0; head < end; head += 1) {
            const current = queue[head];
            const offset = current * 4;
            if (Math.max(pixels[offset], pixels[offset + 1], pixels[offset + 2]) > 95) {
              hasForegroundColor = true;
            }
            const cx = current % canvas.width, cy = Math.floor(current / canvas.width);
            add(cx - 1, cy); add(cx + 1, cy); add(cx, cy - 1); add(cx, cy + 1);
          }
          if (!hasForegroundColor || end < 20) {
            for (let index = 0; index < end; index += 1) pixels[queue[index] * 4 + 3] = 0;
          }
        }
      }
    }
  }
  context.putImageData(imageData, 0, 0);
  return canvas;
}

export function removeStoryboardHeadings(
  canvas: HTMLCanvasElement,
  frames: KaratePose[],
  headerHeight = 44,
  footerHeight = 0,
) {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D indisponível para limpar as legendas.');
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = image.data;

  for (const frame of frames) {
    const width = Math.max(0, Math.round(frame.w));
    const height = Math.max(0, Math.round(frame.h));
    const startX = Math.max(0, Math.round(frame.x));
    const startY = Math.max(0, Math.round(frame.y));
    const visited = new Uint8Array(width * height);
    const stack: number[] = [];
    for (let localY = 0; localY < height; localY += 1) {
      for (let localX = 0; localX < width; localX += 1) {
        const seed = localY * width + localX;
        if (visited[seed]) continue;
        visited[seed] = 1;
        const seedPixel = ((startY + localY) * canvas.width + startX + localX) * 4;
        if (pixels[seedPixel + 3] < 20) continue;

        const component: number[] = [];
        let highestY = localY;
        let lowestY = localY;
        stack.push(seed);
        while (stack.length) {
          const index = stack.pop()!;
          component.push(index);
          const x = index % width;
          const y = Math.floor(index / width);
          highestY = Math.min(highestY, y);
          lowestY = Math.max(lowestY, y);
          for (let dy = -1; dy <= 1; dy += 1) {
            for (let dx = -1; dx <= 1; dx += 1) {
              if (!dx && !dy) continue;
              const nx = x + dx, ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
              const neighbor = ny * width + nx;
              if (visited[neighbor]) continue;
              const neighborPixel = ((startY + ny) * canvas.width + startX + nx) * 4;
              if (pixels[neighborPixel + 3] < 20) {
                visited[neighbor] = 1;
                continue;
              }
              visited[neighbor] = 1;
              stack.push(neighbor);
            }
          }
        }
        const inHeadingBand = lowestY < headerHeight;
        const inFooterBand = footerHeight > 0 && highestY >= height - footerHeight;
        const colorfulPixels = component.reduce((count, localIndex) => {
          const x = localIndex % width, y = Math.floor(localIndex / width);
          const pixel = ((startY + y) * canvas.width + startX + x) * 4;
          const colors = [pixels[pixel], pixels[pixel + 1], pixels[pixel + 2]];
          return count + (Math.max(...colors) - Math.min(...colors) > 18 ? 1 : 0);
        }, 0);
        // JPEG ringing around the checkerboard leaves small neutral islands.
        // Preserve the large paired silhouettes and colored effects, not debris.
        const neutralDebris = component.length < 180 && colorfulPixels < component.length * 0.12;
        if (inHeadingBand || inFooterBand || component.length < 20 || neutralDebris) {
          for (const localIndex of component) {
            const x = localIndex % width;
            const y = Math.floor(localIndex / width);
            const pixel = ((startY + y) * canvas.width + startX + x) * 4;
            pixels[pixel + 3] = 0;
          }
        }
      }
    }
  }
  context.putImageData(image, 0, 0);
}

export function clearStoryboardHeaderBands(
  canvas: HTMLCanvasElement,
  frames: KaratePose[],
  headerHeight: number,
) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D indisponível para limpar as faixas de título.');
  for (const frame of frames) {
    context.clearRect(frame.x, frame.y, frame.w, Math.min(frame.h, headerHeight));
  }
}
