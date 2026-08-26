import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Download, TrendingUp, Package, DollarSign } from 'lucide-react';

type Metric = 'volume' | 'revenue';

const formatIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

export const AnalyticsView: React.FC = () => {
  const { inventoryItems } = useInventory();
  const [metric, setMetric]     = useState<Metric>('volume');
  const [filterCat, setFilterCat] = useState('all');
  const [topN, setTopN]           = useState(20);

  const categories = useMemo(() =>
    Array.from(new Set(inventoryItems.map(i => i.sku.category).filter(Boolean))).sort(),
    [inventoryItems]);

  // Enrich items with revenue
  const enriched = useMemo(() =>
    inventoryItems.map(i => ({
      ...i,
      revenue: i.total_sales_10m * i.sku.price_per_unit,
    })), [inventoryItems]);

  // Total untuk %
  const totalVolume  = useMemo(() => enriched.reduce((s, i) => s + i.total_sales_10m, 0), [enriched]);
  const totalRevenue = useMemo(() => enriched.reduce((s, i) => s + i.revenue, 0), [enriched]);

  // Filtered + sorted
  const ranked = useMemo(() => {
    let items = filterCat === 'all' ? enriched : enriched.filter(i => i.sku.category === filterCat);
    return items
      .filter(i => metric === 'volume' ? i.total_sales_10m > 0 : i.revenue > 0)
      .sort((a, b) => metric === 'volume'
        ? b.total_sales_10m - a.total_sales_10m
        : b.revenue - a.revenue)
      .slice(0, topN);
  }, [enriched, metric, filterCat, topN]);

  // Category summary
  const catSummary = useMemo(() => {
    const map: Record<string, { volume: number; revenue: number }> = {};
    enriched.forEach(i => {
      const cat = i.sku.category || 'Lainnya';
      if (!map[cat]) map[cat] = { volume: 0, revenue: 0 };
      map[cat].volume  += i.total_sales_10m;
      map[cat].revenue += i.revenue;
    });
    return Object.entries(map)
      .map(([cat, v]) => ({ cat, ...v }))
      .sort((a, b) => metric === 'volume' ? b.volume - a.volume : b.revenue - a.revenue)
      .slice(0, 5);
  }, [enriched, metric]);

  const exportCSV = () => {
    const rows = [
      ['Rank','Kode SKU','Nama Barang','Kategori','Total Penjualan (pcs)','ADS (pcs/hari)','Nilai Penjualan (Rp)','% dari Total'],
      ...ranked.map((item, i) => [
        i + 1, item.sku.code, item.sku.name, item.sku.category,
        item.total_sales_10m, item.ads.toFixed(1),
        item.revenue, `${(item.total_sales_10m / totalVolume * 100).toFixed(2)}%`,
      ]),
    ];
    const csv  = '\uFEFF' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `laporan_laris_${metric}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const pct = (v: number, total: number) => total > 0 ? (v / total * 100).toFixed(1) : '0.0';

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-heading">Laporan Analitik</div>
          <div className="page-sub">Produk terlaris berdasarkan data penjualan 10 bulan (Jan–Okt 2023)</div>
        </div>
        <button className="btn btn-secondary" onClick={exportCSV}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid-auto grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total Volume Penjualan</div>
          <div className="stat-value" style={{ fontSize: 22, color: 'var(--blue-600)' }}>
            {totalVolume.toLocaleString('id')}
          </div>
          <div className="stat-sub">pcs dalam 10 bulan</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Estimasi Total Revenue</div>
          <div className="stat-value" style={{ fontSize: 18, color: 'var(--green-600)' }}>
            {formatIDR(totalRevenue)}
          </div>
          <div className="stat-sub">berdasarkan harga catalog</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">SKU Berkontribusi</div>
          <div className="stat-value" style={{ color: 'var(--gray-800)' }}>
            {enriched.filter(i => i.total_sales_10m > 0).length}
          </div>
          <div className="stat-sub">dari {enriched.length} SKU aktif</div>
        </div>
      </div>

      {/* Category bars */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)', marginBottom: 14 }}>
          Top 5 Kategori Terlaris
        </div>
        {catSummary.map((c, i) => {
          const val   = metric === 'volume' ? c.volume : c.revenue;
          const total = metric === 'volume' ? totalVolume : totalRevenue;
          const pctVal = total > 0 ? val / total * 100 : 0;
          return (
            <div key={c.cat} style={{ marginBottom: i < catSummary.length - 1 ? 12 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--gray-700)' }}>{c.cat}</span>
                <span style={{ fontSize: 12, color: 'var(--gray-400)', fontVariantNumeric: 'tabular-nums' }}>
                  {metric === 'volume'
                    ? `${c.volume.toLocaleString('id')} pcs`
                    : formatIDR(c.revenue)
                  } · {pctVal.toFixed(1)}%
                </span>
              </div>
              <div style={{ height: 6, background: 'var(--gray-100)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pctVal}%`, background: 'var(--blue-500)',
                               borderRadius: 99, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="toolbar" style={{ marginBottom: 12 }}>
        {/* Metric toggle */}
        <div style={{ display: 'flex', background: 'var(--gray-100)', borderRadius: 'var(--radius)',
                       padding: 3, gap: 2 }}>
          {([['volume', 'Volume (pcs)', Package], ['revenue', 'Nilai (Rp)', DollarSign]] as const).map(([m, label, Icon]) => (
            <button key={m} onClick={() => setMetric(m as Metric)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12.5,
                fontWeight: metric === m ? 600 : 400,
                background: metric === m ? 'var(--white)' : 'transparent',
                color: metric === m ? 'var(--blue-700)' : 'var(--gray-500)',
                boxShadow: metric === m ? 'var(--shadow-xs)' : 'none',
                transition: 'all 0.15s',
              }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        <select className="form-select" style={{ width: 180 }}
          value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="all">Semua Kategori</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="form-select" style={{ width: 120 }}
          value={topN} onChange={e => setTopN(Number(e.target.value))}>
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
          <option value={50}>Top 50</option>
          <option value={9999}>Semua</option>
        </select>

        <span className="text-muted text-sm" style={{ marginLeft: 'auto' }}>
          {ranked.length} SKU ditampilkan
        </span>
      </div>

      {/* Table */}
      <div className="tbl-wrap">
        <div className="tbl-wrap-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Kode SKU</th>
                <th>Nama Barang</th>
                <th>Kategori</th>
                <th style={{ textAlign: 'right' }}>Total Terjual</th>
                <th style={{ textAlign: 'right' }}>ADS</th>
                <th style={{ textAlign: 'right' }}>Nilai Penjualan</th>
                <th style={{ textAlign: 'right' }}>% Total</th>
                <th style={{ textAlign: 'right' }}>Stok A</th>
                <th style={{ textAlign: 'right' }}>Stok B</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((item, i) => {
                const mainPct = metric === 'volume'
                  ? pct(item.total_sales_10m, totalVolume)
                  : pct(item.revenue, totalRevenue);
                const barWidth = metric === 'volume'
                  ? (item.total_sales_10m / (ranked[0]?.total_sales_10m || 1)) * 100
                  : (item.revenue / (ranked[0]?.revenue || 1)) * 100;
                return (
                  <tr key={item.sku.id}>
                    <td style={{ textAlign: 'center', fontWeight: 600,
                                  color: i < 3 ? 'var(--blue-600)' : 'var(--gray-300)', fontSize: 13 }}>
                      {i + 1}
                    </td>
                    <td><span className="sku-code">{item.sku.code}</span></td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap', fontWeight: 450, color: 'var(--gray-800)' }}>
                      {item.sku.name}
                    </td>
                    <td className="text-sm text-muted">{item.sku.category}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <div style={{ width: 48, height: 4, background: 'var(--gray-100)', borderRadius: 99,
                                       overflow: 'hidden', flexShrink: 0 }}>
                          <div style={{ height: '100%', width: `${barWidth}%`,
                                         background: 'var(--blue-400)', borderRadius: 99 }} />
                        </div>
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                          {item.total_sales_10m.toLocaleString('id')}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                                  fontSize: 13, color: 'var(--gray-500)' }}>
                      {item.ads.toFixed(1)}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                      {formatIDR(item.revenue)}
                    </td>
                    <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--gray-400)',
                                  fontVariantNumeric: 'tabular-nums' }}>
                      {mainPct}%
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                      {item.stock_gudang_a.toLocaleString('id')}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                      {item.stock_gudang_b.toLocaleString('id')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
