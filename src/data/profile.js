// Core storage layer. The entire user profile lives as one JSON object in
// localStorage. This is intentionally simple — no backend, no auth, fully
// client-side. Anyone visiting gets their own empty profile until they run
// the setup wizard.

const STORE_KEY = 'study_pa_profile_v1';

/**
 * Profile shape:
 * {
 *   meta: {
 *     name: string,
 *     university: string,
 *     program: string,
 *     personaName: string,        // e.g. "Sir", "Coach", "Assistant" - what the PA calls itself / addresses you as
 *     setupComplete: boolean,
 *   },
 *   semester: {
 *     startDate: 'YYYY-MM-DD',
 *     totalWeeks: number,
 *     milestones: [ { id, label, startDate, endDate } ]  // e.g. Mid-sems, Finals
 *   },
 *   courses: [
 *     { id, code, name, lecturer, color, bg, status }   // status: free-text tag e.g. "Core","Elective"
 *   ],
 *   timetable: {
 *     // key = "dayIndex|slotId" -> { courseId, room, type: 'lecture'|'lab'|'tutorial' }
 *     lectures: { ... }
 *   },
 *   studyPlan: {
 *     // generated suggestions, key = "weekOff|dayIndex|slotId" OR phase-based
 *     // phase-based default suggestions, keyed by phaseIndex then "dayIndex|slotId"
 *     phases: [ {...}, {...}, {...} ],
 *     userEdits: { "weekOff|dayIndex|slotId": {...} | null }
 *   },
 *   slots: [ { id, lbl, start, range } ]  // user-defined time slots (can use defaults)
 * }
 */

export function getDefaultProfile() {
  return {
    meta: {
      name: '',
      university: '',
      program: '',
      personaName: 'Coach',
      setupComplete: false,
    },
    semester: {
      startDate: '',
      totalWeeks: 16,
      milestones: [],
    },
    courses: [],
    timetable: {
      lectures: {},
    },
    studyPlan: {
      phases: [],
      userEdits: {},
    },
    slots: [],
  };
}

let cachedProfile = null;

export function loadProfile() {
  if (cachedProfile) return cachedProfile;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      cachedProfile = JSON.parse(raw);
      // Merge with defaults to handle partial/older profiles gracefully
      cachedProfile = deepMerge(getDefaultProfile(), cachedProfile);
    } else {
      cachedProfile = getDefaultProfile();
    }
  } catch (e) {
    cachedProfile = getDefaultProfile();
  }
  return cachedProfile;
}

export function saveProfile(profile) {
  cachedProfile = profile;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(profile));
  } catch (e) {
    // localStorage unavailable (private browsing etc.) - app still works in-memory for this session
  }
}

export function updateProfile(updater) {
  const profile = loadProfile();
  const next = updater(profile);
  saveProfile(next);
  return next;
}

export function resetProfile() {
  cachedProfile = getDefaultProfile();
  try {
    localStorage.removeItem(STORE_KEY);
  } catch (e) {}
  return cachedProfile;
}

export function isSetupComplete() {
  return loadProfile().meta.setupComplete === true;
}

function deepMerge(base, override) {
  if (Array.isArray(base)) {
    return Array.isArray(override) ? override : base;
  }
  if (typeof base === 'object' && base !== null) {
    const result = { ...base };
    for (const key in override) {
      if (key in base && typeof base[key] === 'object' && base[key] !== null && !Array.isArray(base[key])) {
        result[key] = deepMerge(base[key], override[key]);
      } else {
        result[key] = override[key];
      }
    }
    return result;
  }
  return override !== undefined ? override : base;
}
