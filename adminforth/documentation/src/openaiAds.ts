type OutboundDestination = {
  id: string;
  name: string;
};

const OUTBOUND_DESTINATIONS = new Map<string, OutboundDestination>([
  ['github.com', {id: 'github', name: 'GitHub'}],
  ['demo.adminforth.dev', {id: 'live_demo', name: 'Live demo'}],
]);

declare global {
  interface Window {
    oaiq: (...args: unknown[]) => void;
  }
}

export function measurePageView(): void {
  window.oaiq('measure', 'page_viewed', {
    type: 'contents',
    contents: [
      {
        id: window.location.pathname,
        name: document.title,
        content_type: 'page',
      },
    ],
  });
}

export function measureOutboundClick(event: MouseEvent): void {
  if (!(event.target instanceof Element)) {
    return;
  }

  const anchor = event.target.closest('a');
  if (!anchor) {
    return;
  }

  const destination = OUTBOUND_DESTINATIONS.get(new URL(anchor.href).hostname);
  if (!destination) {
    return;
  }

  window.oaiq('measure', 'contents_viewed', {
    type: 'contents',
    contents: [
      {
        ...destination,
        content_type: 'page',
      },
    ],
  });
}
