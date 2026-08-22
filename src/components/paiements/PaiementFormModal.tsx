import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Paiement, Client, Technicien, ModePaiement } from '../../types';
import { Modal } from '../common/Modal';
import { generateNumeroBon } from '../../utils/formatters';

interface PaiementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  paiementToEdit?: Paiement | null;
  onSaved: () => void;
}

export const PaiementFormModal: React.FC<PaiementFormModalProps> = ({
  isOpen,
  onClose,
  paiementToEdit,
  onSaved,
}) => {
  const { addToast } = useApp();

  const [clients, setClients] = useState<Client[]>([]);
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);

  const [clientid, setClientId] = useState('');
  const [technicienid, setTechnicienId] = useState('');
  const [date, setDate] = useState('');
  const [montant, setMontant] = useState<number>(0);
  const [modepaiement, setModePaiement] = useState<ModePaiement>('Espèces');
  const [numerobon, setNumeroBon] = useState('');
  const [observation, setObservation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      Promise.all([api.getClients(), api.getTechniciens()]).then(([cls, techs]) => {
        setClients(cls);
        setTechniciens(techs);
        if (cls.length > 0 && !clientid) {
          setClientId(cls[0].id);
          if (cls[0].numerobon) setNumeroBon(cls[0].numerobon);
          if (cls[0].technicienid) setTechnicienId(cls[0].technicienid);
        }
        if (techs.length > 0 && !technicienid) setTechnicienId(techs[0].id);
      });

      if (paiementToEdit) {
        setClientId(paiementToEdit.clientid);
        setTechnicienId(paiementToEdit.technicienid);
        setDate(paiementToEdit.date);
        setMontant(paiementToEdit.montant);
        setModePaiement(paiementToEdit.modepaiement);
        setNumeroBon(paiementToEdit.numerobon || '');
        setObservation(paiementToEdit.observation || '');
      } else {
        setDate(new Date().toISOString().split('T')[0]);
        setMontant(1500);
        setModePaiement('Espèces');
        setNumeroBon(generateNumeroBon());
        setObservation('');
      }
    }
  }, [isOpen, paiementToEdit]);

  const handleClientChange = (cId: string) => {
    setClientId(cId);
    const selected = clients.find(c => c.id === cId);
    if (selected) {
      if (selected.numerobon) setNumeroBon(selected.numerobon);
      if (selected.technicienid) setTechnicienId(selected.technicienid);
      const remaining = Math.max(0, (selected.prixtotal || 0) - (selected.montantpayetotal || 0));
      if (remaining > 0) setMontant(remaining);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientid || !technicienid || Number(montant) <= 0) {
      addToast({
        type: 'error',
        title: 'Champs requis',
        message: 'Veuillez renseigner le client, le technicien et un montant supérieur à 0.',
      });
      return;
    }

    setLoading(true);
    try {
      const payload: Partial<Paiement> = {
        clientid,
        technicienid,
        date,
        montant: Number(montant),
        modepaiement,
        numerobon,
        observation,
      };

      if (paiementToEdit) {
        await api.updatePaiement(paiementToEdit.id, payload);
        addToast({
          type: 'success',
          title: 'Paiement mis à jour',
          message: 'Le règlement a été modifié et les soldes recalculés.',
        });
      } else {
        await api.createPaiement(payload);
        addToast({
          type: 'success',
          title: 'Paiement enregistré',
          message: 'Encaissement validé et soldes client/technicien mis à jour.',
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.message || 'Impossible d’enregistrer le règlement.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={paiementToEdit ? 'Modifier le Paiement' : 'Enregistrer un Encaissement'}
      subtitle="Comptabilisation du règlement et mise à jour automatique du solde"
      maxWidth="2xl"
      id="paiement-form-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Client débiteur *</label>
            <select
              required
              value={clientid}
              onChange={e => handleClientChange(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="">-- Choisir un client --</option>
              {clients.map(c => {
                const due = Math.max(0, (c.prixtotal || 0) - (c.montantpayetotal || 0));
                return (
                  <option key={c.id} value={c.id}>
                    {c.nom} ({c.kinya}) - Solde dû : {due.toLocaleString('fr-FR')} DH ({c.quartiernom})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Technicien encaisseur *</label>
            <select
              required
              value={technicienid}
              onChange={e => setTechnicienId(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="">-- Choisir un technicien --</option>
              {techniciens.map(t => (
                <option key={t.id} value={t.id}>
                  {t.prenom} {t.nom} ({t.matricule})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Date d'encaissement *</label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Montant encaissé (DH) *</label>
            <input
              type="number"
              min="1"
              required
              value={montant}
              onChange={e => setMontant(Number(e.target.value))}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-base font-bold text-emerald-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Mode de règlement *</label>
            <select
              value={modepaiement}
              onChange={e => setModePaiement(e.target.value as ModePaiement)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="Espèces">Espèces</option>
              <option value="Chèque">Chèque bancaire</option>
              <option value="Virement bancaire">Virement bancaire</option>
              <option value="Carte bancaire">Carte bancaire</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">N° de Bon associé</label>
            <input
              type="text"
              placeholder="ex: BON-2025-001"
              value={numerobon}
              onChange={e => setNumeroBon(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Observation / N° de chèque / Référence</label>
            <textarea
              rows={2}
              placeholder="ex: Acompte 50%, solde à la mise en service. Chèque BMCE N°..."
              value={observation}
              onChange={e => setObservation(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : paiementToEdit ? 'Mettre à jour' : 'Valider l’encaissement'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
