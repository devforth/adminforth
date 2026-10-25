// The brief builder of the business landing: examples, the data source labels and the build instructions
// for the visitor's coding agent. No network, the page fills a template with the visitor's answers.

export type Source = 'spreadsheet' | 'app' | 'none' | 'unsure';

export type Brief = {manage: string; missed: string; team: string; source: Source; details: string};

export const EXAMPLES: Record<string, {label: string} & Brief> = {
  followups: {
    label: 'Customer follow-ups',
    manage: 'Customer requests for my maintenance business',
    missed: 'We send quotes and forget to follow up',
    team: 'Me and two managers; each manager handles their own requests',
    source: 'spreadsheet',
    details: 'A request needs a customer, owner, status, next action and due date.',
  },
  orders: {
    label: 'Order tracking',
    manage: 'Customer orders, from quote to delivery',
    missed: 'Nobody sees which orders are late until the customer calls',
    team: 'Me, a sales manager and two people in the warehouse; the warehouse only updates delivery status',
    source: 'spreadsheet',
    details: 'An order has a customer, items, total, status, delivery date and the person responsible.',
  },
  internal: {
    label: 'Internal requests',
    manage: 'Internal requests: equipment, access and purchases',
    missed: 'Requests sit in chat and nobody knows who approved what',
    team: 'Everyone can submit; two managers approve; finance sees approved purchases',
    source: 'none',
    details: 'A request has a requester, type, amount, approver, status and decision date.',
  },
  own: {label: 'My own process', manage: '', missed: '', team: '', source: 'unsure', details: ''},
};

export const SOURCES: {value: Source; label: string; prompt: string}[] = [
  {value: 'spreadsheet', label: 'Spreadsheet', prompt: 'A spreadsheet. Start this example with synthetic data.'},
  {value: 'app', label: 'Existing app or database', prompt: 'An existing app or database. Start this example with synthetic data and describe how it would connect later.'},
  {value: 'none', label: 'Starting fresh', prompt: 'Nothing yet. Start with synthetic data.'},
  {value: 'unsure', label: 'Not sure', prompt: 'Not sure. Start this example with synthetic data.'},
];

export const DAILY_PROMPTS = [
  'What needs my attention today?',
  'Which follow-ups are overdue, and whose?',
  'Add a request from Harbor Café: office maintenance quote. Owner Maya, next action: send the quote by Friday.',
  'Create a follow-up for Priya: call Brightside School tomorrow at 9.',
  'Which invoices are unpaid for more than 30 days?',
];

export function buildPrompt(b: Brief): string {
  const source = SOURCES.find((s) => s.value === b.source).prompt;
  return `Help me build a small business application with AdminForth. Work with me in
plain language. I don't have a developer: tell me exactly what to do myself,
step by step.

MY BUSINESS BRIEF
BUSINESS_PROCESS: ${b.manage || 'Describe it with me before you start.'}
CURRENT_PROBLEM: ${b.missed || 'Ask me what keeps getting missed.'}
TEAM_ACCESS: ${b.team || 'Ask me who will use it and what each person may change.'}
CURRENT_DATA: ${source}
EXTRA_DETAILS: ${b.details || 'None yet. Suggest a sensible first set of fields and stages.'}

WHAT I WANT
A web app on AdminForth that my agent and my team's agents work with through
MCP, with sign-in, permissions and an audit log. I will mostly talk to it
through my agent; screens are for checking. Keep the first version small and
ready for more parts later (orders, jobs, stock, invoices).

START HERE
Read https://adminforth.dev/docs/tutorial/gettingStarted/ and
https://adminforth.dev/llms.txt first. Use AdminForth as the framework: reuse
its screens, forms, filters and access rules, don't build a separate stack.
Use pnpm and Node.js 24. For a new local example use SQLite, the documented
create-app flow and Prisma migrations. Read the generated AGENTS.md, CLAUDE.md
and skills before changing anything. If something can't run here, tell me what
I must do instead of pretending it works.

Show me a short plain-language outline (records, roles, the first operation)
and ask only about decisions that change the data or the access rules.

BUILD
1. Records and relationships for my process, named so my team understands
   them, with a small set of fictional sample records.
2. Access rules on the server: I manage everything; every other person works
   only with what their role allows, including direct record requests, lists
   and relationships. A hidden button is not an access rule.
3. The MCP plugin (https://adminforth.dev/docs/tutorial/Plugins/mcp/) so I can
   connect my agent, and the Audit Log plugin
   (https://adminforth.dev/docs/tutorial/Plugins/audit-log/) with its
   executed-by column, so every change names the person and the agent.
4. No production data, emails or payments in this first version.

SHOW ME
Run the app and give me the local address and sign-in. Connect my agent with
the command from the Agents settings page, then do one operation through the
agent: find a record that needs attention, add its next action, and show me the
audit log entry. Show one action my agent is allowed and one a teammate's agent
would be refused. Say which checks you actually performed.

Write five prompts for my daily work with this app, in the words of my process.
Explain where the code and data are, how to reopen the app tomorrow, how to
update AdminForth and its plugins later, and what remains before my team uses
it: hosting, real data, backups, access review.
`;
}
