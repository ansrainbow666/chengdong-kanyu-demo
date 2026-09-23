const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

export function validateImageFile(file) {
  if (!file || !IMAGE_TYPES.has(String(file.type || '').toLowerCase())) {
    return { ok: false, message: '请选择 JPG、PNG、WebP 或 HEIC 图片' };
  }
  if (Number(file.size) > MAX_IMAGE_BYTES) {
    return { ok: false, message: '图片不能超过 15 MB' };
  }
  return { ok: true };
}

export function replaceObjectUrl(currentUrl, file, urlApi = URL) {
  if (currentUrl) urlApi.revokeObjectURL(currentUrl);
  return urlApi.createObjectURL(file);
}

function normalizeRotation(value) {
  const number = Number(value) || 0;
  return ((number % 360) + 360) % 360;
}

export function clampTransform(transform = {}) {
  return {
    x: Number(transform.x) || 0,
    y: Number(transform.y) || 0,
    scale: Math.min(6, Math.max(0.35, Number(transform.scale) || 1)),
    rotation: normalizeRotation(transform.rotation)
  };
}
