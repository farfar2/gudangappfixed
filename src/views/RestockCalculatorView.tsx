import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import {
  Calculator,
  ArrowRightLeft,
  Truck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { formatNumber, formatVolume } from '../lib/utils';

export const RestockCalculatorView: React.FC = () => {
  const { inventoryItems, executeBulkTransfer } = useInventory();
  const { isAdmin } = useAuth();

  // Capacity in m3 (Default: 80 m3/day)
  const [truckCapacityM3, setTruckCapacityM3] = useState<number>(80);
  const [selectedSkuIds, setSelectedSkuIds] = useState<Set<string>>(new Set());
  const [transferNotes, setTransferNotes] = useState<string>('Restock Harian Gudang B ke Gudang A');

  // Filter only SKUs where Restock Qty > 0, sorted by DoS ascending
  const restockCandidates = useMemo(() => {
    const list = inventoryItems
      .filter(item => item.restock_qty > 0)
      .sort((a, b) => (a.dos ?? 9999) - (b.dos ?? 9999));

    // Calculate cumulative volume for each item in the sorted list
    let runningVolume = 0;
    return list.map(item => {
      runningVolume += item.volume_m3;
      return {
        ...item,
        cumulative_volume_m3: runningVolume,
      };
    });
  }, [inventoryItems]);

  // Selected totals
  const selectedStats = useMemo(() => {
    let totalItemsCount = 0;
    let totalPcs = 0;
    let totalVolumeM3 = 0;

    restockCandidates.forEach(item => {
      if (selectedSkuIds.has(item.sku.id)) {
        totalItemsCount += 1;
        totalPcs += item.restock_qty;
        totalVolumeM3 += item.volume_m3;
      }
    });

    return {
      totalItemsCount,
      totalPcs,
      totalVolumeM3: Number(totalVolumeM3.toFixed(3)),
    };
  }, [restockCandidates, selectedSkuIds]);

  // "Pilih Otomatis Hari 1": selects rows top-down until cumulative volume <= capacity
  const handleAutoSelectDay1 = () => {
    const newSelected = new Set<string>();
    let currentVol = 0;

    for (const item of restockCandidates) {
      if (currentVol + item.volume_m3 <= truckCapacityM3) {
        newSelected.add(item.sku.id);
        currentVol += item.volume_m3;
      } else {
        // If single item alone exceeds capacity or next exceeds, stop top-down
        break;
      }
    }

    setSelectedSkuIds(newSelected);
  };

  const handleToggleRow = (skuId: string) => {
    setSelectedSkuIds(prev => {
      const next = new Set(prev);
      if (next.has(skuId)) {
        next.delete(skuId);
      } else {
        next.add(skuId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedSkuIds.size === restockCandidates.length) {
      setSelectedSkuIds(new Set());
    } else {
      setSelectedSkuIds(new Set(restockCandidates.map(r => r.sku.id)));
    }
  };

  const handleExecuteTransfer = () => {
    if (!isAdmin) return;

    if (selectedSkuIds.size === 0) {
      alert('Pilih minimal satu SKU untuk dieksekusi transfer.');
      return;
    }

    const transfersToExecute = restockCandidates
      .filter(item => selectedSkuIds.has(item.sku.id))
      .map(item => ({
        sku_id: item.sku.id,
        quantity: item.restock_qty,
      }));

    const res = executeBulkTransfer(transfersToExecute, transferNotes);
    if (res.success) {
      setSelectedSkuIds(new Set());
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Calculator className="w-7 h-7 text-indigo-400" />
            <span>Kalkulator Restock (Gudang B → Gudang A)</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Optimasi pengiriman buffer stock dengan batasan volume armada truk harian
          </p>
        </div>

        {/* Action Button: Execute Transfer (Admin Only) */}
        {isAdmin ? (
          <button
            id="btn-execute-transfer"
            onClick={handleExecuteTransfer}
            disabled={selectedSkuIds.size === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-950/60 transition-all disabled:opacity-40 disabled:pointer-events-none min-h-[44px]"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Eksekusi Transfer B → A ({selectedStats.totalItemsCount} SKU)</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400">
            <ShieldAlert className="w-4 h-4 text-slate-400" />
            <span>Eksekusi Transfer Memerlukan Hak Akses Admin</span>
          </div>
        )}
      </div>

      {/* Control Box: Capacity & Auto-select */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl shadow-black/20 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          {/* Capacity Input */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-400" />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Kapasitas Armada Harian (m³):
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="input-truck-capacity"
                type="number"
                min="1"
                max="500"
                step="5"
                value={truckCapacityM3}
                onChange={e => setTruckCapacityM3(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-28 bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-center"
              />
              <span className="text-xs font-semibold text-slate-400">m³/hari (Default: 80 m³)</span>
            </div>
          </div>

          {/* Auto-Select Button */}
          <button
            id="btn-auto-select-day1"
            onClick={handleAutoSelectDay1}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-950/60 transition-all min-h-[44px]"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Pilih Otomatis Hari 1 (≤ {truckCapacityM3} m³)</span>
          </button>
        </div>

        {/* Selected Volume & Capacity Meter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 font-medium block">Total SKU Terpilih:</span>
            <span className="text-lg font-bold text-white font-mono mt-0.5 block">
              {selectedStats.totalItemsCount} dari {restockCandidates.length} SKU
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 font-medium block">Total Jumlah Unit (Pcs):</span>
            <span className="text-lg font-bold text-white font-mono mt-0.5 block">
              {formatNumber(selectedStats.totalPcs)} unit
            </span>
          </div>

          <div
            className={`p-3.5 rounded-xl border transition-colors ${
              selectedStats.totalVolumeM3 > truckCapacityM3
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            }`}
          >
            <span className="font-medium block">Total Volume Terpilih vs Kapasitas:</span>
            <span className="text-lg font-bold mt-0.5 block font-mono">
              {formatVolume(selectedStats.totalVolumeM3)} / {truckCapacityM3} m³
            </span>
          </div>
        </div>
      </div>

      {/* Restock Candidates Table */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl shadow-black/20 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <h3 className="font-bold text-sm text-white">
              Daftar SKU Membutuhkan Restock (Restock Qty &gt; 0)
            </h3>
            <p className="text-xs text-slate-400">
              Diurutkan berdasarkan Days of Stock (DoS) terendah di Gudang A
            </p>
          </div>

          <button
            onClick={handleSelectAll}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 min-h-[44px] px-2"
          >
            {selectedSkuIds.size === restockCandidates.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/60 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3 px-3 text-center w-10">Pilih</th>
                <th className="py-3 px-3">Kode SKU</th>
                <th className="py-3 px-3">Nama Barang</th>
                <th className="py-3 px-3 text-right">Stok A</th>
                <th className="py-3 px-3 text-right">Stok B</th>
                <th className="py-3 px-3 text-right">ADS</th>
                <th className="py-3 px-3 text-right">DoS</th>
                <th className="py-3 px-3 text-right">Safety Stock</th>
                <th className="py-3 px-3 text-right">Kebutuhan</th>
                <th className="py-3 px-3 text-right bg-indigo-950/40 text-indigo-300">Restock Qty</th>
                <th className="py-3 px-3 text-right">Volume (m³)</th>
                <th className="py-3 px-3 text-right">Kumulatif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-xs">
              {restockCandidates.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 text-sm">
                    Semua stok Gudang A dalam kondisi aman atau tidak ada stok di Gudang B.
                  </td>
                </tr>
              ) : (
                restockCandidates.map(item => {
                  const isSelected = selectedSkuIds.has(item.sku.id);
                  const isOverCapacity = item.cumulative_volume_m3 > truckCapacityM3;

                  return (
                    <tr
                      key={item.sku.id}
                      onClick={() => handleToggleRow(item.sku.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-950/50 text-indigo-200'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-indigo-400">
                        {item.sku.code}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-100">{item.sku.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.sku.qty_per_box} pcs/box ({item.sku.m3_per_box} m³)
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {formatNumber(item.stock_gudang_a)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {formatNumber(item.stock_gudang_b)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {formatNumber(item.ads, 2)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                            (item.dos ?? 99) < 7
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {item.dos !== null ? `${formatNumber(item.dos, 1)}h` : '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {formatNumber(item.safety_stock)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {formatNumber(item.restock_need)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-indigo-300 bg-indigo-950/30">
                        +{formatNumber(item.restock_qty)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-200">
                        {formatNumber(item.volume_m3, 3)} m³
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <span
                          className={`font-bold ${
                            isOverCapacity ? 'text-rose-400' : 'text-slate-300'
                          }`}
                        >
                          {formatNumber(item.cumulative_volume_m3, 3)} m³
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
