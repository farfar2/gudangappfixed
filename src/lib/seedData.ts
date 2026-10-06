import { Warehouse, Profile, SKU, Stock, StockMovement, PurchaseOrder, SalesHistory } from '../types/database';

export const SEED_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-001',
    name: 'Gudang A',
    type: 'primary',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'wh-002',
    name: 'Gudang B',
    type: 'buffer',
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

export const SEED_PROFILES: Profile[] = [
  {
    id: 'usr-admin',
    full_name: 'Budi Santoso',
    role: 'admin',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr-staff',
    full_name: 'Rian Pratama',
    role: 'staff',
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

export const SEED_SKUS: SKU[] = [
  {
    id: 'sku-001',
    code: '7RHXF4XX',
    name: 'Timbangan Kopi Digital Drip Scale Timer 3kg',
    category: 'Elektronik',
    supplier: 'PT Maju Jaya Elektronik',
    price_per_unit: 145000,
    qty_per_box: 20,
    m3_per_box: 0.045,
    is_active: true,
    created_at: '2026-01-10T08:00:00.000Z',
    updated_at: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'sku-002',
    code: '7ROT80BK',
    name: 'Kacamata Las Otomatis Auto Darkening Solar',
    category: 'Perkakas',
    supplier: 'CV Teknik Perkasa Mandiri',
    price_per_unit: 68000,
    qty_per_box: 50,
    m3_per_box: 0.060,
    is_active: true,
    created_at: '2026-01-12T09:00:00.000Z',
    updated_at: '2026-01-12T09:00:00.000Z',
  },
  {
    id: 'sku-003',
    code: '7RTH3SBK',
    name: 'Senter Kepala LED COB Rechargeable 500 Lumens',
    category: 'Penerangan',
    supplier: 'PT Surya Terang Nusantara',
    price_per_unit: 42500,
    qty_per_box: 40,
    m3_per_box: 0.035,
    is_active: true,
    created_at: '2026-01-15T10:00:00.000Z',
    updated_at: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'sku-004',
    code: '7RSE20SV',
    name: 'Set Obeng Presisi 115 in 1 Repair Tool Kit',
    category: 'Perkakas',
    supplier: 'CV Teknik Perkasa Mandiri',
    price_per_unit: 89000,
    qty_per_box: 30,
    m3_per_box: 0.040,
    is_active: true,
    created_at: '2026-01-18T11:00:00.000Z',
    updated_at: '2026-01-18T11:00:00.000Z',
  },
  {
    id: 'sku-005',
    code: '7ROX45BK',
    name: 'Pompa Ban Elektrik Portable Air Compressor 150 PSI',
    category: 'Otomotif',
    supplier: 'PT Auto Speed Indo',
    price_per_unit: 235000,
    qty_per_box: 12,
    m3_per_box: 0.055,
    is_active: true,
    created_at: '2026-01-20T14:00:00.000Z',
    updated_at: '2026-01-20T14:00:00.000Z',
  },
  {
    id: 'sku-006',
    code: '7RHA66BK',
    name: 'Mic Clip On Wireless Lavalier Type-C / Lightning',
    category: 'Elektronik',
    supplier: 'PT Maju Jaya Elektronik',
    price_per_unit: 95000,
    qty_per_box: 50,
    m3_per_box: 0.030,
    is_active: true,
    created_at: '2026-01-22T15:00:00.000Z',
    updated_at: '2026-01-22T15:00:00.000Z',
  },
  {
    id: 'sku-007',
    code: '7RHO12WH',
    name: 'Diffuser Aromaterapi Ultrasonik Humidifier 500ml',
    category: 'Rumah Tangga',
    supplier: 'CV Sejahtera Abadi',
    price_per_unit: 110000,
    qty_per_box: 16,
    m3_per_box: 0.048,
    is_active: true,
    created_at: '2026-01-25T16:00:00.000Z',
    updated_at: '2026-01-25T16:00:00.000Z',
  },
  {
    id: 'sku-008',
    code: '7RBT44BL',
    name: 'Speaker Bluetooth Mini Portable IPX5 Waterproof',
    category: 'Elektronik',
    supplier: 'PT Sound Prima Audio',
    price_per_unit: 125000,
    qty_per_box: 24,
    m3_per_box: 0.038,
    is_active: true,
    created_at: '2026-01-28T09:00:00.000Z',
    updated_at: '2026-01-28T09:00:00.000Z',
  },
  {
    id: 'sku-009',
    code: '7RMT09GY',
    name: 'Digital Multimeter AC/DC Tester Voltmeter NCV',
    category: 'Perkakas',
    supplier: 'CV Teknik Perkasa Mandiri',
    price_per_unit: 165000,
    qty_per_box: 20,
    m3_per_box: 0.042,
    is_active: true,
    created_at: '2026-02-01T10:00:00.000Z',
    updated_at: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'sku-010',
    code: '7RCL02BK',
    name: 'Gantungan Kunci Multitool Karabin EDC 10 in 1',
    category: 'Outdoor',
    supplier: 'CV Petualang Sejati',
    price_per_unit: 32000,
    qty_per_box: 100,
    m3_per_box: 0.025,
    is_active: true,
    created_at: '2026-02-05T11:00:00.000Z',
    updated_at: '2026-02-05T11:00:00.000Z',
  },
  {
    id: 'sku-011',
    code: '7RKF19SL',
    name: 'Gunting Dapur Stainless Steel Multifungsi Bone Cutter',
    category: 'Rumah Tangga',
    supplier: 'CV Sejahtera Abadi',
    price_per_unit: 48000,
    qty_per_box: 60,
    m3_per_box: 0.036,
    is_active: true,
    created_at: '2026-02-08T13:00:00.000Z',
    updated_at: '2026-02-08T13:00:00.000Z',
  },
  {
    id: 'sku-012',
    code: '7RCS88BK',
    name: 'Car Holder HP Mobil Dashboard Magnetik 360',
    category: 'Otomotif',
    supplier: 'PT Auto Speed Indo',
    price_per_unit: 39000,
    qty_per_box: 80,
    m3_per_box: 0.032,
    is_active: true,
    created_at: '2026-02-10T14:00:00.000Z',
    updated_at: '2026-02-10T14:00:00.000Z',
  }
];

// Initial stock allocation for Gudang A (Primary) and Gudang B (Buffer)
export const SEED_STOCK: Stock[] = [
  // sku-001 (Critical: Gudang A = 22, ADS = 9.5 -> DoS = 2.3 days)
  { id: 'stk-001-a', sku_id: 'sku-001', warehouse_id: 'wh-001', quantity: 22, updated_at: '2026-08-20T08:00:00Z' },
  { id: 'stk-001-b', sku_id: 'sku-001', warehouse_id: 'wh-002', quantity: 180, updated_at: '2026-08-20T08:00:00Z' },

  // sku-002 (Critical: Gudang A = 15, ADS = 4.2 -> DoS = 3.6 days)
  { id: 'stk-002-a', sku_id: 'sku-002', warehouse_id: 'wh-001', quantity: 15, updated_at: '2026-08-20T08:00:00Z' },
  { id: 'stk-002-b', sku_id: 'sku-002', warehouse_id: 'wh-002', quantity: 250, updated_at: '2026-08-20T08:00:00Z' },

  // sku-003 (Critical: Gudang A = 30, ADS = 6.0 -> DoS = 5.0 days)
  { id: 'stk-003-a', sku_id: 'sku-003', warehouse_id: 'wh-001', quantity: 30, updated_at: '2026-08-20T08:00:00Z' },
  { id: 'stk-003-b', sku_id: 'sku-003', warehouse_id: 'wh-002', quantity: 320, updated_at: '2026-08-20T08:00:00Z' },

  // sku-004 (Low Stock: Gudang A = 55, ADS = 6.5 -> DoS = 8.5 days)
  { id: 'stk-004-a', sku_id: 'sku-004', warehouse_id: 'wh-001', quantity: 55, updated_at: '2026-08-20T08:00:00Z' },
  { id: 'stk-004-b', sku_id: 'sku-004', warehouse_id: 'wh-002', quantity: 140, updated_at: '2026-08-20T08:00:00Z' },

  // sku-005 (Low Stock: Gudang A = 40, ADS = 3.8 -> DoS = 10.5 days)
  { id: 'stk-005-a', sku_id: 'sku-005', warehouse_id: 'wh-001', quantity: 40, updated_at: '2026-08-20T08:00:00Z' },
  { id: 'stk-005-b', sku_id: 'sku-005', warehouse_id: 'wh-002', quantity: 96, updated_at: '2026-08-20T08:00:00Z' },

  // sku-006 (Low Stock: Gudang A = 85, ADS = 7.0 -> DoS = 12.1 days)
  { id: 'stk-006-a', sku_id: 'sku-006', warehouse_id: 'wh-001', quantity: 85, updated_at: '2026-08-20T08:00:00Z' },
  { id: 'stk-006-b', sku_id: 'sku-006', warehouse_id: 'wh-002', quantity: 300, updated_at: '2026-08-20T08:00:00Z' },

  // sku-007 (OK: Gudang A = 120, ADS = 5.0 -> DoS = 24.0 days)
  { id: 'stk-007-a', sku_id: 'sku-007', warehouse_id: 'wh-001', quantity: 120, updated_at: '2026-08-20T08:00:00Z' },
  { id: 'stk-007-b', sku_id: 'sku-007', warehouse_id: 'wh-002', quantity: 80, updated_at: '2026-08-20T08:00:00Z' },

  // sku-008 (OK: Gudang A = 95, ADS = 4.0 -> DoS = 23.75 days)
  { id: 'stk-008-a', sku_id: 'sku-008', warehouse_id: 'wh-001', quantity: 95, updated_at: '2026-08-20T08:00:00Z' },
  { id: 'stk-008-b', sku_id: 'sku-008', warehouse_id: 'wh-002', quantity: 120, updated_at: '2026-08-20T08:00:00Z' },

  // sku-009 (OK: Gudang A = 70, ADS = 2.5 -> DoS = 28.0 days)
  { id: 'stk-009-a', sku_id: 'sku-009', warehouse_id: 'wh-001', quantity: 70, updated_at: '2026-08-20T08:00:00Z' },
  { id: 'stk-009-b', sku_id: 'sku-009', warehouse_id: 'wh-002', quantity: 60, updated_at: '2026-08-20T08:00:00Z' },

  // sku-010 (OK: Gudang A = 250, ADS = 8.0 -> DoS = 31.25 days)
  { id: 'stk-010-a', sku_id: 'sku-010', warehouse_id: 'wh-001', quantity: 250, updated_at: '2026-08-20T08:00:00Z' },
  { id: 'stk-010-b', sku_id: 'sku-010', warehouse_id: 'wh-002', quantity: 400, updated_at: '2026-08-20T08:00:00Z' },

  // sku-011 (Critical: Gudang A = 18, ADS = 3.5 -> DoS = 5.1 days)
  { id: 'stk-011-a', sku_id: 'sku-011', warehouse_id: 'wh-001', quantity: 18, updated_at: '2026-08-20T08:00:00Z' },
  { id: 'stk-011-b', sku_id: 'sku-011', warehouse_id: 'wh-002', quantity: 120, updated_at: '2026-08-20T08:00:00Z' },

  // sku-012 (OK: Gudang A = 160, ADS = 5.2 -> DoS = 30.7 days)
  { id: 'stk-012-a', sku_id: 'sku-012', warehouse_id: 'wh-001', quantity: 160, updated_at: '2026-08-20T08:00:00Z' },
  { id: 'stk-012-b', sku_id: 'sku-012', warehouse_id: 'wh-002', quantity: 240, updated_at: '2026-08-20T08:00:00Z' },
];

// Sales history for last 10 months (300 days)
// ADS = total_sales_10m / 300
export const SEED_SALES_HISTORY: SalesHistory[] = [
  { id: 'sh-001', sku_id: 'sku-001', total_sales_10m: 2850, updated_at: '2026-08-20T08:00:00Z' }, // ADS = 9.5
  { id: 'sh-002', sku_id: 'sku-002', total_sales_10m: 1260, updated_at: '2026-08-20T08:00:00Z' }, // ADS = 4.2
  { id: 'sh-003', sku_id: 'sku-003', total_sales_10m: 1800, updated_at: '2026-08-20T08:00:00Z' }, // ADS = 6.0
  { id: 'sh-004', sku_id: 'sku-004', total_sales_10m: 1950, updated_at: '2026-08-20T08:00:00Z' }, // ADS = 6.5
  { id: 'sh-005', sku_id: 'sku-005', total_sales_10m: 1140, updated_at: '2026-08-20T08:00:00Z' }, // ADS = 3.8
  { id: 'sh-006', sku_id: 'sku-006', total_sales_10m: 2100, updated_at: '2026-08-20T08:00:00Z' }, // ADS = 7.0
  { id: 'sh-007', sku_id: 'sku-007', total_sales_10m: 1500, updated_at: '2026-08-20T08:00:00Z' }, // ADS = 5.0
  { id: 'sh-008', sku_id: 'sku-008', total_sales_10m: 1200, updated_at: '2026-08-20T08:00:00Z' }, // ADS = 4.0
  { id: 'sh-009', sku_id: 'sku-009', total_sales_10m: 750, updated_at: '2026-08-20T08:00:00Z' },  // ADS = 2.5
  { id: 'sh-010', sku_id: 'sku-010', total_sales_10m: 2400, updated_at: '2026-08-20T08:00:00Z' }, // ADS = 8.0
  { id: 'sh-011', sku_id: 'sku-011', total_sales_10m: 1050, updated_at: '2026-08-20T08:00:00Z' }, // ADS = 3.5
  { id: 'sh-012', sku_id: 'sku-012', total_sales_10m: 1560, updated_at: '2026-08-20T08:00:00Z' }, // ADS = 5.2
];

// Initial stock movements log (Append-only)
export const SEED_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-001',
    type: 'in',
    sku_id: 'sku-001',
    to_warehouse_id: 'wh-002',
    quantity: 100,
    reference_number: 'PO-20260815-001',
    notes: 'Penerimaan PO Supplier PT Maju Jaya',
    created_by: 'usr-admin',
    created_at: '2026-08-23T08:30:00.000Z',
    sku_code: '7RHXF4XX',
    sku_name: 'Timbangan Kopi Digital Drip Scale Timer 3kg',
    to_warehouse_name: 'Gudang B',
    created_by_name: 'Budi Santoso',
  },
  {
    id: 'mov-002',
    type: 'out',
    sku_id: 'sku-001',
    from_warehouse_id: 'wh-001',
    quantity: 8,
    reference_number: 'INV-20260823-010',
    notes: 'Order Fulfillment Marketplace Shopee',
    created_by: 'usr-staff',
    created_at: '2026-08-23T09:15:00.000Z',
    sku_code: '7RHXF4XX',
    sku_name: 'Timbangan Kopi Digital Drip Scale Timer 3kg',
    from_warehouse_name: 'Gudang A',
    created_by_name: 'Rian Pratama',
  },
  {
    id: 'mov-003',
    type: 'transfer',
    sku_id: 'sku-002',
    from_warehouse_id: 'wh-002',
    to_warehouse_id: 'wh-001',
    quantity: 50,
    reference_number: 'TRF-20260823-001',
    notes: 'Restock harian buffer ke primary',
    created_by: 'usr-admin',
    created_at: '2026-08-23T10:00:00.000Z',
    sku_code: '7ROT80BK',
    sku_name: 'Kacamata Las Otomatis Auto Darkening Solar',
    from_warehouse_name: 'Gudang B',
    to_warehouse_name: 'Gudang A',
    created_by_name: 'Budi Santoso',
  },
  {
    id: 'mov-004',
    type: 'in',
    sku_id: 'sku-003',
    to_warehouse_id: 'wh-001',
    quantity: 20,
    reference_number: 'RCV-SCAN-004',
    notes: 'Scan In Cepat Petugas Shift Pagi',
    created_by: 'usr-staff',
    created_at: '2026-08-23T11:45:00.000Z',
    sku_code: '7RTH3SBK',
    sku_name: 'Senter Kepala LED COB Rechargeable 500 Lumens',
    to_warehouse_name: 'Gudang A',
    created_by_name: 'Rian Pratama',
  },
  {
    id: 'mov-005',
    type: 'out',
    sku_id: 'sku-004',
    from_warehouse_id: 'wh-001',
    quantity: 12,
    reference_number: 'INV-20260823-018',
    notes: 'Order Fulfillment Tokopedia Toko Cabang',
    created_by: 'usr-staff',
    created_at: '2026-08-23T13:20:00.000Z',
    sku_code: '7RSE20SV',
    sku_name: 'Set Obeng Presisi 115 in 1 Repair Tool Kit',
    from_warehouse_name: 'Gudang A',
    created_by_name: 'Rian Pratama',
  }
];

// Seed Purchase Orders
export const SEED_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-001',
    po_number: 'PO-20260820-001',
    status: 'partial',
    supplier: 'PT Maju Jaya Elektronik',
    expected_date: '2026-08-28',
    notes: 'Pengiriman batch 1 via Truk Ekspedisi JNE Cargo',
    items: [
      {
        sku_id: 'sku-001',
        sku_code: '7RHXF4XX',
        sku_name: 'Timbangan Kopi Digital Drip Scale Timer 3kg',
        quantity: 200,
        unit_price: 145000,
        received_quantity: 100,
      },
      {
        sku_id: 'sku-006',
        sku_code: '7RHA66BK',
        sku_name: 'Mic Clip On Wireless Lavalier Type-C / Lightning',
        quantity: 150,
        unit_price: 95000,
        received_quantity: 0,
      },
    ],
    created_by: 'usr-admin',
    created_at: '2026-08-20T09:00:00.000Z',
    updated_at: '2026-08-23T08:30:00.000Z',
    created_by_name: 'Budi Santoso',
  },
  {
    id: 'po-002',
    po_number: 'PO-20260822-002',
    status: 'sent',
    supplier: 'CV Teknik Perkasa Mandiri',
    expected_date: '2026-08-30',
    notes: 'Restock bulanan perkakas bengkel',
    items: [
      {
        sku_id: 'sku-002',
        sku_code: '7ROT80BK',
        sku_name: 'Kacamata Las Otomatis Auto Darkening Solar',
        quantity: 300,
        unit_price: 68000,
        received_quantity: 0,
      },
      {
        sku_id: 'sku-004',
        sku_code: '7RSE20SV',
        sku_name: 'Set Obeng Presisi 115 in 1 Repair Tool Kit',
        quantity: 150,
        unit_price: 89000,
        received_quantity: 0,
      },
    ],
    created_by: 'usr-admin',
    created_at: '2026-08-22T10:30:00.000Z',
    updated_at: '2026-08-22T10:30:00.000Z',
    created_by_name: 'Budi Santoso',
  },
  {
    id: 'po-003',
    po_number: 'PO-20260823-003',
    status: 'draft',
    supplier: 'PT Auto Speed Indo',
    expected_date: '2026-09-05',
    notes: 'Draft pesanan kompresor portable',
    items: [
      {
        sku_id: 'sku-005',
        sku_code: '7ROX45BK',
        sku_name: 'Pompa Ban Elektrik Portable Air Compressor 150 PSI',
        quantity: 100,
        unit_price: 235000,
        received_quantity: 0,
      },
    ],
    created_by: 'usr-admin',
    created_at: '2026-08-23T14:00:00.000Z',
    updated_at: '2026-08-23T14:00:00.000Z',
    created_by_name: 'Budi Santoso',
  }
];
