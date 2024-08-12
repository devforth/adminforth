import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

import ImageGallery from "react-image-gallery";
// import stylesheet if you're not already using CSS @import
import "react-image-gallery/styles/css/image-gallery.css";

const images = [
  {
    original: require('@site/static/img/previews/login_form.png').default,
    thumbnail: require('@site/static/img/previews/login_form.png').default,
    description: 'Sign in form'
  },
  {
    original: require('@site/static/img/previews/users_management.png').default,
    thumbnail: require('@site/static/img/previews/users_management.png').default,
    description: 'Users management'
  },
  {
    original: require('@site/static/img/previews/ai_complete.png').default,
    thumbnail: require('@site/static/img/previews/ai_complete.png').default,
    description: 'AI autocomplete Plugin - write with ChatGPT'
  },
  {
    original: require('@site/static/img/previews/auditlog.png').default,
    thumbnail: require('@site/static/img/previews/auditlog.png').default,
    description: 'Audit log Plugin - know who did what'
  },
  {
    original: require('@site/static/img/previews/2fa_plugin.png').default,
    thumbnail: require('@site/static/img/previews/2fa_plugin.png').default,
    description: '2FA Plugin - secure your admin panel'
  },
  {
    original: require('@site/static/img/previews/dark.png').default,
    thumbnail: require('@site/static/img/previews/dark.png').default,
    description: 'Dark mode out of the box'
  },
  {
    original: require('@site/static/img/previews/upload.png').default,
    thumbnail: require('@site/static/img/previews/upload.png').default,
    description: 'Upload Plugin - upload files'
  },
  {
    original: require('@site/static/img/previews/dashboard.png').default,
    thumbnail: require('@site/static/img/previews/dashboard.png').default,
    description: 'Custom Pages and Dashboards'
  }
];


function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <>
      <header className={clsx('hero', styles.heroBanner)} style={{paddingBottom: '30vw'}}>
        <div className="container">
          <Heading as="h1" className="hero__title">
            {siteConfig.title}
          </Heading>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className="button button--secondary button--lg"
              to="/docs/tutorial/gettingStarted">
              Get started - 5min ⏱️
            </Link>

            <Link
              className="button button--primary button--lg"
              to="https://demo.adminforth.dev/">
              Live Demo
            </Link>
          </div>
        </div>
      </header>
      <img src={require('@site/static/img/preview.png').default} alt="AdminForth" style={{
        width: '100%',
        maxWidth: 1000,
        zIndex: 100,
        margin: '0 auto',
        marginTop: '-28vw',
        // transform: 'translateY(10%)',
        marginBottom: 80,
      }} />
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
        <HomepageFeatures />
      </main>

      

      <ImageGallery 
        items={images} 
        showFullscreenButton={false} 
        showPlayButton={false}
        autoPlay={true}
        slideInterval={7000}
      />;
      

    </Layout>
  );
}
