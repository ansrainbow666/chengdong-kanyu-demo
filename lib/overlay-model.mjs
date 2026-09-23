import { normalizeDegree } from './compass-engine.mjs';

const DEFAULT = Object.freeze({
  image: Object.freeze({ x: 0, y: 0, scale: 1, rotation: 0 }),
  analysis: Object.freeze({ scale: 1, rotation: 0, opacity: 0.8 }),
  layers: Object.freeze({ grid: true, bazhai: false, annualStars: false, dynamicPalace: false, mountains: true, natal: true, annual: false, monthly: false, annotations: true }),
  dynamicPalace: Object.freeze({ mode: 'houtian', rotation: 0 })
});

export function createOverlayState(seed = {}) {
  return { image: { ...DEFAULT.image, ...seed.image }, analysis: { ...DEFAULT.analysis, ...seed.analysis }, layers: { ...DEFAULT.layers, ...seed.layers }, dynamicPalace: { ...DEFAULT.dynamicPalace, ...seed.dynamicPalace } };
}
export function updateImageTransform(state, patch) { return { ...createOverlayState(state), image: { ...state.image, ...patch } }; }
export function updateAnalysisTransform(state, patch) { return { ...createOverlayState(state), analysis: { ...state.analysis, ...patch, rotation: patch.rotation == null ? state.analysis.rotation : normalizeDegree(patch.rotation) } }; }
export function flipNorthSouth(state) { return updateAnalysisTransform(state, { rotation: state.analysis.rotation + 180 }); }
export function toggleOverlayLayer(state, layer) { return { ...createOverlayState(state), layers: { ...state.layers, [layer]: !state.layers[layer] } }; }
export function updateDynamicPalace(state, patch) {
  const current = createOverlayState(state);
  const rotation = patch.rotation == null ? current.dynamicPalace.rotation : normalizeDegree(patch.rotation);
  return { ...current, dynamicPalace: { ...current.dynamicPalace, ...patch, rotation } };
}
