import {
  DAYS_SHORT, parseDate, getCurrentWeekOff, daysUntil, todayDayIndex,
} from '../data/constants.js';
import { getDaySchedule, getNextEvent } from '../data/schedule.js';

function adjustColor(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const clamp = v => Math.min(255, Math.max(0, v + amount));
  return '#' + [r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('');
}

const COACH_TIPS = [
  'A short review right after class beats a long one days later. Catch it while it\'s fresh.',
  'If a review feels too quick, it probably is — depth over ticking boxes.',
  'Past papers show you exactly what to expect. Make time for them early.',
  'Flashcard review is best done when you\'d rather not. That resistance is the gap.',
  'One error log per subject. Every mistake is data, not a failure.',
  'Sleep is part of the plan, not a break from it. Protect your evenings before exams.',
  'Small consistent sessions beat occasional marathons. Show up daily.',
];

export function renderHomePage(container, navigate, profile) {
  const today = new Date();
  let selectedDay = todayDayIndex(today);
  const semStart = parseDate(profile.semester.startDate);
  const weekOff = semStart ? getCurrentWeekOff(semStart, profile.semester.totalWeeks, today) : 0;

  const page = document.createElement('div');
  page.className = 'page';

  function renderAll() {
    page.innerHTML = '';

    const topbar = document.createElement('div');
    topbar.className = 'topbar';
    const hour = today.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = (profile.meta.name || '').split(' ')[0] || 'there';
    topbar.innerHTML = `
      <div class="topbar-row">
        <div>
          <div class="eyebrow">${greeting}</div>
          <div class="page-title">Hi ${escHtml(firstName)}, let's<br>get to work today.</div>
        </div>
        <div class="avatar">${initials(profile.meta.name)}</div>
      </div>
    `;
    page.appendChild(topbar);

    // Date strip
    const strip = document.createElement('div');
    strip.style.cssText = 'display:flex;gap:8px;padding:14px 20px 0;overflow-x:auto;scrollbar-width:none;';
    if (semStart) {
      const dow = today.getDay() === 0 ? 6 : today.getDay() - 1;
      const weekMon = new Date(today);
      weekMon.setDate(today.getDate() - dow);
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekMon);
        d.setDate(weekMon.getDate() + i);
        const isToday = d.toDateString() === today.toDateString();
        const isActive = i === selectedDay;
        const hasSession = getDaySchedule(profile, weekOff, i).length > 0;
        const chip = document.createElement('div');
        chip.style.cssText = `
          display:flex;flex-direction:column;align-items:center;gap:3px;
          background:${isActive ? 'var(--sage)' : 'var(--cream2)'};
          border-radius:14px;padding:8px 12px;min-width:46px;cursor:pointer;
          border:2px solid ${isToday && !isActive ? 'var(--sage2)' : 'transparent'};
          flex-shrink:0;
        `;
        chip.innerHTML = `
          <span style="font-size:10px;font-weight:600;letter-spacing:.06em;color:${isActive ? '#fff' : 'var(--text3)'};text-transform:uppercase;">${DAYS_SHORT[i][0]}</span>
          <span style="font-size:15px;font-weight:700;color:${isActive ? '#fff' : 'var(--text2)'};">${d.getDate()}</span>
          ${hasSession ? `<span style="width:4px;height:4px;border-radius:50%;background:${isActive ? 'rgba(255,255,255,.7)' : 'var(--sage2)'};margin-top:2px;display:block;"></span>` : ''}
        `;
        chip.addEventListener('click', () => { selectedDay = i; renderAll(); });
        strip.appendChild(chip);
      }
    }
    page.appendChild(strip);

    if (!semStart) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.style.padding = '60px 20px';
      empty.innerHTML = `<i class="ti ti-calendar-off" aria-hidden="true"></i>No semester set up yet.`;
      page.appendChild(empty);
      return;
    }

    const isToday = selectedDay === todayDayIndex(today);

    // Next up
    const sec1 = document.createElement('div');
    sec1.className = 'section-header';
    sec1.style.paddingTop = '16px';
    sec1.innerHTML = `<span class="section-title">Next up</span><span style="font-size:12px;color:var(--text3);">${isToday ? today.toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' }) : DAYS_SHORT[selectedDay]}</span>`;
    page.appendChild(sec1);

    const nowMins = today.getHours() * 60 + today.getMinutes();
    const events = getDaySchedule(profile, weekOff, selectedDay);
    let next = isToday ? (events.find(ev => ev.start > nowMins - 30) || null) : (events[0] || null);

    const card = document.createElement('div');
    card.style.cssText = 'margin:0 20px 6px;border-radius:20px;padding:18px 20px;position:relative;overflow:hidden;box-shadow:0 4px 20px rgba(91,123,122,.28);';
    if (next) {
      const base = next.color || '#5B7B7A';
      card.style.background = `linear-gradient(135deg, ${adjustColor(base, -60)} 0%, ${base} 100%)`;
      const eyebrowTxt = next.type === 'lecture' ? 'Upcoming Lecture' : 'Upcoming Study Block';
      const meta = next.type === 'lecture' ? (next.meta || '') : (next.notes || '');
      const room = next.type === 'lecture' ? (next.room || '') : 'Self-study';
      card.innerHTML = `
        <div style="position:absolute;right:-14px;top:-14px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,.10);"></div>
        <div style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.7);margin-bottom:6px;">${eyebrowTxt}</div>
        <div class="serif" style="font-size:18px;color:#fff;line-height:1.2;margin-bottom:4px;">${escHtml(next.title)}</div>
        <div style="font-size:12px;color:rgba(255,255,255,.75);margin-bottom:14px;">${escHtml(meta)}</div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="background:rgba(255,255,255,.18);border-radius:10px;padding:6px 14px;font-size:13px;font-weight:700;color:#fff;">${next.range}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.75);">${escHtml(room)}</div>
        </div>
      `;
    } else {
      card.style.background = 'linear-gradient(135deg, #3A5554 0%, #5B7B7A 100%)';
      card.innerHTML = `
        <div style="position:absolute;right:-14px;top:-14px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,.10);"></div>
        <div style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.7);margin-bottom:6px;">All clear</div>
        <div class="serif" style="font-size:18px;color:#fff;line-height:1.2;margin-bottom:4px;">Rest & consolidate.</div>
        <div style="font-size:12px;color:rgba(255,255,255,.75);margin-bottom:14px;">${isToday ? "You've cleared all sessions for today." : 'No sessions scheduled.'}</div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="background:rgba(255,255,255,.18);border-radius:10px;padding:6px 14px;font-size:13px;font-weight:700;color:#fff;">Free time</div>
          <div style="font-size:12px;color:rgba(255,255,255,.75);">Well earned</div>
        </div>
      `;
    }
    page.appendChild(card);

    // Progress row
    const total = events.length;
    const done = isToday ? events.filter(ev => ev.start < nowMins - 30).length : 0;

    const milestones = (profile.semester.milestones || []).filter(m => m.label.trim() && m.startDate);
    const nextMilestone = milestones
      .map(m => ({ ...m, date: parseDate(m.startDate) }))
      .filter(m => m.date >= today)
      .sort((a, b) => a.date - b.date)[0];

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;margin:0 20px 6px;';
    row.innerHTML = `
      <div class="card" style="flex:1;padding:14px 14px 12px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-bottom:8px;">${isToday ? 'Today' : 'Day'}</div>
        <div style="font-size:20px;font-weight:700;color:var(--text);line-height:1;">${done}/${total}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px;">sessions ${isToday ? 'done' : 'planned'}</div>
        <div style="background:var(--cream2);border-radius:4px;height:5px;margin-top:10px;overflow:hidden;">
          <div style="height:5px;border-radius:4px;background:var(--sage);width:${total ? Math.round((done / total) * 100) : 0}%;"></div>
        </div>
      </div>
      <div class="card" style="flex:1;padding:14px 14px 12px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-bottom:8px;">${nextMilestone ? escHtml(nextMilestone.label) : 'Semester'}</div>
        ${nextMilestone ? `
          <div style="font-size:20px;font-weight:700;color:var(--text);line-height:1;">${daysUntil(nextMilestone.date, today)}d</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px;">until it starts</div>
        ` : `
          <div style="font-size:20px;font-weight:700;color:var(--text);line-height:1;">Week ${weekOff + 1}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px;">of ${profile.semester.totalWeeks}</div>
        `}
        <div style="background:var(--cream2);border-radius:4px;height:5px;margin-top:10px;overflow:hidden;">
          <div style="height:5px;border-radius:4px;background:#C49B3C;width:${Math.min(100, Math.round(((weekOff + 1) / profile.semester.totalWeeks) * 100))}%;"></div>
        </div>
      </div>
    `;
    page.appendChild(row);

    // Coach strip
    const tipIdx = Math.floor((today - semStart) / 86400000) % COACH_TIPS.length;
    const tip = COACH_TIPS[((tipIdx % COACH_TIPS.length) + COACH_TIPS.length) % COACH_TIPS.length];
    const coachStrip = document.createElement('div');
    coachStrip.style.cssText = 'margin:4px 20px 6px;background:var(--cream2);border-radius:16px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start;';
    coachStrip.innerHTML = `
      <div style="width:36px;height:36px;border-radius:50%;background:var(--sage);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;flex-shrink:0;"><i class="ti ti-bulb" aria-hidden="true"></i></div>
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--sage);">From your ${escHtml(profile.meta.personaName)}</div>
        <div style="font-size:12px;color:var(--text2);margin-top:2px;line-height:1.5;">${tip}</div>
      </div>
    `;
    page.appendChild(coachStrip);

    // Schedule
    const sec2 = document.createElement('div');
    sec2.className = 'section-header';
    sec2.innerHTML = `<span class="section-title">${isToday ? "Today's schedule" : DAYS_SHORT[selectedDay] + "'s schedule"}</span><button class="section-link" id="seeWeekBtn">See week →</button>`;
    page.appendChild(sec2);
    sec2.querySelector('#seeWeekBtn').addEventListener('click', () => navigate('week'));

    const wrap = document.createElement('div');
    wrap.style.cssText = 'padding:0 20px;';
    if (events.length === 0) {
      wrap.innerHTML = `<div class="empty-state"><i class="ti ti-moon" aria-hidden="true"></i>No sessions scheduled.</div>`;
    } else {
      events.forEach((ev, i) => {
        const isDone = isToday && ev.start < nowMins - 30;
        const isNow = isToday && ev.start <= nowMins && ev.start + 90 > nowMins;
        const color = ev.color || '#5B7B7A';
        const item = document.createElement('div');
        item.style.cssText = 'display:flex;gap:14px;margin-bottom:12px;';
        item.innerHTML = `
          <div style="width:44px;flex-shrink:0;text-align:right;padding-top:14px;">
            <span class="mono" style="font-size:11px;font-weight:600;color:var(--text3);">${ev.lbl}</span>
          </div>
          <div style="width:24px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;">
            <div style="width:10px;height:10px;border-radius:50%;margin-top:18px;flex-shrink:0;border:2px solid var(--cream);background:${isDone ? 'var(--text3)' : color};"></div>
            ${i < events.length - 1 ? '<div style="width:2px;flex:1;background:var(--cream3);margin-top:4px;"></div>' : ''}
          </div>
          <div class="card" style="flex:1;padding:12px 14px;min-height:62px;border-left:4px solid ${color};${ev.type === 'lecture' ? 'background:var(--sagelight);' : ''}${isDone ? 'opacity:.55;' : ''}${isNow ? 'box-shadow:0 4px 20px rgba(91,123,122,.2);' : ''}">
            <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.75;color:${color};margin-bottom:2px;">${escHtml(ev.code)}</div>
            <div style="font-size:13px;font-weight:700;color:var(--text);line-height:1.25;margin-bottom:3px;">${escHtml(ev.title)}</div>
            <div style="font-size:11px;color:var(--text3);display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span>${ev.range}</span>
              ${ev.type === 'lecture' ? `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;background:var(--sagebg);color:var(--sage2);">Lecture</span>` : ''}
              ${isNow ? `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;background:#D1FAE5;color:#065F46;">Now</span>` : ''}
              ${ev.room ? `<span>${escHtml(ev.room)}</span>` : ''}
            </div>
          </div>
        `;
        wrap.appendChild(item);
      });
    }
    page.appendChild(wrap);
  }

  renderAll();
  container.appendChild(page);
}

function initials(name) {
  return (name || '').trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?';
}
function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
