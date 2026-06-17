import React, {type ReactNode} from 'react';
import BlogArchivePage from '@theme-original/BlogArchivePage';
import type BlogArchivePageType from '@theme/BlogArchivePage';
import type {WrapperProps} from '@docusaurus/types';
import Head from '@docusaurus/Head';

type Props = WrapperProps<typeof BlogArchivePageType>;
const BLOG_TITLE = 'AdminForth Blog Archive';
const BLOG_DESCRIPTION = 'AdminForth blog archive page';

export default function BlogArchivePageWrapper(props: Props): ReactNode {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    headline: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    url: `https://adminforth.dev/blog/archive/`,
    dateModified: new Date().toISOString(),
  };
  return (
    <>
      <Head>
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
        <meta name="twitter:title" content={BLOG_TITLE} />
        <meta name="twitter:description" content={BLOG_DESCRIPTION} />
      </Head>
      <BlogArchivePage {...props} />
    </>
  );
}
