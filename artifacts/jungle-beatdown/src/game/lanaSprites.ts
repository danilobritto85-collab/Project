export interface LanaPose {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Native 764×1024 combat sheet: run row, hurt/fall/down, then idle/kicks. */
export const LANA_WALK: LanaPose[] = [
  { x: 0, y: 18, w: 210, h: 318 },
  { x: 188, y: 18, w: 228, h: 318 },
  { x: 398, y: 18, w: 186, h: 318 },
  { x: 528, y: 18, w: 236, h: 318 },
];

export const LANA = {
  idle: { x: 2, y: 762, w: 190, h: 262 },
  walk: LANA_WALK[0],
  run: LANA_WALK[3],
  punch: { x: 572, y: 762, w: 192, h: 262 },
  hurt: { x: 0, y: 348, w: 300, h: 360 },
  down: { x: 400, y: 428, w: 360, h: 340 },
  defeated: { x: 400, y: 428, w: 360, h: 340 },
  kick: { x: 196, y: 762, w: 212, h: 262 },
  flyKick: { x: 214, y: 360, w: 316, h: 262 },
  highKick: { x: 388, y: 762, w: 196, h: 262 },
};

export const LANA_ATTACKS: LanaPose[] = [
  LANA.punch,
  LANA.kick,
  LANA.highKick,
  LANA.flyKick,
];

export const LANA_SHEET = { width: 764, height: 1024 };

export function lanaStoryboardFrames(
  width: number,
  height: number,
  columns = 3,
  rows = 2,
): LanaPose[] {
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  return Array.from({ length: columns * rows }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = Math.round(column * cellWidth);
    const y = Math.round(row * cellHeight);
    const right = Math.round((column + 1) * cellWidth);
    const bottom = Math.round((row + 1) * cellHeight);
    return { x, y, w: right - x, h: bottom - y };
  });
}

export function lanaPunishmentSequence(
  stompWidth: number,
  stompHeight: number,
  grabWidth: number,
  grabHeight: number,
): { sheet: 'stomp' | 'grab'; frame: LanaPose }[] {
  return [
    ...lanaStoryboardFrames(stompWidth, stompHeight).map((frame) => ({
      sheet: 'stomp' as const,
      frame,
    })),
    ...lanaStoryboardFrames(grabWidth, grabHeight).map((frame) => ({
      sheet: 'grab' as const,
      frame,
    })),
  ];
}

export const LANA_PUNISHMENT_COUNT = 12;
export const LANA_DEFEAT_DURATION = 14;

function isLanaBackdrop(red: number, green: number, blue: number) {
  const min = Math.min(red, green, blue);
  const max = Math.max(red, green, blue);
  const luma = (red + green + blue) / 3;
  // JPEG gray from the uploaded sheets: near-neutral, mid luma. Outlines,
  // hair, the red shirt and magenta shorts stay outside this range.
  return max - min <= 28 && luma >= 68 && luma <= 196;
}

/** Keys the medium-gray studio backdrop so the jungle shows through. */
export function prepareLanaSheet(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D indisponível para os sprites da Lana.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const pixelCount = canvas.width * canvas.height;
  const candidates = new Uint8Array(pixelCount);
  const visited = new Uint8Array(pixelCount);
  const queue = new Uint32Array(pixelCount);
  for (let index = 0; index < pixelCount; index += 1) {
    const offset = index * 4;
    candidates[index] = Number(
      pixels[offset + 3] >= 20 &&
      isLanaBackdrop(pixels[offset], pixels[offset + 1], pixels[offset + 2]),
    );
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
  for (let start = 0; start < pixelCount; start += 1) {
    if (visited[start] || pixels[start * 4 + 3] < 20 || !candidates[start]) continue;
    let islandHead = 0;
    let islandTail = 0;
    visited[start] = 1;
    queue[islandTail++] = start;
    while (islandHead < islandTail) {
      const index = queue[islandHead++];
      const x = index % canvas.width;
      const y = Math.floor(index / canvas.width);
      const neighbors = [index - 1, index + 1, index - canvas.width, index + canvas.width];
      const valid = [x > 0, x + 1 < canvas.width, y > 0, y + 1 < canvas.height];
      for (let i = 0; i < 4; i += 1) {
        if (!valid[i]) continue;
        const next = neighbors[i];
        if (visited[next] || pixels[next * 4 + 3] < 20 || !candidates[next]) continue;
        visited[next] = 1;
        queue[islandTail++] = next;
      }
    }
    if (islandTail >= 24) {
      for (let i = 0; i < islandTail; i += 1) pixels[queue[i] * 4 + 3] = 0;
    }
  }
  context.putImageData(imageData, 0, 0);
  context.clearRect(0, 0, 2, canvas.height);
  context.clearRect(canvas.width - 2, 0, 2, canvas.height);
  context.clearRect(0, 0, canvas.width, 2);
  context.clearRect(0, canvas.height - 2, canvas.width, 2);
  return canvas;
}
