export type ImageSubjectFocus = {
  objectPosition: string;
  useSideBlur: boolean;
};

const DEFAULT_FOCUS: ImageSubjectFocus = {
  objectPosition: '50% 42%',
  useSideBlur: false,
};

const focusCache = new Map<string, ImageSubjectFocus>();

function sampleBackground(data: Uint8ClampedArray, width: number, height: number) {
  const points: Array<[number, number]> = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width / 2), 0],
    [Math.floor(width / 2), height - 1],
  ];

  let r = 0;
  let g = 0;
  let b = 0;

  for (const [x, y] of points) {
    const i = (y * width + x) * 4;
    r += data[i] ?? 255;
    g += data[i + 1] ?? 255;
    b += data[i + 2] ?? 255;
  }

  const count = points.length;
  return { r: r / count, g: g / count, b: b / count };
}

function isBackgroundPixel(
  r: number,
  g: number,
  b: number,
  bg: { r: number; g: number; b: number }
) {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const colorDist = Math.hypot(r - bg.r, g - bg.g, b - bg.b);

  if (colorDist < 42 && lum > 165) return true;
  if (lum > 238 && sat < 0.12) return true;
  if (lum > 212 && sat < 0.06) return true;

  return false;
}

function detectSubjectBounds(
  data: Uint8ClampedArray,
  width: number,
  height: number
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  const bg = sampleBackground(data, width, height);

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let foreground = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;

      if (isBackgroundPixel(r, g, b, bg)) continue;

      foreground += 1;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  const minPixels = Math.max(24, width * height * 0.015);
  if (foreground < minPixels || maxX <= minX || maxY <= minY) {
    return null;
  }

  const padX = Math.max(2, Math.round((maxX - minX) * 0.04));
  const padY = Math.max(2, Math.round((maxY - minY) * 0.03));

  return {
    minX: Math.max(0, minX - padX),
    minY: Math.max(0, minY - padY),
    maxX: Math.min(width - 1, maxX + padX),
    maxY: Math.min(height - 1, maxY + padY),
  };
}

function computeFocusFromBounds(
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  width: number,
  height: number,
  targetAspect: number
): ImageSubjectFocus {
  const subjectW = bounds.maxX - bounds.minX + 1;
  const subjectH = bounds.maxY - bounds.minY + 1;
  const centerX = bounds.minX + subjectW / 2;
  const centerY = bounds.minY + subjectH / 2;
  const subjectAspect = subjectW / subjectH;

  const objectPosition = `${(centerX / width) * 100}% ${(centerY / height) * 100}%`;

  // תמונה רחבה — שומרים את כל הדוגמנית עם רקע מטושטש מהצדדים
  const useSideBlur = subjectAspect > targetAspect * 0.92;

  return { objectPosition, useSideBlur };
}

function analyzeImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  targetAspect: number
): ImageSubjectFocus {
  const bounds = detectSubjectBounds(data, width, height);
  if (!bounds) return DEFAULT_FOCUS;
  return computeFocusFromBounds(bounds, width, height, targetAspect);
}

export function analyzeImageSubjectFocus(
  image: HTMLImageElement,
  targetAspect = 3 / 4
): ImageSubjectFocus {
  const maxSide = 160;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return DEFAULT_FOCUS;

  ctx.drawImage(image, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;

  return analyzeImageData(data, width, height, targetAspect);
}

export async function loadImageSubjectFocus(
  src: string,
  targetAspect = 3 / 4
): Promise<ImageSubjectFocus> {
  const cacheKey = `${src}::${targetAspect}`;
  const cached = focusCache.get(cacheKey);
  if (cached) return cached;

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';

    img.onload = () => {
      try {
        const focus = analyzeImageSubjectFocus(img, targetAspect);
        focusCache.set(cacheKey, focus);
        resolve(focus);
      } catch {
        resolve(DEFAULT_FOCUS);
      }
    };

    img.onerror = () => resolve(DEFAULT_FOCUS);
    img.src = src;
  });
}

export { DEFAULT_FOCUS };
