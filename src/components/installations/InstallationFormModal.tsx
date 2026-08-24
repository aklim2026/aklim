import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Installation, Client, Technicien, TypeClimatiseur, InstallationStatut, TypeClient } from '../../types';
import { Modal } from '../common/Modal';
import { generateNumeroContrat, generateNumeroBon } from '../../utils/formatters';

interface InstallationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  installationToEdit?: Installation | null;
  onSaved: () => void;
}

export const InstallationFormModal: React.FC<InstallationFormModalProps> = ({
  isOpen,
  onClose,
  installationToEdit,
  onSaved,
}) => {
  const { addToast } = useApp();

  const [clients, setClients] = useState<Client[]>([]);
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);

  const [clientid, setClientId] = useState('');
  const [technicienid, setTechnicienId] = useState('');
  const [dateinstallation, setDateInstallation] = useState('');
  const [numerocontrat, setNumeroContrat] = useState('');
  const [numerobon, setNumeroBon] = useState('');
  const [typeclimatiseur, setTypeClimatiseur] = useState<TypeClimatiseur>('Split Mural');
  const [marque, setMarque] = useState('Daikin');
  const [modele, setModele] = useState('');
  const [puissance, setPuissance] = useState('12 000 BTU (1.5 CV)');
  const [quantite, setQuantite] = useState<number>(1);
  const [prix, setPrix] = useState<number>(0);
  const [montantpaye, setMontantPaye] = useState<number>(0);
  const [statut, setStatut] = useState<InstallationStatut>('Installée');
  const [typeclient, setTypeClient] = useState<TypeClient>('Standard');
  const [tacherealisee, setTacheRealisee] = useState('');
  const [prixtachesuppl, setPrixTacheSuppl] = useState<number>(0);
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

      if (installationToEdit) {
        setClientId(installationToEdit.clientid);
        setTechnicienId(installationToEdit.technicienid);
        setDateInstallation(installationToEdit.dateinstallation);
        setNumeroContrat(installationToEdit.numerocontrat);
        setNumeroBon(installationToEdit.numerobon);
        setTypeClimatiseur(installationToEdit.typeclimatiseur);
        setMarque(installationToEdit.marque);
        setModele(installationToEdit.modele);
        setPuissance(installationToEdit.puissance);
        setQuantite(installationToEdit.quantite);
        setPrix(installationToEdit.prix);
        setMontantPaye(installationToEdit.montantpaye || 0);
        setStatut(installationToEdit.statut);
        setTypeClient(installationToEdit.typeclient || 'Standard');
        setTacheRealisee(installationToEdit.tacherealisee || '');
        setPrixTacheSuppl(installationToEdit.prixtachesuppl || 0);
        setObservation(installationToEdit.observation || '');
      } else {
        setDateInstallation(new Date().toISOString().split('T')[0]);
        setNumeroContrat(generateNumeroContrat());
        setNumeroBon(generateNumeroBon());
        setTypeClimatiseur('Split Mural');
        setMarque('Daikin');
        setModele('');
        setPuissance('12 000 BTU (1.5 CV)');
        setQuantite(1);
        setPrix(0);
        setMontantPaye(0);
        setStatut('Installée');
        setTypeClient('Standard');
        setTacheRealisee('');
        setPrixTacheSuppl(0);
        setObservation('');
      }
    }
  }, [isOpen, installationToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientid || !technicienid) {
      addToast({
        type: 'error',
        title: 'Champs requis',
        message: 'Veuillez sélectionner un client et un technicien.',
      });
      return;
    }

    setLoading(true);
    try {
      const payload: Partial<Installation> = {
        clientid,
        technicienid,
        dateinstallation,
        numerocontrat,
        numerobon,
        typeclimatiseur,
        marque,
        modele: modele || `${typeclimatiseur} ${puissance}`,
        puissance,
        quantite: Number(quantite),
        prix: Number(prix),
        montantpaye: Number(montantpaye),
        statut,
        typeclient,
        tacherealisee,
        prixtachesuppl,
        observation,
      };

      const selectedClient = clients.find(c => c.id === clientid);
      const selectedTechnicien = techniciens.find(t => t.id === technicienid);

      if (installationToEdit) {
        await api.updateinstallation(installationToEdit.id, payload);
        
        // If montantpaye increased, create a payment record for the difference
        const oldAmount = Number(installationToEdit.montantpaye || 0);
        const newAmount = Number(montantpaye);
        
        if (newAmount > oldAmount) {
          const diff = newAmount - oldAmount;
          try {
            await api.createPaiement({
              clientid: clientid,
              clientnom: selectedClient?.nom || installationToEdit.clientnom || 'Client inconnu',
              clienttelephone: selectedClient?.telephone || installationToEdit.clienttelephone || '',
              technicienid: technicienid,
              techniciennom: selectedTechnicien ? `${selectedTechnicien.prenom} ${selectedTechnicien.nom}` : (installationToEdit.techniciennom || 'Non assigné'),
              quartiernom: selectedClient?.quartiernom || installationToEdit.clientquartier || '',
              installationid: installationToEdit.id,
              montant: diff,
              date: new Date().toISOString().split('T')[0],
              modepaiement: 'Espèces',
              numerobon: numerobon || installationToEdit.numerobon || '',
              observation: `Règlement complémentaire (Modif. installation) - Bon N° ${numerobon || installationToEdit.numerobon}`
            });
          } catch (payErr: any) {
            console.error('Error creating update payment:', payErr);
            addToast({
              type: 'error',
              title: 'Erreur Paiement',
              message: 'L\'installation a été mise à jour ولكن لم نتمكن من تسجيل الدفعة: ' + payErr.message,
            });
          }
        }

        addToast({
          type: 'success',
          title: 'Installation mise à jour',
          message: 'Dossier d’installation mis à jour.',
        });
      } else {
        const newInstallation = await api.createInstallation(payload);
        
        // If there's a paid amount, automatically create a payment record
        if (Number(montantpaye) > 0) {
          try {
            await api.createPaiement({
              clientid: clientid,
              clientnom: selectedClient?.nom || 'Client inconnu',
              clienttelephone: selectedClient?.telephone || '',
              technicienid: technicienid,
              techniciennom: selectedTechnicien ? `${selectedTechnicien.prenom} ${selectedTechnicien.nom}` : 'Non assigné',
              quartiernom: selectedClient?.quartiernom || '',
              installationid: newInstallation.id,
              montant: Number(montantpaye),
              date: dateinstallation,
              modepaiement: 'Espèces',
              numerobon: numerobon,
              observation: `Paiement initial lors de l'installation - Bon N° ${numerobon}`
            });
          } catch (payErr: any) {
            console.error('Error creating initial payment:', payErr);
            addToast({
              type: 'error',
              title: 'Erreur Paiement',
              message: 'تم تسجيل التركيب ولكن فشل تسجيل الدفع: ' + payErr.message,
            });
          }
        }

        addToast({
          type: 'success',
          title: 'Installation enregistrée',
          message: Number(montantpaye) > 0 
            ? 'Nouvelle installation ajoutée et paiement enregistré.' 
            : 'Nouvelle installation ajoutée et liée.',
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.message || 'Impossible d’enregistrer l’installation.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={installationToEdit ? 'Modifier l’Installation' : 'Nouvelle Installation de Climatiseur'}
      subtitle="Spécifications techniques, affectation technicien et numéros de contrat"
      maxWidth="3xl"
      id="installation-form-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client & Technicien Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Client bénéficiaire *</label>
            <select
              required
              value={clientid}
              onChange={e => {
                const id = e.target.value;
                setClientId(id);
                const client = clients.find(c => c.id === id);
                if (client && client.typeclient) {
                  setTypeClient(client.typeclient);
                }
              }}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="">-- Sélectionner un client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.kinya}) - {c.telephone} ({c.quartiernom})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Technicien assigné *</label>
            <select
              required
              value={technicienid}
              onChange={e => setTechnicienId(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="">-- Sélectionner un technicien --</option>
              {techniciens.map(t => (
                <option key={t.id} value={t.id}>
                  {t.prenom} {t.nom} ({t.matricule}) - {t.zone}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Numbers & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Date d'installation *</label>
            <input
              type="date"
              required
              value={dateinstallation}
              onChange={e => setDateInstallation(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Numéro de Bon *</label>
            <input
              type="text"
              required
              value={numerobon}
              onChange={e => setNumeroBon(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Numéro de Contrat *</label>
            <input
              type="text"
              required
              value={numerocontrat}
              onChange={e => setNumeroContrat(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Catégorie / Type *</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTypeClient('Standard')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                  typeclient === 'Standard'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setTypeClient('Grande Surface')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                  typeclient === 'Grande Surface'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Supermarché
              </button>
            </div>
          </div>
        </div>

        {/* AC Specs */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
            Spécifications de l'équipement
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Type de Climatiseur *</label>
              <select
                value={typeclimatiseur}
                onChange={e => setTypeClimatiseur(e.target.value as TypeClimatiseur)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="Split Mural">Split Mural</option>
                <option value="Multi-Split">Multi-Split</option>
                <option value="Cassette">Cassette</option>
                <option value="Gainable">Gainable</option>
                <option value="Console">Console</option>
                <option value="Armoire">Armoire</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Marque *</label>
              <input
                type="text"
                required
                placeholder="ex: Daikin, Carrier, LG..."
                value={marque}
                onChange={e => setMarque(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Puissance / Capacité *</label>
              <select
                value={puissance}
                onChange={e => setPuissance(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="9 000 BTU (1 CV)">9 000 BTU (1 CV)</option>
                <option value="12 000 BTU (1.5 CV)">12 000 BTU (1.5 CV)</option>
                <option value="18 000 BTU (2 CV)">18 000 BTU (2 CV)</option>
                <option value="24 000 BTU (3 CV)">24 000 BTU (3 CV)</option>
                <option value="30 000 BTU (3.5 CV)">30 000 BTU (3.5 CV)</option>
                <option value="36 000 BTU (4 CV)">36 000 BTU (4 CV)</option>
                <option value="48 000 BTU (5 CV)">48 000 BTU (5 CV)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Quantité *</label>
              <input
                type="number"
                min="1"
                required
                value={quantite}
                onChange={e => setQuantite(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Statut d'installation *</label>
              <select
                value={statut}
                onChange={e => setStatut(e.target.value as InstallationStatut)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="Planifiée">Planifiée</option>
                <option value="Affectée">Affectée</option>
                <option value="En cours">En cours</option>
                <option value="Installée">Installée</option>
                <option value="Contrôlée">Contrôlée</option>
                <option value="Annulée">Annulée</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Modèle / Série</label>
              <input
                type="text"
                placeholder="ex: Sensira FTXC35"
                value={modele}
                onChange={e => setModele(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Tâche supplémentaire (ex: Gaz, Tuyauterie...)</label>
              <input
                type="text"
                placeholder="Décrivez les travaux additionnels..."
                value={tacherealisee}
                onChange={e => setTacheRealisee(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Prix Tâche Suppl. (DH)</label>
              <input
                type="number"
                placeholder="0.00"
                value={prixtachesuppl || ''}
                onChange={e => setPrixTacheSuppl(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Task */}
        <div className="pt-2 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">Prix total convenu (DH) *</label>
              </div>
              <input
                id="input-inst-prix"
                type="number"
                min="0"
                required
                value={prix}
                onChange={e => setPrix(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">Montant encaissé / Avance (DH) *</label>
                {prix > 0 && montantpaye < prix && (
                  <button
                    type="button"
                    onClick={() => setMontantPaye(prix)}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
                  >
                    Régler tout (100%)
                  </button>
                )}
              </div>
              <input
                id="input-inst-montant-paye"
                type="number"
                min="0"
                required
                value={montantpaye}
                onChange={e => setMontantPaye(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Real-time Calculation Summary Banner */}
            <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">Prix : <strong className="text-slate-900 font-bold">{prix.toLocaleString('fr-FR')} DH</strong></span>
                  <span className="text-slate-300">|</span>
                  <span className="text-emerald-600 font-medium">Encaissé : <strong className="text-emerald-700 font-bold">{montantpaye.toLocaleString('fr-FR')} DH</strong></span>
                </div>

                <div>
                  {prix > 0 && montantpaye >= prix ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold shadow-2xs">
                      ✓ Payé intégral (0 DH restant)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-extrabold shadow-2xs">
                      Reste à payer : {Math.max(0, prix - montantpaye).toLocaleString('fr-FR')} DH
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Observation</label>
              <textarea
                rows={2}
                placeholder="Remarques particulières sur l'installation..."
                value={observation}
                onChange={e => setObservation(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
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
            {loading ? 'Enregistrement...' : installationToEdit ? 'Mettre à jour' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
