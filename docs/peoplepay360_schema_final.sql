-- ============================================================================
-- PeoplePay360 HR & Payroll
-- PostgreSQL Database Schema (Final Reviewed Version)
-- ============================================================================
-- Core flow:
--   User -> Role
--   Employee -> Department / Working Schedule / Contracts / Attendance / Time Off
--   Contract -> Salary Structure
--   Salary Structure -> Ordered Salary Rules
--   Payrun -> Payslips -> Payslip Lines
--
-- Design decisions (reviewed with product owner):
--   1. Employee does NOT store a single contract_id, salary_structure_id,
--      attendance_id, or leaves_remaining. These are one-to-many-over-time
--      relationships or derived values, not single scalar fields:
--        - Contract lives on contracts.employee_id (many contracts/employee,
--          only one ACTIVE at a time, enforced below via exclusion constraint).
--        - Salary structure is attached to the CONTRACT, since it can change
--          when a contract changes.
--        - leaves_remaining is derived as allocated_amount - taken_amount on
--          leave_allocations, never stored, to avoid data drift.
--   2. Salary rules use one operation + basis + value instead of four
--      separate nullable columns (percent_add/percent_subtract/add/subtract).
--      This keeps every rule unambiguous (impossible for two operations to
--      apply to the same rule at once) while still guaranteeing that only
--      the rule's own configured operation affects the payslip.
--   3. Historical HR/payroll data (contracts, attendance, leave, payslips) is
--      never hard-deleted when an employee leaves; employees are archived
--      via status = 'TERMINATED' instead. FKs use ON DELETE RESTRICT.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE employee_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'ON_LEAVE',
    'TERMINATED'
);

CREATE TYPE employee_type AS ENUM (
    'FULL_TIME',
    'PART_TIME',
    'CONTRACT',
    'INTERN'
);

CREATE TYPE contract_status AS ENUM (
    'DRAFT',
    'ACTIVE',
    'EXPIRED',
    'TERMINATED'
);

CREATE TYPE attendance_status AS ENUM (
    'PRESENT',
    'LATE',
    'ABSENT',
    'OVERTIME',
    'MISSING_CHECKOUT',
    'MANUAL_EDIT'
);

CREATE TYPE leave_request_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REFUSED',
    'CANCELLED'
);

CREATE TYPE leave_unit AS ENUM (
    'DAY',
    'HOUR'
);

CREATE TYPE payrun_status AS ENUM (
    'DRAFT',
    'COMPUTED',
    'VALIDATED',
    'PAID',
    'CANCELLED'
);

CREATE TYPE payslip_status AS ENUM (
    'DRAFT',
    'COMPUTED',
    'VALIDATED',
    'PAID',
    'CANCELLED'
);

CREATE TYPE payslip_email_status AS ENUM (
    'NOT_SENT',
    'SENT',
    'FAILED'
);

CREATE TYPE salary_rule_category AS ENUM (
    'BASIC',
    'ALLOWANCE',
    'GROSS',
    'DEDUCTION',
    'NET'
);

CREATE TYPE salary_rule_operation AS ENUM (
    'FIXED_ADD',
    'FIXED_SUBTRACT',
    'PERCENTAGE_ADD',
    'PERCENTAGE_SUBTRACT'
);

CREATE TYPE salary_rule_basis AS ENUM (
    'CONTRACT_WAGE',
    'CURRENT_TOTAL',
    'PREVIOUS_RULE'
);

-- ============================================================================
-- ROLES
-- ============================================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name, description)
VALUES
    ('EMPLOYEE', 'Regular employee access'),
    ('HR_MANAGER', 'HR management access'),
    ('HR_PAYROLL_USER', 'HR and payroll operational access'),
    ('HR_PAYROLL_MANAGER', 'Full HR and payroll configuration access'),
    ('ADMIN', 'Full system administration access');

-- ============================================================================
-- USERS
-- Every employee is expected to have a user account (see employees.user_id
-- NOT NULL below), since every role in the permission matrix implies login
-- access, even the base "Employee" role.
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DEPARTMENTS
-- ============================================================================

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    manager_employee_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- WORKING SCHEDULES
-- A schedule is a reusable weekly pattern. Weekly hours are derived from
-- working_schedule_days rather than stored, so it can never go stale.
-- ============================================================================

CREATE TABLE working_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    schedule_type VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE working_schedule_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    working_schedule_id UUID NOT NULL
        REFERENCES working_schedules(id)
        ON DELETE CASCADE,

    day_of_week SMALLINT NOT NULL,
    start_time TIME,
    end_time TIME,
    break_minutes INTEGER NOT NULL DEFAULT 0,
    is_working_day BOOLEAN NOT NULL DEFAULT TRUE,

    -- Computed per-day working hours: (end - start) - break, in hours.
    -- Stored as GENERATED so the app never has to recompute or can trust it
    -- directly in list views ("weekly hours" requirement).
    working_hours NUMERIC(5,2)
        GENERATED ALWAYS AS (
            CASE
                WHEN start_time IS NOT NULL AND end_time IS NOT NULL THEN
                    ROUND(
                        (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0)
                        - (break_minutes / 60.0)
                    , 2)
                ELSE 0
            END
        ) STORED,

    CONSTRAINT chk_schedule_day_of_week
        CHECK (day_of_week BETWEEN 1 AND 7),

    CONSTRAINT chk_schedule_break_minutes
        CHECK (break_minutes >= 0),

    CONSTRAINT chk_schedule_working_times
        CHECK (
            NOT is_working_day
            OR (start_time IS NOT NULL AND end_time IS NOT NULL)
        ),

    CONSTRAINT chk_schedule_time_order
        CHECK (
            NOT is_working_day
            OR end_time > start_time
        ),

    UNIQUE (working_schedule_id, day_of_week)
);

-- ============================================================================
-- EMPLOYEES
-- Employee is the central HR entity. Note what is intentionally NOT here:
-- contract_id, salary_structure_id, attendance_id, leaves_remaining.
-- See design decision #1 at the top of this file for why.
-- ============================================================================

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE REFERENCES users(id),

    employee_code VARCHAR(50) NOT NULL UNIQUE,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),

    email VARCHAR(255) UNIQUE,
    phone VARCHAR(30),

    department_id UUID REFERENCES departments(id),
    manager_id UUID REFERENCES employees(id),

    employee_type employee_type NOT NULL DEFAULT 'FULL_TIME',
    job_position VARCHAR(150),

    working_schedule_id UUID REFERENCES working_schedules(id),

    status employee_status NOT NULL DEFAULT 'ACTIVE',

    date_of_joining DATE,
    date_of_birth DATE,

    bank_account_number VARCHAR(100),
    bank_name VARCHAR(150),
    bank_ifsc VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE departments
    ADD CONSTRAINT fk_department_manager
    FOREIGN KEY (manager_employee_id)
    REFERENCES employees(id);

-- ============================================================================
-- SALARY STRUCTURES
-- A reusable, ordered collection of Salary Rules.
-- ============================================================================

CREATE TABLE salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SALARY RULES
-- One rule = one operation applied to one basis value.
--   operation = PERCENTAGE_ADD, basis = CONTRACT_WAGE, value = 40
--     -> adds 40% of the contract wage.
--   operation = FIXED_SUBTRACT, basis = CURRENT_TOTAL, value = 500
--     -> subtracts a flat 500 from the running total so far.
--   operation = PERCENTAGE_ADD, basis = PREVIOUS_RULE, value = 10
--     -> adds 10% of whatever the immediately preceding rule produced.
-- Only ONE operation/basis/value triple exists per rule, so there is never
-- ambiguity about which "shape" of calculation applies.
-- ============================================================================

CREATE TABLE salary_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,

    category salary_rule_category NOT NULL,
    operation salary_rule_operation NOT NULL,
    basis salary_rule_basis NOT NULL DEFAULT 'CURRENT_TOTAL',

    value NUMERIC(15,4) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_salary_rule_value
        CHECK (value >= 0)
);

-- Join table: which rules belong to which structure, and in what order.
CREATE TABLE salary_structure_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    salary_structure_id UUID NOT NULL
        REFERENCES salary_structures(id)
        ON DELETE CASCADE,

    salary_rule_id UUID NOT NULL
        REFERENCES salary_rules(id)
        ON DELETE RESTRICT,

    sequence INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_salary_structure_rule_sequence
        CHECK (sequence > 0),

    UNIQUE (salary_structure_id, salary_rule_id),
    UNIQUE (salary_structure_id, sequence)
);

-- ============================================================================
-- CONTRACTS
-- An employee may have many contracts historically, but only ONE may be
-- ACTIVE and overlapping the same date range at a time. This is enforced at
-- the database level (not just app logic) via the exclusion constraint below.
-- ============================================================================

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    employee_id UUID NOT NULL
        REFERENCES employees(id)
        ON DELETE RESTRICT,

    contract_name VARCHAR(150) NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE,

    wage NUMERIC(15,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'INR',

    department_id UUID REFERENCES departments(id),
    job_position VARCHAR(150),

    working_schedule_id UUID REFERENCES working_schedules(id),
    salary_structure_id UUID REFERENCES salary_structures(id),

    status contract_status NOT NULL DEFAULT 'DRAFT',

    -- Derived date range used only to enforce the no-overlap constraint.
    period daterange
        GENERATED ALWAYS AS (
            daterange(start_date, COALESCE(end_date, 'infinity'::date), '[]')
        ) STORED,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_contract_dates
        CHECK (end_date IS NULL OR end_date >= start_date),

    CONSTRAINT chk_contract_wage
        CHECK (wage >= 0)
);

-- Prevents two ACTIVE contracts for the same employee from ever overlapping.
ALTER TABLE contracts
    ADD CONSTRAINT excl_contract_no_overlap
    EXCLUDE USING gist (
        employee_id WITH =,
        period WITH &&
    ) WHERE (status = 'ACTIVE');

-- ============================================================================
-- ATTENDANCE
-- worked_minutes is preferred over a floating-point hours field to avoid
-- precision issues and keep payroll calculations clean.
-- ============================================================================

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    employee_id UUID NOT NULL
        REFERENCES employees(id)
        ON DELETE RESTRICT,

    attendance_date DATE NOT NULL,

    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,

    worked_minutes INTEGER,
    overtime_minutes INTEGER NOT NULL DEFAULT 0,

    status attendance_status NOT NULL,
    is_manual_edit BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (employee_id, attendance_date),

    CONSTRAINT chk_attendance_worked_minutes
        CHECK (worked_minutes IS NULL OR worked_minutes >= 0),

    CONSTRAINT chk_attendance_overtime_minutes
        CHECK (overtime_minutes >= 0),

    CONSTRAINT chk_attendance_time_order
        CHECK (
            check_in IS NULL
            OR check_out IS NULL
            OR check_out >= check_in
        )
);

-- ============================================================================
-- LEAVE / TIME OFF TYPES
-- ============================================================================

CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL UNIQUE,
    unit leave_unit NOT NULL DEFAULT 'DAY',

    requires_allocation BOOLEAN NOT NULL DEFAULT TRUE,
    requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
    affects_payroll BOOLEAN NOT NULL DEFAULT FALSE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LEAVE ALLOCATIONS
-- "Leaves remaining" (requirement on Employee) is derived here as:
--   allocated_amount - taken_amount
-- never stored directly on employees, to avoid drift.
-- ============================================================================

CREATE TABLE leave_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    employee_id UUID NOT NULL
        REFERENCES employees(id)
        ON DELETE RESTRICT,

    leave_type_id UUID NOT NULL
        REFERENCES leave_types(id),

    allocated_amount NUMERIC(10,2) NOT NULL,
    taken_amount NUMERIC(10,2) NOT NULL DEFAULT 0,

    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,

    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_leave_allocation_amount
        CHECK (
            allocated_amount >= 0
            AND taken_amount >= 0
            AND taken_amount <= allocated_amount
        ),

    CONSTRAINT chk_leave_allocation_dates
        CHECK (valid_to >= valid_from)
);

-- ============================================================================
-- LEAVE REQUESTS
-- ============================================================================

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    employee_id UUID NOT NULL
        REFERENCES employees(id)
        ON DELETE RESTRICT,

    leave_type_id UUID NOT NULL
        REFERENCES leave_types(id),

    leave_allocation_id UUID
        REFERENCES leave_allocations(id),

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    requested_amount NUMERIC(10,2) NOT NULL,
    reason TEXT,

    status leave_request_status NOT NULL DEFAULT 'PENDING',

    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_leave_request_dates
        CHECK (end_date >= start_date),

    CONSTRAINT chk_leave_request_amount
        CHECK (requested_amount > 0)
);

-- ============================================================================
-- PAYRUNS
-- A Payrun is a payroll batch for a specific period and salary structure.
-- ============================================================================

CREATE TABLE payruns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,

    salary_structure_id UUID NOT NULL
        REFERENCES salary_structures(id),

    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    status payrun_status NOT NULL DEFAULT 'DRAFT',

    computed_at TIMESTAMPTZ,
    validated_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,

    created_by UUID REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_payrun_dates
        CHECK (period_end >= period_start)
);

-- ============================================================================
-- PAYSLIPS
-- One Payslip = one employee's salary result for one Payrun.
-- ============================================================================

CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    payrun_id UUID NOT NULL
        REFERENCES payruns(id)
        ON DELETE RESTRICT,

    employee_id UUID NOT NULL
        REFERENCES employees(id)
        ON DELETE RESTRICT,

    contract_id UUID NOT NULL
        REFERENCES contracts(id)
        ON DELETE RESTRICT,

    salary_structure_id UUID NOT NULL
        REFERENCES salary_structures(id),

    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    worked_days NUMERIC(10,2),

    gross_salary NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_deductions NUMERIC(15,2) NOT NULL DEFAULT 0,
    net_salary NUMERIC(15,2) NOT NULL DEFAULT 0,

    status payslip_status NOT NULL DEFAULT 'DRAFT',

    pdf_path TEXT,
    email_status payslip_email_status NOT NULL DEFAULT 'NOT_SENT',
    emailed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (payrun_id, employee_id),

    CONSTRAINT chk_payslip_period
        CHECK (period_end >= period_start),

    CONSTRAINT chk_payslip_amounts
        CHECK (
            gross_salary >= 0
            AND total_deductions >= 0
            AND net_salary >= 0
        ),

    CONSTRAINT chk_payslip_net
        CHECK (net_salary = gross_salary - total_deductions)
);

-- ============================================================================
-- PAYSLIP LINES
-- Snapshots the rule's operation/basis/value at the time of calculation so
-- historical payroll remains understandable even if a rule changes later.
-- ============================================================================

CREATE TABLE payslip_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    payslip_id UUID NOT NULL
        REFERENCES payslips(id)
        ON DELETE CASCADE,

    salary_rule_id UUID REFERENCES salary_rules(id),

    name VARCHAR(150) NOT NULL,
    code VARCHAR(50),
    category salary_rule_category NOT NULL,

    sequence INTEGER NOT NULL,

    amount NUMERIC(15,2) NOT NULL,

    operation salary_rule_operation,
    basis salary_rule_basis,
    rule_value NUMERIC(15,4),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_payslip_line_sequence
        CHECK (sequence > 0)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_type ON employees(employee_type);

CREATE INDEX idx_contracts_employee_dates ON contracts(employee_id, start_date, end_date);
CREATE INDEX idx_contracts_status ON contracts(status);

CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, attendance_date);
CREATE INDEX idx_attendance_status ON attendance(status);

CREATE INDEX idx_leave_allocations_employee ON leave_allocations(employee_id);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);

CREATE INDEX idx_payruns_period ON payruns(period_start, period_end);
CREATE INDEX idx_payruns_status ON payruns(status);

CREATE INDEX idx_payslips_employee ON payslips(employee_id);
CREATE INDEX idx_payslips_payrun ON payslips(payrun_id);
CREATE INDEX idx_payslips_status ON payslips(status);

CREATE INDEX idx_salary_structure_rules_sequence ON salary_structure_rules(salary_structure_id, sequence);
CREATE INDEX idx_payslip_lines_payslip_sequence ON payslip_lines(payslip_id, sequence);

-- ============================================================================
-- OPTIONAL SEED DATA EXAMPLES
-- ============================================================================

-- INSERT INTO leave_types (name, unit, requires_allocation, requires_approval, affects_payroll)
-- VALUES
--     ('Annual Leave', 'DAY', TRUE, TRUE, FALSE),
--     ('Sick Leave', 'DAY', TRUE, TRUE, FALSE),
--     ('Casual Leave', 'DAY', TRUE, TRUE, FALSE),
--     ('Unpaid Leave', 'DAY', FALSE, TRUE, TRUE);

-- ============================================================================
-- IMPORTANT APPLICATION-LEVEL BUSINESS RULES
-- (everything below cannot reasonably be enforced purely in SQL)
-- ============================================================================
-- 1. Overlapping active contracts are now blocked at the DB level via
--    excl_contract_no_overlap — no app-level check needed for this specific
--    rule, but the app should still surface a friendly error message.
-- 2. Select the contract applicable to the Payrun period (join contracts on
--    employee_id where period @> payrun period, status = 'ACTIVE').
-- 3. A Payrun should only include explicitly selected eligible employees.
-- 4. Execute salary_structure_rules ordered by sequence, carrying forward
--    CURRENT_TOTAL / PREVIOUS_RULE basis values as you go.
-- 5. Approved leave requests should consume leave allocations transactionally
--    (increment taken_amount, check chk_leave_allocation_amount holds).
-- 6. Do not allow duplicate Payslips for the same Payrun + Employee
--    (enforced via UNIQUE (payrun_id, employee_id) already).
-- 7. Validate missing bank details, invalid contracts, duplicate/incomplete
--    payroll information before marking a Payrun as paid.
-- 8. Finalized payroll records should be treated as historical records —
--    employees are archived via status = 'TERMINATED', never hard-deleted.
-- ============================================================================
