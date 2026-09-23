import { directionForDegree, MOUNTAINS, normalizeDegree } from '../lib/compass-engine.mjs';
import { createOrientationSensor } from '../lib/orientation-sensor.mjs';
import { createLocationProvider } from '../lib/location-provider.mjs';
import { createLiveMeasurement } from '../lib/live-measurement.mjs';
import { EARTHLY_BRANCHES, FENJIN_LABELS, HEAVENLY_STEMS, HEXAGRAM_SEQUENCE, ringsForMode } from '../lib/luopan-layers.mjs';

const TRIGRAMS = ['坎', '艮', '震', '巽', '离', '坤', '兑', '乾'];
const TRIGRAM_SYMBOLS = ['☵', '☶', '☳', '☴', '☲', '☷', '☱', '☰'];
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
  return Array.from({ length: 120 }, (_, index) => {
    const degree = index * 3;
    const outer = point(151, degree);
    const inner = point(index % 5 === 0 ? 139 : 146, degree);
    return `<line x1="${inner.x}" y1="${inner.y}" x2="${outer.x}" y2="${outer.y}" />`;
  }).join('');
}

function sectorLines(count, innerRadius, outerRadius, className) {
  return Array.from({ length: count }, (_, index) => {
    const degree = index * 360 / count;
    const inner = point(innerRadius, degree);
    const outer = point(outerRadius, degree);
    return `<line class="${className}" x1="${inner.x}" y1="${inner.y}" x2="${outer.x}" y2="${outer.y}" />`;
  }).join('');
}

export function mountCompass({ root, state, onChange }) {
  let degree = normalizeDegree(state.compassDegree ?? state.houseBearing ?? 180);
  const compassDisplayMode = state.compassDisplayMode === 'comprehensive' ? 'comprehensive' : 'simple';
  const displayRings = ringsForMode(compassDisplayMode);
  let dragging = false;
  let measurementInput = {
    heading: degree,
    status: state.measurement.status,
    northReference: state.measurement.northReference,
    location: state.measurement.location,
    timestamp: state.measurement.timestamp
  };
  let measurementState = { ...state.measurement };
  const sensor = createOrientationSensor({
    onReading(value) { setDegree(value, true); },
    onSample(sample) {
      degree = normalizeDegree(sample.degree);
      measurementInput = { ...measurementInput, ...sample, heading: degree, timestamp: Date.now() };
      measurementState = { ...measurementState, ...sample, degree, timestamp: measurementInput.timestamp, location: measurementInput.location };
      paint();
      paintMeasurement();
      onChange({ compassDegree: degree, measurement: measurementState }, { render: false });
    },
    onStatus(value) {
      root.querySelector('[data-sensor-status]').textContent = STATUS_COPY[value];
      root.dataset.sensorStatus = value;
      const toggleButton = root.querySelector('[data-toggle-sensor]');
      if (toggleButton) toggleButton.textContent = value === 'locked' ? '继续测向' : '锁定当前方向';
      measurementInput = { ...measurementInput, status: value, heading: degree };
      paintMeasurement();
      measurementState = { ...measurementState, status: value, degree };
      onChange({ sensor: { status: value, degree }, measurement: measurementState }, { render: false });
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
      ${state.mode === 'professional' ? `<div class="luopan-density-switch" role="group" aria-label="罗盘显示密度">
        <button type="button" data-luopan-mode="simple" class="${compassDisplayMode === 'simple' ? 'is-active' : ''}">简明盘</button>
        <button type="button" data-luopan-mode="comprehensive" class="${compassDisplayMode === 'comprehensive' ? 'is-active' : ''}">综合盘</button>
      </div>` : ''}
      <div class="compass-layout">
        ${state.mode === 'beginner' ? `
        <div class="beginner-directions" role="group" aria-label="八方向快速选择">
          ${BEGINNER_DIRECTIONS.map(([label, value]) => `<button type="button" data-beginner-degree="${value}" class="${Math.round(degree / 45) * 45 % 360 === value ? 'is-active' : ''}"><strong>${label}</strong><span>${value}°</span></button>`).join('')}
        </div>` : `<div class="compass-wrap traditional-luopan" data-compass-drag>
          <svg class="compass-svg" viewBox="0 0 320 320" role="img" aria-label="传统多层二十四山罗盘">
            <defs>
              <radialGradient id="luopanGold" cx="45%" cy="38%"><stop offset="0" stop-color="#fff4bc"/><stop offset=".5" stop-color="#dfb85d"/><stop offset="1" stop-color="#9a5b19"/></radialGradient>
              <radialGradient id="heavenPool"><stop offset="0" stop-color="#f7e8b5"/><stop offset=".72" stop-color="#d6a43d"/><stop offset="1" stop-color="#713313"/></radialGradient>
              <filter id="luopanShadow"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity=".42"/></filter>
            </defs>
            <rect x="4" y="4" width="312" height="312" rx="18" class="luopan-wood-frame"/>
            <circle cx="160" cy="160" r="151" fill="url(#luopanGold)" class="luopan-disc" filter="url(#luopanShadow)"/>
            <g data-rotating-ring>
              <g class="luopan-degree-ring ticks">${tickMarks()}</g>
              ${sectorLines(24, 116, 139, 'luopan-sector-line')}
              ${sectorLines(12, 91, 113, 'luopan-fine-line')}
              ${sectorLines(8, 64, 88, 'luopan-sector-line')}
              <circle cx="160" cy="160" r="139" class="luopan-ring"/>
              <circle cx="160" cy="160" r="116" class="luopan-ring"/>
              <circle cx="160" cy="160" r="91" class="luopan-ring"/>
              <circle cx="160" cy="160" r="64" class="luopan-ring"/>
              <g class="luopan-mountain-ring">${ringLabels(MOUNTAINS, 127, 15, 'mountain-label')}</g>
              ${displayRings.showBranches ? `<g class="luopan-branch-ring">${ringLabels(EARTHLY_BRANCHES, 102, 30, 'branch-label')}</g>` : ''}
              ${displayRings.showStems ? `<g class="luopan-stem-ring">${ringLabels(HEAVENLY_STEMS, 110, 36, 'stem-label')}</g>` : ''}
              ${displayRings.showHexagrams ? `<g class="luopan-hexagram-ring">${ringLabels(HEXAGRAM_SEQUENCE, 145, 5.625, 'hexagram-label')}</g>` : ''}
              ${displayRings.showFenjin ? `<g class="luopan-fenjin-ring">${ringLabels(FENJIN_LABELS, 94, 7.5, 'fenjin-label')}</g>` : ''}
              <g class="luopan-trigram-ring">${ringLabels(TRIGRAM_SYMBOLS, 77, 45, 'trigram-symbol')}${ringLabels(TRIGRAMS, 55, 45, 'trigram-label')}</g>
            </g>
            <g class="luopan-heaven-pool">
              <circle cx="160" cy="160" r="42" fill="url(#heavenPool)"/>
              <circle cx="160" cy="160" r="35" class="heaven-pool-glass"/>
              <path d="M160 129 C177 139 177 151 160 160 C143 169 143 181 160 191 C125 190 125 130 160 129Z" class="yin-shape"/>
              <path d="M160 129 C143 139 143 151 160 160 C177 169 177 181 160 191 C195 190 195 130 160 129Z" class="yang-shape"/>
              <circle cx="160" cy="145" r="3.5" class="yang-dot"/><circle cx="160" cy="175" r="3.5" class="yin-dot"/>
            </g>
            <g data-compass-crosshair class="luopan-crosshair"><line x1="18" y1="160" x2="302" y2="160"/><line x1="160" y1="18" x2="160" y2="302"/></g>
            <path d="M160 10 153 30h14Z" class="luopan-pointer"/>
            <rect x="115" y="247" width="90" height="39" rx="9" class="luopan-readout"/>
            <text data-compass-degree x="160" y="262" text-anchor="middle" class="degree-label">180.0°</text>
            <text data-compass-direction x="160" y="278" text-anchor="middle" class="direction-label">正南 · 午山</text>
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
          <button type="button" class="sensor-button" data-enable-sensor>开启实时罗盘</button>
          <button type="button" class="sensor-button" data-toggle-sensor>锁定当前方向</button>
          <button type="button" class="sensor-button is-secondary" data-enable-location>启用可选定位</button>
          <p class="sensor-status" data-sensor-status>${STATUS_COPY.idle}</p>
          <p class="sensor-warning">手机罗盘可能受金属、电器和建筑结构影响，建议在不同位置复测。</p>
          <div class="live-measurement-grid" aria-label="实时测向数据">
            <div><span>朝向</span><strong data-live-heading></strong></div>
            <div><span>坐向</span><strong data-live-sitting></strong></div>
            <div><span>二十四山</span><strong data-live-mountain></strong></div>
            <div><span>八宫</span><strong data-live-trigram></strong></div>
            <div><span>稳定状态</span><strong data-live-stability></strong></div>
            <div><span>北向基准</span><strong data-live-north-reference></strong></div>
            <div><span>纬度</span><strong data-live-latitude></strong></div>
            <div><span>经度</span><strong data-live-longitude></strong></div>
            <div><span>记录时间</span><strong data-live-timestamp></strong></div>
          </div>
        </div>
      </div>
    </section>`;

  const ring = root.querySelector('[data-rotating-ring]');
  const degreeText = root.querySelector('[data-compass-degree]');
  const directionText = root.querySelector('[data-compass-direction]');
  const input = root.querySelector('[data-degree-input]');

  function paintMeasurement() {
    const measurement = createLiveMeasurement(measurementInput);
    const fields = {
      heading: measurement.headingLabel,
      sitting: measurement.sittingLabel,
      mountain: `${measurement.mountain}山 / 坐${measurement.sittingMountain}山`,
      trigram: measurement.trigram,
      stability: measurement.stabilityLabel,
      'north-reference': measurement.northReferenceLabel,
      latitude: measurement.latitudeLabel,
      longitude: measurement.longitudeLabel,
      timestamp: measurement.timestampLabel
    };
    Object.entries(fields).forEach(([key, value]) => {
      const node = root.querySelector(`[data-live-${key}]`);
      if (node) node.textContent = value;
    });
  }

  function paint() {
    const result = directionForDegree(degree);
    ring?.setAttribute('transform', `rotate(${-degree} 160 160)`);
    if (degreeText) degreeText.textContent = `${result.degree.toFixed(1)}°`;
    if (directionText) directionText.textContent = `${result.direction} · ${result.mountain}山`;
    input.value = result.degree.toFixed(1);
    measurementInput = { ...measurementInput, heading: result.degree };
    paintMeasurement();
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
    const luopanMode = event.target.closest('[data-luopan-mode]')?.dataset.luopanMode;
    if (luopanMode) return onChange({ compassDisplayMode: luopanMode });
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
    if (event.target.closest('[data-toggle-sensor]') && root.dataset.sensorStatus === 'locked') {
      sensor.unlock();
      measurementState = { ...measurementState, status: 'calibrating', locked: false };
      onChange({ measurement: measurementState }, { render: false });
      return;
    }
    if (event.target.closest('[data-toggle-sensor]')) {
      const locked = sensor.lock();
      if (locked) {
        degree = normalizeDegree(locked.degree);
        measurementState = { ...measurementState, ...locked, status: 'locked', degree, locked: true, timestamp: Date.now() };
        paint(); paintMeasurement();
        onChange({ compassDegree: degree, measurement: measurementState }, { render: false });
      }
    }
    if (event.target.closest('[data-enable-location]')) {
      const result = await location.request();
      measurementInput = { ...measurementInput, location: result.status === 'granted' ? result : null };
      measurementState = { ...measurementState, location: measurementInput.location, locationStatus: result.status };
      paintMeasurement();
      onChange({ measurement: measurementState }, { render: false });
      root.querySelector('[data-sensor-status]').textContent = result.status === 'granted' ? '定位已获取，仅用于本次测向口径' : '定位未启用，不影响手动与传感器测向';
    }
  });
  paint();

  return { destroy() { sensor.stop(); } };
}
