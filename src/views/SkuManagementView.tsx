import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SKU } from '../types/database';
import { Plus, Search, Upload, Download, Pencil, Trash2, Boxes } from 'lucide-react';
import { formatIDR, exportToCSV } from '../lib/utils';

const FALLBACK_CATEGORIES = ['Elektronik','Perkakas','Otomotif','Penerangan','Kesehatan','Makanan','Minuman','Lainnya'];

export const SkuManagementView: React.FC = () => {
  const { skus, addSKU, updateSKU, softDeleteSKU, importSKUs, addToast } = useInventory();
  const { isAdmin } = useAuth();

  const [search, setSearch]               = useState('');
  const [filterCat, setFilterCat]         = useState('all');
  const [showInactive, setShowInactive]   = useState(false);
  const [modalOpen, setModalOpen]         = useState(false);
  const [editingSKU, setEditingSKU]       = useState<SKU | null>(null);
  const [importOpen, setImportOpen]       = useState(false);
  const [dbCategories, setDbCategories]   = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    code: '', name: '', category: '', supplier: '',
    price_per_unit: 0, qty_per_box: 1, m3_per_box: 0.01,
  });

  // Load categories from DB or fallback to extracted from SKUs
  useEffect(() => {
    const load = async () => {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('categories').select('name').order('name');
        if (data && data.length > 0) {
          setDbCategories(data.map((c: any) => c.name));
          return;
        }
      }
      // Fallback: extract from existing SKUs
      const set = new Set(skus.map(s => s.category).filter(Boolean));
      setDbCategories(set.size > 0 ? Array.from(set) : FALLBACK_CATEGORIES);
    };
    load();
  }, [skus]);

  const categoryOptions = dbCategories.length > 0 ? dbCategories : FALLBACK_CATEGORIES;

  const filtered = useMemo(() => skus.filter(s => {
    if (!showInactive && !s.is_active) return false;
    if (filterCat !== 'all' && s.category !== filterCat) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) ||
             s.supplier.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
    }
    return true;
  }), [skus, showInactive, filterCat, search]);

  const openAdd = () => {
    setEditingSKU(null);
    setForm({ code: '', name: '', category: categoryOptions[0] ?? '', supplier: '',
              price_per_unit: 0, qty_per_box: 1, m3_per_box: 0.01 });
    setModalOpen(true);
  };

  const openEdit = (sku: SKU) => {
    setEditingSKU(sku);
    setForm({ code: sku.code, name: sku.name, category: sku.category, supplier: sku.supplier,
              price_per_unit: sku.price_per_unit, qty_per_box: sku.qty_per_box, m3_per_box: sku.m3_per_box });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSKU) {
      const r = updateSKU(editingSKU.id, form);
      if (r.success) { setModalOpen(false); addToast('success', 'Tersimpan', `SKU ${form.code} diperbarui`); }
      else addToast('error', 'Gagal', r.error ?? 'Terjadi kesalahan');
    } else {
      const r = addSKU(form);
      if (r.success) { setModalOpen(false); addToast('success', 'Tersimpan', `SKU ${form.code} ditambahkan`); }
      else addToast('error', 'Gagal', r.error ?? 'Terjadi kesalahan');
    }
  };

  const handleDelete = (sku: SKU) => {
    if (!confirm(`Nonaktifkan SKU ${sku.code}?`)) return;
    const r = softDeleteSKU(sku.id);
    if (r.success) addToast('success', 'Dinonaktifkan', `SKU ${sku.code} dinonaktifkan`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  const r = await importSKUs(text);
  if (r.added === 0 && r.updated === 0 && r.errors.length > 0) {
    addToast('error', 'Error CSV', r.errors.slice(0, 3).join('; '));
  } else {
    addToast('success', 'Import Selesai',
      `${r.added} ditambahkan, ${r.updated} diperbarui${r.errors.length > 0 ? `, ${r.errors.length} error` : ''}`);
  }
  if (fileRef.current) fileRef.current.value = '';
};
    
    const r = await importSKUs(text);
    addToast('success', 'Import Selesai', `${r.added} ditambahkan, ${r.updated} diperbarui`);
    setImportOpen(false);
  };

  const field = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const v = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setForm(f => ({ ...f, [key]: v }));
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-heading">Master SKU</div>
          <div className="page-sub">{skus.filter(s => s.is_active).length} SKU aktif · {skus.length} total</div>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => exportToCSV(skus, 'master_sku')}>
              <Download size={14} /> Export
            </button>
            <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> Import CSV
            </button>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={14} /> Tambah SKU
            </button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="search-wrap">
          <Search size={14} />
          <input className="search-input" placeholder="Cari kode, nama, supplier..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 160 }}
          value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="all">Semua Kategori</option>
          {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
                         color: 'var(--gray-600)', cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
          Tampilkan nonaktif
        </label>
        <span className="text-muted text-sm" style={{ marginLeft: 'auto' }}>
          {filtered.length} dari {skus.length} SKU
        </span>
      </div>

      {/* Table */}
      <div className="tbl-wrap">
        <div className="tbl-wrap-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Kode SKU</th>
                <th>Nama Barang</th>
                <th>Kategori</th>
                <th>Supplier</th>
                <th style={{ textAlign: 'right' }}>Harga/pcs</th>
                <th style={{ textAlign: 'right' }}>Qty/Box</th>
                <th style={{ textAlign: 'right' }}>Vol/Box</th>
                <th>Status</th>
                {isAdmin && <th style={{ width: 72 }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={isAdmin ? 9 : 8}>
                  <div className="empty-state">
                    <Boxes className="empty-icon" />
                    <div className="empty-title">Tidak ada SKU ditemukan</div>
                    <div className="empty-sub">Coba ubah filter atau tambah SKU baru</div>
                  </div>
                </td></tr>
              ) : filtered.map(sku => (
                <tr key={sku.id} style={{ opacity: sku.is_active ? 1 : 0.45 }}>
                  <td><span className="sku-code">{sku.code}</span></td>
                  <td style={{ fontWeight: 500, color: 'var(--gray-800)', maxWidth: 200,
                               overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sku.name}
                  </td>
                  <td><span className="text-sm" style={{ color: 'var(--gray-500)' }}>{sku.category}</span></td>
                  <td className="text-sm text-muted">{sku.supplier || '—'}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                    {formatIDR(sku.price_per_unit)}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                    {sku.qty_per_box.toLocaleString('id')}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                    {sku.m3_per_box.toFixed(4)} m³
                  </td>
                  <td>
                    <span className={`badge ${sku.is_active ? 'badge-green' : 'badge-gray'}`}>
                      {sku.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(sku)} title="Edit">
                          <Pencil size={13} />
                        </button>
                        {sku.is_active && (
                          <button className="btn btn-ghost btn-icon btn-sm"
                            style={{ color: 'var(--red-600)' }}
                            onClick={() => handleDelete(sku)} title="Nonaktifkan">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">{editingSKU ? `Edit SKU — ${editingSKU.code}` : 'Tambah SKU Baru'}</span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label">Kode SKU <span className="req">*</span></label>
                  <input className="form-input" style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
                    value={form.code} onChange={field('code')}
                    placeholder="cth. 7RHXF4XX" required disabled={!!editingSKU} />
                  {!editingSKU && <div className="form-hint">Kode unik, tidak bisa diubah setelah disimpan</div>}
                </div>
                <div>
                  <label className="form-label">Kategori <span className="req">*</span></label>
                  <select className="form-select" value={form.category} onChange={field('category')} required>
                    {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Nama Barang <span className="req">*</span></label>
                  <input className="form-input" value={form.name} onChange={field('name')}
                    placeholder="Nama deskriptif barang..." required />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Nama Supplier</label>
                  <input className="form-input" value={form.supplier} onChange={field('supplier')}
                    placeholder="PT / CV Supplier..." />
                </div>
                <div>
                  <label className="form-label">Harga Satuan (Rp)</label>
                  <input className="form-input" type="number" min={0} value={form.price_per_unit} onChange={field('price_per_unit')} />
                </div>
                <div>
                  <label className="form-label">Qty / Box (pcs)</label>
                  <input className="form-input" type="number" min={1} value={form.qty_per_box} onChange={field('qty_per_box')} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Volume / Box (m³)</label>
                  <input className="form-input" type="number" step="0.000001" min={0} value={form.m3_per_box} onChange={field('m3_per_box')} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">
                  {editingSKU ? 'Simpan Perubahan' : 'Tambah SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
