-- Phase 0: Core Foundation (Dev A)
-- Run this in Supabase SQL Editor

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    manager_id INT -- FK to employees added later
);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department_id INT REFERENCES departments(id),
    job_position VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key now that employees table exists
ALTER TABLE departments ADD CONSTRAINT fk_dept_manager FOREIGN KEY (manager_id) REFERENCES employees(id);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Supabase Auth link
    employee_id INT REFERENCES employees(id) UNIQUE,
    role_id INT REFERENCES roles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE working_schedules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    hours_per_week DECIMAL(5, 2) NOT NULL,
    employee_id INT REFERENCES employees(id) -- if assigned to employee
);

CREATE TABLE working_schedule_days (
    id SERIAL PRIMARY KEY,
    schedule_id INT REFERENCES working_schedules(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL, -- 0=Sun, 1=Mon, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration_minutes INT DEFAULT 0
);

CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    wage DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Running',
    schedule_id INT REFERENCES working_schedules(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
