import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ClientFullDetails } from '../../types';
import { Modal } from '../common/Modal';
import { ReglerSoldeModal } from '../common/ReglerSoldeModal';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/formatters';
import { exportClientPDF } from '../../utils/exportUtils';
import {
  User,
  Phone,
  MapPin,
  FileCheck2,
  Receipt,
  Download,
  CreditCard,
  Plus,
  Wrench,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
  Users,
  Airplay,
  Clock,
} from 'lucide-react';

interface ClientDetailModalProps {
  clientid: string | null;
  onClose: () => void;
  onEdit: (client: any) => void;
  onDelete: (clientid: string) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  clientid,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { settings, refreshKey, triggerRefresh, addToast } = useApp();
  const { isAdmin } = useAuth();
  const [details, setDetails] = useState<ClientFullDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);

  useEffect(() => {
    if (clientid) {
      setLoading(true);
      api.getClientFullDetails(clientid)
        .then(res => setDetails(res))
        .catch(err => {
          console.error('Failed to load client details:', err);
          addToast({ type: 'error', title: 'Erreur', message: 'Client introuvable.' });
          onClose();
        })
        .finally(() => setLoading(false));
    }
  }, [clientid, refreshKey]);

  if (!clientid || !details) return null;

  const { client, installations, interventions, paiements, totalFacture, totalPaye, soldeRestant } = details;

  // Compute total climatiseurs installed count
  const totalClimatiseursCount = installations.reduce((acc, curr) => acc + (Number(curr.quantite) || 1), 0);

  // Compute all unique techniciens who have worked with or visited this client
  const technicienVisitsMap = new Map<string, { count: number; roles: Set<string> }>();

  installations.forEach(inst => {
    if (inst.techniciennom) {
      const existing = technicienVisitsMap.get(inst.techniciennom) || { count: 0, roles: new Set<string>() };
      existing.count += 1;
      existing.roles.add('Installation');
      technicienVisitsMap.set(inst.techniciennom, existing);
    }
  });

  interventions.forEach(inter => {
    if (inter.techniciennom) {
      const existing = technicienVisitsMap.get(inter.techniciennom) || { count: 0, roles: new Set<string>() };
      existing.count += 1;
      existing.roles.add(inter.typeintervention || 'Intervention');
      technicienVisitsMap.set(inter.techniciennom, existing);
    }
  });

  paiements.forEach(p => {
    if (p.techniciennom) {
      const existing = technicienVisitsMap.get(p.techniciennom) || { count: 0, roles: new Set<string>() };
      existing.roles.add('Encaissement');
      technicienVisitsMap.set(p.techniciennom, existing);
    }
  });

  const uniqueTechniciens = Array.from(technicienVisitsMap.entries()).map(([nom, data]) => ({
    nom,
    missions: data.count,
    roles: Array.from(data.roles),
  }));

  const handleExportPDF = () => {
    try {
      exportClientPDF(details, settings);
      addToast({ type: 'success', title: 'PDF Généré', message: 'La fiche de synthèse du client a été téléchargée.' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Erreur Export', message: err.message || 'Impossible d’exporter le PDF.' });
    }
  };

  return (
    <Modal
      isOpen={!!clientid}
      onClose={onClose}
      title={
        client.typeclient === 'Grande Surface'
          ? `Fiche Société : ${client.nom}`
          : `Fiche Client : ${client.nom} ${client.kinya ? `(${client.kinya})` : ''}`
      }
      subtitle="Synthèse globale : total encaissements, climatiseurs installés et techniciens intervenus"
      maxWidth="5xl"
      id="client-detail-modal"
    >
      <div className="space-y-6">
        {/* Header Bar: Coordonnées & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
              <User className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                {client.nom}
                {client.typeclient === 'Grande Surface' ? (
                  <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 rounded text-[9px] font-extrabold uppercase">
                    G.S
                  </span>
                ) : (
                  client.kinya ? ` (${client.kinya})` : ''
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <a href={`tel:${client.telephone}`} className="text-blue-600 font-semibold hover:underline">
                {client.telephone}
              </a>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{client.quartiernom} {client.adresse ? `• ${client.adresse}` : ''}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exporter PDF</span>
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    onEdit(client);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => {
                    onDelete(client.id);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* TOP SYNTHESIS KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Encaissé / Réglé */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900 to-slate-900 text-white shadow-xs border border-emerald-800/40 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Total Encaissé</span>
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-full font-bold">
                {paiements.length} règlement(s)
              </span>
            </div>
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {formatCurrency(totalPaye, settings.devise)}
            </div>
            <div className="mt-2 pt-2 border-t border-emerald-800/60 flex items-center justify-between text-[11px] text-slate-300">
              <span>Facturé : {formatCurrency(totalFacture, settings.devise)}</span>
              {soldeRestant > 0 ? (
                <span className="text-amber-300 font-bold">Reste : {formatCurrency(soldeRestant, settings.devise)}</span>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Soldé
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Climatiseurs Installés */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span className="flex items-center gap-1.5">
                <Airplay className="w-4 h-4 text-blue-600" />
                <span>Climatiseurs Installés</span>
              </span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded-full font-bold">
                {installations.length} fiche(s)
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {totalClimatiseursCount} <span className="text-xs font-medium text-slate-500">appareil(s)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 truncate">
              {installations.length > 0
                ? installations.map(i => `${i.marque} ${i.puissance}`).slice(0, 2).join(', ')
                : 'Aucun appareil enregistré'}
            </p>
          </div>

          {/* Card 3: Techniciens Intervenus */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Techniciens Intervenus</span>
              </span>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded-full font-bold">
                {uniqueTechniciens.length} technicien(s)
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {uniqueTechniciens.length} <span className="text-xs font-medium text-slate-500">intervenant(s)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 truncate">
              {uniqueTechniciens.length > 0
                ? uniqueTechniciens.map(t => t.nom).join(', ')
                : 'Aucun technicien assigné'}
            </p>
          </div>

          {/* Card 4: Interventions & Dépannages */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span className="flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>Interventions / SAV</span>
              </span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] rounded-full font-bold">
                {interventions.length} passage(s)
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {interventions.length} <span className="text-xs font-medium text-slate-500">intervention(s)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 truncate">
              {interventions.length > 0
                ? `${interventions.filter(i => i.statut === 'Terminée').length} terminée(s)`
                : 'Aucun SAV pour le moment'}
            </p>
          </div>
        </div>

        {/* Restant à payer Banner if solde > 0 */}
        {soldeRestant > 0 && (
          <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Il reste un solde impayé de <strong className="font-bold text-amber-950 text-sm">{formatCurrency(soldeRestant, settings.devise)}</strong> sur le dossier de ce client.
              </span>
            </div>
            <button
              id="btn-detail-regler-solde"
              type="button"
              onClick={() => setIsSettleOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Encaisser le solde restant</span>
            </button>
          </div>
        )}

        {/* Section: Techniciens ayant intervenu chez ce client */}
        {uniqueTechniciens.length > 0 && (
          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Techniciens qui sont passés chez ce client ({uniqueTechniciens.length})</span>
            </h4>
            <div className="flex flex-wrap gap-2.5">
              {uniqueTechniciens.map((tech, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                    {tech.nom.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{tech.nom}</div>
                    <div className="text-[10px] text-slate-500">
                      {tech.roles.join(', ')} {tech.missions > 0 ? `(${tech.missions} mission${tech.missions > 1 ? 's' : ''})` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Climatiseurs & Installations */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Airplay className="w-4 h-4 text-blue-600" />
              <span>Climatiseurs installés chez ce client ({installations.length})</span>
            </h4>
          </div>
          {installations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
              Aucun climatiseur enregistré pour ce client.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3 whitespace-nowrap">Climatiseur & Puissance</th>
                    <th className="p-3 whitespace-nowrap">Type</th>
                    <th className="p-3 whitespace-nowrap text-center">Qté</th>
                    <th className="p-3 whitespace-nowrap">N° Bon / Contrôle</th>
                    <th className="p-3 whitespace-nowrap">Technicien</th>
                    <th className="p-3 whitespace-nowrap">Date Installation</th>
                    <th className="p-3 whitespace-nowrap text-right">Prix</th>
                    <th className="p-3 whitespace-nowrap text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {installations.map(inst => (
                    <tr key={inst.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                        {inst.marque} <span className="font-semibold text-slate-600">{inst.puissance}</span>
                      </td>
                      <td className="p-3 text-slate-600 whitespace-nowrap">{inst.typeclimatiseur}</td>
                      <td className="p-3 text-center font-bold text-slate-800 whitespace-nowrap">{inst.quantite}</td>
                      <td className="p-3 font-mono text-[11px] whitespace-nowrap">
                        <div className="text-indigo-600 font-bold">{inst.numerobon ? `Bon: ${inst.numerobon}` : '-'}</div>
                        <div className="text-emerald-600">{inst.numerocontrole ? `Ctrl: ${inst.numerocontrole}` : '-'}</div>
                      </td>
                      <td className="p-3 font-medium text-slate-800 whitespace-nowrap">
                        {inst.techniciennom || <span className="text-slate-400 italic">Non affecté</span>}
                      </td>
                      <td className="p-3 text-slate-600 whitespace-nowrap">{formatDate(inst.dateinstallation)}</td>
                      <td className="p-3 font-bold text-slate-900 text-right whitespace-nowrap">
                        {formatCurrency(inst.prix, settings.devise)}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadgeClass(inst.statut)}`}>
                          {inst.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section: Historique des Paiements & Règlements */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Historique des Paiements & Règlements ({paiements.length})</span>
            </h4>
            {soldeRestant > 0 && (
              <button
                id="btn-add-reglement-detail"
                type="button"
                onClick={() => setIsSettleOpen(true)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un règlement</span>
              </button>
            )}
          </div>
          {paiements.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
              Aucun paiement enregistré pour l'instant.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3 whitespace-nowrap">Date de Paiement</th>
                    <th className="p-3 whitespace-nowrap">N° Bon</th>
                    <th className="p-3 whitespace-nowrap text-right">Montant Encaissé</th>
                    <th className="p-3 whitespace-nowrap">Mode de Paiement</th>
                    <th className="p-3 whitespace-nowrap">Encaissé par (Technicien)</th>
                    <th className="p-3 whitespace-nowrap">Observation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paiements.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-medium text-slate-700 whitespace-nowrap">{formatDate(p.date)}</td>
                      <td className="p-3 font-mono text-slate-600 whitespace-nowrap">{p.numerobon || '-'}</td>
                      <td className="p-3 font-bold text-emerald-600 text-right whitespace-nowrap">
                        {formatCurrency(p.montant, settings.devise)}
                      </td>
                      <td className="p-3 font-medium text-slate-700 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md font-medium text-slate-700">
                          {p.modepaiement}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-800 whitespace-nowrap">
                        {p.techniciennom || <span className="text-slate-400 italic">Caisse Centrale</span>}
                      </td>
                      <td className="p-3 text-slate-500 whitespace-nowrap">{p.observation || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section: Interventions & SAV */}
        {interventions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>Historique des Interventions & Dépannages ({interventions.length})</span>
            </h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3 whitespace-nowrap">Date</th>
                    <th className="p-3 whitespace-nowrap">Type d'Intervention</th>
                    <th className="p-3 whitespace-nowrap">Description de la Tâche</th>
                    <th className="p-3 whitespace-nowrap">Technicien</th>
                    <th className="p-3 whitespace-nowrap text-center">Statut</th>
                    <th className="p-3 whitespace-nowrap">Observation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {interventions.map(inter => (
                    <tr key={inter.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-medium text-slate-700 whitespace-nowrap">{formatDate(inter.date)}</td>
                      <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">{inter.typeintervention}</td>
                      <td className="p-3 max-w-xs truncate">{inter.descriptiontache}</td>
                      <td className="p-3 font-medium text-slate-800 whitespace-nowrap">{inter.techniciennom || '-'}</td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadgeClass(inter.statut)}`}>
                          {inter.statut}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 whitespace-nowrap">{inter.observation || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Observation box */}
        {client.observation && (
          <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-900">
            <strong className="font-semibold">Remarques Client : </strong>
            {client.observation}
          </div>
        )}
      </div>

      {/* Quick Settlement Modal */}
      <ReglerSoldeModal
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        target={
          client
            ? {
                type: 'client',
                id: client.id,
                nom: client.nom,
                kinya: client.kinya,
                numerobon: client.numerobon,
                numerocontrole: client.numerocontrole,
                totalFacture,
                totalPaye,
                soldeRestant,
                technicienid: client.technicienid,
              }
            : null
        }
        onSuccess={triggerRefresh}
      />
    </Modal>
  );
};

