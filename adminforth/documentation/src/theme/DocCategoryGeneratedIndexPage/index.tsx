import React, {type ReactNode} from 'react';
import DocCategoryGeneratedIndexPage from '@theme-original/DocCategoryGeneratedIndexPage';
import type DocCategoryGeneratedIndexPageType from '@theme/DocCategoryGeneratedIndexPage';
import type {WrapperProps} from '@docusaurus/types';
import Head from '@docusaurus/Head';

type Props = WrapperProps<typeof DocCategoryGeneratedIndexPageType>;

export default function DocCategoryGeneratedIndexPageWrapper(props: Props): ReactNode {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    headline: props.categoryGeneratedIndex.title,
    description: props.categoryGeneratedIndex.description,
    url: `https://adminforth.dev${props.categoryGeneratedIndex.permalink}`,
    dateModified: new Date().toISOString(),
  };
  return (
    <>
      <Head>
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
        <meta name="twitter:title" content={props.categoryGeneratedIndex.title} />
        <meta name="twitter:description" content={props.categoryGeneratedIndex.description} />
      </Head>
      <DocCategoryGeneratedIndexPage {...props} />
    </>
  );
}
