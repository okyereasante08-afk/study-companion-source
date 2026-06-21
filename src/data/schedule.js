import { DEFAULT_SLOTS, getPhaseForWeek, parseDate } from './constants.js';
import { loadProfile, updateProfile } from './profile.js';

/**
 * Returns the active time slots for this profile.
 */
export function getSlots(profile) {
  return (profile.slots && profile.slots.length) ? profile.slots : DEFAULT_SLOTS;
}

/**
 * Returns the lecture/lab entry for a given day/slot, enriched with course info.
 */
export function getLecture(profile, dayIdx, slotId) {
  const entry = profile.timetable.lectures[`${dayIdx}|${slotId}`];
  if (!entry) return null;
  const course = profile.courses.find(c => c.id === entry.courseId);
  if (!course) return null;
  return {
    code: course.code,
    title: course.name,
    meta: course.lecturer || '',
    room: entry.room || '',
    color: course.color,
    bg: course.bg,
    sessionType: entry.type || 'lecture',
  };
}

/**
 * Returns the study block (generated or user-edited) for week/day/slot.
 */
export function getStudyBlock(profile, weekOff, dayIdx, slotId) {
  const userKey = `${weekOff}|${dayIdx}|${slotId}`;
  const userEdits = profile.studyPlan.userEdits || {};
  if (userKey in userEdits) {
    return userEdits[userKey]; // may be null (explicitly cleared) or an object
  }
  const semStart = parseDate(profile.semester.startDate);
  if (!semStart) return null;

  const milestones = (profile.semester.milestones || []).map(m => ({
    ...m,
    startDate: parseDate(m.startDate),
    endDate: m.endDate ? parseDate(m.endDate) : parseDate(m.startDate),
  }));

  const phaseIdx = getPhaseForWeek(weekOff, semStart, profile.semester.totalWeeks, milestones);
  const phase = profile.studyPlan.phases[phaseIdx] || {};
  return phase[`${dayIdx}|${slotId}`] || null;
}

export function isUserEdited(profile, weekOff, dayIdx, slotId) {
  return `${weekOff}|${dayIdx}|${slotId}` in (profile.studyPlan.userEdits || {});
}

export function setUserBlock(weekOff, dayIdx, slotId, block) {
  updateProfile(profile => {
    const next = { ...profile };
    next.studyPlan = { ...next.studyPlan, userEdits: { ...next.studyPlan.userEdits } };
    next.studyPlan.userEdits[`${weekOff}|${dayIdx}|${slotId}`] = block;
    return next;
  });
}

/**
 * Returns the full ordered list of events for a given week/day.
 * [{ ...slot, ...content, type: 'lecture' | 'study' }]
 */
export function getDaySchedule(profile, weekOff, dayIdx) {
  const slots = getSlots(profile);
  const events = [];
  for (const slot of slots) {
    const lecture = getLecture(profile, dayIdx, slot.id);
    if (lecture) {
      events.push({ ...slot, ...lecture, type: 'lecture' });
      continue;
    }
    const study = getStudyBlock(profile, weekOff, dayIdx, slot.id);
    if (study) {
      events.push({ ...slot, ...study, type: 'study' });
    }
  }
  return events;
}

/**
 * Finds the next upcoming event today, based on current time.
 */
export function getNextEvent(profile, weekOff, now = new Date()) {
  const dayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const events = getDaySchedule(profile, weekOff, dayIdx);
  for (const ev of events) {
    if (ev.start > nowMins - 30) return ev;
  }
  return null;
}

export function countWeekSessions(profile, weekOff) {
  let n = 0;
  for (let d = 0; d < 7; d++) n += getDaySchedule(profile, weekOff, d).length;
  return n;
}
