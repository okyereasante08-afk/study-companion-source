import { QUICK_NOTE_PHRASES, DAYS_FULL } from '../data/constants.js';
import { setUserBlock } from '../data/schedule.js';
import { REVIEW_COLOR, REST_COLOR } from '../data/planGenerator.js';
import { showToast } from './toast.js';

let overlayEl = null;
let activeCtx = null;
let selectedCode = null;
let onSavedCallback = null;
let allOptions = [];

function ensureOverlay() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement('div');
  overlayEl.className = 'overlay';
  overlayEl.innerHTML = `
    <div class="sheet">
      <div class="sheet-drag"></div>
      <div style="padding:14px 18px 12px;border-bottom:1px solid var(--cream2);">
        <div class="mono" id="modalCtx" style="font-size:11px;color:var(--text3);letter-spacing:.04em;margin-bottom:6px;"></div>
        <input id="modalTitle" placeholder="Session name…" maxlength="60"
          style="font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:700;color:var(--text);border:none;outline:none;width:100%;background:transparent;" />
      </div>
      <div style="padding:14px 18px 16px;">
        <span class="field-label">Subject</span>
        <div id="catGrid" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;"></div>

        <span class="field-label">Notes</span>
        <textarea id="modalNotes" placeholder="What's the plan?"
          style="width:100%;font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;color:var(--text);line-height:1.5;background:var(--cream2);border:1px solid var(--cream3);border-radius:10px;padding:10px 12px;resize:vertical;min-height:72px;outline:none;"></textarea>
        <div id="quickChips" style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;"></div>
      </div>
      <div style="padding:12px 18px 20px;border-top:1px solid var(--cream2);display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <button id="modalDelete" class="btn btn-danger-ghost">Remove</button>
        <button id="modalSave" class="btn btn-primary">Save block</button>
      </div>
    </div>
  `;
  document.getElementById('app').appendChild(overlayEl);

  overlayEl.addEventListener('click', e => { if (e.target === overlayEl) closeModal(); });
  overlayEl.querySelector('#modalSave').addEventListener('click', saveModal);
  overlayEl.querySelector('#modalDelete').addEventListener('click', deleteModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlayEl.classList.contains('open')) closeModal();
  });
  return overlayEl;
}

function renderCatGrid() {
  const grid = overlayEl.querySelector('#catGrid');
  grid.innerHTML = '';
  allOptions.forEach(opt => {
    const chip = document.createElement('button');
    chip.className = 'btn';
    chip.style.background = opt.bg;
    chip.style.color = opt.color;
    chip.style.fontWeight = '700';
    chip.style.fontSize = '11px';
    chip.style.padding = '5px 12px';
    if (selectedCode === opt.code) {
      chip.style.outline = `2px solid ${opt.color}`;
      chip.style.outlineOffset = '1px';
    }
    chip.textContent = opt.code;
    chip.addEventListener('click', () => { selectedCode = opt.code; renderCatGrid(); });
    grid.appendChild(chip);
  });
}

function renderQuickChips() {
  const wrap = overlayEl.querySelector('#quickChips');
  wrap.innerHTML = '';
  QUICK_NOTE_PHRASES.forEach(txt => {
    const chip = document.createElement('button');
    chip.className = 'btn btn-secondary';
    chip.style.fontSize = '11px';
    chip.style.padding = '4px 10px';
    chip.textContent = txt;
    chip.addEventListener('click', () => {
      const ta = overlayEl.querySelector('#modalNotes');
      const cur = ta.value.trim();
      ta.value = cur ? cur + '\n· ' + txt : '· ' + txt;
    });
    wrap.appendChild(chip);
  });
}

/**
 * @param ctx { weekOff, dayIdx, slotId, range, isEdited }
 * @param existing the current block (or null)
 * @param courses profile.courses array
 * @param onSaved callback after save/delete
 */
export function openEditModal(ctx, existing, courses, onSaved) {
  ensureOverlay();
  activeCtx = ctx;
  onSavedCallback = onSaved;

  allOptions = [
    ...courses.map(c => ({ code: c.code, color: c.color, bg: c.bg })),
    { code: REVIEW_COLOR.code, color: REVIEW_COLOR.color, bg: REVIEW_COLOR.bg },
    { code: 'Project', color: '#3D9E82', bg: '#E1F5EE' },
    { code: REST_COLOR.code, color: REST_COLOR.color, bg: REST_COLOR.bg },
  ];

  selectedCode = existing?.code || allOptions[0]?.code || 'Review';

  const dayName = DAYS_FULL[ctx.dayIdx];
  overlayEl.querySelector('#modalCtx').textContent =
    `${dayName} · ${ctx.range}${existing ? (ctx.isEdited ? ' · EDITED' : ' · SUGGESTED') : ''}`;
  overlayEl.querySelector('#modalTitle').value = existing?.title || '';
  overlayEl.querySelector('#modalNotes').value = existing?.notes || '';

  renderCatGrid();
  renderQuickChips();

  overlayEl.classList.add('open');
  setTimeout(() => overlayEl.querySelector('#modalTitle').focus(), 80);
}

function closeModal() {
  if (!overlayEl) return;
  overlayEl.classList.remove('open');
  activeCtx = null;
}

function saveModal() {
  if (!activeCtx) return;
  const title = overlayEl.querySelector('#modalTitle').value.trim();
  const notes = overlayEl.querySelector('#modalNotes').value.trim();
  const opt = allOptions.find(o => o.code === selectedCode) || allOptions[0];
  const matchedCourse = (activeCtx.courses || []).find(c => c.code === opt.code);

  if (!title && !notes) {
    setUserBlock(activeCtx.weekOff, activeCtx.dayIdx, activeCtx.slotId, null);
    showToast('Block removed');
  } else {
    setUserBlock(activeCtx.weekOff, activeCtx.dayIdx, activeCtx.slotId, {
      title: title || 'Study block',
      courseId: matchedCourse ? matchedCourse.id : null,
      code: opt.code,
      color: opt.color,
      bg: opt.bg,
      notes,
    });
    showToast('Saved');
  }
  closeModal();
  if (onSavedCallback) onSavedCallback();
}

function deleteModal() {
  if (!activeCtx) return;
  setUserBlock(activeCtx.weekOff, activeCtx.dayIdx, activeCtx.slotId, null);
  showToast('Block removed');
  closeModal();
  if (onSavedCallback) onSavedCallback();
}
