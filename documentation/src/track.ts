// Events of the site pages, sent to the Devforth back office (bo/api/af_site.ts) and shown on its Funnel page.
// A session is a tab: its id, campaign and source are kept in sessionStorage from the first page it opened.

const EVENTS_URL = 'https://devforth.io/admin/api/af-events/';
const ENGAGED_AFTER_MS = 30_000;

type Session = {id: string; campaign: string | null; source: string | null};

function session(): Session {
  const stored = sessionStorage.getItem('af_session');
  if (stored) {
    return JSON.parse(stored);
  }
  const params = new URLSearchParams(location.search);
  const created: Session = {
    id: crypto.randomUUID(),
    campaign: params.get('utm_campaign'),
    source: params.get('utm_source') ?? (document.referrer ? new URL(document.referrer).hostname : null),
  };
  sessionStorage.setItem('af_session', JSON.stringify(created));
  return created;
}

export function track(event: string, props?: Record<string, string>): void {
  const {id, campaign, source} = session();
  const body = JSON.stringify({event, path: location.pathname, session_id: id, campaign, source, props});
  navigator.sendBeacon(EVENTS_URL, new Blob([body], {type: 'text/plain'}));
}

export function sessionId(): string {
  return session().id;
}

// page_view now, engaged after 30 seconds on the same page; the returned function cancels the timer on navigation
export function trackPageView(): () => void {
  track('page_view');
  const timer = setTimeout(() => track('engaged'), ENGAGED_AFTER_MS);
  return () => clearTimeout(timer);
}

export function trackOutboundClick(event: MouseEvent): void {
  const anchor = (event.target as Element).closest('a');
  if (anchor && anchor.host !== location.host && anchor.protocol.startsWith('http')) {
    track('outbound_click', {host: anchor.host});
  }
}
