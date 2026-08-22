import React, { createContext, useContext, useState, useEffect } from 'react';
import { CompanySettings } from '../types';
import { api } from '../services/api';

export type NavigationTab =
  | 'dashboard'
  | 'clients'
  | 'techniciens'
  | 'installations'
  | 'interventions'
  | 'paiements'
  | 'quartiers'
  | 'rapports'
  | 'utilisateurs'
  | 'parametres';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface AppContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  settings: CompanySettings;
  updateSettings: (newSettings: Partial<CompanySettings>) => Promise<void>;
  
  // Modals & Navigation helpers
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isQuickInstallOpen: boolean;
  setIsQuickInstallOpen: (open: boolean) => void;

  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  selectedTechnicienId: string | null;
  setSelectedTechnicienId: (id: string | null) => void;
  selectedInstallationId: string | null;
  setSelectedInstallationId: (id: string | null) => void;

  // Refresh signal for all tables
  refreshKey: number;
  triggerRefresh: () => void;

  // Toast notifications
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const defaultSettings: CompanySettings = {
  user_id: '',
  nomentreprise: 'CLIM EXPERT MAROC SARL',
  slogan: 'Installation, Contrôle et Maintenance de Systèmes de Climatisation',
  telephone: '+212 5 22 45 88 99',
  email: 'contact@climexpert.ma',
  adresse: 'Bd Abdelmoumen, Tour Casablanca Finance, Casablanca',
  ville: 'Casablanca',
  devise: 'DH',
  ice: '002984712000045',
  rc: '458921',
  modelecontroleprefix: 'CTRL-2026-',
  modelebonprefix: 'BON-',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickInstallOpen, setIsQuickInstallOpen] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedTechnicienId, setSelectedTechnicienId] = useState<string | null>(null);
  const [selectedInstallationId, setSelectedInstallationId] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    api.getSettings()
      .then(res => {
        if (res) setSettings(res);
      })
      .catch(err => console.error('Failed to load settings:', err));
  }, []);

  const updateSettings = async (newSettings: Partial<CompanySettings>) => {
    try {
      const updated = await api.updateSettings(newSettings);
      setSettings(updated);
      addToast({
        type: 'success',
        title: 'Paramètres mis à jour',
        message: 'Les informations de l’entreprise ont été enregistrées.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.message || 'Impossible de mettre à jour les paramètres.',
      });
    }
  };

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Keyboard shortcut Ctrl+K / Cmd+K for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        settings,
        updateSettings,
        isSearchOpen,
        setIsSearchOpen,
        isQuickInstallOpen,
        setIsQuickInstallOpen,
        selectedClientId,
        setSelectedClientId,
        selectedTechnicienId,
        setSelectedTechnicienId,
        selectedInstallationId,
        setSelectedInstallationId,
        refreshKey,
        triggerRefresh,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
