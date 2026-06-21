import { fmtDateInput, parseDate } from '../data/constants.js';

export const stepSemesterDates = {
  title: 'Your semester',
  sub: "When does it start, and how many weeks total? You can also add key exam periods — these shape your study plan's phases.",

  render(body, state) {
    if (!state.semester.startDate) {
      // Default to "this Monday" if empty
      const d = new Date();
      const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
      d.setDate(d.getDate() - dow);
      state.semester.startDate = fmtDateInput(d);
    }
    if (!state.semester.milestones || state.semester.milestones.length === 0) {
      state.semester.milestones = [
        { id: 'm1', label: 'Midterm Exams', startDate: '', endDate: '' },
        { id: 'm2', label: 'Final Exams', startDate: '', endDate: '' },
      ];
    }

    body.innerHTML = `
      <div style="display:flex;gap:10px;margin-bottom:16px;">
        <div style="flex:1;">
          <label class="field-label">Semester start (Monday)</label>
          <input class="text-input" type="date" id="w-start" value="${state.semester.startDate}" />
        </div>
        <div style="width:110px;">
          <label class="field-label">Total weeks</label>
          <input class="text-input" type="number" id="w-weeks" min="4" max="40" value="${state.semester.totalWeeks}" />
        </div>
      </div>

      <div style="margin-bottom:10px;">
        <span class="field-label" style="margin-bottom:4px;display:block;">Key exam periods</span>
        <div style="font-size:12px;color:var(--text3);margin-bottom:10px;line-height:1.5;">Add midterms / finals so your study plan can ramp up beforehand. Leave dates blank to skip.</div>
      </div>
      <div id="w-milestones"></div>
      <button class="btn btn-secondary" id="w-add-milestone" type="button" style="margin-top:4px;">+ Add another period</button>
    `;

    const startInput = body.querySelector('#w-start');
    const weeksInput = body.querySelector('#w-weeks');
    startInput.addEventListener('change', () => { state.semester.startDate = startInput.value; });
    weeksInput.addEventListener('input', () => {
      const v = parseInt(weeksInput.value, 10);
      state.semester.totalWeeks = isNaN(v) ? 16 : Math.max(4, Math.min(40, v));
    });

    const mWrap = body.querySelector('#w-milestones');

    function renderMilestones() {
      mWrap.innerHTML = '';
      state.semester.milestones.forEach((m, i) => {
        const row = document.createElement('div');
        row.style.cssText = 'background:var(--cream2);border-radius:12px;padding:12px;margin-bottom:8px;';
        row.innerHTML = `
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
            <input class="text-input" placeholder="e.g. Midterm Exams" value="${escAttr(m.label)}" style="flex:1;" data-field="label" />
            ${state.semester.milestones.length > 1 ? `<button class="btn btn-danger-ghost" type="button" data-action="remove" style="flex-shrink:0;padding:9px 12px;">✕</button>` : ''}
          </div>
          <div style="display:flex;gap:8px;">
            <div style="flex:1;">
              <label style="font-size:10px;color:var(--text3);display:block;margin-bottom:4px;">Starts</label>
              <input class="text-input" type="date" value="${m.startDate}" data-field="startDate" />
            </div>
            <div style="flex:1;">
              <label style="font-size:10px;color:var(--text3);display:block;margin-bottom:4px;">Ends</label>
              <input class="text-input" type="date" value="${m.endDate}" data-field="endDate" />
            </div>
          </div>
        `;
        row.querySelector('[data-field="label"]').addEventListener('input', e => { m.label = e.target.value; });
        row.querySelector('[data-field="startDate"]').addEventListener('change', e => { m.startDate = e.target.value; if (!m.endDate) m.endDate = e.target.value; });
        row.querySelector('[data-field="endDate"]').addEventListener('change', e => { m.endDate = e.target.value; });
        const removeBtn = row.querySelector('[data-action="remove"]');
        if (removeBtn) {
          removeBtn.addEventListener('click', () => {
            state.semester.milestones = state.semester.milestones.filter(x => x.id !== m.id);
            renderMilestones();
          });
        }
        mWrap.appendChild(row);
      });
    }
    renderMilestones();

    body.querySelector('#w-add-milestone').addEventListener('click', () => {
      state.semester.milestones.push({ id: 'm' + Date.now(), label: '', startDate: '', endDate: '' });
      renderMilestones();
    });
  },

  validate(state) {
    if (!state.semester.startDate) return 'Please set a semester start date.';
    if (!state.semester.totalWeeks || state.semester.totalWeeks < 4) return 'Please enter a valid number of weeks (4 or more).';
    // Milestones are optional, but if a label is set without a date (or vice versa), gently flag
    for (const m of state.semester.milestones) {
      if (m.label.trim() && !m.startDate) return `Please set a start date for "${m.label}", or clear its label to skip it.`;
    }
    return null;
  },
};

function escAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
