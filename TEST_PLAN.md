# PMS Prototype — Testing & UAT Strategy

**Target app:** React 19 SPA prototype (Login, Dashboard, Properties, Work Orders, Compliance Vault, Assets, Floor Plan, Reports, Settings)
**Stack:** React 19.2 · Vite 8.2 · @vitejs/plugin-react 6.0 · plain JS (no TS) · Context state management · inline styles · static seed data (`src/data/constants.js`) · i18n EN/ZH
**Roles:** SSD Centre Admin, Centre OIC, Service Manager, SSD AS, SSD G&C, PWD Officer
**Document date:** 2026-08-24 · All package versions verified against npm registry on this date.

---

## 1. Recommended Testing Stack

### 1.1 Decision summary

| Layer | Tool | Why |
|---|---|---|
| Unit / Integration (components, contexts, logic) | **Vitest 4.1 + Testing Library + jsdom** | Native Vite 8 sharing (one transform pipeline, one config), fast, Jest-compatible API |
| DOM environment | **jsdom 30** (primary) | Best ARIA/accessibility-tree fidelity (Testing Library queries rely on it); happy-dom 20 acceptable speed alternative |
| E2E / UAT automation | **Playwright 1.62 (`@playwright/test`)** | Multi-browser, trace viewer, built-in parallelism/retries, zero-friction Vite integration (just points at dev server), active Vite-8-era development. Cypress 15.21 works for pure E2E but its component-testing layer only gained Vite 8 support in 15.14 (April 2026) and had a headed-mode double-registration bug until 15.15 — Playwright avoids that churn entirely |
| Assertions (DOM) | **@testing-library/jest-dom 7** | `toBeInTheDocument()`, `toHaveAccessibleName()` etc. |
| Interaction simulation | **@testing-library/user-event 14** | Realistic event sequences (fireEvent skips focus/input pipelines) |
| Coverage | **@vitest/coverage-v8 4.1** | Must match Vitest minor version exactly |

> **Hard constraint:** Vitest **≥ 4.1.0** is required for Vite 8. Vitest 4.0.x declares `@vitest/mocker` with a `vite: ^6 || ^7` peer range and will fail `npm install` (ERESOLVE) against Vite 8. Vite 8 support landed in Vitest 4.1 (released 2026-03-12).

### 1.2 Exact packages (install command)

```bash
npm install -D \
  vitest@^4.1.11 \
  @vitest/coverage-v8@^4.1.11 \
  jsdom@^30.0.1 \
  @testing-library/react@^16.3.2 \
  @testing-library/dom@^10.4.1 \
  @testing-library/user-event@^14.6.6 \
  @testing-library/jest-dom@^7.0.1 \
  @playwright/test@^1.62.1
npx playwright install chromium
```

Notes on versions:
- `@testing-library/dom` **must be installed explicitly** — since RTL v16 it is a peer dependency, not bundled.
- Do **not** install `react-test-renderer` or `@testing-library/react-hook`; both are obsolete/deprecated for React 19 (`renderHook` ships in RTL 16).
- Optional later additions: `msw` (only once real APIs exist), `vitest-browser-react` (Vitest stable Browser Mode — good middle layer for visual component tests in real Chromium without full E2E).

### 1.3 `package.json` scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 1.4 `vitest.config.js`

```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
    include: ['src/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/test/**', 'src/data/constants.js', 'src/main.jsx', 'src/assets/**'],
      thresholds: { lines: 60, functions: 55, branches: 50 }, // prototype-realistic gates
    },
  },
});
```

Rationale for single-project config: this codebase has no Node-only modules, so one jsdom project suffices. If you later split node-logic tests out, use Vitest 4's `test.projects` array (the old `workspace` option was removed in v4).

### 1.5 `src/test/setup.js`

```js
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

// React 19 act() support when calling act() directly (RTL sets this itself,
// but context/hook tests that import { act } from 'react' need the guard)
beforeAll(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; });

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

// jsdom lacks ResizeObserver — required by recharts <ResponsiveContainer>
class ResizeObserverMock {
  observe() {} unobserve() {} disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

// jsdom lacks matchMedia (any responsive logic / future use)
global.matchMedia ??= (query) => ({
  matches: false, media: query, onchange: null,
  addListener: () => {}, removeListener: () => {},
  addEventListener: () => {}, removeEventListener: () => {},
  dispatchEvent: () => false,
});

// jsdom lacks scrollTo / scrollIntoView
Element.prototype.scrollIntoView ??= () => {};
```

### 1.6 `playwright.config.js`

```js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  fullyParallel: true,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'en-HK',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } }, // Safari proxy for HK gov desktops
    // { name: 'tablet', use: { ...devices['iPad (gen 7)'] } }, // enable for site-inspection use case
  ],
  webServer: {
    command: 'npm run dev -- --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

---

## 2. Test Plan Structure

### 2.1 Test pyramid (adapted for a prototype)

```
        /\   E2E (Playwright)          ~12 scenarios — one per critical journey
       /--\  Integration               ~35 tests — page-level render+interaction w/ providers
      /----\ Unit                      ~80 tests — contexts, permissions, transitions, helpers
     /------\ Static                   oxlint (existing) + a11y lint pass
```

Prototype calibration: **do not chase high unit coverage of JSX**. Pages are mostly declarative renders over `constants.js`. Highest-value targets are *logic*: permissions gating, pipeline transitions, filters, counts, i18n lookups. Coverage thresholds above are deliberately modest; raise them when real state/API arrives.

### 2.2 Directory layout

```
src/
  test/
    setup.js                 # global setup (above)
    factories.js             # makeWorkOrder({status, budget, center, ...}) overrides WORK_ORDERS seeds
    renderWithProviders.jsx  # render(<AuthProvider><LanguageProvider><Page/></...>)
    page-objects/            # shared locators: sidebar, header, woTable
  context/__tests__/
    AuthContext.test.jsx
  pages/__tests__/
    Dashboard.test.jsx
    WorkOrders.test.jsx
    ...
e2e/
  fixtures/auth.fixture.js   # storageState-free: this app has SSO-disabled quick-login buttons
  journeys/
    auth.spec.js
    oic-submit-flow.spec.js
    manager-endorsement.spec.js
    pwd-assessment.spec.js
    i18n.spec.js
    smoke-all-pages.spec.js
```

### 2.3 Conventions

- **Query priority:** `getByRole` > `getByLabelText` > `getByTestId`. The app uses inline styles and icon-heavy buttons — several icon-only controls currently have **no accessible name**, so tests will surface them; fix the app (add `aria-label`) rather than falling back to `getByTestId`.
- **Never assert inline style strings** except where styling *is* the requirement (e.g., LOCKED chip visible on centre selector). Prefer role/text/visibility assertions.
- **Seed data discipline:** never mutate imported `WORK_ORDERS` arrays across tests. Build variants with factory overrides; components receive data via imports today, so use `vi.mock('../data/constants.js', ...)` with `importOriginal` spread when a page needs isolated fixtures.
- Naming: `<Area>-<##>` IDs (e.g., `WO-04`) referenced in commit messages and defect logs so UAT findings map back to automated cases.

### 2.4 What we intentionally do NOT automate yet

- Pixel/visual regression (design still fluid; revisit post-UAT with Playwright screenshots).
- Performance budgets, Lighthouse CI (prototype).
- Print/export outputs (stubbed in app today).

---

## 3. Detailed Test Cases by Feature

Legend: **P0** blocks UAT sign-off · **P1** important · **P2** nice-to-have

### 3.1 AUTH — Login & Role Selection (`AuthContext.jsx`)

| ID | Priority | Test case | Assertion highlights |
|---|---|---|---|
| AUTH-01 | P0 | Renders SSO portal with 6 role cards | All six `role.label` values visible; Corporate ID/password inputs disabled |
| AUTH-02 | P0 | Clicking each role card calls `login(key)` | `useAuth().permissions` equals corresponding `ROLES[key]` object (name, label, flags) |
| AUTH-03 | P0 | Unauthenticated users see only LoginScreen | `screen.queryByRole('navigation')` / sidebar absent before login |
| AUTH-04 | P0 | After login, app shell renders | Sidebar + Header present; default tab resolves to role's landing view |
| AUTH-05 | P1 | Logout resets to LoginScreen | Role card grid returns; no stale Header state |
| AUTH-06 | P1 | Permissions are derived, not stored raw | Changing `ROLES` entry flows through `permissions` (guards against copy-paste divergence) |

### 3.2 HDR — Header (centre filter, i18n toggle, notifications)

| ID | Priority | Test case |
|---|---|---|
| HDR-01 | P0 | **ASSIGNED_ONLY lock:** as SSD Centre Admin/OIC, centre button shows `LOCKED` badge, click does **not** open dropdown |
| HDR-02 | P0 | **CLUSTER scope:** as Service Manager, dropdown opens labelled *"Cluster Centers"* and lists centres |
| HDR-03 | P0 | **ALL scope:** as SSD AS/G&C/PWD, dropdown labelled *"All Global Centers"*, selecting a centre updates displayed value |
| HDR-04 | P1 | Selected centre persists while navigating tabs (Header state survives page switches within session) |
| HDR-05 | P0 | EN/ZH toggle switches active styling and (when wired to LanguageContext) translated strings re-render |
| HDR-06 | P1 | Notification bell opens panel; 6 seeded notifications render; critical items visually distinct |
| HDR-07 | P2 | Notification panel closes via X / outside click |

### 3.3 DASH — Dashboard

| ID | Priority | Test case |
|---|---|---|
| DASH-01 | P0 | KPI cards show occupancy 94.2%, revenue formatted, WO open/closed 28/14, compliance 97.1% with trend indicators |
| DASH-02 | P0 | Charts render (recharts mounts under mocked ResizeObserver); month labels Jan–Aug present |
| DASH-03 | P0 | Recent work orders list shows status pills with correct colour class per status bucket (Draft grey, Pending Approval amber, Under PWD info, Completed green) |
| DASH-04 | P1 | Expiring-documents widget lists exactly the 2 `Expiring` compliance docs |
| DASH-05 | P2 | Click-through from WO row navigates to Work Orders view |

### 3.4 PROP — Properties

| ID | Priority | Test case |
|---|---|---|
| PROP-01 | P0 | 4 properties render with name/type/address/units/occupancy/status |
| PROP-02 | P1 | Occupancy % displays consistently (e.g., 96 vs 96.0 formatting) |
| PROP-03 | P1 | Chinese-named centre (倩文玲(深水埗)兒童發展中心) renders correctly — encoding sanity check |
| PROP-04 | P2 | Property card click opens detail affordance (or is documented as not-in-scope) |

### 3.5 WO — Work Orders list & tabs

| ID | Priority | Test case |
|---|---|---|
| WO-01 | P0 | Tab bar lists every status + "All", with correct counts (`All` = 20 seeds; each tab count matches `filter(w => w.status === tab).length`) |
| WO-02 | P0 | Selecting a tab filters rows to that status only |
| WO-03 | P0 | Row fields: ID, title, centre, priority badge, assignee, due date, budget |
| WO-04 | P0 | **canCreateWO gating:** Create button visible for Admin/OIC only; hidden for Service Manager/AS/G&C/PWD |
| WO-05 | P0 | **centreScope filtering:** ASSIGNED_ONLY role sees only their centre's WOs even though seeds span 4 centres |
| WO-06 | P1 | Search/filter by title or ID returns matching subset; empty-state message when no match |
| WO-07 | P1 | Priority badges map Critical/High/Medium/Low → distinct colours |
| WO-08 | P2 | Sorting (if present) by created/due date is stable |

### 3.6 CREATE — Work Order Create (`WorkOrderCreate.jsx`)

| ID | Priority | Test case |
|---|---|---|
| CREATE-01 | P0 | Required-field validation: submit blocked without title/category/priority/budget; error messaging shown |
| CREATE-02 | P0 | Budget ≤ $100K routes to normal approval chain (no SSD endorsement step) |
| CREATE-03 | P0 | Budget > $100K flags SSD endorsement requirement (matches NOTIFICATIONS rule: "budget >$100K") |
| CREATE-04 | P0 | `pwdInvolvement: with` routes to *Under PWD Assessment* after approval; `without` bypasses |
| CREATE-05 | P1 | New WO appears in Draft tab with auto-ID format `WO-YYYY-NNNN`, creator = logged-in role's `name` |
| CREATE-06 | P1 | Back/cancel discards form without mutating list |
| CREATE-07 | P2 | Attachment picker accepts file selection (stubbed) |

### 3.7 COMP — Compliance Vault

| ID | Priority | Test case |
|---|---|---|
| COMP-01 | P0 | Summary counters: total 8 documents · N Valid (6) · Expiring Soon (2) consistent with cards and subtitle |
| COMP-02 | P0 | Expiring docs (FS251 cert, Electrical Safety cert) get red border/badge treatment |
| COMP-03 | P1 | Filter by type (Certificate/Insurance/Inspection/Assessment/Test Report) narrows list |
| COMP-04 | P1 | Expiry dates sorted ascending or clearly grouped |
| COMP-05 | P2 | Document click opens preview/detail (documented behaviour) |

### 3.8 AST — Assets

| ID | Priority | Test case |
|---|---|---|
| AST-01 | P0 | 8 assets render with id/name/type/location/status/service dates/manufacturer/model |
| AST-02 | P0 | Status chip mapping: Operational (green), Needs Inspection (amber), Under Maintenance (amber-dark) |
| AST-03 | P1 | Filter by type/location reduces rows correctly |
| AST-04 | P1 | Asset IDs referenced by WOs (ELV-01, GEN-01, FD-02, EXT-05, PMP-03, CAM-12, FCU-08, AHU-01) exist here — cross-reference consistency test |
| AST-05 | P2 | Next-service date in past/near-term highlighted |

### 3.9 FP — Floor Plan

| ID | Priority | Test case |
|---|---|---|
| FP-01 | P0 | 8 asset pins render at expected % coordinates inside plan container |
| FP-02 | P0 | Pin status colours: alert (FD-02 red), maintenance (GEN-01 amber), active default |
| FP-03 | P1 | Clicking pin shows asset detail popover with label + type |
| FP-04 | P1 | Legend/filter by asset type toggles pin visibility |
| FP-05 | P2 | Pins remain clickable after zoom/pan (if implemented) |

### 3.10 RPT — Reports

| ID | Priority | Test case |
|---|---|---|
| RPT-01 | P0 | 6 reports render; Ready (green) vs Draft (amber) badges correct (5 Ready / 1 Draft) |
| RPT-02 | P1 | Download/view action fires for Ready reports; Draft handling defined |
| RPT-03 | P2 | Report names/dates sorted newest-first |

### 3.11 SET — Settings

| ID | Priority | Test case |
|---|---|---|
| SET-01 | P0 | Logged-in role identity shown (name + label from permissions) |
| SET-02 | P0 | Permission summary reflects ROLES flags (create/submit/edit/map-asset/scope) |
| SET-03 | P1 | Language preference change persists to `sessionStorage('pms-lang')` and restores on remount |
| SET-04 | P2 | Centre assignment display matches header scope |

### 3.12 CTX — Context / logic unit tests (highest-value layer)

**AuthContext**
```js
it('derives permissions from selected role', () => {
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
  act(() => result.current.login('SERVICE_MANAGER'));
  expect(result.current.permissions.canCreateWO).toBe(false);
  expect(result.current.permissions.centerScope).toBe('CLUSTER');
});
```

**Work order pipeline — transition matrix** (drive from `WORK_ORDER_STATUSES` × role flags):

| # | From | Action | Actor | To |
|---|---|---|---|---|
| T1 | *(new)* | Create | Admin, OIC | Draft |
| T2 | Draft | Submit for OIC review | Admin (creator) | Pending OIC Submission |
| T3 | Pending OIC Submission | Submit/endorse | OIC (`canSubmitWO`) | Pending Manager Endorsement |
| T4 | Pending Manager Endorsement | Endorse (≤$100K) | Service Manager | Pending Approval |
| T5 | Pending Manager Endorsement | Endorse (>$100K) | Service Manager | Pending SSD Endorsement |
| T6 | Pending SSD Endorsement | Endorse | SSD AS / G&C | Pending Approval |
| T7 | Pending Approval | Approve (no PWD) | G&C | Approved |
| T8 | Pending Approval | Route to PWD (`pwdInvolvement: with`) | G&C | Under PWD Assessment |
| T9 | Under PWD Assessment | Complete assessment + tender pack | PWD (`canEditTaskDetails`) | Submitted to IAS for Tendering |
| T10 | Submitted to IAS for Tendering | Award / start work | G&C / AS | In Progress |
| T11 | In Progress | Verify & close | OIC / Service Manager | Completed |
| T12 | Any pre-Approved stage | Reject / return | endorsing role | previous stage (confirm intended return point) |

Negative tests (equally important): Admin cannot execute T3–T11; Service Manager cannot create (T1); OIC cannot approve (T7/T8); PWD cannot approve or create; transitions attempted by unauthorized role throw/no-op with visible explanation.

**ComplianceContext**: doc CRUD (when merged from `PMS_Proto`), status derivation from expiry date vs today, per-centre filtering honouring `centerScope`.

**LanguageContext (`PMS_Proto/src/i18n/LanguageContext.jsx`)**: `t()` falls back en→key; `{param}` interpolation replaces all occurrences (regex `g` flag); sessionStorage read wrapped in try/catch survives jsdom quota errors.

---

## 4. E2E Journeys (Playwright)

Each spec starts by clicking the matching quick-login card (no auth backend exists — do not fake tokens).

| Spec | Journey | Key assertions |
|---|---|---|
| `smoke-all-pages.spec.js` | Login as each of 6 roles → visit all 9 views | No console errors; each page's headline renders; role-inaccessible actions hidden |
| `oic-submit-flow.spec.js` | OIC: Dashboard → Work Orders → Draft tab → open WO-2026-0901 → submit | Status pill changes Draft → Pending OIC Submission; toast/feedback; tab count decrements/increments |
| `manager-endorsement.spec.js` | Service Mgr: cluster centre switch → endorse WO-2026-0891 ($45K) | Moves toward Pending Approval; >$100K item (WO-2026-0894) instead demands SSD step |
| `pwd-assessment.spec.js` | PWD: open WO-2026-0893 → edit task details → advance | Edit affordances enabled (`canEditTaskDetails=true`); Floor Plan asset linking reachable |
| `i18n.spec.js` | Toggle EN→ZH on Dashboard, Work Orders, Compliance Vault | Key headings switch language; no mixed-language leftovers; reload keeps ZH (sessionStorage) |
| `centre-filter.spec.js` | Admin sees locked centre; G&C switches centre → Work Orders list content follows selection | List re-scopes per centre |
| `a11y-critical.spec.js` | axe-core scan (`@axe-core/playwright`) on Dashboard + Work Orders | No critical violations; icon buttons have accessible names |

Playwright tips for this app: no URL routing exists (tab state lives in `AppLayout` useState), so **every navigation must go through clicks**; add `data-testid` sparingly if text is ambiguous across languages, and prefer scoping queries within the sidebar/main landmarks.

---

## 5. UAT Checklist — Property Manager's Perspective

Format: each item marked Pass / Fail / N-A + comments; defects filed with severity (S1 blocker → S4 cosmetic). Run with real PM/OIC users, on the deployment browsers, using realistic HK-centre data.

### 5.1 First impressions & access
- [ ] I can tell within 10 seconds which role profile to pick; descriptions ("Center draft creation…", "Cluster endorsement…") match my mental model of my job
- [ ] My role lands me on the most useful screen (Admin/OIC → drafts queue; Managers → pending approvals; PWD → assessments)
- [ ] Company branding/tone appropriate for internal government-facing tool

### 5.2 Daily fault-reporting journey (Centre Admin/OIC)
- [ ] I can raise a work order in under 2 minutes without training
- [ ] Field labels use our vocabulary (WO number, funding source, PWD involvement) — nothing confusing
- [ ] After saving, I can immediately find my WO in the right status tab
- [ ] Handoff to OIC is obvious — I know what happens next and who acts
- [ ] Attachments (photos of damage) are easy to add and view later

### 5.3 Approvals chain (Service Manager / AS / G&C)
- [ ] My pending queue shows only items genuinely awaiting *me*
- [ ] Budget figures, quotes and priorities give me enough context to endorse without opening other systems
- [ ] The >$100K SSD escalation feels correctly wired (matches financial delegation limits)
- [ ] I cannot accidentally perform someone else's step — forbidden actions are invisible/disabled, not just error-toast
- [ ] Comment threads read naturally top-down with author/time; useful for audit recall

### 5.4 PWD technical workflow
- [ ] Assessment queue separates PWD-involved jobs cleanly
- [ ] Editing task details and linking assets from the floor plan matches how we scope renovations
- [ ] Tender handoff (IAS submission) captures everything procurement needs

### 5.5 Monitoring & compliance
- [ ] Dashboard KPIs answer "is anything burning?" at a glance; numbers plausible vs reality
- [ ] Expiring certificates (FS251!) surface early enough to renew — expiry lead time sensible
- [ ] Notifications prioritise correctly (cert-expiry > stale approvals > FYI)
- [ ] Asset service dates align with our PPM schedule expectations
- [ ] Reports list contains the artefacts management actually asks for monthly

### 5.6 Multi-site reality
- [ ] As a centre-scoped user I never see another centre's data (privacy/commercial sensitivity)
- [ ] Cluster managers see exactly their cluster; HQ sees everything
- [ ] Switching centre context is fast and the whole app visibly re-scopes

### 5.7 Bilingual usability (EN/ZH)
- [ ] Chinese translations read natively, not machine-translated (have a native speaker review all 9 screens)
- [ ] Mixed-script rows (Chinese centre name + English WO titles) lay out cleanly, no truncation/overflow
- [ ] Font rendering of 中文 legible at 13px sizes used in tables
- [ ] Language choice sticks through navigation and refresh

### 5.8 Environment & device matrix (manual pass)
- [ ] Chrome (Windows) — primary office standard
- [ ] Edge — gov-standard fallback
- [ ] Safari/iPad — for site walkthroughs with Floor Plan
- [ ] 1366×768 laptop (oldest fleet spec): no horizontal scroll on Work Orders table
- [ ] Data-entry via keyboard only is achievable for the create-WO form

### 5.9 Sign-off sheet

| Journey group | Tester (role) | Date | Result | Defect refs |
|---|---|---|---|---|
| Fault reporting (5.2) | | | ☐ Pass ☐ Fail | |
| Approvals chain (5.3) | | | ☐ Pass ☐ Fail | |
| PWD workflow (5.4) | | | ☐ Pass ☐ Fail | |
| Monitoring/compliance (5.5) | | | ☐ Pass ☐ Fail | |
| Multi-site (5.6) | | | ☐ Pass ☐ Fail | |
| Bilingual (5.7) | | | ☐ Pass ☐ Fail | |

**Exit criteria:** all P0 automated cases green; zero open S1/S2 defects; every UAT journey group passed by ≥2 different role-holders.

---

## 6. Gotchas — React 19 + Vite 8 Testing

### Version-compatibility traps

1. **Vitest must be ≥ 4.1 for Vite 8.** 4.0.x's `@vitest/mocker` peer-depends on `vite ^6 || ^7` → `npm install` fails with ERESOLVE. This bit Nx and many projects in March 2026.
2. **Vite 8 = Rolldown.** Its "consistent CommonJS interop" differs from Vite 7: a CJS default-import may expose `.default` differently under Vitest than under Vite dev/build. If you hit weird interop mismatches, either set `test.deps.interopDefault: false` in Vitest or (stopgap) `legacy.inconsistentCjsInterop: true` in Vite config — but prefer fixing the import shape. Pure-ESM codebases like this one usually never notice.
3. **Cypress component testing:** Vite 8 CT support only arrived in Cypress 15.14 (2026-04); headed-mode specs double-register describe/it blocks with Vite 8 + plugin-react 6 HMR until 15.15 (workaround: `react({ exclude: [/node_modules/, /\.cy\.[tj]sx?$/] })`). Another reason to prefer Playwright/Vitest-Browser-Mode here.
4. **RTL ≥16 needs `@testing-library/dom` explicitly** — forgetting it yields runtime "Cannot find module '@testing-library/dom'" only when tests run.
5. **Vitest 4 removed implicit installs:** `happy-dom`/`jsdom` must be direct devDependencies; `workspace` → `projects`; `mockReset()` now resets to no-op implementation (use `mockRestore` for old semantics); `coverage.all` defaults true (numbers shift vs older baselines).

### React 19 specifics

6. **`act` moved:** import from `'react'`, never `'react-dom/test-utils'` (removed in 19). Old snippets online still show the dead import → `ReactDOMTestUtils.act is deprecated` or outright failure.
7. **`TypeError: React.act is not a function`** almost always means **`NODE_ENV=production`** during tests (stray `.env`, CI env leak). React omits `act` from production builds. Ensure test script runs with NODE_ENV=test/development.
8. **`IS_REACT_ACT_ENVIRONMENT`:** RTL sets it for you, but if you call `act()` directly in hook/context tests (or use `vitest-browser-react` < 0.2), set `globalThis.IS_REACT_ACT_ENVIRONMENT = true` in setup — otherwise you get "current testing environment is not configured to support act(...)" warnings.
9. **No more `react-test-renderer`:** deprecated for 19; `renderHook` comes from `@testing-library/react`.
10. **Concurrent rendering:** state updates from user-event are auto-wrapped in act, but effects triggered by timers/fetch-resolves need `await waitFor(...)` or `vi.useFakeTimers()` + `await act(async () => ...)`. Don't sprinkle `sleep()` — flaky on slow CI runners.

### App-specific traps found in this codebase

11. **recharts in jsdom:** `<ResponsiveContainer>` renders nothing without layout — the ResizeObserver mock in §1.5 is mandatory, plus give charts an explicit parent height in tests or assert on axis labels rather than shapes.
12. **lucide-react icons are decorative SVGs** (aria-hidden): icon-only buttons (bell, collapse chevron) have **no accessible name** → getByRole fails. Add `aria-label` in app code; tests double as an a11y audit.
13. **sessionStorage in LanguageContext:** cleared between tests (see setup) or language leaks across specs; the try/catch means silent failures hide storage bugs — test the success path explicitly.
14. **Static seed mutation risk:** pages import `WORK_ORDERS` directly; any test that mutates module state pollutes siblings. Mock the constants module per-test when exercising create/transition flows.
15. **No router:** deep-linkable URLs don't exist, so E2E must click-navigate; also means Playwright `baseURL` tricks and storageState session reuse don't apply — login-per-spec is cheap anyway (one button click).
16. **Inline styles everywhere:** never snapshot-compare style objects (churn hell); assert semantic HTML instead. Where colour *is* the feature (LOCKED badge, status pills), assert computed visibility of the accompanying text/badge element.
17. **oxlint ≠ ESLint:** the existing `lint` script won't run `eslint-plugin-testing-library` / `eslint-plugin-jest` rules. Either accept weaker lint coverage for tests or run ESLint scoped to `src/**/__tests__` alongside oxlint.

### Suggested adoption order (≈ effort estimates)

| Phase | Scope | Effort |
|---|---|---|
| 1 | Stack install + config + setup.js; CTX + AUTH + HDR suites | 1–1.5 days |
| 2 | Page integration suites (DASH/WO/COMP/AST/RPT/SET/FP) | 2–3 days |
| 3 | Pipeline transition-matrix tests incl. negatives | 1 day |
| 4 | Playwright journeys + axe scan | 2 days |
| 5 | UAT dry-run with 2 friendly users, then formal UAT sessions | 3–5 days elapsed |

---

## Appendix A — Verified versions (npm, 2026-08-24)

| Package | Version |
|---|---|
| vitest | 4.1.11 |
| @vitest/coverage-v8 | 4.1.x (match vitest) |
| @testing-library/react | 16.3.2 |
| @testing-library/dom | 10.4.1 |
| @testing-library/user-event | 14.6.6 |
| @testing-library/jest-dom | 7.0.1 |
| jsdom | 30.0.1 |
| happy-dom (alt.) | 20.11.6 |
| @playwright/test | 1.62.1 |
| cypress (alt.) | 15.21.0 |

## Appendix B — Sources

- Vitest 4.1 release notes (Vite 8 support, uses installed vite): vitest.dev/blog/vitest-4-1
- Vitest 4 migration guide (projects, removed APIs): vitest.dev/guide/migration
- Cypress issue #33078 (Vite 8 CT shipped 15.14; headed-mode dup fixed 15.15)
- RTL releases (16.1 React 19 support; 16.3.2 current; @testing-library/dom peer dep)
- Playwright releases v1.60–1.62 (component-testing gallery model, WebP snapshots)
- React docs — `act` environment flag & React 19 act import change
- Stack Overflow/GitHub issues — `React.act is not a function` root-caused to NODE_ENV=production
