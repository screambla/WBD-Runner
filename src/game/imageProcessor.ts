/**
 * High-precision image processor for hand-drawn character assets.
 *
 * Features:
 * 1. Connected border flood-fill background removal.
 * 2. Smooth alpha matting & defringing to preserve soft anti-aliased edges and line art.
 * 3. Preserves internal white/light body and clothing details.
 * 4. Crops transparent outer margins cleanly.
 * 5. High-resolution unified character rendering without artificial slicing artifacts.
 */

export interface ProcessedCharacter {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  dataUrl: string;
}

/**
 * Calculates background probability for a given RGB pixel.
 * Pure white paper, light gray scanner backgrounds, or subtle JPEG compression noise.
 */
function getBackgroundFactor(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const brightness = (r + g + b) / 3;
  const saturation = max - min;

  // Pure white to bright off-white background
  if (brightness >= 240 && saturation <= 25) {
    return 1.0;
  }
  if (brightness >= 220 && saturation <= 35) {
    return Math.min(1.0, (brightness - 200) / 20);
  }
  if (brightness >= 200 && saturation <= 20) {
    return Math.min(1.0, (brightness - 180) / 20);
  }

  return 0.0;
}

export async function processCharacterAsset(
  src: string
): Promise<ProcessedCharacter> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;

        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = w;
        sourceCanvas.height = h;

        const sourceCtx = sourceCanvas.getContext('2d', {
          willReadFrequently: true,
        });

        if (!sourceCtx) {
          reject(new Error('Could not create image processing context'));
          return;
        }

        sourceCtx.drawImage(img, 0, 0);

        const imageData = sourceCtx.getImageData(0, 0, w, h);
        const data = imageData.data;

        // Flood-fill connected background matrix
        // 0 = unvisited/foreground, >0 = background probability or distance
        const bgMap = new Float32Array(w * h);
        const visited = new Uint8Array(w * h);
        const queue = new Int32Array(w * h);
        let head = 0;
        let tail = 0;

        const trySeed = (x: number, y: number) => {
          if (x < 0 || x >= w || y < 0 || y >= h) return;
          const idx = y * w + x;
          if (visited[idx]) return;

          const p = idx * 4;
          const factor = getBackgroundFactor(data[p], data[p + 1], data[p + 2]);

          if (factor > 0.1 || data[p + 3] === 0) {
            visited[idx] = 1;
            bgMap[idx] = factor > 0 ? factor : 1.0;
            queue[tail++] = idx;
          }
        };

        // Seed outer image borders
        for (let x = 0; x < w; x++) {
          trySeed(x, 0);
          if (h > 1) trySeed(x, h - 1);
        }
        for (let y = 1; y < h - 1; y++) {
          trySeed(0, y);
          if (w > 1) trySeed(w - 1, y);
        }

        // Flood fill only through connected background pixels
        while (head < tail) {
          const idx = queue[head++];
          const x = idx % w;
          const y = Math.floor(idx / w);

          const neighbors = [
            [x - 1, y],
            [x + 1, y],
            [x, y - 1],
            [x, y + 1],
          ];

          for (let i = 0; i < 4; i++) {
            const [nx, ny] = neighbors[i];
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const nIdx = ny * w + nx;
              if (!visited[nIdx]) {
                const p = nIdx * 4;
                const factor = getBackgroundFactor(data[p], data[p + 1], data[p + 2]);
                if (factor > 0.15 || data[p + 3] === 0) {
                  visited[nIdx] = 1;
                  bgMap[nIdx] = factor > 0 ? factor : 1.0;
                  queue[tail++] = nIdx;
                }
              }
            }
          }
        }

        // Apply alpha matting & defringing pass to preserve anti-aliased edge details
        let minX = w;
        let minY = h;
        let maxX = -1;
        let maxY = -1;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            const p = idx * 4;

            if (visited[idx]) {
              const bgFactor = bgMap[idx];
              if (bgFactor >= 0.8) {
                data[p + 3] = 0;
              } else {
                // Soft alpha falloff for anti-aliased edge pixels
                const alphaFactor = 1.0 - bgFactor;
                data[p + 3] = Math.round(data[p + 3] * alphaFactor);
              }
            }

            if (data[p + 3] > 10) {
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }

        // Fallback for empty image
        if (maxX < minX || maxY < minY) {
          sourceCtx.putImageData(imageData, 0, 0);
          resolve({
            canvas: sourceCanvas,
            width: w,
            height: h,
            dataUrl: sourceCanvas.toDataURL('image/png'),
          });
          return;
        }

        sourceCtx.putImageData(imageData, 0, 0);

        // Crop tightly around character with 2px padding
        const padding = 2;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(w - 1, maxX + padding);
        maxY = Math.min(h - 1, maxY + padding);

        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;

        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = cropW;
        finalCanvas.height = cropH;

        const finalCtx = finalCanvas.getContext('2d');
        if (!finalCtx) {
          reject(new Error('Could not create final canvas'));
          return;
        }

        finalCtx.imageSmoothingEnabled = true;
        finalCtx.imageSmoothingQuality = 'high';
        finalCtx.clearRect(0, 0, cropW, cropH);
        finalCtx.drawImage(
          sourceCanvas,
          minX,
          minY,
          cropW,
          cropH,
          0,
          0,
          cropW,
          cropH
        );

        resolve({
          canvas: finalCanvas,
          width: cropW,
          height: cropH,
          dataUrl: finalCanvas.toDataURL('image/png'),
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load character image: ${src}`));
    };

    img.src = src;
  });
}

/**
 * Removes black/dark background from an asset (like milk bottle),
 * preserving glowing outlines, splashes, and internal white/cyan colors.
 */
export async function processDarkBackgroundAsset(
  src: string
): Promise<ProcessedCharacter> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;

        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = w;
        sourceCanvas.height = h;

        const sourceCtx = sourceCanvas.getContext('2d', {
          willReadFrequently: true,
        });

        if (!sourceCtx) {
          reject(new Error('Could not create processing context'));
          return;
        }

        sourceCtx.drawImage(img, 0, 0);

        const imageData = sourceCtx.getImageData(0, 0, w, h);
        const data = imageData.data;

        let minX = w;
        let minY = h;
        let maxX = -1;
        let maxY = -1;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            const p = idx * 4;
            const r = data[p];
            const g = data[p + 1];
            const b = data[p + 2];
            const maxVal = Math.max(r, g, b);

            // Black background removal with smooth alpha falloff
            if (maxVal < 14) {
              data[p + 3] = 0;
            } else if (maxVal < 38) {
              const alphaFactor = (maxVal - 14) / 24;
              data[p + 3] = Math.round(data[p + 3] * alphaFactor);
            }

            if (data[p + 3] > 10) {
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }

        sourceCtx.putImageData(imageData, 0, 0);

        if (maxX < minX || maxY < minY) {
          resolve({
            canvas: sourceCanvas,
            width: w,
            height: h,
            dataUrl: sourceCanvas.toDataURL('image/png'),
          });
          return;
        }

        // Crop tight bounding box
        const padding = 2;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(w - 1, maxX + padding);
        maxY = Math.min(h - 1, maxY + padding);

        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;

        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = cropW;
        finalCanvas.height = cropH;

        const finalCtx = finalCanvas.getContext('2d');
        if (!finalCtx) {
          reject(new Error('Could not create final canvas'));
          return;
        }

        finalCtx.imageSmoothingEnabled = true;
        finalCtx.imageSmoothingQuality = 'high';
        finalCtx.clearRect(0, 0, cropW, cropH);
        finalCtx.drawImage(
          sourceCanvas,
          minX,
          minY,
          cropW,
          cropH,
          0,
          0,
          cropW,
          cropH
        );

        resolve({
          canvas: finalCanvas,
          width: cropW,
          height: cropH,
          dataUrl: finalCanvas.toDataURL('image/png'),
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load dark background asset: ${src}`));
    };

    img.src = src;
  });
}

/**
 * Renders character artwork as a unified high-resolution image with smooth,
 * natural walking motion and orientation flipping.
 */
export function drawAnimatedCharacter(
  ctx: CanvasRenderingContext2D,
  char: ProcessedCharacter,
  centerX: number,
  centerY: number,
  renderW: number,
  renderH: number,
  facing: 'left' | 'right',
  isMoving: boolean,
  walkCycle: number,
  isInvulnerable?: boolean,
  currentTimeSec?: number
): void {
  const { canvas, width: srcW, height: srcH } = char;

  ctx.save();
  ctx.translate(centerX, centerY);

  // Blinking animation & glowing aura during invulnerability
  if (isInvulnerable) {
    const time = currentTimeSec || 0;
    // Oscillate alpha between 0.3 and 1.0 (smooth rapid blink)
    const blinkAlpha = Math.sin(time * 24) > 0 ? 1.0 : 0.3;
    ctx.globalAlpha = blinkAlpha;

    // Glowing invulnerability aura ring under character
    ctx.beginPath();
    ctx.arc(0, 0, renderH * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(163, 230, 53, 0.35)';
    ctx.fill();
  }

  // Horizontal flip for direction
  if (facing === 'left') {
    ctx.scale(-1, 1);
  }

  // Smooth walking bounce & natural tilt
  const bob = isMoving
    ? Math.abs(Math.sin(walkCycle * 1.2)) * 2.0
    : Math.sin(walkCycle * 2.0) * 0.8;

  const tilt = isMoving ? Math.sin(walkCycle) * 0.05 : 0;

  if (tilt !== 0) {
    ctx.rotate(tilt);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const drawX = -renderW / 2;
  const drawY = -renderH / 2 - bob;

  // Render unified character image without artificial slicing
  ctx.drawImage(
    canvas,
    0,
    0,
    srcW,
    srcH,
    drawX,
    drawY,
    renderW,
    renderH
  );

  ctx.restore();
}
