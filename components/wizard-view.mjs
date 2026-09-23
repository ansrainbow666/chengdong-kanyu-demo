import { validateStep } from '../lib/validation.mjs';

const STEPS = [
  { id: 1, key: 'upload', label: '户型' },
  { id: 2, key: 'direction', label: '定向' },
  { id: 3, key: 'details', label: '资料' },
  { id: 4, key: 'confirm', label: '确认' },
  { id: 5, key: 'report', label: '报告' }
];

function uploadStep(state) {
  if (state.floorPlan?.objectUrl) {
    return `
      <section class="tool-card image-card" aria-labelledby="upload-title">
        <div class="card-heading"><span class="number">01</span><div><h2 id="upload-title">户型图工作区</h2><p>拖动、缩放或旋转图纸，确认后进入方位设置。</p></div></div>
        ${state.imageError ? `<div class="error-summary" role="alert">${escapeHtml(state.imageError)}</div>` : ''}
        <div class="canvas-shell">
          <canvas id="floor-plan-canvas" aria-label="户型图预览，可拖动和缩放"></canvas>
          <div class="canvas-tools" aria-label="户型图操作">
            <button type="button" data-image-action="rotate">旋转 15°</button>
            <button type="button" data-image-action="reset">恢复</button>
            <button type="button" data-image-action="remove">重新选择</button>
          </div>
        </div>
        <div class="selected-file"><span>当前图纸</span><strong>${escapeHtml(state.floorPlan.name)}</strong></div>
        <section class="overlay-demo" aria-labelledby="overlay-title"><h3 id="overlay-title">专业叠盘</h3><p>九宫、二十四山、玄空三盘将在确认宅向后叠加于户型图。</p><div class="overlay-controls"><label><input type="checkbox" data-overlay-layer="grid" ${state.overlay.layers.grid ? 'checked' : ''}>九宫</label><label><input type="checkbox" data-overlay-layer="mountains" ${state.overlay.layers.mountains ? 'checked' : ''}>二十四山</label><label>大小 <output data-overlay-scale-value>${Math.round(state.overlay.analysis.scale * 100)}%</output><input type="range" data-overlay-scale min="0.6" max="1.5" step="0.05" value="${state.overlay.analysis.scale}"></label><label>透明度 <output data-overlay-opacity-value>${Math.round(state.overlay.analysis.opacity * 100)}%</output><input type="range" data-overlay-opacity min="0.25" max="1" step="0.05" value="${state.overlay.analysis.opacity}"></label><button type="button" data-overlay-action="flip">南北调转</button><button type="button" data-overlay-action="reset">复位叠盘</button></div></section>
        <p class="privacy-note"><span aria-hidden="true">◈</span> 所有操作均在当前设备中完成。</p>
      </section>`;
  }
  const selected = state.floorPlan?.name
    ? `<div class="selected-file"><span>已选择</span><strong>${escapeHtml(state.floorPlan.name)}</strong></div>`
    : '';
  return `
    <section class="tool-card" aria-labelledby="upload-title">
      <div class="card-heading"><span class="number">01</span><div><h2 id="upload-title">上传户型图</h2><p>拍照或选择图纸，图片仅在当前设备中读取。</p></div></div>
      ${state.imageError ? `<div class="error-summary" role="alert">${escapeHtml(state.imageError)}</div>` : ''}
      <label class="upload-zone" for="floor-plan-input">
        <span class="upload-icon" aria-hidden="true">↑</span><strong>选择户型图</strong>
        <span>JPG、PNG、WebP、HEIC · 最大 15 MB</span>
        <input id="floor-plan-input" data-field="floorPlan" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif">
      </label>
      ${selected}
      <p class="privacy-note"><span aria-hidden="true">◈</span> 户型图不上传服务器，刷新页面后自动清除。</p>
    </section>`;
}

function placeholderStep(state) {
  const step = STEPS[state.step - 1];
  if (step.key === 'direction') {
    return '<div id="compass-root"></div>';
  }
  if (step.key === 'details') return '<div id="details-root"></div>';
  if (step.key === 'confirm') return '<div id="confirmation-root"></div>';
  if (step.key === 'report') return '<div id="report-root"></div>';
  const descriptions = {
    direction: '新手选向与专业罗盘将在这里记录宅向和门向。',
    details: '补充住宅类型、年份、阶段、诉求和现场环境。',
    confirm: '在生成报告前集中确认本次推演依据。',
    report: '报告将展示方位摘要、待复核项与先生复核入口。'
  };
  return `<section class="tool-card empty-stage"><span class="number">0${step.id}</span><p class="eyebrow">${step.label.toUpperCase()}</p><h2>${step.label}推演</h2><p>${descriptions[step.key]}</p></section>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export function mountWizard({ root, state: initialState, onChange }) {
  let state = initialState;
  let error = null;

  function render(nextState = state) {
    state = nextState;
    root.innerHTML = `
      <nav class="stepper" aria-label="堪舆流程">
        ${STEPS.map(step => `<button type="button" class="step ${step.id === state.step ? 'is-current' : ''} ${step.id < state.step ? 'is-complete' : ''}" data-go-step="${step.id}" ${step.id > state.step ? 'disabled' : ''}><b>${step.id}</b><span>${step.label}</span></button>`).join('')}
      </nav>
      ${error ? `<div class="error-summary" role="alert">${escapeHtml(error.message)}</div>` : ''}
      ${state.step === 1 ? uploadStep(state) : placeholderStep(state)}
      <div class="wizard-actions">
        ${state.step > 1 ? '<button type="button" class="secondary-button" data-wizard-back>上一步</button>' : '<span></span>'}
        ${state.step < 5 ? `<button type="button" class="primary-button" data-wizard-next>${state.step === 4 ? '生成初步报告' : '下一步'} <span aria-hidden="true">→</span></button>` : ''}
      </div>`;
  }

  root.addEventListener('click', event => {
    const stepButton = event.target.closest('[data-go-step]');
    if (stepButton) return onChange({ step: Number(stepButton.dataset.goStep) });
    if (event.target.closest('[data-wizard-back]')) return onChange({ step: Math.max(1, state.step - 1) });
    if (!event.target.closest('[data-wizard-next]')) return;
    const current = STEPS[state.step - 1];
    const result = validateStep(current.key, state);
    if (!result.ok) {
      error = result;
      render(state);
      root.querySelector(`[data-field="${result.field}"]`)?.focus();
      return;
    }
    error = null;
    onChange({ step: Math.min(5, state.step + 1) });
  });

  root.addEventListener('change', event => {
    if (event.target.id !== 'floor-plan-input') return;
    const file = event.target.files?.[0];
    if (file) root.dispatchEvent(new CustomEvent('floorplan:selected', { detail: file }));
  });

  render();
  return { render };
}
