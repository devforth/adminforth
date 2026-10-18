// The landing page around the iframe owns the light/dark switch, a screen can pin its theme with <html data-theme="dark">
const landingRoot = window.parent.document.documentElement;
const pinnedTheme = document.documentElement.dataset.theme;
function syncTheme() {
  document.documentElement.classList.toggle('dark', (pinnedTheme ?? landingRoot.dataset.theme) === 'dark');
}
syncTheme();
new MutationObserver(syncTheme).observe(landingRoot, { attributeFilter: ['data-theme'] });

// Screens with the app sidebar share one menu, <aside class="side" data-active="Cars"> marks the open page,
// a collapsed sidebar (class "rail") keeps only the icons, data-brand and data-logo replace the default brand
const MENU = [
  { icon: 'layout-dashboard', label: 'Dashboard' },
  { icon: 'house', label: 'Apartments' },
  { icon: 'car', label: 'Cars' },
  { icon: 'languages', label: 'Translations', badge: 27 },
  { heading: 'System' },
  { icon: 'users', label: 'Users' },
  { icon: 'scroll-text', label: 'Audit Logs' },
  { icon: 'layers', label: 'Background Jobs' },
];
const icon = (name) => `<svg class="i"><use href="icons.svg#${name}"/></svg>`;
for (const side of document.querySelectorAll('.side')) {
  const rail = side.classList.contains('rail');
  const items = MENU.map((item) => {
    if (item.heading) {
      return `<div class="nav-sep"></div>${rail ? '' : `<div class="nav-head">${item.heading}</div>`}`;
    }
    const text = rail ? '' : `${item.label}${item.badge ? `<span class="count trail">${item.badge}</span>` : ''}`;
    return `<span class="nav${item.label === side.dataset.active ? ' is-on' : ''}">${icon(item.icon)}${text}</span>`;
  });
  const logo = `<svg><use href="brands.svg#${side.dataset.logo ?? 'adminforth'}"/></svg>`;
  side.innerHTML = `<div class="side-brand">${logo}${rail ? '' : side.dataset.brand ?? 'My Admin'}</div><nav class="side-nav">${items.join('')}</nav>`;
}

// A screen is drawn at its own fixed size and scaled down to the width of the card, like a screenshot
const screen = document.querySelector('.screen');
function fit() {
  screen.style.scale = window.innerWidth / screen.offsetWidth;
  screen.style.visibility = 'visible';
}
fit();
window.addEventListener('resize', fit);
