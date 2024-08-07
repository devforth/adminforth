import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  img: string;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'CRUD Out of the Box',
    img: require('@site/static/img/db2.png').default,
    description: (
      <>
        Initialize AdminForth with your database URL and get a full-fledged admin panel.
      </>
    ),
  },
  {
    title: 'Vue3 Driven',
    img: require('@site/static/img/vue.png').default,
    description: (
      <>
        Extend easily by creating own Vue3 components and pages
      </>
    ),
  },
  {
    title: 'Tailwind Look',
    img: require('@site/static/img/css.png').default,
    description: (
      <>
        Look is based on TailwindCSS, with a themes customization and dark mode available
      </>
    ),
  },
];

function Feature({title, img, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <img src={img} alt={title} style={{borderRadius: '50px', width: 250}} />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
