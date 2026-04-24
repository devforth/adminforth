
# AGENTS.md

## Package manager

All packages and projects in this repo use `pnpm` and not `npm`. 
Howeverer internally (e.g. in `codeInjector`) adminforth still supports both `npm` and `pnpm` style install commands, so users of framework itself can use it with either package manager. But in all dev demo/live demo, plugins, adapters, and documentation, we use `pnpm` as the standard.

## Package names rules


All adapters and plugins always have `@adminforth/` prefix in their package name, followed by short lowercase kebab-case plugin/adpater slug.

Every plugin has at least one Docusaurus docs page, which should use the path `/docs/tutorial/Plugins/<plugin-slug>/`.

Same for adapters, but with `/docs/tutorial/Adapters/<adapter-slug>/` path.

Page names in docusarus should be human readabale. We should not use `AuditLog` but instead we should have `Audit Log` via whitespace.


## General engineering rules

Write code as if the system contracts are already defined and trusted.

Do not add defensive checks “just in case” when the contract, type, schema, backend response, or controlled internal API already guarantees the shape of the data.

Prefer simplicity, clarity, and consistency over paranoia.

Follow these principles strictly:

- DRY
- SOLID
- YAGNI
- Keep code minimal
- Trust typed contracts
- Avoid duplicate validation
- Avoid speculative fallback logic
- Avoid inline regex literals when reused or non-trivial

---

## Trust the contract

If backend and frontend are part of the same system, and the backend explicitly guarantees a response shape, do **not** re-validate every field on the frontend.

Bad:
- backend returns a strict object
- frontend then checks every field for `undefined`, wrong type, empty string, wrong enum, etc.
- frontend adds fallback branches for impossible states

Good:
- backend owns validation
- shared types or schemas define the contract
- frontend consumes the contract directly
- frontend only handles real UI states, not imaginary protocol corruption

Do not treat trusted internal responses as untrusted external input.

Only add extra runtime validation when:
- data comes from a truly external/untrusted source
- the contract is unknown or unstable
- there is an explicit requirement for hardening
- security boundaries require validation
- corrupted legacy data is known to exist in production

If none of the above is true, do not add redundant guards.

---

## No duplicate validation

Validation must live in one clear place.

Prefer this order:
1. Boundary validation
2. Domain validation
3. UI rendering without re-checking the same invariants

Examples:
- Validate request payload on the backend boundary
- Validate forms at form/input level
- Validate DB input before persistence if needed
- Do not re-check the same rule again deeper in the stack unless there is a real new boundary

If a field is already guaranteed by type/schema/backend, do not validate it again in consumers.

---

## Frontend rules

When rendering data from a trusted backend:
- do not check every property manually
- do not write `if (!obj || !obj.a || !obj.b || !obj.c)` chains for guaranteed objects
- do not silently swallow impossible states
- do not invent fallback values for required fields unless product requirements explicitly ask for fallback UI

Prefer:
- strong TypeScript types
- narrow, explicit UI states
- a small number of meaningful guards at actual boundaries

Allowed:
- loading state
- not-found state
- permission-denied state
- explicitly documented optional fields

Not allowed:
- repetitive property-by-property paranoia checks for required response fields

---

## Backend rules

Backend should enforce the contract once, clearly and centrally.

- Validate incoming external input at the boundary
- Normalize data once
- Return stable, typed responses
- Do not scatter the same checks across controllers, services, and callers
- Do not add branches for impossible states without evidence

When a response format is defined, keep it strict and predictable so consumers do not need defensive coding.

---

## Regex rules

Do not inline non-trivial regexes directly inside business logic.

Bad:
- inline regex literals scattered through the codebase
- repeating the same regex multiple times
- unreadable regex embedded inside conditions

Good:
- define regex once as a named constant
- place reusable regexes in a dedicated constants/module file
- give regexes semantic names
- compile once when appropriate

Example:
- `const EMAIL_RE = /.../`
- `const SLUG_RE = /.../`
- `const STRIP_HTML_RE = /.../g`

If regex is used more than once or is not instantly obvious, extract it.

---

## No speculative coding

Do not add code for hypothetical scenarios unless they are documented requirements or known production realities.

Avoid:
- “in case backend changes”
- “in case this field comes null someday”
- “in case this enum gets other values”
- “in case this internal method returns something unexpected”

If such a risk is real, document it and solve it at the right boundary, not everywhere.

---

## Error handling

Error handling must be intentional, not reflexive.

Handle:
- real network failures
- documented optionality
- known domain errors
- permission/auth errors
- user-caused invalid input
- external system failures

Do not handle:
- impossible states already excluded by the contract
- contradictions to compile-time types without evidence
- redundant field-level checks for trusted internal data

For impossible states, prefer failing loudly in development rather than hiding the issue with fallback logic.

---

## Code review rules for agents

Before writing extra guards, ask:

1. Is this input external and untrusted?
2. Is this invariant already guaranteed by types/schema/backend?
3. Am I repeating validation that already exists elsewhere?
4. Is this a real production case or just imagination?
5. Would this code make the system clearer, or only noisier?

If the invariant is already guaranteed, do not add the guard.

---

## Preferred style

Prefer:
- shared types
- schema-driven boundaries
- single-source-of-truth validation
- concise functions
- explicit contracts
- named helpers/constants
- reusable compiled regex constants

Avoid:
- defensive clutter
- repeated null/undefined chains for required fields
- duplicated business rules
- inline complicated regex
- fallback-on-fallback logic
- broad “safety” code without a concrete reason

---

## Decision rule

When choosing between:
- trusting a well-defined internal contract
- or adding more defensive checks

choose trusting the contract, unless there is a clear boundary, documented risk, or real evidence that extra validation is needed.

Less code, fewer duplicate checks, clearer ownership.
