import { DEFAULT_SLOTS, STUDY_ACTIVITY_TEMPLATES, PHASE_TEMPLATE } from './constants.js';

// Color palette cycled through for auto-assigning course colors during setup
export const COLOR_PALETTE = [
  { color: '#7C6FCD', bg: '#EEEDFE' },
  { color: '#3D9E82', bg: '#E1F5EE' },
  { color: '#6B72CC', bg: '#EEEDFE' },
  { color: '#4A8CC4', bg: '#E6F1FB' },
  { color: '#3AB8B6', bg: '#E1F5EE' },
  { color: '#C49B3C', bg: '#FAEEDA' },
  { color: '#C45252', bg: '#FCEBEB' },
  { color: '#C45288', bg: '#FBEAF0' },
  { color: '#C47A3C', bg: '#FFF1E6' },
  { color: '#5B7B7A', bg: '#EBF2F1' },
];

export function colorForIndex(i) {
  return COLOR_PALETTE[i % COLOR_PALETTE.length];
}

export const REVIEW_COLOR = { code: 'Review', color: '#C49B3C', bg: '#FAEEDA' };
export const REST_COLOR = { code: 'Rest', color: '#A09D96', bg: '#F0EDE6' };

/**
 * Builds a 5-phase study plan for a profile's courses + timetable.
 *
 * Strategy (kept deliberately simple and explainable, not "AI magic"):
 * - For each lecture slot, place a "post-lecture" study block in the next
 *   free slot on the same day if one exists (immediate reinforcement).
 * - For each lecture slot, place a "pre-lecture" block in the prior free
 *   slot on the same day, IF that slot isn't already used.
 * - Remaining free slots get rotated through: practice / review / project
 *   depending on the phase.
 * - One evening slot per week (last slot, Sunday) is reserved for "planning".
 * - In finals/midterm phases, free slots bias toward mocks + review;
 *   in foundation, they bias toward pre/post-lecture reinforcement.
 * - One slot per week is marked "rest" in finals phase.
 *
 * Returns: phases[5][ "dayIdx|slotId" ] = { title, courseId|null, code, color, bg, notes }
 */
export function generateStudyPlan(profile) {
  const slots = profile.slots && profile.slots.length ? profile.slots : DEFAULT_SLOTS;
  const slotIndexById = {};
  slots.forEach((s, i) => { slotIndexById[s.id] = i; });

  const lectures = profile.timetable.lectures || {};
  const courses = profile.courses || [];
  const courseById = {};
  courses.forEach(c => { courseById[c.id] = c; });

  // Build a per-day map of occupied slot indices (by lecture)
  const dayLectureSlots = Array.from({ length: 7 }, () => new Set());
  for (const key of Object.keys(lectures)) {
    const [dayIdx, slotId] = key.split('|');
    const idx = slotIndexById[slotId];
    if (idx !== undefined) dayLectureSlots[Number(dayIdx)].add(idx);
  }

  const phases = PHASE_TEMPLATE.map(() => ({}));

  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const occupied = dayLectureSlots[dayIdx];

    // For each lecture, try to claim adjacent free slots for pre/post review
    for (const key of Object.keys(lectures)) {
      const [lDay, lSlotId] = key.split('|');
      if (Number(lDay) !== dayIdx) continue;
      const lecture = lectures[key];
      const course = courseById[lecture.courseId];
      if (!course) continue;

      const lIdx = slotIndexById[lSlotId];
      if (lIdx === undefined) continue;

      const prevSlot = slots[lIdx - 1];
      const nextSlot = slots[lIdx + 1];

      // Post-lecture (immediate reinforcement) — highest priority claim
      if (nextSlot && !occupied.has(lIdx + 1)) {
        occupied.add(lIdx + 1);
        for (let p = 0; p < phases.length; p++) {
          phases[p][`${dayIdx}|${nextSlot.id}`] = buildBlock(course, 'postLecture', p);
        }
      }
      // Pre-lecture (prep) — only if slot still free
      if (prevSlot && !occupied.has(lIdx - 1)) {
        occupied.add(lIdx - 1);
        for (let p = 0; p < phases.length; p++) {
          phases[p][`${dayIdx}|${prevSlot.id}`] = buildBlock(course, 'preLecture', p);
        }
      }
    }

    // Remaining free slots: don't fill everything — cap study blocks per
    // day so students retain real free time. Lecture-adjacent slots (just
    // claimed above as pre/post-lecture) always count toward the cap.
    const MAX_STUDY_BLOCKS_PER_DAY = 4;
    const prePostCount = slots.filter(s => {
      const key = `${dayIdx}|${s.id}`;
      return key in phases[0] && !lectures[key];
    }).length;

    const freeSlots = slots
      .map((s, i) => ({ slot: s, idx: i }))
      .filter(({ idx, slot }) => !occupied.has(idx) && !(`${dayIdx}|${slot.id}` in phases[0]));

    const remainingBudget = Math.max(0, MAX_STUDY_BLOCKS_PER_DAY - prePostCount);
    const slotsToFill = freeSlots.slice(0, remainingBudget);

    slotsToFill.forEach(({ slot, idx }, fi) => {
      // Last study slot of Sunday reserved for planning
      if (dayIdx === 6 && fi === slotsToFill.length - 1 && courses.length > 0) {
        for (let p = 0; p < phases.length; p++) {
          phases[p][`${dayIdx}|${slot.id}`] = buildPlanningBlock(p);
        }
        return;
      }

      if (courses.length === 0) return;

      // Pick a course to focus this slot on, rotating by (day, slot index)
      const course = courses[(dayIdx * 3 + fi) % courses.length];

      for (let p = 0; p < phases.length; p++) {
        phases[p][`${dayIdx}|${slot.id}`] = buildFreeBlock(course, p, dayIdx, fi, slotsToFill.length);
      }
    });
  }

  return phases;
}

function pick(arr, seed) {
  return arr[seed % arr.length];
}

function buildBlock(course, kind, phaseIdx) {
  const titles = {
    preLecture: 'Pre-Lecture Prep',
    postLecture: 'Post-Lecture Review',
  };
  const notesPool = STUDY_ACTIVITY_TEMPLATES[kind];
  // Vary notes slightly by phase so it doesn't feel static
  const notes = phaseIdx >= 2
    ? `${pick(notesPool, phaseIdx)} · ${pick(STUDY_ACTIVITY_TEMPLATES.practice, phaseIdx + 1)}`
    : pick(notesPool, phaseIdx);

  return {
    title: `${course.code} — ${titles[kind]}`,
    courseId: course.id,
    code: course.code,
    color: course.color,
    bg: course.bg,
    notes,
  };
}

function buildFreeBlock(course, phaseIdx, dayIdx, fi, totalFree) {
  // Phase-dependent activity bias
  let kind;
  if (phaseIdx === 4) {
    // Finals: mostly mocks/review, with one rest slot per week (Saturday last free slot)
    if (dayIdx === 5 && fi === totalFree - 1) {
      return {
        title: 'Rest — Protected',
        courseId: null,
        ...REST_COLOR,
        notes: pick(STUDY_ACTIVITY_TEMPLATES.rest, 0),
      };
    }
    kind = (fi % 2 === 0) ? 'mock' : 'review';
  } else if (phaseIdx === 2) {
    // Midterm prep: mocks + practice
    kind = (fi % 2 === 0) ? 'mock' : 'practice';
  } else if (phaseIdx === 1) {
    // Intensification: practice + review
    kind = (fi % 2 === 0) ? 'practice' : 'review';
  } else if (phaseIdx === 3) {
    // Post-mid: rebuild — practice + project
    kind = (fi % 3 === 0) ? 'project' : 'practice';
  } else {
    // Foundation: review + light practice
    kind = (fi % 2 === 0) ? 'review' : 'practice';
  }

  const kindLabels = {
    practice: 'Practice Session',
    review: 'Review Session',
    mock: 'Mock Paper',
    project: 'Project Work',
  };

  if (kind === 'project') {
    return {
      title: 'Project / Personal Work',
      courseId: null,
      code: 'Project',
      color: '#3D9E82',
      bg: '#E1F5EE',
      notes: pick(STUDY_ACTIVITY_TEMPLATES.project, fi),
    };
  }

  if (kind === 'review' && (dayIdx + fi) % 3 === 0) {
    // Occasionally make review cross-subject rather than single-course
    return {
      title: 'Cross-Subject Review',
      courseId: null,
      ...REVIEW_COLOR,
      notes: pick(STUDY_ACTIVITY_TEMPLATES.review, fi) + ' · across all subjects',
    };
  }

  return {
    title: `${course.code} — ${kindLabels[kind]}`,
    courseId: course.id,
    code: course.code,
    color: course.color,
    bg: course.bg,
    notes: pick(STUDY_ACTIVITY_TEMPLATES[kind], fi),
  };
}

function buildPlanningBlock(phaseIdx) {
  return {
    title: 'Weekly Planning',
    courseId: null,
    ...REVIEW_COLOR,
    notes: pick(STUDY_ACTIVITY_TEMPLATES.planning, phaseIdx),
  };
}
