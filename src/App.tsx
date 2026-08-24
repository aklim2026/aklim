import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/common/Toast';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { QuickInstallationWizard } from './components/common/QuickInstallationWizard';
import { LoginView } from './components/auth/LoginView';
import { Loader2 } from 'lucide-react';

// Main Views
import { DashboardView } from './components/dashboard/DashboardView';
import { ClientsView } from './components/clients/ClientsView';
import { TechniciensView } from './components/techniciens/TechniciensView';
import { InstallationsView } from './components/installations/InstallationsView';
import { InterventionsView } from './components/interventions/InterventionsView';
import { PaiementsView } from './components/paiements/PaiementsView';
import { QuartiersView } from './components/quartiers/QuartiersView';
import { RapportsView } from './components/rapports/RapportsView';
import { UtilisateursView } from './components/utilisateurs/UtilisateursView';
import { ParametresView } from './components/parametres/ParametresView';

const MainLayout: React.FC = () => {
  const { activeTab, toasts, removeToast } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'clients':
        return <ClientsView />;
      case 'techniciens':
        return <TechniciensView />;
      case 'installations':
        return <InstallationsView />;
      case 'interventions':
        return <InterventionsView />;
      case 'paiements':
        return <PaiementsView />;
      case 'quartiers':
        return <QuartiersView />;
      case 'rapports':
        return <RapportsView />;
      case 'utilisateurs':
        return <UtilisateursView />;
      case 'parametres':
        return <ParametresView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col antialiased">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all duration-300">
        <Header onOpenMobileSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <GlobalSearchModal />
      <QuickInstallationWizard />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

import { supabase } from './lib/supabase';

const AppContent: React.FC = () => {
  const { currentUser, isLoading } = useAuth();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Configuration Manquante</h1>
          <p className="text-slate-600 mb-6 text-sm">
            Les clés API Supabase ne sont pas configurées. Veuillez ajouter <strong>VITE_SUPABASE_URL</strong> et <strong>VITE_SUPABASE_ANON_KEY</strong> dans vos variables d'environnement Netlify.
          </p>
          <a 
            href="https://docs.netlify.com/configure-builds/environment-variables/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Voir la documentation Netlify
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
