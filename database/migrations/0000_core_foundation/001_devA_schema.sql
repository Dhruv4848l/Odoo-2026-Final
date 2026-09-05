-- =========================================================
-- PeoplePay360 — Phase 0 Base Schema (Dev A Core Foundation)
-- Tables: roles, users, departments, employees, contracts, working_schedules, working_schedule_days
-- =========================================================

-- 1. Roles Table (5 System Roles)
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (id, name, description) VALUES
  ('employee', 'Employee', 'Own profile, attendance & leave view only'),
  ('hr_manager', 'HR Manager', 'Full HR access; blocked from Payroll'),
  ('hr_payroll_user', 'HR Payroll User', 'HR access + Payruns view & process; read-only rules'),
  ('hr_payroll_manager', 'HR Payroll Manager', 'Full HR & Payroll access including Salary Rules'),
  ('admin', 'Admin', 'Full system access including User & Role Management')
ON CONFLICT (id) DO NOTHING;

-- 2. Working Schedules & Days
CREATE TABLE IF NOT EXISTS working_schedules (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  total_hours_per_week NUMERIC(5, 2) DEFAULT 40.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS working_schedule_days (
  id VARCHAR(50) PRIMARY KEY,
  schedule_id VARCHAR(50) REFERENCES working_schedules(id) ON DELETE CASCADE,
  day_of_week VARCHAR(20) NOT NULL, -- Monday, Tuesday, etc.
  start_time VARCHAR(10) NOT NULL,   -- "09:00"
  end_time VARCHAR(10) NOT NULL,     -- "17:00"
  break_hours NUMERIC(4, 2) DEFAULT 1.00,
  computed_hours NUMERIC(4, 2) DEFAULT 7.00
);

-- 3. Departments
CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE,
  manager_id VARCHAR(50),
  parent_id VARCHAR(50) REFERENCES departments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Employees Master Table (Hub of the system)
CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(50) PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(50),
  job_position VARCHAR(100) NOT NULL,
  department_id VARCHAR(50) REFERENCES departments(id),
  manager_id VARCHAR(50) REFERENCES employees(id),
  working_schedule_id VARCHAR(50) REFERENCES working_schedules(id),
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, terminated
  private_email VARCHAR(150),
  bank_account VARCHAR(50),
  hire_date DATE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Circular FK reference for department manager
ALTER TABLE departments 
  ADD CONSTRAINT fk_department_manager 
  FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- 5. Users (Authentication & Accounts)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id VARCHAR(50) NOT NULL REFERENCES roles(id),
  employee_id VARCHAR(50) UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Contracts
CREATE TABLE IF NOT EXISTS contracts (
  id VARCHAR(50) PRIMARY KEY,
  contract_ref VARCHAR(50) UNIQUE NOT NULL,
  employee_id VARCHAR(50) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  job_position VARCHAR(100) NOT NULL,
  wage NUMERIC(12, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'draft', -- draft, running, expired, cancelled
  working_schedule_id VARCHAR(50) REFERENCES working_schedules(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- INITIAL SEED DATA FOR DEMO & AMARA CHEN SCENARIO
-- =========================================================

-- Seed Default Schedule (Standard 40h)
INSERT INTO working_schedules (id, name, total_hours_per_week) VALUES
  ('sched_std_40h', 'Standard 40h / Week (9 AM - 5 PM)', 40.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO working_schedule_days (id, schedule_id, day_of_week, start_time, end_time, break_hours, computed_hours) VALUES
  ('wsd_mon', 'sched_std_40h', 'Monday', '09:00', '17:00', 1.00, 7.00),
  ('wsd_tue', 'sched_std_40h', 'Tuesday', '09:00', '17:00', 1.00, 7.00),
  ('wsd_wed', 'sched_std_40h', 'Wednesday', '09:00', '17:00', 1.00, 7.00),
  ('wsd_thu', 'sched_std_40h', 'Thursday', '09:00', '17:00', 1.00, 7.00),
  ('wsd_fri', 'sched_std_40h', 'Friday', '09:00', '17:00', 1.00, 7.00)
ON CONFLICT (id) DO NOTHING;

-- Seed Departments
INSERT INTO departments (id, name, code) VALUES
  ('dept_sales', 'Sales Operations', 'SALES'),
  ('dept_hr', 'Human Resources', 'HR'),
  ('dept_eng', 'Engineering', 'ENG'),
  ('dept_finance', 'Finance & Accounting', 'FIN')
ON CONFLICT (id) DO NOTHING;

-- Seed Demo Employee: Amara Chen
INSERT INTO employees (id, first_name, last_name, email, phone, job_position, department_id, working_schedule_id, status, private_email, bank_account, hire_date) VALUES
  ('emp_amara', 'Amara', 'Chen', 'amara.chen@peoplepay360.com', '+1 (555) 234-5678', 'Sales Associate', 'dept_sales', 'sched_std_40h', 'active', 'amara.personal@gmail.com', 'US98BANK1020304050', '2026-01-15'),
  ('emp_admin', 'System', 'Admin', 'admin@peoplepay360.com', '+1 (555) 000-0000', 'Platform Administrator', 'dept_hr', 'sched_std_40h', 'active', 'admin@peoplepay360.com', 'US00BANK0000000000', '2025-01-01')
ON CONFLICT (id) DO NOTHING;

-- Seed Amara Chen's First Contract (Sales Associate)
INSERT INTO contracts (id, contract_ref, employee_id, job_position, wage, start_date, status, working_schedule_id) VALUES
  ('ct_amara_1', 'CNT-2026-001', 'emp_amara', 'Sales Associate', 4500.00, '2026-01-15', 'running', 'sched_std_40h')
ON CONFLICT (id) DO NOTHING;

-- Seed Users for Authentication
-- Password for all seed users is 'password123' (hashed using a simple hash or bcrypt representation for demo)
INSERT INTO users (id, email, password_hash, role_id, employee_id, is_active) VALUES
  ('usr_admin', 'admin@peoplepay360.com', '$2a$10$X7vQ4s1yE2L3k9Z0w8M7u.N5P6Q7R8S9T0U1V2W3X4Y5Z6', 'admin', 'emp_admin', true),
  ('usr_hrmgr', 'hr.manager@peoplepay360.com', '$2a$10$X7vQ4s1yE2L3k9Z0w8M7u.N5P6Q7R8S9T0U1V2W3X4Y5Z6', 'hr_manager', NULL, true),
  ('usr_payroll', 'payroll@peoplepay360.com', '$2a$10$X7vQ4s1yE2L3k9Z0w8M7u.N5P6Q7R8S9T0U1V2W3X4Y5Z6', 'hr_payroll_manager', NULL, true),
  ('usr_amara', 'amara.chen@peoplepay360.com', '$2a$10$X7vQ4s1yE2L3k9Z0w8M7u.N5P6Q7R8S9T0U1V2W3X4Y5Z6', 'employee', 'emp_amara', true)
ON CONFLICT (id) DO NOTHING;
