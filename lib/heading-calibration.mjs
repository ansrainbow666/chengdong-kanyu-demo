import { normalizeDegree } from './compass-engine.mjs';

export function applyHeadingCalibration(raw, offset = 0) {
  return normalizeDegree(Number(raw) + Number(offset));
}
