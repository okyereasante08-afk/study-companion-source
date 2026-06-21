import {
  DAYS_SHORT, PHASE_TEMPLATE, parseDate, fmtShortDate,
  getWeekMonday, getCurrentWeekOff, getPhaseForWeek, todayDayIndex,
} from '../data/constants.js';
import { getDaySchedule, countWeekSessions, isUserEdited, getStudyBlock } from '../data/schedule.js';
import { openEditModal } from '../components/editModal.js';

export function renderWeekPage(container, navigate, profile) {
  const today = new Date();
  const semStart = parseDate(profile.semester.startDate);

  if (!semStart) {
    const page = document.createElement('div');
    page.className = 'page';
    page.innerHTML = `
      <div class="topbar"><div class="page-title">Weekly view</div></div>
      <div class="empty-state" style="padding:60px 20px;"><i class="ti ti-calendar-off" aria-hidden="true"></i>No semester set up yet.</div>
    `;
    container.appendChild(page);
    return;
  }

  const totalWeeks = profile.semester.totalWeeks;
  let weekOff = getCurrentWeekOff(semStart, totalWeeks, today);
  let selectedDay = todayDayIndex(today);

  const milestones = (profile.semester.milestones || []).map(m => ({
    ...m,
    startDate: parseDate(m.startDate),
    endDate: m.endDate ? parseDate(m.endDate) : parseDate(m.startDate),
  }));

  const page = document.createElement('div');
  page.className = 'page';

  function renderAll() {
    page.innerHTML = '';
    const phaseIdx = getPhaseForWeek(weekOff, semStart, totalWeeks, milestones);
    const phaseMeta = PHASE_TEMPLATE[phaseIdx];
    const mon = getWeekMonday(semStart, weekOff);
    const sun = new Date(mon);
    sun.setDate(sun.getDate() + 6);

    const topbar = document.createElement('div');
    topbar.className = 'topbar';
    topbar.innerHTML = `
      <div class="topbar-row">
        <div class="page-title">Weekly view</div>
        <div style="display:flex;align-items:center;gap:8px;">
          <button id="prevWeekBtn" aria-label="Previous week" style="width:32px;height:32px;border-radius:50%;background:var(--cream2);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text2);font-size:16px;"><i class="ti ti-chevron-left" aria-hidden="true"></i></button>
          <span class="mono" style="font-size:12px;font-weight:700;color:var(--text2);min-width:50px;text-align:center;">Wk ${weekOff + 1}</span>
          <button id="nextWeekBtn" aria-label="Next week" style="width:32px;height:32px;border-radius:50%;background:var(--cream2);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text2);font-size:16px;"><i class="ti ti-chevron-right" aria-hidden="true"></i></button>
        </div>
      </div>
    `;
    page.appendChild(topbar);
    topbar.querySelector('#prevWeekBtn').addEventListener('click', () => { weekOff = Math.max(0, weekOff - 1); selectedDay = 0; renderAll(); });
    topbar.querySelector('#nextWeekBtn').addEventListener('click', () => { weekOff = Math.min(totalWeeks - 1, weekOff + 1); selectedDay = 0; renderAll(); });

    // Phase banner
    const banner = document.createElement('div');
    banner.style.cssText = 'margin:0 20px 14px;background:var(--sage3);border-radius:14px;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;';
    banner.innerHTML = `
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.65);">${phaseMeta.label} Phase</div>
        <div style="font-size:14px;font-weight:700;color:#fff;margin-top:1px;">Week ${weekOff + 1} of ${totalWeeks}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;color:rgba(255,255,255,.65);">${fmtShortDate(mon)} – ${fmtShortDate(sun)}</div>
        <div style="font-size:12px;font-weight:700;color:#fff;margin-top:1px;">${countWeekSessions(profile, weekOff)} sessions</div>
      </div>
    `;
    page.appendChild(banner);

    // Day strip
    const strip = document.createElement('div');
    strip.style.cssText = 'display:flex;gap:6px;padding:0 20px 14px;overflow-x:auto;scrollbar-width:none;';
    DAYS_SHORT.forEach((d, i) => {
      const date = new Date(mon);
      date.setDate(mon.getDate() + i);
      const isToday = date.toDateString() === today.toDateString();
      const isActive = i === selectedDay;
      const hasSession = getDaySchedule(profile, weekOff, i).length > 0;
      const chip = document.createElement('div');
      chip.style.cssText = `
        display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 10px;
        border-radius:14px;cursor:pointer;min-width:42px;flex-shrink:0;
        background:${isActive ? 'var(--sage)' : 'var(--cream2)'};
        border:2px solid ${isToday && !isActive ? 'var(--sage2)' : 'transparent'};
      `;
      chip.innerHTML = `
        <span style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${isActive ? '#fff' : 'var(--text3)'};">${d[0]}</span>
        <span style="font-size:15px;font-weight:700;color:${isActive ? '#fff' : (isToday ? 'var(--sage2)' : 'var(--text2)')};">${date.getDate()}</span>
        ${hasSession ? `<span style="width:4px;height:4px;border-radius:50%;background:${isActive ? 'rgba(255,255,255,.7)' : 'var(--sage2)'};margin-top:1px;"></span>` : ''}
      `;
      chip.addEventListener('click', () => { selectedDay = i; renderAll(); });
      strip.appendChild(chip);
    });
    page.appendChild(strip);

    // Day view
    const view = document.createElement('div');
    view.style.cssText = 'padding:0 20px;';
    const events = getDaySchedule(profile, weekOff, selectedDay);
    const isToday = selectedDay === todayDayIndex(today) && weekOff === getCurrentWeekOff(semStart, totalWeeks, today);
    const nowMins = today.getHours() * 60 + today.getMinutes();

    if (events.length === 0) {
      view.innerHTML = `<div class="empty-state"><i class="ti ti-moon" aria-hidden="true"></i>No sessions for this day.</div>`;
    } else {
      events.forEach((ev, i) => {
        const isDone = isToday && ev.start < nowMins - 30;
        const isNow = isToday && ev.start <= nowMins && ev.start + 90 > nowMins;
        const color = ev.color || '#5B7B7A';
        const edited = ev.type === 'study' && isUserEdited(profile, weekOff, selectedDay, ev.id);

        const item = document.createElement('div');
        item.style.cssText = 'display:flex;gap:10px;margin-bottom:10px;';
        item.innerHTML = `
          <div style="width:42px;flex-shrink:0;padding-top:14px;text-align:right;">
            <span class="mono" style="font-size:11px;font-weight:600;color:var(--text3);">${ev.lbl}</span>
          </div>
          <div style="width:20px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;">
            <div style="width:9px;height:9px;border-radius:50%;margin-top:17px;border:2px solid var(--cream);flex-shrink:0;background:${isDone ? '#C0B8A8' : color};"></div>
            ${i < events.length - 1 ? '<div style="width:2px;flex:1;background:var(--cream3);margin-top:3px;"></div>' : ''}
          </div>
          <div class="card ev-card" style="flex:1;border-radius:14px;padding:11px 13px;border-left:4px solid ${color};${ev.type === 'lecture' ? 'background:var(--sagelight);' : ''}${isDone ? 'opacity:.5;' : ''}cursor:${ev.type === 'study' ? 'pointer' : 'default'};">
            <div style="font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:${color};margin-bottom:2px;">${escHtml(ev.code)}${edited ? ' · edited' : ''}</div>
            <div style="font-size:13px;font-weight:700;color:var(--text);line-height:1.25;margin-bottom:4px;">${escHtml(ev.title)}</div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:11px;color:var(--text3);">
              <span>${ev.range}</span>
              ${ev.type === 'lecture' ? `<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px;background:var(--sagebg);color:var(--sage2);">Lecture</span>` : ''}
              ${isNow ? `<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px;background:#D1FAE5;color:#065F46;">Now</span>` : ''}
              ${ev.room ? `<span>${escHtml(ev.room)}</span>` : ''}
              ${ev.notes ? `<span style="font-style:italic;">${escHtml(ev.notes)}</span>` : ''}
            </div>
          </div>
        `;
        if (ev.type === 'study') {
          item.querySelector('.ev-card').addEventListener('click', () => {
            const existing = getStudyBlock(profile, weekOff, selectedDay, ev.id);
            openEditModal(
              { weekOff, dayIdx: selectedDay, slotId: ev.id, range: ev.range, isEdited: edited, courses: profile.courses },
              existing,
              profile.courses,
              renderAll
            );
          });
        }
        view.appendChild(item);
      });
    }
    page.appendChild(view);
  }

  renderAll();
  container.appendChild(page);
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
