import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Intervention, Technicien, InterventionStatut } from '../../types';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/formatters';
import { exportToExcel } from '../../utils/exportUtils';
import { InterventionFormModal } from './InterventionFormModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Pagination } from '../common/Pagination';
import {
  FileCheck2,
  Plus,
  Search,
  Download,
  Filter,
  Eye,
  Edit2,
  Trash2,
  User,
  Wrench,
  Clock,
  ChevronDown,
} from 'lucide-react';

export const InterventionsView: React.FC = () => {
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

  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterTech, setFilterTech] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [interToEdit, setInterToEdit] = useState<Intervention | null>(null);
  const [interToDelete, setInterToDelete] = useState<string | null>(null);
  const [updatingStatutId, setUpdatingStatutId] = useState<string | null>(null);

  const handleQuickStatusChange = async (id: string, newStatut: InterventionStatut) => {
    setUpdatingStatutId(id);
    const oldInter = interventions.find(i => i.id === id);
    // Optimistic UI update
    setInterventions(prev =>
      prev.map(item => (item.id === id ? { ...item, statut: newStatut } : item))
    );

    try {
      await api.updateIntervention(id, { statut: newStatut });
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
      if (oldInter) {
        setInterventions(prev =>
          prev.map(item => (item.id === id ? { ...item, statut: oldInter.statut } : item))
        );
      }
    } finally {
      setUpdatingStatutId(null);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [ints, techs] = await Promise.all([
        api.getInterventions(),
        api.getTechniciens(),
      ]);
      setInterventions(ints);
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
  }, [searchTerm, filterStatut, filterTech]);

  const filtered = interventions.filter(item => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (item.clientnom && item.clientnom.toLowerCase().includes(term)) ||
      (item.techniciennom && item.techniciennom.toLowerCase().includes(term)) ||
      item.typeintervention.toLowerCase().includes(term) ||
      item.descriptiontache.toLowerCase().includes(term) ||
      (item.observation && item.observation.toLowerCase().includes(term));

    const matchesStatut = filterStatut === 'all' || item.statut === filterStatut;
    const matchesTech = filterTech === 'all' || item.technicienid === filterTech;

    return matchesSearch && matchesStatut && matchesTech;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async () => {
    if (!interToDelete) return;
    try {
      await api.deleteIntervention(interToDelete);
      addToast({
        type: 'success',
        title: 'Intervention supprimée',
        message: 'L’enregistrement d’intervention a été supprimé.',
      });
      triggerRefresh();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.message || 'Impossible de supprimer.',
      });
    } finally {
      setInterToDelete(null);
    }
  };

  const handleExportExcel = () => {
    const data = filtered.map(i => ({
      'Date': formatDate(i.date),
      'Client': i.clientnom,
      'Technicien': i.techniciennom,
      'Type Intervention': i.typeintervention,
      'Description Tâche': i.descriptiontache,
      'Statut': i.statut,
      'Coût (DH)': i.cout || 0,
      'Observation': i.observation || '',
    }));
    exportToExcel(data, 'Interventions_ClimTrack', 'Interventions');
    addToast({ type: 'success', title: 'Exportation réussie', message: 'Fichier Excel téléchargé.' });
  };

  return (
    <div id="interventions-page" className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-amber-600" />
            <span>Journal des Interventions Techniques</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Historique des tâches, poses, entretiens, contrats et dépannages effectués
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-export-inter-excel"
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exporter Excel</span>
          </button>
          <button
            id="btn-add-inter-main"
            onClick={() => {
              setInterToEdit(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une intervention</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par client, technicien, type d'intervention, tâche..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={filterStatut}
              onChange={e => setFilterStatut(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-slate-700"
            >
              <option value="all">Tous les Statuts</option>
              <option value="Planifiée">Planifiée</option>
              <option value="En cours">En cours</option>
              <option value="Terminée">Terminée</option>
              <option value="Annulée">Annulée</option>
            </select>
          </div>

          <div>
            <select
              value={filterTech}
              onChange={e => setFilterTech(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-slate-700"
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
            Chargement des interventions...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <p className="text-sm font-semibold text-slate-600">Aucune intervention enregistrée</p>
            <p className="text-xs">Modifiez les filtres ou enregistrez une nouvelle intervention.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="table-interventions" className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th className="p-3.5 whitespace-nowrap">Date</th>
                  <th className="p-3.5 whitespace-nowrap">Client</th>
                  <th className="p-3.5 whitespace-nowrap">Technicien</th>
                  <th className="p-3.5 whitespace-nowrap">Type d'intervention</th>
                  <th className="p-3.5 whitespace-nowrap">Description de la Tâche</th>
                  <th className="p-3.5 whitespace-nowrap">Statut</th>
                  <th className="p-3.5 text-right whitespace-nowrap">Coût</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.map(inter => (
                  <tr
                    key={inter.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="p-3.5 font-medium text-slate-700 whitespace-nowrap">
                      {formatDate(inter.date)}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedClientId(inter.clientid);
                          setActiveTab('clients');
                        }}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left whitespace-nowrap"
                      >
                        {inter.clientnom}
                      </button>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedTechnicienId(inter.technicienid);
                          setActiveTab('techniciens');
                        }}
                        className="font-medium text-slate-800 hover:text-indigo-600 transition-colors text-left whitespace-nowrap"
                      >
                        {inter.techniciennom}
                      </button>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800 whitespace-nowrap">
                      {inter.typeintervention}
                    </td>
                    <td className="p-3.5 max-w-sm whitespace-nowrap truncate">
                      <span className="text-slate-800 font-medium">{inter.descriptiontache}</span>
                      {inter.observation && (
                        <span className="text-[11px] text-slate-400 ml-2">
                          ({inter.observation})
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <div className="relative inline-flex items-center group/statut">
                        <select
                          id={`select-inter-statut-${inter.id}`}
                          value={inter.statut}
                          disabled={updatingStatutId === inter.id}
                          onChange={e => handleQuickStatusChange(inter.id, e.target.value as InterventionStatut)}
                          className={`appearance-none pl-2.5 pr-6 py-1 text-[11px] font-bold rounded-full border shadow-2xs cursor-pointer transition-all hover:brightness-95 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${getStatusBadgeClass(inter.statut)}`}
                          title="Cliquer pour changer le statut directement"
                        >
                          <option value="Planifiée" className="bg-white text-slate-800">Planifiée</option>
                          <option value="En cours" className="bg-white text-slate-800">En cours</option>
                          <option value="Terminée" className="bg-white text-slate-800">Terminée</option>
                          <option value="Annulée" className="bg-white text-slate-800">Annulée</option>
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60 group-hover/statut:opacity-100 transition-opacity" />
                      </div>
                    </td>
                    <td className="p-3.5 text-right font-medium text-slate-900 whitespace-nowrap">
                      {inter.cout ? formatCurrency(inter.cout, settings.devise) : '-'}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            // Since there's no detail modal for interventions yet, 
                            // we can open the edit form or a toast with info
                            setInterToEdit(inter);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setInterToEdit(inter);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setInterToDelete(inter.id)}
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
      <InterventionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        interventionToEdit={interToEdit}
        onSaved={triggerRefresh}
      />

      <ConfirmDialog
        isOpen={!!interToDelete}
        onClose={() => setInterToDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer cette intervention ?"
        message="Cette action supprimera l'intervention de l'historique."
        confirmLabel="Oui, supprimer"
      />
    </div>
  );
};
