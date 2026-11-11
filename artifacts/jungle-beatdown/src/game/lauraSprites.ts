import type { KaratePose } from './karateSprites';

// Measured 765×1024 combat sheet: idle / walk / punch / kick / hurt rows.
export const LAURA_IDLE: KaratePose[] = [
  { x: 8, y: 20, w: 150, h: 198 },
  { x: 160, y: 20, w: 152, h: 198 },
  { x: 314, y: 20, w: 150, h: 198 },
  { x: 466, y: 20, w: 152, h: 198 },
  { x: 620, y: 20, w: 145, h: 198 },
];
export const LAURA_WALK: KaratePose[] = [
  { x: 22, y: 222, w: 118, h: 196 },
  { x: 148, y: 222, w: 122, h: 196 },
  { x: 270, y: 222, w: 114, h: 196 },
  { x: 385, y: 222, w: 122, h: 196 },
  { x: 508, y: 222, w: 124, h: 196 },
  { x: 632, y: 222, w: 120, h: 196 },
];
export const LAURA_PUNCHES: KaratePose[] = [
  { x: 8, y: 432, w: 128, h: 188 },
  { x: 136, y: 432, w: 144, h: 188 },
  { x: 264, y: 432, w: 144, h: 188 },
  { x: 400, y: 432, w: 108, h: 188 },
  { x: 500, y: 432, w: 116, h: 188 },
  { x: 612, y: 432, w: 144, h: 188 },
];
export const LAURA_KICKS: KaratePose[] = [
  { x: 0, y: 618, w: 161, h: 210 },
  { x: 138, y: 618, w: 170, h: 210 },
  { x: 285, y: 618, w: 135, h: 210 },
  { x: 399, y: 618, w: 98, h: 210 },
  { x: 459, y: 618, w: 185, h: 210 },
  { x: 642, y: 618, w: 123, h: 210 },
];
export const LAURA_HURT: KaratePose[] = [
  { x: 8, y: 840, w: 148, h: 184 },
  { x: 140, y: 840, w: 170, h: 184 },
  { x: 276, y: 840, w: 176, h: 184 },
];
export const LAURA = {
  idle: LAURA_IDLE[0], walk: LAURA_WALK[0], run: LAURA_WALK[3],
  hurt: LAURA_HURT[0],
  down: { x: 454, y: 908, w: 206, h: 116 },
  defeated: { x: 454, y: 908, w: 206, h: 116 },
};
export const LAURA_ATTACKS = [
  LAURA_PUNCHES[1], LAURA_PUNCHES[2], LAURA_PUNCHES[5],
  // Kicks 2–3 are overpainted by neighboring heads/feet in the source sheet.
  LAURA_KICKS[0], LAURA_KICKS[3], LAURA_KICKS[4],
];
export const LAURA_GUARD = [LAURA_PUNCHES[0], LAURA_PUNCHES[3], LAURA_PUNCHES[4], LAURA_KICKS[5]];

/** Combat-only timeline: punch, kick, heroine recoil/fall, then hold. */
export function lauraDefeatStage(elapsed: number) {
  if (elapsed < 0.28) return 'punch';
  if (elapsed < 0.55) return 'kick';
  if (elapsed < 1.05) return 'recoil';
  if (elapsed < 1.7) return 'fall';
  return 'hold';
}

export function lauraFallingPose(secondsLeft: number): KaratePose {
  if (secondsLeft > 0.85) return LAURA_HURT[0];
  if (secondsLeft > 0.55) return LAURA_HURT[1];
  if (secondsLeft > 0.25) return LAURA_HURT[2];
  return LAURA.defeated;
}

/** Combat-only storyboard panels (7–8): final blow and victory stance. */
export function lauraVictorySequenceFrames(width: number, height: number): KaratePose[] {
  return lauraStoryboardFourFrames(width, height).slice(0, 2);
}

function scaleLauraRect(
  x: number, y: number, w: number, h: number,
  width: number, height: number, nativeW: number, nativeH: number,
): KaratePose {
  const scaleX = width / nativeW;
  const scaleY = height / nativeH;
  const sx = Math.max(0, Math.round(x * scaleX));
  const sy = Math.max(0, Math.round(y * scaleY));
  return {
    x: sx,
    y: sy,
    w: Math.min(Math.round(w * scaleX), width - sx),
    h: Math.min(Math.round(h * scaleY), height - sy),
  };
}

/**
 * Panels 7–10 on the pre-keyed victory sheet (no captions). Crops follow
 * the figure groups so empty padding does not shrink them on screen.
 */
export function lauraStoryboardFourFrames(width: number, height: number): KaratePose[] {
  return [
    scaleLauraRect(26, 78, 450, 292, width, height, 1024, 765),
    scaleLauraRect(555, 77, 448, 292, width, height, 1024, 765),
    scaleLauraRect(6, 433, 430, 332, width, height, 1024, 765),
    scaleLauraRect(512, 479, 508, 286, width, height, 1024, 765),
  ];
}

/**
 * Panels 11–13 on the continuation sheet (light gray/white checker).
 */
export function lauraContinuationFrames(width: number, height: number): KaratePose[] {
  return [
    scaleLauraRect(8, 80, 484, 314, width, height, 1024, 764),
    scaleLauraRect(540, 80, 476, 314, width, height, 1024, 764),
    scaleLauraRect(20, 418, 996, 346, width, height, 1024, 764),
  ];
}

/** Opt-in special uses all four victory panels plus the three continuation panels. */
export function lauraSpecialSequenceFrames(
  victoryWidth: number,
  victoryHeight: number,
  continuationWidth: number,
  continuationHeight: number,
): { sheet: 'victory' | 'continuation'; frame: KaratePose }[] {
  return [
    ...lauraStoryboardFourFrames(victoryWidth, victoryHeight).map((frame) => ({
      sheet: 'victory' as const,
      frame,
    })),
    ...lauraContinuationFrames(continuationWidth, continuationHeight).map((frame) => ({
      sheet: 'continuation' as const,
      frame,
    })),
  ];
}

export const LAURA_SPECIAL_PANEL_COUNT = 7;
export const LAURA_SPECIAL_DURATION = 14;
/** Caption strip height inside each storyboard panel (numbered titles). */
export const LAURA_STORYBOARD_CAPTION_HEIGHT = 24;

export function lauraSpecialPanelIndex(elapsed: number, duration = LAURA_SPECIAL_DURATION) {
  const progress = Math.max(0, Math.min(0.999, elapsed / Math.max(0.001, duration)));
  return Math.min(LAURA_SPECIAL_PANEL_COUNT - 1, Math.floor(progress * LAURA_SPECIAL_PANEL_COUNT));
}

/** Soft kiss cue during the continuation kiss panels. */
export function lauraSpecialKissElapsed(duration = LAURA_SPECIAL_DURATION) {
  return duration * (5 / LAURA_SPECIAL_PANEL_COUNT);
}

/**
 * Victory PNG already has real alpha. Continuation JPEG still has a
 * Photoshop gray/white checker; hair is black so we only flood light
 * gray from the edges and never touch dark pixels.
 */
export function prepareLauraVictorySheet(
  image: HTMLImageElement,
  _frames: KaratePose[],
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D indisponível para a sequência da Laura.');
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = pixels.data;
  const width = canvas.width;
  const height = canvas.height;
  let transparent = 0;
  for (let o = 3; o < data.length; o += 4) {
    if (data[o] < 20) transparent += 1;
  }
  if (transparent > width * height * 0.12) {
    ctx.putImageData(pixels, 0, 0);
    return canvas;
  }
  const isLightChecker = (o: number) => {
    const r = data[o], g = data[o + 1], b = data[o + 2];
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    const luma = (r + g + b) / 3;
    return data[o + 3] >= 20 && chroma < 22 && luma >= 168;
  };
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let tail = 0;
  const add = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (seen[p] || !isLightChecker(p * 4)) return;
    seen[p] = 1;
    queue[tail++] = p;
  };
  for (let x = 0; x < width; x++) { add(x, 0); add(x, height - 1); }
  for (let y = 1; y < height - 1; y++) { add(0, y); add(width - 1, y); }
  for (let head = 0; head < tail; head++) {
    const p = queue[head];
    const x = p % width, y = Math.floor(p / width);
    data[p * 4 + 3] = 0;
    add(x - 1, y); add(x + 1, y); add(x, y - 1); add(x, y + 1);
  }
  seen.fill(0);
  tail = 0;
  for (let start = 0; start < seen.length; start++) {
    if (seen[start] || !isLightChecker(start * 4)) continue;
    let head = 0;
    tail = 0;
    queue[tail++] = start;
    seen[start] = 1;
    while (head < tail) {
      const p = queue[head++];
      const x = p % width, y = Math.floor(p / width);
      if (x > 0 && !seen[p - 1] && isLightChecker((p - 1) * 4)) {
        seen[p - 1] = 1; queue[tail++] = p - 1;
      }
      if (x + 1 < width && !seen[p + 1] && isLightChecker((p + 1) * 4)) {
        seen[p + 1] = 1; queue[tail++] = p + 1;
      }
      if (y > 0 && !seen[p - width] && isLightChecker((p - width) * 4)) {
        seen[p - width] = 1; queue[tail++] = p - width;
      }
      if (y + 1 < height && !seen[p + width] && isLightChecker((p + width) * 4)) {
        seen[p + width] = 1; queue[tail++] = p + width;
      }
    }
    if (tail >= 16) {
      for (let i = 0; i < tail; i++) data[queue[i] * 4 + 3] = 0;
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

/**
 * Strip numbered panel titles ("7. FINAL BLOW…") without touching figures.
 * Unlike removeStoryboardHeadings, this never deletes whole components that
 * merely overlap the caption band (e.g. tall hair).
 */
export function removeLauraStoryboardCaptions(
  canvas: HTMLCanvasElement,
  frames: KaratePose[],
  captionHeight = LAURA_STORYBOARD_CAPTION_HEIGHT,
) {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D indisponível para legendas da Laura.');
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = image.data;
  for (const frame of frames) {
    const left = Math.max(0, Math.round(frame.x));
    const top = Math.max(0, Math.round(frame.y));
    const right = Math.min(canvas.width, left + Math.round(frame.w));
    const captionBottom = Math.min(Math.round(frame.y + frame.h), top + captionHeight);
    for (let y = top; y < captionBottom; y += 1) {
      for (let x = left; x < right; x += 1) {
        const offset = (y * canvas.width + x) * 4;
        if (pixels[offset + 3] < 20) continue;
        const red = pixels[offset], green = pixels[offset + 1], blue = pixels[offset + 2];
        const max = Math.max(red, green, blue);
        const min = Math.min(red, green, blue);
        const chroma = max - min;
        const captionInk = max >= 158 && chroma < 42;
        const captionOnChecker = max >= 52 && max < 108 && chroma < 14;
        if (captionInk || captionOnChecker) pixels[offset + 3] = 0;
      }
    }
  }
  context.putImageData(image, 0, 0);
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
    // The backdrop is pure black. A broad cutoff also eats Laura's dark
    // hair strands and outlines, creating transparent holes in every pose.
    if (visited[p] || Math.max(data.data[o], data.data[o + 1], data.data[o + 2]) > 4) return;
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
