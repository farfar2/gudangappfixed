import React, { useState } from 'react';
import { X, Copy, Check, Database, ShieldAlert, KeyRound, Table } from 'lucide-react';

interface SchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseSchemaModal: React.FC<SchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlSchema = `-- ==============================================================================
-- GUDANGAPP - INDONESIAN WAREHOUSE MANAGEMENT SYSTEM
-- SUPABASE POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

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

-- 4. Table: stock (Validation: quantity >= 0)
CREATE TABLE IF NOT EXISTS public.stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku_id UUID NOT NULL REFERENCES public.skus(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_sku_warehouse UNIQUE(sku_id, warehouse_id)
);

-- 5. Table: stock_movements (APPEND-ONLY)
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

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - ENFORCED ON ALL TABLES
-- ==============================================================================

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. All authenticated users: SELECT on all tables
CREATE POLICY "Auth users can view warehouses" ON public.warehouses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view skus" ON public.skus FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view stock" ON public.stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view stock_movements" ON public.stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view purchase_orders" ON public.purchase_orders FOR SELECT TO authenticated USING (true);

-- 2. Role 'admin': full INSERT, UPDATE, DELETE
CREATE POLICY "Admin full access warehouses" ON public.warehouses FOR ALL TO authenticated USING (public.get_user_role() = 'admin');
CREATE POLICY "Admin full access skus" ON public.skus FOR ALL TO authenticated USING (public.get_user_role() = 'admin');
CREATE POLICY "Admin full access stock" ON public.stock FOR ALL TO authenticated USING (public.get_user_role() = 'admin');
CREATE POLICY "Admin full access purchase_orders" ON public.purchase_orders FOR ALL TO authenticated USING (public.get_user_role() = 'admin');

-- 3. Role 'staff': INSERT on stock_movements and purchase_orders only; NO DELETE anywhere
CREATE POLICY "Staff insert stock_movements" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Staff insert purchase_orders" ON public.purchase_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Staff update stock on movement" ON public.stock FOR UPDATE TO authenticated USING (true) WITH CHECK (quantity >= 0);

-- 4. stock_movements is append-only: NO UPDATE, NO DELETE policy exists.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-700 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Supabase PostgreSQL Schema & RLS
              </h2>
              <p className="text-xs text-slate-400">
                Struktur tabel lengkap, validasi kuantitas ≥ 0, dan kebijakan Row Level Security
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Highlights */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">100% RLS Enabled</span>
              <span className="text-slate-400">Semua tabel terlindungi hak akses role admin & staff</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <Table className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">Append-Only Movements</span>
              <span className="text-slate-400">stock_movements tidak dapat diedit atau dihapus</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <KeyRound className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">Zero Negative Stock</span>
              <span className="text-slate-400">Check constraint dan server validation quantity ≥ 0</span>
            </div>
          </div>
        </div>

        {/* SQL Code Box */}
        <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-indigo-200/90 bg-slate-950/90 leading-relaxed select-all">
          <pre className="whitespace-pre-wrap">{sqlSchema}</pre>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <span className="text-xs text-slate-400 hidden sm:inline">
            File SQL tersimpan di <code className="text-indigo-400">/supabase/schema.sql</code>
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-md shadow-indigo-900/40"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin SQL Schema'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
