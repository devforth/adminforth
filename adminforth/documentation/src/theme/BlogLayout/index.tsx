import React, {type ReactNode} from 'react';
import BlogLayout from '@theme-original/BlogLayout';
import type BlogLayoutType from '@theme/BlogLayout';
import type {WrapperProps} from '@docusaurus/types';
import Head from '@docusaurus/Head';

type Props = WrapperProps<typeof BlogLayoutType>;
const BLOG_TITLE = 'AdminForth Blog';
const BLOG_DESCRIPTION = 'AdminForth blog posts';

export default function BlogLayoutWrapper(props: Props): ReactNode {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    headline: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    url: `https://adminforth.dev/blog`,
    dateModified: new Date().toISOString(),
  };
  return (
    <>
      <Head>
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
        <meta name="twitter:title" content={BLOG_TITLE} />
        <meta name="twitter:description" content={BLOG_DESCRIPTION} />
      </Head>
      <BlogLayout {...props} />
    </>
  );
}
