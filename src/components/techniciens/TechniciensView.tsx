import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Technicien } from '../../types';
import { formatCurrency, getStatusBadgeClass } from '../../utils/formatters';
import { exportToExcel } from '../../utils/exportUtils';
import { TechnicienFormModal } from './TechnicienFormModal';
import { TechnicienDetailModal } from './TechnicienDetailModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Pagination } from '../common/Pagination';
import {
  Wrench,
  Plus,
  Search,
  Download,
  Phone,
  MapPin,
  Users,
  Airplay,
  DollarSign,
  Eye,
  Edit2,
  Trash2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const TechniciensView: React.FC = () => {
  const {
    settings,
    refreshKey,
    triggerRefresh,
    selectedTechnicienId,
    setSelectedTechnicienId,
    addToast,
  } = useApp();
  const { isAdmin } = useAuth();

  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12); // Grid looks better with 12 (3x4 or 4x3)

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [techToEdit, setTechToEdit] = useState<Technicien | null>(null);
  const [techToDelete, setTechToDelete] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getTechniciens();
      setTechniciens(data);
    } catch (err) {
      console.error('Failed to load technicians:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatut]);

  const filteredTechs = techniciens.filter(t => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      t.nom.toLowerCase().includes(term) ||
      t.prenom.toLowerCase().includes(term) ||
      t.telephone.toLowerCase().includes(term) ||
      t.matricule.toLowerCase().includes(term) ||
      t.zone.toLowerCase().includes(term);

    const matchesStatut = filterStatut === 'all' || t.statut === filterStatut;
    return matchesSearch && matchesStatut;
  });

  const totalPages = Math.ceil(filteredTechs.length / itemsPerPage);
  const paginatedData = filteredTechs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteTechnicien = async () => {
    if (!techToDelete) return;
    try {
      await api.deleteTechnicien(techToDelete);
      addToast({
        type: 'success',
        title: 'Technicien supprimé',
        message: 'Le technicien a été retiré de la base.',
      });
      triggerRefresh();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.message || 'Impossible de supprimer ce technicien.',
      });
    } finally {
      setTechToDelete(null);
    }
  };

  const handleExportExcel = () => {
    const data = filteredTechs.map(t => ({
      'Matricule': t.matricule,
      'Prénom': t.prenom,
      'Nom': t.nom,
      'Téléphone': t.telephone,
      'Zone': t.zone,
      'Statut': t.statut,
      'Clients Visités': t.totalClientsVisites || 0,
      'Climatiseurs Installés': t.totalClimatiseursInstalles || 0,
      'Interventions': t.totalInterventions || 0,
      'Total Encaissé (DH)': t.montantTotalEncaisse || 0,
      'Observation': t.observation || '',
    }));
    exportToExcel(data, 'Liste_Techniciens_ClimTrack', 'Techniciens');
    addToast({ type: 'success', title: 'Exportation réussie', message: 'Fichier Excel téléchargé.' });
  };

  return (
    <div id="techniciens-page" className="space-y-5 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-indigo-600" />
            <span>Gestion des Techniciens & Équipes</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi individuel, fiches de performance, installations réalisées et encaissements
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-export-techs-excel"
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exporter Excel</span>
          </button>
          <button
            id="btn-add-tech-main"
            onClick={() => {
              setTechToEdit(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un technicien</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-techs"
            type="text"
            placeholder="Rechercher un technicien (nom, matricule, téléphone, zone)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-700"
          >
            <option value="all">Tous les Statuts</option>
            <option value="Actif">Actif</option>
            <option value="En mission">En mission</option>
            <option value="En congé">En congé</option>
            <option value="Inactif">Inactif</option>
          </select>
        </div>
      </div>

      {/* Technicians Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Chargement des techniciens...
        </div>
      ) : filteredTechs.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-2">
          <p className="text-sm font-semibold text-slate-600">Aucun technicien trouvé</p>
          <p className="text-xs">Modifiez la recherche ou ajoutez un nouveau technicien.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedData.map(tech => (
              <div
                key={tech.id}
                id={`card-tech-${tech.id}`}
                onClick={() => setSelectedTechnicienId(tech.id)}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Header of Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                        {tech.prenom[0]}
                        {tech.nom[0]}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {tech.prenom} {tech.nom}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-400 font-medium">{tech.matricule}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ring-1 ring-inset ${getStatusBadgeClass(tech.statut)}`}>
                      {tech.statut}
                    </span>
                  </div>

                  {/* Contact & Zone */}
                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{tech.telephone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{tech.zone || 'Casablanca'}</span>
                    </div>
                  </div>

                  {/* 3 Calculated KPI boxes */}
                  <div className="grid grid-cols-3 gap-2 text-center mt-4 pt-3 border-t border-slate-100 bg-slate-50/70 p-2.5 rounded-xl">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-medium">Clients</div>
                      <div className="text-sm font-bold text-slate-800">{tech.totalClientsVisites || 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-medium">Clims</div>
                      <div className="text-sm font-bold text-indigo-600">{tech.totalClimatiseursInstalles || 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-medium">Encaissé</div>
                      <div className="text-xs font-bold text-emerald-700 truncate">
                        {formatCurrency(tech.montantTotalEncaisse || 0, settings.devise)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer actions */}
                <div
                  className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => setSelectedTechnicienId(tech.id)}
                    className="font-semibold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1"
                  >
                    <span>Fiche détaillée</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setTechToEdit(tech);
                        setIsFormOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setTechToDelete(tech.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={filteredTechs.length}
            />
          </div>
        </>
      )}

      {/* Form Modal */}
      <TechnicienFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        technicienToEdit={techToEdit}
        onSaved={triggerRefresh}
      />

      {/* Detail Modal */}
      <TechnicienDetailModal
        technicienid={selectedTechnicienId}
        onClose={() => setSelectedTechnicienId(null)}
        onEdit={tech => {
          setTechToEdit(tech);
          setIsFormOpen(true);
        }}
        onDelete={id => setTechToDelete(id)}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!techToDelete}
        onClose={() => setTechToDelete(null)}
        onConfirm={handleDeleteTechnicien}
        title="Supprimer ce technicien ?"
        message="Êtes-vous certain de vouloir supprimer ce technicien ? Ses historiques d'interventions resteront archivés."
        confirmLabel="Oui, supprimer"
      />
    </div>
  );
};
