import { directionForDegree } from '../lib/compass-engine.mjs';

function bearing(value) {
  const result = directionForDegree(value);
  return `${result.direction}·${result.mountain}山·${result.degree.toFixed(1)}°`;
}

export function mountConfirmation({ root, state }) {
  root.innerHTML = `
    <section class="tool-card confirmation-card" aria-labelledby="confirm-title">
      <div class="card-heading"><span class="number">04</span><div><h2 id="confirm-title">确认推演依据</h2><p>只有以下已确认资料会进入本次初步报告。</p></div></div>
      <div class="confirmation-grid">
        <figure class="plan-thumb"><img src="${state.floorPlan.objectUrl}" alt="当前户型图预览"><figcaption>${state.floorPlan.name}</figcaption></figure>
        <dl class="basis-list">
          <div><dt>宅向</dt><dd>${bearing(state.houseBearing)}</dd></div>
          <div><dt>门向</dt><dd>${bearing(state.doorBearing)}</dd></div>
          <div><dt>住宅</dt><dd>${state.homeType}${state.buildYear ? `·${state.buildYear} 年` : ''}</dd></div>
          <div><dt>阶段</dt><dd>${state.projectStage}</dd></div>
          <div><dt>重点</dt><dd>${state.focus}</dd></div>
          <div><dt>已确认环境</dt><dd>${state.environment.length ? state.environment.join('、') : '尚未补充'}</dd></div>
        </dl>
      </div>
      <div class="notice-box"><strong>请注意</strong><p>第一期未自动识别户型图中的房间、墙体、门窗或文字；报告仅使用你亲自确认的资料。</p></div>
    </section>`;
}
