-- Create menu_selections table for storing selected menu items by date
CREATE TABLE IF NOT EXISTS menu_selections (
  id serial PRIMARY KEY,
  date date NOT NULL UNIQUE,
  items text[] DEFAULT ARRAY[]::text[],
  updated_at timestamp DEFAULT now()
);

-- Insert today's menu selection (example)
INSERT INTO menu_selections (date, items)
VALUES (CURRENT_DATE, ARRAY[]::text[])
ON CONFLICT (date) DO NOTHING;
-- IIMR Canteen Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CURRIES TABLE
CREATE TABLE IF NOT EXISTS curries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0 AND quantity <= 3),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  picked_up BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. SETTINGS TABLE (singleton)
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1,
  selected_curries UUID[] DEFAULT ARRAY[]::UUID[],
  special_day BOOLEAN DEFAULT FALSE,
  canteen_closed BOOLEAN DEFAULT FALSE,
  extra_plates_available INT DEFAULT 0,
  cutoff_time TIME DEFAULT '12:00:00',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize settings with one row
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 5. INDEXES
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_date ON orders(date);
CREATE INDEX idx_orders_picked_up ON orders(picked_up);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE curries ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
-- Users can only read their own profile
CREATE POLICY users_select_own ON users FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY users_select_admin ON users FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true)
  );

-- Users can update their own profile
CREATE POLICY users_update_own ON users FOR UPDATE
  USING (auth.uid() = id);

-- CURRIES POLICIES
-- Everyone can read curries
CREATE POLICY curries_select_public ON curries FOR SELECT
  TO authenticated
  USING (TRUE);

-- Only admins can insert, update, delete curries
CREATE POLICY curries_insert_admin ON curries FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true)
  );

CREATE POLICY curries_update_admin ON curries FOR UPDATE
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true)
  );

CREATE POLICY curries_delete_admin ON curries FOR DELETE
  USING (
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true)
  );

-- ORDERS POLICIES
-- Users can read their own orders
CREATE POLICY orders_select_own ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all orders
CREATE POLICY orders_select_admin ON orders FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true)
  );

-- Users can insert their own orders
CREATE POLICY orders_insert_own ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own orders (before cutoff only)
CREATE POLICY orders_update_own ON orders FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can update any order (for pickup status)
CREATE POLICY orders_update_admin ON orders FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true)
  );

-- Users can delete their own orders (before cutoff only)
CREATE POLICY orders_delete_own ON orders FOR DELETE
  USING (auth.uid() = user_id);

-- SETTINGS POLICIES
-- Everyone can read settings
CREATE POLICY settings_select_public ON settings FOR SELECT
  TO authenticated
  USING (TRUE);

-- Only admins can update settings
CREATE POLICY settings_update_admin ON settings FOR UPDATE
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE is_admin = true)
  );

-- 7. FUNCTIONS

-- Update admin user
CREATE OR REPLACE FUNCTION set_admin_user(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users SET is_admin = TRUE WHERE id = user_id;
END;
$$;

-- Get selected curries with details
CREATE OR REPLACE FUNCTION get_selected_curries()
RETURNS TABLE (
  id UUID,
  title TEXT,
  image_url TEXT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT c.id, c.title, c.image_url
  FROM curries c
  WHERE c.id = ANY((SELECT selected_curries FROM settings LIMIT 1))
$$;
