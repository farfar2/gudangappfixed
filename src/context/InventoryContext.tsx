import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Warehouse, SKU, Stock, StockMovement, PurchaseOrder,
  SalesHistory, InventoryItem, MovementType, POStatus, StockHealthStatus,
} from '../types/database';
import { SEED_WAREHOUSES, SEED_SKUS, SEED_STOCK, SEED_SALES_HISTORY, SEED_MOVEMENTS, SEED_PURCHASE_ORDERS } from '../lib/seedData';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generatePONumber, parseSKUCSV } from '../lib/utils';

export interface ToastMessage {
  id: string; type: 'success' | 'error' | 'info' | 'warning'; title: string; message: string;
}

interface InventoryContextType {
  warehouses: Warehouse[]; skus: SKU[]; stocks: Stock[]; movements: StockMovement[];
  purchaseOrders: PurchaseOrder[]; salesHistories: SalesHistory[]; inventoryItems: InventoryItem[];
  criticalCount: number; lowStockCount: number; okStockCount: number; loading: boolean;
  todayMovements: { inCount: number; outCount: number; transferCount: number; totalCount: number; };
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
  refreshData: () => Promise<void>;
  addSKU: (data: Omit<SKU, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => Promise<{ success: boolean; error?: string }>;
  updateSKU: (id: string, data: Partial<Omit<SKU, 'id' | 'created_at'>>) => Promise<{ success: boolean; error?: string }>;
  softDeleteSKU: (id: string) => Promise<{ success: boolean; error?: string }>;
  importSKUs: (csvText: string) => Promise<{ added: number; updated: number; errors: string[] }>;
  recordScanIn: (p: { skuCodeOrId: string; warehouseId: string; quantity: number; referenceNumber?: string; notes?: string }) => Promise<{ success: boolean; error?: string }>;
  recordScanOut: (p: { skuCodeOrId: string; warehouseId: string; quantity: number; referenceNumber?: string; notes?: string }) => Promise<{ success: boolean; error?: string }>;
  executeBulkTransfer: (transfers: { sku_id: string; quantity: number }[], notes?: string) => Promise<{ success: boolean; count: number; error?: string }>;
  createPO: (data: { supplier: string; expected_date?: string | null; notes?: string | null; items: { sku_id: string; quantity: number; unit_price: number }[] }) => Promise<{ success: boolean; po?: PurchaseOrder; error?: string }>;
  updatePOStatus: (id: string, status: POStatus) => Promise<{ success: boolean; error?: string }>;
  receivePO: (poId: string, receivedItems: { sku_id: string; received_qty: number }[], notes?: string) => Promise<{ success: boolean; error?: string }>;
  findSKUByCode: (code: string) => SKU | undefined;
  getStock: (skuId: string, warehouseId: string) => number;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const GUDANG_A_ID = '00000000-0000-0000-0000-000000000001';
const GUDANG_B_ID = '00000000-0000-0000-0000-000000000002';

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();

  const [warehouses, setWarehouses] = useState<Warehouse[]>(SEED_WAREHOUSES);
  const [skus,            setSkus]            = useState<SKU[]>(SEED_SKUS);
  const [stocks,          setStocks]          = useState<Stock[]>(SEED_STOCK);
  const [movements,       setMovements]       = useState<StockMovement[]>(SEED_MOVEMENTS);
  const [purchaseOrders,  setPurchaseOrders]  = useState<PurchaseOrder[]>(SEED_PURCHASE_ORDERS);
  const [salesHistories,  setSalesHistories]  = useState<SalesHistory[]>(SEED_SALES_HISTORY);
  const [toasts,          setToasts]          = useState<ToastMessage[]>([]);
  const [loading,         setLoading]         = useState(false);

  // ─── Toast ─────────────────────────────────────────────────────────────────
  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(p => [...p, { id, type, title, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  const removeToast = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), []);

  // ─── Load from Supabase ────────────────────────────────────────────────────
  const loadFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !user) return;
    setLoading(true);
    try {
      const [whRes, skuRes, stockRes, movRes, poRes, salesRes] = await Promise.all([
        supabase.from('warehouses').select('*'),
        supabase.from('skus').select('*').order('code'),
        supabase.from('stock').select('*'),
        supabase.from('stock_movements').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('purchase_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('sales_history').select('*'),
      ]);
      if (skuRes.data   && skuRes.data.length > 0)   setSkus(skuRes.data);
      if (whRes.data    && whRes.data.length > 0)     setWarehouses(whRes.data);
      if (stockRes.data && stockRes.data.length > 0)  setStocks(stockRes.data);
      if (movRes.data   && movRes.data.length > 0)    setMovements(movRes.data);
      if (poRes.data    && poRes.data.length > 0)     setPurchaseOrders(poRes.data);
      if (salesRes.data && salesRes.data.length > 0)  setSalesHistories(salesRes.data);
    } catch (e) {
      console.error('Supabase load error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadFromSupabase(); }, [loadFromSupabase]);

  const refreshData = useCallback(() => loadFromSupabase(), [loadFromSupabase]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const findSKUByCode = useCallback((code: string) =>
    skus.find(s => s.code.toLowerCase() === code.toLowerCase() || s.id === code), [skus]);

  const getStock = useCallback((skuId: string, warehouseId: string) =>
    stocks.find(s => s.sku_id === skuId && s.warehouse_id === warehouseId)?.quantity ?? 0, [stocks]);

  // ─── Computed inventory items ──────────────────────────────────────────────
  const whA = warehouses.find(w => w.type === 'primary')?.id ?? GUDANG_A_ID;
  const whB = warehouses.find(w => w.type === 'buffer')?.id  ?? GUDANG_B_ID;

  const inventoryItems = useMemo<InventoryItem[]>(() => {
    return skus.filter(s => s.is_active).map(sku => {
      const stockA   = stocks.find(s => s.sku_id === sku.id && s.warehouse_id === whA)?.quantity ?? 0;
      const stockB   = stocks.find(s => s.sku_id === sku.id && s.warehouse_id === whB)?.quantity ?? 0;
      const sales10m = salesHistories.find(h => h.sku_id === sku.id)?.total_sales_10m ?? 0;
      const ads      = sales10m / 300;
      const dos: number | null = ads > 0 ? stockA / ads : null;
      const status: StockHealthStatus =
        ads === 0 ? 'none' : dos !== null && dos < 7 ? 'critical' : dos !== null && dos < 14 ? 'low' : 'ok';
      const safetyStock  = Math.round(ads * 14);
      const restockNeed  = Math.max(0, safetyStock - stockA);
      const restockQty   = Math.min(restockNeed, stockB);
      const m3PerPcs     = sku.qty_per_box > 0 ? sku.m3_per_box / sku.qty_per_box : 0;
      const volumeM3     = restockQty * m3PerPcs;
      return { sku, stock_gudang_a: stockA, stock_gudang_b: stockB, total_stock: stockA + stockB,
               total_sales_10m: sales10m, ads, dos, status, safety_stock: safetyStock,
               restock_need: restockNeed, restock_qty: restockQty, volume_m3: volumeM3 };
    });
  }, [skus, stocks, salesHistories, whA, whB]);

  const criticalCount  = useMemo(() => inventoryItems.filter(i => i.status === 'critical').length, [inventoryItems]);
  const lowStockCount  = useMemo(() => inventoryItems.filter(i => i.status === 'low').length, [inventoryItems]);
  const okStockCount   = useMemo(() => inventoryItems.filter(i => i.status === 'ok').length, [inventoryItems]);

  const todayMovements = useMemo(() => {
    const today = new Date().toDateString();
    const todayMov = movements.filter(m => new Date(m.created_at).toDateString() === today);
    return {
      inCount:       todayMov.filter(m => m.type === 'in').length,
      outCount:      todayMov.filter(m => m.type === 'out').length,
      transferCount: todayMov.filter(m => m.type === 'transfer').length,
      totalCount:    todayMov.length,
    };
  }, [movements]);

  // ─── Stock helper ──────────────────────────────────────────────────────────
  const upsertStock = async (skuId: string, warehouseId: string, newQty: number) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('stock').upsert(
        { sku_id: skuId, warehouse_id: warehouseId, quantity: newQty, updated_at: new Date().toISOString() },
        { onConflict: 'sku_id,warehouse_id' }
      );
    }
    setStocks(prev => {
      const idx = prev.findIndex(s => s.sku_id === skuId && s.warehouse_id === warehouseId);
      if (idx >= 0) { const next = [...prev]; next[idx] = { ...next[idx], quantity: newQty }; return next; }
      return [...prev, { id: `${skuId}-${warehouseId}`, sku_id: skuId, warehouse_id: warehouseId,
                         quantity: newQty, updated_at: new Date().toISOString() }];
    });
  };

  // ─── SKU CRUD ──────────────────────────────────────────────────────────────
  const addSKU = useCallback(async (data: Omit<SKU, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    if (!user) return { success: false, error: 'Belum login' };
    if (skus.find(s => s.code === data.code.toUpperCase()))
      return { success: false, error: `Kode SKU ${data.code} sudah digunakan` };
    const newSKU: SKU = { ...data, code: data.code.toUpperCase(), id: crypto.randomUUID(),
                           is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    if (isSupabaseConfigured && supabase) {
      const { data: d, error } = await supabase.from('skus').insert(newSKU).select().single();
      if (error) return { success: false, error: error.message };
      if (d) {
        await supabase.from('stock').insert([
          { sku_id: d.id, warehouse_id: GUDANG_A_ID, quantity: 0 },
          { sku_id: d.id, warehouse_id: GUDANG_B_ID, quantity: 0 },
        ]);
        setSkus(p => [...p, d]);
        setStocks(p => [...p,
          { id: crypto.randomUUID(), sku_id: d.id, warehouse_id: GUDANG_A_ID, quantity: 0, updated_at: new Date().toISOString() },
          { id: crypto.randomUUID(), sku_id: d.id, warehouse_id: GUDANG_B_ID, quantity: 0, updated_at: new Date().toISOString() },
        ]);
        return { success: true };
      }
    }
    setSkus(p => [...p, newSKU]);
    return { success: true };
  }, [skus, user]);

  const updateSKU = useCallback(async (id: string, data: Partial<Omit<SKU, 'id' | 'created_at'>>) => {
    if (!user) return { success: false, error: 'Belum login' };
    const updated = { ...data, updated_at: new Date().toISOString() };
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('skus').update(updated).eq('id', id);
      if (error) return { success: false, error: error.message };
    }
    setSkus(p => p.map(s => s.id === id ? { ...s, ...updated } : s));
    return { success: true };
  }, [user]);

  const softDeleteSKU = useCallback(async (id: string) => {
    if (!user || !isAdmin) return { success: false, error: 'Tidak ada akses' };
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('skus').update({ is_active: false }).eq('id', id);
      if (error) return { success: false, error: error.message };
    }
    setSkus(p => p.map(s => s.id === id ? { ...s, is_active: false } : s));
    return { success: true };
  }, [user, isAdmin]);

  // ─── Import SKUs (CSV text) ────────────────────────────────────────────────
  const importSKUs = useCallback(async (csvText: string) => {
    const { data: parsed, errors } = parseSKUCSV(csvText);   // FIX: 'data' bukan 'skus'
    if (errors.length > 0 && parsed.length === 0) return { added: 0, updated: 0, errors };

    let added = 0, updated = 0;
    const batchErrors: string[] = [...errors];

    for (const row of parsed) {
      const existing = skus.find(s => s.code === row.code.toUpperCase());
      if (existing) {
        const r = await updateSKU(existing.id, { name: row.name, category: row.category,
          supplier: row.supplier, price_per_unit: row.price_per_unit,
          qty_per_box: row.qty_per_box, m3_per_box: row.m3_per_box });
        if (r.success) updated++; else batchErrors.push(`${row.code}: ${r.error}`);
      } else {
        const r = await addSKU(row);
        if (r.success) added++; else batchErrors.push(`${row.code}: ${r.error}`);
      }
    }
    return { added, updated, errors: batchErrors };
  }, [skus, addSKU, updateSKU]);

  // ─── Scan In ───────────────────────────────────────────────────────────────
  const recordScanIn = useCallback(async (p: { skuCodeOrId: string; warehouseId: string; quantity: number; referenceNumber?: string; notes?: string }) => {
    if (!user) return { success: false, error: 'Belum login' };
    const sku = findSKUByCode(p.skuCodeOrId);
    if (!sku) return { success: false, error: `SKU tidak ditemukan: ${p.skuCodeOrId}` };
    const currentQty = getStock(sku.id, p.warehouseId);
    const newQty = currentQty + p.quantity;
    const mov: StockMovement = {
      id: crypto.randomUUID(), type: 'in', sku_id: sku.id,
      from_warehouse_id: null, to_warehouse_id: p.warehouseId, quantity: p.quantity,
      reference_number: p.referenceNumber ?? null, notes: p.notes ?? null,
      created_by: user.id, created_at: new Date().toISOString(),
      sku_code: sku.code, sku_name: sku.name,
    };
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('stock_movements').insert({ ...mov, sku_code: undefined, sku_name: undefined });
      if (error) return { success: false, error: error.message };
    }
    await upsertStock(sku.id, p.warehouseId, newQty);
    setMovements(prev => [mov, ...prev]);
    return { success: true };
  }, [user, findSKUByCode, getStock]);

  // ─── Scan Out ──────────────────────────────────────────────────────────────
  const recordScanOut = useCallback(async (p: { skuCodeOrId: string; warehouseId: string; quantity: number; referenceNumber?: string; notes?: string }) => {
    if (!user) return { success: false, error: 'Belum login' };
    const sku = findSKUByCode(p.skuCodeOrId);
    if (!sku) return { success: false, error: `SKU tidak ditemukan: ${p.skuCodeOrId}` };
    const currentQty = getStock(sku.id, p.warehouseId);
    if (p.quantity > currentQty)
      return { success: false, error: `Stok tidak cukup: tersedia ${currentQty}, diminta ${p.quantity}` };
    const mov: StockMovement = {
      id: crypto.randomUUID(), type: 'out', sku_id: sku.id,
      from_warehouse_id: p.warehouseId, to_warehouse_id: null, quantity: p.quantity,
      reference_number: p.referenceNumber ?? null, notes: p.notes ?? null,
      created_by: user.id, created_at: new Date().toISOString(),
      sku_code: sku.code, sku_name: sku.name,
    };
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('stock_movements').insert({ ...mov, sku_code: undefined, sku_name: undefined });
      if (error) return { success: false, error: error.message };
    }
    await upsertStock(sku.id, p.warehouseId, currentQty - p.quantity);
    setMovements(prev => [mov, ...prev]);
    return { success: true };
  }, [user, findSKUByCode, getStock]);

  // ─── Bulk Transfer B→A ─────────────────────────────────────────────────────
  const executeBulkTransfer = useCallback(async (transfers: { sku_id: string; quantity: number }[], notes?: string) => {
    if (!user) return { success: false, count: 0, error: 'Belum login' };
    let count = 0;
    for (const t of transfers) {
      const qtyB = getStock(t.sku_id, whB);
      const qty  = Math.min(t.quantity, qtyB);
      if (qty <= 0) continue;
      const mov: StockMovement = {
        id: crypto.randomUUID(), type: 'transfer', sku_id: t.sku_id,
        from_warehouse_id: whB, to_warehouse_id: whA, quantity: qty,
        reference_number: null, notes: notes ?? null,
        created_by: user.id, created_at: new Date().toISOString(),
      };
      if (isSupabaseConfigured && supabase) {
        await supabase.from('stock_movements').insert({ ...mov, sku_code: undefined, sku_name: undefined });
      }
      await upsertStock(t.sku_id, whB, qtyB - qty);
      await upsertStock(t.sku_id, whA, getStock(t.sku_id, whA) + qty);
      setMovements(prev => [mov, ...prev]);
      count++;
    }
    return { success: true, count };
  }, [user, getStock, whA, whB]);

  // ─── Purchase Orders ───────────────────────────────────────────────────────
  const createPO = useCallback(async (data: { supplier: string; expected_date?: string | null; notes?: string | null; items: { sku_id: string; quantity: number; unit_price: number }[] }) => {
    if (!user) return { success: false, error: 'Belum login' };
    const poNumber = generatePONumber(purchaseOrders);
    const items = data.items.map(i => {
      const sku = skus.find(s => s.id === i.sku_id);
      return { sku_id: i.sku_id, sku_code: sku?.code ?? '', sku_name: sku?.name ?? '',
               quantity: i.quantity, unit_price: i.unit_price, received_quantity: 0 };
    });
    const po: PurchaseOrder = {
      id: crypto.randomUUID(), po_number: poNumber, status: 'draft',
      supplier: data.supplier, expected_date: data.expected_date ?? null,
      notes: data.notes ?? null, items,
      created_by: user.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured && supabase) {
      const { data: d, error } = await supabase.from('purchase_orders').insert(po).select().single();
      if (error) return { success: false, error: error.message };
      if (d) { setPurchaseOrders(p => [d, ...p]); return { success: true, po: d }; }
    }
    setPurchaseOrders(p => [po, ...p]);
    return { success: true, po };
  }, [user, skus, purchaseOrders]);

  const updatePOStatus = useCallback(async (id: string, status: POStatus) => {
    if (!user) return { success: false, error: 'Belum login' };
    const updated = { status, updated_at: new Date().toISOString() };
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('purchase_orders').update(updated).eq('id', id);
      if (error) return { success: false, error: error.message };
    }
    setPurchaseOrders(p => p.map(po => po.id === id ? { ...po, ...updated } : po));
    return { success: true };
  }, [user]);

  const receivePO = useCallback(async (poId: string, receivedItems: { sku_id: string; received_qty: number }[], notes?: string) => {
    if (!user) return { success: false, error: 'Belum login' };
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return { success: false, error: 'PO tidak ditemukan' };
    for (const item of receivedItems) {
      if (item.received_qty <= 0) continue;
      const currentQty = getStock(item.sku_id, whB);
      await upsertStock(item.sku_id, whB, currentQty + item.received_qty);
      const sku = skus.find(s => s.id === item.sku_id);
      const mov: StockMovement = {
        id: crypto.randomUUID(), type: 'in', sku_id: item.sku_id,
        from_warehouse_id: null, to_warehouse_id: whB, quantity: item.received_qty,
        reference_number: po.po_number, notes: notes ?? `Penerimaan PO ${po.po_number}`,
        created_by: user.id, created_at: new Date().toISOString(),
        sku_code: sku?.code, sku_name: sku?.name,
      };
      if (isSupabaseConfigured && supabase) {
        await supabase.from('stock_movements').insert({ ...mov, sku_code: undefined, sku_name: undefined });
      }
      setMovements(prev => [mov, ...prev]);
    }
    const allReceived = receivedItems.every(i => i.received_qty > 0);
    await updatePOStatus(poId, allReceived ? 'received' : 'partial');
    return { success: true };
  }, [user, purchaseOrders, skus, getStock, whB, updatePOStatus]);

  const value: InventoryContextType = {
    warehouses, skus, stocks, movements, purchaseOrders, salesHistories,
    inventoryItems, criticalCount, lowStockCount, okStockCount, loading,
    todayMovements, toasts, addToast, removeToast, refreshData,
    addSKU, updateSKU, softDeleteSKU, importSKUs,
    recordScanIn, recordScanOut, executeBulkTransfer,
    createPO, updatePOStatus, receivePO,
    findSKUByCode, getStock,
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = () => {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
};
