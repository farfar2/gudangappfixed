import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Download, Package, DollarSign, Calendar, TrendingUp } from 'lucide-react';

type Metric  = 'volume' | 'revenue';
type Mode    = 'historical' | 'live';

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const HIST_MONTHS = [1,2,3,4,5,6,7,8,9,10]; // Jan–Okt 2023

const formatIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

interface MonthlyRow { sku_id: string; month: number; quantity: number; }

export const AnalyticsView: React.FC = () => {
  const { inventoryItems, movements } = useInventory();

  const [metric, setMetric]       = useState<Metric>('volume');
  const [mode, setMode]           = useState<Mode>('historical');
  const [filterCat, setFilterCat] = useState('all');
  const [topN, setTopN]           = useState(20);

  // Historical: month range filter
  const [fromMonth, setFromMonth] = useState(1);
  const [toMonth,   setToMonth]   = useState(10);

  // Monthly data from Supabase
  const [monthlyData, setMonthlyData] = useState<MonthlyRow[]>([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  useEffect(() => {
    if (mode !== 'historical') return;
    const fetch = async () => {
      if (!isSupabaseConfigured || !supabase) return;
      setLoadingMonthly(true);
      const { data } = await supabase
        .from('sales_monthly')
        .select('sku_id, month, quantity')
        .eq('year', 2023)
        .gte('month', fromMonth)
        .lte('month', toMonth);
      setMonthlyData(data ?? []);
      setLoadingMonthly(false);
    };
    fetch();
  }, [mode, fromMonth, toMonth]);

  const categories = useMemo(() =>
    Array.from(new Set(inventoryItems.map(i => i.sku.category).filter(Boolean))).sort(),
    [inventoryItems]);

  // Historical: sum quantity per SKU for selected range
  const historicalBySku = useMemo(() => {
    const map: Record<string, number> = {};
    monthlyData.forEach(r => {
      map[r.sku_id] = (map[r.sku_id] ?? 0) + r.quantity;
    });
    return map;
  }, [monthlyData]);

  // Live: sum out movements per SKU
  const liveBySku = useMemo(() => {
    const map: Record<string, number> = {};
    movements.filter(m => m.type === 'out').forEach(m => {
      map[m.sku_id] = (map[m.sku_id] ?? 0) + m.quantity;
    });
    return map;
  }, [movements]);

  const skuVolume = mode === 'historical' ? historicalBySku : liveBySku;

  // Enrich + filter
  const enriched = useMemo(() => {
    let items = inventoryItems;
    if (filterCat !== 'all') items = items.filter(i => i.sku.category === filterCat);
    return items.map(i => ({
      ...i,
      periodVolume: skuVolume[i.sku.id] ?? 0,
      periodRevenue: (skuVolume[i.sku.id] ?? 0) * i.sku.price_per_unit,
    })).filter(i => metric === 'volume' ? i.periodVolume > 0 : i.periodRevenue > 0)
       .sort((a, b) => metric === 'volume'
         ? b.periodVolume - a.periodVolume
         : b.periodRevenue - a.periodRevenue)
       .slice(0, topN);
  }, [inventoryItems, skuVolume, filterCat, metric, topN]);

  const totalVolume  = useMemo(() => enriched.reduce((s, i) => s + i.periodVolume, 0),  [enriched]);
  const totalRevenue = useMemo(() => enriched.reduce((s, i) => s + i.periodRevenue, 0), [enriched]);

  // Category summary
  const catSummary = useMemo(() => {
    const map: Record<string, { volume: number; revenue: number }> = {};
    inventoryItems.forEach(i => {
      const cat = i.sku.category || 'Lainnya';
      const vol = skuVolume[i.sku.id] ?? 0;
      if (!map[cat]) map[cat] = { volume: 0, revenue: 0 };
      map[cat].volume  += vol;
      map[cat].revenue += vol * i.sku.price_per_unit;
    });
    return Object.entries(map)
      .map(([cat, v]) => ({ cat, ...v }))
      .sort((a, b) => metric === 'volume' ? b.volume - a.volume : b.revenue - a.revenue)
      .slice(0, 5);
  }, [inventoryItems, skuVolume, metric]);

  const catTotal = catSummary.reduce((s, c) => s + (metric === 'volume' ? c.volume : c.revenue), 0);

  const exportCSV = () => {
    const periodLabel = mode === 'historical'
      ? `${MONTHS[fromMonth-1]}-${MONTHS[toMonth-1]}_2023`
      : 'live';
    const rows = [
      ['Rank','Kode SKU','Nama Barang','Kategori','Volume (pcs)','Nilai (Rp)','% Total','Stok A','Stok B'],
      ...enriched.map((i, idx) => [
        idx+1, i.sku.code, i.sku.name, i.sku.category,
        i.periodVolume, i.periodRevenue,
        totalVolume > 0 ? `${(i.periodVolume/totalVolume*100).toFixed(2)}%` : '0%',
        i.stock_gudang_a, i.stock_gudang_b,
      ]),
    ];
    const csv  = '\uFEFF' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `laporan_${metric}_${periodLabel}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const periodLabel = mode === 'historical'
    ? `${MONTHS[fromMonth-1]} – ${MONTHS[toMonth-1]} 2023`
    : 'Data Live (dari app)';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="page-heading">Laporan Analitik</div>
          <div className="page-sub">Periode: {periodLabel}</div>
        </div>
        <button className="btn btn-secondary" onClick={exportCSV}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Mode + period controls */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Mode toggle */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)',
                           textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Sumber Data
            </div>
            <div style={{ display: 'flex', background: 'var(--gray-100)', borderRadius: 'var(--radius)', padding: 3, gap: 2 }}>
              {([['historical', 'Historis (2023)', Calendar], ['live', 'Live (dari app)', TrendingUp]] as const).map(([m, label, Icon]) => (
                <button key={m} onClick={() => setMode(m as Mode)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                    borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12.5,
                    fontWeight: mode === m ? 600 : 400,
                    background: mode === m ? 'var(--white)' : 'transparent',
                    color: mode === m ? 'var(--blue-700)' : 'var(--gray-500)',
                    boxShadow: mode === m ? 'var(--shadow-xs)' : 'none',
                    transition: 'all 0.15s',
                  }}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Month range (historical only) */}
          {mode === 'historical' && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)',
                             textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                Rentang Bulan
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select className="form-select" style={{ width: 110 }}
                  value={fromMonth} onChange={e => {
                    const v = Number(e.target.value);
                    setFromMonth(v);
                    if (v > toMonth) setToMonth(v);
                  }}>
                  {HIST_MONTHS.map(m => (
                    <option key={m} value={m}>{MONTHS[m-1]} 2023</option>
                  ))}
                </select>
                <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>—</span>
                <select className="form-select" style={{ width: 110 }}
                  value={toMonth} onChange={e => {
                    const v = Number(e.target.value);
                    setToMonth(v);
                    if (v < fromMonth) setFromMonth(v);
                  }}>
                  {HIST_MONTHS.filter(m => m >= fromMonth).map(m => (
                    <option key={m} value={m}>{MONTHS[m-1]} 2023</option>
                  ))}
                </select>
                <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                  ({toMonth - fromMonth + 1} bulan)
                </span>
              </div>
            </div>
          )}

          {/* Live mode note */}
          {mode === 'live' && (
            <div style={{ background: 'var(--amber-50)', border: '1px solid var(--amber-100)',
                           borderRadius: 'var(--radius)', padding: '8px 12px', fontSize: 12,
                           color: 'var(--amber-700)' }}>
              Data scan keluar dari app ditampilkan di sini. Belum ada data jika belum ada transaksi.
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid-auto grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total Volume Terjual</div>
          <div className="stat-value" style={{ fontSize: 22, color: 'var(--blue-600)' }}>
            {loadingMonthly ? '...' : totalVolume.toLocaleString('id')}
          </div>
          <div className="stat-sub">pcs · {periodLabel}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Estimasi Revenue</div>
          <div className="stat-value" style={{ fontSize: 16, color: 'var(--green-600)' }}>
            {loadingMonthly ? '...' : formatIDR(totalRevenue)}
          </div>
          <div className="stat-sub">berdasarkan harga catalog</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">SKU Berkontribusi</div>
          <div className="stat-value" style={{ color: 'var(--gray-800)' }}>
            {Object.keys(skuVolume).length}
          </div>
          <div className="stat-sub">dari {inventoryItems.length} SKU aktif</div>
        </div>
      </div>

      {/* Category bars */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)', marginBottom: 14 }}>
          Top 5 Kategori Terlaris
        </div>
        {catSummary.map((c, i) => {
          const val     = metric === 'volume' ? c.volume : c.revenue;
          const pctVal  = catTotal > 0 ? val / catTotal * 100 : 0;
          const maxVal  = metric === 'volume' ? catSummary[0].volume : catSummary[0].revenue;
          const barPct  = maxVal > 0 ? val / maxVal * 100 : 0;
          return (
            <div key={c.cat} style={{ marginBottom: i < catSummary.length - 1 ? 12 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--gray-700)' }}>{c.cat}</span>
                <span style={{ fontSize: 12, color: 'var(--gray-400)', fontVariantNumeric: 'tabular-nums' }}>
                  {metric === 'volume' ? `${c.volume.toLocaleString('id')} pcs` : formatIDR(c.revenue)}
                  {' · '}{pctVal.toFixed(1)}%
                </span>
              </div>
              <div style={{ height: 6, background: 'var(--gray-100)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${barPct}%`, background: 'var(--blue-500)',
                               borderRadius: 99, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Table controls */}
      <div className="toolbar" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', background: 'var(--gray-100)', borderRadius: 'var(--radius)', padding: 3, gap: 2 }}>
          {([['volume', 'Volume (pcs)', Package], ['revenue', 'Nilai (Rp)', DollarSign]] as const).map(([m, label, Icon]) => (
            <button key={m} onClick={() => setMetric(m as Metric)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12.5,
                fontWeight: metric === m ? 600 : 400,
                background: metric === m ? 'var(--white)' : 'transparent',
                color: metric === m ? 'var(--blue-700)' : 'var(--gray-500)',
                boxShadow: metric === m ? 'var(--shadow-xs)' : 'none', transition: 'all 0.15s',
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
          {enriched.length} SKU
        </span>
      </div>

      {/* Table */}
      <div className="tbl-wrap">
        <div className="tbl-wrap-scroll">
          {loadingMonthly ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-400)' }}>Memuat data...</div>
          ) : enriched.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">Belum ada data untuk periode ini</div>
              <div className="empty-sub">
                {mode === 'live' ? 'Mulai scan barang keluar untuk mengisi laporan ini' : 'Coba ubah rentang bulan'}
              </div>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Kode SKU</th>
                  <th>Nama / Kategori</th>
                  <th style={{ textAlign: 'right' }}>Volume (pcs)</th>
                  <th style={{ textAlign: 'right' }}>Nilai (Rp)</th>
                  <th style={{ textAlign: 'right' }}>% Total</th>
                  <th style={{ textAlign: 'right' }}>Stok A</th>
                  <th style={{ textAlign: 'right' }}>Stok B</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((item, i) => {
                  const pct = totalVolume > 0 ? (item.periodVolume / totalVolume * 100).toFixed(1) : '0.0';
                  const barW = enriched[0]?.periodVolume > 0
                    ? (item.periodVolume / enriched[0].periodVolume) * 100 : 0;
                  return (
                    <tr key={item.sku.id}>
                      <td style={{ textAlign: 'center', fontWeight: 600,
                                    color: i < 3 ? 'var(--blue-600)' : 'var(--gray-300)', fontSize: 13 }}>
                        {i + 1}
                      </td>
                      <td><span className="sku-code">{item.sku.code}</span></td>
                      <td>
                        <div style={{ fontWeight: 450, color: 'var(--gray-800)', fontSize: 13 }}>
                          {item.sku.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{item.sku.category}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          <div style={{ width: 48, height: 4, background: 'var(--gray-100)',
                                         borderRadius: 99, overflow: 'hidden', flexShrink: 0 }}>
                            <div style={{ height: '100%', width: `${barW}%`,
                                           background: 'var(--blue-400)', borderRadius: 99 }} />
                          </div>
                          <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                            {item.periodVolume.toLocaleString('id')}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                        {formatIDR(item.periodRevenue)}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--gray-400)',
                                    fontVariantNumeric: 'tabular-nums' }}>
                        {pct}%
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
          )}
        </div>
      </div>
    </div>
  );
};
