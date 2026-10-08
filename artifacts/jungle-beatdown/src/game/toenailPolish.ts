type AtlasKind = 'amazon' | 'pinAttack' | 'pinExtended';
type NailCluster = readonly [number, number, 'front' | 'side', number?, number?];
interface FrameRect { x: number; y: number; w: number; h: number }

// Coordinates refer to the normalized 1024×768 sheets. Only exposed nail
// surfaces are painted; sole-facing and covered toes are left untouched.
const NAILS: Record<AtlasKind, readonly NailCluster[]> = {
  amazon: [
    [47, 249, 'front'], [120, 241, 'side'],
    [391, 248, 'side'], [449, 251, 'side'],
    [489, 248, 'side'], [544, 251, 'side'],
    [584, 251, 'front', 0.85], [652, 251, 'side'],
    [163, 507, 'front'], [249, 396, 'front', 0.7, -90],
    [79, 747, 'front'], [183, 741, 'side'],
    [525, 745, 'front', 1, -45], [543, 717, 'side'],
    [715, 509, 'front'], [799, 501, 'side'],
    [862, 486, 'front'], [865, 503, 'front', 0.45, -10],
  ],
  pinAttack: [
    [86, 344, 'front', 1.8],
    [550, 341, 'side', 1.8],
    [757, 344, 'front', 1.8], [916, 301, 'side', 1.8],
    [92, 746, 'front', 1.8], [267, 687, 'side', 1.8],
    [439, 746, 'front', 1.8], [611, 688, 'side', 1.8],
    [768, 746, 'front', 1.8], [948, 688, 'side', 1.8],
  ],
  pinExtended: [
    [87, 361, 'front', 1.8], [215, 303, 'side', 1.8],
    [427, 363, 'front', 1.8], [622, 321, 'side', 1.8],
    [763, 364, 'front', 1.8], [952, 321, 'side', 1.8],
    [91, 746, 'front', 1.8], [262, 688, 'side', 1.8],
    [434, 746, 'front', 1.8], [609, 687, 'side', 1.8],
    [765, 746, 'front', 1.8], [940, 688, 'side', 1.8],
  ],
};

const FRONT = [[0, 0, 2.7, 2.2], [-4, 0.6, 2.1, 1.8], [-7.5, 0.8, 1.9, 1.7],
  [-11, 0.6, 1.7, 1.5], [-14, -0.1, 1.5, 1.3]];
const SIDE = [[0, 0, 2.5, 1.8], [-3, -1.8, 2, 1.5], [-5.7, -3.2, 1.6, 1.3]];
const layers = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
const frames = new WeakMap<HTMLCanvasElement, Map<string, HTMLCanvasElement>>();

export function withRedToenails(image: HTMLCanvasElement | null, kind: AtlasKind) {
  if (!image) return null;
  const layer = document.createElement('canvas');
  layer.width = image.width;
  layer.height = image.height;
  const context = layer.getContext('2d', { willReadFrequently: true });
  const sourceContext = image.getContext('2d', { willReadFrequently: true });
  if (!context || !sourceContext) return image;

  for (const [x, y, pattern, scale = 1, rotation = 0] of NAILS[kind]) {
    context.save();
    context.translate(x, y);
    context.rotate(rotation * Math.PI / 180);
    context.scale(scale, scale);
    for (const [dx, dy, w, h] of pattern === 'front' ? FRONT : SIDE) {
      context.fillStyle = '#d02130';
      context.fillRect(dx - w / 2, dy - h / 2, w, h);
      context.fillStyle = '#fb6370';
      context.fillRect(dx - w / 2 + 0.4, dy - h / 2 + 0.2, w * 0.35, h * 0.3);
    }
    context.restore();
  }

  const polish = context.getImageData(0, 0, layer.width, layer.height);
  const source = sourceContext.getImageData(0, 0, image.width, image.height).data;
  for (let i = 0; i < polish.data.length; i += 4) {
    // Preserve outlines, wraps and the existing alpha mask.
    if (!source[i + 3] || source[i] < 105 ||
      source[i] < source[i + 1] + 12 || source[i + 1] < source[i + 2] + 5) {
      polish.data[i + 3] = 0;
    }
  }
  context.putImageData(polish, 0, 0);
  layers.set(image, layer);
  return image;
}

export function getRedToenailFrame(image: HTMLCanvasElement, rect: FrameRect, isolated?: HTMLCanvasElement) {
  const layer = layers.get(image);
  if (!layer) return null;
  let cache = frames.get(image);
  if (!cache) {
    cache = new Map();
    frames.set(image, cache);
  }
  const key = `${rect.x},${rect.y},${rect.w},${rect.h}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const frame = document.createElement('canvas');
  frame.width = rect.w;
  frame.height = rect.h;
  const context = frame.getContext('2d');
  if (!context) return null;
  context.drawImage(layer, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
  context.globalCompositeOperation = 'destination-in';
  if (isolated) context.drawImage(isolated, 0, 0);
  else context.drawImage(image, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
  cache.set(key, frame);
  return frame;
}
