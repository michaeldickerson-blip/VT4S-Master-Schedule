-- VT4S Master Schedule Database Schema
-- Run this SQL in your Supabase SQL Editor to create the tables

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  weekly_pattern JSONB NOT NULL, -- Stores WeeklyPattern object
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Schedule entries table
CREATE TABLE IF NOT EXISTS schedule_entries (
  id SERIAL PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  shift TEXT NOT NULL,
  hours INTEGER NOT NULL,
  is_swapped BOOLEAN DEFAULT FALSE,
  is_time_off BOOLEAN DEFAULT FALSE,
  is_custom_hours BOOLEAN DEFAULT FALSE,
  UNIQUE(employee_id, date)
);

-- Change requests table
CREATE TABLE IF NOT EXISTS change_requests (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('time_off', 'swap', 'custom_hours')),
  date DATE,
  swap_from DATE,
  swap_to DATE,
  custom_shift TEXT,
  custom_hours INTEGER,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by TEXT,
  approved_at TIMESTAMPTZ
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'fes', 'guest')),
  password_hash TEXT NOT NULL,
  employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL
);

-- Team changes table (audit log)
CREATE TABLE IF NOT EXISTS team_changes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('employee_added', 'employee_updated', 'employee_removed', 'schedule_pattern_changed')),
  employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changes JSONB NOT NULL -- Stores change details
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_schedule_entries_employee_id ON schedule_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_date ON schedule_entries(date);
CREATE INDEX IF NOT EXISTS idx_change_requests_employee_id ON change_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_team_changes_employee_id ON team_changes(employee_id);
CREATE INDEX IF NOT EXISTS idx_team_changes_timestamp ON team_changes(timestamp);

-- Enable Row Level Security (RLS) - for now, allow all operations
-- You can tighten this later based on your authentication needs
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_changes ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for now)
-- In production, you should restrict these based on user roles
CREATE POLICY "Allow all operations on employees" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on schedule_entries" ON schedule_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on change_requests" ON change_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on team_changes" ON team_changes FOR ALL USING (true) WITH CHECK (true);

