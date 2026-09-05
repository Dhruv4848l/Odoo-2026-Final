import { createClient } from '@supabase/supabase-js';

// Configuration from environment
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Standard seed memory store for immediate local execution & fallback
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
    {
      id: 'emp_admin',
      first_name: 'System',
      last_name: 'Admin',
      email: 'admin@peoplepay360.com',
      phone: '+1 (555) 000-0000',
      job_position: 'Platform Administrator',
      department_id: 'dept_hr',
      manager_id: null,
      working_schedule_id: 'sched_std_40h',
      status: 'active',
      private_email: 'admin@peoplepay360.com',
      bank_account: 'US00BANK0000000000',
      hire_date: '2025-01-01',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
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
    {
      id: 'usr_hrmgr',
      email: 'hr.manager@peoplepay360.com',
      password: 'password123',
      role_id: 'hr_manager',
      employee_id: null,
    },
    {
      id: 'usr_payroll',
      email: 'payroll@peoplepay360.com',
      password: 'password123',
      role_id: 'hr_payroll_manager',
      employee_id: null,
    },
    {
      id: 'usr_amara',
      email: 'amara.chen@peoplepay360.com',
      password: 'password123',
      role_id: 'employee',
      employee_id: 'emp_amara',
    },
  ],
};
