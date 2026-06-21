import { DEFAULT_SLOTS, DAYS_SHORT } from '../data/constants.js';

export const stepTimetable = {
  title: 'Build your timetable',
  sub: 'Tap a slot to assign a lecture. This becomes the fixed part of your week — your study plan fills in the gaps.',

  render(body, state) {
    const slots = (state.slots && state.slots.length) ? state.slots : DEFAULT_SLOTS;
    state.slots = slots;
    if (!state.timetable.lectures) state.timetable.lectures = {};

    const courses = state.courses.filter(c => c.code.trim());
    const courseIds = new Set(courses.map(c => c.id));

    // Prune dangling lecture entries that reference courses removed in step 3
    // (e.g. user went back, deleted a course, and returned here).
    for (const key of Object.keys(state.timetable.lectures)) {
      const entry = state.timetable.lectures[key];
      if (!courseIds.has(entry.courseId)) {
        delete state.timetable.lectures[key];
      }
    }

    if (courses.length === 0) {
      body.innerHTML = `<div class="empty-state"><i class="ti ti-alert-circle" aria-hidden="true"></i>No courses yet — go back and add at least one course first.</div>`;
      return;
    }

    body.innerHTML = `
      <div style="margin-bottom:12px;font-size:12px;color:var(--text2);background:var(--sagelight);border-radius:10px;padding:10px 12px;line-height:1.5;">
        Tap an empty slot below to assign a course. Tap a filled slot to edit or clear it.
      </div>
      <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
        <div id="w-grid" style="display:grid;grid-template-columns:46px repeat(7,minmax(58px,1fr));gap:3px;min-width:480px;"></div>
      </div>
    `;

    const grid = body.querySelector('#w-grid');

    function renderGrid() {
      grid.innerHTML = '';
      // Corner
      grid.appendChild(blankCell());
      DAYS_SHORT.forEach(d => {
        const h = document.createElement('div');
        h.style.cssText = 'text-align:center;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);padding:4px 0;';
        h.textContent = d;
        grid.appendChild(h);
      });

      slots.forEach(slot => {
        const tl = document.createElement('div');
        tl.style.cssText = 'display:flex;align-items:center;justify-content:flex-end;padding-right:4px;font-size:10px;color:var(--text3);font-family:JetBrains Mono,monospace;';
        tl.textContent = slot.lbl;
        grid.appendChild(tl);

        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
          const key = `${dayIdx}|${slot.id}`;
          const entry = state.timetable.lectures[key];
          const cell = document.createElement('div');
          cell.style.cssText = `
            min-height:44px;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;
            font-size:9px;font-weight:700;text-align:center;padding:2px;line-height:1.2;
            border:1.5px dashed var(--cream3);color:var(--text3);transition:all .12s;
          `;
          if (entry) {
            const course = courses.find(c => c.id === entry.courseId);
            if (course) {
              cell.style.border = 'none';
              cell.style.background = course.bg;
              cell.style.color = course.color;
              cell.textContent = course.code;
            }
          } else {
            cell.textContent = '+';
          }
          cell.addEventListener('click', () => openSlotPicker(dayIdx, slot, entry, courses, () => {
            renderGrid();
          }, state));
          grid.appendChild(cell);
        }
      });
    }

    function blankCell() {
      const d = document.createElement('div');
      return d;
    }

    renderGrid();
  },

  validate(state) {
    const hasAny = Object.keys(state.timetable.lectures || {}).length > 0;
    if (!hasAny) return 'Please assign at least one lecture slot — your study plan needs a timetable to build around.';
    return null;
  },
};

function openSlotPicker(dayIdx, slot, existing, courses, onDone, state) {
  // Reuse the shared overlay pattern, but build a lightweight inline picker
  let overlay = document.getElementById('w-slot-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'w-slot-overlay';
    overlay.className = 'overlay';
    document.getElementById('app').appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  }

  function close() {
    overlay.classList.remove('open');
  }

  overlay.innerHTML = `
    <div class="sheet">
      <div class="sheet-drag"></div>
      <div style="padding:16px 18px;">
        <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:2px;">${DAYS_SHORT[dayIdx]} · ${slot.range}</div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:14px;">Choose a course for this slot, or clear it.</div>
        <div id="w-course-options" style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;"></div>
        <div style="display:flex;gap:8px;align-items:center;">
          <input class="text-input" id="w-room" placeholder="Room / location (optional)" value="${escAttr(existing?.room || '')}" style="flex:1;" maxlength="30" />
        </div>
      </div>
      <div style="padding:12px 18px 20px;border-top:1px solid var(--cream2);display:flex;gap:8px;">
        ${existing ? `<button class="btn btn-danger-ghost" id="w-clear-slot">Clear slot</button>` : ''}
        <button class="btn btn-primary" id="w-done-slot" style="flex:1;">Done</button>
      </div>
    </div>
  `;

  let selectedCourseId = existing?.courseId || null;
  const optionsWrap = overlay.querySelector('#w-course-options');
  courses.forEach(c => {
    const opt = document.createElement('button');
    opt.className = 'btn';
    opt.type = 'button';
    opt.style.cssText = `text-align:left;display:flex;align-items:center;gap:10px;background:${c.bg};color:${c.color};font-weight:700;`;
    if (selectedCourseId === c.id) {
      opt.style.outline = `2px solid ${c.color}`;
      opt.style.outlineOffset = '1px';
    }
    opt.innerHTML = `<span style="flex:1;">${escHtml(c.code)}${c.name && c.name !== c.code ? ` — ${escHtml(c.name)}` : ''}</span>`;
    opt.addEventListener('click', () => {
      selectedCourseId = c.id;
      Array.from(optionsWrap.children).forEach(o => { o.style.outline = 'none'; });
      opt.style.outline = `2px solid ${c.color}`;
      opt.style.outlineOffset = '1px';
    });
    optionsWrap.appendChild(opt);
  });

  const roomInput = overlay.querySelector('#w-room');
  const key = `${dayIdx}|${slot.id}`;

  overlay.querySelector('#w-done-slot').addEventListener('click', () => {
    if (selectedCourseId) {
      state.timetable.lectures[key] = { courseId: selectedCourseId, room: roomInput.value.trim(), type: 'lecture' };
    } else {
      delete state.timetable.lectures[key];
    }
    close();
    onDone();
  });

  const clearBtn = overlay.querySelector('#w-clear-slot');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      delete state.timetable.lectures[key];
      close();
      onDone();
    });
  }

  overlay.classList.add('open');
}

function escAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
