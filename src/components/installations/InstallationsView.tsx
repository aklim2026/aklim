import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Installation, Technicien, Quartier, InstallationStatut } from '../../types';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/formatters';
import { exportToExcel } from '../../utils/exportUtils';
import { InstallationFormModal } from './InstallationFormModal';
import { InstallationDetailModal } from './InstallationDetailModal';
import { ReglerSoldeModal } from '../common/ReglerSoldeModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Pagination } from '../common/Pagination';
import {
  Airplay,
  Plus,
  Search,
  Download,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Phone,
  User,
  Wrench,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

export const InstallationsView: React.FC = () => {
  const {
    settings,
    refreshKey,
    triggerRefresh,
    selectedInstallationId,
    setSelectedInstallationId,
    setIsQuickInstallOpen,
    addToast,
  } = useApp();
  const { isAdmin } = useAuth();

  const [installations, setInstallations] = useState<Installation[]>([]);
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterTechnicien, setFilterTechnicien] = useState('all');
  const [filterTypeClient, setFilterTypeClient] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [instToEdit, setInstToEdit] = useState<Installation | null>(null);
  const [instToDelete, setInstToDelete] = useState<string | null>(null);
  const [targetToSettle, setTargetToSettle] = useState<any | null>(null);
  const [updatingStatutId, setUpdatingStatutId] = useState<string | null>(null);

  const handleQuickStatusChange = async (id: string, newStatut: InstallationStatut) => {
    setUpdatingStatutId(id);
    const oldInst = installations.find(i => i.id === id);
    // Optimistic UI update
    setInstallations(prev =>
      prev.map(item => (item.id === id ? { ...item, statut: newStatut } : item))
    );

    try {
      await api.updateinstallation(id, { statut: newStatut });
      addToast({
        type: 'success',
        title: 'Statut mis à jour',
        message: `Statut passé à "${newStatut}".`,
      });
      triggerRefresh();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.message || 'Impossible de mettre à jour le statut.',
      });
      // Revert if error
      if (oldInst) {
        setInstallations(prev =>
          prev.map(item => (item.id === id ? { ...item, statut: oldInst.statut } : item))
        );
      }
    } finally {
      setUpdatingStatutId(null);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [insts, techs] = await Promise.all([
        api.getInstallations(),
        api.getTechniciens(),
      ]);
      setInstallations(insts);
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
  }, [searchTerm, filterStatut, filterTechnicien, filterTypeClient]);

  const filtered = installations.filter(inst => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (inst.clientnom && inst.clientnom.toLowerCase().includes(term)) ||
      (inst.techniciennom && inst.techniciennom.toLowerCase().includes(term)) ||
      (inst.numerobon && inst.numerobon.toLowerCase().includes(term)) ||
      (inst.numerocontrole && inst.numerocontrole.toLowerCase().includes(term)) ||
      inst.marque.toLowerCase().includes(term) ||
      inst.typeclimatiseur.toLowerCase().includes(term) ||
      (inst.clientquartier && inst.clientquartier.toLowerCase().includes(term));

    const matchesStatut = filterStatut === 'all' || inst.statut === filterStatut;
    const matchesTech = filterTechnicien === 'all' || inst.technicienid === filterTechnicien;
    const matchesTypeClient = filterTypeClient === 'all' || inst.typeclient === filterTypeClient;

    return matchesSearch && matchesStatut && matchesTech && matchesTypeClient;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async () => {
    if (!instToDelete) return;
    try {
      await api.deleteInstallation(instToDelete);
      addToast({
        type: 'success',
        title: 'Installation supprimée',
        message: 'Le dossier d’installation a été supprimé.',
      });
      triggerRefresh();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.message || 'Impossible de supprimer.',
      });
    } finally {
      setInstToDelete(null);
    }
  };

  const handleExportExcel = () => {
    const data = filtered.map(i => ({
      'Date': formatDate(i.dateinstallation),
      'Client': i.clientnom,
      'Prénom': i.clientkinya || '',
      'Téléphone': i.clienttelephone,
      'Quartier': i.clientquartier,
      'Technicien': i.techniciennom,
      'Type Climatiseur': i.typeclimatiseur,
      'Marque': i.marque,
      'Modèle': i.modele,
      'Puissance': i.puissance,
      'Quantité': i.quantite,
      'N° de Bon': i.numerobon,
      'N° de Contrôle': i.numerocontrole,
      'Prix Total (DH)': i.prix,
      'Montant Payé (DH)': i.montantpaye || 0,
      'Solde Restant (DH)': Math.max(0, i.prix - (i.montantpaye || 0)),
      'Statut': i.statut,
      'Tâche': i.tacherealisee,
      'Observation': i.observation,
    }));
    exportToExcel(data, 'Installations_ClimTrack', 'Installations');
    addToast({ type: 'success', title: 'Exportation réussie', message: 'Fichier Excel généré.' });
  };

  return (
    <div id="installations-page" className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Airplay className="w-5 h-5 text-blue-600" />
            <span>Suivi des Installations de Climatiseurs</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestion des équipements, des bons d'installation, des contrôles et des statuts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-export-inst-excel"
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exporter Excel</span>
          </button>
          <button
            id="btn-add-inst-main"
            onClick={() => setIsQuickInstallOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle installation</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par client, bon, contrôle, marque, technicien..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={filterStatut}
              onChange={e => setFilterStatut(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-700"
            >
              <option value="all">Tous les Statuts</option>
              <option value="Planifiée">Planifiée</option>
              <option value="Affectée">Affectée</option>
              <option value="En cours">En cours</option>
              <option value="Installée">Installée</option>
              <option value="Contrôlée">Contrôlée</option>
              <option value="Annulée">Annulée</option>
            </select>
          </div>

          <div>
            <select
              value={filterTechnicien}
              onChange={e => setFilterTechnicien(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-700"
            >
              <option value="all">Tous les Techniciens</option>
              {techniciens.map(t => (
                <option key={t.id} value={t.id}>
                  {t.prenom} {t.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterTypeClient}
              onChange={e => setFilterTypeClient(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-slate-700"
            >
              <option value="all">Toutes Catégories</option>
              <option value="Standard">Client Standard</option>
              <option value="Grande Surface">Supermarchés (G.S)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Installations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Chargement des installations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <p className="text-sm font-semibold text-slate-600">Aucune installation trouvée</p>
            <p className="text-xs">Modifiez les filtres ou enregistrez une nouvelle installation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="table-installations" className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th className="p-3.5 whitespace-nowrap hidden md:table-cell">Date</th>
                  <th className="p-3.5 whitespace-nowrap">Client & Quartier</th>
                  <th className="p-3.5 whitespace-nowrap hidden sm:table-cell">Technicien</th>
                  <th className="p-3.5 whitespace-nowrap">Climatiseur & Puissance</th>
                  <th className="p-3.5 whitespace-nowrap hidden lg:table-cell">N° Bon / Contrôle</th>
                  <th className="p-3.5 text-right whitespace-nowrap">Prix / Solde</th>
                  <th className="p-3.5 whitespace-nowrap hidden sm:table-cell">Statut</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.map(inst => {
                  const solde = Math.max(0, inst.prix - (inst.montantpaye || 0));
                  return (
                    <tr
                      key={inst.id}
                      id={`inst-row-${inst.id}`}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                      onClick={() => setSelectedInstallationId(inst.id)}
                    >
                      <td className="p-3.5 font-medium text-slate-700 whitespace-nowrap hidden md:table-cell">
                        {formatDate(inst.dateinstallation)}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors whitespace-nowrap">
                            {inst.clientnom}
                          </div>
                          {inst.typeclient === 'Grande Surface' && (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 rounded text-[9px] font-extrabold uppercase">
                              G.S
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 whitespace-nowrap">
                          {inst.clientquartier} <span className="hidden sm:inline">{inst.clienttelephone && `• ${inst.clienttelephone}`}</span>
                        </div>
                        <div className="md:hidden text-[10px] text-slate-400 mt-0.5">
                          {formatDate(inst.dateinstallation)}
                        </div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-800 whitespace-nowrap hidden sm:table-cell">
                        {inst.techniciennom}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 whitespace-nowrap text-[11px] sm:text-xs">
                          {inst.marque} {inst.puissance}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-500 whitespace-nowrap">
                          {inst.typeclimatiseur} (x{inst.quantite})
                        </div>
                        <div className="sm:hidden text-[10px] text-blue-600 font-medium mt-0.5">
                          {inst.techniciennom}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] whitespace-nowrap hidden lg:table-cell">
                        <div className="font-bold text-indigo-700 whitespace-nowrap">Bon: {inst.numerobon}</div>
                        <div className="text-emerald-700 whitespace-nowrap">Ctrl: {inst.numerocontrole}</div>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap font-medium">
                        <div className="font-bold text-slate-900 whitespace-nowrap text-[11px] sm:text-xs">
                          {formatCurrency(inst.prix, settings.devise)}
                        </div>
                        {solde > 0 ? (
                          <div className="mt-1 flex flex-col items-end gap-1 whitespace-nowrap">
                            <div className="text-[10px] text-slate-500 font-medium">
                              <span className="hidden sm:inline">Encaissé : </span><strong className="text-emerald-700 font-bold">{formatCurrency(inst.montantpaye || 0, settings.devise)}</strong>
                            </div>
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                              <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[9px] font-extrabold shadow-xs whitespace-nowrap">
                                <span className="hidden sm:inline">Reste: </span>{formatCurrency(solde, settings.devise)}
                              </span>
                              <button
                                id={`btn-settle-inst-${inst.id}`}
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setTargetToSettle({
                                    type: 'installation',
                                    id: inst.id,
                                    nom: inst.clientnom,
                                    kinya: inst.clientkinya,
                                    numerobon: inst.numerobon,
                                    numerocontrole: inst.numerocontrole,
                                    totalFacture: inst.prix || 0,
                                    totalPaye: inst.montantpaye || 0,
                                    soldeRestant: solde,
                                    technicienid: inst.technicienid,
                                  });
                                }}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border border-blue-200 rounded text-[9px] font-bold shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                title="Régler le solde de cette installation"
                              >
                                <CheckCircle2 className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                                <span>Régler</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[9px] text-emerald-600 font-bold flex items-center justify-end gap-0.5 mt-0.5 whitespace-nowrap">
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold shadow-xs whitespace-nowrap">
                              <CheckCircle2 className="w-2 h-2 mr-1" />
                              Payé
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap hidden sm:table-cell" onClick={e => e.stopPropagation()}>
                        <div className="relative inline-flex items-center group/statut">
                          <select
                            id={`select-statut-${inst.id}`}
                            value={inst.statut}
                            disabled={updatingStatutId === inst.id}
                            onChange={e => handleQuickStatusChange(inst.id, e.target.value as InstallationStatut)}
                            className={`appearance-none pl-2.5 pr-6 py-1 text-[11px] font-bold rounded-full border shadow-2xs cursor-pointer transition-all hover:brightness-95 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${getStatusBadgeClass(inst.statut)}`}
                            title="Cliquer pour changer le statut directement"
                          >
                            <option value="Planifiée" className="bg-white text-slate-800">Planifiée</option>
                            <option value="Affectée" className="bg-white text-slate-800">Affectée</option>
                            <option value="En cours" className="bg-white text-slate-800">En cours</option>
                            <option value="Installée" className="bg-white text-slate-800">Installée</option>
                            <option value="Contrôlée" className="bg-white text-slate-800">Contrôlée</option>
                            <option value="Annulée" className="bg-white text-slate-800">Annulée</option>
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60 group-hover/statut:opacity-100 transition-opacity" />
                        </div>
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedInstallationId(inst.id)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ouvrir le bon"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {solde > 0 && (
                            <button
                              id={`btn-action-settle-inst-${inst.id}`}
                              onClick={() => {
                                setTargetToSettle({
                                  type: 'installation',
                                  id: inst.id,
                                  nom: inst.clientnom,
                                  kinya: inst.clientkinya,
                                  numerobon: inst.numerobon,
                                  numerocontrole: inst.numerocontrole,
                                  totalFacture: inst.prix || 0,
                                  totalPaye: inst.montantpaye || 0,
                                  soldeRestant: solde,
                                  technicienid: inst.technicienid,
                                });
                              }}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Régler le solde restant"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setInstToEdit(inst);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setInstToDelete(inst.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Quick Settlement Modal */}
      <ReglerSoldeModal
        isOpen={!!targetToSettle}
        onClose={() => setTargetToSettle(null)}
        target={targetToSettle}
        onSuccess={triggerRefresh}
      />

      {/* Modals */}
      <InstallationFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        installationToEdit={instToEdit}
        onSaved={triggerRefresh}
      />

      <InstallationDetailModal
        installationid={selectedInstallationId}
        onClose={() => setSelectedInstallationId(null)}
        onEdit={inst => {
          setInstToEdit(inst);
          setIsFormOpen(true);
        }}
        onDelete={id => setInstToDelete(id)}
      />

      <ConfirmDialog
        isOpen={!!instToDelete}
        onClose={() => setInstToDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer cette installation ?"
        message="Cette action supprimera le dossier d'installation du climatiseur."
        confirmLabel="Oui, supprimer"
      />
    </div>
  );
};
