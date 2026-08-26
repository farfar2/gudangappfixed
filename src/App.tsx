import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InventoryProvider } from './context/InventoryContext';
import { AppLayout } from './components/layout/AppLayout';
import { ActiveTab } from './components/layout/Sidebar';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { SkuManagementView } from './views/SkuManagementView';
import { InventoryView } from './views/InventoryView';
import { ScanInView } from './views/ScanInView';
import { ScanOutView } from './views/ScanOutView';
import { RestockCalculatorView } from './views/RestockCalculatorView';
import { BarcodeLabelsView } from './views/BarcodeLabelsView';
import { PurchaseOrdersView } from './views/PurchaseOrdersView';
import { AuditLogView } from './views/AuditLogView';
import { CategoryManagementView } from './views/CategoryManagementView';
import { UserManagementView } from './views/UserManagementView';
import { AnalyticsView } from './views/AnalyticsView';
import { ToastContainer } from './components/common/Toast';

const PAGE_TITLES: Record<ActiveTab, string> = {
  dashboard:       'Dashboard',
  scan_in:         'Scan Masuk',
  scan_out:        'Scan Keluar',
  restock:         'Kalkulator Restock',
  skus:            'Master SKU',
  inventory:       'Status Inventaris',
  labels:          'Label Barcode',
  purchase_orders: 'Purchase Order',
  audit:           'Log Aktivitas',
  users:           'Manajemen User',
  categories:      'Kategori Barang',
  analytics:       'Laporan Analitik',
};

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        background: 'var(--gray-50)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 36, height: 36, border: '3px solid var(--blue-100)',
            borderTopColor: 'var(--blue-600)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>Memuat...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':       return <DashboardView onNavigate={setActiveTab} />;
      case 'skus':            return <SkuManagementView />;
      case 'inventory':       return <InventoryView />;
      case 'scan_in':         return <ScanInView />;
      case 'scan_out':        return <ScanOutView />;
      case 'restock':         return <RestockCalculatorView />;
      case 'labels':          return <BarcodeLabelsView />;
      case 'purchase_orders': return <PurchaseOrdersView />;
      case 'audit':           return <AuditLogView />;
      case 'categories':      return <CategoryManagementView />;
      case 'users':           return <UserManagementView />;
      default:                return <DashboardView onNavigate={setActiveTab} />;
    }
  };

  return (
    <AppLayout
      activeTab={activeTab}
      onNavigate={setActiveTab}
      title={PAGE_TITLES[activeTab] ?? ''}
    >
      {renderView()}
    </AppLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <InventoryProvider>
        <MainApp />
        <ToastContainer />
      </InventoryProvider>
    </AuthProvider>
  );
}
