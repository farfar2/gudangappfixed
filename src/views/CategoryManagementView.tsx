import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, FolderOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Category { id: string; name: string; created_at: string; }

export const CategoryManagementView: React.FC = () => {
  const { profile } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAdd = () => { setEditing(null); setName(''); setError(''); setModalOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setName(c.name); setError(''); setModalOpen(true); };

  const save = async () => {
    if (!name.trim()) { setError('Nama kategori tidak boleh kosong'); return; }
    setSaving(true);
    setError('');
    if (editing) {
      const { error: e } = await supabase.from('categories').update({ name: name.trim() }).eq('id', editing.id);
      if (e) { setError(e.message); setSaving(false); return; }
    } else {
      const { error: e } = await supabase.from('categories').insert({ name: name.trim() });
      if (e) { setError(e.message || 'Nama sudah digunakan'); setSaving(false); return; }
    }
    setSaving(false);
    setModalOpen(false);
    fetchCategories();
  };

  const remove = async (id: string, catName: string) => {
    if (!confirm(`Hapus kategori "${catName}"? SKU yang menggunakan kategori ini akan terpengaruh.`)) return;
    await supabase.from('categories').delete().eq('id', id);
    fetchCategories();
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-heading">Kategori Barang</div>
          <div className="page-sub">Kelola master daftar kategori untuk SKU</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={15} /> Tambah Kategori
          </button>
        )}
      </div>

      <div className="tbl-wrap">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-400)' }}>Memuat...</div>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <FolderOpen className="empty-icon" />
            <div className="empty-title">Belum ada kategori</div>
            <div className="empty-sub">Tambah kategori pertama untuk mulai mengorganisir SKU</div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>Nama Kategori</th>
                <th>Dibuat</th>
                {isAdmin && <th style={{ width: 80 }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={c.id}>
                  <td className="text-muted text-sm">{i + 1}</td>
                  <td style={{ fontWeight: 500, color: 'var(--gray-800)' }}>{c.name}</td>
                  <td className="text-muted text-sm">{new Date(c.created_at).toLocaleDateString('id-ID')}</td>
                  {isAdmin && (
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(c)} title="Edit">
                          <Pencil size={13} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm"
                          style={{ color: 'var(--red-600)' }}
                          onClick={() => remove(c.id, c.name)} title="Hapus">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Kategori' : 'Tambah Kategori'}</span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <label className="form-label">Nama Kategori <span className="req">*</span></label>
              <input
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="cth. Elektronik, Perkakas, Otomotif..."
                autoFocus
                onKeyDown={e => e.key === 'Enter' && save()}
              />
              {error && <div className="form-error">{error}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
