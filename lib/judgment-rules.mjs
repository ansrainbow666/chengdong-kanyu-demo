import { directionForDegree } from './compass-engine.mjs';

export const DEMO_DISCLAIMER = '演示规则，仅供沟通参考';

const ORIENTATION_NOTES = {
  '正北': '建议结合采光、季节风向与场地高差复核主要空间。',
  '东北': '建议重点核对入口转折、空间衔接与东北侧现状。',
  '正东': '可优先观察晨间采光、东侧开口与外部遮挡。',
  '东南': '需结合通风路径、开口关系与东南侧外部环境综合判断。',
  '正南': '建议重点核对日照、前场开敞度与相邻建筑遮挡。',
  '西南': '需留意西晒、热环境与西南侧功能空间的使用时段。',
  '正西': '建议结合西侧遮阳、傍晚使用情况与开口尺度复核。',
  '西北': '建议同步观察季风、开口与西北侧道路或建筑关系。'
};

function finding(title, detail) {
  return { title, detail, status: '待复核' };
}

export function generateDemoReport(input = {}) {
  const house = directionForDegree(input.houseBearing);
  const door = directionForDegree(input.doorBearing);
  const environment = Array.isArray(input.environment) ? input.environment.filter(Boolean) : [];
  const homeType = input.homeType || '其他';
  const yearText = input.buildYear ? `${input.buildYear} 年建成或大修` : '建造年份待补';
  const findings = [
    finding('宅向观察', `${house.direction}·${house.mountain}山，${ORIENTATION_NOTES[house.direction]}`),
    finding('入口与动线', `门向为${door.direction}·${door.mountain}山，需结合门前空间、进出视线与室内主动线现场复核。`),
    finding('住宅阶段', `${homeType}·${input.projectStage || '阶段待补'}·${yearText}，建议在当前阶段优先处理“${input.focus || '整体格局'}”。`),
    finding('外部环境', environment.length ? `已记录用户亲眼确认的环境：${environment.join('、')}。` : '尚未确认道路、水体、遮挡、高差等外部环境，需现场补充。')
  ];

  const missing = ['室内外现场照片', '实际尺寸与楼层信息'];
  if (!input.buildYear) missing.push('建成或最近大修年份');
  if (!environment.length) missing.push('道路、水体、遮挡与高差等外部环境');

  return {
    disclaimer: DEMO_DISCLAIMER,
    summary: `${homeType} · 宅向${house.direction} ${house.degree.toFixed(1)}° · 门向${door.direction} ${door.degree.toFixed(1)}°`,
    basis: [
      `宅向：${house.direction}·${house.mountain}山·${house.degree.toFixed(1)}°`,
      `门向：${door.direction}·${door.mountain}山·${door.degree.toFixed(1)}°`,
      `重点诉求：${input.focus || '未填写'}`
    ],
    findings,
    missing,
    reviewAdvice: '建议补充现场内外照片、建筑尺寸与周边环境，由澄东先生结合实地情况进一步复核。'
  };
}
