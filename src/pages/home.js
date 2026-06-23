export function renderHomePage(container, navigate, profile) {

export function renderSettingsPage(container) {
  const page = document.createElement('div');
  page.className = 'page';

  page.innerHTML = `
    <div class="topbar">
      <div class="page-title">Settings</div>
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
        width:90px;
        height:90px;
        border-radius:24px;
        background:var(--sagelight);
        display:flex;
        align-items:center;
        justify-content:center;
        margin-bottom:24px;
      ">
        <i class="ti ti-tools" style="
          font-size:46px;
          color:var(--sage2);
        "></i>
      </div>

      <div style="
        font-size:24px;
        font-weight:800;
        color:var(--text);
        margin-bottom:12px;
      ">
        Updates Underway
      </div>

      <div style="
        font-size:14px;
        line-height:1.7;
        color:var(--text2);
        max-width:340px;
        margin-bottom:28px;
      ">
        We're redesigning the Settings experience to give you more control,
        better personalization, and smarter productivity tools throughout your academic journey.
      </div>

      <div style="
        width:100%;
        max-width:340px;
        background:var(--card);
        border-radius:18px;
        padding:18px;
        text-align:left;
      ">
        <div style="
          font-size:12px;
          font-weight:700;
          letter-spacing:.08em;
          text-transform:uppercase;
          color:var(--text3);
          margin-bottom:12px;
        ">
          Coming Soon
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;">
          <div>✨ Personalized preferences</div>
          <div>🔔 Smarter reminders & notifications</div>
          <div>📊 Advanced study insights</div>
          <div>🎨 More customization options</div>
          <div>⚡ Performance improvements</div>
        </div>
      </div>

      <div style="
        margin-top:24px;
        font-size:12px;
        color:var(--text3);
      ">
        Thank you for helping us improve Tsarii.
      </div>
    </div>
  `;

  container.appendChild(page);
}
}