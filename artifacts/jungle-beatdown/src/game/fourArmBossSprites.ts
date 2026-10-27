export interface FourArmFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const FOUR_ARM_SHEET_SIZE = { width: 428, height: 571 } as const;

// The single-character sheet is irregular. These regions follow the visible
// pose centers rather than pretending every row is a perfectly even grid.
export const FOUR_ARM_WALK_FRAMES: FourArmFrame[] = [
  { x: 0, y: 0, w: 100, h: 151 },
  { x: 94, y: 0, w: 91, h: 151 },
  { x: 181, y: 0, w: 91, h: 151 },
  { x: 268, y: 0, w: 88, h: 151 },
  { x: 351, y: 0, w: 77, h: 151 },
];

export const FOUR_ARM_IDLE: FourArmFrame = { x: 267, y: 286, w: 161, h: 285 };
export const FOUR_ARM_PUNCH_FRAMES: FourArmFrame[] = [
  { x: 12, y: 151, w: 132, h: 135 },
  { x: 128, y: 151, w: 137, h: 135 },
  { x: 250, y: 151, w: 137, h: 135 },
];
export const FOUR_ARM_HIGH_KICK: FourArmFrame = { x: 0, y: 286, w: 266, h: 285 };
export const FOUR_ARM_SPIN_KICK: FourArmFrame = { x: 142, y: 423, w: 124, h: 148 };

// Storyboard headings are outside these panels so only the artwork is shown.
export const FOUR_ARM_STORY_FRAMES: FourArmFrame[] = [
  { x: 0, y: 32, w: 214, h: 231 },   // kneeling
  { x: 214, y: 32, w: 214, h: 231 }, // bowing
  { x: 0, y: 287, w: 214, h: 284 },  // submission
  { x: 214, y: 287, w: 214, h: 284 },// accepted ending pose
];

export function fourArmStoryFrameIndex(
  elapsed: number,
  duration: number,
  complete = false,
) {
  if (complete) return FOUR_ARM_STORY_FRAMES.length - 1;
  const safeElapsed = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 1;
  return Math.min(
    FOUR_ARM_STORY_FRAMES.length - 1,
    Math.floor(safeElapsed / (safeDuration / FOUR_ARM_STORY_FRAMES.length)),
  );
}

function isNeutralBackground(r: number, g: number, b: number, checkerboard: boolean) {
  const range = Math.max(r, g, b) - Math.min(r, g, b);
  const brightness = (r + g + b) / 3;
  return checkerboard
    ? range <= 24 && brightness >= 58 && brightness <= 218
    : range <= 12 && brightness >= 92 && brightness <= 232;
}

function clearEdgeConnectedBackground(
  context: CanvasRenderingContext2D,
  rect: FourArmFrame,
  checkerboard: boolean,
) {
  const frame = context.getImageData(rect.x, rect.y, rect.w, rect.h);
  const pixels = frame.data;
  const count = rect.w * rect.h;
  const background = new Uint8Array(count);
  const visited = new Uint8Array(count);
  const queue = new Uint32Array(count);
  let tail = 0;

  for (let pixel = 0, offset = 0; pixel < count; pixel += 1, offset += 4) {
    background[pixel] = isNeutralBackground(
      pixels[offset], pixels[offset + 1], pixels[offset + 2], checkerboard,
    ) ? 1 : 0;
  }
  const enqueue = (pixel: number) => {
    if (background[pixel] && !visited[pixel]) {
      visited[pixel] = 1;
      queue[tail++] = pixel;
    }
  };
  for (let x = 0; x < rect.w; x += 1) {
    enqueue(x);
    enqueue((rect.h - 1) * rect.w + x);
  }
  for (let y = 1; y < rect.h - 1; y += 1) {
    enqueue(y * rect.w);
    enqueue(y * rect.w + rect.w - 1);
  }

  // Eight-way flood fill joins the alternating squares of the checkerboard.
  for (let head = 0; head < tail; head += 1) {
    const pixel = queue[head];
    const x = pixel % rect.w;
    const y = Math.floor(pixel / rect.w);
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < rect.w && ny >= 0 && ny < rect.h) {
          enqueue(ny * rect.w + nx);
        }
      }
    }
    pixels[pixel * 4 + 3] = 0;
  }
  context.putImageData(frame, rect.x, rect.y);
}

function prepareSheet(image: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D is required to prepare the four-arm boss sprites.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { canvas, context };
}

export function prepareFourArmBossSheet(image: HTMLImageElement) {
  const { canvas, context } = prepareSheet(image);
  clearEdgeConnectedBackground(
    context,
    { x: 0, y: 0, w: canvas.width, h: canvas.height },
    false,
  );
  return canvas;
}

export function prepareFourArmStorySheet(image: HTMLImageElement) {
  const { canvas, context } = prepareSheet(image);
  for (const frame of FOUR_ARM_STORY_FRAMES) {
    const imageData = context.getImageData(frame.x, frame.y, frame.w, frame.h);
    const { data } = imageData;
    // The two gray tiles and lighter margin tone are sampled from the uploaded
    // sheet. Key every matching pixel in each storyboard panel; edge-only
    // removal leaves large checker islands enclosed by the paired figures.
    const checkerTones = [[60, 63, 69], [102, 104, 111], [183, 184, 189]];
    for (let offset = 0; offset < data.length; offset += 4) {
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const isChecker = checkerTones.some(([cr, cg, cb]) =>
        Math.max(Math.abs(r - cr), Math.abs(g - cg), Math.abs(b - cb)) <= 25);
      if (isChecker) data[offset + 3] = 0;
    }
    context.putImageData(imageData, frame.x, frame.y);
  }
  return canvas;
}

export function extractLargestBossPose(
  source: HTMLCanvasElement,
  frame: FourArmFrame,
) {
  const canvas = document.createElement('canvas');
  canvas.width = frame.w;
  canvas.height = frame.h;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return canvas;
  context.drawImage(source, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);
  const image = context.getImageData(0, 0, frame.w, frame.h);
  const { data } = image;
  const count = frame.w * frame.h;
  const visited = new Uint8Array(count);
  const queue = new Uint32Array(count);
  let largest: number[] = [];

  for (let start = 0; start < count; start += 1) {
    if (visited[start] || data[start * 4 + 3] < 24) continue;
    let head = 0;
    let tail = 0;
    const component: number[] = [];
    queue[tail++] = start;
    visited[start] = 1;
    while (head < tail) {
      const pixel = queue[head++];
      component.push(pixel);
      const x = pixel % frame.w;
      const y = Math.floor(pixel / frame.w);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= frame.w || ny < 0 || ny >= frame.h) continue;
          const neighbor = ny * frame.w + nx;
          if (!visited[neighbor] && data[neighbor * 4 + 3] >= 24) {
            visited[neighbor] = 1;
            queue[tail++] = neighbor;
          }
        }
      }
    }
    if (component.length > largest.length) largest = component;
  }

  const keep = new Uint8Array(count);
  largest.forEach((pixel) => { keep[pixel] = 1; });
  for (let pixel = 0; pixel < count; pixel += 1) {
    if (!keep[pixel]) data[pixel * 4 + 3] = 0;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}
