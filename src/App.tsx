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

const AppContent: React.FC = () => {
  const { currentUser, isLoading } = useAuth();

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
