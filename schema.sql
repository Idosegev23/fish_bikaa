-- Fish Order System (דגי בקעת אונו) - Supabase Database Schema
-- This file documents the expected database structure.
-- Run in Supabase SQL Editor to recreate the schema.

-- =============================================
-- 1. fish_types - Fish inventory
-- =============================================
CREATE TABLE IF NOT EXISTS fish_types (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  water_type TEXT NOT NULL CHECK (water_type IN ('saltwater', 'freshwater', 'other')),
  price_per_kg NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  description TEXT,
  available_kg NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sale_unit TEXT DEFAULT 'kg' CHECK (sale_unit IN ('units', 'kg')),
  average_weight_kg NUMERIC,
  sold_by_customer_weight BOOLEAN DEFAULT false,
  has_sizes BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 2. cut_types - Cutting methods
-- =============================================
CREATE TABLE IF NOT EXISTS cut_types (
  id BIGSERIAL PRIMARY KEY,
  cut_name TEXT NOT NULL,
  default_addition NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 3. fish_available_cuts - Which cuts are available for each fish
-- =============================================
CREATE TABLE IF NOT EXISTS fish_available_cuts (
  id BIGSERIAL PRIMARY KEY,
  fish_id BIGINT NOT NULL REFERENCES fish_types(id) ON DELETE CASCADE,
  cut_type_id BIGINT NOT NULL REFERENCES cut_types(id) ON DELETE CASCADE,
  price_addition NUMERIC,
  is_active BOOLEAN DEFAULT true
);

-- =============================================
-- 4. fish_cut_prices - Price overrides per fish+cut
-- =============================================
CREATE TABLE IF NOT EXISTS fish_cut_prices (
  id BIGSERIAL PRIMARY KEY,
  fish_id BIGINT NOT NULL REFERENCES fish_types(id) ON DELETE CASCADE,
  cut_type_id BIGINT NOT NULL REFERENCES cut_types(id) ON DELETE CASCADE,
  override_price NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 5. holidays - Seasonal ordering periods
-- =============================================
CREATE TABLE IF NOT EXISTS holidays (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  active BOOLEAN DEFAULT false,
  pickup_deadline DATE,
  supplier_report_deadline DATE
);

-- =============================================
-- 6. orders - Customer orders
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  delivery_address TEXT,
  delivery_date DATE NOT NULL,
  delivery_time TEXT NOT NULL,
  order_items JSONB NOT NULL DEFAULT '[]',
  total_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'weighing', 'ready', 'completed')),
  is_holiday_order BOOLEAN DEFAULT false,
  holiday_id BIGINT REFERENCES holidays(id),
  extras JSONB,
  extras_total NUMERIC DEFAULT 0,
  kitchen_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 7. additional_products - Extra items (spices, sauces, etc.)
-- =============================================
CREATE TABLE IF NOT EXISTS additional_products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'unit',
  image_url TEXT,
  available_units NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  category TEXT,
  meal_tags TEXT[],
  suggest_tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 8. coupons - Discount codes
-- =============================================
CREATE TABLE IF NOT EXISTS coupons (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 9. availability_slots - Delivery/pickup time windows
-- =============================================
CREATE TABLE IF NOT EXISTS availability_slots (
  id BIGSERIAL PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_orders INTEGER NOT NULL DEFAULT 10,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 10. meal_recommendations - Suggested pairings
-- =============================================
CREATE TABLE IF NOT EXISTS meal_recommendations (
  id BIGSERIAL PRIMARY KEY,
  fish_id BIGINT NOT NULL REFERENCES fish_types(id) ON DELETE CASCADE,
  cut_type_id BIGINT NOT NULL REFERENCES cut_types(id) ON DELETE CASCADE,
  meal_name TEXT NOT NULL,
  recommended_products TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fish_id, cut_type_id, meal_name)
);

-- =============================================
-- 11. cut_meal_tags - Meal type tags per cut
-- =============================================
CREATE TABLE IF NOT EXISTS cut_meal_tags (
  id BIGSERIAL PRIMARY KEY,
  cut_type_id BIGINT NOT NULL REFERENCES cut_types(id) ON DELETE CASCADE,
  meal_tag TEXT NOT NULL
);
