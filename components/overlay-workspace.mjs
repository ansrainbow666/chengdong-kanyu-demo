import { MOUNTAINS } from '../lib/compass-engine.mjs';
import { calculateBazhaiDemo } from '../lib/bazhai-engine.mjs';
import { dynamicPalaceLayout } from '../lib/dynamic-palace-engine.mjs';
import { calculateAnnualStarChart, calculateFlyingStarResult } from '../lib/flying-star-engine.mjs';

export function overlayControls(state) {
  return `<div class="overlay-controls layer-switches" aria-label="专业叠盘控制">
    <label><input type="checkbox" data-overlay-layer="grid" ${state.layers.grid ? 'checked' : ''}>九宫</label>
    <label><input type="checkbox" data-overlay-layer="bazhai" ${state.layers.bazhai ? 'checked' : ''}>八宅</label>
    <label><input type="checkbox" data-overlay-layer="annualStars" ${state.layers.annualStars ? 'checked' : ''}>九星</label>
    <label><input type="checkbox" data-overlay-layer="dynamicPalace" ${state.layers.dynamicPalace ? 'checked' : ''}>动态九宫</label>
    <label><input type="checkbox" data-overlay-layer="mountains" ${state.layers.mountains ? 'checked' : ''}>二十四山</label>
    <label><input type="checkbox" data-overlay-layer="natal" ${state.layers.natal ? 'checked' : ''}>玄空三盘</label>
    <label><input type="checkbox" data-overlay-layer="annotations" ${state.layers.annotations ? 'checked' : ''}>格局标注</label>
    <label>大小 <output data-overlay-scale-value>${Math.round(state.analysis.scale * 100)}%</output><input type="range" data-overlay-scale min="0.6" max="1.5" step="0.05" value="${state.analysis.scale}"></label>
    <label>透明度 <output data-overlay-opacity-value>${Math.round(state.analysis.opacity * 100)}%</output><input type="range" data-overlay-opacity min="0.25" max="1" step="0.05" value="${state.analysis.opacity}"></label>
    <button type="button" data-dynamic-palace-mode="${state.dynamicPalace.mode === 'xiantian' ? 'houtian' : 'xiantian'}">${state.dynamicPalace.mode === 'xiantian' ? '切换后天八卦' : '切换先天八卦'}</button>
    <label>九宫转角<input type="range" data-dynamic-palace-rotation min="0" max="345" step="15" value="${state.dynamicPalace.rotation}"></label>
    <button type="button" data-overlay-action="flip">南北调转</button><button type="button" data-overlay-action="reset">复位叠盘</button>
  </div>`;
}

export function createOverlayRenderModel({ houseBearing, buildYear, overlay, flyingStarInput }) {
  const model = { overlay, bazhai: null, annualStars: null, dynamicPalace: null, flyingStars: null, missing: [] };
  if (overlay.layers.bazhai) model.bazhai = calculateBazhaiDemo(houseBearing);
  if (overlay.layers.dynamicPalace) model.dynamicPalace = dynamicPalaceLayout(overlay.dynamicPalace);
  if (overlay.layers.annualStars) model.annualStars = calculateAnnualStarChart(flyingStarInput.targetYear);
  if (overlay.layers.natal || overlay.layers.annual || overlay.layers.monthly) {
    if (!Number(buildYear)) model.missing.push('补充建造年份后生成玄空与流年九星');
    else model.flyingStars = calculateFlyingStarResult({ buildYear: Number(buildYear), facingDegree: houseBearing, targetYear: flyingStarInput.targetYear, targetMonth: flyingStarInput.targetMonth });
  }
  return model;
}

function gridPoint(radius, index) {
  return { x: (index % 3 - 1) * radius * 0.66, y: (Math.floor(index / 3) - 1) * radius * 0.66 };
}

function drawGridLayer({ context, radius }) {
  context.strokeStyle = '#c8a55a';
  for (const n of [-1, 0, 1]) {
    context.beginPath(); context.moveTo(-radius, n * radius / 3); context.lineTo(radius, n * radius / 3); context.stroke();
    context.beginPath(); context.moveTo(n * radius / 3, -radius); context.lineTo(n * radius / 3, radius); context.stroke();
  }
}

function drawMountainsLayer({ context, radius }) {
  context.fillStyle = '#f0d995'; context.font = '12px sans-serif';
  MOUNTAINS.forEach((label, index) => { const angle = index * Math.PI / 12 - Math.PI / 2; context.fillText(label, Math.cos(angle) * radius, Math.sin(angle) * radius); });
}

function drawBazhaiLayer({ context, radius, model }) {
  if (!model.bazhai) return;
  context.fillStyle = '#8d311f'; context.font = '700 12px sans-serif';
  model.bazhai.forEach(item => { const angle = item.bearing * Math.PI / 180 - Math.PI / 2; context.fillText(item.star, Math.cos(angle) * radius * .78, Math.sin(angle) * radius * .78); });
}

function drawAnnualStarsLayer({ context, radius, model }) {
  if (!model.annualStars) return;
  context.fillStyle = '#0d5b4d'; context.font = '700 14px sans-serif';
  model.annualStars.forEach((star, index) => { const point = gridPoint(radius, index); context.fillText(`年${star}`, point.x, point.y - 18); });
}

function drawDynamicPalaceLayer({ context, radius, model }) {
  if (!model.dynamicPalace) return;
  context.save(); context.rotate(model.dynamicPalace.rotation * Math.PI / 180); context.fillStyle = '#6d4213'; context.font = '11px sans-serif';
  model.dynamicPalace.cells.forEach((cell, index) => { const point = gridPoint(radius, index); context.fillText(`${cell.palace}${cell.number}·${cell.trigram}`, point.x, point.y + 18); });
  context.restore();
}

function drawFlyingStarLayer({ context, radius, model }) {
  const stars = model.flyingStars || model.stars;
  if (!stars) return;
  const layout = [5,0,7,6,4,2,1,8,3];
  context.fillStyle = '#f0d995'; context.font = '12px sans-serif';
  layout.forEach((palaceIndex, cellIndex) => {
    const point = gridPoint(radius, cellIndex), star = stars.palaces[palaceIndex];
    context.fillText(`山${star.mountain} 向${star.water} 运${star.period}`, point.x, point.y);
    if (model.overlay.layers.annual) context.fillText(`年${star.annual}`, point.x, point.y + 15);
    if (model.overlay.layers.monthly) context.fillText(`月${star.monthly}`, point.x, point.y + 30);
  });
}

function drawMissingMessage({ context, radius, model }) {
  if (!model.missing?.length) return;
  context.fillStyle = '#71291e'; context.font = '700 12px sans-serif';
  model.missing.forEach((message, index) => context.fillText(message, 0, radius * .55 + index * 16));
}

export function drawProfessionalOverlay(context, model) {
  const width = context.canvas.clientWidth || context.canvas.width;
  const height = context.canvas.clientHeight || context.canvas.height;
  const overlay = model.overlay || model;
  const radius = Math.min(width, height) * 0.38 * overlay.analysis.scale;
  context.save(); context.globalAlpha = overlay.analysis.opacity; context.translate(width / 2, height / 2); context.rotate(overlay.analysis.rotation * Math.PI / 180); context.textAlign = 'center';
  const args = { context, radius, model: model.overlay ? model : { ...model, overlay } };
  if (overlay.layers.grid) drawGridLayer(args);
  if (overlay.layers.mountains) drawMountainsLayer(args);
  if (overlay.layers.bazhai) drawBazhaiLayer(args);
  if (overlay.layers.annualStars) drawAnnualStarsLayer(args);
  if (overlay.layers.dynamicPalace) drawDynamicPalaceLayer(args);
  if (overlay.layers.natal || overlay.layers.annual || overlay.layers.monthly) drawFlyingStarLayer(args);
  drawMissingMessage(args);
  context.restore();
}
