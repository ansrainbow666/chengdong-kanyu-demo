const HOME_TYPES = ['自建房', '商品房', '别墅', '老宅', '祠堂', '其他'];
const STAGES = ['选址', '设计', '施工', '装修', '入住后调整', '其他'];
const FOCUSES = ['整体格局', '事业', '健康睡眠', '家庭关系', '学业成长', '采光动线'];
const ENVIRONMENT = ['前方有道路', '周边有水体', '有大型建筑遮挡', '场地存在明显高差', '有明显噪声或强风口'];

function options(values, selected, placeholder) {
  return `<option value="">${placeholder}</option>${values.map(value => `<option value="${value}" ${value === selected ? 'selected' : ''}>${value}</option>`).join('')}`;
}

export function mountDetailsForm({ root, state, onChange }) {
  root.innerHTML = `
    <section class="tool-card details-card" aria-labelledby="details-title">
      <div class="card-heading"><span class="number">03</span><div><h2 id="details-title">补充住宅资料</h2><p>只填写本次已确认的信息，未勾选的环境项不代表不存在。</p></div></div>
      <div class="form-grid">
        <label>住宅类型<select data-detail="homeType">${options(HOME_TYPES, state.homeType, '请选择')}</select></label>
        <label>建成或最近大修年份<input data-detail="buildYear" type="number" min="1900" max="${new Date().getFullYear()}" value="${state.buildYear || ''}" placeholder="例如 2018"></label>
        <label>当前阶段<select data-detail="projectStage">${options(STAGES, state.projectStage, '请选择')}</select></label>
        <label>本次重点诉求<select data-detail="focus">${options(FOCUSES, state.focus, '请选择')}</select></label>
        <label>排盘流年<input data-flying-input="targetYear" type="number" min="1900" max="2100" value="${state.flyingStarInput.targetYear}"></label>
        <label>排盘流月<select data-flying-input="targetMonth">${Array.from({length:12},(_,index)=>`<option value="${index+1}" ${state.flyingStarInput.targetMonth===index+1?'selected':''}>${index+1}月</option>`).join('')}</select></label>
      </div>
      <fieldset class="environment-options">
        <legend>亲眼确认的外部环境</legend>
        ${ENVIRONMENT.map(item => `<label><input type="checkbox" data-environment value="${item}" ${state.environment.includes(item) ? 'checked' : ''}><span>${item}</span></label>`).join('')}
      </fieldset>
    </section>`;

  root.addEventListener('change', event => {
    const key = event.target.dataset.detail;
    if (key) onChange({ [key]: event.target.value });
    const flyingKey = event.target.dataset.flyingInput;
    if (flyingKey) onChange({ flyingStarInput: { ...state.flyingStarInput, [flyingKey]: Number(event.target.value) } });
    if (event.target.matches('[data-environment]')) {
      const environment = [...root.querySelectorAll('[data-environment]:checked')].map(input => input.value);
      onChange({ environment });
    }
  });
}
