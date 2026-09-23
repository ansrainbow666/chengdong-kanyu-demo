import { directionForDegree, normalizeDegree } from './compass-engine.mjs';

const STATUS_LABELS = {
  idle: '未开启',
  'permission-required': '未开启',
  calibrating: '校准中',
  unstable: '不稳定',
  stable: '稳定',
  locked: '已锁定',
  active: '测向中',
  denied: '权限被拒绝',
  unsupported: '设备不支持',
  unavailable: '无可靠读数'
};

function coordinate(value, positive, negative) {
  if (!Number.isFinite(value)) return '未获取';
  return `${Math.abs(value).toFixed(5)}°${value >= 0 ? positive : negative}`;
}

export function createLiveMeasurement(input = {}) {
  const heading = Number(normalizeDegree(Number.isFinite(input.heading) ? input.heading : 0).toFixed(10));
  const sitting = Number(normalizeDegree(heading + 180).toFixed(10));
  const facing = directionForDegree(heading);
  const seat = directionForDegree(sitting);
  const timestamp = Number.isFinite(input.timestamp) ? new Date(input.timestamp) : null;
  return {
    heading,
    sitting,
    headingLabel: `${facing.direction} ${heading.toFixed(1)}°`,
    sittingLabel: `${seat.direction} ${sitting.toFixed(1)}°`,
    mountain: facing.mountain,
    sittingMountain: seat.mountain,
    trigram: facing.trigram,
    stabilityLabel: STATUS_LABELS[input.status] || '未开启',
    northReferenceLabel: input.northReference === 'magnetic' ? '磁北' : input.northReference === 'system' ? '系统绝对方向' : '手动',
    latitudeLabel: coordinate(input.location?.latitude, 'N', 'S'),
    longitudeLabel: coordinate(input.location?.longitude, 'E', 'W'),
    timestampLabel: timestamp ? timestamp.toLocaleTimeString('zh-CN', { hour12: false }) : '未记录'
  };
}
