import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL direct pool (Dev C)
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

export const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase.co') ? { rejectUnauthorized: false } : false,
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
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

// Memory DB for local fallback testing
export const memoryDb = {
  roles: [
    { id: 'employee', name: 'Employee', description: 'Own profile, attendance & leave view only' },
    { id: 'hr_manager', name: 'HR Manager', description: 'Full HR access; blocked from Payroll' },
    { id: 'hr_payroll_user', name: 'HR Payroll User', description: 'HR access + Payruns view & process; read-only rules' },
    { id: 'hr_payroll_manager', name: 'HR Payroll Manager', description: 'Full HR & Payroll access including Salary Rules' },
    { id: 'admin', name: 'Admin', description: 'Full system access including User & Role Management' },
  ],
  departments: [
    { id: 'dept_sales', name: 'Sales Operations', code: 'SALES', manager_id: null },
    { id: 'dept_hr', name: 'Human Resources', code: 'HR', manager_id: null },
    { id: 'dept_eng', name: 'Engineering', code: 'ENG', manager_id: null },
    { id: 'dept_finance', name: 'Finance & Accounting', code: 'FIN', manager_id: null },
  ],
  schedules: [
    {
      id: 'sched_std_40h',
      name: 'Standard 40h / Week (9 AM - 5 PM)',
      total_hours_per_week: 40,
      days: [
        { day_of_week: 'Monday', start_time: '09:00', end_time: '17:00', break_hours: 1, computed_hours: 7 },
        { day_of_week: 'Tuesday', start_time: '09:00', end_time: '17:00', break_hours: 1, computed_hours: 7 },
        { day_of_week: 'Wednesday', start_time: '09:00', end_time: '17:00', break_hours: 1, computed_hours: 7 },
        { day_of_week: 'Thursday', start_time: '09:00', end_time: '17:00', break_hours: 1, computed_hours: 7 },
        { day_of_week: 'Friday', start_time: '09:00', end_time: '17:00', break_hours: 1, computed_hours: 7 },
      ],
    },
  ],
  employees: [
    {
      id: 'emp_amara',
      first_name: 'Amara',
      last_name: 'Chen',
      email: 'amara.chen@peoplepay360.com',
      phone: '+1 (555) 234-5678',
      job_position: 'Sales Associate',
      department_id: 'dept_sales',
      manager_id: null,
      working_schedule_id: 'sched_std_40h',
      status: 'active',
      private_email: 'amara.personal@gmail.com',
      bank_account: 'US98BANK1020304050',
      hire_date: '2026-01-15',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  ],
  contracts: [
    {
      id: 'ct_amara_1',
      contract_ref: 'CNT-2026-001',
      employee_id: 'emp_amara',
      job_position: 'Sales Associate',
      wage: 4500.00,
      start_date: '2026-01-15',
      end_date: null,
      status: 'running',
      working_schedule_id: 'sched_std_40h',
      notes: 'Initial hire contract for Amara Chen',
    },
  ],
  users: [
    {
      id: 'usr_admin',
      email: 'admin@peoplepay360.com',
      password: 'password123',
      role_id: 'admin',
      employee_id: 'emp_admin',
    },
  ],
  time_off_types: [
    {
      id: 'tot_paid',
      name: 'Paid Time Off (PTO)',
      unit: 'Days',
      requires_allocation: true,
      approval_workflow: 'by_hr',
      is_paid: true,
      display_color: '#5B4FE9',
    },
    {
      id: 'tot_sick',
      name: 'Sick Leave',
      unit: 'Days',
      requires_allocation: true,
      approval_workflow: 'by_hr',
      is_paid: true,
      display_color: '#F59E0B',
    },
    {
      id: 'tot_parental',
      name: 'Parental Leave',
      unit: 'Days',
      requires_allocation: true,
      approval_workflow: 'by_hr',
      is_paid: true,
      display_color: '#3B82F6',
    },
    {
      id: 'tot_unpaid',
      name: 'Unpaid Leave',
      unit: 'Days',
      requires_allocation: false,
      approval_workflow: 'by_hr',
      is_paid: false,
      display_color: '#6B7280',
    },
  ],
  time_off_allocations: [
    {
      id: 'alloc_amara_pto_2026',
      employee_id: 'emp_amara',
      time_off_type_id: 'tot_paid',
      allocated: 20,
      taken: 3,
      valid_from: '2026-01-01',
      valid_until: '2026-12-31',
    },
    {
      id: 'alloc_amara_sick_2026',
      employee_id: 'emp_amara',
      time_off_type_id: 'tot_sick',
      allocated: 10,
      taken: 0,
      valid_from: '2026-01-01',
      valid_until: '2026-12-31',
    },
    {
      id: 'alloc_amara_parental_2026',
      employee_id: 'emp_amara',
      time_off_type_id: 'tot_parental',
      allocated: 15,
      taken: 0,
      valid_from: '2026-01-01',
      valid_until: '2026-12-31',
    },
  ],
  time_off_requests: [
    {
      id: 'tor_1',
      employee_id: 'emp_amara',
      time_off_type_id: 'tot_paid',
      start_date: '2026-09-10',
      end_date: '2026-09-12',
      requested_amount: 3,
      status: 'Approved',
      approved_by: 'emp_admin',
      created_at: '2026-09-01T10:00:00Z',
    },
  ],
  attendances: [
    {
      id: 'att_1',
      employee_id: 'emp_amara',
      check_in: '2026-09-01T09:00:00Z',
      check_out: '2026-09-01T17:00:00Z',
      worked_hours: 8,
      overtime_hours: 1,
      is_manual_correction: false,
      audit_note: null,
    },
    {
      id: 'att_2',
      employee_id: 'emp_amara',
      check_in: '2026-09-02T09:00:00Z',
      check_out: null, // Missing check-out exception demo
      worked_hours: null,
      overtime_hours: 0,
      is_manual_correction: false,
      audit_note: null,
    },
  ],
};

