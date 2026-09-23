const MESSAGES = Object.freeze({
  floorPlan: '请先选择户型图',
  houseBearing: '请先记录宅向',
  doorBearing: '请先记录门向',
  homeType: '请选择住宅类型',
  projectStage: '请选择当前阶段',
  focus: '请选择本次重点诉求'
});

const REQUIRED_BY_STEP = Object.freeze({
  upload: ['floorPlan'],
  direction: ['floorPlan', 'houseBearing', 'doorBearing'],
  details: ['floorPlan', 'houseBearing', 'doorBearing', 'homeType', 'projectStage', 'focus'],
  confirm: ['floorPlan', 'houseBearing', 'doorBearing', 'homeType', 'projectStage', 'focus'],
  report: ['floorPlan', 'houseBearing', 'doorBearing', 'homeType', 'projectStage', 'focus']
});

function missing(value) {
  return value === null || value === undefined || value === '';
}

export function validateStep(step, state = {}) {
  const fields = REQUIRED_BY_STEP[step] || [];
  const field = fields.find(key => missing(state[key]));
  return field ? { ok: false, field, message: MESSAGES[field] } : { ok: true };
}
