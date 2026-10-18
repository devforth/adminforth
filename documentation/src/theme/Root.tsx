import React, {type PropsWithChildren, useEffect} from 'react';
import {useLocation} from '@docusaurus/router';
import {measureOutboundClick, measurePageView} from '../openaiAds';

export default function Root({children}: PropsWithChildren): JSX.Element {
  const location = useLocation();

  useEffect(() => {
    measurePageView();
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.addEventListener('click', measureOutboundClick);

    return () => document.removeEventListener('click', measureOutboundClick);
  }, []);

  return <>{children}</>;
}
