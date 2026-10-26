import {EXAMPLES, type Brief} from './_brief';

export const LANDING_VERSION = 'business-2026-10-26-v1';

export type BusinessVariant = {
  id: string;
  campaign: string;
  label: string;
  heading: string;
  description: string;
  cta: string;
  recordType: string;
  records: {id: string; name: string; stage: string; owner: string; due: string; attention?: boolean}[];
  question: string;
  answer: string;
  operation: string;
  result: string;
  brief: Brief;
  prompts: string[];
};

export const BUSINESS_VARIANTS: BusinessVariant[] = [
  {
    id: 'spreadsheet', campaign: 'business_sheet_to_app', label: 'Spreadsheet to business app',
    heading: 'Your business has outgrown the spreadsheet.',
    description: 'Turn your spreadsheet process into your own app. Your coding agent builds it with AdminForth: shared records, clear owners and next steps.',
    cta: 'Start my business app', recordType: 'Customer orders',
    records: [
      {id: 'ORD-1042', name: 'Harbor Café · equipment order', stage: 'Needs follow-up', owner: 'Maya', due: 'Yesterday', attention: true},
      {id: 'ORD-1043', name: 'Atlas Office · supplies', stage: 'Preparing', owner: 'Tom', due: 'Today'},
      {id: 'ORD-1044', name: 'Brightside School · replacement parts', stage: 'Ready to deliver', owner: 'Priya', due: 'Tomorrow'},
    ],
    question: 'Which orders need a next action today?',
    answer: 'Harbor Café’s order is overdue. Maya owns it. No next action.',
    operation: 'Ask Maya to confirm the delivery date today.',
    result: 'Saved on the order. Everyone sees the same next step.',
    brief: {...EXAMPLES.orders, manage: 'The customer and order process we currently run in a spreadsheet'},
    prompts: ['Which orders need a next action today?', 'Show the customer, owner and current stage for ORD-1042.', 'Ask Maya to confirm the delivery date today.', 'Show orders with missing owners or dates.', 'Who last changed the stage of ORD-1042?'],
  },
  {
    id: 'followups', campaign: 'business_quote_followups', label: 'Customer follow-ups',
    heading: 'Quotes sent. Follow-ups forgotten?',
    description: 'A good quote should not die in a spreadsheet. Build your own follow-up app with AdminForth and your coding agent. Every quote gets an owner and a next step.',
    cta: 'Start my follow-up app', recordType: 'Quote follow-ups',
    records: [
      {id: 'REQ-1042', name: 'Harbor Café · maintenance quote', stage: 'Follow-up overdue', owner: 'Maya', due: 'Yesterday', attention: true},
      {id: 'REQ-1043', name: 'Atlas Office · service proposal', stage: 'Call scheduled', owner: 'Tom', due: 'Today'},
      {id: 'REQ-1044', name: 'Brightside School · inspection quote', stage: 'Awaiting reply', owner: 'Priya', due: 'Tomorrow'},
    ],
    question: 'Which quotes have overdue follow-ups, and whose are they?',
    answer: 'Harbor Café’s quote is overdue for a follow-up. Owner: Maya.',
    operation: 'Maya: call Harbor Café today at 14:00.',
    result: 'The call and due time are saved on the quote.',
    brief: EXAMPLES.followups,
    prompts: ['Which quotes have overdue follow-ups, and whose are they?', 'Show quotes waiting for a reply with no next action.', 'Maya: call Harbor Café today at 14:00.', 'Which customers does Tom need to contact today?', 'Show the last change to REQ-1042.'],
  },
  {
    id: 'live_records', campaign: 'business_live_records', label: 'Live business records',
    heading: 'Stop uploading yesterday’s business data to AI.',
    description: 'Still exporting files for AI, then copying changes back? Build an AdminForth app your agent can read and update directly, with your team’s access rules.',
    cta: 'Start my connected app', recordType: 'Live business records',
    records: [
      {id: 'REQ-1042', name: 'Harbor Café · service request', stage: 'Next action missing', owner: 'Maya', due: 'Today', attention: true},
      {id: 'REQ-1043', name: 'Atlas Office · site visit', stage: 'Visit confirmed', owner: 'Tom', due: 'Tomorrow'},
      {id: 'REQ-1044', name: 'Brightside School · inspection', stage: 'Quote sent', owner: 'Priya', due: 'Thursday'},
    ],
    question: 'Read my current requests. Which ones have no next action?',
    answer: 'Harbor Café’s request has no next action. Owner: Maya.',
    operation: 'Maya: confirm the visit time today.',
    result: 'Saved in your app. Your team and agent see the update.',
    brief: {...EXAMPLES.followups, missed: 'I keep exporting a spreadsheet to AI and copying changes back. I want my agent to read and update the same current records my team uses.', details: 'Build customer requests with owner, status, next action and due date. Connect my agent through MCP. Show a permitted update and an action refused by the server.'},
    prompts: ['Read my current requests. Which ones have no next action?', 'Show the current record for REQ-1042.', 'Maya: confirm the visit time today.', 'Read REQ-1042 again and show the saved next action.', 'Show the audit log for that update.'],
  },
  {
    id: 'repairs', campaign: 'business_repair_status', label: 'Repair workshop',
    heading: '“Is my repair ready?” Know before they call.',
    description: 'Stop searching spreadsheets when a customer calls. Build a repair tracker with AdminForth and your coding agent: what’s stuck, who owns it, what happens next.',
    cta: 'Start my repair tracker', recordType: 'Repairs',
    records: [
      {id: 'REP-1042', name: 'Espresso machine · pump replacement', stage: 'Waiting for part', owner: 'Maya', due: 'Yesterday', attention: true},
      {id: 'REP-1043', name: 'Office printer · paper feed', stage: 'In repair', owner: 'Tom', due: 'Today'},
      {id: 'REP-1044', name: 'Vacuum cleaner · motor check', stage: 'Ready to collect', owner: 'Priya', due: 'Tomorrow'},
    ],
    question: 'Which repairs are late, and what is blocking them?',
    answer: 'Espresso machine: overdue, waiting for a pump. Owner: Maya.',
    operation: 'Maya: check the pump delivery today at 14:00.',
    result: 'The part check is saved on the repair, with a due time.',
    brief: {
      manage: 'Repair jobs in my workshop, from intake to collection',
      missed: 'Repair status and missing parts are spread across spreadsheets and messages. Customers call before we notice a job is late.',
      team: 'I manage the workshop; technicians update their assigned repairs; the front desk checks status and collection dates',
      source: 'spreadsheet',
      details: 'Each repair needs a customer, item, issue, technician, status, promised date, missing part and next action. Start with intake, diagnosis, waiting for parts, in repair and ready to collect.',
    },
    prompts: ['Which repairs are overdue, and what is blocking each one?', 'Show repairs waiting for parts, with their owners.', 'Set the next action for REP-1042: check the pump delivery today at 14:00.', 'Which repairs are ready for collection?', 'Show who changed the promised date of REP-1042.'],
  },
  {
    id: 'production', campaign: 'business_production_orders', label: 'Small production team',
    heading: 'Spot a late order before your customer does.',
    description: 'Sales promised Friday. Production is still waiting. Build one order tracker with AdminForth and your coding agent, so both teams see the same stages and dates.',
    cta: 'Start my order tracker', recordType: 'Production orders',
    records: [
      {id: 'ORD-2081', name: 'Oak display shelves · 12 units', stage: 'Waiting for finish', owner: 'Maya', due: 'Tomorrow', attention: true},
      {id: 'ORD-2082', name: 'Counter signs · 30 units', stage: 'In production', owner: 'Tom', due: 'Thursday'},
      {id: 'ORD-2083', name: 'Display stands · 8 units', stage: 'Ready to ship', owner: 'Priya', due: 'Today'},
    ],
    question: 'Which orders are due tomorrow but not ready to ship?',
    answer: '12 oak shelves: due tomorrow, still waiting for finishing.',
    operation: 'Maya: confirm the finishing slot today at 11:00.',
    result: 'Sales and production can see the next action on the order.',
    brief: {
      manage: 'Customer orders through our small production team, from quote to shipment',
      missed: 'Sales promises a delivery date, but production stages live in separate spreadsheets. We notice delays when customers ask.',
      team: 'I see all orders; sales manages customer details and dates; production updates stages; dispatch updates shipment details',
      source: 'spreadsheet',
      details: 'Track customer, ordered items, quantity, production stage, owner, promised date, blocker, next action and shipment status. Begin with confirmed, materials, in production, finishing, ready to ship and shipped.',
    },
    prompts: ['Which orders are due tomorrow but not ready to ship?', 'Show orders with a blocker and no next action.', 'Add a finishing-slot check for ORD-2081, owned by Maya, due today at 11:00.', 'Which orders are ready for dispatch today?', 'Show the change history for the delivery date of ORD-2081.'],
  },
  {
    id: 'field_service', campaign: 'business_field_jobs', label: 'Field service team',
    heading: 'Job booked. But who’s going?',
    description: 'Jobs in messages. Assignments in a spreadsheet. Build one job tracker with AdminForth and your coding agent, so every visit has an owner and a next step.',
    cta: 'Start my job tracker', recordType: 'Service jobs',
    records: [
      {id: 'JOB-3017', name: 'Harbor Café · cold room inspection', stage: 'Needs assignment', owner: 'Unassigned', due: 'Tomorrow', attention: true},
      {id: 'JOB-3018', name: 'Brightside School · ventilation', stage: 'Visit scheduled', owner: 'Tom', due: 'Today'},
      {id: 'JOB-3019', name: 'Atlas Office · pump maintenance', stage: 'Follow-up needed', owner: 'Priya', due: 'Thursday'},
    ],
    question: 'Which jobs for tomorrow still have nobody assigned?',
    answer: 'Harbor Café’s inspection is tomorrow. Nobody is assigned.',
    operation: 'Assign Maya. Ask her to confirm the visit time.',
    result: 'Maya now owns the job. The office can see the next step.',
    brief: {
      manage: 'Service requests and site visits for my field team',
      missed: 'Jobs arrive in messages and a spreadsheet. We lose track of who is going, what is unfinished and who should follow up.',
      team: 'I manage all work; the office assigns jobs and schedules visits; technicians see and update only their assigned jobs',
      source: 'spreadsheet',
      details: 'A job needs a customer, site, request, priority, owner, visit date, status, visit notes and next action. Start with new, assigned, scheduled, on site, follow-up needed and completed. Do not build automatic dispatch or route optimisation.',
    },
    prompts: ['Which jobs for tomorrow still have nobody assigned?', 'Show unfinished visits with no next action.', 'Assign JOB-3017 to Maya and add a visit confirmation as the next action.', 'What does Tom need to finish today?', 'Show who changed the status of JOB-3017.'],
  },
];

export function businessVariant(campaign: string | null): BusinessVariant | undefined {
  return BUSINESS_VARIANTS.find((variant) => variant.campaign === campaign);
}
