/**
 * Repair small gaps left by gray-background keying without recoloring the
 * original artwork. Large transparent spaces between limbs stay transparent.
 */
export function repairForegroundMask(pixels: Uint8ClampedArray, width: number, height: number) {
  const count = width * height;
  const original = new Uint8Array(count);
  const dilated = new Uint8Array(count);
  const repaired = new Uint8Array(count);
  const radius = 2;

  for (let i = 0; i < count; i += 1) original[i] = pixels[i * 4 + 3] > 0 ? 1 : 0;

  // Closing reconnects thin outlines that were interrupted by the color key.
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let found = false;
      for (let dy = -radius; dy <= radius && !found; dy += 1) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -radius; dx <= radius; dx += 1) {
          const xx = x + dx;
          if (xx >= 0 && xx < width && original[yy * width + xx]) {
            found = true;
            break;
          }
        }
      }
      dilated[y * width + x] = found ? 1 : 0;
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = y * width + x;
      if (original[pixel]) {
        repaired[pixel] = 1;
        continue;
      }
      let solid = true;
      for (let dy = -radius; dy <= radius && solid; dy += 1) {
        const yy = y + dy;
        for (let dx = -radius; dx <= radius; dx += 1) {
          const xx = x + dx;
          if (xx < 0 || xx >= width || yy < 0 || yy >= height || !dilated[yy * width + xx]) {
            solid = false;
            break;
          }
        }
      }
      repaired[pixel] = solid ? 1 : 0;
    }
  }

  // Restore small enclosed gray details (hair, straps, eyes), not the large
  // checkerboard pockets enclosed by a combined pose.
  const visited = new Uint8Array(count);
  const queue = new Uint32Array(count);
  for (let start = 0; start < count; start += 1) {
    if (repaired[start] || visited[start]) continue;
    let head = 0;
    let tail = 1;
    let touchesEdge = false;
    queue[0] = start;
    visited[start] = 1;
    const visit = (next: number) => {
      if (!repaired[next] && !visited[next]) {
        visited[next] = 1;
        queue[tail++] = next;
      }
    };
    while (head < tail) {
      const pixel = queue[head++];
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) touchesEdge = true;
      if (x > 0) visit(pixel - 1);
      if (x + 1 < width) visit(pixel + 1);
      if (y > 0) visit(pixel - width);
      if (y + 1 < height) visit(pixel + width);
    }
    if (!touchesEdge && tail <= 128) {
      for (let i = 0; i < tail; i += 1) repaired[queue[i]] = 1;
    }
  }

  for (let i = 0; i < count; i += 1) pixels[i * 4 + 3] = repaired[i] ? 255 : 0;
}
