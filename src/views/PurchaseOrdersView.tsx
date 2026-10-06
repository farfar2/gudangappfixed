import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { PurchaseOrder, POStatus } from '../types/database';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  PackageCheck,
  X,
  FileText,
  Boxes,
  Trash2,
} from 'lucide-react';
import { formatIDR, formatNumber, formatDate, formatDateTime } from '../lib/utils';

export const PurchaseOrdersView: React.FC = () => {
  const { purchaseOrders, skus, createPO, updatePOStatus, receivePO } = useInventory();
  const { isAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeReceivingPO, setActiveReceivingPO] = useState<PurchaseOrder | null>(null);
  const [activePrintingPO, setActivePrintingPO] = useState<PurchaseOrder | null>(null);

  // New PO Form
  const [supplierInput, setSupplierInput] = useState('');
  const [expectedDateInput, setExpectedDateInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [poItems, setPoItems] = useState<
    {
      sku_id: string;
      quantity: number;
      unit_price: number;
    }[]
  >([]);

  // Item selector for PO
  const [selectedSkuToAdd, setSelectedSkuToAdd] = useState<string>('');
  const [itemQtyToAdd, setItemQtyToAdd] = useState<number>(100);

  // Receive Form
  const [receivedInputs, setReceivedInputs] = useState<{ [sku_id: string]: number }>({});
  const [receiveNotes, setReceiveNotes] = useState('');

  // Filtered POs
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po => {
      if (selectedStatus !== 'all' && po.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = po.po_number.toLowerCase().includes(q);
        const matchSup = po.supplier.toLowerCase().includes(q);
        if (!matchNo && !matchSup) return false;
      }
      return true;
    });
  }, [purchaseOrders, selectedStatus, searchQuery]);

  const handleOpenCreatePO = () => {
    setSupplierInput('');
    setExpectedDateInput('');
    setNotesInput('');
    setPoItems([]);
    setSelectedSkuToAdd(skus[0]?.id || '');
    setItemQtyToAdd(50);
    setIsCreateModalOpen(true);
  };

  const handleAddItemToPO = () => {
    if (!selectedSkuToAdd) return;
    const sku = skus.find(s => s.id === selectedSkuToAdd);
    if (!sku) return;

    // Check if already in items
    const existing = poItems.find(i => i.sku_id === selectedSkuToAdd);
    if (existing) {
      setPoItems(prev =>
        prev.map(i =>
          i.sku_id === selectedSkuToAdd ? { ...i, quantity: i.quantity + itemQtyToAdd } : i
        )
      );
    } else {
      setPoItems(prev => [
        ...prev,
        {
          sku_id: sku.id,
          quantity: itemQtyToAdd,
          unit_price: sku.price_per_unit,
        },
      ]);
    }
  };

  const handleRemoveItem = (sku_id: string) => {
    setPoItems(prev => prev.filter(i => i.sku_id !== sku_id));
  };

  const handleSubmitCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierInput.trim()) {
      alert('Nama Supplier wajib diisi.');
      return;
    }
    if (poItems.length === 0) {
      alert('Harap tambahkan minimal 1 item ke dalam Purchase Order.');
      return;
    }

    const res = createPO({
      supplier: supplierInput.trim(),
      expected_date: expectedDateInput || null,
      notes: notesInput.trim() || null,
      items: poItems,
    });

    if (res.success) {
      setIsCreateModalOpen(false);
    }
  };

  const handleOpenReceive = (po: PurchaseOrder) => {
    setActiveReceivingPO(po);
    const initialMap: { [sku_id: string]: number } = {};
    po.items.forEach(item => {
      const remaining = Math.max(0, item.quantity - item.received_quantity);
      initialMap[item.sku_id] = remaining;
    });
    setReceivedInputs(initialMap);
    setReceiveNotes(`Penerimaan barang PO ${po.po_number}`);
  };

  const handleSubmitReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReceivingPO) return;

    const itemsToSubmit = activeReceivingPO.items.map(item => ({
      sku_id: item.sku_id,
      received_qty: receivedInputs[item.sku_id] || 0,
    }));

    const hasAny = itemsToSubmit.some(i => i.received_qty > 0);
    if (!hasAny) {
      alert('Masukkan jumlah penerimaan > 0 untuk minimal 1 item.');
      return;
    }

    const res = receivePO(activeReceivingPO.id, itemsToSubmit, receiveNotes);
    if (res.success) {
      setActiveReceivingPO(null);
    }
  };

  const handlePrintPO = (po: PurchaseOrder) => {
    setActivePrintingPO(po);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const getStatusBadge = (status: POStatus) => {
    switch (status) {
      case 'draft':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300">Draft</span>;
      case 'sent':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">Terkirim</span>;
      case 'partial':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300">Sebagian</span>;
      case 'received':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">Diterima</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-300">Dibatalkan</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-indigo-400" />
            <span>Purchase Orders (Pemesanan Supplier)</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Penerimaan PO langsung dialokasikan ke Gudang B (Buffer Stock)
          </p>
        </div>

        <button
          id="btn-create-po"
          onClick={handleOpenCreatePO}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-950/60 transition-all min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Purchase Order Baru</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="no-print bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-slate-800 shadow-xl shadow-black/20 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor PO atau supplier..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-400">Status PO:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-transparent focus:outline-none text-xs font-semibold text-slate-200"
            >
              <option value="all" className="bg-slate-900 text-slate-200">Semua Status</option>
              <option value="draft" className="bg-slate-900 text-slate-200">Draft</option>
              <option value="sent" className="bg-slate-900 text-slate-200">Terkirim</option>
              <option value="partial" className="bg-slate-900 text-slate-200">Sebagian (Partial)</option>
              <option value="received" className="bg-slate-900 text-slate-200">Diterima Lengkap</option>
              <option value="cancelled" className="bg-slate-900 text-slate-200">Dibatalkan</option>
            </select>
          </div>
        </div>
      </div>

      {/* PO List Table */}
      <div className="no-print bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl shadow-black/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/60 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3 px-4">No. PO</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Item & Kuantitas</th>
                <th className="py-3 px-4">Estimasi Tiba</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    Tidak ada data Purchase Order yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredPOs.map(po => {
                  const totalQty = po.items.reduce((sum, i) => sum + i.quantity, 0);
                  const totalRcv = po.items.reduce((sum, i) => sum + i.received_quantity, 0);

                  return (
                    <tr key={po.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                        {po.po_number}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-100">
                        <div>{po.supplier}</div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          Dibuat: {formatDateTime(po.created_at)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-semibold text-slate-200">
                          {po.items.length} Macam SKU ({formatNumber(totalRcv)} / {formatNumber(totalQty)} pcs diterima)
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {po.items.map(i => `${i.sku_code} (${i.quantity})`).join(', ')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {po.expected_date ? formatDate(po.expected_date) : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(po.status)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Receive Button (if not fully received or cancelled) */}
                          {po.status !== 'received' && po.status !== 'cancelled' && (
                            <button
                              onClick={() => handleOpenReceive(po)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-lg transition-colors"
                              title="Terima Barang ke Gudang B"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Terima</span>
                            </button>
                          )}

                          {/* Print PO */}
                          <button
                            onClick={() => handlePrintPO(po)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Cetak Purchase Order"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create PO Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-800 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="font-bold text-lg text-white">Buat Purchase Order Baru</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreatePO} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nama Supplier *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT Maju Jaya Elektronik"
                    value={supplierInput}
                    onChange={e => setSupplierInput(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Estimasi Tanggal Tiba (Opsional)
                  </label>
                  <input
                    type="date"
                    value={expectedDateInput}
                    onChange={e => setExpectedDateInput(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Add Items Box */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Pilih SKU & Kuantitas Pesanan
                </span>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedSkuToAdd}
                    onChange={e => setSelectedSkuToAdd(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:ring-1 focus:ring-indigo-500"
                  >
                    {skus
                      .filter(s => s.is_active)
                      .map(s => (
                        <option key={s.id} value={s.id} className="bg-slate-900 text-slate-100">
                          {s.code} — {s.name} ({formatIDR(s.price_per_unit)})
                        </option>
                      ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={itemQtyToAdd}
                    onChange={e => setItemQtyToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center text-white"
                    placeholder="Qty"
                  />

                  <button
                    type="button"
                    onClick={handleAddItemToPO}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shrink-0 min-h-[44px] shadow-sm shadow-indigo-950/50"
                  >
                    + Tambah Item
                  </button>
                </div>

                {/* Items List */}
                {poItems.length > 0 && (
                  <div className="mt-3 divide-y divide-slate-800 border-t border-slate-800 pt-2">
                    {poItems.map(item => {
                      const sku = skus.find(s => s.id === item.sku_id);
                      return (
                        <div key={item.sku_id} className="py-2 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-mono font-bold text-indigo-400">{sku?.code}</span>{' '}
                            <span className="text-slate-300">{sku?.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-white">
                              {formatNumber(item.quantity)} pcs
                            </span>
                            <span className="text-slate-400 font-mono">
                              {formatIDR(item.quantity * item.unit_price)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.sku_id)}
                              className="text-rose-400 hover:text-rose-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Catatan / Instruksi Pengiriman
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={e => setNotesInput(e.target.value)}
                  placeholder="Instruksi tambahan untuk supplier..."
                  className="w-full bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 hover:text-white min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={poItems.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-950/60 transition-all disabled:opacity-40 min-h-[44px]"
                >
                  Buat Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive PO Modal */}
      {activeReceivingPO && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-800 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <h3 className="font-bold text-lg text-white">
                  Penerimaan Barang PO: {activeReceivingPO.po_number}
                </h3>
                <p className="text-xs text-slate-400">
                  Barang yang diterima akan otomatis masuk ke <strong className="text-slate-200">Gudang B (Buffer)</strong>
                </p>
              </div>
              <button
                onClick={() => setActiveReceivingPO(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReceive} className="space-y-4">
              <div className="space-y-3">
                {activeReceivingPO.items.map(item => {
                  const remaining = Math.max(0, item.quantity - item.received_quantity);
                  return (
                    <div
                      key={item.sku_id}
                      className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-mono font-bold text-sm text-indigo-400">{item.sku_code}</div>
                        <div className="text-xs font-semibold text-slate-100">{item.sku_name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Total Dipesan: {item.quantity} | Sebelumnya Diterima: {item.received_quantity} | Belum Tiba:{' '}
                          <strong className="text-indigo-400">{remaining} pcs</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-300 whitespace-nowrap">
                          Terima Sekarang:
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={remaining}
                          value={receivedInputs[item.sku_id] || 0}
                          onChange={e =>
                            setReceivedInputs({
                              ...receivedInputs,
                              [item.sku_id]: Math.max(0, parseInt(e.target.value) || 0),
                            })
                          }
                          className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-center text-white focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Catatan Penerimaan / No. Surat Jalan Supplier
                </label>
                <input
                  type="text"
                  value={receiveNotes}
                  onChange={e => setReceiveNotes(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveReceivingPO(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 hover:text-white min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all min-h-[44px]"
                >
                  Konfirmasi Penerimaan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable PO Sheet (Rendered during Print) */}
      {activePrintingPO && (
        <div id="print-po-sheet" className="hidden print:block bg-white p-8 font-sans text-slate-900">
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-black tracking-tight">GUDANGAPP WMS</h1>
              <p className="text-xs text-slate-600">Sistem Logistik & Pergudangan Terintegrasi</p>
              <p className="text-xs text-slate-600">Jakarta, Indonesia</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-slate-900">PURCHASE ORDER</h2>
              <p className="text-sm font-mono font-bold text-indigo-800">{activePrintingPO.po_number}</p>
              <p className="text-xs text-slate-500">Tanggal: {formatDate(activePrintingPO.created_at)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
            <div className="p-3 border border-slate-300 rounded-lg">
              <span className="font-bold text-slate-700 block uppercase">Supplier:</span>
              <span className="text-sm font-extrabold text-slate-900 block mt-1">
                {activePrintingPO.supplier}
              </span>
              <span className="text-slate-600 block mt-0.5">Estimasi Tiba: {activePrintingPO.expected_date ? formatDate(activePrintingPO.expected_date) : 'Sesuai Kesepakatan'}</span>
            </div>

            <div className="p-3 border border-slate-300 rounded-lg">
              <span className="font-bold text-slate-700 block uppercase">Tujuan Pengiriman:</span>
              <span className="text-sm font-extrabold text-slate-900 block mt-1">Gudang B (Buffer Facility)</span>
              <span className="text-slate-600 block mt-0.5">Dibuat Oleh: {activePrintingPO.created_by_name || 'Admin'}</span>
            </div>
          </div>

          <table className="w-full text-left text-xs border border-slate-300 mb-6">
            <thead className="bg-slate-100 uppercase font-bold border-b border-slate-300">
              <tr>
                <th className="p-2 border-r border-slate-300">No</th>
                <th className="p-2 border-r border-slate-300">Kode SKU</th>
                <th className="p-2 border-r border-slate-300">Deskripsi Barang</th>
                <th className="p-2 text-right border-r border-slate-300">Qty</th>
                <th className="p-2 text-right border-r border-slate-300">Harga Satuan</th>
                <th className="p-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {activePrintingPO.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                  <td className="p-2 border-r border-slate-200 font-mono font-bold">{item.sku_code}</td>
                  <td className="p-2 border-r border-slate-200">{item.sku_name}</td>
                  <td className="p-2 text-right border-r border-slate-200 font-bold">{formatNumber(item.quantity)} pcs</td>
                  <td className="p-2 text-right border-r border-slate-200 font-mono">{formatIDR(item.unit_price)}</td>
                  <td className="p-2 text-right font-mono font-bold">{formatIDR(item.quantity * item.unit_price)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-900 bg-slate-50 font-bold">
              <tr>
                <td colSpan={5} className="p-2 text-right">Total Nilai Pesanan:</td>
                <td className="p-2 text-right font-mono text-sm">
                  {formatIDR(
                    activePrintingPO.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
                  )}
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="grid grid-cols-2 gap-12 mt-12 text-center text-xs">
            <div>
              <p className="font-bold text-slate-700 mb-16">Disetujui Oleh,</p>
              <p className="border-t border-slate-400 pt-1 font-bold">( {activePrintingPO.created_by_name || 'Kepala Gudang'} )</p>
            </div>
            <div>
              <p className="font-bold text-slate-700 mb-16">Dikonfirmasi Supplier,</p>
              <p className="border-t border-slate-400 pt-1 font-bold">( {activePrintingPO.supplier} )</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
