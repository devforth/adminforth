import {useEffect, useState, type FormEvent} from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import {useBaseUrlUtils} from '@docusaurus/useBaseUrl';
import clsx from 'clsx';
import styles from './business.module.css';
import {buildPrompt, DAILY_PROMPTS, EXAMPLES, SOURCES, type Brief, type Source} from './_brief';
import {sessionId, track} from '../../track';
import {BUSINESS_VARIANTS, businessVariant, type BusinessVariant} from './_campaigns';

const BUSINESS_EXAMPLES = {...EXAMPLES, ...Object.fromEntries(BUSINESS_VARIANTS.map((v) => [v.id, {label: v.label, ...v.brief}]))};

// The business landing (/business/) for founders who run their business with AI agents. It has its own
// header instead of the docs navbar, so it is not wrapped in the theme Layout. The screens are the drawn
// pages of static/landing-previews, pinned to the dark theme.

const PAGE_TITLE = 'Run your business with agents, on data you control';
const PAGE_DESCRIPTION = 'Turn your business process into your own app with AdminForth and a coding agent. Shared records, team permissions and change history. Start with one process.';
const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,500..800&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap';
const BOOKING_URL = 'https://talk.devforth.io/book/30-minute-meeting';
const GITHUB_URL = 'https://github.com/devforth/adminforth';
const START_URL = 'https://devforth.io/admin/api/af-start/business/';

const PAINS = [
  {was: '“Who can change this?”', title: 'You set the access rules.', body: 'Each teammate and their agent work within the permissions you set.'},
  {was: '“What happened to that record?”', title: 'See who changed what.', body: 'The audit log records the person, the agent, and the old and new values.'},
  {was: '“Will I be stuck with it?”', title: 'Your code. Your database.', body: 'AdminForth is open source. Ask your coding agent to change the app as your process changes.'},
];

const FAQ = [
  {
    q: 'Do I need a developer?',
    a: 'You can start with a coding agent and check its work in your browser. A live business app still needs reviewed access rules, hosting and backups. Complex integrations may need developer help.',
  },
  {
    q: 'Is this a ready-made CRM?',
    a: 'No. AdminForth is an open-source framework for building your own business admin: customers, orders, jobs, stock, invoices, whatever you run. Your agent builds the parts you need, around your fields and your rules.',
  },
  {
    q: 'Does an AI provider see my data?',
    a: 'Your app and database run where you host them. Whatever your agent reads through MCP goes to that agent’s model provider, under the permissions of the person who connected it. Compatible self-hosted models work too.',
  },
  {
    q: 'What about updates and security fixes?',
    a: 'The security parts, sign-in, sessions, two-factor, permissions, MCP, audit, live in the AdminForth framework and its plugins, which our team maintains. Your app updates by bumping their versions, which your agent can run. Your own code stays small: your fields and rules.',
  },
  {
    q: 'Can I change the admin later?',
    a: 'Yes. Ask your agent for the next field, stage, part or report. Every generated app carries instructions and skills for coding agents, so each change builds on what is there. Check changes before your team relies on them.',
  },
  {
    q: 'Where will the app run?',
    a: 'The first version runs on your computer. For your team it goes on a server you control; your agent prepares the deployment, you decide where it runs and how it is backed up.',
  },
  {
    q: 'What happens on the free call?',
    a: 'We talk about one process in your business, where the current approach gets in the way, and whether AdminForth is a good foundation for it. Implementation and hosting are separate from the call.',
  },
];

const WORKFLOW_STEPS = [
  {
    k: 'Step 1 · Ask',
    title: 'Maya asks, the agent changes the record.',
    bar: 'Maya’s agent · northstar.app through MCP',
    screen: 'business-agent-chat',
    wide: [760, 560],
    narrow: [400, 600],
    alt: 'Maya asks which follow-ups are overdue, then has the agent set the next action of REQ-1042.',
    text: '“Which follow-ups are overdue?” then “Set the next action for REQ-1042.” The agent reads and writes through the app’s MCP tools, as Maya, with her permissions.',
  },
  {
    k: 'Step 2 · The server decides',
    title: 'Tom’s agent asks for Maya’s request and is refused.',
    bar: 'Tom’s agent · northstar.app through MCP',
    screen: 'business-agent-chat',
    query: '&scene=denied',
    wide: [760, 560],
    narrow: [400, 600],
    alt: 'Tom’s agent tries to open REQ-1042. The server answers: not allowed, it is assigned to Maya. The agent then lists Tom’s own request due today.',
    text: 'Tom is a manager. His agent asks for Maya’s request; the server refuses, not the agent. The same rule holds for a browser, an export or a direct request.',
  },
  {
    k: 'Step 3 · Check',
    title: 'The audit log names the person and the agent.',
    bar: 'northstar.app/audit-log',
    screen: 'business-audit',
    wide: [1040, 560],
    narrow: [420, 480],
    alt: 'The audit log shows Maya’s change through Codex with the old and new next action.',
    text: 'Every change is a row: who, when, through which agent, what it was before. Maya opens it when something looks off, or asks her agent what changed.',
  },
];

function Icon({name, className}: {name: string; className?: string}): JSX.Element {
  const {withBaseUrl} = useBaseUrlUtils();
  return (
    <svg className={clsx(styles.ic, className)} aria-hidden="true">
      <use href={withBaseUrl(`/landing-previews/icons.svg#${name}`)} />
    </svg>
  );
}

function BrandMark(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8.034 6.006V13H6.097V12.194C5.59433 12.8007 4.86633 13.104 3.913 13.104C3.25433 13.104 2.65633 12.9567 2.119 12.662C1.59033 12.3673 1.17433 11.947 0.871 11.401C0.567667 10.855 0.416 10.2223 0.416 9.503C0.416 8.78367 0.567667 8.151 0.871 7.605C1.17433 7.059 1.59033 6.63867 2.119 6.344C2.65633 6.04933 3.25433 5.902 3.913 5.902C4.80567 5.902 5.50333 6.18367 6.006 6.747V6.006H8.034ZM4.264 11.44C4.77533 11.44 5.2 11.2667 5.538 10.92C5.876 10.5647 6.045 10.0923 6.045 9.503C6.045 8.91367 5.876 8.44567 5.538 8.099C5.2 7.74367 4.77533 7.566 4.264 7.566C3.744 7.566 3.315 7.74367 2.977 8.099C2.639 8.44567 2.47 8.91367 2.47 9.503C2.47 10.0923 2.639 10.5647 2.977 10.92C3.315 11.2667 3.744 11.44 4.264 11.44Z"
        fill="currentColor"
      />
      <path
        d="M13.317 5.538C12.589 5.538 12.0387 5.69833 11.666 6.019C11.2933 6.331 11.107 6.80333 11.107 7.436V7.995H14.851V9.685H11.107V13H9.001V7.449C9.001 6.279 9.365 5.369 10.093 4.719C10.8297 4.069 11.8567 3.744 13.174 3.744C13.694 3.744 14.1837 3.80033 14.643 3.913C15.1023 4.017 15.501 4.173 15.839 4.381L15.189 6.045C14.669 5.707 14.045 5.538 13.317 5.538Z"
        fill="var(--accent)"
      />
    </svg>
  );
}

type ShotProps = {
  bar: string;
  screen: string;
  wide: number[];
  narrow: number[];
  query?: string;
  title: string;
  alt: string;
  eager?: boolean;
  className?: string;
};

// a drawn screen in a browser frame: the wide drawing on desktop, a narrower one on phones, pinned dark
function Shot({bar, screen, wide, narrow, query = '', title, alt, eager, className}: ShotProps): JSX.Element {
  const {withBaseUrl} = useBaseUrlUtils();
  const src = (w: number, h: number) => withBaseUrl(`/landing-previews/${screen}.html?w=${w}&h=${h}&theme=dark${query}`);
  return (
    <figure className={clsx(styles.shot, className)}>
      <div className={styles.shotBar}><i /><i /><i /><span>{bar}</span></div>
      <iframe className={styles.wide} src={src(wide[0], wide[1])} style={{aspectRatio: `${wide[0]} / ${wide[1]}`}} title={title} aria-hidden="true" tabIndex={-1} loading={eager ? 'eager' : 'lazy'} />
      <iframe className={styles.narrow} src={src(narrow[0], narrow[1])} style={{aspectRatio: `${narrow[0]} / ${narrow[1]}`}} title={title} aria-hidden="true" tabIndex={-1} loading="lazy" />
      <figcaption className={styles.sr}>{alt}</figcaption>
    </figure>
  );
}

function CopyButton({text, className}: {text: string; className?: string}): JSX.Element {
  const [label, setLabel] = useState('Copy');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setLabel('Copied');
    } catch {
      setLabel('Select and copy');
    }
    setTimeout(() => setLabel('Copy'), 2000);
  };
  return (
    <button type="button" className={clsx(styles.btn, styles.btnSm, styles.btnGhost, className)} onClick={copy}>{label}</button>
  );
}

function Header(): JSX.Element {
  return (
    <header className={styles.top}>
      <div className={clsx(styles.wrap, styles.topIn)}>
        <a className={styles.brand} href="#top"><BrandMark />AdminForth</a>
        <nav className={styles.topNav} aria-label="On this page">
          <a href="#workflow">How it works</a>
          <a href="#start">Start with your agent</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className={styles.topSrc} href={GITHUB_URL} target="_blank" rel="noopener">View source</a>
        <a className={clsx(styles.btn, styles.btnPrimary, styles.btnSm)} href="#start">Build it with my agent</a>
      </div>
    </header>
  );
}

function ProcessPreview({variant}: {variant: BusinessVariant}): JSX.Element {
  return (
    <figure className={styles.processPreview} data-process-preview={variant.id}>
      <div className={styles.processTop}><BrandMark /><b>{variant.recordType}</b><span>Example app</span></div>
      <div className={styles.processIntro}><h3>{variant.recordType} at a glance</h3><p>Owner, stage and next action — in one place.</p></div>
      <div className={styles.processRecords}>
        {variant.records.map((record) => (
          <div className={styles.processRecord} key={record.id}>
            <div><span className={styles.processId}>{record.id}</span><b>{record.name}</b></div>
            <div><span className={clsx(styles.processStatus, record.attention && styles.processAttention)}>{record.stage}</span><small>{record.owner} · Due {record.due.toLowerCase()}</small></div>
          </div>
        ))}
      </div>
      <div className={styles.processChat}><span>YOU → YOUR AGENT</span><p>{variant.question}</p><div><Icon name="bot" /><p>{variant.answer}</p></div></div>
      <figcaption>Illustrative AdminForth app · Fictional records</figcaption>
    </figure>
  );
}

function ProcessWorkflow({variant}: {variant: BusinessVariant}): JSX.Element {
  return (
    <section className={styles.sec} id="workflow" aria-labelledby="process-title">
      <div className={styles.wrap}>
        <header className={styles.secHead}>
          <p className={styles.eyebrow}>From a scattered spreadsheet to a shared process</p>
          <h2 className={styles.h2} id="process-title">Find what is stuck. Give it a next step.</h2>
          <p className={styles.lede}>Build this around your own fields, stages and team.</p>
        </header>
        <ol className={styles.processSteps}>
          <li><span className={styles.eyebrow}>1 · Find</span><h3 className={styles.h3}>{variant.question}</h3><p>{variant.answer}</p></li>
          <li><span className={styles.eyebrow}>2 · Act</span><h3 className={styles.h3}>{variant.operation}</h3><p>{variant.result}</p></li>
          <li><span className={styles.eyebrow}>3 · Check</span><h3 className={styles.h3}>Your team’s rules still apply.</h3><p>Your access rules apply to agents too. Check who changed what in the audit log.</p></li>
        </ol>
        <p className={styles.note}>Example with fictional data. Start locally; add real data and team hosting when you’re ready.</p>
        <a className={clsx(styles.btn, styles.btnPrimary)} href="#start">{variant.cta}<Icon name="arrow-right" /></a>
      </div>
    </section>
  );
}

function Hero({variant}: {variant?: BusinessVariant}): JSX.Element {
  if (variant) return (
    <section className={styles.hero}>
      <div className={clsx(styles.wrap, styles.heroWrap, styles.heroGrid)}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Your {variant.label.toLowerCase()} · Your own app</p>
          <h1 className={styles.h1}>{variant.heading}</h1>
          <p className={styles.lede}>{variant.description}</p>
          <ul className={styles.facts}><li><Icon name="database" />Your own database</li><li><Icon name="users" />Team access rules</li><li><Icon name="history" />Change history</li></ul>
          <div className={styles.cta}><a className={clsx(styles.btn, styles.btnPrimary)} href="#start">{variant.cta}</a><a className={clsx(styles.btn, styles.btnGhost)} href="#workflow">See an example</a></div>
          <p className={styles.note}>Start with a brief for your coding agent. First build: sample data on your computer.</p>
        </div>
        <div className={styles.heroVisual}><ProcessPreview variant={variant} /></div>
      </div>
    </section>
  );
  return (
    <section className={styles.hero}>
      <div className={clsx(styles.wrap, styles.heroWrap, styles.heroGrid)}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Agent-first business admin</p>
          <h1 className={styles.h1}>Run your business with agents, <span>on data you control.</span></h1>
          <ul className={styles.facts} aria-label="Security facts">
            <li className={styles.lead}><Icon name="shield-check" />Secure</li>
            <li><Icon name="database" />Your own database</li>
            <li><Icon name="key-round" />One revocable key per agent</li>
          </ul>
          <p className={styles.lede}>Customers in chats. Orders in spreadsheets. Turn one messy process into your own app with AdminForth and a coding agent. Then work through your agent or the app’s screens.</p>
          <div className={styles.cta}>
            <a className={clsx(styles.btn, styles.btnPrimary)} href="#start">Build it with my agent</a>
            <a className={clsx(styles.btn, styles.btnGhost)} href="#workflow">See it work</a>
          </div>
          <p className={styles.note}>Free, open-source framework. Your agent and hosting are paid separately.</p>
        </div>
        <div className={styles.heroVisual}>
          <Shot
            bar="Maya’s agent · connected to northstar.app through MCP"
            screen="business-agent-chat"
            wide={[760, 560]}
            narrow={[400, 600]}
            title="An agent working through MCP"
            alt="Maya asks her agent which follow-ups are overdue. The agent calls get_resource_data on the Northstar app, lists REQ-1042 and REQ-1031, then on her request calls update_record and sets the next action of REQ-1042."
            eager
          />
          <p className={styles.logStrip} aria-label="The audit log entry of that change">
            <span className={styles.k}>Audit log</span><b>Today 09:04</b><span>Maya</span><span className={styles.mono}>codex@0.46 · Maya’s laptop</span><span>Update · REQ-1042</span>
          </p>
          <p className={styles.cap}>An example business admin built with AdminForth. Northstar Services and its records are made up.</p>
        </div>
      </div>
    </section>
  );
}

function Pillars(): JSX.Element {
  return (
    <section className={styles.sec} id="why" aria-labelledby="why-title">
      <div className={styles.wrap}>
        <header className={styles.secHead}>
          <p className={styles.eyebrow}>What AdminForth gives you</p>
          <h2 className={styles.h2} id="why-title">A foundation you can keep building on.</h2>
        </header>
        <div className={styles.pillars}>
          <div className={styles.pillar}>
            <div className={styles.pillarText}>
              <p className={styles.n}>01 · Security</p>
              <h3 className={styles.h3}>Your data. Your access rules.</h3>
              <p>Your records live in your database. Give each agent its own connection, and revoke it when needed.</p>
              <p>AdminForth maintains the sign-in and permission components. Your agent can help apply updates; you still review and test your app.</p>

            </div>
            <Shot
              bar="northstar.app/settings/agents"
              screen="business-connections"
              wide={[960, 560]}
              narrow={[420, 600]}
              title="Connected agents"
              alt="Maya’s Agents settings: Codex on her laptop, Claude on her phone, a read-only key for a monthly report, and an old laptop already revoked. Each row has its own Revoke button."
            />
          </div>
          <div className={styles.pillar}>
            <div className={styles.pillarText}>
              <p className={styles.n}>02 · Your team and their agents</p>
              <h3 className={styles.h3}>Know who changed what.</h3>
              <p>Your team and their agents use the same records. The server enforces the access rules you configure.</p>
              <p>The audit log shows the person, the agent, and the values before and after a change.</p>
            </div>
            <Shot
              bar="northstar.app/audit-log"
              screen="business-audit"
              wide={[1040, 560]}
              narrow={[420, 480]}
              title="Audit log"
              alt="The audit log: Maya through Codex updated REQ-1042, Tom created a follow-up in the browser, Priya through Claude Code changed the status of REQ-1031. Each row shows the old and new values."
            />
          </div>
          <div className={styles.pillar}>
            <div className={styles.pillarText}>
              <p className={styles.n}>03 · Screens, optional</p>
              <h3 className={styles.h3}>Ask your agent. Open a screen when you want to look.</h3>
              <p>Ask your agent to find or update a record. Open the app for an overview, or let teammates use its forms.</p>
            </div>
            <Shot
              bar="northstar.app/overview"
              screen="business-overview"
              wide={[1040, 620]}
              narrow={[420, 760]}
              title="Overview"
              alt="The Overview page: open requests, overdue follow-ups, jobs this week, unpaid invoices, today’s jobs and items low in stock."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Pains(): JSX.Element {
  return (
    <section className={clsx(styles.sec, styles.band)} aria-labelledby="pains-title">
      <div className={styles.wrap}>
        <header className={styles.secHead}>
          <p className={styles.eyebrow}>Sound familiar?</p>
          <h2 className={styles.h2} id="pains-title">Keep control as your team grows.</h2>
        </header>
        <ul className={styles.fixes}>
          {PAINS.map((pain) => (
            <li key={pain.title}>
              <p className={styles.was}>{pain.was}</p>
              <span className={styles.to} aria-hidden="true"><Icon name="arrow-right" /></span>
              <div><h3 className={styles.h3}>{pain.title}</h3><p>{pain.body}</p></div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Workflow(): JSX.Element {
  const [step, setStep] = useState(0);
  return (
    <section className={clsx(styles.sec, styles.band)} id="workflow" aria-labelledby="wf-title">
      <div className={styles.wrap}>
        <header className={styles.secHead}>
          <p className={styles.eyebrow}>How it works</p>
          <h2 className={styles.h2} id="wf-title">One operation, through the agent.</h2>
          <p className={styles.lede}>Northstar Services, a made-up maintenance company, runs on an admin built with AdminForth. Maya owns it; Tom and Priya are managers. Each of them talks to their own agent.</p>
        </header>
        <div className={styles.stepper} role="tablist" aria-label="Steps of the operation">
          {WORKFLOW_STEPS.map((s, i) => (
            <button type="button" role="tab" key={s.k} id={`wf-t${i}`} aria-controls={`wf-p${i}`} aria-selected={i === step} tabIndex={i === step ? 0 : -1} onClick={() => setStep(i)}>
              <span className={styles.k}>{s.k}</span><b>{s.title}</b>
            </button>
          ))}
        </div>
        {WORKFLOW_STEPS.map((s, i) => (
          <div className={clsx(styles.wfPanel, i === step && styles.on)} role="tabpanel" key={s.k} id={`wf-p${i}`} aria-labelledby={`wf-t${i}`}>
            <Shot bar={s.bar} screen={s.screen} query={s.query} wide={s.wide} narrow={s.narrow} title={s.k} alt={s.alt} className={i === 2 ? styles.wfShotWide : styles.wfShot} />
            <div className={styles.wfRow}>
              <p>{s.text}</p>
              {i < WORKFLOW_STEPS.length - 1 ? (
                <button type="button" className={clsx(styles.btn, styles.btnGhost, styles.btnSm)} onClick={() => setStep(i + 1)}>
                  Next: {WORKFLOW_STEPS[i + 1].k.split(' · ')[1].toLowerCase()}<Icon name="arrow-right" />
                </button>
              ) : (
                <a className={clsx(styles.btn, styles.btnPrimary, styles.btnSm)} href="#start">Build yours<Icon name="arrow-right" /></a>
              )}
            </div>
          </div>
        ))}
        <p className={clsx(styles.note, styles.wfNote)}>Northstar Services and its records are made up for this example.</p>
      </div>
    </section>
  );
}

type ResultState = 'idle' | 'ready' | 'copied' | 'manual';

function BriefBuilder({variant}: {variant?: BusinessVariant}): JSX.Element {
  const [example, setExample] = useState(variant?.id ?? 'followups');
  const [brief, setBrief] = useState<Brief>(() => {
    const {label: _label, ...fields} = BUSINESS_EXAMPLES[variant?.id ?? 'followups'];
    return fields;
  });
  const [edited, setEdited] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [state, setState] = useState<ResultState>('idle');
  const [expanded, setExpanded] = useState(false);
  const [agent, setAgent] = useState<'claude' | 'codex'>('claude');
  // the session id is in the browser only, the server render gets the link without it
  const [startUrl, setStartUrl] = useState(START_URL);
  useEffect(() => setStartUrl(`${START_URL}?s=${sessionId()}`), []);
  const prompt = buildPrompt(brief, startUrl);

  const apply = (id: string) => {
    const {label: _label, ...fields} = BUSINESS_EXAMPLES[id];
    setBrief(fields);
    setExample(id);
    setEdited(false);
    setPending(null);
  };
  const pick = (id: string) => (edited ? setPending(id) : apply(id));
  const change = (patch: Partial<Brief>) => {
    setBrief((b) => ({...b, ...patch}));
    setEdited(true);
  };
  const prepare = (e: FormEvent) => {
    e.preventDefault();
    track('brief_prepared', {brief_example: example, brief_edited: String(edited)});
    setState('ready');
    document.getElementById('brief-ready-title')?.focus();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      track('build_prompt_copied', {brief_example: example, brief_edited: String(edited)});
      setState('copied');
    } catch {
      setState('manual');
    }
  };
  const download = () => {
    track('brief_downloaded', {brief_example: example, brief_edited: String(edited)});
    const url = URL.createObjectURL(new Blob([prompt], {type: 'text/markdown'}));
    const a = Object.assign(document.createElement('a'), {href: url, download: 'my-business-brief.md'});
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <li className={styles.step}>
        <div className={styles.stepHead}><span className={styles.stepN}>1</span><h3 className={styles.h3}>Describe</h3></div>
        <form className={styles.brief} onSubmit={prepare}>
          <fieldset>
            <legend className={styles.label}>Start from an example</legend>
            <div className={styles.chips}>
              {Object.entries(BUSINESS_EXAMPLES).map(([id, ex]) => (
                <button type="button" className={styles.chip} key={id} aria-pressed={id === example} onClick={() => pick(id)}>{ex.label}</button>
              ))}
            </div>
          </fieldset>
          {pending && (
            <div className={styles.confirm}>
              <p>Replace your text with the <b>{BUSINESS_EXAMPLES[pending].label}</b> example?</p>
              <button type="button" className={clsx(styles.btn, styles.btnSm, styles.btnPrimary)} onClick={() => apply(pending)}>Replace</button>
              <button type="button" className={clsx(styles.btn, styles.btnSm, styles.btnGhost)} onClick={() => setPending(null)}>Keep mine</button>
            </div>
          )}
          <div>
            <label className={styles.label} htmlFor="f-manage">What do you want to manage?</label>
            <input className={styles.input} id="f-manage" value={brief.manage} onChange={(e) => change({manage: e.target.value})} />
          </div>
          <div>
            <label className={styles.label} htmlFor="f-missed">What keeps getting missed?</label>
            <textarea className={styles.input} id="f-missed" rows={2} value={brief.missed} onChange={(e) => change({missed: e.target.value})} />
          </div>
          <div>
            <label className={styles.label} htmlFor="f-team">Who will use it?</label>
            <input className={styles.input} id="f-team" value={brief.team} onChange={(e) => change({team: e.target.value})} />
          </div>
          <details className={styles.more}>
            <summary>Add more detail</summary>
            <div className={styles.moreBody}>
              <fieldset>
                <legend className={styles.label}>Where is your data now?</legend>
                <div className={styles.radios}>
                  {SOURCES.map((s) => (
                    <label key={s.value}>
                      <input type="radio" name="source" value={s.value} checked={brief.source === s.value} onChange={() => change({source: s.value as Source})} /> {s.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <label className={styles.label} htmlFor="f-details">Fields or stages you already know</label>
                <textarea className={styles.input} id="f-details" rows={2} value={brief.details} onChange={(e) => change({details: e.target.value})} />
              </div>
            </div>
          </details>
          <p className={styles.micro}>Your answers stay in this browser. Use a fictional example, not private customer data.</p>
          <button type="submit" className={clsx(styles.btn, styles.btnPrimary)}>Prepare my instructions</button>
        </form>
      </li>
      <li className={clsx(styles.step, styles.stepTwo)}>
        <div className={styles.stepHead}><span className={styles.stepN}>2</span><h3 className={styles.h3}>Open your agent</h3></div>
        <div className={styles.result}>
          {state === 'idle' ? (
            <div className={styles.resultIdle}>
              <Icon name="file-text" />
              <p>Press <b>Prepare my instructions</b> to get the text for your agent. It includes your answers and everything the agent needs to start.</p>
            </div>
          ) : (
            <div className={styles.resultReady}>
              <h4 className={styles.h4} id="brief-ready-title" tabIndex={-1}>Your build instructions</h4>
              <pre className={styles.prompt}>{expanded ? prompt : prompt.split('\n').slice(0, 9).join('\n')}</pre>
              <button type="button" className={styles.linkish} aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>{expanded ? 'Show less' : 'Read the full instructions'}</button>
              <div className={styles.resultActions}>
                <button type="button" className={clsx(styles.btn, styles.btnPrimary)} onClick={copy}><Icon name="clipboard-copy" />Copy build instructions</button>
                <button type="button" className={clsx(styles.btn, styles.btnGhost)} onClick={download}><Icon name="download" />Download my brief</button>
              </div>
              <p className={clsx(styles.status, state === 'copied' && styles.statusOk)} role="status" aria-live="polite">
                {state === 'copied' && 'Instructions copied. Open your agent and paste them into a new conversation in your project folder.'}
                {state === 'manual' && 'Copying is blocked here. Select the text below and copy it.'}
              </p>
              {state === 'copied' && <p className={styles.afterCopy}>Ask it to show you the local app when it’s ready, then connect it and try one operation.</p>}
              {state === 'manual' && (
                <div className={styles.manual}>
                  <label className={styles.sr} htmlFor="brief-fallback">Full build instructions</label>
                  <textarea className={styles.input} id="brief-fallback" readOnly rows={8} value={prompt} onFocus={(e) => e.target.select()} />
                </div>
              )}
            </div>
          )}
          <p className={styles.phoneNote}>Your agent runs on a computer. Copy or download the instructions now and continue there.</p>
        </div>
        <div className={styles.agents}>
          <div className={styles.agentTabs} role="tablist" aria-label="Where to run the instructions">
            <button type="button" role="tab" id="tab-claude" aria-controls="panel-claude" aria-selected={agent === 'claude'} onClick={() => setAgent('claude')}>Claude Code</button>
            <button type="button" role="tab" id="tab-codex" aria-controls="panel-codex" aria-selected={agent === 'codex'} onClick={() => setAgent('codex')}>Codex</button>
          </div>
          {agent === 'claude' ? (
            <ol className={styles.howto} role="tabpanel" id="panel-claude" aria-labelledby="tab-claude">
              <li><span>Install the Claude desktop app and sign in with an account that includes Claude Code. <a href="https://code.claude.com/docs/en/desktop-quickstart" target="_blank" rel="noopener">Setup guide</a></span></li>
              <li><span>Create a folder for the project, for example <code>my-business</code>.</span></li>
              <li><span>Open the Code tab, choose your computer as the environment and pick that folder.</span></li>
              <li><span>Paste the instructions into a new conversation and send them.</span></li>
            </ol>
          ) : (
            <ol className={styles.howto} role="tabpanel" id="panel-codex" aria-labelledby="tab-codex">
              <li><span>Install the ChatGPT desktop app and sign in. <a href="https://learn.chatgpt.com/docs/quickstart" target="_blank" rel="noopener">Setup guide</a></span></li>
              <li><span>Create a folder <code>my-business</code> and open it as your workspace.</span></li>
              <li><span>Choose Codex in the product switcher.</span></li>
              <li><span>Start a conversation in that folder and paste the instructions.</span></li>
            </ol>
          )}
          <p className={styles.micro}>Use your own coding-agent account. Access and usage costs depend on your provider.</p>
          <details className={clsx(styles.more, styles.terminal)}>
            <summary>Prefer the terminal?</summary>
            <p>Run this in your project folder. When the agent opens, paste the build instructions into its prompt.</p>
            <div className={styles.cmds}>
              <p className={styles.cmd}><code>claude</code><CopyButton text="claude" /></p>
              <p className={styles.cmd}><code>codex</code><CopyButton text="codex" /></p>
            </div>
            <p className={styles.micro}>Not installed yet: <a href="https://code.claude.com/docs/en/quickstart" target="_blank" rel="noopener">Claude Code CLI</a> · <a href="https://learn.chatgpt.com/docs/codex/cli" target="_blank" rel="noopener">Codex CLI</a></p>
          </details>
        </div>
      </li>
    </>
  );
}

function Start({variant}: {variant?: BusinessVariant}): JSX.Element {
  return (
    <section className={styles.sec} id="start" aria-labelledby="start-title">
      <div className={styles.wrap}>
        <header className={styles.secHead}>
          <p className={styles.eyebrow}>Start with your agent</p>
          <h2 className={styles.h2} id="start-title">{variant ? variant.cta : 'Describe one part of your business. Your agent builds the rest.'}</h2>
          <p className={styles.lede}>Adjust the example. Copy your instructions. Give them to Claude Code or Codex to build a first version on your computer.</p>
        </header>
        <ol className={styles.steps}>
          <BriefBuilder variant={variant} />
          <li className={styles.step}>
            <div className={styles.stepHead}><span className={styles.stepN}>3</span><h3 className={styles.h3}>Connect and work</h3></div>
            <div className={styles.try}>
              <div>
                <p>Have your agent open the app and connect to it. Try these with the sample records:</p>
                <ul className={styles.daily}>
                  {(variant?.prompts ?? DAILY_PROMPTS).slice(0, 3).map((text) => (
                    <li key={text}><span>{text}</span><CopyButton text={text} /></li>
                  ))}
                </ul>
              </div>
              <Shot
                bar="northstar.app/settings/agents"
                screen="business-connections"
                wide={[960, 560]}
                narrow={[420, 600]}
                title="Connect agent"
                alt="The Agents settings page with the Connect agent button and one row per connected agent."
              />
            </div>
            <p className={styles.note}>Each teammate connects their own agent from their own account. A revoked connection stops on the agent’s next request.</p>
          </li>
        </ol>
      </div>
    </section>
  );
}

function Faq(): JSX.Element {
  return (
    <section className={clsx(styles.sec, styles.band)} id="faq" aria-labelledby="faq-title">
      <div className={clsx(styles.wrap, styles.faqGrid)}>
        <header className={clsx(styles.secHead, styles.faqHead)}>
          <p className={styles.eyebrow}>Questions</p>
          <h2 className={styles.h2} id="faq-title">What it costs and who looks after it.</h2>
          <div className={styles.costs}>
            <div><h3 className={styles.h4}>Free</h3><ul><li>The AdminForth framework: MIT license, no paid tiers</li><li>The 30-minute call about your process</li></ul></div>
            <div><h3 className={styles.h4}>Paid separately</h3><ul><li>Your coding-agent subscription and model usage</li><li>Hosting for your app and database</li><li>Paid services you connect</li></ul></div>
          </div>
        </header>
        <div className={styles.qa}>
          {FAQ.map((item) => (
            <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Consultation(): JSX.Element {
  const {withBaseUrl} = useBaseUrlUtils();
  return (
    <section className={styles.sec} id="consultation" aria-labelledby="con-title">
      <div className={styles.wrap}>
        <div className={styles.consultCard}>
          <div className={styles.host}>
            <img src={withBaseUrl('/img/ivan-borshchov.jpg')} alt="Ivan Borshchov" width={96} height={96} />
            <p><b>Talk through your workflow with Ivan Borshchov</b><span>Maintainer of AdminForth</span></p>
          </div>
          <div className={styles.consultBody}>
            <h2 className={clsx(styles.h2, styles.consultTitle)} id="con-title">Bring one messy process. Let’s map a better way to run it.</h2>
            <p>Show us where work gets stuck. We’ll help you choose a small first app and see whether AdminForth fits.</p>
            <ul className={styles.topics}>
              <li>What should your agents and your team be able to do?</li>
              <li>Which part could you build first?</li>
              <li>What would hosting, integrations and ongoing support involve?</li>
            </ul>
            <a className={clsx(styles.btn, styles.btnPrimary)} href={BOOKING_URL} target="_blank" rel="noopener"><Icon name="calendar" />Book a free 30-minute call</a>
            <p className={styles.micro}>Bring a description of one process or an anonymized example. The consultation is free; implementation and hosting are separate.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer(): JSX.Element {
  return (
    <footer className={styles.foot}>
      <div className={clsx(styles.wrap, styles.footIn)}>
        <p className={styles.brand}><BrandMark />AdminForth <span>Admin, forth. An open-source framework by Devforth</span></p>
        <nav className={styles.footLinks} aria-label="More">
          <Link to="/docs/tutorial/gettingStarted/">Documentation</Link>
          <Link to="/">For developers</Link>
          <a href={GITHUB_URL} target="_blank" rel="noopener">View source</a>
        </nav>
      </div>
    </footer>
  );
}

export default function Business(): JSX.Element {
  const location = useLocation();
  const [variant, setVariant] = useState<BusinessVariant>();
  useEffect(() => setVariant(businessVariant(new URLSearchParams(location.search).get('utm_campaign'))), [location.search]);
  return (
    <div className={styles.page} id="top" data-landing-variant={variant?.id ?? 'general'}>
      <Head>
        <title>{PAGE_TITLE} · AdminForth</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS_URL} />
      </Head>
      <Header />
      <main>
        <Hero variant={variant} />
        {variant ? <ProcessWorkflow variant={variant} /> : <Workflow />}
        <Start key={variant?.id ?? 'general'} variant={variant} />
        <Pains />
        {!variant && <Pillars />}
        <Faq />
        <Consultation />
      </main>
      <Footer />
    </div>
  );
}
