import React from 'react';
import { useApp, NavigationTab } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Airplay,
  FileCheck2,
  Receipt,
  MapPin,
  FileSpreadsheet,
  UserCog,
  Settings,
  Plus,
  Flame,
  Snowflake,
} from 'lucide-react';

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, setIsQuickInstallOpen, settings } = useApp();
  const { isAdmin, role } = useAuth();

  const menuItems: { id: NavigationTab; label: string; icon: any; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'techniciens', label: 'Techniciens', icon: Wrench },
    { id: 'installations', label: 'Installations', icon: Airplay },
    { id: 'interventions', label: 'Interventions', icon: FileCheck2 },
    { id: 'paiements', label: 'Paiements', icon: Receipt },
    { id: 'quartiers', label: 'Quartiers', icon: MapPin },
    { id: 'rapports', label: 'Rapports', icon: FileSpreadsheet },
    { id: 'utilisateurs', label: 'Utilisateurs', icon: UserCog, adminOnly: true },
    { id: 'parametres', label: 'Paramètres', icon: Settings, adminOnly: true },
  ];

  const handleTabClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo & Title */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Snowflake className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                {settings.nomentreprise || 'ClimTrack'}
              </h1>
              <p className="text-[11px] text-sky-400 font-medium">Gestion Climatisation</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>

        {/* Quick Action Button */}
        <div className="px-4 pt-4 pb-2">
          <button
            id="btn-quick-install-sidebar"
            onClick={() => {
              setIsQuickInstallOpen(true);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Installation</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu Principal
          </div>
          {menuItems.map(item => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/90 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info / Role Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-sky-400">
              {role === 'admin' ? 'AD' : 'TC'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-200 truncate">
                {role === 'admin' ? 'Administrateur' : 'Technicien / Opérateur'}
              </p>
              <p className="text-[10px] text-slate-400">Rôle : {role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
