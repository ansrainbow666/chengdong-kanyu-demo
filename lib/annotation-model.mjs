import { directionForDegree, normalizeDegree } from './compass-engine.mjs';

export const ANNOTATION_TYPES = Object.freeze({
  kitchen: { name: '厨房', mark: '厨', color: '#d8614f' },
  bathroom: { name: '卫生间', mark: '卫', color: '#4d86c6' },
  masterBedroom: { name: '主卧', mark: '主', color: '#8b6bb3' },
  bedroom: { name: '次卧', mark: '卧', color: '#a27abf' },
  study: { name: '书房', mark: '书', color: '#3a9a68' },
  living: { name: '客厅', mark: '厅', color: '#b98624' },
  balcony: { name: '阳台', mark: '台', color: '#278f88' },
  entrance: { name: '大门', mark: '门', color: '#ad5f26' },
  stove: { name: '灶位', mark: '灶', color: '#c84738' },
  bed: { name: '床位', mark: '床', color: '#7052a3' },
  shrine: { name: '神位', mark: '神', color: '#9a7330' },
  stairs: { name: '楼梯', mark: '梯', color: '#5e7185' },
  storage: { name: '储物间', mark: '储', color: '#66727c' },
  custom: { name: '自定义', mark: '记', color: '#315f58' }
});

export function createAnnotation({ id, type, x, y, label = '' }) {
  if (!ANNOTATION_TYPES[type] || !Number.isFinite(x) || !Number.isFinite(y)) throw new TypeError('无效格局标注');
  return { id: String(id), type, x, y, label: String(label) };
}

export const addAnnotation = (items, item) => [...items, createAnnotation(item)];
export const moveAnnotation = (items, id, point) => items.map(item => item.id === id ? { ...item, x: point.x, y: point.y } : item);
export const removeAnnotation = (items, id) => items.filter(item => item.id !== id);

function geometry(model) {
  const transform = model.transform || {};
  return {
    cx: model.canvasWidth / 2 + (transform.x || 0),
    cy: model.canvasHeight / 2 + (transform.y || 0),
    scale: model.baseScale * (transform.scale || 1),
    angle: (transform.rotation || 0) * Math.PI / 180
  };
}

export function planToScreenPoint(point, model) {
  const { cx, cy, scale, angle } = geometry(model);
  const x = (point.x - model.imageWidth / 2) * scale;
  const y = (point.y - model.imageHeight / 2) * scale;
  return { x: cx + x * Math.cos(angle) - y * Math.sin(angle), y: cy + x * Math.sin(angle) + y * Math.cos(angle) };
}

export function screenToPlanPoint(point, model) {
  const { cx, cy, scale, angle } = geometry(model);
  const x = point.x - cx, y = point.y - cy;
  const unrotatedX = x * Math.cos(angle) + y * Math.sin(angle);
  const unrotatedY = -x * Math.sin(angle) + y * Math.cos(angle);
  return { x: unrotatedX / scale + model.imageWidth / 2, y: unrotatedY / scale + model.imageHeight / 2 };
}

export function describeAnnotationPosition(point, { centerX = 0, centerY = 0, analysisRotation = 0 } = {}) {
  const dx = point.x - centerX, dy = point.y - centerY;
  const bearing = normalizeDegree(Math.atan2(dx, -dy) * 180 / Math.PI - analysisRotation);
  const direction = directionForDegree(bearing);
  return { bearing, direction: direction.direction, mountain: direction.mountain, trigram: direction.trigram };
}
