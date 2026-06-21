// Generic constants — no hardcoded university/program data here.

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
export const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Default time slots — a realistic daily structure with built-in breaks for
// meals/rest. ~6-7 usable blocks per day, not back-to-back all day.
// Users can edit these during setup if they want more/fewer.
export const DEFAULT_SLOTS = [
  { id: 'a', lbl: '6:00',  start: 6 * 60,       range: '6:00–7:30' },
  { id: 'b', lbl: '8:00',  start: 8 * 60,       range: '8:00–9:30' },
  { id: 'c', lbl: '10:00', start: 10 * 60,      range: '10:00–11:30' },
  { id: 'd', lbl: '12:00', start: 12 * 60,      range: '12:00–1:30' },
  { id: 'e', lbl: '2:00',  start: 14 * 60,      range: '2:00–3:30' },
  { id: 'f', lbl: '4:00',  start: 16 * 60,      range: '4:00–5:30' },
  { id: 'g', lbl: '7:00pm',start: 19 * 60,      range: '7:00–8:30' },
  { id: 'h', lbl: '8:30pm',start: 20 * 60 + 30, range: '8:30–9:30' },
];

// Generic phase template — applies to any semester regardless of subject.
// "weeksFromStart" / "weeksFromEnd" let us position phases relative to a
// semester of any length, anchored on the user's milestones.
export const PHASE_TEMPLATE = [
  { key: 'foundation',      label: 'Foundation',      color: '#5B7B7A', bg: '#EBF2F1',
    blurb: 'Build the base. Stay on top of lectures, review same-day.' },
  { key: 'intensification', label: 'Intensification', color: '#C49B3C', bg: '#FAEEDA',
    blurb: 'Step it up. More practice problems, start past papers.' },
  { key: 'midterm',         label: 'Midterm Prep',    color: '#C45252', bg: '#FCEBEB',
    blurb: 'Final push before midterms. Mocks and error review.' },
  { key: 'postmid',         label: 'Post-Midterm',    color: '#4A8CC4', bg: '#E6F1FB',
    blurb: 'Re-establish rhythm. New material, keep reviewing.' },
  { key: 'finals',          label: 'Finals Prep',     color: '#C45288', bg: '#FBEAF0',
    blurb: 'Full exam mode. Mocks, flashcards, protected rest.' },
];

// Generic study-block templates by activity type. The setup wizard/PA
// generator picks from these to build a study plan for ANY course, since
// the underlying study activities (review slides, practice problems, past
// papers, flashcards) are universal across subjects.
export const STUDY_ACTIVITY_TEMPLATES = {
  preLecture:  ['Skim slides/notes ahead of class', 'Review last session\'s flashcards', 'Read the relevant textbook section'],
  postLecture: ['Rewrite key points in your own words', 'Make flashcards from today\'s lecture', 'Solve 3-5 practice problems on today\'s topic'],
  practice:    ['Solve practice problems', 'Work through past paper questions', 'Apply concepts to a worked example'],
  review:      ['Review flashcards', 'Re-read weak areas from your error log', 'Listen to a recap / audio summary'],
  mock:        ['Full timed mock paper', 'Past paper under exam conditions', 'Mark and log every mistake'],
  project:     ['Work on personal/coursework project', 'Push progress to GitHub / save work'],
  planning:    ['Plan the week ahead', 'Review error log across all subjects', 'Set 2-3 goals for next week'],
  rest:        ['Protected rest — no new material', 'Light flashcard review only, if anything'],
};

export const QUICK_NOTE_PHRASES = [
  'Review slides', 'Practice problems', 'Past papers', 'Flashcard review',
  'Read textbook chapter', 'Rewrite notes', 'Watch a tutorial video',
  'Work on assignment', 'Make new flashcards', 'Full mock paper',
  'Error log review', 'Group study session', 'Project work',
];

// ---- Date helpers ----

export function parseDate(str) {
  // 'YYYY-MM-DD' -> Date at local midnight
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function fmtShortDate(d) {
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function fmtDateInput(d) {
  // Date -> 'YYYY-MM-DD' for <input type="date">
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayDayIndex(today = new Date()) {
  return today.getDay() === 0 ? 6 : today.getDay() - 1;
}

export function getStartMonday(semesterStart) {
  const d = new Date(semesterStart);
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - dow);
  return d;
}

export function getWeekMonday(semesterStart, weekOff) {
  const base = getStartMonday(semesterStart);
  const d = new Date(base);
  d.setDate(d.getDate() + weekOff * 7);
  return d;
}

export function getCurrentWeekOff(semesterStart, totalWeeks, today = new Date()) {
  const base = getStartMonday(semesterStart);
  const diff = Math.floor((today - base) / (7 * 86400000));
  return Math.max(0, Math.min(Math.max(0, totalWeeks - 1), diff));
}

export function daysUntil(date, today = new Date()) {
  if (!date) return null;
  return Math.max(0, Math.ceil((date - today) / 86400000));
}

export function pctBetween(start, end, now = new Date()) {
  if (!start || !end) return 0;
  return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
}

/**
 * Determine which phase a given week falls into, based on user milestones.
 * milestones: array of { id, label, startDate: Date, endDate: Date }
 * Heuristic:
 *  - If the week overlaps a milestone whose label suggests "final" -> finals phase
 *  - If the week overlaps the FIRST non-final milestone -> midterm phase
 *  - Weeks before that milestone, split foundation/intensification at the halfway point
 *  - Weeks after midterm milestone, before finals milestone -> postmid
 *  - After finals milestone starts -> finals
 * This is intentionally a simple, predictable heuristic — not magic.
 */
export function getPhaseForWeek(weekOff, semesterStart, totalWeeks, milestones) {
  const mon = getWeekMonday(semesterStart, weekOff);
  const fri = new Date(mon);
  fri.setDate(fri.getDate() + 4);

  const sorted = [...(milestones || [])]
    .filter(m => m.startDate)
    .sort((a, b) => a.startDate - b.startDate);

  const finalsM = sorted.find(m => /final/i.test(m.label));
  const midM = sorted.find(m => m !== finalsM);

  if (finalsM && fri >= finalsM.startDate && mon <= (finalsM.endDate || finalsM.startDate)) {
    return 4; // finals
  }
  if (midM && fri >= midM.startDate && mon <= (midM.endDate || midM.startDate)) {
    return 2; // midterm
  }
  if (midM && mon > (midM.endDate || midM.startDate) && (!finalsM || mon < finalsM.startDate)) {
    return 3; // postmid
  }
  if (midM && mon < midM.startDate) {
    const weeksUntilMid = Math.max(1, Math.ceil((midM.startDate - getStartMonday(semesterStart)) / (7 * 86400000)));
    const halfway = Math.floor(weeksUntilMid / 2);
    return weekOff < halfway ? 0 : 1; // foundation : intensification
  }
  if (!midM && !finalsM) {
    // No milestones set — fall back to position within total weeks
    const half = Math.floor(totalWeeks / 2);
    return weekOff < half ? 0 : 1;
  }
  return 0;
}
