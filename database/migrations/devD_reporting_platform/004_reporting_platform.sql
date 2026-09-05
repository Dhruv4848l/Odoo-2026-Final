-- Phase 1: Reporting Platform (Dev D)
-- Run this in Supabase SQL Editor after 001_core_schema.sql and 003_payroll_engine.sql

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
    changed_by UUID REFERENCES users(id),
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE email_logs (
    id SERIAL PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    payslip_id INT REFERENCES payslips(id),
    status VARCHAR(50) NOT NULL, -- Sent, Failed
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
