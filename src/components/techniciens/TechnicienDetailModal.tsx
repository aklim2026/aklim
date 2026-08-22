import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { TechnicienStats } from '../../types';
import { Modal } from '../common/Modal';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/formatters';
import { exportTechnicienPDF, exportToExcel } from '../../utils/exportUtils';
import {
  Wrench,
  Users,
  Airplay,
  FileCheck2,
  DollarSign,
  MapPin,
  Phone,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Edit2,
  Trash2,
} from 'lucide-react';

interface TechnicienDetailModalProps {
  technicienid: string | null;
  onClose: () => void;
  onEdit: (tech: any) => void;
  onDelete: (techId: string) => void;
}

export const TechnicienDetailModal: React.FC<TechnicienDetailModalProps> = ({
  technicienid,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { settings, refreshKey, setSelectedClientId, setActiveTab, addToast } = useApp();
  const { isAdmin } = useAuth();

  const [stats, setStats] = useState<TechnicienStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters within technician file
  const [filterQuartier, setFilterQuartier] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTable, setSearchTable] = useState('');

  useEffect(() => {
    if (technicienid) {
      setLoading(true);
      api.getTechnicienStats(technicienid)
        .then(res => setStats(res))
        .catch(err => {
          console.error('Failed to load technician stats:', err);
          addToast({ type: 'error', title: 'Erreur', message: 'Technicien introuvable.' });
          onClose();
        })
        .finally(() => setLoading(false));
    }
  }, [technicienid, refreshKey]);

  if (!technicienid || !stats) return null;

  const { technicien } = stats;

  // Build combined detailed table rows (Installations & Interventions & Payments linked to this tech)
  const detailedRows = stats.installations.map(inst => {
    // find related payment if exists
    const relatedPay = stats.paiements.find(p => p.installationid === inst.id || p.numerobon === inst.numerobon);
    const relatedInter = stats.interventions.find(i => i.installationid === inst.id || i.clientid === inst.clientid);

    return {
      id: inst.id,
      date: inst.dateinstallation,
      clientid: inst.clientid,
      clientnom: inst.clientnom || '',
      clientkinya: inst.clientkinya || '',
      telephone: inst.clienttelephone || '',
      quartier: inst.clientquartier || '',
      climatiseur: `${inst.marque} ${inst.puissance} (x${inst.quantite})`,
      typeclimatiseur: inst.typeclimatiseur,
      numerobon: inst.numerobon,
      numerocontrole: inst.numerocontrole,
      montant: inst.prix,
      montantpaye: inst.montantpaye || relatedPay?.montant || 0,
      tache: inst.tacherealisee || relatedInter?.descriptiontache || 'Installation standard',
      typeintervention: relatedInter?.typeintervention || 'Installation',
      statut: inst.statut,
      observation: inst.observation || '',
    };
  });

  // Apply filters on the detailed table
  const filteredRows = detailedRows.filter(row => {
    const term = searchTable.toLowerCase().trim();
    const matchesSearch =
      !term ||
      row.clientnom.toLowerCase().includes(term) ||
      row.telephone.toLowerCase().includes(term) ||
      row.quartier.toLowerCase().includes(term) ||
      row.climatiseur.toLowerCase().includes(term) ||
      row.numerobon.toLowerCase().includes(term) ||
      row.tache.toLowerCase().includes(term);

    const matchesQuartier = filterQuartier === 'all' || row.quartier === filterQuartier;
    const matchesClient = filterClient === 'all' || row.clientid === filterClient;
    const matchesType = filterType === 'all' || row.typeintervention === filterType;

    return matchesSearch && matchesQuartier && matchesClient && matchesType;
  });

  const handleExportPDF = () => {
    try {
      exportTechnicienPDF(stats, settings);
      addToast({
        type: 'success',
        title: 'PDF Généré',
        message: `Fiche de ${technicien.prenom} ${technicien.nom} téléchargée.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.message || 'Échec de la génération PDF.',
      });
    }
  };

  const handleExportExcel = () => {
    const data = filteredRows.map(r => ({
      'Date': formatDate(r.date),
      'Client': `${r.clientnom} (${r.clientkinya})`,
      'Téléphone': r.telephone,
      'Quartier': r.quartier,
      'Climatiseur': r.climatiseur,
      'N° de Bon': r.numerobon,
      'N° de Contrôle': r.numerocontrole,
      'Montant Facturé (DH)': r.montant,
      'Montant Encaissé (DH)': r.montantpaye,
      'Tâche Réalisée': r.tache,
      'Statut': r.statut,
      'Observation': r.observation,
    }));
    exportToExcel(data, `Fiche_Technicien_${technicien.nom}_${technicien.matricule}`, 'Historique');
    addToast({
      type: 'success',
      title: 'Excel Généré',
      message: 'Fichier Excel téléchargé.',
    });
  };

  return (
    <Modal
      isOpen={!!technicienid}
      onClose={onClose}
      title={`Fiche Technicien : ${technicien.prenom} ${technicien.nom}`}
      subtitle={`Matricule: ${technicien.matricule} | Zone: ${technicien.zone} | Statut: ${technicien.statut}`}
      maxWidth="6xl"
      id="technicien-detail-modal"
    >
      <div className="space-y-6">
        {/* Top Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ring-1 ring-inset ${getStatusBadgeClass(technicien.statut)}`}>
              {technicien.statut}
            </span>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {technicien.telephone}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-export-tech-pdf"
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exporter PDF</span>
            </button>
            <button
              id="btn-export-tech-excel"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exporter Excel</span>
            </button>
            <button
              onClick={() => {
                onEdit(technicien);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Modifier</span>
            </button>
            <button
              onClick={() => {
                onDelete(technicien.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer</span>
            </button>
          </div>
        </div>

        {/* 4 Large KPI Stats Cards Calculated Automatically */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/80 shadow-xs">
            <div className="flex items-center justify-between text-blue-700 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Clients Visités</span>
              <Users className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-blue-950">
              {stats.totalClientsVisites}
            </div>
            <p className="text-[11px] text-blue-600/80 mt-0.5">Clients uniques enregistrés</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/80 shadow-xs">
            <div className="flex items-center justify-between text-indigo-700 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Clims Installés</span>
              <Airplay className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-indigo-950">
              {stats.totalClimatiseursInstalles}
            </div>
            <p className="text-[11px] text-indigo-600/80 mt-0.5">Unités totales posées</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/80 shadow-xs">
            <div className="flex items-center justify-between text-amber-700 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Interventions</span>
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-amber-950">
              {stats.totalInterventions}
            </div>
            <p className="text-[11px] text-amber-600/80 mt-0.5">Tâches & mises en service</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/80 shadow-xs">
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Montant Encaissé</span>
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="text-xl font-extrabold text-emerald-950 truncate">
              {formatCurrency(stats.montantTotalEncaisse, settings.devise)}
            </div>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">Total règlements reçus</p>
          </div>
        </div>

        {/* Neighborhoods & Observations summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Quartiers d'intervention visités ({stats.quartiersVisites.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {stats.quartiersVisites.length > 0 ? (
                stats.quartiersVisites.map((q, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700"
                  >
                    {q}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic">Aucun quartier enregistré</span>
              )}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-indigo-600" />
              <span>Observation & Spécialités</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {technicien.observation || 'Aucune observation particulière.'}
            </p>
          </div>
        </div>

        {/* Detailed Table of all tasks, dates, clients, AC units, vouchers, prices */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Tableau Détaillé des Interventions & Installations</span>
              <span className="text-xs font-normal text-slate-500">
                ({filteredRows.length} entrée(s))
              </span>
            </h4>

            {/* Quick search input */}
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrer dans ce tableau..."
                value={searchTable}
                onChange={e => setSearchTable(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
            <table id="table-tech-details" className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Téléphone</th>
                  <th className="p-3">Quartier</th>
                  <th className="p-3">Climatiseur</th>
                  <th className="p-3">N° Bon</th>
                  <th className="p-3 text-right">Montant</th>
                  <th className="p-3">Tâche Réalisée</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Observation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      Aucune intervention correspondante trouvée pour ce technicien.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(row => (
                    <tr
                      key={row.id}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedClientId(row.clientid);
                        onClose();
                        setActiveTab('clients');
                      }}
                    >
                      <td className="p-3 font-medium text-slate-700 whitespace-nowrap">
                        {formatDate(row.date)}
                      </td>
                      <td className="p-3 font-bold text-slate-900 hover:text-blue-600 transition-colors">
                        {row.clientnom}
                        {row.clientkinya && (
                          <span className="block text-[10px] font-normal text-slate-400">
                            {row.clientkinya}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 font-medium whitespace-nowrap">{row.telephone}</td>
                      <td className="p-3 text-slate-700">{row.quartier}</td>
                      <td className="p-3 font-semibold text-slate-800">{row.climatiseur}</td>
                      <td className="p-3 font-mono text-indigo-600 font-semibold">{row.numerobon}</td>
                      <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(row.montant, settings.devise)}
                      </td>
                      <td className="p-3 max-w-xs truncate text-slate-700">{row.tache}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full border ring-1 ring-inset ${getStatusBadgeClass(row.statut)}`}>
                          {row.statut}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{row.observation || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
};
