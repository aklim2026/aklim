import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Technicien, ModePaiement } from '../../types';
import { Modal } from './Modal';
import { formatCurrency } from '../../utils/formatters';
import { CreditCard, CheckCircle2, ShieldAlert, Sparkles, User, Calendar, FileText } from 'lucide-react';

interface ReglerSoldeModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: {
    type: 'client' | 'installation';
    id: string;
    nom: string;
    kinya?: string;
    numerobon?: string;
    numerocontrole?: string;
    totalFacture: number;
    totalPaye: number;
    soldeRestant: number;
    technicienid?: string;
  } | null;
  onSuccess: () => void;
}

export const ReglerSoldeModal: React.FC<ReglerSoldeModalProps> = ({
  isOpen,
  onClose,
  target,
  onSuccess,
}) => {
  const { settings, addToast } = useApp();
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [montant, setMontant] = useState<number>(0);
  const [modepaiement, setModePaiement] = useState<ModePaiement>('Espèces');
  const [technicienid, setTechnicienId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [observation, setObservation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && target) {
      setMontant(target.soldeRestant);
      setDate(new Date().toISOString().split('T')[0]);
      setTechnicienId(target.technicienid || '');
      setModePaiement('Espèces');
      setObservation(`Règlement solde ${target.numerobon ? 'Bon ' + target.numerobon : ''}`.trim());

      api.getTechniciens()
        .then(techs => {
          setTechniciens(techs);
          if (!target.technicienid && techs.length > 0) {
            setTechnicienId(techs[0].id);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, target]);

  if (!isOpen || !target) return null;

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (montant <= 0) {
      addToast({
        type: 'error',
        title: 'Montant invalide',
        message: 'Le montant à régler doit être supérieur à 0.',
      });
      return;
    }

    setLoading(true);
    try {
      if (target.type === 'client') {
        await api.reglerSoldeClient(target.id, {
          montant: Number(montant),
          modepaiement,
          date,
          technicienid: technicienid || undefined,
          observation,
        });
      } else {
        await api.reglerSoldeInstallation(target.id, {
          montant: Number(montant),
          modepaiement,
          date,
          technicienid: technicienid || undefined,
          observation,
        });
      }

      addToast({
        type: 'success',
        title: 'Paiement enregistré avec succès',
        message: `Règlement de ${formatCurrency(montant, settings.devise)} validé pour ${target.nom}.`,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur lors du règlement',
        message: err.message || 'Impossible de valider ce paiement.',
      });
    } finally {
      setLoading(false);
    }
  };

  const isFullSettlement = Number(montant) >= target.soldeRestant;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Règlement Rapide du Solde"
      subtitle={`Enregistrez l'encaissement et mettez à jour le dossier en 1 clic`}
      maxWidth="lg"
      id="regler-solde-modal"
    >
      <form onSubmit={handleSettle} className="space-y-4">
        {/* Recapitulative Banner */}
        <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-sm space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                Dossier {target.type === 'client' ? 'Client' : 'Installation'}
              </span>
              <h4 className="text-base font-bold text-white">
                {target.nom} {target.kinya ? `(${target.kinya})` : ''}
              </h4>
              {target.numerobon && (
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  N° Bon: <span className="text-white font-bold">{target.numerobon}</span>
                  {target.numerocontrole && ` • N° Ctrl: ${target.numerocontrole}`}
                </p>
              )}
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-300">Solde Restant</span>
              <div className="text-lg font-extrabold text-amber-400">
                {formatCurrency(target.soldeRestant, settings.devise)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/80 text-xs">
            <div>
              <span className="text-slate-400">Total Facturé:</span>{' '}
              <strong className="text-slate-100">{formatCurrency(target.totalFacture, settings.devise)}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-400">Déjà Réglé:</span>{' '}
              <strong className="text-emerald-400">{formatCurrency(target.totalPaye, settings.devise)}</strong>
            </div>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Montant à Encaisser ({settings.devise}) *
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-montant-reglement"
                type="number"
                min="1"
                step="any"
                value={montant || ''}
                onChange={e => setMontant(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                placeholder="Montant en DH"
                required
              />
            </div>
            {target.soldeRestant > 0 && montant !== target.soldeRestant && (
              <button
                type="button"
                onClick={() => setMontant(target.soldeRestant)}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors"
              >
                Tout Solder ({formatCurrency(target.soldeRestant, settings.devise)})
              </button>
            )}
          </div>
          {isFullSettlement ? (
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <Sparkles className="w-3.5 h-3.5" />
              Ce règlement soldera intégralement le dossier (Solde restant = 0 DH).
            </p>
          ) : (
            <p className="text-[11px] text-amber-600 font-medium mt-1">
              Règlement partiel. Nouveau reste à payer : {formatCurrency(Math.max(0, target.soldeRestant - montant), settings.devise)}.
            </p>
          )}
        </div>

        {/* Mode & Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mode de Règlement *
            </label>
            <select
              id="select-mode-reglement"
              value={modepaiement}
              onChange={e => setModePaiement(e.target.value as ModePaiement)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="Espèces">Espèces (Cash)</option>
              <option value="Virement">Virement bancaire</option>
              <option value="Chèque">Chèque</option>
              <option value="Versement">Versement bancaire</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date d'encaissement *</span>
            </label>
            <input
              id="input-date-reglement"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              required
            />
          </div>
        </div>

        {/* Technician Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Encaissé par (Technicien ou Gestionnaire)</span>
          </label>
          <select
            id="select-tech-reglement"
            value={technicienid}
            onChange={e => setTechnicienId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="">-- Non spécifié / Agence --</option>
            {techniciens.map(t => (
              <option key={t.id} value={t.id}>
                {t.prenom} {t.nom} ({t.matricule})
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Observation / Référence du reçu</span>
          </label>
          <input
            id="input-obs-reglement"
            type="text"
            value={observation}
            onChange={e => setObservation(e.target.value)}
            placeholder="Ex: Reçu N° 458, Règlement final, etc."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            id="btn-valider-reglement-solde"
            type="submit"
            disabled={loading || montant <= 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {loading
                ? 'Validation en cours...'
                : `Confirmer le Règlement (${formatCurrency(montant, settings.devise)})`}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
