import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL direct pool (Dev C)
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

export const pool = new Pool({
  connectionString,
  ssl: (connectionString.includes('supabase') || connectionString.includes('pooler')) ? { rejectUnauthorized: false } : false,
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error('[DB Query Error]', err);
    // Return empty fallback structure if db is offline
    return { rows: [], rowCount: 0 };
  }
};

// Supabase client configuration (Dev A)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Auto-initialize PostgreSQL tables and database seed data on connection
export const initDb = async () => {
  try {
    // 1. Create all Tables if they do not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS working_schedules (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        total_hours_per_week NUMERIC(5, 2) DEFAULT 40.00,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS working_schedule_days (
        id VARCHAR(50) PRIMARY KEY,
        schedule_id VARCHAR(50) REFERENCES working_schedules(id) ON DELETE CASCADE,
        day_of_week VARCHAR(20) NOT NULL,
        start_time VARCHAR(10) NOT NULL,
        end_time VARCHAR(10) NOT NULL,
        break_hours NUMERIC(4, 2) DEFAULT 1.00,
        computed_hours NUMERIC(4, 2) DEFAULT 7.00
      );

      CREATE TABLE IF NOT EXISTS departments (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) UNIQUE,
        manager_id VARCHAR(50),
        parent_id VARCHAR(50) REFERENCES departments(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

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
        status VARCHAR(20) DEFAULT 'active',
        private_email VARCHAR(150),
        bank_account VARCHAR(50),
        hire_date DATE NOT NULL,
        date_of_joining DATE,
        bank_account_number VARCHAR(50),
        bank_name VARCHAR(100),
        bank_ifsc VARCHAR(50),
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        password VARCHAR(255),
        role_id VARCHAR(50) NOT NULL REFERENCES roles(id),
        employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS contracts (
        id VARCHAR(50) PRIMARY KEY,
        contract_ref VARCHAR(50) UNIQUE NOT NULL,
        contract_name VARCHAR(150),
        employee_id VARCHAR(50) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        job_position VARCHAR(100) NOT NULL,
        wage NUMERIC(12, 2) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        status VARCHAR(20) DEFAULT 'running',
        working_schedule_id VARCHAR(50) REFERENCES working_schedules(id),
        salary_structure_id VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS time_off_types (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        unit VARCHAR(20) DEFAULT 'Days',
        requires_allocation BOOLEAN DEFAULT TRUE,
        requires_approval BOOLEAN DEFAULT TRUE,
        affects_payroll BOOLEAN DEFAULT FALSE,
        is_paid BOOLEAN DEFAULT TRUE,
        display_color VARCHAR(20)
      );

      CREATE TABLE IF NOT EXISTS time_off_allocations (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        time_off_type_id VARCHAR(50) REFERENCES time_off_types(id),
        allocated NUMERIC(5, 2) NOT NULL,
        taken NUMERIC(5, 2) DEFAULT 0,
        valid_from DATE NOT NULL,
        valid_until DATE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS time_off_requests (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        time_off_type_id VARCHAR(50) REFERENCES time_off_types(id),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        requested_amount NUMERIC(5, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        approved_by VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS attendances (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        attendance_date DATE,
        check_in TIMESTAMP WITH TIME ZONE,
        check_out TIMESTAMP WITH TIME ZONE,
        worked_hours NUMERIC(5, 2),
        worked_minutes INT,
        overtime_hours NUMERIC(5, 2) DEFAULT 0,
        overtime_minutes INT DEFAULT 0,
        status VARCHAR(50),
        is_manual_correction BOOLEAN DEFAULT FALSE,
        is_manual_edit BOOLEAN DEFAULT FALSE,
        audit_note TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS salary_structures (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50),
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS salary_rules (
        id VARCHAR(50) PRIMARY KEY,
        structure_id VARCHAR(50) REFERENCES salary_structures(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        sequence INT NOT NULL,
        computation_method VARCHAR(50) DEFAULT 'Fixed',
        operation VARCHAR(50),
        basis VARCHAR(50),
        amount NUMERIC(12, 2),
        value NUMERIC(12, 4),
        formula TEXT,
        condition_expression TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        CONSTRAINT unique_struct_code UNIQUE(structure_id, code)
      );

      CREATE TABLE IF NOT EXISTS payruns (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        structure_id VARCHAR(50),
        salary_structure_id VARCHAR(50),
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'Draft',
        employee_count INT DEFAULT 0,
        total_gross NUMERIC(12, 2) DEFAULT 0,
        total_net NUMERIC(12, 2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payslips (
        id VARCHAR(50) PRIMARY KEY,
        payrun_id VARCHAR(50) REFERENCES payruns(id) ON DELETE CASCADE,
        employee_id VARCHAR(50) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        contract_id VARCHAR(50) REFERENCES contracts(id),
        salary_structure_id VARCHAR(50),
        period_start DATE,
        period_end DATE,
        worked_days NUMERIC(5, 2),
        basic_wage NUMERIC(12, 2) DEFAULT 0,
        gross_wage NUMERIC(12, 2) DEFAULT 0,
        gross_salary NUMERIC(12, 2) DEFAULT 0,
        total_deductions NUMERIC(12, 2) DEFAULT 0,
        net_wage NUMERIC(12, 2) DEFAULT 0,
        net_salary NUMERIC(12, 2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Draft',
        pdf_path TEXT,
        email_status VARCHAR(50) DEFAULT 'NOT_SENT',
        emailed_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS payslip_lines (
        id VARCHAR(50) PRIMARY KEY,
        payslip_id VARCHAR(50) REFERENCES payslips(id) ON DELETE CASCADE,
        salary_rule_id VARCHAR(50) REFERENCES salary_rules(id),
        name VARCHAR(150),
        code VARCHAR(50),
        category VARCHAR(50),
        sequence INT,
        amount NUMERIC(12, 2) NOT NULL,
        operation VARCHAR(50),
        basis VARCHAR(50),
        rule_value NUMERIC(12, 4)
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(50) PRIMARY KEY,
        table_name VARCHAR(100) NOT NULL,
        record_id VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        changed_by VARCHAR(50),
        old_values JSONB,
        new_values JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS email_logs (
        id VARCHAR(50) PRIMARY KEY,
        recipient_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        payslip_id VARCHAR(50) REFERENCES payslips(id),
        status VARCHAR(50) NOT NULL,
        error_message TEXT,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Execute column migrations to guarantee pre-existing PostgreSQL tables have all required columns
    await pool.query(`
      ALTER TABLE contracts ADD COLUMN IF NOT EXISTS salary_structure_id VARCHAR(50);

      ALTER TABLE payruns ADD COLUMN IF NOT EXISTS name VARCHAR(100);
      ALTER TABLE payruns ADD COLUMN IF NOT EXISTS structure_id VARCHAR(50);
      ALTER TABLE payruns ADD COLUMN IF NOT EXISTS salary_structure_id VARCHAR(50);
      ALTER TABLE payruns ADD COLUMN IF NOT EXISTS period_start DATE;
      ALTER TABLE payruns ADD COLUMN IF NOT EXISTS period_end DATE;
      ALTER TABLE payruns ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Draft';
      ALTER TABLE payruns ADD COLUMN IF NOT EXISTS employee_count INT DEFAULT 0;
      ALTER TABLE payruns ADD COLUMN IF NOT EXISTS total_gross NUMERIC(12, 2) DEFAULT 0;
      ALTER TABLE payruns ADD COLUMN IF NOT EXISTS total_net NUMERIC(12, 2) DEFAULT 0;

      ALTER TABLE payslips ADD COLUMN IF NOT EXISTS salary_structure_id VARCHAR(50);
      ALTER TABLE payslips ADD COLUMN IF NOT EXISTS period_start DATE;
      ALTER TABLE payslips ADD COLUMN IF NOT EXISTS period_end DATE;
      ALTER TABLE payslips ADD COLUMN IF NOT EXISTS worked_days NUMERIC(5, 2) DEFAULT 22;
      ALTER TABLE payslips ADD COLUMN IF NOT EXISTS basic_wage NUMERIC(12, 2) DEFAULT 0;
      ALTER TABLE payslips ADD COLUMN IF NOT EXISTS gross_wage NUMERIC(12, 2) DEFAULT 0;
      ALTER TABLE payslips ADD COLUMN IF NOT EXISTS gross_salary NUMERIC(12, 2) DEFAULT 0;
      ALTER TABLE payslips ADD COLUMN IF NOT EXISTS total_deductions NUMERIC(12, 2) DEFAULT 0;
      ALTER TABLE payslips ADD COLUMN IF NOT EXISTS net_wage NUMERIC(12, 2) DEFAULT 0;
      ALTER TABLE payslips ADD COLUMN IF NOT EXISTS net_salary NUMERIC(12, 2) DEFAULT 0;
      ALTER TABLE payslips ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Draft';
      ALTER TABLE payslips ADD COLUMN IF NOT EXISTS pdf_path TEXT;
      ALTER TABLE payslips ADD COLUMN IF NOT EXISTS email_status VARCHAR(50) DEFAULT 'NOT_SENT';

      ALTER TABLE payslip_lines ADD COLUMN IF NOT EXISTS name VARCHAR(150);
      ALTER TABLE payslip_lines ADD COLUMN IF NOT EXISTS code VARCHAR(50);
      ALTER TABLE payslip_lines ADD COLUMN IF NOT EXISTS category VARCHAR(50);
      ALTER TABLE payslip_lines ADD COLUMN IF NOT EXISTS sequence INT DEFAULT 10;
      ALTER TABLE payslip_lines ADD COLUMN IF NOT EXISTS salary_rule_id VARCHAR(50);
      ALTER TABLE payslip_lines ADD COLUMN IF NOT EXISTS rule_id VARCHAR(50);

      UPDATE contracts SET salary_structure_id = 'struct_1' WHERE salary_structure_id IS NULL;
      UPDATE contracts SET salary_structure_id = 'struct_3' WHERE employee_id = 'emp_amara';
      UPDATE contracts SET salary_structure_id = 'struct_2' WHERE employee_id = 'emp_admin';
    `);

    // 3. Populate Seed Data safely using ON CONFLICT DO NOTHING
    await pool.query(`
      INSERT INTO roles (id, name, description) VALUES
        ('employee', 'Employee', 'Own profile, attendance & leave view only'),
        ('hr_manager', 'HR Manager', 'Full HR access; blocked from Payroll'),
        ('hr_payroll_user', 'HR Payroll User', 'HR access + Payruns view & process; read-only rules'),
        ('hr_payroll_manager', 'HR Payroll Manager', 'Full HR & Payroll access including Salary Rules'),
        ('admin', 'Admin', 'Full system access including User & Role Management')
      ON CONFLICT (id) DO NOTHING;

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

      INSERT INTO departments (id, name, code) VALUES
        ('dept_sales', 'Sales Operations', 'SALES'),
        ('dept_hr', 'Human Resources', 'HR'),
        ('dept_eng', 'Engineering', 'ENG'),
        ('dept_finance', 'Finance & Accounting', 'FIN')
      ON CONFLICT DO NOTHING;

      INSERT INTO employees (id, first_name, last_name, email, phone, job_position, department_id, working_schedule_id, status, private_email, bank_account, hire_date) VALUES
        ('emp_amara', 'Amara', 'Chen', 'amara.chen@peoplepay360.com', '+1 (555) 234-5678', 'Sales Associate', 'dept_sales', 'sched_std_40h', 'active', 'amara.personal@gmail.com', 'US98BANK1020304050', '2026-01-15'),
        ('emp_admin', 'System', 'Admin', 'admin@peoplepay360.com', '+1 (555) 000-0000', 'Platform Administrator', 'dept_hr', 'sched_std_40h', 'active', 'admin@peoplepay360.com', 'US00BANK0000000000', '2025-01-01'),
        ('emp_hrmgr', 'HR', 'Manager', 'hr.manager@peoplepay360.com', '+1 (555) 111-2222', 'HR Manager', 'dept_hr', 'sched_std_40h', 'active', 'hr.manager@peoplepay360.com', 'US11BANK1111111111', '2025-01-01'),
        ('emp_payroll', 'Payroll', 'Manager', 'payroll@peoplepay360.com', '+1 (555) 333-4444', 'Payroll Manager', 'dept_hr', 'sched_std_40h', 'active', 'payroll@peoplepay360.com', 'US33BANK3333333333', '2025-01-01')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO users (id, email, password_hash, password, role_id, employee_id) VALUES
        ('usr_admin', 'admin@peoplepay360.com', 'password123', 'password123', 'admin', 'emp_admin'),
        ('usr_hrmgr', 'hr.manager@peoplepay360.com', 'password123', 'password123', 'hr_manager', 'emp_hrmgr'),
        ('usr_payroll', 'payroll@peoplepay360.com', 'password123', 'password123', 'hr_payroll_manager', 'emp_payroll'),
        ('usr_amara', 'amara.chen@peoplepay360.com', 'password123', 'password123', 'employee', 'emp_amara')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO contracts (id, contract_ref, contract_name, employee_id, job_position, wage, start_date, status, working_schedule_id, salary_structure_id) VALUES
        ('ct_amara_1', 'CNT-2026-001', 'Employment Contract - Amara Chen', 'emp_amara', 'Sales Associate', 4500.00, '2026-01-15', 'running', 'sched_std_40h', 'struct_3'),
        ('ct_admin_1', 'CNT-2026-002', 'Executive Contract - Admin', 'emp_admin', 'Platform Administrator', 8500.00, '2025-01-01', 'running', 'sched_std_40h', 'struct_2'),
        ('ct_hrmgr_1', 'CNT-2026-003', 'Management Contract - HR Manager', 'emp_hrmgr', 'HR Manager', 6000.00, '2025-01-01', 'running', 'sched_std_40h', 'struct_1'),
        ('ct_payroll_1', 'CNT-2026-004', 'Management Contract - Payroll Manager', 'emp_payroll', 'Payroll Manager', 6500.00, '2025-01-01', 'running', 'sched_std_40h', 'struct_1')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO time_off_types (id, name, unit, requires_allocation, is_paid, display_color) VALUES
        ('tot_paid', 'Paid Time Off (PTO)', 'Days', true, true, '#5B4FE9'),
        ('tot_sick', 'Sick Leave', 'Days', true, true, '#F59E0B'),
        ('tot_parental', 'Parental Leave', 'Days', true, true, '#3B82F6'),
        ('tot_unpaid', 'Unpaid Leave', 'Days', false, false, '#6B7280')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO time_off_allocations (id, employee_id, time_off_type_id, allocated, taken, valid_from, valid_until) VALUES
        ('alloc_amara_pto_2026', 'emp_amara', 'tot_paid', 20, 3, '2026-01-01', '2026-12-31'),
        ('alloc_amara_sick_2026', 'emp_amara', 'tot_sick', 10, 0, '2026-01-01', '2026-12-31'),
        ('alloc_admin_pto_2026', 'emp_admin', 'tot_paid', 20, 0, '2026-01-01', '2026-12-31'),
        ('alloc_admin_sick_2026', 'emp_admin', 'tot_sick', 10, 0, '2026-01-01', '2026-12-31'),
        ('alloc_hrmgr_pto_2026', 'emp_hrmgr', 'tot_paid', 20, 0, '2026-01-01', '2026-12-31'),
        ('alloc_hrmgr_sick_2026', 'emp_hrmgr', 'tot_sick', 10, 0, '2026-01-01', '2026-12-31'),
        ('alloc_payroll_pto_2026', 'emp_payroll', 'tot_paid', 20, 0, '2026-01-01', '2026-12-31'),
        ('alloc_payroll_sick_2026', 'emp_payroll', 'tot_sick', 10, 0, '2026-01-01', '2026-12-31')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO time_off_requests (id, employee_id, time_off_type_id, start_date, end_date, requested_amount, status, approved_by) VALUES
        ('tor_1', 'emp_amara', 'tot_paid', '2026-09-10', '2026-09-12', 3, 'Approved', 'emp_admin')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO attendances (id, employee_id, attendance_date, check_in, check_out, worked_hours, overtime_hours, status) VALUES
        ('att_1', 'emp_amara', '2026-09-01', '2026-09-01 09:00:00+00', '2026-09-01 17:00:00+00', 8.00, 1.00, 'PRESENT')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO salary_structures (id, name, code, description) VALUES
        ('struct_1', 'Standard Monthly Salary', 'STD_MONTHLY', 'Default structure for full-time regular employees'),
        ('struct_2', 'Executive & Management Structure', 'EXEC_MGMT', 'Structure with high performance and supervisor allowances'),
        ('struct_3', 'Sales & Performance Structure', 'SALES_PERF', 'Structure for sales team with commission incentives')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO salary_rules (id, structure_id, code, name, category, sequence, computation_method, amount) VALUES
        ('rule_101', 'struct_1', 'BASIC', 'Basic Wage', 'BASIC', 10, 'Fixed', 4500.00),
        ('rule_102', 'struct_1', 'HRA', 'House Rent Allowance', 'ALLOWANCE', 20, 'Percentage', 40.00),
        ('rule_103', 'struct_1', 'TA', 'Transport Allowance', 'ALLOWANCE', 30, 'Fixed', 300.00),
        ('rule_104', 'struct_1', 'PF', 'Provident Fund', 'DEDUCTION', 50, 'Percentage', 12.00),
        ('rule_105', 'struct_1', 'TAX', 'Income Tax', 'DEDUCTION', 60, 'Percentage', 10.00),

        ('rule_201', 'struct_2', 'BASIC', 'Basic Wage', 'BASIC', 10, 'Fixed', 8500.00),
        ('rule_202', 'struct_2', 'HRA', 'Executive HRA', 'ALLOWANCE', 20, 'Percentage', 40.00),
        ('rule_203', 'struct_2', 'SUP_ALW', 'Executive Supervisor Allowance', 'ALLOWANCE', 30, 'Fixed', 800.00),
        ('rule_204', 'struct_2', 'TA', 'Executive Transport Allowance', 'ALLOWANCE', 40, 'Fixed', 500.00),
        ('rule_205', 'struct_2', 'PF', 'Provident Fund', 'DEDUCTION', 50, 'Percentage', 12.00),
        ('rule_206', 'struct_2', 'TAX', 'Executive Income Tax', 'DEDUCTION', 60, 'Percentage', 15.00),

        ('rule_301', 'struct_3', 'BASIC', 'Basic Wage', 'BASIC', 10, 'Fixed', 4500.00),
        ('rule_302', 'struct_3', 'COMM', 'Sales Performance Commission', 'ALLOWANCE', 20, 'Fixed', 400.00),
        ('rule_303', 'struct_3', 'TA', 'Transport Allowance', 'ALLOWANCE', 30, 'Fixed', 250.00),
        ('rule_304', 'struct_3', 'PF', 'Provident Fund', 'DEDUCTION', 50, 'Percentage', 12.00),
        ('rule_305', 'struct_3', 'TAX', 'Income Tax', 'DEDUCTION', 60, 'Percentage', 10.00)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO payruns (id, name, structure_id, period_start, period_end, status, employee_count, total_gross, total_net) VALUES
        ('pr_2026_08', 'August 2026 Monthly Payrun', 'struct_1', '2026-08-01', '2026-08-31', 'Paid', 3, 23900.00, 18642.00),
        ('pr_2026_09', 'September 2026 Regular Payrun', 'struct_1', '2026-09-01', '2026-09-30', 'Draft', 3, 23900.00, 18642.00)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO payslips (id, payrun_id, employee_id, contract_id, salary_structure_id, period_start, period_end, worked_days, basic_wage, gross_wage, total_deductions, net_wage, status) VALUES
        ('ps_aug_amara', 'pr_2026_08', 'emp_amara', 'ct_amara_1', 'struct_3', '2026-08-01', '2026-08-31', 22, 4500.00, 5150.00, 1133.00, 4017.00, 'Paid'),
        ('ps_aug_admin', 'pr_2026_08', 'emp_admin', 'ct_admin_1', 'struct_2', '2026-08-01', '2026-08-31', 22, 8500.00, 12700.00, 3429.00, 9271.00, 'Paid'),
        ('ps_aug_hrmgr', 'pr_2026_08', 'emp_hrmgr', 'ct_hrmgr_1', 'struct_1', '2026-08-01', '2026-08-31', 22, 6000.00, 8700.00, 2346.00, 6354.00, 'Paid'),

        ('ps_sep_amara', 'pr_2026_09', 'emp_amara', 'ct_amara_1', 'struct_3', '2026-09-01', '2026-09-30', 22, 4500.00, 5150.00, 1133.00, 4017.00, 'Draft'),
        ('ps_sep_admin', 'pr_2026_09', 'emp_admin', 'ct_admin_1', 'struct_2', '2026-09-01', '2026-09-30', 22, 8500.00, 12700.00, 3429.00, 9271.00, 'Draft'),
        ('ps_sep_hrmgr', 'pr_2026_09', 'emp_hrmgr', 'ct_hrmgr_1', 'struct_1', '2026-09-01', '2026-09-30', 22, 6000.00, 8700.00, 2346.00, 6354.00, 'Draft')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO payslip_lines (id, payslip_id, salary_rule_id, name, code, category, sequence, amount) VALUES
        ('psl_1', 'ps_sep_amara', 'rule_301', 'Basic Wage', 'BASIC', 'BASIC', 10, 4500.00),
        ('psl_2', 'ps_sep_amara', 'rule_302', 'Sales Performance Commission', 'COMM', 'ALLOWANCE', 20, 400.00),
        ('psl_3', 'ps_sep_amara', 'rule_303', 'Transport Allowance', 'TA', 'ALLOWANCE', 30, 250.00),
        ('psl_4', 'ps_sep_amara', 'rule_304', 'Provident Fund', 'PF', 'DEDUCTION', 50, 540.00),
        ('psl_5', 'ps_sep_amara', 'rule_305', 'Income Tax', 'TAX', 'DEDUCTION', 60, 593.00),

        ('psl_6', 'ps_sep_admin', 'rule_201', 'Basic Wage', 'BASIC', 'BASIC', 10, 8500.00),
        ('psl_7', 'ps_sep_admin', 'rule_202', 'Executive HRA', 'HRA', 'ALLOWANCE', 20, 3400.00),
        ('psl_8', 'ps_sep_admin', 'rule_203', 'Executive Supervisor Allowance', 'SUP_ALW', 'ALLOWANCE', 30, 800.00),
        ('psl_9', 'ps_sep_admin', 'rule_204', 'Executive Transport Allowance', 'TA', 'ALLOWANCE', 40, 500.00),
        ('psl_10', 'ps_sep_admin', 'rule_205', 'Provident Fund', 'PF', 'DEDUCTION', 50, 1020.00),
        ('psl_11', 'ps_sep_admin', 'rule_206', 'Executive Income Tax', 'TAX', 'DEDUCTION', 60, 2409.00)
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('[DB] PostgreSQL database tables and seed data initialized successfully.');
  } catch (err) {
    console.error('[DB] Database init execution error:', err);
  }
};

// Initialize DB schema asynchronously
initDb();

// Dynamic runtime memory reference (unseeded)
export const memoryDb = {
  roles: [] as any[],
  departments: [] as any[],
  schedules: [] as any[],
  employees: [] as any[],
  contracts: [] as any[],
  users: [] as any[],
  time_off_types: [] as any[],
  time_off_allocations: [] as any[],
  time_off_requests: [] as any[],
  attendances: [] as any[],
  salary_structures: [] as any[],
  salary_rules: [] as any[],
  payruns: [] as any[],
  payslips: [] as any[],
  email_logs: [] as any[],
};



