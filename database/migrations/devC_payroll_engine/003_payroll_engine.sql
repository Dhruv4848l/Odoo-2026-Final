-- Phase 1: Payroll Engine (Dev C)
-- Run this in Supabase SQL Editor after 001_core_schema.sql

CREATE TABLE salary_structures (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE salary_rules (
    id SERIAL PRIMARY KEY,
    structure_id INT REFERENCES salary_structures(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    sequence INT NOT NULL,
    computation_method VARCHAR(50) NOT NULL, -- 'Fixed', 'Percentage', 'Formula'
    amount DECIMAL(10, 2),
    formula TEXT,
    condition_expression TEXT
);

CREATE TABLE payruns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    structure_id INT REFERENCES salary_structures(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft', -- Draft, Validated, Paid
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payslips (
    id SERIAL PRIMARY KEY,
    payrun_id INT REFERENCES payruns(id) ON DELETE CASCADE,
    employee_id INT REFERENCES employees(id) NOT NULL,
    contract_id INT REFERENCES contracts(id) NOT NULL,
    basic_wage DECIMAL(10, 2) NOT NULL,
    gross_wage DECIMAL(10, 2) NOT NULL,
    net_wage DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft'
);

CREATE TABLE payslip_lines (
    id SERIAL PRIMARY KEY,
    payslip_id INT REFERENCES payslips(id) ON DELETE CASCADE,
    rule_id INT REFERENCES salary_rules(id),
    amount DECIMAL(10, 2) NOT NULL
);

CREATE TABLE payslip_attachments (
    id SERIAL PRIMARY KEY,
    payslip_id INT REFERENCES payslips(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
