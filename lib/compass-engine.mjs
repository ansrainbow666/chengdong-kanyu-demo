const DIRECTIONS = [
  { direction: '正北', trigram: '坎' },
  { direction: '东北', trigram: '艮' },
  { direction: '正东', trigram: '震' },
  { direction: '东南', trigram: '巽' },
  { direction: '正南', trigram: '离' },
  { direction: '西南', trigram: '坤' },
  { direction: '正西', trigram: '兑' },
  { direction: '西北', trigram: '乾' }
];

export const MOUNTAINS = Object.freeze([
  '子', '癸', '丑', '艮', '寅', '甲', '卯', '乙', '辰', '巽', '巳', '丙',
  '午', '丁', '未', '坤', '申', '庚', '酉', '辛', '戌', '乾', '亥', '壬'
]);

export function normalizeDegree(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error('方向角度格式不正确');
  return ((number % 360) + 360) % 360;
}

export function directionForDegree(value) {
  const degree = normalizeDegree(value);
  const direction = DIRECTIONS[Math.floor((degree + 22.5) / 45) % 8];
  const mountain = MOUNTAINS[Math.floor((degree + 7.5) / 15) % 24];
  return { degree, direction: direction.direction, trigram: direction.trigram, mountain };
}
