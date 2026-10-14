export interface PanteraFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

const SHEET_WIDTH = 1024;
const SHEET_HEIGHT = 566;

// These poses are laid out in the normalized 1024 × 566 art space.
const PANTERA_MOVEMENT_FRAMES: PanteraFrame[] = [
  { x: 20, y: 10, w: 140, h: 194 },
  { x: 157, y: 10, w: 132, h: 194 },
  { x: 282, y: 10, w: 130, h: 194 },
  { x: 402, y: 10, w: 133, h: 194 },
  { x: 523, y: 10, w: 136, h: 194 },
  { x: 638, y: 10, w: 142, h: 194 },
];

export const PANTERA_IDLE_FRAMES = PANTERA_MOVEMENT_FRAMES.slice(0, 3);
export const PANTERA_WALK_FRAMES = PANTERA_MOVEMENT_FRAMES.slice(3, 5);
export const PANTERA_RUN_FRAMES = [
  PANTERA_MOVEMENT_FRAMES[3],
  PANTERA_MOVEMENT_FRAMES[5],
  PANTERA_MOVEMENT_FRAMES[4],
  PANTERA_MOVEMENT_FRAMES[5],
];

const PANTERA_COMBAT_ROW: PanteraFrame[] = [
  { x: 18, y: 205, w: 125, h: 177 },
  { x: 143, y: 205, w: 135, h: 177 },
  { x: 278, y: 205, w: 132, h: 177 },
  { x: 410, y: 205, w: 150, h: 177 },
  { x: 560, y: 205, w: 179, h: 177 },
  { x: 739, y: 205, w: 141, h: 177 },
];

const PANTERA_KICK_FRAMES: PanteraFrame[] = [
  { x: 226, y: 380, w: 154, h: 186 },
  { x: 380, y: 380, w: 222, h: 186 },
  { x: 620, y: 335, w: 164, h: 231 },
  { x: 784, y: 340, w: 240, h: 226 },
];

export const PANTERA_ATTACK_FRAMES: PanteraFrame[] = [
  ...PANTERA_COMBAT_ROW.slice(1, 5),
  ...PANTERA_KICK_FRAMES,
];

export const PANTERA_FRAMES = {
  idle: PANTERA_IDLE_FRAMES[0],
  walk: PANTERA_WALK_FRAMES[0],
  run: PANTERA_RUN_FRAMES[1],
  punch: PANTERA_ATTACK_FRAMES[0],
  kick: PANTERA_ATTACK_FRAMES[4],
  spin: PANTERA_ATTACK_FRAMES[6],
  highKick: PANTERA_ATTACK_FRAMES[7],
  // The supplied sheet contains no separate hurt or fallen pose.
  hurt: PANTERA_COMBAT_ROW[0],
  down: PANTERA_COMBAT_ROW[0],
  defeated: PANTERA_COMBAT_ROW[0],
};

type Color = [number, number, number];

function sampleCheckerColors(data: Uint8ClampedArray, width: number, height: number): Color[] {
  const buckets = new Map<string, { count: number; channels: Color }>();
  const sampleLeft = Math.floor(width * 0.78);
  const sampleBottom = Math.floor(height * 0.27);

  // The upper-right margin is clear of the figures and contains both checker
  // tones, so it is a safer reference than the character's warm skin palette.
  for (let y = 2; y < sampleBottom; y += 2) {
    for (let x = sampleLeft; x < width - 1; x += 2) {
      const offset = (y * width + x) * 4;
      const channels: Color = [data[offset], data[offset + 1], data[offset + 2]];
      const key = channels.map((channel) => Math.floor(channel / 8) * 8).join(',');
      const bucket = buckets.get(key) ?? { count: 0, channels: [0, 0, 0] };
      bucket.count += 1;
      bucket.channels[0] += channels[0];
      bucket.channels[1] += channels[1];
      bucket.channels[2] += channels[2];
      buckets.set(key, bucket);
    }
  }

  const colors: Color[] = [];
  const ranked = [...buckets.values()].sort((a, b) => b.count - a.count);
  for (const bucket of ranked) {
    const color = bucket.channels.map((channel) => channel / bucket.count) as Color;
    const belongsToExistingTone = colors.some((existing) =>
      Math.hypot(
        color[0] - existing[0],
        color[1] - existing[1],
        color[2] - existing[2],
      ) < 15,
    );
    if (!belongsToExistingTone) colors.push(color);
    if (colors.length === 2) break;
  }

  if (colors.length < 2) {
    throw new Error('Não foi possível identificar as duas cores do fundo da Pantera.');
  }
  return colors;
}

function matchesCheckerColor(data: Uint8ClampedArray, offset: number, colors: Color[]) {
  return colors.some((color) => {
    const red = data[offset] - color[0];
    const green = data[offset + 1] - color[1];
    const blue = data[offset + 2] - color[2];
    return red * red + green * green + blue * blue <= 15 * 15;
  });
}

export function preparePanteraSheet(image: HTMLImageElement): HTMLCanvasElement {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height) throw new Error('A folha de sprites da Pantera está vazia.');

  const source = document.createElement('canvas');
  source.width = width;
  source.height = height;
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  if (!sourceContext) throw new Error('Não foi possível processar a folha da Pantera.');
  sourceContext.drawImage(image, 0, 0);

  const pixels = sourceContext.getImageData(0, 0, width, height);
  const { data } = pixels;
  const checkerColors = sampleCheckerColors(data, width, height);
  const size = width * height;
  const candidates = new Uint8Array(size);
  const visited = new Uint8Array(size);
  const queue = new Uint32Array(size);

  for (let pixel = 0; pixel < size; pixel += 1) {
    candidates[pixel] = matchesCheckerColor(data, pixel * 4, checkerColors) ? 1 : 0;
  }

  let tail = 0;
  const addCandidate = (pixel: number) => {
    if (candidates[pixel] && !visited[pixel]) {
      visited[pixel] = 1;
      queue[tail] = pixel;
      tail += 1;
    }
  };

  for (let x = 0; x < width; x += 1) {
    addCandidate(x);
    addCandidate((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    addCandidate(y * width);
    addCandidate(y * width + width - 1);
  }

  // Flood only from the outer border. Neutral-colored foreground details that
  // happen to share a checker tone stay intact when enclosed by the silhouette.
  for (let head = 0; head < tail; head += 1) {
    const pixel = queue[head];
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    if (x > 0) addCandidate(pixel - 1);
    if (x + 1 < width) addCandidate(pixel + 1);
    if (y > 0) addCandidate(pixel - width);
    if (y + 1 < height) addCandidate(pixel + width);
  }

  for (let pixel = 0; pixel < size; pixel += 1) {
    if (visited[pixel]) data[pixel * 4 + 3] = 0;
  }
  sourceContext.putImageData(pixels, 0, 0);

  const normalized = document.createElement('canvas');
  normalized.width = SHEET_WIDTH;
  normalized.height = SHEET_HEIGHT;
  const normalizedContext = normalized.getContext('2d');
  if (!normalizedContext) throw new Error('Não foi possível normalizar a folha da Pantera.');
  normalizedContext.imageSmoothingEnabled = false;
  normalizedContext.drawImage(source, 0, 0, SHEET_WIDTH, SHEET_HEIGHT);
  return normalized;
}
