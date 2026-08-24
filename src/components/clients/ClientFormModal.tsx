import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Client, Quartier, TypeClient } from '../../types';
import { Modal } from '../common/Modal';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
  onSaved: () => void;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  clientToEdit,
  onSaved,
}) => {
  const { addToast } = useApp();
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);

  const [nom, setNom] = useState('');
  const [kinya, setKinya] = useState('');
  const [typeclient, setTypeClient] = useState<TypeClient>('Standard');
  const [telephone, setTelephone] = useState('');
  const [quartierid, setQuartierId] = useState('');
  const [adresse, setAdresse] = useState('');
  const [observation, setObservation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getQuartiers().then(qrts => {
        setQuartiers(qrts);
        if (qrts.length > 0 && !quartierid) setQuartierId(qrts[0].id);
      });

      if (clientToEdit) {
        setNom(clientToEdit.nom);
        setKinya(clientToEdit.kinya || '');
        setTypeClient(clientToEdit.typeclient || 'Standard');
        setTelephone(clientToEdit.telephone);
        setQuartierId(clientToEdit.quartierid);
        setAdresse(clientToEdit.adresse || '');
        setObservation(clientToEdit.observation || '');
      } else {
        setNom('');
        setKinya('');
        setTypeClient('Standard');
        setTelephone('');
        setAdresse('');
        setObservation('');
      }
    }
  }, [isOpen, clientToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !telephone.trim() || !quartierid) {
      addToast({
        type: 'error',
        title: 'Champs requis',
        message: 'Veuillez remplir le nom, le téléphone et le quartier.',
      });
      return;
    }

    setLoading(true);
    try {
      const qObj = quartiers.find(q => q.id === quartierid);

      const payload: Partial<Client> = {
        nom: nom.trim(),
        kinya: kinya.trim() || nom.trim(),
        typeclient,
        telephone: telephone.trim(),
        quartierid,
        quartiernom: qObj?.nom || '',
        adresse: adresse.trim(),
        observation: observation.trim(),
      };

      if (clientToEdit) {
        await api.updateClient(clientToEdit.id, payload);
        addToast({
          type: 'success',
          title: 'Client modifié',
          message: 'Les coordonnées du client ont été mises à jour.',
        });
      } else {
        await api.createClient(payload);
        addToast({
          type: 'success',
          title: 'Client ajouté',
          message: 'Le nouveau client a été enregistré avec succès.',
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.message || 'Échec de l’enregistrement.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clientToEdit ? 'Modifier les Coordonnées du Client' : 'Ajouter un Nouveau Client'}
      subtitle="Enregistrez les informations d'identification et de contact du client"
      maxWidth="lg"
      id="client-form-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selection */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Type de Client / Catégorie</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTypeClient('Standard')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                typeclient === 'Standard'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Personnel / Particulier
            </button>
            <button
              type="button"
              onClick={() => setTypeClient('Grande Surface')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                typeclient === 'Grande Surface'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Société / Supermarché
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {typeclient === 'Grande Surface' ? 'Nom de la Société / Enseigne *' : 'Nom du Client *'}
            </label>
            <input
              id="input-client-nom"
              type="text"
              required
              placeholder={typeclient === 'Grande Surface' ? 'ex: Marjane, Carrefour, BIM...' : 'ex: Benani, Alami...'}
              value={nom}
              onChange={e => setNom(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {typeclient === 'Grande Surface' ? 'Responsable / Contact' : 'Prénom'}
            </label>
            <input
              id="input-client-kinya"
              type="text"
              placeholder={typeclient === 'Grande Surface' ? 'ex: Gérant, Chef technique...' : 'ex: Mohammed, Fatima...'}
              value={kinya}
              onChange={e => setKinya(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Numéro de téléphone *</label>
            <input
              id="input-client-telephone"
              type="tel"
              required
              placeholder="ex: 0612345678"
              value={telephone}
              onChange={e => setTelephone(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quartier *</label>
            <select
              id="select-client-quartier"
              required
              value={quartierid}
              onChange={e => setQuartierId(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              {quartiers.map(q => (
                <option key={q.id} value={q.id}>
                  {q.nom} ({q.ville})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Remarques / Observations</label>
          <textarea
            id="textarea-client-observation"
            rows={2}
            placeholder="Notes particulières sur le client, indications d'accès..."
            value={observation}
            onChange={e => setObservation(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            id="btn-save-client"
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Enregistrement...' : clientToEdit ? 'Mettre à jour' : 'Enregistrer le client'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
