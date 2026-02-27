import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import { useState } from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import styles from './index.module.css';


const images = [
  {
    original: require('@site/static/img/previews/login_form.png').default,
    title: 'Authentication and Authorization',
    link: '/docs/tutorial/gettingStarted',
    description: 'OWASP-Compliant Sign-In already there'
  },
  {
    original: require('@site/static/img/previews/users_management.png').default,
    title: 'Users management',
    link: '/docs/tutorial/gettingStarted',
    description: 'Manage users and roles with ease, extend as you like'
  },
  {
    original: require('@site/static/img/previews/sso.png').default,
    title: 'OAuth2/OpenID SSO Plugin - one click login',
    link: '/docs/tutorial/Plugins/oauth/',
    description: 'RFC 6749 SSO plugin with premade Google, Github, Facebook, Keycloak, Microsoft or any custom OAuth2 adapter'
  },
  {
    original: require('@site/static/img/previews/ai_complete.png').default,
    title: 'AI autocomplete Plugin - write with ChatGPT',
    link: '/docs/tutorial/Plugins/text-complete/',
    description: 'Provide your OpenAI API key to autocomplete plugin and AI will help you to write your content using record context'
  },
  {
    original: require('@site/static/img/previews/auditlog.png').default,
    title: 'Audit log Plugin - know who did what',
    link: '/docs/tutorial/Plugins/AuditLog/',
    description: 'Attach Audit log plugin with couple of lines, create table for logs and track your users actions'
  },
  {
    original: require('@site/static/img/previews/2fa_plugin.png').default,
    title: '2FA Plugin - secure your admin panel',
    link: '/docs/tutorial/Plugins/TwoFactorsAuth/',
    description: 'RFC 6238-Compliant TOTP-Based 2FA will add additional security layer to your admin panel. Also supports passkeys'
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
    link: '/docs/tutorial/Plugins/Upload/',
    description: 'Upload files to Amazon S3 with instantiating plugin and providing your S3 credentials' 
  },
  {
    original: require('@site/static/img/previews/dashboard.png').default,
    title: 'Custom Pages and Dashboards',
    link: '/docs/tutorial/Customization/customPages/',
    description: 'Create your own pages and dashboards with Vue3 components. Add any additional npm packages and extend your admin panel as you like'
  },
  {
    original: require('@site/static/img/previews/branding.png').default,
    title: 'Branding and theming',
    link: '/docs/tutorial/Customization/branding/',
    description: 'Upload your logo, change colors, update titles, make the look to match your brand'
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
    link: '/docs/tutorial/Plugins/RichEditor/',
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
    original: require('@site/static/img/previews/translate.png').default,
    title: 'AI Translation Plugin - translate your admin and External apps',
    link: '/docs/tutorial/Plugins/i18n/',
    description: 'Use LLMs to translate any external apps (Mobile, Nuxt, etc.) OR/AND admin panel with minimal effort. Any language supported'
  },
  {
    original: require('@site/static/img/previews/bulk-ai-flow.png').default,
    title: 'Bulk AI Plugin - generate data for your resources',
    link: '/docs/tutorial/Plugins/bulk-ai-flow/',
    description: 'Use LLMs to fill records with generated data or images. For example, generate product descriptions based on product name and image or generate products images'
  },
];


function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  // read theme from docusarus

  const [theme, setTheme] = useState('light');

  if (ExecutionEnvironment.canUseDOM) {

    
  } 

  return (
    <>
      <header className={clsx('hero', styles.heroBanner)}>
        <div className="container" >
          <Heading as="h1" className={clsx('hero__title', styles.heroBannerTitle)} >
            The Free, Open-Source Admin Framework for Node, Vue & Tailwind
          </Heading>
          <p className="hero__subtitle">{siteConfig.tagline}</p>

          <div class="heroRow">
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
              </div>
            </div>
          </div>

        </div>
      </header>


        <div className="laptop_container">
          <div className="laptop">
            <div className="laptop__screen">
              <img 
                src={{
                    light: require('@site/static/img/preview_light.png').default,
                    dark: require('@site/static/img/preview_dark.png').default,
                  }[theme]
                } alt="Screen" />
              <div className="theme_switcher" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                
              </div>
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

  return (
    <Layout
      title={`${siteConfig.title}`}
      description="OpenSource Tailwind Admin Panel extendable with Vue3 and typescript!">
      <HomepageHeader />
      <main>


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
        
        <HomepageFeatures />

      </main>

    </Layout>
  );
}
