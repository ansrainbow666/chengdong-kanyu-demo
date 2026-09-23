import { clampTransform } from '../lib/image-model.mjs';
import { drawProfessionalOverlay } from './overlay-workspace.mjs';
import { createOverlayState, flipNorthSouth, toggleOverlayLayer } from '../lib/overlay-model.mjs';
import { calculateFlyingStarResult } from '../lib/flying-star-engine.mjs';

export function mountImageWorkspace({ canvas, input, state, onChange }) {
  if (!canvas || !state.floorPlan?.objectUrl) return { destroy() {} };
  const context = canvas.getContext('2d');
  const image = new Image();
  const controlRoot = canvas.closest('.image-card') || canvas.parentElement;
  const pointers = new Map();
  let transform = clampTransform(state.imageTransform);
  let dragging = null;
  let pinch = null;
  let destroyed = false;

  function fitTransform() {
    transform = { x: 0, y: 0, scale: 1, rotation: 0 };
    onChange({ imageTransform: transform, imageError: '' }, { render: false });
    draw();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function draw() {
    if (destroyed) return;
    const rect = canvas.getBoundingClientRect();
    context.clearRect(0, 0, rect.width, rect.height);
    context.fillStyle = '#e9efec';
    context.fillRect(0, 0, rect.width, rect.height);
    if (!image.complete || !image.naturalWidth) return;
    const base = Math.min((rect.width - 24) / image.naturalWidth, (rect.height - 24) / image.naturalHeight);
    context.save();
    context.translate(rect.width / 2 + transform.x, rect.height / 2 + transform.y);
    context.rotate(transform.rotation * Math.PI / 180);
    context.scale(base * transform.scale, base * transform.scale);
    context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
    context.restore();
    if (state.houseBearing != null) {
      let stars=null; try { stars=calculateFlyingStarResult({buildYear:Number(state.buildYear),facingDegree:state.houseBearing,targetYear:state.flyingStarInput.targetYear,targetMonth:state.flyingStarInput.targetMonth}); } catch {}
      drawProfessionalOverlay(context, { ...createOverlayState(state.overlay), stars });
    }
  }

  function commit(patch) {
    transform = clampTransform({ ...transform, ...patch });
    onChange({ imageTransform: transform }, { render: false });
    draw();
  }

  function distance() {
    const [a, b] = [...pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }

  function onPointerDown(event) {
    canvas.setPointerCapture?.(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) dragging = { x: event.clientX, y: event.clientY, originX: transform.x, originY: transform.y };
    if (pointers.size === 2) pinch = { distance: distance(), scale: transform.scale };
  }

  function onPointerMove(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2 && pinch) {
      const nextDistance = distance();
      if (pinch.distance) commit({ scale: pinch.scale * nextDistance / pinch.distance });
      return;
    }
    if (dragging) commit({ x: dragging.originX + event.clientX - dragging.x, y: dragging.originY + event.clientY - dragging.y });
  }

  function onPointerUp(event) {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!pointers.size) dragging = null;
  }

  function onWheel(event) {
    event.preventDefault();
    commit({ scale: transform.scale * (event.deltaY > 0 ? 0.9 : 1.1) });
  }

  function onControls(event) {
    const action = event.target.closest('[data-image-action]')?.dataset.imageAction;
    if (action === 'rotate') commit({ rotation: transform.rotation + 15 });
    if (action === 'reset') fitTransform();
    if (action === 'remove') onChange({ floorPlan: null, imageTransform: { x: 0, y: 0, scale: 1, rotation: 0 }, imageError: '' });
    const overlayAction = event.target.closest('[data-overlay-action]')?.dataset.overlayAction;
    if (overlayAction === 'flip') onChange({ overlay: flipNorthSouth(createOverlayState(state.overlay)) });
    if (overlayAction === 'reset') onChange({ overlay: createOverlayState() });
    const overlayLayer = event.target.closest('[data-overlay-layer]')?.dataset.overlayLayer;
    if (overlayLayer) onChange({ overlay: toggleOverlayLayer(createOverlayState(state.overlay), overlayLayer) });
    if (event.target.matches('[data-overlay-scale]')) onChange({ overlay: { ...createOverlayState(state.overlay), analysis: { ...state.overlay.analysis, scale: Number(event.target.value) } } });
    if (event.target.matches('[data-overlay-opacity]')) onChange({ overlay: { ...createOverlayState(state.overlay), analysis: { ...state.overlay.analysis, opacity: Number(event.target.value) } } });
  }

  image.addEventListener('load', resize, { once: true });
  image.addEventListener('error', () => {
    if (destroyed) return;
    onChange({
      floorPlan: null,
      imageTransform: { x: 0, y: 0, scale: 1, rotation: 0 },
      imageError: '无法读取这张图片，请重新选择'
    });
  }, { once: true });
  image.src = state.floorPlan.objectUrl;
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  controlRoot?.addEventListener('click', onControls);
  controlRoot?.addEventListener('change', onControls);
  window.addEventListener('resize', resize);

  input?.addEventListener('change', () => {});

  return {
    destroy() {
      destroyed = true;
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      controlRoot?.removeEventListener('click', onControls);
      controlRoot?.removeEventListener('change', onControls);
      window.removeEventListener('resize', resize);
      image.src = '';
    }
  };
}
