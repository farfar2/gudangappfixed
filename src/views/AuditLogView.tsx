import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  ShieldCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';
import { formatDateTime, formatNumber, exportToCSV } from '../lib/utils';
import { MovementType } from '../types/database';

export const AuditLogView: React.FC = () => {
  const { movements, warehouses } = useInventory();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      // Type filter
      if (selectedType !== 'all' && m.type !== selectedType) return false;

      // Warehouse filter
      if (selectedWarehouseId !== 'all') {
        const isRelated =
          m.from_warehouse_id === selectedWarehouseId ||
          m.to_warehouse_id === selectedWarehouseId;
        if (!isRelated) return false;
      }

      // Date range filter
      if (startDate) {
        const mDate = new Date(m.created_at).toISOString().slice(0, 10);
        if (mDate < startDate) return false;
      }
      if (endDate) {
        const mDate = new Date(m.created_at).toISOString().slice(0, 10);
        if (mDate > endDate) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSku = m.sku_code.toLowerCase().includes(q) || m.sku_name.toLowerCase().includes(q);
        const matchUser = (m.created_by_name || '').toLowerCase().includes(q);
        const matchRef = (m.reference_number || '').toLowerCase().includes(q);
        const matchNotes = (m.notes || '').toLowerCase().includes(q);
        if (!matchSku && !matchUser && !matchRef && !matchNotes) return false;
      }

      return true;
    });
  }, [movements, selectedType, selectedWarehouseId, startDate, endDate, searchQuery]);

  const handleExportCSV = () => {
    const headers = [
      'Waktu Log (ISO/WIB)',
      'Tipe Mutasi',
      'Kode SKU',
      'Nama Barang',
      'Jumlah (Pcs)',
      'Gudang Asal',
      'Gudang Tujuan',
      'No. Referensi',
      'Petugas',
      'Catatan',
    ];

    const rows = filteredMovements.map(m => [
      formatDateTime(m.created_at),
      m.type === 'in' ? 'Barang Masuk (IN)' : m.type === 'out' ? 'Barang Keluar (OUT)' : m.type === 'transfer' ? 'Transfer Antar Gudang' : 'Penyesuaian',
      m.sku_code,
      m.sku_name,
      m.quantity,
      m.from_warehouse_name || '—',
      m.to_warehouse_name || '—',
      m.reference_number || '—',
      m.created_by_name || 'Sistem',
      m.notes || '—',
    ]);

    exportToCSV(`GudangApp_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const getMovementBadge = (type: MovementType) => {
    switch (type) {
      case 'in':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <ArrowDownToLine className="w-3 h-3" />
            <span>Masuk (IN)</span>
          </span>
        );
      case 'out':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <ArrowUpFromLine className="w-3 h-3" />
            <span>Keluar (OUT)</span>
          </span>
        );
      case 'transfer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <ArrowRightLeft className="w-3 h-3" />
            <span>Transfer B → A</span>
          </span>
        );
      case 'adjustment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            <SlidersHorizontal className="w-3 h-3" />
            <span>Penyesuaian</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-indigo-400" />
            <span>Audit Log Mutasi Stok (Append-Only)</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Buku besar mutasi permanen tanpa riwayat edit atau hapus untuk akuntabilitas penuh
          </p>
        </div>

        <button
          id="btn-export-audit-csv"
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-bold rounded-xl shadow-sm transition-all min-h-[44px]"
        >
          <Download className="w-4 h-4 text-slate-400" />
          <span>Export Audit Log CSV</span>
        </button>
      </div>

      {/* Append-Only Guarantee Banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-300">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <span className="font-bold block text-emerald-200">Jaminan Keamanan Ledger (Append-Only Enforcement):</span>
          <span className="text-emerald-400/90">
            Tabel <code className="font-mono font-bold text-emerald-300">stock_movements</code> dilindungi oleh aturan RLS
            PostgreSQL yang memblokir instruksi UPDATE dan DELETE secara absolut.
          </span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl shadow-black/20 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari SKU, Petugas, No. Ref..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
            <span className="font-semibold text-slate-400">Tipe:</span>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="bg-transparent focus:outline-none text-xs font-semibold text-slate-200 w-full"
            >
              <option value="all" className="bg-slate-900 text-slate-200">Semua Jenis Mutasi</option>
              <option value="in" className="bg-slate-900 text-slate-200">Barang Masuk (IN)</option>
              <option value="out" className="bg-slate-900 text-slate-200">Barang Keluar (OUT)</option>
              <option value="transfer" className="bg-slate-900 text-slate-200">Transfer B → A</option>
              <option value="adjustment" className="bg-slate-900 text-slate-200">Penyesuaian (Adjustment)</option>
            </select>
          </div>

          {/* Warehouse Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
            <span className="font-semibold text-slate-400">Gudang:</span>
            <select
              value={selectedWarehouseId}
              onChange={e => setSelectedWarehouseId(e.target.value)}
              className="bg-transparent focus:outline-none text-xs font-semibold text-slate-200 w-full"
            >
              <option value="all" className="bg-slate-900 text-slate-200">Semua Gudang</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id} className="bg-slate-900 text-slate-200">
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-slate-950/90 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200 w-full focus:ring-1 focus:ring-indigo-500"
              placeholder="Dari"
            />
            <span className="text-slate-500">-</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-slate-950/90 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200 w-full focus:ring-1 focus:ring-indigo-500"
              placeholder="Sampai"
            />
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl shadow-black/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/60 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Tipe Mutasi</th>
                <th className="py-3 px-4">Kode SKU</th>
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-4 text-right">Kuantitas</th>
                <th className="py-3 px-4">Dari Gudang</th>
                <th className="py-3 px-4">Ke Gudang</th>
                <th className="py-3 px-4">No. Referensi</th>
                <th className="py-3 px-4">Petugas</th>
                <th className="py-3 px-4">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-xs">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-sm">
                    Tidak ada log mutasi yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredMovements.map(m => {
                  let qtyColor = 'text-white';
                  let qtyPrefix = '';

                  if (m.type === 'in') {
                    qtyColor = 'text-indigo-400 font-bold';
                    qtyPrefix = '+';
                  } else if (m.type === 'out') {
                    qtyColor = 'text-amber-400 font-bold';
                    qtyPrefix = '-';
                  } else if (m.type === 'transfer') {
                    qtyColor = 'text-purple-400 font-bold';
                    qtyPrefix = '⇄ ';
                  }

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {formatDateTime(m.created_at)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">{getMovementBadge(m.type)}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{m.sku_code}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-100 max-w-[200px] truncate">
                        {m.sku_name}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-mono ${qtyColor}`}>
                        {qtyPrefix}
                        {formatNumber(m.quantity)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{m.from_warehouse_name || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-300">{m.to_warehouse_name || '—'}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{m.reference_number || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-300">{m.created_by_name || 'Petugas'}</td>
                      <td className="py-3.5 px-4 text-slate-400 max-w-[200px] truncate">
                        {m.notes || '—'}
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
