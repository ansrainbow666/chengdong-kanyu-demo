import { createProjectState, updateProject } from './lib/project-state.mjs';
import { validateImageFile, replaceObjectUrl } from './lib/image-model.mjs';
import { mountWizard } from './components/wizard-view.mjs';
import { mountImageWorkspace } from './components/image-workspace.mjs';
import { mountCompass } from './components/compass-view.mjs';
import { mountDetailsForm } from './components/details-form.mjs';
import { mountConfirmation } from './components/confirmation-view.mjs';
import { mountReport } from './components/report-view.mjs';

let state = createProjectState();
const status = document.querySelector('#app-status');
const root = document.querySelector('#wizard-root');
let imageWorkspace = null;
let compassView = null;
let currentObjectUrl = '';

function render() {
  imageWorkspace?.destroy();
  compassView?.destroy();
  wizard.render(state);
  const canvas = root.querySelector('#floor-plan-canvas');
  if (canvas) imageWorkspace = mountImageWorkspace({ canvas, state, onChange: applyPatch });
  const compassRoot = root.querySelector('#compass-root');
  if (compassRoot) compassView = mountCompass({ root: compassRoot, state, onChange: applyPatch });
  const detailsRoot = root.querySelector('#details-root');
  if (detailsRoot) mountDetailsForm({ root: detailsRoot, state, onChange: applyPatch });
  const confirmationRoot = root.querySelector('#confirmation-root');
  if (confirmationRoot) mountConfirmation({ root: confirmationRoot, state });
  const reportRoot = root.querySelector('#report-root');
  if (reportRoot) mountReport({ root: reportRoot, state });
}

function applyPatch(patch, options = {}) {
  if (patch.floorPlan === null && currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = '';
  }
  state = updateProject(state, patch);
  if (options.render !== false) render();
  status.textContent = patch.floorPlan?.name ? `已选择 ${patch.floorPlan.name}` : `已进入第 ${state.step} 步`;
}

const wizard = mountWizard({
  root,
  state,
  onChange: applyPatch
});

root.addEventListener('floorplan:selected', event => {
  const file = event.detail;
  const validation = validateImageFile(file);
  if (!validation.ok) return applyPatch({ imageError: validation.message });
  currentObjectUrl = replaceObjectUrl(currentObjectUrl, file);
  applyPatch({
    floorPlan: { name: file.name, type: file.type, size: file.size, objectUrl: currentObjectUrl },
    imageTransform: { x: 0, y: 0, scale: 1, rotation: 0 },
    imageError: ''
  });
});

window.addEventListener('beforeunload', () => {
  imageWorkspace?.destroy();
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
});
