import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Client, Quartier } from '../../types';
import { formatDate } from '../../utils/formatters';
import { exportToExcel } from '../../utils/exportUtils';
import { ClientFormModal } from './ClientFormModal';
import { ClientDetailModal } from './ClientDetailModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Pagination } from '../common/Pagination';
import {
  Users,
  Plus,
  Search,
  Download,
  Eye,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  X,
} from 'lucide-react';

export const ClientsView: React.FC = () => {
  const {
    settings,
    refreshKey,
    triggerRefresh,
    selectedClientId,
    setSelectedClientId,
    addToast,
  } = useApp();
  const { isAdmin } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterQuartier, setFilterQuartier] = useState('all');
  const [filterTypeClient, setFilterTypeClient] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cls, qrts] = await Promise.all([
        api.getClients(),
        api.getQuartiers(),
      ]);
      setClients(cls);
      setQuartiers(qrts);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterQuartier, filterTypeClient]);

  // Filter clients based purely on client attributes
  const filteredClients = clients.filter(c => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      c.nom.toLowerCase().includes(term) ||
      c.kinya.toLowerCase().includes(term) ||
      c.telephone.toLowerCase().includes(term) ||
      c.quartiernom.toLowerCase().includes(term) ||
      (c.adresse && c.adresse.toLowerCase().includes(term)) ||
      (c.observation && c.observation.toLowerCase().includes(term));

    const matchesQuartier =
      filterQuartier === 'all' || c.quartierid === filterQuartier || c.quartiernom === filterQuartier;

    const matchesType =
      filterTypeClient === 'all' || c.typeclient === filterTypeClient;

    return matchesSearch && matchesQuartier && matchesType;
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedData = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      await api.deleteClient(clientToDelete);
      addToast({
        type: 'success',
        title: 'Client supprimé',
        message: 'Le dossier client a été supprimé.',
      });
      triggerRefresh();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.message || 'Impossible de supprimer ce client.',
      });
    } finally {
      setClientToDelete(null);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredClients.map(c => ({
      'Nom': c.nom,
      'Prénom': c.kinya || '',
      'Téléphone': c.telephone,
      'Quartier': c.quartiernom,
      'Adresse': c.adresse || '',
      'Remarques / Observations': c.observation || '',
      'Date d\'enregistrement': formatDate(c.createdat),
    }));
    exportToExcel(dataToExport, 'Liste_Clients_ClimTrack', 'Clients');
    addToast({
      type: 'success',
      title: 'Exportation réussie',
      message: 'Fichier Excel téléchargé.',
    });
  };

  return (
    <div id="clients-page" className="space-y-5 animate-in fade-in duration-150">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Gestion des Clients</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Répertoire des coordonnées, numéros de téléphone, quartiers et adresses des clients
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-export-clients-excel"
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exporter Excel</span>
          </button>
          <button
            id="btn-add-client-main"
            onClick={() => {
              setClientToEdit(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un client</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Main Search Input */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-clients"
              type="text"
              placeholder="Rechercher par nom, téléphone, adresse..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quartier Filter */}
          <div>
            <select
              id="select-filter-quartier"
              value={filterQuartier}
              onChange={e => setFilterQuartier(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-700 cursor-pointer"
            >
              <option value="all">Tous les Quartiers</option>
              {quartiers.map(q => (
                <option key={q.id} value={q.id}>
                  {q.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterTypeClient}
              onChange={e => setFilterTypeClient(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-slate-700 cursor-pointer"
            >
              <option value="all">Toutes Catégories</option>
              <option value="Standard">Standard (Personnel)</option>
              <option value="Grande Surface">Grandes Surfaces</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Chargement des clients...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <p className="text-sm font-semibold text-slate-600">Aucun client trouvé</p>
            <p className="text-xs">Modifiez vos critères de recherche ou ajoutez un nouveau client.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="table-clients" className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th className="p-3.5 whitespace-nowrap">Nom & Prénom</th>
                  <th className="p-3.5 whitespace-nowrap">Téléphone</th>
                  <th className="p-3.5 whitespace-nowrap hidden sm:table-cell">Quartier</th>
                  <th className="p-3.5 whitespace-nowrap hidden lg:table-cell">Adresse complète</th>
                  <th className="p-3.5 whitespace-nowrap hidden xl:table-cell">Remarques / Observations</th>
                  <th className="p-3.5 text-right whitespace-nowrap hidden md:table-cell">Date d'enregistrement</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.map(client => {
                  return (
                    <tr
                      key={client.id}
                      id={`client-row-${client.id}`}
                      className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedClientId(client.id)}
                    >
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <div className="font-bold text-slate-900 text-[11px] sm:text-sm group-hover:text-blue-600 transition-colors whitespace-nowrap">
                            {client.nom}
                          </div>
                          {client.typeclient === 'Grande Surface' && (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 rounded text-[9px] font-extrabold uppercase">
                              G.S
                            </span>
                          )}
                        </div>
                        {client.kinya && client.kinya !== client.nom && (
                          <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap">
                            {client.typeclient === 'Grande Surface' ? `Resp: ${client.kinya}` : client.kinya}
                          </div>
                        )}
                        <div className="sm:hidden text-[10px] text-slate-400 mt-0.5">
                          {client.quartiernom}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium whitespace-nowrap">
                        <a
                          href={`tel:${client.telephone}`}
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-700 hover:underline whitespace-nowrap text-[11px] sm:text-xs"
                        >
                          <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{client.telephone}</span>
                        </a>
                      </td>
                      <td className="p-3.5 text-slate-600 whitespace-nowrap hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1.5 font-medium whitespace-nowrap">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{client.quartiernom}</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 whitespace-nowrap max-w-xs truncate hidden lg:table-cell" title={client.adresse || ''}>
                        {client.adresse ? (
                          <span>{client.adresse}</span>
                        ) : (
                          <span className="text-slate-400 italic">Non renseignée</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600 whitespace-nowrap max-w-xs truncate hidden xl:table-cell" title={client.observation || ''}>
                        {client.observation ? (
                          <span className="text-slate-600">{client.observation}</span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right text-slate-500 whitespace-nowrap hidden md:table-cell">
                        {formatDate(client.createdat || client.dateinstallation)}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`btn-view-client-${client.id}`}
                            onClick={() => setSelectedClientId(client.id)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Ouvrir la fiche complète"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-edit-client-${client.id}`}
                            onClick={() => {
                              setClientToEdit(client);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Modifier les coordonnées"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-delete-client-${client.id}`}
                            onClick={() => setClientToDelete(client.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer le client"
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
          totalItems={filteredClients.length}
        />
      </div>

      {/* Form Modal for Client Add / Edit */}
      <ClientFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        clientToEdit={clientToEdit}
        onSaved={triggerRefresh}
      />

      {/* Detail Modal for Selected Client */}
      <ClientDetailModal
        clientid={selectedClientId}
        onClose={() => setSelectedClientId(null)}
        onEdit={client => {
          setClientToEdit(client);
          setIsFormOpen(true);
        }}
        onDelete={id => setClientToDelete(id)}
      />

      {/* Confirmation Dialog before deleting */}
      <ConfirmDialog
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleDeleteClient}
        title="Supprimer ce client ?"
        message="Attention : cette action supprimera définitivement le client ainsi que toutes ses données associées."
        confirmLabel="Oui, supprimer définitivement"
      />
    </div>
  );
};
