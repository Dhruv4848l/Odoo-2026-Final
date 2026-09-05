# PeoplePay360: Remaining Work Report

This report outlines the remaining gaps and missing features across the entire project, cross-referenced against the `README.md` functional requirements and the Section 13 Edge Case Checklist. While the core database and CRUD operations are fully functional, several critical integrations and edge cases remain unaddressed.

## 1. Cross-Module Integration Gaps (Critical)

Currently, the modules operate somewhat in silos rather than as a cohesive system. The following integrations need to be completed:

*   **Payroll to Attendance & Time Off Integration (Dev C & Dev B):** 
    *   *Issue:* In `payrun.service.ts`, the rule evaluation context hardcodes `OVERTIME_HOURS: 0` and `UNPAID_LEAVE_DAYS: 0`.
    *   *Fix:* Before computing a payslip, `computePayrun` must query the `attendances` table to calculate actual overtime, and the `time_off_requests` table to count approved unpaid leave days within the period.
*   **Dashboard Backend Filtering (Dev D):**
    *   *Issue:* While the frontend dropdowns pass `period` and `department` parameters to the API, `dashboard.routes.ts` does not yet apply these variables to the SQL `WHERE` clauses. It currently aggregates all historical data.
    *   *Fix:* Dynamically append `pr.period_start` and `e.department_id` filters to the dashboard SQL queries when the query parameters are present.

## 2. Payroll Engine & Rule Evaluation (Dev C)

The Payroll engine has a few mathematical and functional gaps that will block accurate processing:

*   **Condition Expressions with Strings:**
    *   *Issue:* The `RuleEvaluator` uses a `Function` to evaluate conditions, expecting numerical context. However, rules like the Supervisor Allowance use string conditions (e.g., `job_position == 'Store Supervisor'`). Since `job_position` isn't injected into the `EvaluationContext`, this will fail.
    *   *Fix:* Add string variables (like `job_position`, `department`, `employee_type`) to the `EvaluationContext` and update `evaluateCondition` to handle string parsing safely.
*   **Payslip PDF Generation:**
    *   *Issue:* The requirement for "Print-to-PDF" functionality (using Puppeteer or PDFKit) is completely missing from the `payslip.controller.ts` and `payslip.service.ts`.
    *   *Fix:* Implement an endpoint (e.g., `GET /payslips/:id/pdf`) that renders the payslip data into an HTML template and converts it to PDF.
*   **Duplicate Payrun Validation:**
    *   *Issue:* The system currently allows creating multiple payruns for the same period and same salary structure.
    *   *Fix:* Add a unique constraint or an active validation check in `createPayrun` to block duplicate processing.

## 3. UI / UX and Access Control (All Devs)

*   **Frontend RBAC Enforcement:**
    *   *Issue:* The backend correctly enforces roles using `authMiddleware`, but the frontend UI does not visually hide or disable navigation tabs (like Payroll) for unauthorized roles (e.g., HR Manager).
    *   *Fix:* Consume the JWT role claim in the React frontend and conditionally render the navigation tabs and restricted buttons.
*   **Active Contract Validation (Dev A):**
    *   *Issue:* The API currently doesn't enforce the rule that "Two contracts marked active for the same employee over overlapping dates must be blocked."
    *   *Fix:* Add a validation check in the `POST /contracts` and `PUT /contracts/:id` backend routes.

## 4. Edge Cases (Section 13 Checklist)

The following edge cases from the project brief remain unresolved:
*   **Dev B (Time Off):** Allocation validity windows are not strictly enforced during balance calculation (the API just checks total allocated vs total requested).
*   **Dev B (Attendance):** Missing checkouts are flagged on the dashboard, but there is no automated resolution or explicit UI workflow for an HR manager to resolve them manually via an audit trail.

---

### Recommended Next Steps
If you'd like to proceed with finishing the project, I recommend tackling **#1 (Cross-Module Integration)** first, as computing real overtime and unpaid leave is the most technically complex gap remaining for the "Amara Chen" scenario to be 100% accurate.
