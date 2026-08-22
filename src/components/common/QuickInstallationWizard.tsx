import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Technicien, Quartier, Client, TypeClimatiseur, InstallationStatut, TypeClient } from '../../types';
import { Modal } from './Modal';
import { generateNumeroControle, generateNumeroBon } from '../../utils/formatters';
import { Plus, Check, Airplay, User, Wrench, Receipt, FileText } from 'lucide-react';

export const QuickInstallationWizard: React.FC = () => {
  const { isQuickInstallOpen, setIsQuickInstallOpen, triggerRefresh, addToast } = useApp();

  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [quartiers, setQuartiers] = useState<Quartier[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [isNewClient, setIsNewClient] = useState(true);
  const [selectedExistingClientId, setSelectedExistingClientId] = useState('');

  // Step fields
  const [nom, setNom] = useState('');
  const [kinya, setKinya] = useState('');
  const [telephone, setTelephone] = useState('');
  const [quartierid, setQuartierId] = useState('');
  const [adresse, setAdresse] = useState('');
  const [typeclient, setTypeClient] = useState<TypeClient>('Standard');

  const [technicienid, setTechnicienId] = useState('');
  const [dateinstallation, setDateInstallation] = useState(new Date().toISOString().split('T')[0]);
  const [numerocontrole, setNumeroControle] = useState(generateNumeroControle());
  const [numerobon, setNumeroBon] = useState(generateNumeroBon());

  const [typeclimatiseur, setTypeClimatiseur] = useState<TypeClimatiseur>('Split Mural');
  const [marque, setMarque] = useState('Daikin');
  const [modele, setModele] = useState('');
  const [puissance, setPuissance] = useState('12 000 BTU (1.5 CV)');
  const [quantite, setQuantite] = useState<number>(1);
  const [prix, setPrix] = useState<number>(0);
  const [montantpaye, setMontantPaye] = useState<number>(0);
  const [statut, setStatut] = useState<InstallationStatut>('Installée');
  const [tacherealisee, setTacheRealisee] = useState('Installation standard, tirage au vide et mise en service');
  const [observation, setObservation] = useState('Installation et test de froid conformes');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isQuickInstallOpen) {
      Promise.all([api.getTechniciens(), api.getQuartiers(), api.getClients()]).then(
        ([techs, qrts, clis]) => {
          setTechniciens(techs);
          setQuartiers(qrts);
          setClients(clis);
          if (techs.length > 0 && !technicienid) setTechnicienId(techs[0].id);
          if (qrts.length > 0 && !quartierid) setQuartierId(qrts[0].id);
          setNumeroControle(generateNumeroControle());
          setNumeroBon(generateNumeroBon());
        }
      );
    }
  }, [isQuickInstallOpen]);

  const handleSelectExistingClient = (id: string) => {
    setSelectedExistingClientId(id);
    const found = clients.find(c => c.id === id);
    if (found) {
      setNom(found.nom);
      setKinya(found.kinya);
      setTelephone(found.telephone);
      setQuartierId(found.quartierid);
      setAdresse(found.adresse || '');
      if (found.typeclient) setTypeClient(found.typeclient);
      if (found.technicienid) setTechnicienId(found.technicienid);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !telephone || !technicienid) {
      addToast({
        type: 'error',
        title: 'Champs obligatoires',
        message: 'Veuillez renseigner le nom, téléphone et technicien.',
      });
      return;
    }

    setLoading(true);
    try {
      let finalClientId = selectedExistingClientId;

      // 1. If new client, create client first
      if (isNewClient || !finalClientId) {
        const qObj = quartiers.find(q => q.id === quartierid);
        const tObj = techniciens.find(t => t.id === technicienid);
        const newClient = await api.createClient({
          nom,
          kinya,
          telephone,
          quartierid,
          quartiernom: qObj?.nom || '',
          adresse,
          typeclient,
          technicienid,
          techniciennom: tObj ? `${tObj.prenom} ${tObj.nom}` : '',
          numerocontrole,
          numerobon,
          climatiseurinfo: `${marque} ${puissance} (${typeclimatiseur}) x${quantite}`,
          dateinstallation,
          observation,
        });
        finalClientId = newClient.id;
      }

      // 2. Create the Installation
      const newInstallation = await api.createInstallation({
        clientid: finalClientId,
        technicienid,
        dateinstallation,
        numerocontrole,
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
        observation,
      });

      // 3. Create payment record if there is an advance
      if (Number(montantpaye) > 0) {
        try {
          const qObj = quartiers.find(q => q.id === quartierid);
          const tObj = techniciens.find(t => t.id === technicienid);
          
          await api.createPaiement({
            clientid: finalClientId,
            clientnom: nom,
            clienttelephone: telephone,
            quartiernom: qObj?.nom || '',
            technicienid: technicienid,
            techniciennom: tObj ? `${tObj.prenom} ${tObj.nom}` : '',
            installationid: newInstallation.id,
            montant: Number(montantpaye),
            date: dateinstallation,
            modepaiement: 'Espèces',
            numerobon: numerobon,
            observation: `Acompte initial (Workflow) - Bon N° ${numerobon}`
          });
        } catch (payErr) {
          console.error('Error creating wizard payment:', payErr);
        }
      }

      addToast({
        type: 'success',
        title: 'Installation enregistrée avec succès !',
        message: Number(montantpaye) > 0 
          ? `Dossier et paiement de ${montantpaye} DH enregistrés.` 
          : `Dossier lié au technicien et au client.`,
      });

      triggerRefresh();
      setIsQuickInstallOpen(false);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.message || 'Impossible d’enregistrer le dossier.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isQuickInstallOpen}
      onClose={() => setIsQuickInstallOpen(false)}
      title="Nouvelle Installation Complète (Workflow 10 Étapes)"
      subtitle="Enregistrez en un seul formulaire le client, le technicien, le climatiseur, le bon et le paiement"
      maxWidth="4xl"
      id="quick-install-wizard-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Selection Option */}
        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-800">
            <input
              type="radio"
              name="clientType"
              checked={isNewClient}
              onChange={() => setIsNewClient(true)}
              className="text-blue-600 focus:ring-blue-500"
            />
            Nouveau Client
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-800">
            <input
              type="radio"
              name="clientType"
              checked={!isNewClient}
              onChange={() => setIsNewClient(false)}
              className="text-blue-600 focus:ring-blue-500"
            />
            Client Existant
          </label>
        </div>

        {!isNewClient && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Sélectionner le client existant *
            </label>
            <select
              value={selectedExistingClientId}
              onChange={e => handleSelectExistingClient(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              required
            >
              <option value="">-- Choisir un client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.kinya}) - {c.telephone} - {c.quartiernom}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 1. Informations Client */}
        <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <User className="w-4 h-4 text-blue-600" />
            <span>1. Coordonnées du Client</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {typeclient === 'Grande Surface' ? 'Nom de la Société / Enseigne *' : 'Nom du Client *'}
              </label>
              <input
                type="text"
                required
                placeholder={typeclient === 'Grande Surface' ? 'ex: Marjane, Carrefour, BIM...' : 'ex: Benzekri, Alami...'}
                value={nom}
                onChange={e => setNom(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Catégorie Client *</label>
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
                  Supermarché / G.S
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {typeclient === 'Grande Surface' ? 'Responsable / Contact' : 'Prénom'}
              </label>
              <input
                type="text"
                placeholder={typeclient === 'Grande Surface' ? 'ex: Chef technique, Gérant...' : 'ex: Mehdi, Amina...'}
                value={kinya}
                onChange={e => setKinya(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Numéro de téléphone *</label>
              <input
                type="tel"
                required
                placeholder="ex: 0661234567"
                value={telephone}
                onChange={e => setTelephone(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Quartier *</label>
              <select
                required
                value={quartierid}
                onChange={e => setQuartierId(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {quartiers.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.nom} ({q.ville})
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Adresse détaillée / Repères</label>
              <input
                type="text"
                placeholder="ex: 12 Rue d'Agadir, Immeuble B, 3ème étage"
                value={adresse}
                onChange={e => setAdresse(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* 2. Technicien & Dates */}
        <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Wrench className="w-4 h-4 text-indigo-600" />
            <span>2. Affectation Technicien & Numéros de Dossier</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Technicien affecté *</label>
              <select
                required
                value={technicienid}
                onChange={e => setTechnicienId(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {techniciens.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.prenom} {t.nom} ({t.matricule}) - {t.zone}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date d'installation *</label>
              <input
                type="date"
                required
                value={dateinstallation}
                onChange={e => setDateInstallation(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Statut *</label>
              <select
                value={statut}
                onChange={e => setStatut(e.target.value as InstallationStatut)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Numéro de bon *</label>
              <input
                type="text"
                required
                value={numerobon}
                onChange={e => setNumeroBon(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Numéro de contrôle *</label>
              <input
                type="text"
                required
                value={numerocontrole}
                onChange={e => setNumeroControle(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* 3. Spécifications Climatiseur */}
        <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Airplay className="w-4 h-4 text-emerald-600" />
            <span>3. Caractéristiques du Climatiseur</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type de climatiseur *</label>
              <select
                value={typeclimatiseur}
                onChange={e => setTypeClimatiseur(e.target.value as TypeClimatiseur)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Marque *</label>
              <select
                value={marque}
                onChange={e => setMarque(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="Daikin">Daikin</option>
                <option value="Carrier">Carrier</option>
                <option value="LG">LG</option>
                <option value="Samsung">Samsung</option>
                <option value="Midea">Midea</option>
                <option value="Gree">Gree</option>
                <option value="Mitsubishi">Mitsubishi Heavy</option>
                <option value="Haier">Haier</option>
                <option value="Autre">Autre marque</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Puissance / Capacité *</label>
              <select
                value={puissance}
                onChange={e => setPuissance(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Modèle / Référence</label>
              <input
                type="text"
                placeholder="ex: Sensira FTXC35, Inverter R32"
                value={modele}
                onChange={e => setModele(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Quantité d'unités *</label>
              <input
                type="number"
                min="1"
                required
                value={quantite}
                onChange={e => setQuantite(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* 4. Tarifs, Paiements & Tâches */}
        <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Receipt className="w-4 h-4 text-purple-600" />
            <span>4. Montants, Tâche Réalisée & Observations</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Prix total convenu (DH) *</label>
              <input
                type="number"
                min="0"
                required
                value={prix}
                onChange={e => setPrix(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Montant payé / Encaissé (DH) *</label>
              <input
                type="number"
                min="0"
                required
                value={montantpaye}
                onChange={e => setMontantPaye(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-emerald-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Tâche réalisée / Description des travaux *</label>
              <input
                type="text"
                required
                placeholder="ex: Pose de l'unité intérieure + raccordement cuivre et tirage au vide"
                value={tacherealisee}
                onChange={e => setTacheRealisee(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Observation / Remarques complémentaires</label>
              <textarea
                rows={2}
                placeholder="ex: Client a validé le test de froid. Garantie compresseur 5 ans expliquée."
                value={observation}
                onChange={e => setObservation(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            Solde calculé automatiquement :{' '}
            <strong className="text-slate-800">
              {Math.max(0, Number(prix) - Number(montantpaye)).toLocaleString('fr-FR')} DH
            </strong>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsQuickInstallOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {loading ? 'Enregistrement...' : 'Enregistrer le dossier complet'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
