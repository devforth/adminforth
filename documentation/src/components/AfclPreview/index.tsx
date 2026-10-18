import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

// lazy loading skips tiny iframes, so the frame starts with some height until the example reports its own
const INITIAL_HEIGHT = 100;

// Live AFCL example above its code: afcl-preview/ builds the code blocks placed inside into a page shown in the iframe.
// minHeight leaves room for dropdowns and dialogs, which open over the example inside the iframe.
export default function AfclPreview({ id, minHeight = 0, children }: { id: string; minHeight?: number; children: ReactNode }) {
  const src = useBaseUrl(`/afcl-preview/index.html#${id}`);
  const [height, setHeight] = useState(minHeight || INITIAL_HEIGHT);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.afclPreview === id) {
        setHeight(Math.max(minHeight, e.data.height));
      }
    }
    window.addEventListener('message', onMessage);
    // an example opened before the page hydrated has already reported its height, nobody listened then
    frame.current.contentWindow.postMessage('afclPreviewHeight', '*');
    return () => window.removeEventListener('message', onMessage);
  }, [id, minHeight]);

  return (
    <div className={styles.preview}>
      <iframe ref={frame} src={src} title={`${id} example`} loading="lazy" style={{ height }} />
      {children}
    </div>
  );
}
