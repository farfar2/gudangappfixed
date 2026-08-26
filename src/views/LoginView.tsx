import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginView: React.FC = () => {
  const { signIn } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const err = await signIn(email, password);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: 'var(--gray-50)', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, background: 'var(--blue-600)',
            borderRadius: 10, display: 'grid', placeItems: 'center',
            margin: '0 auto 14px', fontSize: 20, fontWeight: 800, color: 'white',
          }}>G</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)', letterSpacing: '-0.4px' }}>
            GudangApp
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>
            Sistem Manajemen Gudang
          </div>
        </div>

        {/* Card */}
        <div className="card card-pad">
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="form-label">Email <span className="req">*</span></label>
              <input
                type="email"
                className="form-input"
                placeholder="nama@perusahaan.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="form-label">Password <span className="req">*</span></label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div style={{
                background: 'var(--red-50)', border: '1px solid var(--red-100)',
                borderRadius: 'var(--radius)', padding: '10px 12px',
                fontSize: 13, color: 'var(--red-700)',
              }}>
                {error}
              </div>
            )}
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
              style={{ marginTop: 4, width: '100%', justifyContent: 'center' }}>
              {loading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
