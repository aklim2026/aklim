import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Technicien } from '../../types';
import { Modal } from '../common/Modal';

interface TechnicienFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicienToEdit?: Technicien | null;
  onSaved: () => void;
}

export const TechnicienFormModal: React.FC<TechnicienFormModalProps> = ({
  isOpen,
  onClose,
  technicienToEdit,
  onSaved,
}) => {
  const { addToast } = useApp();

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [matricule, setMatricule] = useState('');
  const [zone, setZone] = useState('');
  const [statut, setStatut] = useState<'Actif' | 'En mission' | 'En congé' | 'Inactif'>('Actif');
  const [observation, setObservation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (technicienToEdit) {
        setNom(technicienToEdit.nom);
        setPrenom(technicienToEdit.prenom);
        setTelephone(technicienToEdit.telephone);
        setMatricule(technicienToEdit.matricule);
        setZone(technicienToEdit.zone);
        setStatut(technicienToEdit.statut);
        setObservation(technicienToEdit.observation || '');
      } else {
        setNom('');
        setPrenom('');
        setTelephone('');
        const rand = Math.floor(100 + Math.random() * 900);
        setMatricule(`TECH-${rand}`);
        setZone('Casablanca & Environs');
        setStatut('Actif');
        setObservation('');
      }
    }
  }, [isOpen, technicienToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !prenom || !telephone || !matricule) {
      addToast({
        type: 'error',
        title: 'Champs requis',
        message: 'Veuillez remplir le nom, prénom, téléphone et matricule.',
      });
      return;
    }

    setLoading(true);
    try {
      const payload: Partial<Technicien> = {
        nom,
        prenom,
        telephone,
        matricule,
        zone,
        statut,
        observation,
      };

      if (technicienToEdit) {
        await api.updateTechnicien(technicienToEdit.id, payload);
        addToast({
          type: 'success',
          title: 'Technicien mis à jour',
          message: 'Les informations du technicien ont été sauvegardées.',
        });
      } else {
        await api.createTechnicien(payload);
        addToast({
          type: 'success',
          title: 'Technicien créé',
          message: 'Le nouveau technicien a été ajouté avec succès.',
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.message || 'Impossible d’enregistrer le technicien.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={technicienToEdit ? 'Modifier le Technicien' : 'Ajouter un Nouveau Technicien'}
      subtitle="Coordonnées, matricule d'intervention et zone géographique"
      maxWidth="2xl"
      id="technicien-form-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Prénom *</label>
            <input
              type="text"
              required
              placeholder="ex: Ahmed, Youssef, Karim..."
              value={prenom}
              onChange={e => setPrenom(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nom de famille *</label>
            <input
              type="text"
              required
              placeholder="ex: Benani, Mansouri..."
              value={nom}
              onChange={e => setNom(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Numéro de téléphone *</label>
            <input
              type="tel"
              required
              placeholder="ex: 0662345678"
              value={telephone}
              onChange={e => setTelephone(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Matricule / Identifiant *</label>
            <input
              type="text"
              required
              placeholder="ex: TECH-001"
              value={matricule}
              onChange={e => setMatricule(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Zone / Quartiers d'intervention</label>
            <input
              type="text"
              placeholder="ex: Casablanca Centre, Anfa, Maârif"
              value={zone}
              onChange={e => setZone(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Statut *</label>
            <select
              value={statut}
              onChange={e => setStatut(e.target.value as any)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="Actif">Actif</option>
              <option value="En mission">En mission</option>
              <option value="En congé">En congé</option>
              <option value="Inactif">Inactif</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Observation / Compétences</label>
            <textarea
              rows={2}
              placeholder="ex: Frigoriste diplômé, spécialiste climatisation gainable et split mural..."
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
            {loading ? 'Enregistrement...' : technicienToEdit ? 'Mettre à jour' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
