const NAV_ITEMS = [
  { route: 'home', icon: 'ti-home', label: 'Home' },
  { route: 'week', icon: 'ti-calendar-week', label: 'Week' },
  { route: 'settings', icon: 'ti-settings', label: 'Settings' },
];

export function renderBottomNav(activeRoute, onNavigate) {
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';

  NAV_ITEMS.forEach(item => {
    const isActive = item.route === activeRoute;
    const btn = document.createElement('button');
    btn.className = 'nav-item';
    btn.setAttribute('aria-label', item.label);
    btn.innerHTML = `
      <span class="nav-icon ${isActive ? 'active' : ''}"><i class="ti ${item.icon}" aria-hidden="true"></i></span>
      <span class="nav-label ${isActive ? 'active' : ''}">${item.label}</span>
      ${isActive ? '<span class="nav-dot"></span>' : ''}
    `;
    btn.addEventListener('click', () => onNavigate(item.route));
    nav.appendChild(btn);
  });

  return nav;
}
