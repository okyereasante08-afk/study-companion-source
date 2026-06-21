import './styles/main.css';
import { renderBottomNav } from './components/bottomNav.js';
import { renderHomePage } from './pages/home.js';
import { renderWeekPage } from './pages/week.js';
import { renderSettingsPage } from './pages/settings.js';
import { renderWizard } from './wizard/index.js';
import { loadProfile, isSetupComplete } from './data/profile.js';

const PAGES = {
  home: (c, nav, profile) => renderHomePage(c, nav, profile),
  week: (c, nav, profile) => renderWeekPage(c, nav, profile),
  settings: (c, nav, profile) => renderSettingsPage(c, nav, profile, () => {
    profile = loadProfile();
    navigate('home');
  }),
};

const VALID_ROUTES = Object.keys(PAGES);

let pageContainer = null;
let navContainer = null;
let currentProfile = null;

function getRouteFromHash() {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  return VALID_ROUTES.includes(hash) ? hash : 'home';
}

function navigate(route) {
  if (route === 'wizard') {
    renderWizardView();
    return;
  }
  if (!VALID_ROUTES.includes(route)) route = 'home';
  if (window.location.hash !== `#/${route}`) {
    window.location.hash = `#/${route}`;
  }
  // Render immediately regardless of whether hashchange fires synchronously —
  // some environments (and even some real-browser edge cases) don't fire it
  // reliably for same-tick programmatic changes.
  renderApp(route);
}

function renderWizardView() {
  navContainer.innerHTML = '';
  pageContainer.innerHTML = '';
  renderWizard(pageContainer, (finalizedProfile) => {
    currentProfile = finalizedProfile;
    window.location.hash = '#/home';
    renderApp('home');
  }, currentProfile && currentProfile.meta.setupComplete ? currentProfile : null);
}

function renderApp(route) {
  currentProfile = loadProfile();

  if (!currentProfile.meta.setupComplete) {
    renderWizardView();
    return;
  }

  pageContainer.innerHTML = '';
  const renderFn = PAGES[route] || PAGES.home;
  renderFn(pageContainer, navigate, currentProfile);

  navContainer.innerHTML = '';
  navContainer.appendChild(renderBottomNav(route, navigate));

  const pageEl = pageContainer.querySelector('.page');
  if (pageEl) pageEl.scrollTop = 0;
}

function initApp() {
  const app = document.getElementById('app');

  pageContainer = document.createElement('div');
  pageContainer.id = 'page-container';
  pageContainer.style.cssText = 'flex:1;display:flex;flex-direction:column;min-height:0;';

  navContainer = document.createElement('div');
  navContainer.id = 'nav-container';

  app.appendChild(pageContainer);
  app.appendChild(navContainer);

  window.addEventListener('hashchange', () => {
    renderApp(getRouteFromHash());
  });

  if (!window.location.hash) {
    window.location.hash = '#/home';
  }
  renderApp(getRouteFromHash());
}

initApp();
