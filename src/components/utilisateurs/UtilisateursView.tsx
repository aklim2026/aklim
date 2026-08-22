import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { User, UserRole } from '../../types';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  UserCog,
  Plus,
  Shield,
  UserCheck,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Mail,
} from 'lucide-react';

export const UtilisateursView: React.FC = () => {
  const { users, refreshUsers, currentUser } = useAuth();
  const { addToast } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('utilisateur');
  const [actif, setActif] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingUser(null);
    setNom('');
    setEmail('');
    setPassword('123456');
    setRole('utilisateur');
    setActif(true);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setNom(u.nom);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
    setActif(u.actif);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !email) {
      addToast({ type: 'error', title: 'Erreur', message: 'Nom et Email sont requis.' });
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, {
          nom,
          email,
          role,
          actif,
          ...(password ? { motDePasse: password } : {}),
        });
        addToast({ type: 'success', title: 'Utilisateur modifié', message: 'Mise à jour réussie.' });
      } else {
        await api.createUser({
          nom,
          email,
          role,
          actif,
          motDePasse: password || '123456',
        });
        addToast({ type: 'success', title: 'Utilisateur créé', message: 'Le compte a été créé.' });
      }
      setIsModalOpen(false);
      refreshUsers();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Erreur', message: err.message || 'Échec de l’enregistrement.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteUser(deleteId);
      addToast({ type: 'success', title: 'Utilisateur supprimé', message: 'Le compte a été retiré.' });
      refreshUsers();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Erreur', message: err.message || 'Impossible de supprimer.' });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div id="utilisateurs-page" className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCog className="w-5 h-5 text-indigo-600" />
            <span>Gestion des Utilisateurs & Permissions</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Contrôle des accès, attributions des rôles (Administrateur vs Utilisateur)
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvel utilisateur</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table id="table-users" className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Nom & Utilisateur</th>
                <th className="p-3.5">Adresse Email</th>
                <th className="p-3.5">Rôle</th>
                <th className="p-3.5">Statut du Compte</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          u.role === 'admin'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}
                      >
                        {u.nom[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{u.nom}</div>
                        {currentUser?.id === u.id && (
                          <span className="text-[10px] text-blue-600 font-semibold">(Votre session actuelle)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-600 font-medium">{u.email}</td>
                  <td className="p-3.5">
                    {u.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                        <Shield className="w-3 h-3" /> Administrateur
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold">
                        <UserCheck className="w-3 h-3" /> Utilisateur Standard
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    {u.actif ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-500 font-medium">
                        <XCircle className="w-3.5 h-3.5" /> Désactivé
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {currentUser?.id !== u.id && (
                        <button
                          onClick={() => setDeleteId(u.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Modifier l’Utilisateur' : 'Créer un Compte Utilisateur'}
        subtitle="Affectation des droits d'accès et des informations de connexion"
        maxWidth="md"
        id="user-form-modal"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nom complet *</label>
            <input
              type="text"
              required
              value={nom}
              onChange={e => setNom(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Adresse Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {editingUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe initial *'}
            </label>
            <input
              type="password"
              placeholder={editingUser ? '••••••••' : 'Minimum 6 caractères'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Rôle et Permissions *</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="utilisateur">Utilisateur Standard (Saisie, consultation, création)</option>
              <option value="admin">Administrateur (Accès total, suppressions, configuration)</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="user-actif"
              checked={actif}
              onChange={e => setActif(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="user-actif" className="text-xs font-medium text-slate-700 cursor-pointer">
              Compte actif et autorisé à se connecter
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors"
            >
              {saving ? 'Enregistrement...' : editingUser ? 'Mettre à jour' : 'Créer l’utilisateur'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Supprimer cet utilisateur ?"
        message="Êtes-vous certain de vouloir révoquer et supprimer ce compte ?"
        confirmLabel="Oui, supprimer"
      />
    </div>
  );
};
