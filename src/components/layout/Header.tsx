import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  Search,
  Plus,
  RefreshCw,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export const Header: React.FC<{ onOpenMobileSidebar: () => void }> = ({ onOpenMobileSidebar }) => {
  const { setIsSearchOpen, setIsQuickInstallOpen, triggerRefresh } = useApp();
  const { currentUser, role, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    triggerRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 lg:px-8 py-3 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        {/* Left Side: Mobile Menu & Search trigger */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            id="btn-mobile-menu"
            onClick={onOpenMobileSidebar}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl lg:hidden transition-colors"
            title="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global Search Bar Button */}
          <button
            id="btn-trigger-global-search"
            onClick={() => setIsSearchOpen(true)}
            className="flex-1 flex items-center justify-between px-2 sm:px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200/80 text-xs sm:text-sm transition-all cursor-pointer group shadow-2xs overflow-hidden"
          >
            <div className="flex items-center gap-2 sm:gap-2.5 truncate">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
              <span className="truncate font-medium text-[10px] sm:text-sm">Rechercher un client, bon, technicien...</span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
              Ctrl+K
            </span>
          </button>
        </div>

        {/* Right Side: Quick Add, Refresh, User Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Refresh Button */}
          <button
            id="btn-header-refresh"
            onClick={handleRefresh}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            title="Actualiser les données"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Quick New Installation Button */}
          <button
            id="btn-header-new-install"
            onClick={() => setIsQuickInstallOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Installation</span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              id="btn-user-profile-menu"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all text-left"
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  role === 'admin'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}
              >
                {role === 'admin' ? 'AD' : 'TC'}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  {currentUser?.nom || 'Utilisateur'}
                </div>
                <div className="text-[10px] text-slate-500 capitalize">
                  {currentUser?.email}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div
                id="user-profile-dropdown"
                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {currentUser?.nom}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
