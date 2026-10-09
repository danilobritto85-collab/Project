import { getRedToenailFrame } from './toenailPolish';

export interface EbonyFrame {
  x: number; y: number; w: number; h: number;
  anchorX: number; baseline: number; scale?: number;
}

// Measured from the actual uploads, normalized to 1024×768, not the
// hypothetical grids described in the accompanying prompt.
export const EBONY_FRAMES = {
  idle: { x: 21, y: 78, w: 109, h: 183, anchorX: 54, baseline: 178 },
  walk: { x: 363, y: 78, w: 98, h: 183, anchorX: 48, baseline: 178 },
  run: { x: 682, y: 78, w: 119, h: 183, anchorX: 64, baseline: 178 },
  kick: { x: 122, y: 339, w: 140, h: 181, anchorX: 47, baseline: 176 },
  spin: { x: 265, y: 339, w: 129, h: 181, anchorX: 45, baseline: 176 },
  highKick: { x: 576, y: 337, w: 128, h: 183, anchorX: 37, baseline: 178 },
  hurt: { x: 39, y: 569, w: 154, h: 195, anchorX: 58, baseline: 190 },
  down: { x: 385, y: 604, w: 168, h: 162, anchorX: 81, baseline: 158 },
  defeated: { x: 742, y: 672, w: 270, h: 91, anchorX: 135, baseline: 86 },
} satisfies Record<string, EbonyFrame>;
export const EBONY_WALK: EbonyFrame[] = [
  EBONY_FRAMES.walk,
  { x: 461, y: 78, w: 98, h: 183, anchorX: 47, baseline: 178 },
  { x: 559, y: 78, w: 103, h: 183, anchorX: 49, baseline: 178 },
];
export const EBONY_RUN: EbonyFrame[] = [
  EBONY_FRAMES.run,
  { x: 802, y: 78, w: 102, h: 183, anchorX: 51, baseline: 178 },
  { x: 904, y: 78, w: 103, h: 183, anchorX: 54, baseline: 178 },
];
export const EBONY_ATTACKS = [EBONY_FRAMES.kick, EBONY_FRAMES.spin, EBONY_FRAMES.highKick];
export const EBONY_BASE_CROPS = [...Object.values(EBONY_FRAMES), ...EBONY_WALK, ...EBONY_RUN];
export const EBONY_STOMP: EbonyFrame[] = [
  { x: 15, y: 85, w: 332, h: 220, anchorX: 224, baseline: 215, scale: .84 },
  { x: 359, y: 85, w: 337, h: 220, anchorX: 225, baseline: 215, scale: .84 },
  { x: 705, y: 85, w: 300, h: 220, anchorX: 215, baseline: 215, scale: .84 },
  { x: 12, y: 445, w: 311, h: 295, anchorX: 173, baseline: 290, scale: .66 },
  { x: 355, y: 445, w: 300, h: 295, anchorX: 174, baseline: 290, scale: .66 },
  { x: 691, y: 445, w: 320, h: 295, anchorX: 180, baseline: 290, scale: .66 },
];
export const EBONY_FINAL_STRIKE: EbonyFrame = {
  x: 123, y: 94, w: 253, h: 260, anchorX: 126, baseline: 255, scale: .72,
};
// These supplied paired illustrations are only displayed after explicit opt-in.
export const EBONY_VICTORY: EbonyFrame[] = [
  EBONY_FINAL_STRIKE,
  { x: 689, y: 88, w: 298, h: 272, anchorX: 158, baseline: 267, scale: .72 },
  { x: 13, y: 448, w: 314, h: 296, anchorX: 160, baseline: 291, scale: .67 },
  { x: 686, y: 485, w: 325, h: 259, anchorX: 170, baseline: 254, scale: .8 },
];
// The second victory sheet is wide (1024×572 after proportional resizing).
export const EBONY_DUO_VICTORY: EbonyFrame[] = [
  { x: 118, y: 70, w: 370, h: 198, anchorX: 142, baseline: 194, scale: .96 },
  { x: 694, y: 70, w: 302, h: 205, anchorX: 155, baseline: 198, scale: .94 },
  { x: 10, y: 330, w: 453, h: 228, anchorX: 174, baseline: 223, scale: .84 },
  { x: 529, y: 328, w: 467, h: 235, anchorX: 311, baseline: 230, scale: .85 },
];
export const EBONY_STOMP_DURATION = 2.4;
export const EBONY_VICTORY_DURATION = 10;

export function ebonyVictoryPose(elapsed: number, finished = false) {
  if (finished || elapsed >= 7.8) return 3;
  if (elapsed < .8) return 0;
  return 1 + Math.floor((elapsed - .8) / .65) % 2;
}

export function prepareEbonySheet(
  image: HTMLImageElement, frames: readonly EbonyFrame[], normalizedHeight = 768,
) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = normalizedHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D indisponível para a Amazon Ebony.');
  // These assets have a subject-aware alpha mask. Color keying the original
  // checker also erased dark skin and green clothing; never key them again.
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  for (const rect of frames) {
    if (rect.x < 0 || rect.y < 0 || rect.x + rect.w > canvas.width ||
      rect.y + rect.h > canvas.height) throw new Error('Recorte Ebony fora da folha de sprites.');
  }
  return canvas;
}

export function drawEbonyFrame(
  context: CanvasRenderingContext2D, image: HTMLCanvasElement | null,
  frame: EbonyFrame, x: number, groundY: number, flipped: boolean, lift = 0,
  motionTime?: number,
) {
  if (!image) return;
  const scale = frame.scale ?? 1;
  context.save();
  if (flipped) { context.translate(x * 2, 0); context.scale(-1, 1); }
  const dx = x - frame.anchorX * scale;
  const dy = groundY + 7 - frame.baseline * scale - lift;
  const polish = getRedToenailFrame(image, frame);
  if (motionTime === undefined) {
    context.drawImage(image, frame.x, frame.y, frame.w, frame.h,
      dx, dy, frame.w * scale, frame.h * scale);
    if (polish) context.drawImage(polish, dx, dy, frame.w * scale, frame.h * scale);
  } else {
    // Animate the upper silhouette without lifting the feet or resizing the
    // whole pair to smoke bounds. Narrow bands preserve the pixel-art detail.
    const sway = Math.sin(motionTime * 4.4) * 3.5;
    const breath = Math.sin(motionTime * Math.PI * 2 / 3.2) * .012;
    for (let row = 0; row < frame.h; row += 4) {
      const h = Math.min(4, frame.h - row);
      const weight = Math.pow(Math.max(0, 1 - (row + h) / frame.baseline), 1.5);
      const widthScale = 1 + breath * weight;
      const left = dx + sway * weight + frame.anchorX * scale * (1 - widthScale);
      context.drawImage(image, frame.x, frame.y + row, frame.w, h,
        left, dy + row * scale, frame.w * scale * widthScale, h * scale);
      if (polish) context.drawImage(polish, 0, row, frame.w, h,
        left, dy + row * scale, frame.w * scale * widthScale, h * scale);
    }
  }
  context.restore();
}
