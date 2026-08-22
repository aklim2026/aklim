import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { RapportData } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportRapportPDF, exportToExcel } from '../../utils/exportUtils';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  Users,
  Wrench,
  Airplay,
  FileCheck2,
  DollarSign,
  TrendingUp,
  MapPin,
  CheckCircle2,
  FileText,
  Building2,
  Award,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const RapportsView: React.FC = () => {
  const { settings, refreshKey, addToast } = useApp();

  const [periodePreset, setPeriodePreset] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().split('T')[0]);

  const [report, setReport] = useState<RapportData | null>(null);
  const [loading, setLoading] = useState(true);

  const handlePresetChange = (preset: 'today' | 'week' | 'month' | 'year' | 'custom') => {
    setPeriodePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'today') {
      setDateDebut(todayStr);
      setDateFin(todayStr);
    } else if (preset === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setDateDebut(d.toISOString().split('T')[0]);
      setDateFin(todayStr);
    } else if (preset === 'month') {
      const d = new Date();
      d.setDate(1);
      setDateDebut(d.toISOString().split('T')[0]);
      setDateFin(todayStr);
    } else if (preset === 'year') {
      const d = new Date();
      d.setMonth(0);
      d.setDate(1);
      setDateDebut(d.toISOString().split('T')[0]);
      setDateFin(todayStr);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await api.generateRapport(dateDebut, dateFin);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [dateDebut, dateFin, refreshKey]);

  const handleExportPDF = () => {
    if (!report) return;
    try {
      exportRapportPDF(report, settings);
      addToast({
        type: 'success',
        title: 'Rapport PDF Officiel généré',
        message: 'Le document exécutif a été généré et téléchargé avec succès.',
      });
    } catch (err: any) {
      console.error(err);
      addToast({ type: 'error', title: 'Erreur', message: 'Échec de la génération PDF.' });
    }
  };

  const handleExportExcel = () => {
    if (!report) return;
    const summaryData = [
      { 'Indicateur': 'Période analysée', 'Valeur': `${formatDate(report.dateDebut)} au ${formatDate(report.dateFin)}` },
      { 'Indicateur': 'Total Clients enregistrés', 'Valeur': report.stats.totalClients },
      { 'Indicateur': 'Total Techniciens actifs', 'Valeur': report.stats.totalTechniciens },
      { 'Indicateur': 'Total Climatiseurs installés', 'Valeur': report.stats.totalClimatiseursInstalles },
      { 'Indicateur': 'Total Interventions réalisées', 'Valeur': report.stats.totalInterventions },
      { 'Indicateur': 'Total Montants Encaissés', 'Valeur': `${report.stats.totalEncaisse} ${settings.devise}` },
      { 'Indicateur': 'Total Soldes Restants', 'Valeur': `${report.stats.soldeRestantTotal} ${settings.devise}` },
    ];

    const techData = report.parTechnicien.map(t => ({
      'Technicien': t.nom,
      'Matricule': t.matricule,
      'Clients': t.clients,
      'Climatiseurs': t.clims,
      'Interventions': t.interventions,
      'Montant Encaissé (DH)': t.encaisse,
    }));

    exportToExcel(techData, `Rapport_ClimTrack_${report.dateDebut}_${report.dateFin}`, 'Synthèse Techniciens');
    addToast({ type: 'success', title: 'Exportation Excel', message: 'Fichier Excel téléchargé avec succès.' });
  };

  const totalCA = report ? (report.stats.totalEncaisse || 0) + (report.stats.soldeRestantTotal || 0) : 0;
  const tauxRecouvrement = totalCA > 0 && report
    ? Math.min(100, Math.round(((report.stats.totalEncaisse || 0) / totalCA) * 100))
    : 100;

  const COLORS = ['#2563eb', '#4f46e5', '#059669', '#d97706', '#dc2626', '#0284c7', '#8b5cf6'];

  return (
    <div id="rapports-page" className="space-y-6 animate-in fade-in duration-150">
      {/* Header with quick stats & action buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Édition Executive & Audit d'Exploitation</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-blue-400" />
            <span>Rapports d'Activité & Bilans Périodiques</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Générez des rapports PDF certifiés avec indicateurs de rentabilité, ventilation par technicien, couverture par quartier et visas officiels de validation.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportPDF}
            disabled={!report || loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger Rapport PDF Pro</span>
          </button>
          <button
            onClick={handleExportExcel}
            disabled={!report || loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exporter Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Date & Preset Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Période rapide :</span>
            </span>
            {(
              [
                { id: 'today', label: "Aujourd'hui" },
                { id: 'week', label: '7 derniers jours' },
                { id: 'month', label: 'Ce mois-ci' },
                { id: 'year', label: 'Année en cours' },
                { id: 'custom', label: 'Personnalisée' },
              ] as const
            ).map(p => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  periodePreset === p.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {report && (
            <div className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              Du <span className="font-bold text-slate-800">{formatDate(dateDebut)}</span> au <span className="font-bold text-slate-800">{formatDate(dateFin)}</span>
            </div>
          )}
        </div>

        {/* Custom date range inputs */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Date début :</span>
            <input
              type="date"
              value={dateDebut}
              onChange={e => {
                setDateDebut(e.target.value);
                setPeriodePreset('custom');
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Date fin :</span>
            <input
              type="date"
              value={dateFin}
              onChange={e => {
                setDateFin(e.target.value);
                setPeriodePreset('custom');
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <button
            onClick={loadReport}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-2xs transition-colors"
          >
            Actualiser le bilan
          </button>
        </div>
      </div>

      {loading || !report ? (
        <div className="py-20 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3" />
          <p>Calcul et compilation du rapport d'exploitation en cours...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Scorecards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="w-1.5 h-full bg-indigo-600 absolute left-0 top-0" />
              <div className="pl-1">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Clients</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">{report.stats.totalClients}</div>
                <span className="text-[10px] text-slate-400">Portefeuille actif</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="w-1.5 h-full bg-slate-900 absolute left-0 top-0" />
              <div className="pl-1">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Techniciens</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">{report.stats.totalTechniciens}</div>
                <span className="text-[10px] text-slate-400">Intervenants</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="w-1.5 h-full bg-blue-600 absolute left-0 top-0" />
              <div className="pl-1">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Climatiseurs</span>
                <div className="text-2xl font-extrabold text-blue-600 mt-1">{report.stats.totalClimatiseursInstalles}</div>
                <span className="text-[10px] text-blue-500 font-medium">Unités installées</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="w-1.5 h-full bg-amber-600 absolute left-0 top-0" />
              <div className="pl-1">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Interventions</span>
                <div className="text-2xl font-extrabold text-amber-600 mt-1">{report.stats.totalInterventions}</div>
                <span className="text-[10px] text-amber-500 font-medium">Poses & SAV</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="w-1.5 h-full bg-emerald-600 absolute left-0 top-0" />
              <div className="pl-1">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Encaissé</span>
                <div className="text-lg font-extrabold text-emerald-600 mt-1 truncate">
                  {formatCurrency(report.stats.totalEncaisse, settings.devise)}
                </div>
                <span className="text-[10px] text-emerald-600 font-bold">Taux : {tauxRecouvrement}%</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="w-1.5 h-full bg-rose-600 absolute left-0 top-0" />
              <div className="pl-1">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Créances Dues</span>
                <div className="text-lg font-extrabold text-rose-600 mt-1 truncate">
                  {formatCurrency(report.stats.soldeRestantTotal, settings.devise)}
                </div>
                <span className="text-[10px] text-rose-500 font-medium">À recouvrer</span>
              </div>
            </div>
          </div>

          {/* Financial Recovery Rate Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-xs border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bilan Financier & Recouvrement</span>
                <div className="text-lg font-bold text-white mt-0.5">
                  Chiffre d'Affaires Global : <span className="text-blue-400">{formatCurrency(totalCA, settings.devise)}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatCurrency(report.stats.totalEncaisse, settings.devise)} encaissés sur {formatCurrency(totalCA, settings.devise)} traités
                </p>
              </div>

              <div className="w-full md:w-80 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Taux d'encaissement</span>
                  <span className="font-bold text-emerald-400">{tauxRecouvrement}%</span>
                </div>
                <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden p-0.5 border border-slate-600">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${tauxRecouvrement}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Climatiseurs per tech */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Airplay className="w-4 h-4 text-blue-600" />
                  <span>Climatiseurs Posés par Technicien</span>
                </span>
                <span className="text-xs font-normal text-slate-400">Total : {report.stats.totalClimatiseursInstalles} unités</span>
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.parTechnicien} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="nom"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val: any) => [`${val} climatiseurs`, 'Installations']}
                      contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="clims" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CA per Quartier */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Chiffre d'Affaires par Quartier</span>
                </span>
                <span className="text-xs font-normal text-slate-400">Répartition géographique</span>
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.parQuartier} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="nom"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(val, settings.devise), 'Chiffre d\'Affaires']}
                      contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="chiffreAffaires" fill="#059669" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Breakdown by Technician */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-600" />
                <span>Bilan Détaillé par Technicien sur la Période</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {report.parTechnicien.length} technicien(s) recensé(s)
              </span>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-900 text-white font-semibold whitespace-nowrap">
                  <tr>
                    <th className="p-3 whitespace-nowrap">Technicien</th>
                    <th className="p-3 whitespace-nowrap">Matricule</th>
                    <th className="p-3 text-center whitespace-nowrap">Clients Suivis</th>
                    <th className="p-3 text-center whitespace-nowrap">Climatiseurs Posés</th>
                    <th className="p-3 text-center whitespace-nowrap">Interventions & SAV</th>
                    <th className="p-3 text-right whitespace-nowrap">Montant Encaissé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.parTechnicien.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-2 whitespace-nowrap">
                        <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <span className="whitespace-nowrap">{t.nom}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-500 font-medium whitespace-nowrap">{t.matricule}</td>
                      <td className="p-3 text-center font-semibold text-slate-700 whitespace-nowrap">{t.clients}</td>
                      <td className="p-3 text-center font-bold text-blue-600 whitespace-nowrap">{t.clims}</td>
                      <td className="p-3 text-center font-semibold text-slate-700 whitespace-nowrap">{t.interventions}</td>
                      <td className="p-3 text-right font-extrabold text-emerald-600 whitespace-nowrap">
                        {formatCurrency(t.encaisse, settings.devise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td className="p-3" colSpan={2}>TOTAL GÉNÉRAL</td>
                    <td className="p-3 text-center">{report.parTechnicien.reduce((s, t) => s + t.clients, 0)}</td>
                    <td className="p-3 text-center text-blue-600">{report.stats.totalClimatiseursInstalles}</td>
                    <td className="p-3 text-center">{report.stats.totalInterventions}</td>
                    <td className="p-3 text-right text-emerald-600">{formatCurrency(report.stats.totalEncaisse, settings.devise)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Breakdown by Quartier */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Bilan & Couverture par Quartier / Zone</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {report.parQuartier.length} quartier(s) analysé(s)
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-teal-900 text-white font-semibold">
                  <tr>
                    <th className="p-3">Quartier / Zone d'Activité</th>
                    <th className="p-3 text-center">Clients Enregistrés</th>
                    <th className="p-3 text-center">Climatiseurs Installés</th>
                    <th className="p-3 text-right">Chiffre d'Affaires Réalisé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.parQuartier.map((q, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span>{q.nom}</span>
                      </td>
                      <td className="p-3 text-center font-semibold text-slate-700">{q.clients}</td>
                      <td className="p-3 text-center font-bold text-emerald-600">{q.installations}</td>
                      <td className="p-3 text-right font-extrabold text-slate-900">
                        {formatCurrency(q.chiffreAffaires, settings.devise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td className="p-3">TOTAL PAR QUARTIERS</td>
                    <td className="p-3 text-center">{report.parQuartier.reduce((s, q) => s + q.clients, 0)}</td>
                    <td className="p-3 text-center text-emerald-600">{report.parQuartier.reduce((s, q) => s + q.installations, 0)}</td>
                    <td className="p-3 text-right text-slate-900">
                      {formatCurrency(report.parQuartier.reduce((s, q) => s + q.chiffreAffaires, 0), settings.devise)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
