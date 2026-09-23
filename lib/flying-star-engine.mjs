import { normalizeDegree } from './compass-engine.mjs';
import { MOUNTAINS } from './compass-engine.mjs';
import { annualCenterStar, monthlyCenterStar } from './flying-star-calendar.mjs';

export const PALACES = Object.freeze(['坎', '坤', '震', '巽', '中', '乾', '兑', '艮', '离']);
export const FLY_ORDER = Object.freeze([4, 5, 6, 7, 8, 0, 1, 2, 3]);

export function periodForYear(year) {
  const value = Number(year);
  if (!Number.isInteger(value) || value < 1864 || value > 2043) throw new Error('测试版支持 1864–2043 年');
  return Math.floor((value - 1864) / 20) + 1;
}
export function flyNineStars(center, forward = true) {
  const start = Number(center);
  if (!Number.isInteger(start) || start < 1 || start > 9) throw new Error('中宫星必须为 1–9');
  const result = Array(9);
  FLY_ORDER.forEach((palace, index) => { result[palace] = ((start - 1 + (forward ? index : -index) + 90) % 9) + 1; });
  return result;
}
function palaceForDegree(degree) {
  const map = { 0: 0, 45: 7, 90: 2, 135: 3, 180: 8, 225: 1, 270: 6, 315: 5 };
  return map[(Math.round(normalizeDegree(degree) / 45) * 45) % 360];
}
const YANG_MOUNTAINS = new Set(['艮','寅','甲','巽','巳','丙','坤','申','庚','乾','亥','壬']);
export function isYangMountain(degree) { return YANG_MOUNTAINS.has(MOUNTAINS[Math.floor((normalizeDegree(degree)+7.5)/15)%24]); }
function forwardFor(star, degree) { return isYangMountain(degree); }

export function calculateFlyingStarResult(input) {
  const period = periodForYear(Number(input.buildYear));
  const facingDegree = normalizeDegree(input.facingDegree);
  const sittingDegree = normalizeDegree(facingDegree + 180);
  const periodChart = flyNineStars(period, true);
  const sittingStar = periodChart[palaceForDegree(sittingDegree)];
  const facingStar = periodChart[palaceForDegree(facingDegree)];
  const mountain = flyNineStars(sittingStar, forwardFor(sittingStar, sittingDegree));
  const water = flyNineStars(facingStar, forwardFor(facingStar, facingDegree));
  const annualCenter = annualCenterStar(Number(input.targetYear));
  const monthlyCenter = monthlyCenterStar(Number(input.targetYear), Number(input.targetMonth));
  const annualValues = flyNineStars(annualCenter, true), monthlyValues = flyNineStars(monthlyCenter, true);
  return { strategyVersion: 'general-demo-v1', period, facingDegree, sittingDegree, annual: { center: annualCenter, values: annualValues }, monthly: { center: monthlyCenter, values: monthlyValues }, palaces: PALACES.map((name, index) => ({ name, period: periodChart[index], mountain: mountain[index], water: water[index], annual: annualValues[index], monthly: monthlyValues[index] })), requiresReview: ['流派边界与立春、节气口径须由澄东先生复核'] };
}
