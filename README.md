
PeoplePay360
HR & Payroll Platform
Engineering README, Design System & 4-Developer Parallel Build Playbook

Document Version : 1.0
Prepared : September 5, 2026
Squad Size : 4 Developers · 1 Shared Database
Reference Spec : PeoplePay360 – HR & Payroll (Hackathon Brief)
Reference Theme : "Finnova" finance dashboard (UI.jpeg)

Table of Contents
1. Project Overview
2. User Roles & Permission Matrix
3. Functional Module Reference
4. UI Design System — Reference Theme
5. Screen → Component Mapping
6. Technical Architecture
7. Database Design & Table Ownership
8. Repository & Folder Structure
9. Work Division — 4 Developer Squads
10. Git Workflow & Conflict-Avoidance Protocol
11. API Contract Convention
12. Phase-Wise Development Plan
13. Edge-Case & Validation Checklist
14. Demo Script — the Amara Chen Scenario
15. Risks, Mitigations & Communication
Appendix A — Reference Documentation
Appendix B — Glossary
(Headings use Word's built-in Heading styles — open the Navigation Pane in Word for clickable jump-to-section links.)

1. Project Overview
PeoplePay360 is an integrated HR & Payroll operations platform. The brief is explicit that the bar for success is not a set of CRUD screens — it is a connected operational flow where Employee, Contract, Working Schedule, Attendance, Time Off and Salary Rules all reconcile into one consistent number on a payslip.
This document is the engineering README for the build. It captures, in one place:
A condensed, developer-facing reading of the functional spec and every edge case called out in the walkthrough scenario.
A visual design system derived from the supplied reference theme (“Finnova”), translated into concrete tokens and component specs for every screen in the wireframes.
A technical architecture, database ownership model and repository layout built specifically so four developers can work against one shared database with minimal merge/schema conflicts.
A phase-wise delivery plan with clear per-developer ownership, exit criteria and an edge-case checklist to sign off against before the demo.
1.1 Core Principle
Employee is the hub. Contracts and Working Schedules give payroll its context. Attendance and Time Off capture day-to-day activity. Salary Structures/Rules define computation. Payruns turn eligible employees into validated, printable, emailable Payslips. Every module below is designed around keeping that chain intact end-to-end — this is also why the work split in Section 9 is organized around that chain rather than around “frontend vs backend.”
1.2 Key Outcomes (from the brief)
Unified HR flow: one Employee hub with seamless navigation to Contracts, Attendance and Time Off.
Contract management that preserves history while guaranteeing payroll only ever uses the one active, period-specific contract.
Operational tracking: flexible Working Schedules, Attendance with exception handling, and full Time Off (requests + allocations).
Payroll processing via a two-step Payrun wizard, with clear payslip breakdowns and validation warnings.
A centralized Payroll Dashboard aggregating live HR/Payroll data by Period, Department and Employee Type.

2. User Roles & Permission Matrix
Five roles are defined in the brief. Enforcement must happen at the API/query layer, not only by hiding UI buttons — an HR Manager must be blocked from Payroll screens even by direct URL, and a plain Employee must never be able to fetch another employee's attendance, leave balance or salary.
Role
HR Modules (Employees / Contracts / Schedules / Attendance / Time Off)
Salary Structures & Rules
Payruns & Payslips
User & Role Management
Payroll Dashboard
Employee
Own profile, own attendance & own leave balance only (view). Can create own attendance entries and Time Off requests.
No access
No access
No access
No access
HR Manager
Full CRUD on all HR modules for all employees. Can approve/refuse Time Off requests.
No access
No access — blocked even via direct URL
No access
No access
HR Payroll User
All HR Manager permissions.
Read-only
Create, Read, Update
No access
View only
HR Payroll Manager
All HR Payroll User permissions.
Full CRUD
Full CRUD
No access
Full view
Admin
Full access to every module.
Full CRUD
Full CRUD
Full — create users, assign/revoke roles
Full view

Login & access, from the wireframes: accounts are created by an Administrator only (no self-signup). Creating a user links it to an existing Employee record and assigns exactly one of the five roles above. Users must not be able to assign or elevate their own role. After sign-in, only the modules and actions allowed by the assigned role are shown.

3. Functional Module Reference
A condensed map of every module in the brief to a single owning squad (see Section 9 for full squad definitions). This table is the source of truth for “who builds what.”
Spec Code
Module
Owner
What it must do
0
Login & User Access
Dev A (auth core) / Dev D (Admin UI)
Admin-created accounts, linked to an Employee, one role each; role-gated modules after sign-in.
A1 / B1 / B2
Employee Master & Navigation
Dev A
Kanban + List + Form views; department, manager, schedule, job position, status; smart-button links to Contracts, Attendance, Time Off.
A2
Contract Management
Dev A
Historical contracts per employee; list highlights the active one; payroll must use only the period-applicable contract; concurrent active contracts must be blocked.
A3
Working Schedule
Dev A
List + Form; weekly pattern via Day/Start/End/Break; total hours auto-calculated, never typed; assignable to Employee or Contract (contract-level overrides).
A4 / B4
Time Off Types, Allocations & Requests
Dev B
Types define unit, allocation requirement, approval workflow, payroll integration; Allocations track allocated/taken/remaining with validity; approved Requests deduct from Allocations automatically.
B3
Attendance
Dev B
Global or per-employee list/form; check-in/out widget; worked hours auto-computed; manual corrections restricted to authorized users with an audit trail.
A5
Salary Structure Setup
Dev C
Named containers of ordered Salary Rules (e.g. “Regular Salary”); selected on a Payrun to drive computation.
A6
Salary Rule Setup
Dev C
Name/Code/Category/Sequence; fixed, percentage or formula computation methods; rules run in strict sequence so later rules can read earlier outputs.
B5 / B6
Payrun Wizard & Processing
Dev C
Two-step wizard (scope+period, then employee selection); processing screen with Compute / Validate / Mark Paid / Send Payslips and pre-validation warnings.
B7 / B8
Payslip, Computation, PDF & Delivery
Dev C
Rule-by-rule breakdown (Basic → Allowances → Deductions → Gross → Net); Print-to-PDF; bulk email from the parent Payrun with per-recipient failure reporting.
A7 / B9
Reporting & Payroll Dashboard
Dev D
Live KPIs, charts and proactive alerts aggregated across Employee, Contract, Attendance, Time Off and Payroll data; filterable by Period, Department, Employee Type.

4. UI Design System — Reference Theme
The supplied reference (“Finnova”, below) is a finance dashboard: dark utility top bar, a light workspace, an indigo/violet primary accent, fully-rounded pill buttons, soft-shadowed white cards, a gradient “emphasis” panel for a selected record, and colour-coded status pills in tables. The tokens and component specs in this section translate that look into concrete values every developer should reuse — no developer should invent their own button radius, spacing or badge colour.

Fig. 1 — Reference theme (“Finnova”) supplied for this project. Source of the colour, radius and card language defined below.
4.1 Colour Tokens
Token
Hex
Primary Usage
Swatch
Primary / Indigo-600
#5B4FE9
Primary buttons, active nav/tab state, links, focus ring
 
Primary Dark / Indigo-800
#3F35A8
Hover / pressed state, heading accents
 
Primary Light / Indigo-50
#EEF0FF
Selected table row, tinted panels
 
Ink / Text Primary
#1A1A2E
Headings, primary body text
 
Slate / Text Secondary
#6B7280
Secondary text, table headers, captions
 
Mist / Text Muted
#9CA3AF
Placeholders, disabled text
 
Surface / Card White
#FFFFFF
Card and panel backgrounds
 
Canvas / Page Background
#F6F6FB
App page background
 
Border / Divider
#E5E7EB
Card borders, input borders, table rules
 
Ink Navy / Dark Surface
#14141F
Top bar, sidebar, “finalize” action buttons
 
Success / Green
#22C55E
Active, Approved, Paid, Present
 
Success Tint
#DCFCE7
Success badge background
 
Warning / Amber
#F59E0B
Pending, To Approve, dashboard warnings
 
Warning Tint
#FEF3C7
Warning badge background
 
Danger / Red
#EF4444
Absent, Rejected, Overdue, errors
 
Danger Tint
#FEE2E2
Danger badge background
 
Info / Blue
#3B82F6
Validated / informational states
 
Info Tint
#DBEAFE
Info badge background
 
4.2 Typography
Style
Font / Weight / Size
Usage
Display / Cover Title
Calibri, Bold, 28pt
Document cover, hero titles only
H1
Calibri, Bold, 20pt
Section headers, module titles
H2
Calibri, Semibold, 15pt
Card / panel titles, form section headers
H3 / Sub-label
Calibri, Semibold, 12.5pt
Sub-headers, table group headers
Body
Calibri, Regular, 11pt (14px)
Default UI text, table cell content
Caption / Field Label
Calibri, Medium, 9–10pt, Slate
Field labels, KPI captions, timestamps
Numeric / KPI Value
Calibri, Bold, 22–24pt
Dashboard KPI big numbers
Monospace
Consolas, 9–10pt
Contract no., Rule code, folder paths, URLs
4.3 Spacing, Radius & Elevation
Token
Value
Usage
space-1 / 2 / 3 / 4
4 / 8 / 12 / 16 px
Icon gaps, tight paddings, chip padding
space-5 / 6 / 7
20 / 24 / 32 px
Card padding, section gaps
radius-sm
8 px
Checkboxes, tiny chips, colour swatches
radius-md
10–12 px
Inputs, outline/secondary buttons, smart-stat buttons
radius-lg
16 px
Standard cards, Kanban cards, list-item cards
radius-xl
20 px
KPI cards, emphasis/gradient panels, modals
radius-full
9999 px (pill)
Primary/finalize buttons, badges, tabs, avatars
shadow-sm
0 1px 3px rgba(16,24,40,.06)
Default resting elevation for all cards
shadow-md
0 4px 10px rgba(16,24,40,.10)
Hovered card, open dropdown
shadow-lg
0 10px 30px rgba(16,24,40,.18)
Modals, wizards, floating attendance widget
4.4 Buttons
Variant
Shape / Radius
Size
Fill / Text
Used For
States
Primary (filled)
Full pill (radius-full)
40px h · 20px x-pad
Fill Indigo-600, text white, 14px semibold
Sign In, Save, Continue, Create Payrun, Send Payslips
Hover → Indigo-800; disabled → 40% opacity
Primary Dark / Finalize
Full pill
40px h · 20px x-pad
Fill Ink Navy, text white
Mark Paid, Validate Payrun (irreversible / high-stakes actions)
Hover → lighten 10%
Secondary / Outline
radius-md (12px) rectangle
38px h · 16px x-pad
Transparent/white, 1px Border grey, text Ink
Back, Discard, Cancel, Refresh, Add Day
Hover → bg Canvas
Success (Approve)
Small pill
30px h · 12px x-pad
Fill Success green, text white
Approve (Time Off / Allocation)
Hover → darker green
Danger (Refuse)
Small pill, outline
30px h · 12px x-pad
Border + text Danger red, transparent fill
Refuse / Reject
Hover → fills Danger Tint
Icon Button
Square/circle, radius-full or 10px
36 × 36 px
Fill gray-100, icon gray-700
Print PDF, notification bell, settings, close (X)
Hover → gray-200; red dot = unread
Tab / Segmented Control
Container radius-md, item radius-md
34px h
Active: white/Indigo chip + shadow-sm; inactive: transparent, gray text
List/Kanban toggle, “My Team” toggle, dashboard day tabs
Click swaps active segment
Smart Stat Button
radius-md (10px), bordered rectangle
~48px h, auto w
White bg, border grey, bold number + small grey label stacked
“Contracts 2”, “Attendance 96%” on Employee Form
Hover → bg gray-50; click navigates to filtered list
4.5 Status Badges / Pills
All badges are radius-full pills, 12px medium text, ~4×10px padding, optionally prefixed with a 6px colour dot.
Semantic Group
Example Values
Fill
Text
Positive
Active, Approved, Paid, Present, Running (contract), Done
Success Tint #DCFCE7
#16A34A
Neutral
Draft, Inactive
Gray #F1F5F9
#64748B
Warning
Pending, To Approve, Warning, Unsent
Warning Tint #FEF3C7
#D97706
Danger
Absent, Refused, Expired, Overdue, Duplicate
Danger Tint #FEE2E2
#DC2626
Info
Viewed, Validated
Info Tint #DBEAFE
#2563EB
4.6 Cards
Card Type
Radius
Padding
Background
Notable Elements
Used In
Standard Card
16px
20px
White, shadow-sm, 1px border
Title + content block
List views, forms, side panels
KPI Card
20px
20–24px
White, shadow-sm
Icon chip top-right, bold big number, coloured trend line
Payroll Dashboard
Emphasis / Gradient Card
20px
20–24px
Gradient Indigo-600 → Indigo-800, white text
Highlighted selected record
Selected Payslip / Allocation summary
List Item / Kanban Card
16px
16px
White, shadow-sm, hover elevates to shadow-md
Avatar + name + tag + status pill
Employee Kanban
Modal / Wizard Card
20px
24px
White, shadow-lg, dark 50% scrim behind it
Header + body + right-aligned footer buttons
Payrun Wizard, New Schedule, New User
4.7 Forms & Inputs
Text / number / date input: 40px height, radius-md (10px), 1px Border grey, 10×12px padding, 14px text; focus → Indigo border + 3px Indigo ring at 15% opacity.
Select / dropdown: same as text input, chevron icon on the right.
Read-only / computed field (e.g. Working Schedule “Total Weekly Hours,” Attendance “Worked Hours”): grey #F3F4F6 background, non-editable styling, small “auto-calculated” caption underneath.
Toggle / boolean (“Requires Allocation,” “Active”): pill switch, ON = Indigo-600 track, OFF = grey-300 track, white knob.
Colour swatch picker (Time Off Type “Display Colour”): row of 20px circular swatches, selected swatch gets a 2px offset ring.

4.8 Navigation
Utility Top Bar: dark Ink Navy background, 60px tall — logo/app name on the left, search / notification bell (with red unread dot) / settings / avatar on the right.
Module Sub-Nav: light bg, 48px tall, flat tab items (Employees, Contracts, Attendance, Time Off, Payroll). Items with sub-pages get a dropdown caret (▾); the dropdown itself is a white radius-md card with shadow-md.
Active tab: Indigo text + 2px Indigo underline.
Breadcrumbs / smart buttons on Form views sit top-right, per the Smart Stat Button spec above.

4.9 Charts (Payroll Dashboard)
Chart
Style
Used For
Bar
6px rounded-top bars, single Indigo fill, value label above each bar
Salary Cost by Department
Line
2px Indigo stroke, smooth curve, 10% opacity area fill beneath
Monthly Net Salary Trend
Stacked status bar
One 10px rounded-full bar split into coloured segments + swatch legend
Payslip Status split (Paid/Done/Pending/Warning)
Mini stat rings
Small ring/pill per metric
Attendance Overview (Present/Late/Absent/Overtime)
4.10 Attendance Widget (Floating Popup)
Floating card, radius-xl (20px), shadow-lg, opened from the red attendance icon in the top bar.
Header: “Welcome back” + user name, small status dot (green = checked in, grey = checked out).
Large elapsed-time display; below it, today's running total.
Full-width primary pill button that reads “Check In” (Indigo fill) when no active session, and “Check Out” (Ink Navy fill) when a session is active — the colour swap itself communicates state.
On successful check-in, the status dot turns green immediately (optimistic UI).


5. Screen → Component Mapping
Each screen from the wireframes, mapped to the design-system components it is built from, and its owning squad.
Screen
Primary Components Used
Owner
Login
Modal-style centered Card, Text/Password Input, Primary Button
Dev A
Admin – User Management
Table, Radio group (roles), Status Badge, Primary Button
Dev D
Employees – Kanban
List-Item/Kanban Card, Avatar, Status Badge, Tab toggle (Kanban/List)
Dev A
Employees – List
Table, Avatar+Name cell, Status Badge
Dev A
Employee – Form
Tabs (Work / Private Info), Smart Stat Buttons, Inputs
Dev A
Contracts – List / Form
Table with Status Badge (Running/Expired), Inputs, read-only fields
Dev A
Working Schedule – List / Form
Table, day-row input grid, computed “Total Hours” field, “+ Add Day” Secondary Button
Dev A
Attendance – List / Form
Table with Status Badge, read-only audit note card, Icon Button
Dev B
Attendance – Widget
Floating Card, large time display, full-width Primary/Toggle Button, status dot
Dev B
Time Off – Requests
Table, inline Approve (Success) / Refuse (Danger) buttons, “My Team” Tab toggle
Dev B
Time Off – Types / Allocations
Table, Toggle switch, Colour swatch picker, allocated/taken/remaining columns
Dev B
Payrun – Creation Wizard
Modal Card, Selects, multi-select employee table with checkboxes, footer buttons
Dev C
Payrun – Processing
Table (payslip summary), action row (Compute/Validate Secondary, Mark Paid/Send Payslips Primary), warning banner
Dev C
Payslip – Computation
Table (rule breakdown), Icon Button (Print PDF), Resend action
Dev C
Salary Structures / Rules
Table, Form with sequence numbers, computation-method select, monospace Code field
Dev C
Payroll Dashboard
KPI Cards, Bar Chart, Line Chart, Stacked status bar, mini info Cards, filter pills
Dev D

6. Technical Architecture
The brief allows any stack; the one below is the recommendation this README's folder structure and workflow are written against. Swap freely — the ownership and conflict-avoidance rules in Sections 7–9 are stack-agnostic.
Layer
Recommendation
Why
Frontend
React + TypeScript + Vite, TailwindCSS
Matches the rounded/soft aesthetic cheaply via utility classes; fast HMR for 4 parallel devs
Charts
Recharts
Covers bar / line / stacked-bar out of the box for the Dashboard
Backend
Node.js + TypeScript (Express or NestJS)
One language across the stack; easy to structure as isolated feature modules
ORM / Migrations
Prisma or Knex, with per-module migration folders
See Section 7 for why per-module files beat one shared schema file
Database
PostgreSQL — one shared instance/schema for all 4 developers
As required; ownership discipline (Sec. 7) replaces physical separation
Auth
JWT (access + refresh) with a role claim; RBAC middleware on every route
Server-side enforcement, not just hidden buttons
PDF Generation
Puppeteer or PDFKit
Print Payslip PDF action (B8)
Email
Nodemailer / any SMTP-compatible provider
Bulk “Send Payslips” with per-recipient success/failure reporting
CI
GitHub Actions
Lint + typecheck + test + migration dry-run on every PR

7. Database Design & Table Ownership
The database is shared, so the rule that prevents four developers from breaking each other's work is not “separate databases” — it is a strict, published table-ownership matrix. Nobody alters a table they don't own without a reviewed PR from that table's owner; cross-module data is always consumed by foreign key, never by direct write.
Table
Owner
Purpose
Referenced By (cross-module)
users, roles
Dev A
Login accounts, one role per user, linked to an Employee
audit_logs (Dev D)
employees, departments
Dev A
Core employee master record — the hub of the whole system
contracts, attendances, time_off_*, payslips
contracts
Dev A
Historical + active contract per employee; wage, structure, dates, status
payslips, payrun eligibility checks (Dev C)
working_schedules, working_schedule_days
Dev A
Weekly pattern (Day/Start/End/Break); auto-computed weekly hours
attendances, contracts, employees
attendances
Dev B
Check-in/out, worked hours, overtime, manual-correction audit trail
payslips (worked days / overtime), dashboard
time_off_types
Dev B
Leave policy: unit, allocation requirement, approval role, payroll integration flag
time_off_allocations, time_off_requests, salary rules
time_off_allocations
Dev B
Allocated / taken / remaining balance with validity window
time_off_requests
time_off_requests
Dev B
Leave requests + approval workflow
payslips (paid/unpaid day handling), dashboard
salary_structures, salary_rules
Dev C
Ordered rule containers; fixed / percentage / formula computation, category, cap, condition
payruns, payslip_lines
payruns
Dev C
A payroll batch: structure + period + selected employees + status
payslips
payslips, payslip_lines
Dev C
Computed result per employee per period, and the per-rule breakdown
payslip_attachments, dashboard
payslip_attachments
Dev C
Generated PDF reference per payslip
email_logs (Dev D)
audit_logs
Dev D
Who changed what, before/after snapshot — backs the Attendance & Payslip audit-trail requirements
—
email_logs
Dev D
Per-recipient bulk-send status for “Send Payslips”
—

7.1 Schema Change Protocol
Base tables that other modules must reference (users, employees, departments, contracts, working_schedules) are authored by Dev A in Phase 0, reviewed by all four, and merged before Phase 1 starts — everyone else's foreign keys point at stable tables from day one.
Each developer's own tables live in their own migration folder (Section 8) and are applied independently, in filename-timestamp order, by a single migration runner.
A migration that adds a foreign key into another developer's table requires that owner's review and sign-off before merge — no exceptions, even for a “quick” column.
Schema changes are announced in the team channel before the PR is opened, so nobody is migrating a table someone else is mid-edit on.

8. Repository & Folder Structure
A single monorepo, split by feature/module rather than by layer, so each developer's day-to-day work touches their own folder almost exclusively.
peoplepay360/
├── README.md
├── docs/
│   ├── design-system.md
│   ├── api-contract.yaml       # OpenAPI — contract-first
│   ├── db-erd.png
│   ├── phase-plan.md
│   └── demo-script.md
├── database/
│   ├── migrations/
│   │   ├── 0000_core_foundation/   # Phase 0 — Dev A authors, all review
│   │   ├── devA_identity_employee/
│   │   ├── devB_attendance_timeoff/
│   │   ├── devC_payroll_engine/
│   │   └── devD_reporting_platform/
│   ├── seeders/
│   │   ├── 00_roles_users.seed.ts
│   │   ├── 01_employees_contracts.seed.ts    # the Amara Chen scenario
│   │   ├── 02_attendance_timeoff.seed.ts
│   │   └── 03_payroll_demo_data.seed.ts
│   └── schema-registry.md      # ownership map — keep in sync w/ Sec. 7
├── backend/
│   ├── src/
│   │   ├── core/               # SHARED: auth, RBAC, db client, logger
│   │   ├── modules/
│   │   │   ├── identity-employee/    # Dev A
│   │   │   ├── attendance-timeoff/   # Dev B
│   │   │   ├── payroll-engine/       # Dev C
│   │   │   └── reporting-platform/   # Dev D
│   │   ├── routes.loader.ts    # route auto-loader (never hand-edited)
│   │   └── server.ts
│   └── tests/  (devA/ devB/ devC/ devD/)
├── frontend/
│   ├── src/
│   │   ├── components/ui/      # SHARED UI kit — Dev D owns, others PR
│   │   ├── layouts/                 # Navbar, Sub-nav, Sidebar (shared)
│   │   ├── features/
│   │   │   ├── auth-employee/        # Dev A
│   │   │   ├── attendance-timeoff/   # Dev B
│   │   │   ├── payroll/              # Dev C
│   │   │   └── dashboard-reports/    # Dev D
│   │   ├── lib/api/                 # one client file per module, append-only barrel export
│   │   ├── routes.config.tsx   # merges each feature's own routes file
│   │   └── App.tsx
├── .github/workflows/ci.yml
└── package.json                   # npm workspaces: backend, frontend

9. Work Division — 4 Developer Squads
The split follows the data chain in Section 1.1, not a frontend/backend line — each developer owns a vertical slice (DB tables → API → UI) so they are rarely blocked waiting on someone else's layer.
9.1 Dev A — Core HR & Identity Squad
Attribute
Detail
Modules owned
0 (auth core), A1, A2, A3, B1, B2
DB tables
users, roles, employees, departments, contracts, working_schedules, working_schedule_days
Backend folder
backend/src/modules/identity-employee/
Frontend folder
frontend/src/features/auth-employee/
API base paths
/api/v1/auth, /api/v1/users, /api/v1/employees, /api/v1/departments, /api/v1/contracts, /api/v1/schedules
Key deliverables
JWT login + RBAC middleware (shared by everyone); Employee Kanban/List/Form with smart buttons; Contract CRUD with the “no concurrent active contract” validation; Working Schedule builder with auto-computed weekly hours
Critical note
This squad's base tables (users, employees, contracts, working_schedules) must ship in Phase 0 — every other squad's foreign keys point at them

9.2 Dev B — Time & Presence Squad
Attribute
Detail
Modules owned
A4, B3, B4
DB tables
attendances, time_off_types, time_off_allocations, time_off_requests
Backend folder
backend/src/modules/attendance-timeoff/
Frontend folder
frontend/src/features/attendance-timeoff/
API base paths
/api/v1/attendance, /api/v1/timeoff/types, /api/v1/timeoff/allocations, /api/v1/timeoff/requests
Key deliverables
Check-in/out widget; Attendance list/form with manual-correction audit trail and missing-checkout flag; Time Off Type config; Allocation engine with validity window; Request approval flow with balance deduction and overlap prevention
Depends on
Dev A's employees/contracts/schedules tables (read-only FK)

9.3 Dev C — Payroll Engine Squad
Attribute
Detail
Modules owned
A5, A6, B5, B6, B7, B8
DB tables
salary_structures, salary_rules, payruns, payslips, payslip_lines, payslip_attachments
Backend folder
backend/src/modules/payroll-engine/
Frontend folder
frontend/src/features/payroll/
API base paths
/api/v1/payroll/structures, /api/v1/payroll/rules, /api/v1/payroll/payruns, /api/v1/payroll/payslips
Key deliverables
Sequenced rule engine (fixed / % / formula, cap support, conditional gating); proration; period→contract resolution; 2-step Payrun wizard; Compute/Validate/Mark-Paid/Send workflow with pre-validation warnings; PDF generation; bulk email
Depends on
Dev A (employees/contracts/schedules) and Dev B (worked days, overtime, approved/paid vs unpaid leave)

9.4 Dev D — Reporting, Access & Platform Squad
Attribute
Detail
Modules owned
A7, B9, plus cross-cutting: shared design-system kit, RBAC UI enforcement, Admin User Management, DevOps/CI, seed data, QA
DB tables
audit_logs, email_logs (mostly read-only aggregation elsewhere)
Backend folder
backend/src/modules/reporting-platform/ (co-maintains backend/src/core/)
Frontend folder
frontend/src/components/ui/ (Phase 0 build) + frontend/src/features/dashboard-reports/
API base paths
/api/v1/reports, /api/v1/dashboard
Key deliverables
Shared UI kit per Section 4; live-data Dashboard (KPIs, charts, proactive alerts, filters); route guards enforcing Section 2's matrix; seed data (Amara Chen + bulk sample); CI pipeline; end-to-end integration testing
Depends on
All three other squads' data for aggregation — this squad's Dashboard work is necessarily the last to fully land


10. Git Workflow & Conflict-Avoidance Protocol
10.1 Branching Model
main — protected, always deployable; tagged at each phase exit.
develop — daily integration branch; every squad merges here at end of day.
feature/<dev>-<module>-<short-desc> — e.g. feature/devC-salary-rule-cap. One PR, one reviewer, CI must pass before merge.

10.2 Commit Convention
Conventional Commits, scoped by module — e.g. feat(payroll): add PF cap rule, fix(attendance): correct missing-checkout flag, docs(readme): update phase plan.
10.3 Named Conflict Hotspots & Rules
Shared Area
Risk
Mitigation Rule
Migration files per module
Two devs alter the same table
Single-owner folders (Sec. 7); cross-owner FK changes need that owner's review first
backend/src/routes.loader.ts
Manual edits collide
Auto-discovery pattern — the file is written once in Phase 0 and never hand-edited again
frontend/src/routes.config.tsx
Same as above
Each feature owns its own routes file; the merge point changes rarely and is coordinated in standup
frontend/src/components/ui/*
Conflicting style edits
Owned by Dev D; other squads request changes via PR/issue rather than editing directly
package.json / lockfile
Dependency-add conflicts
New dependencies are announced in the team channel before install; lockfile updates are rebased, not force-pushed
.env / config
Secrets drift between machines
Single .env.example maintained by Dev D; real secrets are never committed
docs/api-contract.yaml
Breaking API changes surprise a consumer squad
Contract-first: propose the change in this file via PR before writing the implementation

11. API Contract Convention
Base path: /api/v1, then the module prefix from Section 9 (e.g. /api/v1/payroll/payslips).
Success envelope: { success: true, data, meta?: { page, pageSize, total } }
Error envelope: { success: false, error: { code, message, details? } }
Auth: Bearer JWT in the Authorization header; role and employee_id are claims on the token; RBAC middleware in backend/src/core/ declares the allowed roles per route.
Any endpoint returning another module's data (e.g. Payslip returning Employee name) does so by read-only join/FK — never by duplicating or re-owning that data.

12. Phase-Wise Development Plan
Written against a 10-day build; compress or stretch the day ranges to your actual timeline — the sequencing and exit criteria are what matter.
Phase 0 — Foundation (Day 0–1) — all four together
Repo init, branch protection, CI skeleton.
Agree tech stack, DB conventions, and the API contract stub (docs/api-contract.yaml).
Dev D leads the design-token pass (Section 4); all four review.
Dev D builds Shared UI Kit v0: Button, Input, Card, Badge, Table, Modal, Navbar.
Dev A ships auth scaffold + RBAC middleware + role seed, and the base schema (users, roles, employees, departments, contracts, working_schedules) — reviewed by all.
Exit criteria: everyone can run the app locally, log in as a seeded role, and see an empty shell of their own module route.

Phase 1 — Parallel Core Build (Day 2–5)
Squad
Build
Dev A
Employee Kanban/List/Form + smart buttons; Contract CRUD with overlap validation; Working Schedule builder; Department CRUD
Dev B
Attendance list/form + check-in/out widget + missing-checkout flag + audit trail; Time Off Type CRUD; Allocation CRUD with validity window; Time Off Request CRUD + approval + balance deduction + overlap prevention
Dev C
Salary Structure CRUD; Salary Rule engine (sequence, fixed/%/formula, category, cap); Payrun wizard (2-step); Payrun processing shell; Payslip computation table
Dev D
Dashboard shell with KPI cards & charts (mocked → live later); Admin User Management screen; RBAC route guarding app-wide; seed data script; integration test harness

Exit criteria: each module is functionally usable in isolation, with mocked or partial cross-module data where needed.
Phase 2 — Cross-Module Integration (Day 6–7)
Dev C wires Attendance worked-days/overtime and Time Off paid/unpaid flags into Salary Rule computation (depends on Dev B), and the period→active-contract resolution (depends on Dev A).
Dev D wires the Dashboard to real aggregated queries across Employee, Attendance, Time Off and Payroll data (depends on A, B, C).
Dev A finalizes smart-button counts against real Attendance/Time-Off/Contract data.
All four run the Amara Chen scenario (Section 14) end-to-end together.
Exit criteria: one complete employee lifecycle — hire → promotion → leave → attendance fix → resignation → payslip → dashboard — runs cleanly.

Phase 3 — Edge Cases, Validation & Polish (Day 8–9)
Each squad closes out its own rows in the Section 13 checklist.
Dev D runs a full regression + design-system consistency pass (spacing/colour/radius, empty states, responsive checks).
RBAC boundary testing: Employee data-scoping, HR Manager blocked from Payroll by direct URL, Payroll User read-only on Structures/Rules — all enforced server-side.
Exit criteria: the Section 13 checklist is fully green; no open critical bugs.

Phase 4 — Demo Prep & Deployment (Day 10)
Final seed-data refresh; deploy to the shared environment.
Rehearse the 5-minute, two-scenario demo (Section 14).
Finalize README and the future-roadmap note (brief's Deliverables section).
Tag release v1.0.0.


13. Edge-Case & Validation Checklist
Pulled directly from the walkthrough scenario. Each squad owns and signs off its own section before Phase 4.
Dev A — Employee / Contract / Schedule
#
Edge Case
Expected Behaviour
1
Overlapping active contracts
Two contracts marked “active” for the same employee over overlapping dates must be blocked — a validation rule, not a UI nicety.
2
Schedule defined at both Employee and Contract level
Contract-level schedule overrides Employee-level, since it is period-specific.
3
Schedule change mid-month
Attendance and Payroll must know which schedule applied on which days.
4
Employee with no active contract in the period
Excluded from Payrun eligibility, or flagged with a warning if included by mistake.
5
Resignation mid-period
Contract end date must correctly exclude the employee from the following period's Payrun.

Dev B — Attendance / Time Off
#
Edge Case
Expected Behaviour
1
Missing check-out
Shown as a flagged exception in the list — never a silent 0 or negative hours value.
2
Manual attendance correction
Must show it was edited, by whom, and preserve the original entry for audit.
3
Attendance vs. approved leave overlap
Must reconcile into one truth for the day — never both “absent” and “on leave” at once.
4
Overtime
Captured as a distinct value so the downstream Overtime salary rule can read it.
5
Insufficient leave balance
Request is blocked or clearly flagged — balance must never go silently negative.
6
Overlapping leave requests
Two requests covering the same dates cannot both be approved.
7
Allocation validity window
Balance calculation accounts for expiry, not a blind subtraction.
8
Half-day / hour-unit requests
Balance and payroll day-count reduce proportionally, not rounded to a whole day.

Dev C — Payroll Engine
#
Edge Case
Expected Behaviour
1
Mid-period hire proration
Prorated Basic must flow into every downstream rule (HRA, Gross, PF, Net), not just the Basic line.
2
Capped contribution rule
Formula engine supports min(percentage_result, cap), e.g. PF capped at a fixed ceiling.
3
Negative net salary
Never silently allowed — raises a validation warning for review before the Payrun can be validated.
4
Conditional rules
A rule (e.g. Supervisor Allowance) can be gated by job position / contract type, not just its formula.
5
Period spanning a contract switch
Simplification: whichever contract is active on the last day of the period governs the whole period — state this openly in the demo.
6
Paid vs. unpaid leave
Paid leave does not reduce Basic; unpaid leave does — rules must read Time Off data, not just Attendance.
7
Missing bank details
Surfaced as a Payrun warning before validation, not a silent failure at payment time.
8
Duplicate Payrun / Payslip
Detected and flagged, never silently double-processed.
9
Missing/invalid employee email on bulk send
Reported per-recipient — never silently skipped.
10
Rounding
One consistent rule (2 decimals, standard rounding) so Gross/Net reconciles against the sum of its parts.
11
Resending a corrected payslip
Updates/versions the existing record — never creates a duplicate for the same period.

Dev D — Dashboard / Platform
#
Edge Case
Expected Behaviour
1
Live data only
Dashboard must reflect current system records, never a cached snapshot or hardcoded value.
2
Proactive alerts
e.g. “3 employees missing bank details,” “duplicate payslip detected” — surfaced before someone stumbles onto them mid-Payrun.
3
Sparse filter combinations
Period + Department + Employee Type with zero results shows a clear empty state, never an error.
4
Employee data scoping
A plain Employee can never fetch another employee's attendance, leave balance or salary — enforced at the API/query level.
5
HR Manager → Payroll boundary
Blocked from opening any Payroll screen, even by direct URL.
6
HR Payroll User → Rule engine boundary
Can view Salary Structures/Rules but cannot edit them — enforced server-side, easy to leave open if untested.


14. Demo Script — the Amara Chen Scenario
One continuous story that exercises nearly every “must handle” item in the brief. Recommended as the 5-minute live-demo narrative, run across all four squads' work in sequence.
Hire (Jan 15) — Employee + first Contract created, Sales Associate wage. [Dev A]
Working schedule assigned; standard 5-day/40-hour pattern, auto-computed. [Dev A]
Promotion (Jun 1) — new Contract as Store Supervisor; old contract ends same day; overlap validation proven. [Dev A]
Day-to-day attendance, including one missing check-out flagged as an exception and later manually corrected with an audit trail. [Dev B]
Parental leave request (Sep) against a paid Time Off Type; balance deducted from Allocation on approval. [Dev B]
Payrun for the affected periods: January prorates the mid-month hire; June resolves via the “last-day-of-period” contract rule; September's paid leave doesn't reduce Basic. [Dev C]
Resignation (Nov 20) — November payslip prorates to the 20th; December Payrun correctly excludes her. [Dev C]
Payslip PDF generated and emailed; Payroll Dashboard reflects the whole story live — headcount, salary cost, attendance health, and any warnings raised along the way. [Dev C + Dev D]

15. Risks, Mitigations & Communication
Risk
Impact
Mitigation
Schema drift across devs' local setups
Broken FKs, failed migrations
One shared Postgres instance + ordered migration runner + CI migration dry-run on every PR
Rule-engine complexity underestimated
Late Payslip feature
Dev C starts a rule-engine stub in Phase 0, in parallel with everyone else's setup work
Cross-module surprises found late
Demo failure risk
Mandatory Phase 2 integration checkpoint before the polish phase begins
Design inconsistency across 4 devs' screens
Unprofessional / inconsistent UI
Shared component library is mandatory; Dev D design-reviews every feature before Phase 4
Merge conflicts in shared files
Lost time, blocked squads
Ownership rules + auto-discovery route loaders (Section 10)

15.1 Communication Cadence
Daily 15-minute standup — blockers and any planned schema change called out explicitly.
End-of-day merge from every feature branch into develop.
Dev D runs a nightly smoke test against develop and reports failures the next morning.
Any change to docs/api-contract.yaml or a shared table is announced in the team channel before the PR is opened.

Appendix A — Reference Documentation
Curated reference reading, mapped to owning squad (Odoo's own documentation, used only as a conceptual reference for this custom build).
Area
Owner
Reference
Employee master, Departments
Dev A
Employees overview; New employees; Departments
Contracts, Working Schedules
Dev A
Contracts; Working schedules
Attendance
Dev B
Attendances overview; Check in/out; Attendance logs; Work approvals & overtime; Attendance reporting
Time Off
Dev B
Time off overview; Time off types; Allocations; Request time off; Management (approve/refuse); Reporting
Salary Structure & Rules
Dev C
Salaries (Structure Types, Structures, Rules, condition/amount types); Work entries
Payrun & Payslip processing
Dev C
Payroll overview; Pay runs; Payslips; Time off to report
Dashboard & reporting
Dev D
Payroll analysis; Headcount report; Work entry analysis
Role-based access
Dev D
Access rights — reference model for scoping CRUD per role

Appendix B — Glossary
Term
Definition
Payrun
A payroll batch: a chosen Salary Structure + Period + set of eligible employees, processed together.
Payslip
The computed result for one employee for one period within a Payrun — shows the full rule breakdown.
Salary Structure
A named, ordered container of Salary Rules (e.g. “Regular Salary”).
Salary Rule
One computed line item (Basic, HRA, PF, etc.) with a category, sequence and computation method.
Allocation
An approved leave balance for one employee/Time-Off-Type, with allocated/taken/remaining and a validity window.
Working Schedule
A reusable weekly pattern (days, hours, breaks) assignable to an Employee or a Contract.
Smart Button
A small stat button on a Form view (e.g. “Contracts 2”) that both shows a count and navigates to the filtered related list.
RBAC
Role-Based Access Control — permissions enforced by the five roles in Section 2, at the API/query layer.
Proration
Scaling a salary component (typically Basic) for a partial period, e.g. a mid-month hire or resignation.