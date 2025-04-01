import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';


const config: Config = {
  title: 'Vue & Node admin panel framework',
  tagline: 'Launch robust back-office apps faster with AdminForth’s easy setup and customization',
  favicon: 'img/favicon.png',

  // Set the production url of your site here
  url: 'https://adminforth.dev',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  trailingSlash: true,

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'devforth', // Usually your GitHub org/user name.
  projectName: 'devforth.github.io', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  scripts: [
    {
      src: '/scripts/adminforth.js',
    },
  ],

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarCollapsible: false,
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
           showReadingTime: true,
        //   // Please change this to your repo.
        //   // Remove this to remove the "edit this page" links.
        //   // editUrl:
        //   //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        gtag: { 
          trackingID: 'G-7K99Q2BH04',
          anonymizeIP: true,
        }
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      "docusaurus-plugin-typedoc",
      {
        entryPoints: [
          "../types/Back.ts",
          "../types/Common.ts",
          "../types/FrontendAPI.ts", 
       //   "../plugins/**/types.ts",
        ],
        plugin: ["./typedoc-plugin.mjs"],
        readme: "none",
        indexFormat: "table",
        disableSources: true,
        sidebar: { pretty: true },
        textContentMappings: {
          "title.indexPage": "TypeDoc API",
          "title.memberPage": "{name}",
        },
        parametersFormat: "table",
        enumMembersFormat: "table",
      },
    ],
    // [
    //   '@docusaurus/plugin-sitemap',
    //   {
    //     id: 'default',
    //     changefreq: 'daily',
    //     priority: 0.5,
    //     trailingSlash: true,
    //   },
    // ],
  ],

  themeConfig: {
    image: "img/og.jpg",
    algolia: {
        appId: 'VSIPOF54AV',  // The application ID provided by Algolia
        apiKey: '1421d8647ca2005358fdd01a9ceb3565',  // Public API key: it is safe to commit it
        indexName: 'adminforth',
    },
    // Replace with your project's social card
    // image: 'img/docusaurus-social-card.jpg',
    navbar: {
        title: 'AdminForth',
        logo: {
          alt: 'AdminForth Logo',
          src: 'img/logo.svg',
        },
      items: [
        {
          type: 'search',
          position: 'right',
        },
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Tutorial',
        },
        {
          type: 'docSidebar',
          sidebarId: 'apiSidebar',
          position: 'left',
          label: 'API',
        },
        { to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://demo.adminforth.dev/',
          label: 'Live Demo',
          position: 'right',
        },
        {
          href: 'https://github.com/devforth/adminforth',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: '/docs/tutorial/gettingStarted',
            },
            {
              label: 'Live Demo',
              to: 'https://demo.adminforth.dev/',
            },
            {
              label: 'API',
              to: '/docs/api',
            },
            {
              label: 'Blog Archive',
              to: '/blog/archive/',
            },
            {
              label: 'Find anything',
              to: '/search/'
            }
          ],
        },
        // {
        //   title: 'Community',
        //   items: [
        //     {
        //       label: 'Stack Overflow',
        //       href: 'https://stackoverflow.com/questions/tagged/docusaurus',
        //     },
        //     {
        //       label: 'Discord',
        //       href: 'https://discordapp.com/invite/docusaurus',
        //     },
        //     {
        //       label: 'Twitter',
        //       href: 'https://twitter.com/docusaurus',
        //     },
        //   ],
        // },
        {
          title: 'More',
          items: [
            // {
            //   label: 'Blog',
            //   to: '/blog',
            // },
            {
              label: 'DevForth.io',
              href: 'https://devforth.io',
            },
            {
              label: 'We can develop admin panel for your project',
              href: 'https://devforth.io/contact',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/devforth/adminforth',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Devforth sp. z o.o.`,
    },
    prism: {
      magicComments: [
        {
          className: 'code-block-diff-add-line',
          line: 'diff-add'
        },
        {
          className: 'code-block-diff-remove-line',
          line: 'diff-remove'
        }
      ],
      theme: prismThemes.okaidia,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['docker', 'bash', 'diff'],

    },
    docs: {
      sidebar: {
        autoCollapseCategories: false,
        
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
