import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { ActiveTab } from '../components/layout/Sidebar';
import { ChevronRight, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight } from 'lucide-react';

interface Props { onNavigate: (tab: ActiveTab) => void; }

export const DashboardView: React.FC<Props> = ({ onNavigate }) => {
  const { inventoryItems, criticalCount, lowStockCount, okStockCount, todayMovements } = useInventory();

  const topCritical = [...inventoryItems]
    .filter(i => i.dos !== null && i.dos < 30)
    .sort((a, b) => (a.dos ?? 9999) - (b.dos ?? 9999))
    .slice(0, 10);

  const stats = [
    { label: 'Total SKU Aktif', value: inventoryItems.length, sub: 'terdaftar', color: 'var(--blue-600)' },
    { label: 'Stok Kritis',     value: criticalCount,          sub: 'DoS < 7 hari',  color: 'var(--red-600)'   },
    { label: 'Stok Rendah',     value: lowStockCount,          sub: 'DoS 7–14 hari', color: 'var(--amber-600)' },
    { label: 'Stok Aman',       value: okStockCount,           sub: 'DoS ≥ 14 hari', color: 'var(--green-600)' },
  ];

  const dosBadge = (dos: number | null) => {
    if (dos === null || dos >= 9999) return { label: '—',            cls: 'badge-gray'  };
    if (dos < 7)                     return { label: `${dos.toFixed(1)} hr`, cls: 'badge-red'   };
    if (dos < 14)                    return { label: `${dos.toFixed(1)} hr`, cls: 'badge-amber' };
    return                                  { label: `${dos.toFixed(1)} hr`, cls: 'badge-green' };
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid-auto grid-4" style={{ marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 20, alignItems: 'start' }}>
        {/* Critical Table */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>Prioritas Restock</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>Diurutkan berdasarkan Days of Stock terendah</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('restock')}>
              Kalkulator <ChevronRight size={13} />
            </button>
          </div>
          <div className="tbl-wrap">
            <div className="tbl-wrap-scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Kode SKU</th>
                    <th>Nama Barang</th>
                    <th>Kategori</th>
                    <th style={{ textAlign: 'right' }}>Stok A</th>
                    <th style={{ textAlign: 'right' }}>ADS</th>
                    <th>Days of Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {topCritical.length === 0 ? (
                    <tr><td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-title">Semua stok dalam kondisi aman ✓</div>
                      </div>
                    </td></tr>
                  ) : topCritical.map(item => {
                    const b = dosBadge(item.dos);
                    return (
                      <tr key={item.sku.id}>
                        <td><span className="sku-code">{item.sku.code}</span></td>
                        <td style={{ maxWidth: 180 }}>
                          <span style={{ fontSize: 13, display: 'block', overflow: 'hidden',
                                         textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.sku.name}
                          </span>
                        </td>
                        <td><span className="text-muted text-sm">{item.sku.category}</span></td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {item.stock_gudang_a.toLocaleString('id')}
                        </td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--gray-500)' }}>
                          {item.ads > 0 ? item.ads.toFixed(1) : '—'}
                        </td>
                        <td><span className={`badge ${b.cls}`}>{b.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card card-pad">
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)', marginBottom: 14 }}>
              Aktivitas Hari Ini
            </div>
            {[
              { label: 'Scan Masuk',   icon: <ArrowDownToLine size={14} />, value: todayMovements?.inCount ?? 0,       color: 'var(--green-600)' },
              { label: 'Scan Keluar',  icon: <ArrowUpFromLine size={14} />, value: todayMovements?.outCount ?? 0,      color: 'var(--red-600)'   },
              { label: 'Transfer B→A', icon: <ArrowLeftRight size={14} />,  value: todayMovements?.transferCount ?? 0, color: 'var(--blue-600)'  },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 0', borderBottom: i < 2 ? '1px solid var(--gray-100)' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gray-500)', fontSize: 13 }}>
                  <span style={{ color: row.color }}>{row.icon}</span>{row.label}
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-900)', fontVariantNumeric: 'tabular-nums' }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="card card-pad">
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)', marginBottom: 12 }}>
              Aksi Cepat
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {([
                ['Scan Masuk',         'scan_in',  'var(--green-600)'],
                ['Scan Keluar',        'scan_out', 'var(--red-600)'  ],
                ['Kalkulator Restock', 'restock',  'var(--blue-600)' ],
              ] as const).map(([label, tab, color]) => (
                <button key={tab} className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', fontSize: 13 }}
                  onClick={() => onNavigate(tab as ActiveTab)}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
