import { renderWizardShell } from './shell.js';
import { stepBasicInfo } from './step1_basicInfo.js';
import { stepSemesterDates } from './step2_semesterDates.js';
import { stepCourses } from './step3_courses.js';
import { stepTimetable } from './step4_timetable.js';
import { stepReview } from './step5_review.js';
import { getDefaultProfile, saveProfile } from '../data/profile.js';
import { showToast } from '../components/toast.js';

const STEPS = [stepBasicInfo, stepSemesterDates, stepCourses, stepTimetable, stepReview];

export function renderWizard(container, onComplete, existingProfile) {
  // Deep-clone so edits during the wizard don't mutate the saved profile
  // until the user actually finishes.
  const state = existingProfile
    ? JSON.parse(JSON.stringify(existingProfile))
    : getDefaultProfile();

  let stepIndex = 0;

  function goToStep(i) {
    stepIndex = Math.max(0, Math.min(STEPS.length - 1, i));
    renderStep();
  }

  function renderStep() {
    const step = STEPS[stepIndex];
    renderWizardShell(container, {
      stepIndex,
      totalSteps: STEPS.length,
      title: step.title,
      sub: step.sub,
      render: step.render,
      state,
      onBack: () => goToStep(stepIndex - 1),
      onNext: () => {
        const error = step.validate(state);
        if (error) {
          showToast(error);
          return;
        }
        if (stepIndex === STEPS.length - 1) {
          // Finalize
          const finalized = stepReview.finalize(state);
          saveProfile(finalized);
          onComplete(finalized);
        } else {
          goToStep(stepIndex + 1);
        }
      },
    });
  }

  renderStep();
}
