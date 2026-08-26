export type UserRole = 'superadmin' | 'admin' | 'staff';

export type WarehouseType = 'primary' | 'buffer';

export interface Warehouse {
  id: string;
  name: string;
  type: WarehouseType;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface SKU {
  id: string;
  code: string;
  name: string;
  category: string;
  supplier: string;
  price_per_unit: number;
  qty_per_box: number;
  m3_per_box: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Stock {
  id: string;
  sku_id: string;
  warehouse_id: string;
  quantity: number;
  updated_at: string;
}

export type MovementType = 'in' | 'out' | 'transfer' | 'adjustment';

export interface StockMovement {
  id: string;
  type: MovementType;
  sku_id: string;
  from_warehouse_id?: string | null;
  to_warehouse_id?: string | null;
  quantity: number;
  reference_number?: string | null;
  notes?: string | null;
  created_by: string;
  created_at: string;
  sku_code?: string;
  sku_name?: string;
  from_warehouse_name?: string;
  to_warehouse_name?: string;
  created_by_name?: string;
}

export interface PurchaseOrderItem {
  sku_id: string;
  sku_code: string;
  sku_name: string;
  quantity: number;
  unit_price: number;
  received_quantity: number;
}

export type POStatus = 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  po_number: string;
  status: POStatus;
  supplier: string;
  expected_date?: string | null;
  notes?: string | null;
  items: PurchaseOrderItem[];
  created_by: string;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
}

export interface SalesHistory {
  id: string;
  sku_id: string;
  total_sales_10m: number;
  updated_at: string;
}

export type StockHealthStatus = 'critical' | 'low' | 'ok' | 'none';

export interface InventoryItem {
  sku: SKU;
  stock_gudang_a: number;
  stock_gudang_b: number;
  total_stock: number;
  total_sales_10m: number;
  ads: number;
  dos: number | null;
  status: StockHealthStatus;
  safety_stock: number;
  restock_need: number;
  restock_qty: number;
  volume_m3: number;
}
