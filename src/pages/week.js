export function renderWeekPage(container) {
  const page = document.createElement("div");
  page.className = "page";

  page.innerHTML = `
    <div class="topbar">
      <div class="page-title">Week</div>
      <div class="page-sub">Work in progress</div>
    </div>

    <div style="
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      text-align:center;
      padding:80px 24px;
      min-height:70vh;
    ">
      <div style="
        width:90px;height:90px;border-radius:24px;
        background:var(--sagelight);display:flex;
        align-items:center;justify-content:center;margin-bottom:24px;
      ">
        <i class="ti ti-calendar-week" style="font-size:46px;color:var(--sage2);"></i>
      </div>
      <div style="font-size:24px;font-weight:800;color:var(--text);margin-bottom:12px;">Updates Underway</div>
      <div style="font-size:14px;line-height:1.7;color:var(--text2);max-width:340px;margin-bottom:28px;">
        Your weekly planner is getting a full redesign — smarter scheduling, drag-and-drop sessions, and a cleaner at-a-glance view of your week.
      </div>
      <div style="width:100%;max-width:340px;background:var(--card);border-radius:18px;padding:18px;text-align:left;">
        <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text3);margin-bottom:12px;">Coming Soon</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div>📅 Drag-and-drop weekly schedule</div>
          <div>⏱️ Smart session time blocking</div>
          <div>🔁 Repeating task patterns</div>
          <div>📈 Weekly progress overview</div>
          <div>🎯 Goal-to-week breakdown</div>
        </div>
      </div>
      <div style="margin-top:24px;font-size:12px;color:var(--text3);">Thank you for helping us improve Tsarii.</div>
    </div>
  `;

  container.appendChild(page);
}