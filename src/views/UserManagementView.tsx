import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Shield, UserCheck, UserCog } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Profile { id: string; full_name: string; role: string; created_at: string; email?: string; }

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  admin:      'Admin',
  staff:      'Staff',
};

const ROLE_BADGE: Record<string, string> = {
  superadmin: 'badge-red',
  admin:      'badge-blue',
  staff:      'badge-gray',
};

export const UserManagementView: React.FC = () => {
  const { profile: myProfile } = useAuth();
  const isSuperAdmin = myProfile?.role === 'superadmin';
  const isAdmin      = myProfile?.role === 'admin' || isSuperAdmin;

  const [users, setUsers]     = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at');
    setUsers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const changeRole = async (userId: string, newRole: string) => {
    if (!confirm(`Ubah role user ini menjadi "${ROLE_LABELS[newRole]}"?`)) return;
    setSaving(userId);
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    setSaving(null);
    fetchUsers();
  };

  const allowedTargetRoles = (targetRole: string): string[] => {
    if (isSuperAdmin) return ['superadmin', 'admin', 'staff'];
    if (isAdmin && targetRole !== 'superadmin') return ['admin', 'staff'];
    return [];
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-heading">Manajemen User</div>
        <div className="page-sub">Kelola role dan akses pengguna sistem</div>
      </div>

      {/* Role legend */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)', marginBottom: 12 }}>
          Hierarki Role
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { role: 'superadmin', icon: <Shield size={15} />, desc: 'Akses penuh + dapat ubah semua role termasuk superadmin' },
            { role: 'admin',      icon: <UserCog size={15} />, desc: 'Kelola SKU, kategori, PO, dan user (kecuali superadmin)' },
            { role: 'staff',      icon: <UserCheck size={15} />, desc: 'Scan masuk/keluar, lihat inventaris dan laporan' },
          ].map(r => (
            <div key={r.role} style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)',
                                        padding: '12px 14px', border: '1px solid var(--gray-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ color: 'var(--blue-600)' }}>{r.icon}</span>
                <span className={`badge ${ROLE_BADGE[r.role]}`}>{ROLE_LABELS[r.role]}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="tbl-wrap">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-400)' }}>Memuat...</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Role</th>
                <th>Bergabung</th>
                <th>Ubah Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const isMe = u.id === myProfile?.id;
                const targets = allowedTargetRoles(u.role);
                const canChange = targets.length > 0 && !isMe;
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--gray-800)' }}>
                        {u.full_name}
                        {isMe && <span style={{ fontSize: 11, color: 'var(--gray-400)', marginLeft: 6 }}>(Anda)</span>}
                      </div>
                    </td>
                    <td><span className={`badge ${ROLE_BADGE[u.role] ?? 'badge-gray'}`}>{ROLE_LABELS[u.role] ?? u.role}</span></td>
                    <td className="text-muted text-sm">{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                    <td>
                      {canChange ? (
                        <select
                          className="form-select"
                          style={{ width: 140, height: 30, fontSize: 12 }}
                          value={u.role}
                          disabled={saving === u.id}
                          onChange={e => changeRole(u.id, e.target.value)}
                        >
                          {targets.map(r => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--gray-300)' }}>
                          {isMe ? 'Tidak bisa ubah role sendiri' : 'Tidak ada akses'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
