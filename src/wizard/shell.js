/**
 * Renders the wizard shell: progress bar, body content, and footer buttons.
 * Each step module exports { render(body, state), validate(state) }.
 * `render` populates `body` with form elements and should mutate `state`
 * directly as the user types (no separate "commit" step needed).
 */
export function renderWizardShell(container, {
  stepIndex, totalSteps, title, sub, render, onBack, onNext, nextLabel, state, canSkip, onSkip,
}) {
  container.innerHTML = '';
  const shell = document.createElement('div');
  shell.className = 'wizard-shell';

  // Progress
  const progress = document.createElement('div');
  progress.className = 'wizard-progress';
  for (let i = 0; i < totalSteps; i++) {
    const dot = document.createElement('div');
    dot.className = 'wizard-progress-dot' + (i === stepIndex ? ' active' : i < stepIndex ? ' done' : '');
    progress.appendChild(dot);
  }
  shell.appendChild(progress);

  // Body
  const body = document.createElement('div');
  body.className = 'wizard-body';

  const titleEl = document.createElement('div');
  titleEl.className = 'wizard-title';
  titleEl.textContent = title;
  body.appendChild(titleEl);

  if (sub) {
    const subEl = document.createElement('div');
    subEl.className = 'wizard-sub';
    subEl.textContent = sub;
    body.appendChild(subEl);
  }

  const content = document.createElement('div');
  body.appendChild(content);
  shell.appendChild(body);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'wizard-footer';

  if (stepIndex > 0) {
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary';
    backBtn.textContent = 'Back';
    backBtn.style.flexShrink = '0';
    backBtn.addEventListener('click', onBack);
    footer.appendChild(backBtn);
  }

  if (canSkip) {
    const skipBtn = document.createElement('button');
    skipBtn.className = 'btn btn-secondary';
    skipBtn.textContent = 'Skip';
    skipBtn.style.flexShrink = '0';
    skipBtn.addEventListener('click', onSkip);
    footer.appendChild(skipBtn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn-primary';
  nextBtn.style.flex = '1';
  nextBtn.textContent = nextLabel || (stepIndex === totalSteps - 1 ? 'Finish' : 'Continue');
  nextBtn.addEventListener('click', onNext);
  footer.appendChild(nextBtn);

  shell.appendChild(footer);
  container.appendChild(shell);

  // Let the step render its fields
  render(content, state, { nextBtn });

  return { content, nextBtn };
}
