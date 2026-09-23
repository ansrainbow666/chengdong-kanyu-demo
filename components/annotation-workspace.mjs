import { ANNOTATION_TYPES, describeAnnotationPosition, planToScreenPoint } from '../lib/annotation-model.mjs';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export function hitTestAnnotation(point, annotations, radius = 24) {
  return [...annotations]
    .map(item => ({ item, distance: Math.hypot(point.x - item.x, point.y - item.y) }))
    .filter(candidate => candidate.distance <= radius)
    .sort((a, b) => a.distance - b.distance)[0]?.item || null;
}

export function annotationToolbar(state) {
  const buttons = Object.entries(ANNOTATION_TYPES).map(([key, value]) =>
    `<button type="button" data-annotation-type="${key}" aria-pressed="${state.annotationTool.type === key}"><b style="--marker:${value.color}">${value.mark}</b>${value.name}</button>`
  ).join('');
  return `<section class="annotation-tools" aria-label="格局标注"><h4>格局标注</h4><div class="annotation-types">${buttons}</div><label>自定义名称<input data-annotation-custom-label maxlength="12" value="${escapeHtml(state.annotationTool.customLabel || '')}"></label><p data-annotation-hint>选择类型后点击户型图放置；点击已有标记可查看、移动或删除。</p><div data-annotation-details></div></section>`;
}

export function drawAnnotations(context, { annotations, model }) {
  annotations.forEach(item => {
    const point = planToScreenPoint(item, model);
    const type = ANNOTATION_TYPES[item.type];
    context.save();
    context.beginPath(); context.arc(point.x, point.y, 15, 0, Math.PI * 2); context.fillStyle = type.color; context.fill();
    context.strokeStyle = '#fff'; context.lineWidth = 2; context.stroke();
    context.fillStyle = '#fff'; context.font = '700 12px sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(type.mark, point.x, point.y);
    context.restore();
  });
}

export function annotationDetails(annotation, input) {
  if (!annotation) return '';
  const type = ANNOTATION_TYPES[annotation.type];
  const position = describeAnnotationPosition(annotation, { centerX: input.imageWidth / 2, centerY: input.imageHeight / 2, analysisRotation: input.analysisRotation });
  const enabled = Object.entries(input.layers || {}).filter(([, value]) => value).map(([key]) => key).join(' / ') || '无';
  return `<article class="annotation-detail"><strong>${escapeHtml(annotation.label || type.name)}</strong><p>${position.direction} ${position.bearing.toFixed(1)}° · ${position.trigram}宫 · ${position.mountain}山</p><p>已开启图层：${escapeHtml(enabled)}</p><p>专业判断：等待澄东先生复核</p><button type="button" data-annotation-action="move" data-annotation-id="${annotation.id}">移动</button><button type="button" data-annotation-action="delete" data-annotation-id="${annotation.id}">删除</button></article>`;
}
