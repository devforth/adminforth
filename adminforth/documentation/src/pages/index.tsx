import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

const YOUTUBE_VIDEO_EMBED_URL = 'https://www.youtube-nocookie.com/embed/4tB8uzY__uk';
const HOME_TITLE = 'Agent-first open-source admin panel framework';
const HOME_DESCRIPTION = 'Build robust and powerful agentic back-office panels for your projects while maintaining full control over the code. AdminForth is a flexible, modern foundation for developer-owned back-end management systems.';
const HOME_SUMMARY = 'You can use AdminForth to build robust and powerful agentic back-office panels for your projects while maintaining full control over the code. It is designed for developers who need a flexible, modern foundation for back-end management systems.';
const SCREENSHOT_PATH = '/img/adminforth_screenshot.png';
const OG_IMAGE_PATH = '/img/og.jpg';
const MCP_SHOT = require('@site/static/img/previews/mcp.png').default;
const HERO_SUBTITLE = 'A back-office framework for the two people who already work with agents: the developer, who lets Claude Code or Codex write the panel, and the admin, who lets an agent work inside it. Same repo, same database, same permissions.';
const FEATURE_LIST = [
  'Connect to existing Postgres, MySQL, SQLite, or MongoDB data, provide an OpenAI or Anthropic API key, and start using the internal agent in natural language with npx adminforth create-app.',
  'Ships assets for coding agents like Claude, Codex, Copilot, and Antigravity, including AGENTS.md, CLAUDE.md, llms.txt, and skills.',
  'Always open-source and free.',
  'Built with Tailwind CSS and fully extendable with Vue and TypeScript.',
  'Premade RFC and OWASP-compatible plugins for TOTP, passkeys, third-party auth providers, and audit logs.',
  'Rich component library for custom admin controls and pages.',
];

const FEATURED_ON = [
  {
    href: 'https://auraplusplus.com/projects/adminforth-agent-first-open-source-admin-panel-framework',
    src: 'https://auraplusplus.com/images/badges/featured-on-light.svg',
    alt: 'Featured on Aura++',
    rel: 'noopener',
  },
  {
    href: 'https://peerpush.net/p/adminforth',
    src: 'https://peerpush.net/p/adminforth/badge.png',
    alt: 'AdminForth on PeerPush',
    rel: 'noopener',
  },
  {
    href: 'https://openhunts.com',
    src: 'https://cdn.openhunts.com/badges/club.webp',
    alt: 'OpenHunts Club Member',
    rel: 'noopener',
  },
  {
    href: 'https://toolfio.com',
    src: 'https://toolfio.com/toolfio-light-badge.png',
    alt: 'Featured on Toolfio',
    rel: 'dofollow',
  },
  {
    href: 'https://earlyhunt.com/project/adminforth',
    src: 'https://earlyhunt.com/badges/earlyhunt-badge-light.svg',
    alt: 'Featured on EarlyHunt',
    rel: 'noopener',
  },
  {
    href: 'https://www.producthunt.com/products/adminforth/reviews/new?utm_source=badge-product_review&utm_medium=badge&utm_source=badge-adminforth',
    src: 'https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=598095&theme=light',
    alt: 'AdminForth on Product Hunt',
    rel: 'noopener noreferrer',
  },
];

type PluginItem = {name: string; slug: string; description: string; standard?: string};
type PluginGroup = {title: string; items: PluginItem[]};

const images = [
  {
    original: require('@site/static/img/previews/login_form.png').default,
    title: 'Authentication and Authorization',
    link: '/docs/tutorial/gettingStarted',
    description: 'OWASP-Compliant Sign-In done for you'
  },
  {
    original: require('@site/static/img/previews/sso.png').default,
    title: 'OAuth2/OpenID SSO Plugin - one click login',
    link: '/docs/tutorial/Plugins/oauth/',
    description: 'RFC 6749 SSO plugin with premade Google, Github, Facebook, Keycloak, Microsoft or any custom OAuth2 adapter'
  },
  {
    original: require('@site/static/img/previews/2fa_plugin.png').default,
    title: '2FA Plugin - secure your admin panel',
    link: '/docs/tutorial/Plugins/two-factors-auth/',
    description: 'RFC 6238-Compliant TOTP-Based & WebAuthn PassKeys 2FA will add additional security layer (login and preferred actions)'
  },
  {
    original: require('@site/static/img/previews/branding.png').default,
    title: 'Branding and theming',
    link: '/docs/tutorial/Customization/branding/',
    description: 'Upload your logo, change colors, update titles, make the look to match your brand'
  },
  {
    original: require('@site/static/img/previews/dashboard.png').default,
    title: 'Custom Pages and Dashboards',
    link: '/docs/tutorial/Customization/customPages/',
    description: 'Create your own pages and dashboards with Vue3 components. Add any additional npm packages and extend your admin panel as you like'
  },
  {
    original: require('@site/static/img/previews/users_management.png').default,
    title: 'Users management',
    link: '/docs/tutorial/gettingStarted',
    description: 'Manage users and roles with ease, extend as you like'
  },
  {
    original: require('@site/static/img/previews/translate.png').default,
    title: 'LLM-based Translation Plugin - translate your admin and External apps',
    link: '/docs/tutorial/Plugins/i18n/',
    description: 'Use LLMs to translate any external apps (Mobile, Nuxt, etc.) OR/AND admin panel with minimal effort. Any language supported'
  },
  {
    original: require('@site/static/img/previews/auditlog.png').default,
    title: 'Audit log Plugin - know who did what',
    link: '/docs/tutorial/Plugins/audit-log/',
    description: 'Attach Audit log plugin with couple of lines, create table for logs and track full history of any data changes'
  },
  {
    original: require('@site/static/img/previews/ai_complete.png').default,
    title: 'AI autocomplete Plugin - write with LLMs',
    link: '/docs/tutorial/Plugins/text-complete/',
    description: 'Provide your LLM API key to autocomplete plugin and AI will help you to write your content using record context'
  },
  {
    original: require('@site/static/img/previews/dark.png').default,
    title: 'Dark mode out of the box',
    link: '/docs/tutorial/gettingStarted',
    description: 'Dark mode is enabled by default, create your own components in Tailwind-way and it will work with no additional friction'
  },
  {
    original: require('@site/static/img/previews/upload.png').default,
    title: 'Upload Plugin - upload files',
    link: '/docs/tutorial/Plugins/upload/',
    description: 'Upload files to Amazon S3 with instantiating plugin and providing your S3 credentials' 
  },
  
  {
    original: require('@site/static/img/previews/filters.png').default,
    title: 'Filters to query your data',
    link: '/docs/tutorial/Customization/virtualColumns/#virtual-columns-for-filtering',
    description: 'AdminForth provides basic filters out of the box and allows you to create your own'
  },
  {
    original: require('@site/static/img/previews/richeditor.png').default,
    title: 'Rich Editor Plugin - WYSIWYG',
    link: '/docs/tutorial/Plugins/rich-editor/',
    description: 'Attach Rich Editor plugin to your text fields and get WYSIWYG editor for your content'
  },
  {
    original: require('@site/static/img/previews/inplace-edit.png').default,
    title: 'List in-place edit Plugin for quick edit', 
    link: '/docs/tutorial/Plugins/list-in-place-edit/',
    description: 'Edit some oftenly used fields in list directly without opening edit page. Decide which fields to be editable in list view'
  },
  {
    original: require('@site/static/img/previews/inplace-create.png').default,
    title: 'Inline create Plugin for quick create',
    link: '/docs/tutorial/Plugins/inline-create/',
    description: 'For tables with small fields number which should be created massively, use inline create plugin to create records directly in list view'
  },
  {
    original: require('@site/static/img/previews/importexport.png').default,
    title: 'Import/Export CSV Plugin',
    link: '/docs/tutorial/Plugins/import-export/',
    description: 'Export tables to CSV and import from CSV with one click. Move data between environments easily'
  },
  {
    original: require('@site/static/img/previews/bulk-ai-flow.png').default,
    title: 'Bulk AI Plugin - generate data for your resources',
    link: '/docs/tutorial/Plugins/bulk-ai-flow/',
    description: 'Use LLMs to fill records with generated data or images. For example, generate product descriptions based on product name and image or generate products images'
  },
  {
    original: require('@site/static/img/previews/quick-filters.png').default,
    title: 'Quick Filters Plugin - filter your data quickly',
    link: '/docs/tutorial/Plugins/quick-filters/',
    description: 'Use quick filters to filter your data efficiently. Create custom filters and apply them with a single click'
  },
  {
    original: require('@site/static/img/previews/background-jobs1.png').default,
    title: 'Background Jobs Plugin - manage your background tasks',
    link: '/docs/tutorial/Plugins/background-jobs/',
    description: 'Use background jobs to handle long-running tasks efficiently. Schedule, monitor, and manage your background processes with ease even after server restarts'
  },
  {
    original: require('@site/static/img/previews/agent.png').default,
    title: 'Agent Plugin - give AI any task and let it handle it',
    link: '/docs/tutorial/Plugins/agent/',
    description: 'Provides an internal agent that can perform various tasks based on natural language instructions. Connect it to your data and let it help you with content generation, data management, or any custom use case you can think of'
  },
  {
    original: require('@site/static/img/previews/mcp.png').default,
    title: 'MCP Server Plugin - plug your admin into coding agents',
    link: '/docs/tutorial/Plugins/mcp/',
    description: 'Expose AdminForth resources and actions as remote MCP tools for Claude Code, OpenAI Codex, Gemini CLI and any other MCP client. Every call runs as the AdminForth user who created the auth secret, so your resource permissions, validation and hooks still apply'
  },
  {
    original: require('@site/static/img/previews/dashboards-plugin.png').default,
    title: 'Dashboard Plugin - creare custom dashboards from web interface',
    link: '/docs/tutorial/Plugins/dashboard/',
    description: 'Provides a customizable dashboard plugin that allows you to create and manage dashboards for your data. Connect it to your resources and visualize your data in a meaningful way'
  },
];

const AGENT_SURFACES = [
  {
    who: 'Developers who use agents',
    title: 'Your coding agent already knows this repo',
    body: 'Every generated app ships the files agents look for, and the config is a plain declarative object \u2014 so Claude Code, Codex, Gemini or Copilot can add a resource, a column or a plugin without being re-taught the project each session.',
    chips: ['AGENTS.md', 'CLAUDE.md', 'llms.txt', 'skills/'],
    points: [],
    link: {label: 'Read the getting started guide', to: '/docs/tutorial/gettingStarted'},
  },
  {
    who: 'Admins who use agents',
    title: 'The panel is also a data surface',
    body: 'Turn the same resources into tools an agent can call, so an operator can ask for the data instead of paging through it \u2014 and change it without a developer in the loop.',
    chips: [],
    points: [
      'Read, filter and write the records your team sees',
      'Runs as the user who issued the secret \u2014 permissions, validation and hooks apply',
      'One secret per agent, revocable on its own',
    ],
    link: {label: 'Read the MCP docs', to: '/docs/tutorial/Plugins/mcp/'},
  },
];

const PLUGIN_GROUPS: PluginGroup[] = [
  {
    title: 'For the agent',
    items: [
      {name: 'MCP server', slug: 'mcp', description: 'Your resources as remote MCP tools, one revocable secret per agent', standard: 'Model Context Protocol'},
      {name: 'AI agent', slug: 'agent', description: 'Chat inside the panel that searches and edits data, with skills you define'},
      {name: 'Bulk AI flow', slug: 'bulk-ai-flow', description: 'Fill, classify or read images across every selected record'},
      {name: 'Text complete', slug: 'text-complete', description: 'Inline completion while an editor types'},
      {name: 'LLM translation', slug: 'i18n', description: 'Translate the panel \u2014 and your own app \u2014 from the same catalogue'},
      {name: 'Dashboards', slug: 'dashboard', description: 'Charts you build by asking the agent for them'},
    ],
  },
  {
    title: 'Auth & access',
    items: [
      {name: 'OAuth2 & SSO', slug: 'oauth', description: 'Google, GitHub, Microsoft, Keycloak, Clerk, Twitch, Facebook, Telegram', standard: 'RFC 6749'},
      {name: 'Two-factor auth', slug: 'two-factors-auth', description: 'Authenticator apps and hardware-backed passkeys', standard: 'RFC 6238 \u00b7 WebAuthn'},
      {name: 'User sessions', slug: 'user-sessions', description: 'Every signed-in device listed and revocable, and logout that really ends the session'},
      {name: 'Login captcha', slug: 'login-captcha', description: 'reCAPTCHA or Cloudflare Turnstile in front of the login form'},
      {name: 'Email invite', slug: 'email-invite', description: 'Create a user without ever knowing their password'},
      {name: 'Password reset', slug: 'email-password-reset', description: 'Reset links signed as tokens, over SES or Mailgun', standard: 'RFC 7519'},
      {name: 'Open signup', slug: 'open-signup', description: 'Let people register themselves into a low-privilege role'},
      {name: 'User soft delete', slug: 'user-soft-delete', description: 'Deactivate an account and keep everything it did'},
    ],
  },
  {
    title: 'Fields & editing',
    items: [
      {name: 'Rich editor', slug: 'rich-editor', description: 'Quill WYSIWYG on any text column'},
      {name: 'Markdown', slug: 'markdown', description: 'Author and preview Markdown, stored as Markdown'},
      {name: 'JSON form', slug: 'json-form', description: 'A real form for a JSON column, generated from your schema', standard: 'JSON Schema'},
      {name: 'Uploads', slug: 'upload', description: 'S3, S3-compatible or local storage under your own keys', standard: 'S3 API'},
      {name: 'Inline create', slug: 'inline-create', description: 'Add a row without leaving the list'},
      {name: 'List in-place edit', slug: 'list-in-place-edit', description: 'Edit cells where you read them'},
      {name: 'Clone row', slug: 'clone-row', description: 'Duplicate a record into a prefilled form'},
      {name: 'Many-to-many', slug: 'many2many', description: 'Link tables managed as one ordinary field'},
      {name: 'Foreign inline list', slug: 'foreign-inline-list', description: 'Related rows as a table inside the show page'},
      {name: 'Foreign inline show', slug: 'foreign-inline-show', description: 'The linked record itself, expanded in place'},
    ],
  },
  {
    title: 'Data & operations',
    items: [
      {name: 'Import / export', slug: 'import-export', description: 'CSV and XLSX in and out, on any resource', standard: 'RFC 4180'},
      {name: 'Background jobs', slug: 'background-jobs', description: 'Durable work that resumes after a restart'},
      {name: 'Audit log', slug: 'audit-log', description: 'Every change, by whom, from where'},
      {name: 'Quick filters', slug: 'quick-filters', description: 'Preset filters and search pinned to the list'},
      {name: 'Auto remove', slug: 'auto-remove', description: 'Retention rules by age or by row count'},
      {name: 'Universal search', slug: 'universal-search', description: 'Legacy multi-column search \u2014 prefer Quick filters'},
    ],
  },
];

const PLUGIN_COUNT = PLUGIN_GROUPS.reduce((sum, group) => sum + group.items.length, 0);

function Terminal({note}: {note?: string}): JSX.Element {
  return (
    <div className={styles.term}>
      <div className={styles.termBar}><i /><i /><i /></div>
      <div className={styles.termBody}>
        <p className={styles.termLine}>
          <span className={styles.termPrompt}>$</span>
          <span>npx adminforth create-app</span>
        </p>
        {note && (
          <p className={styles.termLine}>
            <em className={styles.termNote}>{note}</em>
          </p>
        )}
      </div>
    </div>
  );
}

function BrandMark(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8.034 6.006V13H6.097V12.194C5.59433 12.8007 4.86633 13.104 3.913 13.104C3.25433 13.104 2.65633 12.9567 2.119 12.662C1.59033 12.3673 1.17433 11.947 0.871 11.401C0.567667 10.855 0.416 10.2223 0.416 9.503C0.416 8.78367 0.567667 8.151 0.871 7.605C1.17433 7.059 1.59033 6.63867 2.119 6.344C2.65633 6.04933 3.25433 5.902 3.913 5.902C4.80567 5.902 5.50333 6.18367 6.006 6.747V6.006H8.034ZM4.264 11.44C4.77533 11.44 5.2 11.2667 5.538 10.92C5.876 10.5647 6.045 10.0923 6.045 9.503C6.045 8.91367 5.876 8.44567 5.538 8.099C5.2 7.74367 4.77533 7.566 4.264 7.566C3.744 7.566 3.315 7.74367 2.977 8.099C2.639 8.44567 2.47 8.91367 2.47 9.503C2.47 10.0923 2.639 10.5647 2.977 10.92C3.315 11.2667 3.744 11.44 4.264 11.44Z"
        fill="currentColor"
      />
      <path
        d="M13.317 5.538C12.589 5.538 12.0387 5.69833 11.666 6.019C11.2933 6.331 11.107 6.80333 11.107 7.436V7.995H14.851V9.685H11.107V13H9.001V7.449C9.001 6.279 9.365 5.369 10.093 4.719C10.8297 4.069 11.8567 3.744 13.174 3.744C13.694 3.744 14.1837 3.80033 14.643 3.913C15.1023 4.017 15.501 4.173 15.839 4.381L15.189 6.045C14.669 5.707 14.045 5.538 13.317 5.538Z"
        fill="var(--signal)"
      />
    </svg>
  );
}

const PANEL_ROWS = [
  {email: 'alice@acme.io', role: 'Admin', status: 'Active', tone: 'ok'},
  {email: 'b.novak@acme.io', role: 'Editor', status: 'Active', tone: 'ok'},
  {email: 'carol@vendor.co', role: 'Viewer', status: 'Invited', tone: 'warn'},
  {email: 'd.ross@acme.io', role: 'Editor', status: 'Suspended', tone: 'off'},
];

const PILL_TONE = {ok: styles.pillOk, warn: styles.pillWarn, off: styles.pillOff};

function PanelPreview(): JSX.Element {
  return (
    <div className={styles.panel}>
      <div className={styles.panelBar}>
        <span className={styles.tl} />
        <span className={styles.tl} />
        <span className={styles.tl} />
        <span className={styles.panelUrl}>localhost:3000/resource/users</span>
      </div>
      <div className={styles.panelBody}>
        <aside className={styles.panelSide}>
          <div className={styles.sideBrand}><BrandMark />AdminForth</div>
          <nav>
            <a className={styles.on} href="#users">Users</a>
            <a href="#users">Orders</a>
            <a href="#users">Products</a>
            <a href="#users">Audit log</a>
          </nav>
        </aside>
        <div>
          <div className={styles.panelHead}>
            <b>Users</b>
            <span className={styles.count}>1 284 records</span>
            <span className={styles.mini}>+ Create</span>
          </div>
          <div className={styles.scroll}>
            <table>
              <thead>
                <tr><th>Email</th><th>Role</th><th>Status</th></tr>
              </thead>
              <tbody>
                {PANEL_ROWS.map((row) => (
                  <tr key={row.email}>
                    <td>{row.email}</td>
                    <td>{row.role}</td>
                    <td><span className={`${styles.pill} ${PILL_TONE[row.tone]}`}>{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero(): JSX.Element {
  return (
    <header className={styles.hero}>
      <div className={`${styles.wrap} ${styles.heroGrid}`}>
        <div>
          <span className={styles.eyebrow}>Open source &middot; MIT &middot; Self-hosted</span>
          <Heading as="h1" className={styles.heroTitle}>
            The back-office agents <em className={styles.accent}>build</em>, and agents{' '}
            <em className={styles.accent}>run</em>.
          </Heading>
          <p className={styles.heroLede}>{HERO_SUBTITLE}</p>
          <div className={styles.cta}>
            <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/docs/tutorial/gettingStarted">
              Get started
            </Link>
            <Link className={`${styles.btn} ${styles.btnGhost}`} to="https://demo.adminforth.dev/">
              Open live demo
            </Link>
          </div>
          <Terminal note="# Postgres &middot; MySQL &middot; SQLite &middot; Mongo" />
        </div>
        <PanelPreview />
      </div>
    </header>
  );
}

function Section({
  eyebrow,
  note,
  children,
}: {
  eyebrow: string;
  note: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <section className={styles.sec}>
      <div className={`${styles.wrap} ${styles.secGrid}`}>
        <div className={styles.secLabel}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <p>{note}</p>
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

function AgentSurfaces(): JSX.Element {
  return (
    <Section eyebrow="Two sides" note="One panel, written with agents and then worked by them.">
      <Heading as="h2" className={styles.h2}>Developers use agents. So do admins.</Heading>
      <p className={styles.lede}>
        Most back-office tools are built for one of the two and leave the other clicking.
        AdminForth treats both as the normal case, and gives each a first-class surface.
      </p>
      <div className={styles.dual}>
        {AGENT_SURFACES.map((surface) => (
          <div className={styles.dcard} key={surface.who}>
            <span className={styles.who}>{surface.who}</span>
            <Heading as="h3" className={styles.h3}>{surface.title}</Heading>
            <p>{surface.body}</p>
            {surface.chips.length > 0 && (
              <ul className={styles.files}>
                {surface.chips.map((chip) => <li key={chip}>{chip}</li>)}
              </ul>
            )}
            {surface.points.length > 0 && (
              <ul className={styles.plain}>
                {surface.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
            )}
            <Link className={styles.link} to={surface.link.to}>{surface.link.label}</Link>
          </div>
        ))}
      </div>
      <div className={styles.mcp}>
        <div className={styles.mcpText}>
          <span className={styles.flag}>New plugin</span>
          <Heading as="h3" className={styles.h3}>MCP Server</Heading>
          <p>
            Let your agent work the data in your panel &mdash; read it, clean it up, write it back.
            An agent is just another frontend for the same data: the same hooks, the same
            permissions, the same audit log.
          </p>
          <Link className={styles.link} to="/docs/tutorial/Plugins/mcp/">Read the MCP docs</Link>
        </div>
        <div className={styles.mcpImage}>
          <div
            className={styles.mcpShot}
            role="img"
            aria-label="AdminForth MCP server connected to Claude Code, OpenAI Codex and Gemini CLI"
            style={{backgroundImage: `url(${MCP_SHOT})`}}
          />
        </div>
      </div>
    </Section>
  );
}

function HowItWorks(): JSX.Element {
  return (
    <Section eyebrow="How it works" note="Three steps, in order. No scaffolding to maintain after.">
      <Heading as="h2" className={styles.h2}>Declare the resource. Keep the code.</Heading>
      <p className={styles.lede}>
        AdminForth reads the schema you already have &mdash; nothing is copied or locked into a
        proprietary format. The panel is an ordinary Node app in your repo, which is also why an
        agent can edit it and a reviewer can read the diff.
      </p>
      <pre className={styles.code}>{`{
  `}<span className={styles.k}>dataSource</span>{`: `}<span className={styles.s}>'maindb'</span>{`,
  `}<span className={styles.k}>table</span>{`: `}<span className={styles.s}>'users'</span>{`,
  `}<span className={styles.k}>resourceId</span>{`: `}<span className={styles.s}>'users'</span>{`,
  `}<span className={styles.k}>columns</span>{`: [
    { `}<span className={styles.k}>name</span>{`: `}<span className={styles.s}>'id'</span>{`, `}<span className={styles.k}>primaryKey</span>{`: true, `}<span className={styles.k}>showIn</span>{`: { `}<span className={styles.k}>list</span>{`: false } },
    { `}<span className={styles.k}>name</span>{`: `}<span className={styles.s}>'email'</span>{`, `}<span className={styles.k}>required</span>{`: true, `}<span className={styles.k}>isUnique</span>{`: true },
    { `}<span className={styles.k}>name</span>{`: `}<span className={styles.s}>'role'</span>{`, `}<span className={styles.k}>enum</span>{`: [
      { `}<span className={styles.k}>value</span>{`: `}<span className={styles.s}>'admin'</span>{`,  `}<span className={styles.k}>label</span>{`: `}<span className={styles.s}>'Admin'</span>{`  },
      { `}<span className={styles.k}>value</span>{`: `}<span className={styles.s}>'editor'</span>{`, `}<span className={styles.k}>label</span>{`: `}<span className={styles.s}>'Editor'</span>{` },
    ] },                                `}<span className={styles.c}>{`// renders as a select`}</span>{`
    { `}<span className={styles.k}>name</span>{`: `}<span className={styles.s}>'created_at'</span>{`, `}<span className={styles.k}>showIn</span>{`: { `}<span className={styles.k}>create</span>{`: false } },
  ],
}`}</pre>
    </Section>
  );
}

function Watch(): JSX.Element {
  return (
    <Section eyebrow="Watch" note="Six minutes, from an empty folder to a working panel.">
      <Heading as="h2" className={styles.h2}>See it built once.</Heading>
      <p className={styles.lede}>
        An existing database, one command, and the agent taking it from there.
      </p>
      <div className={styles.panel}>
        <div className={styles.panelBar}>
          <span className={styles.tl} />
          <span className={styles.tl} />
          <span className={styles.tl} />
          <span className={styles.panelUrl}>youtube.com &middot; AdminForth overview</span>
        </div>
        <iframe
          className={styles.videoFrame}
          src={YOUTUBE_VIDEO_EMBED_URL}
          title="AdminForth overview video"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </Section>
  );
}

function Gallery(): JSX.Element {
  return (
    <Section eyebrow="In the panel" note="What ships, and what a plugin adds on top.">
      <Heading as="h2" className={styles.h2}>What it can do for you.</Heading>
      <p className={styles.lede}>
        Every screen below is the stock interface or a plugin you enable with a line of config.
      </p>
      <div className={styles.gallery}>
        {images.map((item, index) => (
          <div className={styles.gcard} key={`feature${index}`}>
            <img src={item.original} alt={item.title} title={item.title} loading="lazy" />
            <div className={styles.gcardBody}>
              <Heading as="h3" className={styles.gcardTitle}>{item.title}</Heading>
              <p>{item.description}</p>
              <Link className={styles.link} to={item.link}>Learn how</Link>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PluginCatalogue(): JSX.Element {
  return (
    <Section
      eyebrow="Plugins"
      note={`${PLUGIN_COUNT} of them, installed as npm packages. Open protocols where a protocol exists.`}
    >
      <Heading as="h2" className={styles.h2}>The parts you would otherwise write twice.</Heading>
      <p className={styles.lede}>
        Each one is a line of config and a package &mdash; and each is documented well enough that
        an agent can install it for you.
      </p>
      <div className={styles.groups}>
        {PLUGIN_GROUPS.map((group) => (
          <div className={styles.group} key={group.title}>
            <h3 className={styles.groupTitle}>{group.title}</h3>
            <ul>
              {group.items.map((item) => (
                <li key={item.slug}>
                  <Link to={`/docs/tutorial/Plugins/${item.slug}/`}>{item.name}</Link>
                  <span className={styles.pluginDesc}>{item.description}</span>
                  {item.standard && <span className={styles.rfc}>{item.standard}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Closing(): JSX.Element {
  return (
    <section className={styles.close}>
      <div className={styles.wrap}>
        <span className={styles.eyebrow}>Free, and staying that way</span>
        <Heading as="h2" className={styles.h2} style={{marginTop: '12px'}}>
          One command for the developer. One secret for the admin.
        </Heading>
        <Terminal />
        <div className={styles.closeCta}>
          <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/docs/tutorial/gettingStarted">
            Read the guide
          </Link>
          <Link className={`${styles.btn} ${styles.btnGhost}`} to="https://github.com/devforth/adminforth">
            Star on GitHub
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeaturedOn(): JSX.Element {
  return (
    <section className={styles.featured}>
      <div className={styles.wrap}>
        <span className={styles.eyebrow}>Featured on</span>
        <div className={styles.featuredBadges}>
          {FEATURED_ON.map((badge) => (
            <a
              key={badge.href}
              href={badge.href}
              target="_blank"
              rel={badge.rel}
              className={styles.featuredLink}
            >
              <img className={styles.featuredBadgeImage} src={badge.src} alt={badge.alt} loading="lazy" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  const siteUrl = siteConfig.url.replace(/\/$/, '');
  const screenshotUrl = `${siteUrl}${SCREENSHOT_PATH}`;
  const ogImageUrl = `${siteUrl}${OG_IMAGE_PATH}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'AdminForth',
        alternateName: HOME_TITLE,
        url: `${siteUrl}/`,
        description: HOME_SUMMARY,
        image: ogImageUrl,
      },
      {
        '@type': 'SoftwareApplication',
        name: 'AdminForth',
        alternateName: HOME_TITLE,
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'Admin panel framework',
        operatingSystem: 'Web browser',
        url: `${siteUrl}/`,
        image: ogImageUrl,
        screenshot: screenshotUrl,
        description: HOME_SUMMARY,
        isAccessibleForFree: true,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: FEATURE_LIST,
        sameAs: [
          'https://github.com/devforth/adminforth',
          'https://demo.adminforth.dev/',
        ],
      },
    ],
    dateModified: new Date().toISOString(),
  };

  return (
    <Layout title={HOME_TITLE} description={HOME_DESCRIPTION}>
      <Head>
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="AdminForth" />
        <meta property="og:image:alt" content="AdminForth social card" />
        <meta name="twitter:title" content={HOME_TITLE} />
        <meta name="twitter:description" content={HOME_DESCRIPTION} />
        <meta name="twitter:image:alt" content="AdminForth social card" />
        <meta name="twitter:label1" content="License" />
        <meta name="twitter:data1" content="Open source and free" />
        <meta name="twitter:label2" content="Stack" />
        <meta name="twitter:data2" content="Tailwind, Vue, TypeScript" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Head>
      <div className={styles.landing}>
        <Hero />
        <main>
          <AgentSurfaces />
          <HowItWorks />
          <Watch />
          <Gallery />
          <PluginCatalogue />
          <Closing />
          <FeaturedOn />
        </main>
      </div>
    </Layout>
  );
}
