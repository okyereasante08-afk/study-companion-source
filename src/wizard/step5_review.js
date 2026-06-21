import { generateStudyPlan } from '../data/planGenerator.js';
import { DAYS_SHORT, fmtShortDate, parseDate } from '../data/constants.js';

export const stepReview = {
  title: "You're all set",
  sub: '',

  render(body, state) {
    const lectureCount = Object.keys(state.timetable.lectures || {}).length;
    const courseCount = state.courses.length;
    const semStart = parseDate(state.semester.startDate);
    const milestones = (state.semester.milestones || []).filter(m => m.label.trim() && m.startDate);

    body.innerHTML = `
      <div style="background:var(--sage3);border-radius:16px;padding:18px 20px;margin-bottom:16px;">
        <div class="serif" style="font-size:18px;color:#fff;margin-bottom:4px;">Hi ${escHtml(state.meta.name)}!</div>
        <div style="font-size:12px;color:rgba(255,255,255,.7);line-height:1.6;">
          ${state.meta.personaName} is ready to help you stay on track${state.meta.university ? ` at ${escHtml(state.meta.university)}` : ''}.
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
        <div class="card" style="padding:12px 14px;display:flex;align-items:center;gap:12px;">
          <div style="width:32px;height:32px;border-radius:8px;background:var(--sagelight);color:var(--sage2);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;"><i class="ti ti-books" aria-hidden="true"></i></div>
          <div><div style="font-size:13px;font-weight:700;color:var(--text);">${courseCount} course${courseCount !== 1 ? 's' : ''}</div><div style="font-size:11px;color:var(--text3);">${state.courses.map(c => c.code).join(', ')}</div></div>
        </div>
        <div class="card" style="padding:12px 14px;display:flex;align-items:center;gap:12px;">
          <div style="width:32px;height:32px;border-radius:8px;background:var(--sagelight);color:var(--sage2);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;"><i class="ti ti-calendar" aria-hidden="true"></i></div>
          <div><div style="font-size:13px;font-weight:700;color:var(--text);">${lectureCount} weekly lecture slot${lectureCount !== 1 ? 's' : ''}</div><div style="font-size:11px;color:var(--text3);">${state.semester.totalWeeks}-week semester, starting ${semStart ? fmtShortDate(semStart) : '—'}</div></div>
        </div>
        ${milestones.length > 0 ? `
        <div class="card" style="padding:12px 14px;display:flex;align-items:center;gap:12px;">
          <div style="width:32px;height:32px;border-radius:8px;background:var(--sagelight);color:var(--sage2);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;"><i class="ti ti-flag" aria-hidden="true"></i></div>
          <div><div style="font-size:13px;font-weight:700;color:var(--text);">${milestones.length} exam period${milestones.length !== 1 ? 's' : ''} tracked</div><div style="font-size:11px;color:var(--text3);">${milestones.map(m => m.label).join(', ')}</div></div>
        </div>` : ''}
      </div>

      <div style="font-size:12px;color:var(--text2);line-height:1.6;background:var(--cream2);border-radius:10px;padding:12px 14px;">
        Your study plan has been generated automatically — pre/post-lecture review for each class, plus practice, review, and mock sessions filling the gaps. You can edit any block any time from the Week view.
      </div>
    `;
  },

  validate() {
    return null;
  },

  /** Called when the user finishes the wizard — finalizes the profile */
  finalize(state) {
    state.studyPlan.phases = generateStudyPlan(state);
    state.meta.setupComplete = true;
    return state;
  },
};

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
