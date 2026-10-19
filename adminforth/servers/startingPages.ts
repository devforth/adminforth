import { StylesGenerator } from '../modules/styleGenerator.js';
import type { IAdminForth } from '../types/Back.js';

// Pages which the SPA route answers with while the SPA itself can't be served yet. They are plain HTML
// without Tailwind and AFCL, so they take the app's style tokens as CSS variables.

const POLL_INTERVAL_MS = 500;
const STUCK_HINT_DELAY_MS = 10_000;

const PAGE_TOKENS: Record<string, [light: string, dark: string]> = {
  'bg': ['lightHtml', 'darkHtml'],
  'surface': ['lightForm', 'darkForm'],
  'border': ['lightFormBorder', 'darkFormBorder'],
  'text': ['lightFormFieldTextColor', 'darkFormFieldTextColor'],
  'muted': ['lightInputIconColor', 'darkInputIconColor'],
  'success': ['lightSuccess', 'darkSuccess'],
  'primary': ['lightPrimary', 'darkPrimary'],
  'track': ['lightProgressBarUnfilledColor', 'darkProgressBarUnfilledColor'],
  'ink': ['lightButtonsBackground', 'darkButtonsBackground'],
  'on-ink': ['lightButtonsText', 'darkButtonsText'],
  'button': ['lightSecondary', 'darkSecondary'],
  'button-hover': ['lightSecondaryDarken', 'darkSecondaryLighten'],
  'button-text': ['lightSecondaryContrast', 'darkSecondaryContrast'],
  'ring': ['lightFocusRing', 'darkFocusRing'],
};

const tokenVars = (colors: Record<string, string>, theme: 0 | 1) =>
  Object.entries(PAGE_TOKENS).map(([name, tokens]) => `--${name}: ${colors[tokens[theme]]};`).join(' ');

function renderPage(adminforth: IAdminForth, title: string, body: string) {
  const { colors, fontFamily } = new StylesGenerator(adminforth.config.customization.styles).mergeStyles();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script>
    document.documentElement.classList.toggle('dark', (${JSON.stringify(adminforth.config.customization.singleTheme ?? null)} ?? localStorage.getItem('af__theme')) === 'dark');
  </script>
  <style>
    :root { ${tokenVars(colors, 0)} color-scheme: light; }
    :root.dark { ${tokenVars(colors, 1)} color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100dvh; display: flex; flex-direction: column; background: var(--bg); color: var(--text); font: 14px/20px ${fontFamily.sans.join(', ')}; -webkit-font-smoothing: antialiased; }
    main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 32px 16px; }
    h1 { margin: 0; font-size: 22px; line-height: 28px; font-weight: 600; letter-spacing: -0.015em; }
    p { margin: 0; }
    svg { flex: none; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
    .column { width: 100%; max-width: 320px; display: flex; flex-direction: column; gap: 16px; text-align: center; }
    .column.centered { max-width: 360px; align-items: center; }
    .heading { display: flex; flex-direction: column; gap: 6px; }
    .muted { color: var(--muted); }
    .spinner { flex: none; width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--track); border-top-color: var(--primary); animation: spin .7s linear infinite; }
    .spinner.large { width: 24px; height: 24px; border-width: 2.5px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .banner { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 8px 16px; background: var(--ink); color: var(--on-ink); font-size: 13px; line-height: 18px; font-weight: 500; text-align: center; }
    .steps { list-style: none; margin: 0; padding: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; text-align: left; }
    .steps li { display: flex; align-items: center; gap: 10px; padding: 10px 14px; font-weight: 500; }
    .steps li + li { border-top: 1px solid var(--border); }
    .steps .done { color: var(--success); }
    .steps .waiting { color: var(--muted); }
    .stuck { display: flex; flex-direction: column; align-items: center; gap: 10px; font-size: 13px; line-height: 18px; }
    .stuck[hidden] { display: none; }
    button { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px; border-radius: 6px; border: 1px solid color-mix(in srgb, var(--button-text) 17%, transparent); background: var(--button); color: var(--button-text); font: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
    button:hover { background: var(--button-hover); }
    button:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--ring); }
    button svg { color: var(--muted); }
  </style>
</head>
<body>
${body}
  <script>
    (function poll() {
      setTimeout(async () => {
        try {
          if ((await fetch(location.href, { cache: 'no-store' })).ok) {
            location.reload();
            return;
          }
        } catch (e) {
          // the server is restarting
        }
        poll();
      }, ${POLL_INTERVAL_MS});
    })();
  </script>
</body>
</html>`;
}

// shown only with hotReload, while the Vite dev server is starting
export function renderViteStartingPage(adminforth: IAdminForth) {
  return renderPage(adminforth, 'Starting Vite…', `
  <div class="banner" role="note">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
    Only developers see this page
  </div>
  <main>
    <div class="column">
      <h1>Starting Vite…</h1>
      <ol class="steps">
        <li><svg class="done" viewBox="0 0 24 24" role="img" aria-label="Done"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>Server</li>
        <li><span class="spinner" role="img" aria-label="In progress"></span>Vite dev server</li>
        <li class="waiting"><svg viewBox="0 0 24 24" role="img" aria-label="Waiting"><circle cx="12" cy="12" r="10"/></svg>Admin panel</li>
      </ol>
      <div class="stuck" id="stuck" hidden>
        <p class="muted">Taking long? Check the terminal for Vite errors.</p>
        <button type="button" onclick="location.reload()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          Reload now
        </button>
      </div>
    </div>
  </main>
  <script>
    setTimeout(() => { document.getElementById('stuck').hidden = false; }, ${STUCK_HINT_DELAY_MS});
  </script>`);
}

// shown to everyone without hotReload, while the SPA bundle is not built yet
export function renderSpaBuildingPage(adminforth: IAdminForth) {
  const { brandName } = adminforth.config.customization;
  return renderPage(adminforth, brandName, `
  <main>
    <div class="column centered">
      <span class="spinner large" role="img" aria-label="Loading"></span>
      <div class="heading">
        <h1>${brandName} is starting up</h1>
        <p class="muted">This takes a moment. The page refreshes by itself.</p>
      </div>
    </div>
  </main>`);
}
