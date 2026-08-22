import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Quartier } from '../../types';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Pagination } from '../common/Pagination';
import {
  MapPin,
  Plus,
  Search,
  Building2,
  Users,
  Airplay,
  Edit2,
  Trash2,
} from 'lucide-react';

export const QuartiersView: React.FC = () => {
  const { refreshKey, triggerRefresh, setActiveTab, addToast } = useApp();
  const { isAdmin } = useAuth();

  const [quartiers, setQuartiers] = useState<Quartier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Modal form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuartier, setEditingQuartier] = useState<Quartier | null>(null);
  const [nom, setNom] = useState('');
  const [ville, setVille] = useState('Casablanca');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getQuartiers();
      setQuartiers(data);
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
  }, [searchTerm]);

  const openCreateModal = () => {
    setEditingQuartier(null);
    setNom('');
    setVille('Casablanca');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (q: Quartier) => {
    setEditingQuartier(q);
    setNom(q.nom);
    setVille(q.ville);
    setDescription(q.description || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !ville) {
      addToast({ type: 'error', title: 'Erreur', message: 'Nom et ville sont requis.' });
      return;
    }

    setSaving(true);
    try {
      if (editingQuartier) {
        await api.updateQuartier(editingQuartier.id, { nom, ville, description });
        addToast({ type: 'success', title: 'Quartier modifié', message: 'Mise à jour réussie.' });
      } else {
        await api.createQuartier({ nom, ville, description });
        addToast({ type: 'success', title: 'Quartier ajouté', message: 'Nouveau quartier enregistré.' });
      }
      setIsModalOpen(false);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Erreur', message: err.message || 'Échec de l’enregistrement.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteQuartier(deleteId);
      addToast({ type: 'success', title: 'Quartier supprimé', message: 'Le quartier a été retiré.' });
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Erreur', message: err.message || 'Impossible de supprimer.' });
    } finally {
      setDeleteId(null);
    }
  };

  const filtered = quartiers.filter(
    q =>
      !searchTerm ||
      q.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.ville.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div id="quartiers-page" className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span>Gestion Géographique des Quartiers</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organisation des zones d'intervention et suivi de la densité des installations
          </p>
        </div>

        <button
          id="btn-add-quartier"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un quartier</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un quartier ou une ville..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Quartiers Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Chargement des quartiers...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          Aucun quartier trouvé.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedData.map(q => (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{q.nom}</h3>
                        <p className="text-xs text-slate-400 font-medium">{q.ville}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(q)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(q.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {(q as any).description && (
                    <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg">
                      {(q as any).description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-slate-400 text-[10px] block uppercase font-medium">Clients</span>
                    <span className="font-bold text-slate-800 text-sm">{q.nombreClients || 0}</span>
                  </div>
                  <div className="bg-emerald-50/60 p-2 rounded-xl">
                    <span className="text-emerald-600 text-[10px] block uppercase font-medium">Climatiseurs</span>
                    <span className="font-bold text-emerald-800 text-sm">{q.nombreInstallations || 0}</span>
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
              totalItems={filtered.length}
            />
          </div>
        </>
      )}

      {/* Modal Add / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingQuartier ? 'Modifier le Quartier' : 'Ajouter un Quartier'}
        subtitle="Définition du secteur géographique pour les affectations"
        maxWidth="md"
        id="quartier-form-modal"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nom du Quartier *</label>
            <input
              type="text"
              required
              placeholder="ex: Maârif, Anfa, Sidi Maarouf, Agdal..."
              value={nom}
              onChange={e => setNom(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Ville *</label>
            <input
              type="text"
              required
              placeholder="ex: Casablanca, Rabat, Marrakech..."
              value={ville}
              onChange={e => setVille(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description / Précisions</label>
            <textarea
              rows={2}
              placeholder="ex: Secteur Ouest, Immeubles récents et villas..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors"
            >
              {saving ? 'Enregistrement...' : editingQuartier ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Supprimer ce quartier ?"
        message="Êtes-vous certain de vouloir supprimer ce quartier ?"
        confirmLabel="Oui, supprimer"
      />
    </div>
  );
};
