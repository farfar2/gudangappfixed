import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Barcode, Search, Printer, Check, X, Filter, AlertCircle, Copy } from 'lucide-react';
import { BarcodeRenderer } from '../components/common/BarcodeRenderer';
import { SKU } from '../types/database';

export const BarcodeLabelsView: React.FC = () => {
  const { skus } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSKUs, setSelectedSKUs] = useState<SKU[]>(skus.slice(0, 4));
  const [copiesPerSKU, setCopiesPerSKU] = useState<number>(1);

  const categories = useMemo(() => {
    const set = new Set<string>();
    skus.forEach(s => set.add(s.category));
    return Array.from(set);
  }, [skus]);

  const filteredSKUs = useMemo(() => {
    return skus.filter(s => {
      if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [skus, selectedCategory, searchQuery]);

  const handleToggleSelect = (sku: SKU) => {
    setSelectedSKUs(prev => {
      const exists = prev.some(s => s.id === sku.id);
      if (exists) {
        return prev.filter(s => s.id !== sku.id);
      } else {
        if (prev.length >= 50) {
          alert('Batas maksimum adalah 50 label per batch cetak.');
          return prev;
        }
        return [...prev, sku];
      }
    });
  };

  const handleSelectAllFiltered = () => {
    const combined = [...selectedSKUs];
    for (const item of filteredSKUs) {
      if (!combined.some(s => s.id === item.id)) {
        if (combined.length < 50) {
          combined.push(item);
        }
      }
    }
    setSelectedSKUs(combined);
  };

  const handleClearAll = () => {
    setSelectedSKUs([]);
  };

  const handlePrint = () => {
    window.print();
  };

  // Expanded print list based on copiesPerSKU
  const printableList = useMemo(() => {
    const list: SKU[] = [];
    selectedSKUs.forEach(sku => {
      for (let i = 0; i < copiesPerSKU; i++) {
        list.push(sku);
      }
    });
    return list.slice(0, 100);
  }, [selectedSKUs, copiesPerSKU]);

  return (
    <div className="space-y-6">
      {/* Top Header (Hidden on Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Barcode className="w-7 h-7 text-indigo-400" />
            <span>Cetak Label Barcode (Format Code 128)</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Standar thermal label 100mm × 50mm untuk rak dan kemasan box
          </p>
        </div>

        <button
          id="btn-print-labels"
          onClick={handlePrint}
          disabled={selectedSKUs.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-950/60 transition-all disabled:opacity-40 min-h-[44px]"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Label Sekarang ({printableList.length} Label)</span>
        </button>
      </div>

      {/* SKU Selector Grid (Hidden on Print) */}
      <div className="no-print bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-xl shadow-black/20 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase text-slate-300">Pilih SKU untuk Label:</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold">
              {selectedSKUs.length} / 50 SKU Terpilih
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <span>Duplikasi per SKU:</span>
              <select
                value={copiesPerSKU}
                onChange={e => setCopiesPerSKU(Number(e.target.value))}
                className="bg-transparent font-bold text-indigo-400 focus:outline-none"
              >
                <option value={1} className="bg-slate-900 text-white">1x</option>
                <option value={2} className="bg-slate-900 text-white">2x</option>
                <option value={4} className="bg-slate-900 text-white">4x</option>
                <option value={10} className="bg-slate-900 text-white">10x</option>
              </select>
            </div>

            <button
              onClick={handleSelectAllFiltered}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 px-2 py-1"
            >
              Pilih Yang Muncul
            </button>
            <button
              onClick={handleClearAll}
              className="text-xs font-bold text-slate-500 hover:text-rose-400 px-2 py-1"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode atau nama barang..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all" className="bg-slate-900 text-slate-200">Semua Kategori</option>
            {categories.map(c => (
              <option key={c} value={c} className="bg-slate-900 text-slate-200">
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Chips List */}
        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
          {filteredSKUs.map(sku => {
            const isSelected = selectedSKUs.some(s => s.id === sku.id);
            return (
              <button
                key={sku.id}
                onClick={() => handleToggleSelect(sku)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-sm shadow-indigo-950/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="font-mono">{sku.code}</span>
                <span className="truncate max-w-[140px] text-[11px] opacity-80">{sku.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Label Print Preview Section */}
      <div className="bg-slate-950/60 rounded-2xl p-6 border border-slate-800 shadow-inner">
        <div className="no-print flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
            Pratinjau Layout Fisik Label (100mm × 50mm)
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            Format: Code 128 | High Density Barcode
          </span>
        </div>

        {selectedSKUs.length === 0 ? (
          <div className="no-print py-16 text-center text-slate-400 text-sm bg-slate-900/60 rounded-xl border border-dashed border-slate-800">
            Pilih minimal satu SKU di atas untuk menampilkan dan mencetak label barcode.
          </div>
        ) : (
          <div id="print-labels-container" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
            {printableList.map((sku, index) => (
              <div
                key={`${sku.id}-${index}`}
                className="barcode-label-card bg-white border-2 border-slate-900 rounded-lg p-3 shadow-md flex flex-col justify-between"
                style={{
                  width: '100%',
                  maxWidth: '380px',
                  minHeight: '190px',
                  boxSizing: 'border-box',
                }}
              >
                {/* Top Label Header */}
                <div className="flex items-center justify-between border-b border-slate-900 pb-1 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-900">
                    GUDANGAPP WMS
                  </span>
                  <span className="text-[10px] font-bold text-slate-700">
                    {sku.category}
                  </span>
                </div>

                {/* SKU Code (Large Bold) */}
                <div className="text-center my-0.5">
                  <div className="text-2xl sm:text-3xl font-mono font-black tracking-widest text-slate-950">
                    {sku.code}
                  </div>
                </div>

                {/* Code 128 Barcode Visual */}
                <div className="flex justify-center my-1">
                  <BarcodeRenderer
                    value={sku.code}
                    width={2.2}
                    height={48}
                    displayValue={false}
                  />
                </div>

                {/* SKU Name & Specifications */}
                <div className="border-t border-slate-900 pt-1 text-center">
                  <div className="text-xs font-extrabold text-slate-900 line-clamp-1 leading-tight">
                    {sku.name}
                  </div>
                  <div className="text-[9px] text-slate-600 flex justify-between px-1 mt-0.5 font-mono">
                    <span>Pack: {sku.qty_per_box} pcs/box</span>
                    <span>Vol: {sku.m3_per_box} m³</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
