import { colorForIndex } from '../data/planGenerator.js';

export const stepCourses = {
  title: 'Your courses',
  sub: 'List the courses you\'re taking this semester. You\'ll assign lecture times next.',

  render(body, state) {
    if (!state.courses || state.courses.length === 0) {
      state.courses = [
        { id: 'c' + Date.now(), code: '', name: '', lecturer: '', status: 'Core', ...colorForIndex(0) },
      ];
    }

    body.innerHTML = `<div id="w-courses"></div><button class="btn btn-secondary" id="w-add-course" type="button" style="margin-top:4px;">+ Add another course</button>`;
    const wrap = body.querySelector('#w-courses');

    function renderCourses() {
      wrap.innerHTML = '';
      state.courses.forEach((c, i) => {
        const row = document.createElement('div');
        row.style.cssText = 'background:var(--cream2);border-radius:12px;padding:12px;margin-bottom:8px;';
        row.innerHTML = `
          <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:8px;">
            <div style="width:32px;height:32px;border-radius:8px;flex-shrink:0;margin-top:2px;background:${c.bg};border:2px solid ${c.color};"></div>
            <div style="flex:1;display:flex;gap:8px;">
              <input class="text-input" placeholder="Code (e.g. MATH 152)" value="${escAttr(c.code)}" data-field="code" style="flex:1;" maxlength="16" />
              <select class="select-input" data-field="status" style="width:108px;flex-shrink:0;">
                ${['Core', 'GES', 'Elective', 'Major', 'Other'].map(s => `<option value="${s}" ${c.status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
            ${state.courses.length > 1 ? `<button class="btn btn-danger-ghost" type="button" data-action="remove" style="flex-shrink:0;padding:9px 12px;">✕</button>` : ''}
          </div>
          <input class="text-input" placeholder="Full name (e.g. Calculus with Analysis)" value="${escAttr(c.name)}" data-field="name" style="margin-bottom:8px;" maxlength="80" />
          <input class="text-input" placeholder="Lecturer (optional)" value="${escAttr(c.lecturer)}" data-field="lecturer" maxlength="50" />
        `;

        row.querySelector('[data-field="code"]').addEventListener('input', e => { c.code = e.target.value; });
        row.querySelector('[data-field="name"]').addEventListener('input', e => { c.name = e.target.value; });
        row.querySelector('[data-field="lecturer"]').addEventListener('input', e => { c.lecturer = e.target.value; });
        row.querySelector('[data-field="status"]').addEventListener('change', e => { c.status = e.target.value; });

        const removeBtn = row.querySelector('[data-action="remove"]');
        if (removeBtn) {
          removeBtn.addEventListener('click', () => {
            state.courses = state.courses.filter(x => x.id !== c.id);
            renderCourses();
          });
        }
        wrap.appendChild(row);
      });
    }
    renderCourses();

    body.querySelector('#w-add-course').addEventListener('click', () => {
      const idx = state.courses.length;
      state.courses.push({ id: 'c' + Date.now(), code: '', name: '', lecturer: '', status: 'Core', ...colorForIndex(idx) });
      renderCourses();
    });
  },

  validate(state) {
    const valid = state.courses.filter(c => c.code.trim() || c.name.trim());
    if (valid.length === 0) return 'Please add at least one course.';
    for (const c of state.courses) {
      const hasAny = c.code.trim() || c.name.trim();
      if (hasAny && !c.code.trim()) return 'Each course needs at least a short code (e.g. "MATH 152").';
    }
    // Drop fully-empty rows before moving on
    state.courses = state.courses.filter(c => c.code.trim() || c.name.trim());
    // Fill missing names with code as fallback
    state.courses.forEach(c => { if (!c.name.trim()) c.name = c.code; });
    return null;
  },
};

function escAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
