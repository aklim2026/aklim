import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Paiement, Technicien, ModePaiement } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToExcel, exportPaiementRecuPDF } from '../../utils/exportUtils';
import { PaiementFormModal } from './PaiementFormModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Pagination } from '../common/Pagination';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Filter,
  DollarSign,
  TrendingUp,
  CreditCard,
  Printer,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

export const PaiementsView: React.FC = () => {
  const {
    settings,
    refreshKey,
    triggerRefresh,
    setSelectedClientId,
    setSelectedTechnicienId,
    setActiveTab,
    addToast,
  } = useApp();
  const { isAdmin } = useAuth();

  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [filterTech, setFilterTech] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [payToEdit, setPayToEdit] = useState<Paiement | null>(null);
  const [payToDelete, setPayToDelete] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pays, techs] = await Promise.all([
        api.getPaiements(),
        api.getTechniciens(),
      ]);
      setPaiements(pays);
      setTechniciens(techs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterMode, filterTech]);

  const totalEncaisse = paiements.reduce((acc, p) => acc + (p.montant || 0), 0);

  const filtered = paiements.filter(p => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (p.clientnom && p.clientnom.toLowerCase().includes(term)) ||
      (p.techniciennom && p.techniciennom.toLowerCase().includes(term)) ||
      (p.numerobon && p.numerobon.toLowerCase().includes(term)) ||
      p.modepaiement.toLowerCase().includes(term) ||
      (p.observation && p.observation.toLowerCase().includes(term));

    const matchesMode = filterMode === 'all' || p.modepaiement === filterMode;
    const matchesTech = filterTech === 'all' || p.technicienid === filterTech;

    return matchesSearch && matchesMode && matchesTech;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async () => {
    if (!payToDelete) return;
    try {
      await api.deletePaiement(payToDelete);
      addToast({
        type: 'success',
        title: 'Paiement supprimé',
        message: 'Le règlement a été supprimé et les soldes recalculés.',
      });
      triggerRefresh();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.message || 'Impossible de supprimer.',
      });
    } finally {
      setPayToDelete(null);
    }
  };

  const handlePrintReceipt = (p: Paiement) => {
    try {
      exportPaiementRecuPDF(p, settings);
      addToast({
        type: 'success',
        title: 'Reçu de paiement généré',
        message: 'PDF imprimable téléchargé.',
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible d’exporter le reçu.' });
    }
  };

  const handleExportExcel = () => {
    const data = filtered.map(p => ({
      'Date': formatDate(p.date),
      'Client': p.clientnom,
      'N° de Bon': p.numerobon || '',
      'Montant Encaissé (DH)': p.montant,
      'Mode de Paiement': p.modepaiement,
      'Encaissé par (Technicien)': p.techniciennom,
      'Observation': p.observation || '',
    }));
    exportToExcel(data, 'Journal_Paiements_ClimTrack', 'Paiements');
    addToast({ type: 'success', title: 'Exportation réussie', message: 'Fichier Excel téléchargé.' });
  };

  return (
    <div id="paiements-page" className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <span>Gestion des Règlements & Encaissements</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des paiements perçus par bon, par technicien et émission de reçus officiels
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-export-pay-excel"
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exporter Excel</span>
          </button>
          <button
            id="btn-add-pay-main"
            onClick={() => {
              setPayToEdit(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Encaisser un paiement</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Banner */}
      <div className="p-4 bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 rounded-2xl border border-emerald-800/60 text-white shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-emerald-300 font-medium">Cumul Total des Encaissements</div>
            <div className="text-xl sm:text-2xl font-extrabold text-white">
              {formatCurrency(totalEncaisse, settings.devise)}
            </div>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          <strong className="text-emerald-400 font-bold">{paiements.length}</strong> transactions enregistrées
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par client, bon, technicien, mode..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={filterMode}
              onChange={e => setFilterMode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-700"
            >
              <option value="all">Tous les Modes</option>
              <option value="Espèces">Espèces</option>
              <option value="Chèque">Chèque</option>
              <option value="Virement bancaire">Virement bancaire</option>
              <option value="Carte bancaire">Carte bancaire</option>
            </select>
          </div>

          <div>
            <select
              value={filterTech}
              onChange={e => setFilterTech(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-700"
            >
              <option value="all">Tous les Techniciens</option>
              {techniciens.map(t => (
                <option key={t.id} value={t.id}>
                  {t.prenom} {t.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Chargement des paiements...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <p className="text-sm font-semibold text-slate-600">Aucun paiement trouvé</p>
            <p className="text-xs">Modifiez les filtres ou enregistrez un nouvel encaissement.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="table-paiements" className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th className="p-3.5 whitespace-nowrap hidden md:table-cell">Date</th>
                  <th className="p-3.5 whitespace-nowrap">Client Déبiteur</th>
                  <th className="p-3.5 whitespace-nowrap hidden sm:table-cell">N° Bon</th>
                  <th className="p-3.5 whitespace-nowrap hidden lg:table-cell">Encaissé par (Tech)</th>
                  <th className="p-3.5 whitespace-nowrap hidden sm:table-cell">Mode</th>
                  <th className="p-3.5 text-right whitespace-nowrap">Montant</th>
                  <th className="p-3.5 whitespace-nowrap hidden xl:table-cell">Observation / Réf</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-medium text-slate-700 whitespace-nowrap hidden md:table-cell">
                      {formatDate(p.date)}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedClientId(p.clientid);
                          setActiveTab('clients');
                        }}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left whitespace-nowrap text-[11px] sm:text-xs"
                      >
                        {p.clientnom}
                      </button>
                      <div className="md:hidden text-[10px] text-slate-400 mt-0.5">
                        {formatDate(p.date)} {p.numerobon && `• Bon: ${p.numerobon}`}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-indigo-700 font-semibold whitespace-nowrap hidden sm:table-cell">
                      {p.numerobon || '-'}
                    </td>
                    <td className="p-3.5 whitespace-nowrap hidden lg:table-cell">
                      <button
                        onClick={() => {
                          setSelectedTechnicienId(p.technicienid);
                          setActiveTab('techniciens');
                        }}
                        className="font-medium text-slate-800 hover:text-indigo-600 transition-colors text-left whitespace-nowrap"
                      >
                        {p.techniciennom}
                      </button>
                    </td>
                    <td className="p-3.5 whitespace-nowrap hidden sm:table-cell">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-700 whitespace-nowrap text-[10px]">
                        {p.modepaiement}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-extrabold text-emerald-600 text-[11px] sm:text-sm whitespace-nowrap">
                      +{formatCurrency(p.montant, settings.devise)}
                      <div className="lg:hidden text-[9px] text-slate-400 font-normal">
                        Par: {p.techniciennom}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-500 max-w-xs truncate whitespace-nowrap hidden xl:table-cell">
                      {p.observation || '-'}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setPayToEdit(p);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintReceipt(p)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Imprimer le reçu PDF"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setPayToEdit(p);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPayToDelete(p.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={filtered.length}
        />
      </div>

      {/* Form Modal */}
      <PaiementFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        paiementToEdit={payToEdit}
        onSaved={triggerRefresh}
      />

      <ConfirmDialog
        isOpen={!!payToDelete}
        onClose={() => setPayToDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer ce paiement ?"
        message="Cette action déduira le montant encaissé et réajustera le solde restant du client."
        confirmLabel="Oui, supprimer"
      />
    </div>
  );
};
