-- ==============================================================================
-- GUDANGAPP - INDONESIAN WAREHOUSE MANAGEMENT SYSTEM
-- SUPABASE POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: warehouses
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('primary', 'buffer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Table: profiles (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Table: skus
CREATE TABLE IF NOT EXISTS public.skus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    supplier TEXT NOT NULL,
    price_per_unit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    qty_per_box INTEGER NOT NULL DEFAULT 1 CHECK (qty_per_box > 0),
    m3_per_box NUMERIC(10, 4) NOT NULL DEFAULT 0.01 CHECK (m3_per_box > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Table: stock
CREATE TABLE IF NOT EXISTS public.stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku_id UUID NOT NULL REFERENCES public.skus(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_sku_warehouse UNIQUE(sku_id, warehouse_id)
);

-- 5. Table: stock_movements (Append-only)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'transfer', 'adjustment')),
    sku_id UUID NOT NULL REFERENCES public.skus(id) ON DELETE RESTRICT,
    from_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    to_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reference_number TEXT,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Table: purchase_orders
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'partial', 'received', 'cancelled')),
    supplier TEXT NOT NULL,
    expected_date DATE,
    notes TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Table: sales_history (Used to compute Average Daily Sales / ADS over 10 months)
CREATE TABLE IF NOT EXISTS public.sales_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku_id UUID NOT NULL REFERENCES public.skus(id) ON DELETE CASCADE,
    total_sales_10m INTEGER NOT NULL DEFAULT 0 CHECK (total_sales_10m >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_sku_sales UNIQUE(sku_id)
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables (Zero exceptions)
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_history ENABLE ROW LEVEL SECURITY;

-- Helper function to get the current user's role from public.profiles
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- POLICIES: warehouses
-- ------------------------------------------------------------------------------
-- Authenticated users can view warehouses
CREATE POLICY "Auth users can view warehouses"
    ON public.warehouses FOR SELECT
    TO authenticated
    USING (true);

-- Only admins can manage warehouses
CREATE POLICY "Admins can insert warehouses"
    ON public.warehouses FOR INSERT
    TO authenticated
    WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can update warehouses"
    ON public.warehouses FOR UPDATE
    TO authenticated
    USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete warehouses"
    ON public.warehouses FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'admin');

-- ------------------------------------------------------------------------------
-- POLICIES: profiles
-- ------------------------------------------------------------------------------
CREATE POLICY "Auth users can view profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'admin');

-- ------------------------------------------------------------------------------
-- POLICIES: skus
-- ------------------------------------------------------------------------------
CREATE POLICY "Auth users can view skus"
    ON public.skus FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can insert skus"
    ON public.skus FOR INSERT
    TO authenticated
    WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can update skus"
    ON public.skus FOR UPDATE
    TO authenticated
    USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete skus"
    ON public.skus FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'admin');

-- ------------------------------------------------------------------------------
-- POLICIES: stock
-- ------------------------------------------------------------------------------
CREATE POLICY "Auth users can view stock"
    ON public.stock FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage stock"
    ON public.stock FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'admin');

CREATE POLICY "Staff can update stock quantities during authorized movements"
    ON public.stock FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (quantity >= 0);

-- ------------------------------------------------------------------------------
-- POLICIES: stock_movements (APPEND-ONLY)
-- ------------------------------------------------------------------------------
CREATE POLICY "Auth users can view stock movements"
    ON public.stock_movements FOR SELECT
    TO authenticated
    USING (true);

-- Both admin and staff can insert stock movements
CREATE POLICY "Auth users can insert stock movements"
    ON public.stock_movements FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- NO UPDATE policy is created (stock_movements is append-only)
-- NO DELETE policy is created (stock_movements is append-only)

-- ------------------------------------------------------------------------------
-- POLICIES: purchase_orders
-- ------------------------------------------------------------------------------
CREATE POLICY "Auth users can view purchase orders"
    ON public.purchase_orders FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Auth users can insert purchase orders"
    ON public.purchase_orders FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update purchase orders"
    ON public.purchase_orders FOR UPDATE
    TO authenticated
    USING (public.get_user_role() = 'admin' OR auth.uid() = created_by);

CREATE POLICY "Admins can delete purchase orders"
    ON public.purchase_orders FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'admin');

-- ------------------------------------------------------------------------------
-- POLICIES: sales_history
-- ------------------------------------------------------------------------------
CREATE POLICY "Auth users can view sales history"
    ON public.sales_history FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage sales history"
    ON public.sales_history FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'admin');

-- ==============================================================================
-- SEED DATA (INITIAL DATA INSERTION)
-- ==============================================================================

-- Insert Warehouses
INSERT INTO public.warehouses (id, name, type) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Gudang A', 'primary'),
    ('00000000-0000-0000-0000-000000000002', 'Gudang B', 'buffer')
ON CONFLICT (id) DO NOTHING;
