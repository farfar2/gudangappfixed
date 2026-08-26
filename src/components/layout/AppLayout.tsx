import React, { useState } from 'react';
import { Sidebar, ActiveTab } from './Sidebar';
import { Menu } from 'lucide-react';

interface AppLayoutProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab, onNavigate, title, actions, children
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        active={activeTab}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="app-main">
        <header className="app-header">
          <button
            className="btn btn-ghost btn-icon"
            style={{ display: 'none' }}
            id="mobile-menu-btn"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} />
          </button>
          <button
            className="btn btn-ghost btn-icon no-print"
            onClick={() => setMobileOpen(true)}
            style={{ marginRight: 4 }}
            aria-label="Buka menu"
          >
            <Menu size={18} />
          </button>
          <span className="page-title">{title}</span>
          {actions && <div className="header-actions">{actions}</div>}
        </header>
        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
};
