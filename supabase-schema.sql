-- ================================================================
-- SuperAdmin POS - Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TENANTS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_code TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'USA',
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active','suspended','pending','deleted')),
  subscription_plan TEXT NOT NULL DEFAULT 'starter' CHECK (subscription_plan IN ('starter','professional','enterprise')),
  max_pos_devices INT NOT NULL DEFAULT 5,
  monthly_revenue DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── LICENSES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS licenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  license_key TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active','expired','revoked','pending')),
  max_activations INT NOT NULL DEFAULT 1,
  current_activations INT NOT NULL DEFAULT 0,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_checked_at TIMESTAMPTZ,
  hardware_id TEXT,
  features JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── POS DEVICES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_devices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  license_id UUID REFERENCES licenses(id) ON DELETE SET NULL,
  device_name TEXT NOT NULL,
  hardware_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online','offline','suspended')),
  last_seen_at TIMESTAMPTZ,
  ip_address TEXT,
  os_version TEXT,
  app_version TEXT,
  location TEXT,
  offline_checkins INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AUDIT LOGS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID,
  user_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── NOTIFICATIONS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','warning','error','success')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── UPDATED_AT TRIGGER ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER licenses_updated_at BEFORE UPDATE ON licenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER pos_devices_updated_at BEFORE UPDATE ON pos_devices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Super admin has full access (authenticated users for now)
CREATE POLICY "Authenticated users can read tenants"
  ON tenants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage tenants"
  ON tenants FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read licenses"
  ON licenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage licenses"
  ON licenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read devices"
  ON pos_devices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage devices"
  ON pos_devices FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read audit logs"
  ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert audit logs"
  ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can read notifications"
  ON notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage notifications"
  ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── INDEXES ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_code ON tenants(tenant_code);
CREATE INDEX IF NOT EXISTS idx_licenses_tenant ON licenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_expires ON licenses(expires_at);
CREATE INDEX IF NOT EXISTS idx_devices_tenant ON pos_devices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON pos_devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_hardware ON pos_devices(hardware_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- ── SAMPLE DATA ──────────────────────────────────────────────────
INSERT INTO tenants (tenant_code, business_name, owner_name, email, phone, city, country, status, subscription_plan, max_pos_devices, monthly_revenue)
VALUES
  ('TEN-P8X2K3', 'Portobello Bistro', 'Marco Rossi', 'marco@portobello.com', '+1-555-0101', 'New York', 'USA', 'active', 'enterprise', 20, 8400),
  ('TEN-S7Y4M1', 'Sunrise Café Chain', 'Sarah Johnson', 'sarah@sunrise.com', '+1-555-0102', 'Chicago', 'USA', 'active', 'professional', 15, 7200),
  ('TEN-M5R9Q6', 'Metro Burger Co.', 'James Wilson', 'james@metroburger.com', '+1-555-0103', 'Houston', 'USA', 'active', 'professional', 12, 6800),
  ('TEN-N3T7L5', 'Noodle House', 'Li Wei', 'li@noodlehouse.com', '+1-555-0104', 'San Francisco', 'USA', 'suspended', 'starter', 5, 4300),
  ('TEN-H2V8J4', 'The Pizza Hub', 'Antonio Ferrari', 'antonio@pizzahub.com', '+1-555-0105', 'Miami', 'USA', 'active', 'enterprise', 18, 5900)
ON CONFLICT (tenant_code) DO NOTHING;
