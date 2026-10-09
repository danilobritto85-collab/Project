import { repairForegroundMask, removeCheckerFragments } from './spriteMask';
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
// Only the non-sexual final-strike panel is used. The remaining panels include
// forced fetish scenes and are intentionally not part of the game's sequence.
export const EBONY_FINAL_STRIKE: EbonyFrame = {
  x: 123, y: 94, w: 253, h: 260, anchorX: 126, baseline: 255, scale: .72,
};
export const EBONY_STOMP_DURATION = 2.4;
export const EBONY_VICTORY_DURATION = 4;

export function cleanEbonySheet(image: HTMLImageElement, frames: readonly EbonyFrame[]) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 768;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D indisponível para a Amazon Ebony.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const data = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2];
    const range = Math.max(r, g, b) - Math.min(r, g, b);
    const light = (r + g + b) / 3;
    // The checker is neutral/warm gray; saturated dark skin is not keyed.
    if (range < 15 && light > 18 && light < 112) data.data[i + 3] = 0;
  }
  context.putImageData(data, 0, 0);
  for (const rect of frames) {
    const crop = context.getImageData(rect.x, rect.y, rect.w, rect.h);
    removeCheckerFragments(crop.data, rect.w, rect.h);
    repairForegroundMask(crop.data, rect.w, rect.h, 100);
    context.putImageData(crop, rect.x, rect.y);
  }
  return canvas;
}

export function drawEbonyFrame(
  context: CanvasRenderingContext2D, image: HTMLCanvasElement | null,
  frame: EbonyFrame, x: number, groundY: number, flipped: boolean, lift = 0,
) {
  if (!image) return;
  const scale = frame.scale ?? 1;
  context.save();
  if (flipped) { context.translate(x * 2, 0); context.scale(-1, 1); }
  const dx = x - frame.anchorX * scale;
  const dy = groundY + 7 - frame.baseline * scale - lift;
  context.drawImage(image, frame.x, frame.y, frame.w, frame.h,
    dx, dy, frame.w * scale, frame.h * scale);
  const polish = getRedToenailFrame(image, frame);
  if (polish) context.drawImage(polish, dx, dy, frame.w * scale, frame.h * scale);
  context.restore();
}
