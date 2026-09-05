-- Phase 1: Attendance & Time Off (Dev B)
-- Run this in Supabase SQL Editor after 001_core_schema.sql

CREATE TABLE attendances (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id) NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out TIMESTAMP WITH TIME ZONE,
    worked_hours DECIMAL(5, 2),
    overtime_hours DECIMAL(5, 2) DEFAULT 0,
    is_manual_correction BOOLEAN DEFAULT FALSE,
    audit_note TEXT
);

CREATE TABLE time_off_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- 'Days' or 'Hours'
    requires_allocation BOOLEAN DEFAULT TRUE,
    approval_workflow VARCHAR(50),
    is_paid BOOLEAN DEFAULT TRUE,
    display_color VARCHAR(7)
);

CREATE TABLE time_off_allocations (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id) NOT NULL,
    time_off_type_id INT REFERENCES time_off_types(id) NOT NULL,
    allocated DECIMAL(5, 2) NOT NULL,
    taken DECIMAL(5, 2) DEFAULT 0,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL
);

CREATE TABLE time_off_requests (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id) NOT NULL,
    time_off_type_id INT REFERENCES time_off_types(id) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    requested_amount DECIMAL(5, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Refused
    approved_by INT REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
