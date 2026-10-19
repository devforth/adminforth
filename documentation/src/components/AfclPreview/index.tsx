import React, { useEffect, useRef, type ReactNode } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

// Live AFCL example above its code: afcl-preview/ builds the code blocks placed inside into an example,
// its mount.js renders it into this block, in a shadow root
export default function AfclPreview({ id, children }: { id: string; children: ReactNode }) {
  const mountUrl = useBaseUrl('/afcl-preview/mount.js');
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let unmount: (() => void) | undefined;
    let removed = false;
    import(/* webpackIgnore: true */ mountUrl)
      .then(({ mountExample }) => mountExample(id, host.current))
      .then((unmountExample: () => void) => {
        if (removed) {
          unmountExample();
        } else {
          unmount = unmountExample;
        }
      });
    return () => {
      removed = true;
      unmount?.();
    };
  }, [id, mountUrl]);

  return (
    <div className={styles.preview}>
      <div ref={host} className={styles.example} />
      {children}
    </div>
  );
}
