import { normalizeDegree } from './compass-engine.mjs';

export function circularMean(values) {
  if (!Array.isArray(values) || values.length === 0) throw new Error('至少需要一个方向样本');
  const radians = values.map(value => normalizeDegree(value) * Math.PI / 180);
  const x = radians.reduce((sum, value) => sum + Math.cos(value), 0);
  const y = radians.reduce((sum, value) => sum + Math.sin(value), 0);
  return normalizeDegree(Math.atan2(y, x) * 180 / Math.PI);
}

export function angularDistance(left, right) {
  const delta = Math.abs(normalizeDegree(left) - normalizeDegree(right));
  return Math.min(delta, 360 - delta);
}

export function analyzeHeadingSamples(samples, options = {}) {
  const values = [...samples].map(normalizeDegree);
  const minSamples = options.minSamples ?? 6;
  const stableSpread = options.stableSpread ?? 8;
  if (!values.length) return { status: 'calibrating', mean: null, maxDeviation: null, sampleCount: 0 };
  const mean = circularMean(values);
  const maxDeviation = Math.max(...values.map(value => angularDistance(value, mean)));
  const status = values.length < minSamples ? 'calibrating' : maxDeviation <= stableSpread ? 'stable' : 'unstable';
  return { status, mean, maxDeviation, sampleCount: values.length };
}
