import React, { useState } from 'react';
import { ActiveTab } from './Sidebar';
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Layers,
  MoreHorizontal,
  Boxes,
  Calculator,
  Barcode,
  ShoppingBag,
  History,
  X,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

interface MobileTabBarProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ currentTab, onSelectTab }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { criticalCount } = useInventory();

  const handleSelect = (tab: ActiveTab) => {
    onSelectTab(tab);
    setDrawerOpen(false);
  };

  const isMoreActive = ['skus', 'restock', 'labels', 'purchase_orders', 'audit'].includes(currentTab);

  return (
    <>
      {/* Drawer for other menu items */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-slate-950/80 backdrop-blur-md flex flex-col justify-end">
          <div className="bg-slate-900 text-white rounded-t-3xl p-5 border-t border-slate-800 shadow-2xl max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-100">Menu Operasional Lainnya</h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pb-6">
              <button
                onClick={() => handleSelect('skus')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium min-h-[48px] transition-all ${
                  currentTab === 'skus'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-950'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Boxes className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>Manajemen SKU</span>
              </button>

              <button
                onClick={() => handleSelect('restock')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium min-h-[48px] transition-all ${
                  currentTab === 'restock'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-950'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Calculator className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Kalkulator Restock</span>
              </button>

              <button
                onClick={() => handleSelect('labels')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium min-h-[48px] transition-all ${
                  currentTab === 'labels'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-950'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Barcode className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Cetak Label Barcode</span>
              </button>

              <button
                onClick={() => handleSelect('purchase_orders')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium min-h-[48px] transition-all ${
                  currentTab === 'purchase_orders'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-950'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-5 h-5 text-blue-400 shrink-0" />
                <span>Purchase Order (PO)</span>
              </button>

              <button
                onClick={() => handleSelect('audit')}
                className={`col-span-2 flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium min-h-[48px] transition-all ${
                  currentTab === 'audit'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-950'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <History className="w-5 h-5 text-purple-400 shrink-0" />
                <span>Log Audit Pergerakan (Append-Only)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <nav
        id="mobile-bottom-bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl"
      >
        {/* Dashboard */}
        <button
          id="mobile-nav-dashboard"
          onClick={() => handleSelect('dashboard')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-all relative ${
            currentTab === 'dashboard' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Dashboard</span>
          {criticalCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse"></span>
          )}
        </button>

        {/* Scan In */}
        <button
          id="mobile-nav-scan-in"
          onClick={() => handleSelect('scan_in')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-all ${
            currentTab === 'scan_in' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowDownToLine className="w-5 h-5 text-indigo-400" />
          <span className="text-[10px] mt-0.5">Scan In</span>
        </button>

        {/* Scan Out */}
        <button
          id="mobile-nav-scan-out"
          onClick={() => handleSelect('scan_out')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-all ${
            currentTab === 'scan_out' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowUpFromLine className="w-5 h-5 text-amber-400" />
          <span className="text-[10px] mt-0.5">Scan Out</span>
        </button>

        {/* Inventory */}
        <button
          id="mobile-nav-inventory"
          onClick={() => handleSelect('inventory')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-all ${
            currentTab === 'inventory' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Stok</span>
        </button>

        {/* More Drawer */}
        <button
          id="mobile-nav-more"
          onClick={() => setDrawerOpen(true)}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-all ${
            isMoreActive ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Lainnya</span>
        </button>
      </nav>
    </>
  );
};
