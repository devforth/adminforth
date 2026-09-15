import clsx from 'clsx';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import styles from './index.module.css';

const LIVE_DEMO_IFRAME_URL = `https://demo.adminforth.dev/overview?autologin=${encodeURIComponent('demo@adminfoth.dev:demo')}&embedZoom=0.7`;
const YOUTUBE_VIDEO_EMBED_URL = 'https://www.youtube-nocookie.com/embed/4tB8uzY__uk';
const HOME_TITLE = 'Agent-first open-source admin panel framework';
const HERO_TITLE_PARTS = ['The back-office agents ', 'build', ', and agents ', 'run', '.'];
const HERO_SUBTITLE = 'A back-office framework for the two people who already work with agents: the developer, who lets Claude Code or Codex write the panel, and the admin, who lets an agent work inside it. Same repo, same database, same permissions.';
const HOME_DESCRIPTION = 'Build robust and powerful agentic back-office panels for your projects while maintaining full control over the code. AdminForth is a flexible, modern foundation for developer-owned back-end management systems.';
const HOME_SUMMARY = 'You can use AdminForth to build robust and powerful agentic back-office panels for your projects while maintaining full control over the code. It is designed for developers who need a flexible, modern foundation for back-end management systems.';
const SCREENSHOT_PATH = '/img/adminforth_screenshot.png';
const OG_IMAGE_PATH = '/img/og.jpg';
const FEATURE_LIST = [
  'Connect to existing Postgres, MySQL, SQLite, or MongoDB data, provide an OpenAI or Anthropic API key, and start using the internal agent in natural language with npx adminforth create-app.',
  'Ships assets for coding agents like Claude, Codex, Copilot, and Antigravity, including AGENTS.md, CLAUDE.md, llms.txt, and skills.',
  'Always open-source and free.',
  'Built with Tailwind CSS and fully extendable with Vue and TypeScript.',
  'Premade RFC and OWASP-compatible plugins for TOTP, passkeys, third-party auth providers, and audit logs.',
  'Rich component library for custom admin controls and pages.',
];


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


type PluginItem = {name: string; slug: string; description: string; standard?: string};
type PluginGroup = {title: string; items: PluginItem[]};

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

function AgentSurfaces(): JSX.Element {
  return (
    <section className={styles.agentSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          Developers use agents. So do admins.
        </Heading>
        <p className={styles.sectionLede}>
          Most back-office tools are built for one of the two and leave the other clicking.
          AdminForth treats both as the normal case, and gives each a first-class surface.
        </p>
        <div className={styles.agentGrid}>
          {AGENT_SURFACES.map((surface) => (
            <div className={styles.agentCard} key={surface.who}>
              <span className={styles.agentWho}>{surface.who}</span>
              <Heading as="h3" className={styles.agentCardTitle}>{surface.title}</Heading>
              <p className={styles.agentCardBody}>{surface.body}</p>
              {surface.chips.length > 0 && (
                <ul className={styles.fileChips}>
                  {surface.chips.map((chip) => <li key={chip}>{chip}</li>)}
                </ul>
              )}
              {surface.points.length > 0 && (
                <ul className={styles.arrowList}>
                  {surface.points.map((point) => <li key={point}>{point}</li>)}
                </ul>
              )}
              <Link className={styles.agentLink} to={surface.link.to}>{surface.link.label}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PluginCatalogue(): JSX.Element {
  return (
    <section className={styles.pluginSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          The parts you would otherwise write twice
        </Heading>
        <p className={styles.sectionLede}>
          {PLUGIN_COUNT} plugins, installed as npm packages. Open protocols where a protocol
          exists, and each one documented well enough that an agent can install it for you.
        </p>
        <div className={styles.pluginGroups}>
          {PLUGIN_GROUPS.map((group) => (
            <div className={styles.pluginGroup} key={group.title}>
              <h3 className={styles.pluginGroupTitle}>{group.title}</h3>
              <ul className={styles.pluginList}>
                {group.items.map((item) => (
                  <li key={item.slug}>
                    <Link to={`/docs/tutorial/Plugins/${item.slug}/`}>{item.name}</Link>
                    <span className={styles.pluginDescription}>{item.description}</span>
                    {item.standard && <span className={styles.pluginStandard}>{item.standard}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();

  return (
    <>
      <header className={clsx('hero', styles.heroBanner)}>
        <div className="container" >
          <Heading as="h1" className={clsx('hero__title', styles.heroBannerTitle)} >
            {HERO_TITLE_PARTS[0]}
            <span className={styles.heroAccent}>{HERO_TITLE_PARTS[1]}</span>
            {HERO_TITLE_PARTS[2]}
            <span className={styles.heroAccent}>{HERO_TITLE_PARTS[3]}</span>
            {HERO_TITLE_PARTS[4]}
          </Heading>
          <p className={clsx('hero__subtitle', styles.heroSubtitle)}>{HERO_SUBTITLE}</p>

          <div className="heroRow">
            <div className={styles.buttons}>
              <Link
                className="button button--secondary button--outline button--lg"
                to="/docs/tutorial/gettingStarted">
                Get started
              </Link>

              <Link
                className="button button--primary button--lg"
                to="https://demo.adminforth.dev/">
                Live Demo
              </Link>
            </div>

            <div className='terminalWrapper'>
              <div className="fakeMenu">
                <div className="fakeButtons fakeClose"></div>
                <div className="fakeButtons fakeMinimize"></div>
                <div className="fakeButtons fakeZoom"></div>
              </div>
              <div className="fakeScreen">
                <p className="line1"><span
                  style={{userSelect: 'none', opacity:0.6 }}
                >$&nbsp;</span><span style={{ opacity:0.9 }}>npx adminforth create-app</span></p>
                <p className={clsx('line1', styles.terminalComment)}>
                  # Postgres &middot; MySQL &middot; SQLite &middot; Mongo
                </p>
              </div>
            </div>
          </div>

        </div>
      </header>


        <div className="laptop_container">
          <div className="laptop">
            <div className="laptop__screen">
              <iframe
                className={styles.demoFrame}
                src={LIVE_DEMO_IFRAME_URL}
                title="AdminForth live demo"
              />
            </div>
            <div className="laptop__bottom">
              <div className="laptop__under"></div>
            </div>
            <div className="laptop__shadow"></div>
          </div>
        </div>

    </>
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
    <Layout
      title={HOME_TITLE}
      description={HOME_DESCRIPTION}>
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
      <HomepageHeader />
      <main>

        <AgentSurfaces />

        <div className={styles.videoSection}>
          <div className={styles.videoWrapper}>
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
        </div>


      <Heading as="h2" className="hero__title text--center">
        What it can do for you
      </Heading>

        <div className={styles.cardsWrapper}>
          {images.map((item, index) => (
            <div className="card-demo" key={`feature${index}`}>
              <div className="card shadow--md" style={{
                      maxWidth: '500px',
                      height: '100%'
                    }}> 
                <div className="card__image">
                  <img
                    src={item.original}
                    alt={item.title}
                    title={item.title}
                    
                  />
                </div>
                <div className="card__body">
                  <h3>{item.title}</h3>
                  {
                    item.description ?
                    <small>
                      {item.description}
                    </small> :
                    <small></small>
                  }
                </div>
                <div className="card__footer">
                  <a className="button button--primary button--block"
                    href={item.link}
                  >Learn how</a>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <PluginCatalogue />

        <HomepageFeatures />

        <section className={styles.featuredOnSection}>
          <div className="container">
            <Heading as="h2" className={styles.featuredOnTitle}>
              Featured on
            </Heading>
            <div className={styles.featuredOnBadges}>
              <a
                href="https://auraplusplus.com/projects/adminforth-agent-first-open-source-admin-panel-framework"
                target="_blank"
                rel="noopener"
                className={styles.featuredOnLink}
              >
                <img
                  className={styles.featuredOnBadgeImage}
                  src="https://auraplusplus.com/images/badges/featured-on-light.svg"
                  alt="Featured on Aura++"
                  width="265"
                  height="58"
                />
              </a>
              <a
                href="https://peerpush.net/p/adminforth"
                target="_blank"
                rel="noopener"
                className={styles.featuredOnLink}
              >
                <img
                  className={styles.featuredOnBadgeImage}
                  src="https://peerpush.net/p/adminforth/badge.png"
                  alt="AdminForth on PeerPush"
                  width="230"
                />
              </a>
              <a
                href="https://openhunts.com"
                target="_blank"
                rel="noopener"
                title="OpenHunts Club"
                className={styles.featuredOnLink}
              >
                <img
                  className={styles.featuredOnBadgeImage}
                  src="https://cdn.openhunts.com/badges/club.webp"
                  alt="OpenHunts Club Member"
                  width="195"
                />
              </a>
              <a
                href="https://toolfio.com"
                target="_blank"
                rel="dofollow"
                className={styles.featuredOnLink}
              >
                <img
                  className={styles.featuredOnBadgeImage}
                  src="https://toolfio.com/toolfio-light-badge.png"
                  alt="Featured on Toolfio"
                  width="200"
                  height="54"
                />
              </a>
              <a
                href="https://earlyhunt.com/project/adminforth"
                target="_blank"
                rel="noopener"
                className={styles.featuredOnLink}
              >
                <img
                  className={styles.featuredOnBadgeImage}
                  src="https://earlyhunt.com/badges/earlyhunt-badge-light.svg"
                  alt="Featured on EarlyHunt"
                  width="265"
                  height="58"
                />
              </a>
              <a
                href="https://www.producthunt.com/products/adminforth/reviews/new?utm_source=badge-product_review&utm_medium=badge&utm_source=badge-adminforth"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.featuredOnLink}
              >
                <img
                  className={styles.featuredOnBadgeImage}
                  src="https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=598095&theme=light"
                  alt="AdminForth on Product Hunt"
                  width="250"
                  height="54"
                />
              </a>
            </div>
          </div>
        </section>

      </main>

    </Layout>
  );
}
