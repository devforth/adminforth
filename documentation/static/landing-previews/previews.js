// The landing page around the iframe owns the light/dark switch, a screen can pin its theme with <html data-theme="dark">
// or the page that shows it with ?theme=dark
const size = new URLSearchParams(location.search);
const landingRoot = window.parent.document.documentElement;
const pinnedTheme = document.documentElement.dataset.theme ?? size.get('theme');
function syncTheme() {
  document.documentElement.classList.toggle('dark', (pinnedTheme ?? landingRoot.dataset.theme) === 'dark');
}
syncTheme();
new MutationObserver(syncTheme).observe(landingRoot, { attributeFilter: ['data-theme'] });

// Screens with the app sidebar share a menu, <aside class="side" data-active="Cars"> marks the open page,
// data-menu picks another app than the demo one, a collapsed sidebar (class "rail") keeps only the icons,
// data-brand and data-logo replace the default brand
const MENUS = {
  demo: [
    { icon: 'layout-dashboard', label: 'Dashboard' },
    { icon: 'house', label: 'Apartments' },
    { icon: 'car', label: 'Cars' },
    { icon: 'languages', label: 'Translations', badge: 27 },
    { heading: 'System' },
    { icon: 'users', label: 'Users' },
    { icon: 'scroll-text', label: 'Audit Logs' },
    { icon: 'layers', label: 'Background Jobs' },
  ],
  // the made-up service business of the business landing (pages/business)
  northstar: [
    { icon: 'layout-dashboard', label: 'Overview' },
    { icon: 'inbox', label: 'Requests', badge: 5 },
    { icon: 'list-checks', label: 'Follow-ups' },
    { icon: 'building-2', label: 'Customers' },
    { icon: 'hammer', label: 'Jobs' },
    { icon: 'receipt', label: 'Invoices' },
    { icon: 'package', label: 'Stock' },
    { heading: 'Team' },
    { icon: 'users', label: 'People' },
    { icon: 'scroll-text', label: 'Audit log' },
  ],
};

// A page can show a screen at another size than drawn: business-requests.html?w=760&h=480&rail
const screen = document.querySelector('.screen');
for (const side of ['w', 'h']) {
  if (size.has(side)) {
    screen.style[side === 'w' ? 'width' : 'height'] = `${size.get(side)}px`;
  }
}

const icon = (name) => `<svg class="i"><use href="icons.svg#${name}"/></svg>`;
for (const side of document.querySelectorAll('.side')) {
  side.classList.toggle('rail', side.classList.contains('rail') || size.has('rail'));
  const rail = side.classList.contains('rail');
  const items = MENUS[side.dataset.menu ?? 'demo'].map((item) => {
    if (item.heading) {
      return `<div class="nav-sep"></div>${rail ? '' : `<div class="nav-head">${item.heading}</div>`}`;
    }
    const text = rail ? '' : `${item.label}${item.badge ? `<span class="count">${item.badge}</span>` : ''}`;
    return `<span class="nav${item.label === side.dataset.active ? ' is-on' : ''}">${icon(item.icon)}${text}</span>`;
  });
  const logo = `<svg><use href="brands.svg#${side.dataset.logo ?? 'adminforth'}"/></svg>`;
  side.innerHTML = `<div class="side-brand">${logo}${rail ? '' : side.dataset.brand ?? 'My Admin'}</div><nav class="side-nav">${items.join('')}</nav>`;
}

// A screen is drawn at its own fixed size and scaled down to the width of the card, like a screenshot
function fit() {
  screen.style.scale = window.innerWidth / screen.offsetWidth;
  screen.style.visibility = 'visible';
}
fit();
window.addEventListener('resize', fit);
