import React from 'react';
import {
  LayoutDashboard, PackageSearch, PackagePlus, PackageMinus,
  RefreshCcw, Boxes, BarChart3, Tag, ClipboardList,
  ScrollText, Users, FolderOpen, LogOut, Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type ActiveTab =
  | 'dashboard' | 'scan_in' | 'scan_out' | 'restock'
  | 'skus' | 'inventory' | 'labels' | 'purchase_orders'
  | 'audit' | 'users' | 'categories';

interface SidebarProps {
  active: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const ICON = (Icon: React.FC<{ size?: number; strokeWidth?: number }>) =>
  <Icon size={16} strokeWidth={1.8} />;

export const Sidebar: React.FC<SidebarProps> = ({ active, onNavigate, mobileOpen, onMobileClose }) => {
  const { user, profile, signOut } = useAuth();

  const navGroups: NavGroup[] = [
    {
      label: '',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: ICON(LayoutDashboard) },
      ],
    },
    {
      label: 'Operasional',
      items: [
        { id: 'scan_in',  label: 'Scan Masuk',  icon: ICON(PackagePlus)  },
        { id: 'scan_out', label: 'Scan Keluar', icon: ICON(PackageMinus) },
        { id: 'restock',  label: 'Kalkulator Restock', icon: ICON(RefreshCcw) },
      ],
    },
    {
      label: 'Inventaris',
      items: [
        { id: 'skus',      label: 'Master SKU',       icon: ICON(Boxes)        },
        { id: 'inventory', label: 'Status Inventaris', icon: ICON(BarChart3)    },
        { id: 'labels',    label: 'Label Barcode',     icon: ICON(Tag)          },
      ],
    },
    {
      label: 'Transaksi',
      items: [
        { id: 'purchase_orders', label: 'Purchase Order', icon: ICON(ClipboardList) },
        { id: 'audit',           label: 'Log Aktivitas',  icon: ICON(ScrollText)    },
      ],
    },
    {
      label: 'Sistem',
      items: [
        { id: 'users',      label: 'Manajemen User', icon: ICON(Users),    roles: ['superadmin', 'admin'] },
        { id: 'categories', label: 'Kategori',       icon: ICON(FolderOpen), roles: ['superadmin', 'admin'] },
      ],
    },
  ];

  const userRole = profile?.role ?? 'staff';
  const initials = (profile?.full_name ?? user?.email ?? '?')
    .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const roleLabel: Record<string, string> = {
    superadmin: 'Super Admin',
    admin: 'Admin',
    staff: 'Staff',
  };

  const navigate = (tab: ActiveTab) => {
    onNavigate(tab);
    onMobileClose?.();
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={onMobileClose}
      />

      <aside className={`app-sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">G</div>
          <span className="sidebar-logo-text">GudangApp</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navGroups.map((group, gi) => {
            const visibleItems = group.items.filter(item =>
              !item.roles || item.roles.includes(userRole)
            );
            if (!visibleItems.length) return null;
            return (
              <div key={gi} className="sidebar-group">
                {group.label && (
                  <div className="sidebar-group-label">{group.label}</div>
                )}
                {visibleItems.map(item => (
                  <button
                    key={item.id}
                    className={`sidebar-item ${active === item.id ? 'active' : ''}`}
                    onClick={() => navigate(item.id)}
                    style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
                  >
                    <span className="sidebar-icon">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.full_name ?? user?.email}
              </div>
              <div className="sidebar-user-role">{roleLabel[userRole] ?? userRole}</div>
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={signOut} title="Keluar">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
