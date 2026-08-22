import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Installation } from '../../types';
import { Modal } from '../common/Modal';
import { ReglerSoldeModal } from '../common/ReglerSoldeModal';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/formatters';
import { exportInstallationBonPDF } from '../../utils/exportUtils';
import {
  Airplay,
  User,
  Wrench,
  FileCheck2,
  Receipt,
  Download,
  Calendar,
  ShieldCheck,
  Edit2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface InstallationDetailModalProps {
  installationid: string | null;
  onClose: () => void;
  onEdit: (inst: Installation) => void;
  onDelete: (id: string) => void;
}

export const InstallationDetailModal: React.FC<InstallationDetailModalProps> = ({
  installationid,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { settings, refreshKey, triggerRefresh, setSelectedClientId, setSelectedTechnicienId, setActiveTab, addToast } = useApp();
  const { isAdmin } = useAuth();
  const [installation, setInstallation] = useState<Installation | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);

  useEffect(() => {
    if (installationid) {
      setLoading(true);
      api.getInstallation(installationid)
        .then(res => setInstallation(res))
        .catch(err => {
          console.error(err);
          addToast({ type: 'error', title: 'Erreur', message: 'Installation introuvable.' });
          onClose();
        })
        .finally(() => setLoading(false));
    }
  }, [installationid, refreshKey]);

  if (!installationid || !installation) return null;

  const solde = Math.max(0, installation.prix - (installation.montantpaye || 0));

  const handleExportPDF = () => {
    try {
      exportInstallationBonPDF(installation, settings);
      addToast({ type: 'success', title: 'Bon d’installation exporté', message: 'Fiche imprimable générée en PDF.' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Erreur Export', message: err.message || 'Impossible d’exporter le bon.' });
    }
  };

  return (
    <Modal
      isOpen={!!installationid}
      onClose={onClose}
      title={`Fiche Installation : Bon N° ${installation.numerobon}`}
      subtitle={`Dossier technique de climatisation et validation du chantier`}
      maxWidth="3xl"
      id="installation-detail-modal"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ring-1 ring-inset ${getStatusBadgeClass(installation.statut)}`}>
              {installation.statut}
            </span>
            <span className="text-xs font-mono text-slate-500">
              Contrôle: <strong className="text-emerald-700 font-bold">{installation.numerocontrole}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Imprimer Bon (PDF)</span>
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    onEdit(installation);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => {
                    onDelete(installation.id);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Client box */}
          <div
            onClick={() => {
              setSelectedClientId(installation.clientid);
              onClose();
              setActiveTab('clients');
            }}
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
              <span className="flex items-center gap-1.5 text-blue-600">
                <User className="w-4 h-4" /> Client
              </span>
              <span className="text-blue-600 group-hover:underline">Voir fiche →</span>
            </div>
            <p className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
              {installation.clientnom} {installation.clientkinya && installation.clientkinya !== installation.clientnom ? `(${installation.clientkinya})` : ''}
              {installation.typeclient === 'Grande Surface' && (
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 rounded text-[9px] font-extrabold uppercase">
                  G.S
                </span>
              )}
            </p>
            <div className="text-xs text-slate-500 space-y-0.5">
              <div>Tél: {installation.clienttelephone}</div>
              <div>Quartier: {installation.clientquartier}</div>
            </div>
          </div>

          {/* Technicien box */}
          <div
            onClick={() => {
              setSelectedTechnicienId(installation.technicienid);
              onClose();
              setActiveTab('techniciens');
            }}
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
              <span className="flex items-center gap-1.5 text-indigo-600">
                <Wrench className="w-4 h-4" /> Technicien Poseur
              </span>
              <span className="text-indigo-600 group-hover:underline">Voir fiche →</span>
            </div>
            <p className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {installation.techniciennom}
            </p>
            <div className="text-xs text-slate-500 space-y-0.5">
              <div>Matricule: {installation.technicienmatricule}</div>
              <div>Date d'intervention: {formatDate(installation.dateinstallation)}</div>
            </div>
          </div>
        </div>

        {/* AC Details Card */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
          <div className="font-bold text-sm text-slate-900 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Airplay className="w-4 h-4 text-emerald-600" />
              <span>Caractéristiques du Climatiseur</span>
            </div>
            {installation.typeclient === 'Grande Surface' && (
              <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-[10px] font-bold">
                SERVICE DE POSE (G.S)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400">Type:</span>
              <p className="font-semibold text-slate-800">{installation.typeclimatiseur}</p>
            </div>
            <div>
              <span className="text-slate-400">Marque:</span>
              <p className="font-semibold text-slate-800">{installation.marque}</p>
            </div>
            <div>
              <span className="text-slate-400">Puissance:</span>
              <p className="font-semibold text-slate-800">{installation.puissance}</p>
            </div>
            <div>
              <span className="text-slate-400">Quantité d'unités:</span>
              <p className="font-bold text-slate-900 text-sm">{installation.quantite}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400">Modèle / Réf:</span>
              <p className="font-medium text-slate-800">{installation.modele || '-'}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400">N° de Série:</span>
              <p className="font-mono text-slate-800">{installation.numeroSerie || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Task & Financials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-blue-600" />
              <span>Tâche Réalisée</span>
            </div>
            <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg">
              {installation.tacherealisee || 'Installation standard et mise en service'}
            </p>
            {installation.observation && (
              <div className="mt-2 text-slate-600">
                <strong className="text-slate-800">Observation: </strong>
                {installation.observation}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-900 text-white space-y-3 text-xs">
            <div className="font-bold text-emerald-400 flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              <span>Montants & Règlements</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Prix convenu:</span>
              <span className="font-bold text-sm">{formatCurrency(installation.prix, settings.devise)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Montant payé:</span>
              <span className="font-bold text-sm text-emerald-400">
                {formatCurrency(installation.montantpaye || 0, settings.devise)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-slate-300 font-semibold">Solde:</span>
              <span className={`font-bold text-base ${solde > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                {formatCurrency(solde, settings.devise)}
              </span>
            </div>
            {solde > 0 ? (
              <button
                id="btn-inst-detail-regler-solde"
                type="button"
                onClick={() => setIsSettleOpen(true)}
                className="w-full mt-2 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Régler le solde ({formatCurrency(solde, settings.devise)})</span>
              </button>
            ) : (
              <div className="text-[11px] text-emerald-400 font-bold flex items-center justify-center gap-1 mt-2 py-1 bg-emerald-950/60 rounded-lg border border-emerald-800/60">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Installation soldée (0 DH restant)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Settlement Modal */}
      <ReglerSoldeModal
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        target={
          installation
            ? {
                type: 'installation',
                id: installation.id,
                nom: installation.clientnom,
                kinya: installation.clientkinya,
                numerobon: installation.numerobon,
                numerocontrole: installation.numerocontrole,
                totalFacture: installation.prix || 0,
                totalPaye: installation.montantpaye || 0,
                soldeRestant: solde,
                technicienid: installation.technicienid,
              }
            : null
        }
        onSuccess={triggerRefresh}
      />
    </Modal>
  );
};
