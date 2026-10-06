import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Layers, Search, Filter, Download, ArrowUpDown, Info } from 'lucide-react';
import { formatNumber, exportToCSV } from '../lib/utils';
import { StockHealthStatus } from '../types/database';

export const InventoryView: React.FC = () => {
  const { inventoryItems, warehouses } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'dos' | 'stock_a' | 'stock_b' | 'total' | 'ads'>('dos');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    inventoryItems.forEach(i => set.add(i.sku.category));
    return Array.from(set);
  }, [inventoryItems]);

  // Filtering & Sorting
  const filteredItems = useMemo(() => {
    let result = inventoryItems.filter(item => {
      if (selectedCategory !== 'all' && item.sku.category !== selectedCategory) return false;
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;

      // Warehouse filter
      if (selectedWarehouseFilter === 'gudang_a' && item.stock_gudang_a <= 0) return false;
      if (selectedWarehouseFilter === 'gudang_b' && item.stock_gudang_b <= 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.sku.code.toLowerCase().includes(q);
        const matchName = item.sku.name.toLowerCase().includes(q);
        if (!matchCode && !matchName) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortField === 'dos') {
        valA = a.dos !== null ? a.dos : 99999;
        valB = b.dos !== null ? b.dos : 99999;
      } else if (sortField === 'stock_a') {
        valA = a.stock_gudang_a;
        valB = b.stock_gudang_a;
      } else if (sortField === 'stock_b') {
        valA = a.stock_gudang_b;
        valB = b.stock_gudang_b;
      } else if (sortField === 'total') {
        valA = a.total_stock;
        valB = b.total_stock;
      } else if (sortField === 'ads') {
        valA = a.ads;
        valB = b.ads;
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [inventoryItems, selectedCategory, selectedStatus, selectedWarehouseFilter, searchQuery, sortField, sortOrder]);

  const handleToggleSort = (field: 'dos' | 'stock_a' | 'stock_b' | 'total' | 'ads') => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Kode SKU',
      'Nama Barang',
      'Kategori',
      'Stok Gudang A (Primary)',
      'Stok Gudang B (Buffer)',
      'Total Stok',
      'Penjualan 10 Bulan',
      'ADS (Rata-rata Penjualan/Hari)',
      'Days of Stock (DoS)',
      'Status Kesehatan Stok',
    ];

    const rows = filteredItems.map(item => [
      item.sku.code,
      item.sku.name,
      item.sku.category,
      item.stock_gudang_a,
      item.stock_gudang_b,
      item.total_stock,
      item.total_sales_10m,
      item.ads,
      item.dos !== null ? item.dos : '—',
      item.status === 'critical' ? 'Kritis (<7 hari)' : item.status === 'low' ? 'Menipis (7-14 hari)' : 'Aman (≥14 hari)',
    ]);

    exportToCSV(`GudangApp_Inventaris_Stok_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-indigo-400" />
            <span>Inventaris & Days of Stock (DoS)</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Monitoring stok multi-gudang, Average Daily Sales (ADS), dan level ketahanan pasokan
          </p>
        </div>

        <button
          id="btn-export-inventory-csv"
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl shadow-sm transition-all min-h-[44px]"
        >
          <Download className="w-4 h-4 text-slate-400" />
          <span>Export Inventaris CSV</span>
        </button>
      </div>

      {/* Formula Explanation Banner */}
      <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-indigo-200">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
          <div>
            <span className="font-bold text-slate-100 block">Rumus Average Daily Sales (ADS):</span>
            <span className="text-indigo-300 font-mono text-[11px]">
              ADS = Total Penjualan 10 Bulan Terakhir / 300 Hari
            </span>
          </div>
          <div>
            <span className="font-bold text-slate-100 block">Rumus Days of Stock (DoS):</span>
            <span className="text-indigo-300 font-mono text-[11px]">
              DoS = Stok Gudang A (Primary) / ADS
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-slate-800 shadow-xl shadow-black/20 flex flex-col lg:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-inventory"
            type="text"
            placeholder="Cari kode SKU / nama..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
          {/* Warehouse Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <span className="font-semibold text-slate-400">Gudang:</span>
            <select
              value={selectedWarehouseFilter}
              onChange={e => setSelectedWarehouseFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-xs font-semibold text-slate-200 cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-100">Semua Gudang</option>
              <option value="gudang_a" className="bg-slate-900 text-slate-100">Hanya Gudang A</option>
              <option value="gudang_b" className="bg-slate-900 text-slate-100">Hanya Gudang B</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <span className="font-semibold text-slate-400">Kategori:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-transparent focus:outline-none text-xs font-semibold text-slate-200 cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-100">Semua Kategori</option>
              {categories.map(c => (
                <option key={c} value={c} className="bg-slate-900 text-slate-100">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <span className="font-semibold text-slate-400">Status:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-transparent focus:outline-none text-xs font-semibold text-slate-200 cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-100">Semua Status</option>
              <option value="critical" className="bg-slate-900 text-slate-100">Kritis (&lt; 7 hari)</option>
              <option value="low" className="bg-slate-900 text-slate-100">Menipis (7–14 hari)</option>
              <option value="ok" className="bg-slate-900 text-slate-100">Aman (≥ 14 hari)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl shadow-black/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/60 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3 px-4">Kode SKU</th>
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-4">Kategori</th>
                <th
                  onClick={() => handleToggleSort('stock_a')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Gudang A (Primary)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('stock_b')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Gudang B (Buffer)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('ads')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>ADS</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('dos')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Days of Stock (DoS)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                    Tidak ada data inventaris yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  let badgeBg = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
                  let statusLabel = 'Aman (≥14h)';

                  if (item.status === 'critical') {
                    badgeBg = 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
                    statusLabel = 'Kritis (<7h)';
                  } else if (item.status === 'low') {
                    badgeBg = 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
                    statusLabel = 'Menipis (7-14h)';
                  }

                  return (
                    <tr key={item.sku.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                        {item.sku.code}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-100">
                        {item.sku.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-semibold">
                          {item.sku.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        {formatNumber(item.stock_gudang_a)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatNumber(item.stock_gudang_b)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {item.ads > 0 ? formatNumber(item.ads, 2) : '0'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-white">
                          {item.dos !== null ? `${formatNumber(item.dos, 1)} hari` : '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeBg}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
