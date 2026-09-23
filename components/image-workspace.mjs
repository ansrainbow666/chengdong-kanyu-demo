import { clampTransform } from '../lib/image-model.mjs';
import { createOverlayRenderModel, drawProfessionalOverlay } from './overlay-workspace.mjs';
import { createOverlayState, flipNorthSouth, toggleOverlayLayer, updateDynamicPalace } from '../lib/overlay-model.mjs';
import { addAnnotation, moveAnnotation, removeAnnotation, planToScreenPoint, screenToPlanPoint } from '../lib/annotation-model.mjs';
import { annotationDetails, drawAnnotations, hitTestAnnotation } from './annotation-workspace.mjs';

export function mountImageWorkspace({ canvas, input, state, onChange }) {
  if (!canvas || !state.floorPlan?.objectUrl) return { destroy() {} };
  const context = canvas.getContext('2d');
  const image = new Image();
  const controlRoot = canvas.closest('.image-card') || canvas.parentElement;
  const pointers = new Map();
  let transform = clampTransform(state.imageTransform);
  let overlay = createOverlayState(state.overlay);
  let dragging = null;
  let pinch = null;
  let tapCandidate = null;
  let annotations = state.annotations || [];
  let annotationTool = { ...state.annotationTool };
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
    const annotationModel = { canvasWidth: rect.width, canvasHeight: rect.height, imageWidth: image.naturalWidth, imageHeight: image.naturalHeight, baseScale: base, transform };
    if (overlay.layers.annotations) drawAnnotations(context, { annotations, model: annotationModel });
    if (state.houseBearing != null) {
      drawProfessionalOverlay(context, createOverlayRenderModel({ houseBearing: state.houseBearing, buildYear: state.buildYear, overlay, flyingStarInput: state.flyingStarInput }));
    }
  }

  function commit(patch) {
    transform = clampTransform({ ...transform, ...patch });
    onChange({ imageTransform: transform }, { render: false });
    draw();
  }

  function updateOverlay(nextOverlay) {
    overlay = createOverlayState(nextOverlay);
    onChange({ overlay }, { render: false });
    const scaleValue = controlRoot?.querySelector('[data-overlay-scale-value]');
    const opacityValue = controlRoot?.querySelector('[data-overlay-opacity-value]');
    const scaleInput = controlRoot?.querySelector('[data-overlay-scale]');
    const opacityInput = controlRoot?.querySelector('[data-overlay-opacity]');
    if (scaleValue) scaleValue.textContent = `${Math.round(overlay.analysis.scale * 100)}%`;
    if (opacityValue) opacityValue.textContent = `${Math.round(overlay.analysis.opacity * 100)}%`;
    if (scaleInput) scaleInput.value = String(overlay.analysis.scale);
    if (opacityInput) opacityInput.value = String(overlay.analysis.opacity);
    draw();
  }

  function distance() {
    const [a, b] = [...pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }

  function onPointerDown(event) {
    canvas.setPointerCapture?.(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) {
      dragging = { x: event.clientX, y: event.clientY, originX: transform.x, originY: transform.y };
      tapCandidate = { x: event.clientX, y: event.clientY, started: performance.now(), pointerId: event.pointerId };
    }
    if (pointers.size === 2) { pinch = { distance: distance(), scale: transform.scale }; tapCandidate = null; }
  }

  function onPointerMove(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (tapCandidate && Math.hypot(event.clientX - tapCandidate.x, event.clientY - tapCandidate.y) > 10) tapCandidate = null;
    if (pointers.size === 2 && pinch) {
      const nextDistance = distance();
      if (pinch.distance) commit({ scale: pinch.scale * nextDistance / pinch.distance });
      return;
    }
    if (dragging) commit({ x: dragging.originX + event.clientX - dragging.x, y: dragging.originY + event.clientY - dragging.y });
  }

  function onPointerUp(event) {
    const validTap = tapCandidate && tapCandidate.pointerId === event.pointerId && performance.now() - tapCandidate.started <= 400;
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!pointers.size) dragging = null;
    if (validTap) placeAnnotation(event);
    tapCandidate = null;
  }

  function annotationGeometry() {
    const rect = canvas.getBoundingClientRect();
    const baseScale = Math.min((rect.width - 24) / image.naturalWidth, (rect.height - 24) / image.naturalHeight);
    return { canvasWidth: rect.width, canvasHeight: rect.height, imageWidth: image.naturalWidth, imageHeight: image.naturalHeight, baseScale, transform };
  }

  function paintAnnotationDetails(selected) {
    const node = controlRoot?.querySelector('[data-annotation-details]');
    if (node) node.innerHTML = annotationDetails(selected, { imageWidth: image.naturalWidth, imageHeight: image.naturalHeight, analysisRotation: overlay.analysis.rotation, layers: overlay.layers });
  }

  function placeAnnotation(event) {
    const rect = canvas.getBoundingClientRect();
    const screenPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const model = annotationGeometry();
    const planPoint = screenToPlanPoint(screenPoint, model);
    if (annotationTool.mode === 'placing' && annotationTool.type) {
      const label = annotationTool.type === 'custom' ? String(annotationTool.customLabel || '').trim() : '';
      if (annotationTool.type === 'custom' && !label) return;
      annotations = addAnnotation(annotations, { id: `a${Date.now()}${annotations.length}`, type: annotationTool.type, ...planPoint, label });
      annotationTool = { ...annotationTool, mode: 'idle', movingId: null };
      onChange({ annotations, annotationTool }, { render: false }); draw(); return;
    }
    if (annotationTool.mode === 'moving' && annotationTool.movingId) {
      annotations = moveAnnotation(annotations, annotationTool.movingId, planPoint);
      annotationTool = { ...annotationTool, mode: 'idle', movingId: null };
      onChange({ annotations, annotationTool }, { render: false }); draw(); return;
    }
    const screenAnnotations = annotations.map(item => ({ ...item, ...planToScreenPoint(item, model) }));
    const hit = hitTestAnnotation(screenPoint, screenAnnotations, 24);
    paintAnnotationDetails(hit ? annotations.find(item => item.id === hit.id) : null);
  }

  function onWheel(event) {
    event.preventDefault();
    commit({ scale: transform.scale * (event.deltaY > 0 ? 0.9 : 1.1) });
  }

  function onControls(event) {
    const action = event.target.closest('[data-image-action]')?.dataset.imageAction;
    if (event.type === 'click' && action === 'rotate') commit({ rotation: transform.rotation + 15 });
    if (event.type === 'click' && action === 'reset') fitTransform();
    if (event.type === 'click' && action === 'remove') onChange({ floorPlan: null, imageTransform: { x: 0, y: 0, scale: 1, rotation: 0 }, annotations: [], annotationTool: { mode: 'idle', type: null, movingId: null }, imageError: '' });
    const overlayAction = event.target.closest('[data-overlay-action]')?.dataset.overlayAction;
    if (event.type === 'click' && overlayAction === 'flip') updateOverlay(flipNorthSouth(overlay));
    if (event.type === 'click' && overlayAction === 'reset') updateOverlay(createOverlayState());
    const overlayLayer = event.target.closest('[data-overlay-layer]')?.dataset.overlayLayer;
    if (event.type === 'change' && overlayLayer) updateOverlay(toggleOverlayLayer(overlay, overlayLayer));
    const palaceMode = event.target.closest('[data-dynamic-palace-mode]')?.dataset.dynamicPalaceMode;
    if (event.type === 'click' && palaceMode) updateOverlay(updateDynamicPalace(overlay, { mode: palaceMode }));
    if (event.type === 'input' && event.target.matches('[data-dynamic-palace-rotation]')) updateOverlay(updateDynamicPalace(overlay, { rotation: Number(event.target.value) }));
    if (event.type === 'input' && event.target.matches('[data-overlay-scale]')) updateOverlay({ ...overlay, analysis: { ...overlay.analysis, scale: Number(event.target.value) } });
    if (event.type === 'input' && event.target.matches('[data-overlay-opacity]')) updateOverlay({ ...overlay, analysis: { ...overlay.analysis, opacity: Number(event.target.value) } });
    const annotationType = event.target.closest('[data-annotation-type]')?.dataset.annotationType;
    if (event.type === 'click' && annotationType) {
      annotationTool = { ...annotationTool, mode: 'placing', type: annotationType, movingId: null };
      onChange({ annotationTool }, { render: false });
      controlRoot.querySelectorAll('[data-annotation-type]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.annotationType === annotationType)));
    }
    if (event.type === 'input' && event.target.matches('[data-annotation-custom-label]')) {
      annotationTool = { ...annotationTool, customLabel: event.target.value };
      onChange({ annotationTool }, { render: false });
    }
    const annotationAction = event.target.closest('[data-annotation-action]')?.dataset.annotationAction;
    const annotationId = event.target.closest('[data-annotation-action]')?.dataset.annotationId;
    if (event.type === 'click' && annotationAction === 'move') {
      annotationTool = { ...annotationTool, mode: 'moving', movingId: annotationId };
      onChange({ annotationTool }, { render: false });
    }
    if (event.type === 'click' && annotationAction === 'delete') {
      annotations = removeAnnotation(annotations, annotationId); annotationTool = { ...annotationTool, mode: 'idle', movingId: null };
      onChange({ annotations, annotationTool }, { render: false }); paintAnnotationDetails(null); draw();
    }
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
  controlRoot?.addEventListener('input', onControls);
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
      controlRoot?.removeEventListener('input', onControls);
      window.removeEventListener('resize', resize);
      image.src = '';
    }
  };
}
