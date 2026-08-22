import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { DashboardStats } from '../../types';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/formatters';
import {
  Users,
  Wrench,
  Airplay,
  Clock,
  CheckCircle2,
  FileCheck2,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Plus,
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
  AreaChart,
  Area,
  Legend,
} from 'recharts';

export const DashboardView: React.FC = () => {
  const {
    settings,
    refreshKey,
    setIsQuickInstallOpen,
    setSelectedClientId,
    setSelectedTechnicienId,
    setSelectedInstallationId,
    setActiveTab,
  } = useApp();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getDashboardStats()
      .then(res => setStats(res))
      .catch(err => console.error('Failed to load dashboard stats:', err))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Clients',
      value: stats.totalClients,
      sub: 'Enregistrés dans la base',
      icon: Users,
      color: 'blue',
      tab: 'clients',
    },
    {
      title: 'Techniciens',
      value: stats.totalTechniciens,
      sub: 'Équipes de terrain actives',
      icon: Wrench,
      color: 'indigo',
      tab: 'techniciens',
    },
    {
      title: 'Climatiseurs Installés',
      value: stats.totalClimatiseursInstalles,
      sub: `${stats.installationsTerminees} installations validées`,
      icon: Airplay,
      color: 'emerald',
      tab: 'installations',
    },
    {
      title: 'En Cours / Affectées',
      value: stats.installationsEnCours,
      sub: 'Chantiers actifs',
      icon: Clock,
      color: 'amber',
      tab: 'installations',
    },
    {
      title: 'Total Interventions',
      value: stats.totalInterventions,
      sub: 'Tâches, contrôles & SAV',
      icon: FileCheck2,
      color: 'cyan',
      tab: 'interventions',
    },
    {
      title: 'Total Encaissé',
      value: formatCurrency(stats.totalEncaisse, settings.devise),
      sub: `Solde dû: ${formatCurrency(stats.soldeRestantTotal, settings.devise)}`,
      icon: DollarSign,
      color: 'emerald',
      highlight: true,
      tab: 'paiements',
    },
  ];

  return (
    <div id="dashboard-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl text-white shadow-xl shadow-slate-900/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Tableau de Bord
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Suivi en temps réel des chantiers & techniciens.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="btn-dash-new-install"
            onClick={() => setIsQuickInstallOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Installation</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              id={`kpi-card-${idx}`}
              onClick={() => kpi.tab && setActiveTab(kpi.tab as any)}
              className={`bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group flex flex-col justify-between ${idx === 5 ? 'col-span-2 lg:col-span-1' : ''}`}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 truncate">{kpi.title}</span>
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-50 group-hover:bg-blue-50 text-slate-700 group-hover:text-blue-600 transition-colors">
                  <Icon className="w-3.5 h-3.5 sm:w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-base sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                  {kpi.value}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">{kpi.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Installations par Technicien */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Installations par Technicien</h3>
              <p className="text-xs text-slate-500">Nombre de climatiseurs installés par agent</p>
            </div>
            <button
              onClick={() => setActiveTab('techniciens')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Voir tout <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.installationsParTechnicien} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: any) => [`${val} unités`, 'Installés']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', border: 'none' }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Répartition par Quartier */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Clients par Quartier</h3>
              <p className="text-xs text-slate-500">Distribution géographique des installations</p>
            </div>
            <button
              onClick={() => setActiveTab('quartiers')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Quartiers <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.clientsParQuartier} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip
                  formatter={(val: any) => [`${val} clients`, 'Clients']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', border: 'none' }}
                />
                <Bar dataKey="count" fill="#10B981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Évolution Mensuelle des Encaissements & Installations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Encaissements Mensuels (DH)</h3>
            <p className="text-xs text-slate-500">Flux financier collecté au fil des mois</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.montantsEncaissesParMois} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEncaisse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => `${v / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString('fr-FR')} DH`, 'Encaissé']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', border: 'none' }}
                />
                <Area type="monotone" dataKey="montant" stroke="#8B5CF6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEncaisse)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Statut des Installations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Répartition par Statut</h3>
            <p className="text-xs text-slate-500">Avancement des dossiers d'installation</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.installationsParStatut}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stats.installationsParStatut.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} unités`, name]}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', border: 'none' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Technicians Performance */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Performance des Techniciens</h3>
            <p className="text-xs text-slate-500">Calcul automatique des clients, climatisations et encaissements</p>
          </div>
          <button
            onClick={() => setActiveTab('techniciens')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Fiches détaillées <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.topTechniciens.map((tech, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-blue-200 hover:shadow-xs transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{tech.nom}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-medium">
                  {tech.matricule}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-200/60">
                <div>
                  <div className="text-xs text-slate-400">Clients</div>
                  <div className="text-sm font-bold text-slate-800">{tech.clients}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Clims</div>
                  <div className="text-sm font-bold text-blue-600">{tech.clims}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Encaissé</div>
                  <div className="text-xs font-bold text-emerald-700">{formatCurrency(tech.encaisse, settings.devise)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Installations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Dernières Installations</h3>
            <button
              onClick={() => setActiveTab('installations')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Voir tout ({stats.recentInstallations.length})
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.recentInstallations.map(inst => (
              <div
                key={inst.id}
                onClick={() => {
                  setSelectedInstallationId(inst.id);
                  setActiveTab('installations');
                }}
                className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900 truncate">
                      {inst.marque} {inst.puissance} (x{inst.quantite})
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ring-1 ring-inset ${getStatusBadgeClass(inst.statut)}`}>
                      {inst.statut}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Client: <strong className="text-slate-600">{inst.clientnom}</strong> | Bon: {inst.numerobon} | Tech: {inst.techniciennom}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="text-xs font-bold text-slate-900">{formatCurrency(inst.prix, settings.devise)}</div>
                  <div className="text-[10px] text-slate-400">{formatDate(inst.dateinstallation)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Derniers Encaissements</h3>
            <button
              onClick={() => setActiveTab('paiements')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Voir tout
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.recentPaiements.map(pay => (
              <div
                key={pay.id}
                onClick={() => setActiveTab('paiements')}
                className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-slate-900 truncate">
                    {pay.clientnom} - {pay.numerobon}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Encaissé par: {pay.techniciennom} ({pay.modepaiement})
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="text-xs font-bold text-emerald-600">
                    +{formatCurrency(pay.montant, settings.devise)}
                  </div>
                  <div className="text-[10px] text-slate-400">{formatDate(pay.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
