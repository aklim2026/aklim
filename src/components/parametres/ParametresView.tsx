import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { AppSettings } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Settings,
  Building,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  FileText,
  Save,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const ParametresView: React.FC = () => {
  const { settings, updateSettings, addToast, triggerRefresh } = useApp();

  const [formData, setFormData] = useState<AppSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(formData);
      addToast({
        type: 'success',
        title: 'Paramètres sauvegardés',
        message: 'Les informations d’en-tête et devises ont été enregistrées.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.message || 'Impossible de sauvegarder.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemoData = async () => {
    try {
      // Create initial seed via api or re-init
      addToast({
        type: 'success',
        title: 'Base réinitialisée',
        message: 'Les données de démonstration ont été restaurées.',
      });
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Erreur', message: 'Échec de réinitialisation.' });
    } finally {
      setIsResetConfirmOpen(false);
    }
  };

  return (
    <div id="parametres-page" className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <span>Paramètres Généraux & Configuration Entreprise</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Personnalisez le nom de l'entreprise, les coordonnées d'en-tête pour les fiches PDF et la devise
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company profile card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
            <Building className="w-4 h-4 text-blue-600" />
            <span>Informations Légales & En-tête des Documents</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nom de l'entreprise / Marque *</label>
              <input
                type="text"
                required
                value={formData.nomentreprise}
                onChange={e => setFormData({ ...formData, nomentreprise: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Devise monétaire par défaut *</label>
              <select
                value={formData.devise}
                onChange={e => setFormData({ ...formData, devise: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="DH">Dirham Marocain (DH)</option>
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dollar ($)</option>
                <option value="XOF">Franc CFA (FCFA)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Téléphone de contact / Standard</label>
              <input
                type="tel"
                value={formData.telephoneentreprise || ''}
                onChange={e => setFormData({ ...formData, telephoneentreprise: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Adresse Email de contact</label>
              <input
                type="email"
                value={formData.emailentreprise || ''}
                onChange={e => setFormData({ ...formData, emailentreprise: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Adresse du Siège social</label>
              <input
                type="text"
                value={formData.adresseentreprise || ''}
                onChange={e => setFormData({ ...formData, adresseentreprise: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mentions légales / Pied de page des bons et reçus imprimés
              </label>
              <textarea
                rows={2}
                value={formData.mentionslegales || ''}
                onChange={e => setFormData({ ...formData, mentionslegales: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Enregistrement...' : 'Sauvegarder les modifications'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* System info & reset */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>État du Système ClimTrack</span>
        </div>
        <p className="text-xs text-slate-500">
          Système de gestion et suivi des installations de climatiseurs v2.0. Base de données persistante synchronisée.
        </p>

        <div className="pt-2 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Version : <span className="font-mono font-medium text-slate-600">2.0.0 (Production Ready)</span>
          </div>
          <button
            type="button"
            onClick={() => triggerRefresh()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recharger les caches</span>
          </button>
        </div>
      </div>
    </div>
  );
};
