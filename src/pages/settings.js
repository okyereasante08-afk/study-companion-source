import { resetProfile } from '../data/profile.js';
import { showToast } from '../components/toast.js';

export function renderSettingsPage(container, navigate, profile, onReset) {
  const page = document.createElement('div');
  page.className = 'page';

  const topbar = document.createElement('div');
  topbar.className = 'topbar';
  topbar.innerHTML = `<div class="page-title">Settings</div><div class="page-sub">Your data, stored on this device</div>`;
  page.appendChild(topbar);

  // Profile summary
  const sec1 = document.createElement('div');
  sec1.className = 'section-header';
  sec1.innerHTML = `<span class="section-title">Profile</span>`;
  page.appendChild(sec1);

  const profileCard = document.createElement('div');
  profileCard.className = 'card';
  profileCard.style.cssText = 'margin:0 20px 14px;padding:14px 16px;';
  profileCard.innerHTML = `
    <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px;">${escHtml(profile.meta.name)}</div>
    <div style="font-size:12px;color:var(--text2);">${escHtml(profile.meta.university || '—')}${profile.meta.program ? ' · ' + escHtml(profile.meta.program) : ''}</div>
    <div style="font-size:11px;color:var(--text3);margin-top:6px;">Assistant name: ${escHtml(profile.meta.personaName)}</div>
    <div style="font-size:11px;color:var(--text3);margin-top:2px;">${profile.courses.length} courses · ${profile.semester.totalWeeks}-week semester</div>
  `;
  page.appendChild(profileCard);

  // Actions
  const sec2 = document.createElement('div');
  sec2.className = 'section-header';
  sec2.innerHTML = `<span class="section-title">Actions</span>`;
  page.appendChild(sec2);

  const actionsCard = document.createElement('div');
  actionsCard.style.cssText = 'padding:0 20px;display:flex;flex-direction:column;gap:8px;';

  const reEditBtn = makeActionRow('ti-edit', 'Edit setup', 'Re-run the setup wizard to change courses, dates, or timetable');
  reEditBtn.addEventListener('click', () => navigate('wizard'));
  actionsCard.appendChild(reEditBtn);

  const resetBtn = makeActionRow('ti-trash', 'Reset everything', 'Clear all data and start over', true);
  resetBtn.addEventListener('click', () => {
    if (confirmResetState.armed) {
      resetProfile();
      showToast('Reset complete');
      onReset();
    } else {
      confirmResetState.armed = true;
      resetBtn.querySelector('.action-title').textContent = 'Tap again to confirm';
      resetBtn.querySelector('.action-sub').textContent = 'This permanently deletes all your data on this device.';
      setTimeout(() => {
        if (confirmResetState.armed) {
          confirmResetState.armed = false;
          resetBtn.querySelector('.action-title').textContent = 'Reset everything';
          resetBtn.querySelector('.action-sub').textContent = 'Clear all data and start over';
        }
      }, 3000);
    }
  });
  actionsCard.appendChild(resetBtn);

  page.appendChild(actionsCard);

  const confirmResetState = { armed: false };

  // About
  const sec3 = document.createElement('div');
  sec3.className = 'section-header';
  sec3.innerHTML = `<span class="section-title">About</span>`;
  page.appendChild(sec3);

  const aboutCard = document.createElement('div');
  aboutCard.className = 'card';
  aboutCard.style.cssText = 'margin:0 20px 14px;padding:14px 16px;font-size:12px;color:var(--text2);line-height:1.6;';
  aboutCard.innerHTML = `
    All your data is stored locally in this browser — nothing is sent to a server. If you clear your browser data or switch devices, you'll need to set up again.
  `;
  page.appendChild(aboutCard);

  container.appendChild(page);
}

function makeActionRow(icon, title, sub, danger) {
  const row = document.createElement('div');
  row.className = 'card';
  row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:12px 14px;cursor:pointer;';
  row.innerHTML = `
    <div style="width:36px;height:36px;border-radius:10px;background:${danger ? '#FCEBEB' : 'var(--sagelight)'};color:${danger ? 'var(--red)' : 'var(--sage2)'};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;"><i class="ti ${icon}" aria-hidden="true"></i></div>
    <div style="flex:1;">
      <div class="action-title" style="font-size:13px;font-weight:700;color:var(--text);">${title}</div>
      <div class="action-sub" style="font-size:11px;color:var(--text3);margin-top:1px;">${sub}</div>
    </div>
    <div style="color:var(--text3);font-size:14px;"><i class="ti ti-chevron-right" aria-hidden="true"></i></div>
  `;
  return row;
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
