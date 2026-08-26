import React, { useState, useRef, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  ArrowUpFromLine,
  Barcode,
  CheckCircle2,
  AlertCircle,
  Package,
  History,
  CornerDownLeft,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { SKU } from '../types/database';
import { formatNumber, formatDateTime } from '../lib/utils';
import { BarcodeRenderer } from '../components/common/BarcodeRenderer';

export const ScanOutView: React.FC = () => {
  const { warehouses, skus, movements, recordScanOut, getStock } = useInventory();

  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(
    warehouses.find(w => w.name === 'Gudang A')?.id || warehouses[0]?.id || ''
  );
  const [quantityInput, setQuantityInput] = useState<number>(1);
  const [referenceInput, setReferenceInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');

  const [matchedSKU, setMatchedSKU] = useState<SKU | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto focus scanner on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Last 10 OUT movements
  const recentOutMovements = movements
    .filter(m => m.type === 'out')
    .slice(0, 10);

  const handleBarcodeInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLookupSKU(barcodeInput);
    }
  };

  const handleLookupSKU = (code: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const clean = code.trim().toUpperCase();

    if (!clean) {
      setErrorMessage('Silakan scan atau masukkan kode barcode / SKU.');
      return;
    }

    const found = skus.find(s => s.code.toUpperCase() === clean);
    if (found) {
      setMatchedSKU(found);
      setBarcodeInput(found.code);
    } else {
      setMatchedSKU(null);
      setErrorMessage(`SKU dengan barcode "${clean}" tidak ditemukan di database.`);
    }
  };

  const currentAvailableStock = matchedSKU
    ? getStock(matchedSKU.id, selectedWarehouseId)
    : 0;

  const handleConfirmScanOut = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!matchedSKU) {
      setErrorMessage('Pilih atau scan barcode SKU terlebih dahulu.');
      return;
    }

    if (quantityInput <= 0) {
      setErrorMessage('Jumlah barang keluar harus lebih dari 0.');
      return;
    }

    // Strict validation: qty cannot exceed available stock
    if (quantityInput > currentAvailableStock) {
      const msg = `Stok tidak cukup: tersedia ${currentAvailableStock}, diminta ${quantityInput}`;
      setErrorMessage(msg);
      return;
    }

    const targetWh = warehouses.find(w => w.id === selectedWarehouseId) || warehouses[0];

    const res = recordScanOut({
      skuCodeOrId: matchedSKU.id,
      warehouseId: selectedWarehouseId,
      quantity: quantityInput,
      referenceNumber: referenceInput.trim() || undefined,
      notes: notesInput.trim() || 'Scan Out Barcode Scanner',
    });

    if (res.success) {
      setSuccessMessage(
        `Sukses: -${quantityInput} unit ${matchedSKU.code} (${matchedSKU.name}) dikeluarkan dari ${targetWh.name}. Sisa stok: ${
          currentAvailableStock - quantityInput
        } unit.`
      );
      // Reset form
      setBarcodeInput('');
      setMatchedSKU(null);
      setQuantityInput(1);
      setReferenceInput('');
      setNotesInput('');
      setErrorMessage(null);

      // Re-focus
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 50);
    } else {
      setErrorMessage(res.error || 'Gagal memproses Scan Out.');
    }
  };

  const handleReset = () => {
    setBarcodeInput('');
    setMatchedSKU(null);
    setQuantityInput(1);
    setReferenceInput('');
    setNotesInput('');
    setErrorMessage(null);
    setSuccessMessage(null);
    barcodeInputRef.current?.focus();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <ArrowUpFromLine className="w-7 h-7 text-amber-400" />
          <span>Scan Out — Pengeluaran Barang (Fulfillment / Dispatch)</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Validasi otomatis stok tidak boleh minus. Mengurangi stok secara real-time.
        </p>
      </div>

      {/* Main Scanner Card */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl shadow-black/20 space-y-6">
        {/* Large Auto-Focused Scanner Field (height 64px, font 20px) */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Barcode className="w-4 h-4 text-amber-400" />
              <span>Input Barcode Scanner (Tembak Barcode / Ketik Kode SKU)</span>
            </span>
            <span className="text-amber-300 font-semibold lowercase text-[11px] bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-500/30">
              Tekan Enter untuk verifikasi
            </span>
          </label>

          <div className="relative">
            <input
              ref={barcodeInputRef}
              id="input-scan-out-barcode"
              type="text"
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              onKeyDown={handleBarcodeInputKeyDown}
              placeholder="Contoh: 7RHXF4XX lalu tekan Enter..."
              className="w-full h-16 text-xl sm:text-2xl font-mono font-bold uppercase tracking-wider text-white bg-slate-950/90 border-2 border-amber-500/40 rounded-2xl px-5 pl-14 shadow-inner focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-slate-500"
            />
            <Barcode className="w-7 h-7 text-amber-400 absolute left-4 top-1/2 -translate-y-1/2" />

            <button
              type="button"
              id="btn-scan-out-lookup"
              onClick={() => handleLookupSKU(barcodeInput)}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/50 transition-all min-h-[44px]"
            >
              <span>Cari SKU</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="font-semibold">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="font-semibold">{successMessage}</div>
          </div>
        )}

        {/* Matched SKU Details */}
        {matchedSKU && (
          <div className="p-5 sm:p-6 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-lg shadow-amber-950/50">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-white">
                      {matchedSKU.code}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold">
                      {matchedSKU.category}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mt-0.5">{matchedSKU.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Supplier: {matchedSKU.supplier}</p>
                </div>
              </div>

              {/* Barcode Visual */}
              <div className="shrink-0 bg-white p-2 rounded-xl border border-slate-700 shadow-sm">
                <BarcodeRenderer value={matchedSKU.code} width={1.8} height={40} fontSize={12} />
              </div>
            </div>

            <form onSubmit={handleConfirmScanOut} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Warehouse Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Gudang Sumber Pengeluaran *
                  </label>
                  <select
                    id="select-scan-out-warehouse"
                    value={selectedWarehouseId}
                    onChange={e => setSelectedWarehouseId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-100 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-none min-h-[44px]"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id} className="bg-slate-900 text-slate-100">
                        {w.name} ({w.type === 'primary' ? 'Primary' : 'Buffer'})
                      </option>
                    ))}
                  </select>
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Stok Tersedia:</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded-full ${
                        currentAvailableStock > 0
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {formatNumber(currentAvailableStock)} unit
                    </span>
                  </div>
                </div>

                {/* Quantity Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Jumlah Barang Keluar (Pcs) *
                  </label>
                  <input
                    id="input-scan-out-qty"
                    type="number"
                    min="1"
                    max={currentAvailableStock}
                    required
                    value={quantityInput}
                    onChange={e => setQuantityInput(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-none min-h-[44px]"
                  />
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Sisa Setelah Keluar:</span>
                    <span
                      className={`font-mono font-bold ${
                        currentAvailableStock - quantityInput < 0 ? 'text-rose-400' : 'text-slate-300'
                      }`}
                    >
                      {formatNumber(Math.max(0, currentAvailableStock - quantityInput))} unit
                    </span>
                  </div>
                </div>

                {/* Reference Number / Order Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    No. Pesanan / Invoice / Marketplace
                  </label>
                  <input
                    id="input-scan-out-ref"
                    type="text"
                    placeholder="Contoh: INV-20260823-099"
                    value={referenceInput}
                    onChange={e => setReferenceInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* Warning if stock insufficient */}
              {quantityInput > currentAvailableStock && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    Stok tidak cukup! Tersedia {currentAvailableStock}, diminta {quantityInput}. Sistem mencegah stok negatif.
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  id="btn-scan-out-cancel"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 hover:text-white transition-colors min-h-[44px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Batal / Reset</span>
                </button>

                <button
                  type="submit"
                  id="btn-confirm-scan-out"
                  disabled={quantityInput > currentAvailableStock || currentAvailableStock <= 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-xs font-bold shadow-lg shadow-amber-950/60 transition-all disabled:opacity-40 disabled:pointer-events-none min-h-[44px]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi Pengeluaran Barang</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 10 Recent Out Movements Table */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl shadow-black/20 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            <span>10 Riwayat Pengeluaran Terakhir (Scan Out)</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">Tersimpan dalam audit log</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/60 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Kode SKU</th>
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-4">Gudang Asal</th>
                <th className="py-3 px-4 text-right">Jumlah Keluar</th>
                <th className="py-3 px-4">No. Ref / Inv</th>
                <th className="py-3 px-4">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-xs">
              {recentOutMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada riwayat scan out yang tercatat.
                  </td>
                </tr>
              ) : (
                recentOutMovements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 text-slate-400">{formatDateTime(m.created_at)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{m.sku_code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-100">{m.sku_name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold">
                        {m.from_warehouse_name || 'Gudang'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                      -{formatNumber(m.quantity)}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{m.reference_number || '—'}</td>
                    <td className="py-3 px-4 text-slate-300">{m.created_by_name || 'Petugas'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
