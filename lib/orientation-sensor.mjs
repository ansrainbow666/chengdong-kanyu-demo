import { normalizeDegree } from './compass-engine.mjs';
import { analyzeHeadingSamples } from './heading-stability.mjs';

export function createOrientationSensor({ windowRef = window, onReading, onSample, onStatus, timeoutMs = 4000, setTimer = setTimeout, clearTimer = clearTimeout }) {
  const OrientationEvent = windowRef.DeviceOrientationEvent;
  let active = false;
  let readings = [];
  let lockedSample = null;
  let denied = false;
  let eventTimer = null;

  function status(value) {
    onStatus?.(value);
  }

  function handle(event) {
    if (lockedSample) {
      onSample?.(lockedSample);
      return;
    }
    const raw = Number.isFinite(event.webkitCompassHeading)
      ? event.webkitCompassHeading
      : event.absolute === true && Number.isFinite(event.alpha) ? 360 - event.alpha : null;
    if (raw === null) return status('unavailable');
    if (eventTimer) { clearTimer(eventTimer); eventTimer = null; }
    const degree = normalizeDegree(raw);
    readings = [...readings.slice(-5), degree];
    const analysis = analyzeHeadingSamples(readings, { minSamples: 4, stableSpread: 12 });
    status(analysis.status);
    onReading?.(degree);
    onSample?.({ ...analysis, degree: analysis.mean ?? degree, locked: false, northReference: Number.isFinite(event.webkitCompassHeading) ? 'magnetic' : 'system' });
  }

  return {
    manualAvailable: true,
    async request() {
      if (denied) { status('denied'); return false; }
      if (!OrientationEvent) {
        status('unsupported');
        return false;
      }
      if (typeof OrientationEvent.requestPermission === 'function') {
        try {
          const permission = await OrientationEvent.requestPermission();
          if (permission !== 'granted') {
            denied = true;
            status('denied');
            return false;
          }
        } catch {
          denied = true;
          status('denied');
          return false;
        }
      }
      if (typeof windowRef.addEventListener !== 'function') {
        status('unsupported');
        return false;
      }
      if (!active) windowRef.addEventListener('deviceorientation', handle, true);
      active = true;
      status('calibrating');
      eventTimer = setTimer(() => { if (active && !readings.length) status('unavailable'); }, timeoutMs);
      return true;
    },
    stop() {
      if (active) windowRef.removeEventListener?.('deviceorientation', handle, true);
      active = false;
      readings = [];
      if (eventTimer) clearTimer(eventTimer);
      eventTimer = null;
      lockedSample = null;
      status('idle');
    },
    lock() {
      const analysis = analyzeHeadingSamples(readings, { minSamples: 4, stableSpread: 12 });
      if (analysis.status !== 'stable') return false;
      lockedSample = { ...analysis, degree: analysis.mean, locked: true };
      status('locked');
      onSample?.(lockedSample);
      return { ...lockedSample };
    },
    unlock() {
      lockedSample = null;
      readings = [];
      status('calibrating');
    }
  };
}
