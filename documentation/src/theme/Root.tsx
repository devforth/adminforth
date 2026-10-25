import React, {type PropsWithChildren, useEffect} from 'react';
import {useLocation} from '@docusaurus/router';
import {measureOutboundClick, measurePageView} from '../openaiAds';
import {trackOutboundClick, trackPageView} from '../track';

export default function Root({children}: PropsWithChildren): JSX.Element {
  const location = useLocation();

  useEffect(() => {
    measurePageView();
    return trackPageView();
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.addEventListener('click', measureOutboundClick);
    document.addEventListener('click', trackOutboundClick);

    return () => {
      document.removeEventListener('click', measureOutboundClick);
      document.removeEventListener('click', trackOutboundClick);
    };
  }, []);

  return <>{children}</>;
}
