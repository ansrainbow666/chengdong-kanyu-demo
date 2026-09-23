import { MOUNTAINS } from '../lib/compass-engine.mjs';

export function overlayControls(state) {
  return `<div class="overlay-controls" aria-label="专业叠盘控制">
    <label><input type="checkbox" data-overlay-layer="grid" ${state.layers.grid ? 'checked' : ''}>九宫</label>
    <label><input type="checkbox" data-overlay-layer="mountains" ${state.layers.mountains ? 'checked' : ''}>二十四山</label>
    <label><input type="checkbox" data-overlay-layer="natal" ${state.layers.natal ? 'checked' : ''}>玄空三盘</label>
    <label>大小<input type="range" data-overlay-scale min="0.6" max="1.5" step="0.05" value="${state.analysis.scale}"></label>
    <label>透明度<input type="range" data-overlay-opacity min="0.25" max="1" step="0.05" value="${state.analysis.opacity}"></label>
    <button type="button" data-overlay-action="flip">南北调转</button><button type="button" data-overlay-action="reset">复位叠盘</button>
  </div>`;
}

export function drawProfessionalOverlay(context, model) {
  const width = context.canvas.clientWidth || context.canvas.width;
  const height = context.canvas.clientHeight || context.canvas.height;
  const radius = Math.min(width, height) * 0.38 * model.analysis.scale;
  context.save(); context.globalAlpha = model.analysis.opacity; context.translate(width / 2, height / 2); context.rotate(model.analysis.rotation * Math.PI / 180);
  context.strokeStyle = '#c8a55a'; context.fillStyle = '#f0d995'; context.textAlign = 'center';
  if (model.layers.grid) for (const n of [-1, 0, 1]) { context.beginPath(); context.moveTo(-radius, n * radius / 3); context.lineTo(radius, n * radius / 3); context.stroke(); context.beginPath(); context.moveTo(n * radius / 3, -radius); context.lineTo(n * radius / 3, radius); context.stroke(); }
  if (model.layers.mountains) MOUNTAINS.forEach((label, index) => { const angle = index * Math.PI / 12 - Math.PI / 2; context.fillText(label, Math.cos(angle) * radius, Math.sin(angle) * radius); });
  if (model.stars && model.layers.natal) {
    const layout=[5,0,7,6,4,2,1,8,3];
    context.font='12px sans-serif';
    layout.forEach((palaceIndex, cellIndex) => { const row=Math.floor(cellIndex/3), col=cellIndex%3, star=model.stars.palaces[palaceIndex]; const x=(col-1)*radius*0.66, y=(row-1)*radius*0.66; context.fillText(`山${star.mountain} 向${star.water} 运${star.period}`,x,y); if(model.layers.annual) context.fillText(`年${star.annual}`,x,y+15); if(model.layers.monthly) context.fillText(`月${star.monthly}`,x,y+30); });
  }
  context.restore();
}
