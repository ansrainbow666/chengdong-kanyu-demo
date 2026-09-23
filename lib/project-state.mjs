const DEFAULT_STATE = Object.freeze({
  step: 1,
  mode: 'beginner',
  compassDisplayMode: 'simple',
  floorPlan: null,
  annotations: Object.freeze([]),
  annotationTool: Object.freeze({ mode: 'idle', type: null, movingId: null }),
  imageTransform: Object.freeze({ x: 0, y: 0, scale: 1, rotation: 0 }),
  compassDegree: 180,
  houseBearing: null,
  doorBearing: null,
  homeType: '',
  buildYear: '',
  projectStage: '',
  focus: '',
  environment: Object.freeze([]),
  sensor: Object.freeze({ status: 'idle', degree: null }),
  measurement: Object.freeze({ status: 'permission-required', samples: Object.freeze([]), degree: null, locked: false, northReference: 'unknown', offset: 0, timestamp: null, location: null }),
  overlay: Object.freeze({ image: Object.freeze({ x: 0, y: 0, scale: 1, rotation: 0 }), analysis: Object.freeze({ scale: 1, rotation: 0, opacity: 0.8 }), layers: Object.freeze({ grid: true, bazhai: false, annualStars: false, dynamicPalace: false, mountains: true, natal: true, annual: false, monthly: false, annotations: true }), dynamicPalace: Object.freeze({ mode: 'houtian', rotation: 0 }) }),
  flyingStarInput: Object.freeze({ buildYear: '', facingDegree: null, targetYear: new Date().getFullYear(), targetMonth: new Date().getMonth() + 1, period: null }),
  flyingStarResult: null
});

function cloneCollections(value) {
  return {
    ...value,
    imageTransform: { ...(value.imageTransform || DEFAULT_STATE.imageTransform) },
    environment: [...(value.environment || [])],
    annotations: (value.annotations || []).map(item => ({ ...item })),
    annotationTool: { ...(value.annotationTool || DEFAULT_STATE.annotationTool) },
    sensor: { ...(value.sensor || DEFAULT_STATE.sensor) },
    measurement: {
      ...(value.measurement || DEFAULT_STATE.measurement),
      samples: [...(value.measurement?.samples || DEFAULT_STATE.measurement.samples)],
      location: value.measurement?.location ? { ...value.measurement.location } : null
    },
    overlay: {
      ...(value.overlay || DEFAULT_STATE.overlay),
      image: { ...(value.overlay?.image || DEFAULT_STATE.overlay.image) },
      analysis: { ...(value.overlay?.analysis || DEFAULT_STATE.overlay.analysis) },
      layers: { ...(value.overlay?.layers || DEFAULT_STATE.overlay.layers) }
      ,dynamicPalace: { ...(value.overlay?.dynamicPalace || DEFAULT_STATE.overlay.dynamicPalace) }
    },
    flyingStarInput: { ...(value.flyingStarInput || DEFAULT_STATE.flyingStarInput) },
    flyingStarResult: value.flyingStarResult ? structuredClone(value.flyingStarResult) : null
  };
}

export function createProjectState(seed = {}) {
  return cloneCollections({ ...DEFAULT_STATE, ...seed });
}

export function updateProject(state, patch = {}) {
  return cloneCollections({ ...state, ...patch });
}
