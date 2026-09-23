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
  const point = input.model ? planToScreenPoint(annotation, input.model) : annotation;
  const centerX = input.model ? input.model.canvasWidth / 2 : input.imageWidth / 2;
  const centerY = input.model ? input.model.canvasHeight / 2 : input.imageHeight / 2;
  const position = describeAnnotationPosition(point, { centerX, centerY, analysisRotation: input.analysisRotation });
  const col = point.x < centerX ? 0 : point.x > centerX ? 2 : 1;
  const row = point.y < centerY ? 0 : point.y > centerY ? 2 : 1;
  const cellIndex = row * 3 + col;
  const layerValues = [];
  const render = input.renderModel || {};
  if (input.layers?.bazhai && render.bazhai) layerValues.push(`八宅：${render.bazhai[Math.round(position.bearing / 45) % 8].star}`);
  if (input.layers?.annualStars && render.annualStars) layerValues.push(`流年九星：${render.annualStars[cellIndex]}`);
  if (input.layers?.dynamicPalace && render.dynamicPalace) { const cell = render.dynamicPalace.cells[cellIndex]; layerValues.push(`动态九宫：${cell.palace}${cell.number}·${cell.trigram}`); }
  if (render.flyingStars && (input.layers?.natal || input.layers?.annual || input.layers?.monthly)) {
    const palaceIndex = [5,0,7,6,4,2,1,8,3][cellIndex], star = render.flyingStars.palaces[palaceIndex];
    layerValues.push(`玄空：山${star.mountain} 向${star.water} 运${star.period}${input.layers.annual ? ` 年${star.annual}` : ''}${input.layers.monthly ? ` 月${star.monthly}` : ''}`);
  }
  return `<article class="annotation-detail"><strong>${escapeHtml(annotation.label || type.name)}</strong><p>${position.direction} ${position.bearing.toFixed(1)}° · ${position.trigram}宫 · ${position.mountain}山</p><p>图层数据：${escapeHtml(layerValues.join(' / ') || '当前未开启可读取的分析层')}</p><p>专业判断：等待澄东先生复核</p><button type="button" data-annotation-action="move" data-annotation-id="${annotation.id}">移动</button><button type="button" data-annotation-action="delete" data-annotation-id="${annotation.id}">删除</button></article>`;
}
