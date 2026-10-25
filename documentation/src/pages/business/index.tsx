import {useState, type FormEvent, type ReactNode} from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import {useBaseUrlUtils} from '@docusaurus/useBaseUrl';
import clsx from 'clsx';
import styles from './business.module.css';
import {buildPrompt, DAILY_PROMPTS, EXAMPLES, SOURCES, type Brief, type Source} from './_brief';

// The business landing (/business/) for founders who run their business with AI agents. It has its own
// header instead of the docs navbar, so it is not wrapped in the theme Layout. The screens are the drawn
// pages of static/landing-previews, pinned to the dark theme.

const PAGE_TITLE = 'Run your business with agents, on data you control';
const PAGE_DESCRIPTION = 'Agent-first business admin. Your coding agent builds the admin your business runs on: your data in your own database, sign-in, team permissions and a change history that names the agent. Open-source AdminForth, no development team needed.';
const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,500..800&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap';
const BOOKING_URL = 'https://talk.devforth.io/book/30-minute-meeting';
const GITHUB_URL = 'https://github.com/devforth/adminforth';

const PAINS = [
  {
    was: '“My customers and orders live in chats and spreadsheets. The agent can’t reach them, or reaches them with no control.”',
    title: 'One back office, one locked door.',
    body: 'Your data in your own database. Every agent connects with its own key, under one person’s permissions.',
  },
  {
    was: '“An app my agent generated is a hole waiting to be found.”',
    title: 'The security parts come from a maintained framework.',
    body: 'Sign-in, sessions, two-factor, permissions, audit: not generated once and forgotten. One framework, maintained by us.',
  },
  {
    was: '“If my team’s agents can change anything, who stops a wrong change?”',
    title: 'Rules on the server, for people and agents alike.',
    body: 'A manager’s agent sees the manager’s requests. Nothing else, no matter how it asks.',
  },
  {
    was: '“An agent changed something and nobody knows what.”',
    title: 'A change history that names the agent.',
    body: 'Who, when, through which agent, old value and new value.',
  },
  {
    was: '“I don’t have developers, and I don’t want to depend on one.”',
    title: 'Your agent builds it. You own it.',
    body: 'Open source, MIT, your server. The next change is a sentence to your agent.',
  },
];

const FAQ = [
  {
    q: 'Do I need a developer?',
    a: 'No. You describe the work, your agent writes the code on AdminForth, and you check the result in the browser. You still decide when a change is ready for your team. Hosting and backups are set up with the agent, and you own them.',
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

function Hero(): JSX.Element {
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
          <p className={styles.lede}>Your coding agent builds the admin on AdminForth: customers, orders, jobs and money in your own database, with sign-in, team permissions and a change history that names the agent. Then you and your team work through Claude Code, Codex or any agent that speaks MCP. Screens are there when you want to look.</p>
          <div className={styles.cta}>
            <a className={clsx(styles.btn, styles.btnPrimary)} href="#start">Build it with my agent</a>
            <a className={clsx(styles.btn, styles.btnGhost)} href="#workflow">See it work</a>
          </div>
          <p className={styles.note}>No development team. Open source, MIT, on your server.</p>
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
          <h2 className={styles.h2} id="why-title">Your agents can already do the work. This is what keeps it safe.</h2>
        </header>
        <div className={styles.pillars}>
          <div className={styles.pillar}>
            <div className={styles.pillarText}>
              <p className={styles.n}>01 · Security</p>
              <h3 className={styles.h3}>Your data stays yours, and stays patched.</h3>
              <p>Your records live in your own database on your server. Agents get in through one locked door: sign-in, a separate key per agent that you can revoke, two-factor and passkeys for people.</p>
              <p>The parts you can’t review yourself come from AdminForth, one framework our team maintains. Security fixes ship with its updates. Updating is a version bump your agent runs; skills tell it how.</p>
              <div className={styles.alert}>
                <b>8 of the 10 biggest months for software vulnerabilities ever recorded happened in 2026.</b>
                <span>One in five of all vulnerabilities ever registered were published this year, and the year isn’t over. Exploitation in the wild nearly doubled. An app your agent generated last month, with hundreds of packages nobody updates, sits right in that path. AdminForth, one framework maintained by our team, doesn’t.</span>
                <span className={styles.src}>
                  <a href="https://craci.com/resources/CVE-publication-trends" target="_blank" rel="noopener">CVE publications by month</a> · <a href="https://cvetodo.com/cve-statistics" target="_blank" rel="noopener">2026 CVE count</a> · <a href="https://cloud.google.com/blog/topics/threat-intelligence/vulnerability-discovery-and-exploitation-trends-in-the-ai-era" target="_blank" rel="noopener">Google Threat Intelligence, Oct 2026</a>
                </span>
              </div>
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
              <h3 className={styles.h3}>Everyone works inside your rules, and you see who did what.</h3>
              <p>Your team uses agents too, on the same records. Each person, and each of their agents, sees and changes only what their role allows. The server checks every request, from a browser or from an agent.</p>
              <p>The audit log names the person and the agent for every change. When something looks wrong, you know who, when, through what, and what it was before.</p>
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
              <p>The admin is where your business is administered: records, rules, access, history. The panel is one way in; your agent is another. Most days you won’t click through forms: you ask, the agent does it. The screens and dashboards are still there, for the overview, for a teammate who prefers them, and for checking what the agent did.</p>
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
          <h2 className={styles.h2} id="pains-title">What stops a founder from letting agents run the business.</h2>
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

function Equation(): JSX.Element {
  return (
    <section className={styles.sec} aria-labelledby="eq-title">
      <div className={styles.wrap}>
        <header className={styles.secHead}>
          <p className={styles.eyebrow}>How it gets built</p>
          <h2 className={styles.h2} id="eq-title">You don’t need a development team. You need these three.</h2>
        </header>
        <ol className={styles.eq}>
          <li className={styles.eqPart}>
            <span className={styles.eqIcon}><Icon name="user" /></span>
            <h3 className={styles.h3}>You</h3>
            <p>Describe the work in plain words: what you track, who does what, what keeps slipping. Check the result in your browser.</p>
          </li>
          <li className={styles.eqOp} aria-hidden="true">+</li>
          <li className={styles.eqPart}>
            <span className={styles.eqIcon}><Icon name="bot" /></span>
            <h3 className={styles.h3}>Your AI agent</h3>
            <p>Claude Code or Codex writes the code, runs the app and connects itself to it. Afterwards it is how you work with the data.</p>
          </li>
          <li className={styles.eqOp} aria-hidden="true">+</li>
          <li className={styles.eqPart}>
            <span className={styles.eqIcon}><BrandMark /></span>
            <h3 className={styles.h3}>AdminForth</h3>
            <p>The maintained foundation: sign-in, permissions, audit log, MCP, record screens. One framework and its plugins, maintained by us.</p>
          </li>
          <li className={styles.eqOp} aria-hidden="true">=</li>
          <li className={clsx(styles.eqPart, styles.eqResult)}>
            <span className={styles.eqIcon}><Icon name="layout-dashboard" /></span>
            <h3 className={styles.h3}>Your business admin</h3>
            <p>Your records, your rules, your server. Agents and people work in it; the history shows who did what.</p>
          </li>
        </ol>
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

function BriefBuilder(): JSX.Element {
  const [example, setExample] = useState('followups');
  const [brief, setBrief] = useState<Brief>(() => {
    const {label: _label, ...fields} = EXAMPLES.followups;
    return fields;
  });
  const [edited, setEdited] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [state, setState] = useState<ResultState>('idle');
  const [expanded, setExpanded] = useState(false);
  const [agent, setAgent] = useState<'claude' | 'codex'>('claude');
  const prompt = buildPrompt(brief);

  const apply = (id: string) => {
    const {label: _label, ...fields} = EXAMPLES[id];
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
    setState('ready');
    document.getElementById('brief-ready-title')?.focus();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setState('copied');
    } catch {
      setState('manual');
    }
  };
  const download = () => {
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
              {Object.entries(EXAMPLES).map(([id, ex]) => (
                <button type="button" className={styles.chip} key={id} aria-pressed={id === example} onClick={() => pick(id)}>{ex.label}</button>
              ))}
            </div>
          </fieldset>
          {pending && (
            <div className={styles.confirm}>
              <p>Replace your text with the <b>{EXAMPLES[pending].label}</b> example?</p>
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
          <p className={styles.micro}>Describe the process without customer names, passwords or account details. Nothing is sent anywhere: the page fills in a template.</p>
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

function Start(): JSX.Element {
  return (
    <section className={styles.sec} id="start" aria-labelledby="start-title">
      <div className={styles.wrap}>
        <header className={styles.secHead}>
          <p className={styles.eyebrow}>Start with your agent</p>
          <h2 className={styles.h2} id="start-title">Describe one part of your business. Your agent builds the rest.</h2>
          <p className={styles.lede}>Fill in three lines, copy the build instructions, and give them to Claude Code or Codex in a project folder on your computer. The instructions include MCP and the audit log from day one.</p>
        </header>
        <ol className={styles.steps}>
          <BriefBuilder />
          <li className={styles.step}>
            <div className={styles.stepHead}><span className={styles.stepN}>3</span><h3 className={styles.h3}>Connect and work</h3></div>
            <div className={styles.try}>
              <div>
                <p>The agent builds the first part with sample data, runs the app and connects itself to it. From then on you talk to your business. Prompts for the first day, with the example above:</p>
                <ul className={styles.daily}>
                  {DAILY_PROMPTS.map((text) => (
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
            <p>Book a free 30-minute consultation about your business workflow. We’ll discuss what you track today, where work gets stuck, and whether an admin built on AdminForth is a good fit.</p>
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
  return (
    <div className={styles.page} id="top">
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
        <Hero />
        <Pillars />
        <Pains />
        <Equation />
        <Workflow />
        <Start />
        <Faq />
        <Consultation />
      </main>
      <Footer />
    </div>
  );
}
