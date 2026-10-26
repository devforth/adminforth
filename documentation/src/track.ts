// Events of the site pages, sent to the Devforth back office (bo/api/af_site.ts) and shown on its Funnel page.
// A tagged visit starts a new session when its campaign or creative changes within a tab.

import {businessVariant, LANDING_VERSION} from './pages/business/_campaigns';

const EVENTS_URL = 'https://devforth.io/admin/api/af-events/';
const ENGAGED_AFTER_MS = 30_000;

type Session = {id: string; campaign: string | null; source: string | null; content?: string | null};

function session(): Session {
  const stored = sessionStorage.getItem('af_session');
  const params = new URLSearchParams(location.search);
  const campaign = params.get('utm_campaign');
  const content = params.get('utm_content');
  if (stored) {
    const previous: Session = JSON.parse(stored);
    if (!campaign || (previous.campaign === campaign && (previous.content ?? null) === content)) return previous;
  }
  const created: Session = {
    id: crypto.randomUUID(),
    campaign,
    content,
    source: params.get('utm_source') ?? (document.referrer ? new URL(document.referrer).hostname : null),
  };
  sessionStorage.setItem('af_session', JSON.stringify(created));
  return created;
}

export function track(event: string, props?: Record<string, string>): void {
  const {id, campaign, source, content} = session();
  const landing = location.pathname === '/business/' || location.pathname === '/business';
  const context = landing ? {
    landing_variant: businessVariant(new URLSearchParams(location.search).get('utm_campaign'))?.id ?? 'general',
    landing_version: LANDING_VERSION,
  } : {};
  const body = JSON.stringify({event, path: location.pathname, session_id: id, campaign, source,
    props: {...context, ...(content ? {utm_content: content} : {}), ...props}});
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
