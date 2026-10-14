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
  idle: { x: 0, y: 265, w: 153, h: 282 },
  walk: KARATE_BLONDE_WALK[0],
  run: KARATE_BLONDE_WALK[2],
  punch: { x: 612, y: 265, w: 153, h: 282 },
  hurt: { x: 306, y: 265, w: 153, h: 282 },
  down: { x: 306, y: 265, w: 153, h: 282 },
  defeated: { x: 306, y: 265, w: 153, h: 282 },
  kick: { x: 0, y: 540, w: 465, h: 484 },
  spin: { x: 264, y: 687, w: 254, h: 322 },
  highKick: { x: 477, y: 540, w: 288, h: 484 },
};

export const KARATE_EBONY = {
  idle: { x: 0, y: 265, w: 150, h: 274 },
  walk: KARATE_EBONY_WALK[0],
  run: KARATE_EBONY_WALK[2],
  punch: { x: 598, y: 265, w: 150, h: 274 },
  hurt: { x: 298, y: 265, w: 150, h: 274 },
  down: { x: 298, y: 265, w: 150, h: 274 },
  defeated: { x: 298, y: 265, w: 150, h: 274 },
  kick: { x: 0, y: 530, w: 383, h: 470 },
  spin: { x: 244, y: 684, w: 268, h: 316 },
  highKick: { x: 451, y: 530, w: 297, h: 470 },
};

export const KARATE_BLONDE_ATTACKS = [
  KARATE_BLONDE.punch,
  { x: 459, y: 265, w: 153, h: 282 },
  KARATE_BLONDE.kick,
  KARATE_BLONDE.spin,
  KARATE_BLONDE.highKick,
];
export const KARATE_EBONY_ATTACKS = [
  KARATE_EBONY.punch,
  { x: 448, y: 265, w: 150, h: 274 },
  KARATE_EBONY.kick,
  KARATE_EBONY.spin,
  KARATE_EBONY.highKick,
];

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

export function karateBlondeSequenceFrames(width: number, height: number): KaratePose[] {
  const cellWidth = width / 3;
  const titleInset = 60;
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
  return gridFrames(2, 4, width, height, 0);
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

export function prepareKarateSheet(image: HTMLImageElement, checkerboard = false) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D indisponível para os sprites de karatê.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const sheet = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = sheet.data;
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
        if (min < 8 || max > 125 || max - min > 38) continue;
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
    pixels[pixel + 3] > 0 && backgroundTones.some(([br, bg, bb]) =>
      Math.hypot(pixels[pixel] - br, pixels[pixel + 1] - bg, pixels[pixel + 2] - bb) < 25);
  if (checkerboard) {
    for (let pixel = 0; pixel < pixels.length; pixel += 4) {
      if (matchesBackground(pixel)) pixels[pixel + 3] = 0;
    }
  } else {
    const visited = new Uint8Array(canvas.width * canvas.height);
    const stack: number[] = [];
    const pushIfBackground = (x: number, y: number) => {
      const point = y * canvas.width + x;
      if (visited[point]) return;
      visited[point] = 1;
      const pixel = point * 4;
      if (matchesBackground(pixel)) stack.push(point);
    };
    for (let x = 0; x < canvas.width; x += 1) {
      pushIfBackground(x, 0);
      pushIfBackground(x, canvas.height - 1);
    }
    for (let y = 0; y < canvas.height; y += 1) {
      pushIfBackground(0, y);
      pushIfBackground(canvas.width - 1, y);
    }
    while (stack.length) {
      const point = stack.pop()!;
      pixels[point * 4 + 3] = 0;
      const x = point % canvas.width;
      const y = Math.floor(point / canvas.width);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= canvas.width || ny >= canvas.height) continue;
          pushIfBackground(nx, ny);
        }
      }
    }
  }
  context.putImageData(sheet, 0, 0);
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
        if (inHeadingBand || inFooterBand) {
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
