import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useInventory();
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => {
        const isError   = t.type === 'error';
        const isWarning = t.type === 'warning';
        const Icon = isError ? AlertCircle : isWarning ? AlertTriangle : t.type === 'success' ? CheckCircle2 : Info;
        return (
          <div key={t.id} className={`toast ${isError ? 'toast-error' : 'toast-success'}`}
            style={isWarning ? { background: 'var(--amber-600)' } : {}}>
            <Icon size={16} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{t.title}</div>
              {t.message && <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{t.message}</div>}
            </div>
            <button onClick={() => removeToast(t.id)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer',
                       opacity: 0.7, padding: 2, display: 'flex', alignItems: 'center' }}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
