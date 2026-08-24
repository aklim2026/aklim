import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Intervention, Client, Technicien, InterventionStatut } from '../../types';
import { Modal } from '../common/Modal';

interface InterventionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  interventionToEdit?: Intervention | null;
  onSaved: () => void;
}

export const InterventionFormModal: React.FC<InterventionFormModalProps> = ({
  isOpen,
  onClose,
  interventionToEdit,
  onSaved,
}) => {
  const { addToast } = useApp();

  const [clients, setClients] = useState<Client[]>([]);
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);

  const [clientid, setClientId] = useState('');
  const [technicienid, setTechnicienId] = useState('');
  const [date, setDate] = useState('');
  const [typeintervention, setTypeIntervention] = useState('Installation');
  const [descriptiontache, setDescriptionTache] = useState('');
  const [statut, setStatut] = useState<InterventionStatut>('Terminée');
  const [cout, setCout] = useState<number>(0);
  const [observation, setObservation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      Promise.all([api.getClients(), api.getTechniciens()]).then(([cls, techs]) => {
        setClients(cls);
        setTechniciens(techs);
        if (cls.length > 0 && !clientid) setClientId(cls[0].id);
        if (techs.length > 0 && !technicienid) setTechnicienId(techs[0].id);
      });

      if (interventionToEdit) {
        setClientId(interventionToEdit.clientid);
        setTechnicienId(interventionToEdit.technicienid);
        setDate(interventionToEdit.date);
        setTypeIntervention(interventionToEdit.typeintervention);
        setDescriptionTache(interventionToEdit.descriptiontache);
        setStatut(interventionToEdit.statut);
        setCout(interventionToEdit.cout || 0);
        setObservation(interventionToEdit.observation || '');
      } else {
        setDate(new Date().toISOString().split('T')[0]);
        setTypeIntervention('Installation');
        setDescriptionTache('Pose de climatiseur et mise en route');
        setStatut('Terminée');
        setCout(0);
        setObservation('');
      }
    }
  }, [isOpen, interventionToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientid || !technicienid || !descriptiontache) {
      addToast({
        type: 'error',
        title: 'Champs requis',
        message: 'Veuillez remplir les informations obligatoires.',
      });
      return;
    }

    setLoading(true);
    try {
      const payload: Partial<Intervention> = {
        clientid,
        technicienid,
        date,
        typeintervention,
        descriptiontache,
        statut,
        cout: Number(cout),
        observation,
      };

      if (interventionToEdit) {
        await api.updateIntervention(interventionToEdit.id, payload);
        addToast({
          type: 'success',
          title: 'Intervention mise à jour',
          message: 'Les détails de l’intervention ont été modifiés.',
        });
      } else {
        await api.createIntervention(payload);
        addToast({
          type: 'success',
          title: 'Intervention ajoutée',
          message: 'L’intervention technique a été enregistrée.',
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.message || 'Impossible d’enregistrer l’intervention.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={interventionToEdit ? 'Modifier l’Intervention' : 'Enregistrer une Intervention'}
      subtitle="Suivi des travaux sur site, contrats et dépannages"
      maxWidth="2xl"
      id="intervention-form-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Client *</label>
            <select
              required
              value={clientid}
              onChange={e => setClientId(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="">-- Choisir un client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.kinya}) - {c.quartiernom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Technicien intervenant *</label>
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
            <label className="block text-xs font-medium text-slate-700 mb-1">Date d'intervention *</label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Type d'intervention *</label>
            <select
              value={typeintervention}
              onChange={e => setTypeIntervention(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="Installation">Installation neuve</option>
              <option value="Entretien / Nettoyage">Entretien / Nettoyage</option>
              <option value="Dépannage / SAV">Dépannage / SAV</option>
              <option value="Recharge Gaz R410A/R32">Recharge Gaz R410A / R32</option>
              <option value="Suivi de contrat">Suivi de contrat</option>
              <option value="Déplacement / Désinstallation">Déplacement / Désinstallation</option>
              <option value="Autre">Autre intervention</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Statut *</label>
            <select
              value={statut}
              onChange={e => setStatut(e.target.value as InterventionStatut)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="Planifiée">Planifiée</option>
              <option value="En cours">En cours</option>
              <option value="Terminée">Terminée</option>
              <option value="Annulée">Annulée</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Coût additionnel (DH)</label>
            <input
              type="number"
              min="0"
              value={cout}
              onChange={e => setCout(Number(e.target.value))}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Description de la tâche réalisée *</label>
            <textarea
              rows={2}
              required
              placeholder="ex: Vérification des pressions, nettoyage des filtres, tirage au vide..."
              value={descriptiontache}
              onChange={e => setDescriptionTache(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Observation / Remarques</label>
            <textarea
              rows={2}
              placeholder="ex: Bon fonctionnement validé par le client..."
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
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : interventionToEdit ? 'Mettre à jour' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
