import { directionForDegree, MOUNTAINS, normalizeDegree } from '../lib/compass-engine.mjs';
import { createOrientationSensor } from '../lib/orientation-sensor.mjs';
import { createLocationProvider } from '../lib/location-provider.mjs';

const TRIGRAMS = ['坎', '艮', '震', '巽', '离', '坤', '兑', '乾'];
const BEGINNER_DIRECTIONS = [
  ['北', 0], ['东北', 45], ['东', 90], ['东南', 135],
  ['南', 180], ['西南', 225], ['西', 270], ['西北', 315]
];
const STATUS_COPY = {
  idle: '尚未开启手机测向',
  active: '手机测向已开启',
  calibrating: '正在采集方向样本，请保持手机稳定',
  stable: '读数已稳定，可以锁定测向',
  locked: '测向已锁定，新读数不会覆盖确认值',
  unavailable: '未收到可靠的绝对航向，请改用手动校准',
  unstable: '当前读数不稳定，请移动后复测',
  denied: '未获得传感器权限，可继续手动定向',
  unsupported: '当前设备不支持自动测向，可继续手动定向'
};

function point(radius, degree) {
  const angle = (degree - 90) * Math.PI / 180;
  return { x: 160 + radius * Math.cos(angle), y: 160 + radius * Math.sin(angle) };
}

function ringLabels(labels, radius, step, className) {
  return labels.map((label, index) => {
    const degree = index * step;
    const p = point(radius, degree);
    return `<text class="${className}" x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${degree} ${p.x} ${p.y})">${label}</text>`;
  }).join('');
}

function tickMarks() {
  return Array.from({ length: 72 }, (_, index) => {
    const degree = index * 5;
    const outer = point(151, degree);
    const inner = point(index % 3 === 0 ? 140 : 145, degree);
    return `<line x1="${inner.x}" y1="${inner.y}" x2="${outer.x}" y2="${outer.y}" />`;
  }).join('');
}

export function mountCompass({ root, state, onChange }) {
  let degree = normalizeDegree(state.compassDegree ?? state.houseBearing ?? 180);
  let dragging = false;
  const sensor = createOrientationSensor({
    onReading(value) { setDegree(value, true); },
    onStatus(value) {
      root.querySelector('[data-sensor-status]').textContent = STATUS_COPY[value];
      root.dataset.sensorStatus = value;
      onChange({ sensor: { status: value, degree } }, { render: false });
    }
  });
  const location = createLocationProvider();

  root.innerHTML = `
    <section class="compass-panel" aria-labelledby="compass-heading">
      <div class="card-heading"><span class="number">02</span><div><p class="eyebrow">FIELD BEARING</p><h2 id="compass-heading">${state.mode === 'beginner' ? '新手选向' : '专业罗盘'}</h2><p>${state.mode === 'beginner' ? '先选择八方位，再用角度做细微校准。' : '拖动盘面或输入角度，分别记录宅向与门向。'}</p></div></div>
      <div class="mode-switch" role="group" aria-label="定向模式">
        <button type="button" data-mode="beginner" class="${state.mode === 'beginner' ? 'is-active' : ''}">新手选向</button>
        <button type="button" data-mode="professional" class="${state.mode === 'professional' ? 'is-active' : ''}">专业罗盘</button>
      </div>
      <div class="compass-layout">
        ${state.mode === 'beginner' ? `
        <div class="beginner-directions" role="group" aria-label="八方向快速选择">
          ${BEGINNER_DIRECTIONS.map(([label, value]) => `<button type="button" data-beginner-degree="${value}" class="${Math.round(degree / 45) * 45 % 360 === value ? 'is-active' : ''}"><strong>${label}</strong><span>${value}°</span></button>`).join('')}
        </div>` : `<div class="compass-wrap" data-compass-drag>
          <svg class="compass-svg" viewBox="0 0 320 320" role="img" aria-label="二十四山罗盘">
            <defs><radialGradient id="compassGlow"><stop offset="0" stop-color="#153b34"/><stop offset="1" stop-color="#071d1a"/></radialGradient></defs>
            <circle cx="160" cy="160" r="154" fill="url(#compassGlow)" stroke="#c8a55a" stroke-width="1.5"/>
            <g class="ticks">${tickMarks()}</g>
            <circle cx="160" cy="160" r="133" fill="none" stroke="#47665f"/>
            <circle cx="160" cy="160" r="98" fill="none" stroke="#47665f"/>
            <g data-rotating-ring>${ringLabels(MOUNTAINS, 118, 15, 'mountain-label')}${ringLabels(TRIGRAMS, 80, 45, 'trigram-label')}</g>
            <path d="M160 15 153 34h14Z" fill="#e05f4f"/>
            <circle cx="160" cy="160" r="57" fill="#0d2c27" stroke="#2ac9ae"/>
            <text data-compass-degree x="160" y="150" text-anchor="middle" class="degree-label">180.0°</text>
            <text data-compass-direction x="160" y="177" text-anchor="middle" class="direction-label">正南 · 午山</text>
          </svg>
        </div>`}
        <div class="compass-controls">
          <label>${state.mode === 'beginner' ? '手动校准角度' : '当前角度'} <span><input data-degree-input type="number" min="0" max="359.9" step="0.1" value="${degree.toFixed(1)}"> °</span></label>
          <div class="bearing-records">
            <div><span>宅向</span><strong data-house-bearing>${state.houseBearing == null ? '待记录' : `${directionForDegree(state.houseBearing).direction} ${Number(state.houseBearing).toFixed(1)}°`}</strong></div>
            <div><span>门向</span><strong data-door-bearing>${state.doorBearing == null ? '待记录' : `${directionForDegree(state.doorBearing).direction} ${Number(state.doorBearing).toFixed(1)}°`}</strong></div>
          </div>
          <button type="button" class="record-button" data-record="house">记录为宅向</button>
          <button type="button" class="record-button is-secondary" data-record="door">记录为门向</button>
          <button type="button" class="sensor-button" data-enable-sensor>启用手机测向</button>
          <button type="button" class="sensor-button" data-lock-sensor>锁定测向</button>
          <button type="button" class="sensor-button is-secondary" data-enable-location>启用可选定位</button>
          <p class="sensor-status" data-sensor-status>${STATUS_COPY.idle}</p>
          <p class="sensor-warning">手机罗盘可能受金属、电器和建筑结构影响，建议在不同位置复测。</p>
        </div>
      </div>
    </section>`;

  const ring = root.querySelector('[data-rotating-ring]');
  const degreeText = root.querySelector('[data-compass-degree]');
  const directionText = root.querySelector('[data-compass-direction]');
  const input = root.querySelector('[data-degree-input]');

  function paint() {
    const result = directionForDegree(degree);
    ring?.setAttribute('transform', `rotate(${-degree} 160 160)`);
    if (degreeText) degreeText.textContent = `${result.degree.toFixed(1)}°`;
    if (directionText) directionText.textContent = `${result.direction} · ${result.mountain}山`;
    input.value = result.degree.toFixed(1);
    root.querySelectorAll('[data-beginner-degree]').forEach(button => {
      button.classList.toggle('is-active', Number(button.dataset.beginnerDegree) === Math.round(result.degree / 45) * 45 % 360);
    });
  }

  function setDegree(value, fromSensor = false) {
    try {
      degree = normalizeDegree(value);
      paint();
      onChange({ compassDegree: degree, ...(fromSensor ? { sensor: { status: 'active', degree } } : {}) }, { render: false });
    } catch {
      input.setCustomValidity('请输入 0–359.9 之间的角度');
    }
  }

  function degreeFromPointer(event) {
    const box = root.querySelector('[data-compass-drag]').getBoundingClientRect();
    const x = event.clientX - (box.left + box.width / 2);
    const y = event.clientY - (box.top + box.height / 2);
    return normalizeDegree(Math.atan2(y, x) * 180 / Math.PI + 90);
  }

  root.addEventListener('pointerdown', event => {
    if (!event.target.closest('[data-compass-drag]')) return;
    dragging = true;
    event.target.closest('[data-compass-drag]').setPointerCapture?.(event.pointerId);
    setDegree(degreeFromPointer(event));
  });
  root.addEventListener('pointermove', event => {
    if (dragging) setDegree(degreeFromPointer(event));
  });
  root.addEventListener('pointerup', () => { dragging = false; });
  root.addEventListener('input', event => {
    if (event.target.matches('[data-degree-input]')) setDegree(event.target.value);
  });
  root.addEventListener('click', async event => {
    const mode = event.target.closest('[data-mode]')?.dataset.mode;
    if (mode) return onChange({ mode });
    const beginnerDegree = event.target.closest('[data-beginner-degree]')?.dataset.beginnerDegree;
    if (beginnerDegree != null) setDegree(beginnerDegree);
    const record = event.target.closest('[data-record]')?.dataset.record;
    if (record === 'house') {
      onChange({ houseBearing: degree, overlay: { ...state.overlay, analysis: { ...state.overlay.analysis, rotation: degree } } });
      root.querySelector('[data-house-bearing]').textContent = `${directionForDegree(degree).direction} ${degree.toFixed(1)}°`;
    }
    if (record === 'door') {
      onChange({ doorBearing: degree });
      root.querySelector('[data-door-bearing]').textContent = `${directionForDegree(degree).direction} ${degree.toFixed(1)}°`;
    }
    if (event.target.closest('[data-enable-sensor]')) await sensor.request();
    if (event.target.closest('[data-lock-sensor]')) {
      const locked = sensor.lock();
      if (locked) onChange({ compassDegree: degree, measurement: { ...state.measurement, status: 'locked', degree, locked: true, timestamp: Date.now() } }, { render: false });
    }
    if (event.target.closest('[data-enable-location]')) {
      const result = await location.request();
      onChange({ measurement: { ...state.measurement, location: result.status === 'granted' ? result : null, locationStatus: result.status } }, { render: false });
      root.querySelector('[data-sensor-status]').textContent = result.status === 'granted' ? '定位已获取，仅用于本次测向口径' : '定位未启用，不影响手动与传感器测向';
    }
  });
  paint();

  return { destroy() { sensor.stop(); } };
}
