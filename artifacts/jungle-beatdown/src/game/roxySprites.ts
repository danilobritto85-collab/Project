export interface RoxyFrame {
  x: number; y: number; w: number; h: number;
  anchorX: number; baseline: number;
}

// Actual artwork boundaries, not equal atlas cells. The first row's feet
// extend below the nominal cell boundary; both kick poses do too.
export const ROXY_FRAMES = {
  idle: { x: 52, y: 26, w: 174, h: 265, anchorX: 88, baseline: 260 },
  walk: { x: 304, y: 24, w: 161, h: 269, anchorX: 67, baseline: 267 },
  run: { x: 548, y: 43, w: 161, h: 245, anchorX: 70, baseline: 243 },
  kick: { x: 291, y: 282, w: 224, h: 267, anchorX: 74, baseline: 263 },
  spin: { x: 580, y: 302, w: 345, h: 240, anchorX: 90, baseline: 234 },
  highKick: { x: 291, y: 282, w: 224, h: 267, anchorX: 74, baseline: 263 },
  hurt: { x: 52, y: 26, w: 174, h: 265, anchorX: 88, baseline: 260 },
  down: { x: 800, y: 63, w: 160, h: 226, anchorX: 75, baseline: 220 },
  defeated: { x: 787, y: 552, w: 237, h: 216, anchorX: 105, baseline: 211 },
  pinPose: { x: 534, y: 552, w: 237, h: 216, anchorX: 100, baseline: 211 },
  pinLift: { x: 787, y: 552, w: 237, h: 216, anchorX: 105, baseline: 211 },
} satisfies Record<string, RoxyFrame>;

const frames = new WeakMap<HTMLCanvasElement, Map<string, HTMLCanvasElement>>();
const rigs = new WeakMap<HTMLCanvasElement, { body: HTMLCanvasElement; back: HTMLCanvasElement; front: HTMLCanvasElement }>();

export function prepareRoxySheet(image: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 768;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas indisponível para Roxy.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function isolateFrame(sheet: HTMLCanvasElement, rect: RoxyFrame) {
  let cache = frames.get(sheet);
  if (!cache) { cache = new Map(); frames.set(sheet, cache); }
  const key = `${rect.x},${rect.y},${rect.w},${rect.h}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = rect.w; canvas.height = rect.h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(sheet, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
  const image = ctx.getImageData(0, 0, rect.w, rect.h);
  const count = rect.w * rect.h;
  const visited = new Uint8Array(count);
  let largest: number[] = [];
  for (let start = 0; start < count; start++) {
    if (visited[start] || image.data[start * 4 + 3] < 16) continue;
    const queue = [start]; visited[start] = 1;
    for (let head = 0; head < queue.length; head++) {
      const p = queue[head], x = p % rect.w, y = Math.floor(p / rect.w);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy, next = yy * rect.w + xx;
        if (xx < 0 || yy < 0 || xx >= rect.w || yy >= rect.h ||
          visited[next] || image.data[next * 4 + 3] < 16) continue;
        visited[next] = 1; queue.push(next);
      }
    }
    if (queue.length > largest.length) largest = queue;
  }
  const keep = new Uint8Array(count);
  for (const p of largest) keep[p] = 1;
  for (let p = 0; p < count; p++) if (!keep[p]) image.data[p * 4 + 3] = 0;
  ctx.putImageData(image, 0, 0);
  cache.set(key, canvas);
  return canvas;
}

type Point = readonly [number, number];
// Partition the entire lower-body alpha, including the toe tips. Tight
// polygons left pieces of the original legs behind, producing duplicate feet.
const BACK_LEG: Point[] = [[0,129],[73,129],[75,169],[83,193],[80,269],[0,269]];
const FRONT_LEG: Point[] = [[73,129],[161,129],[161,269],[80,269],[83,193],[75,169]];

function path(context: CanvasRenderingContext2D, points: readonly Point[]) {
  context.beginPath();
  points.forEach(([x, y], i) => i ? context.lineTo(x, y) : context.moveTo(x, y));
  context.closePath();
}

function makeRig(sheet: HTMLCanvasElement) {
  const cached = rigs.get(sheet);
  if (cached) return cached;
  const source = isolateFrame(sheet, ROXY_FRAMES.walk);
  const make = () => {
    const canvas = document.createElement('canvas');
    canvas.width = source.width; canvas.height = source.height;
    return canvas;
  };
  const body = make(), back = make(), front = make();
  const bodyCtx = body.getContext('2d')!;
  bodyCtx.drawImage(source, 0, 0);
  for (const [canvas, polygon] of [[back, BACK_LEG], [front, FRONT_LEG]] as const) {
    const ctx = canvas.getContext('2d')!;
    ctx.save(); path(ctx, polygon); ctx.clip(); ctx.drawImage(source, 0, 0); ctx.restore();
  }
  // The fixed upper body overlaps the animated joints slightly, without
  // retaining a second, stationary copy of the boots.
  bodyCtx.clearRect(0, 140, body.width, body.height - 140);
  const rig = { body, back, front }; rigs.set(sheet, rig);
  return rig;
}

export function drawRoxyFrame(
  context: CanvasRenderingContext2D, sheet: HTMLCanvasElement | null, frame: RoxyFrame,
  x: number, groundY: number, flipped: boolean, state: string, stride: number,
  lift = 0,
) {
  if (!sheet) return;
  const scale = .72;
  const moving = state === 'walk' || state === 'run';
  const rect = moving ? ROXY_FRAMES.walk : frame;
  const angle = moving ? Math.sin(stride) * (state === 'run' ? .2 : .14) : 0;
  const hip: Point = [73, 132];
  const footY = (foot: Point, rotation: number) => hip[1] +
    (foot[0] - hip[0]) * Math.sin(rotation) + (foot[1] - hip[1]) * Math.cos(rotation);
  const baseline = moving
    ? Math.max(footY([44, 263], -angle), footY([152, 267], angle)) : rect.baseline;
  context.save();
  if (flipped) { context.translate(x * 2, 0); context.scale(-1, 1); }
  context.translate(x - rect.anchorX * scale, groundY + 7 - lift - baseline * scale);
  context.scale(scale, scale);
  if (moving) {
    const rig = makeRig(sheet);
    const leg = (image: HTMLCanvasElement, rotation: number) => {
      context.save(); context.translate(...hip); context.rotate(rotation);
      context.translate(-hip[0], -hip[1]); context.drawImage(image, 0, 0); context.restore();
    };
    leg(rig.back, -angle); leg(rig.front, angle);
    context.drawImage(rig.body, 0, 0);
  } else context.drawImage(isolateFrame(sheet, rect), 0, 0);
  context.restore();
}
