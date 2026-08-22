import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { SearchResult } from '../../types';
import {
  Search,
  User,
  Wrench,
  Airplay,
  FileCheck2,
  Receipt,
  X,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { getStatusBadgeClass } from '../../utils/formatters';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    setSelectedClientId,
    setSelectedTechnicienId,
    setSelectedInstallationId,
    setActiveTab,
  } = useApp();

  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.search(query);
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isSearchOpen) return null;

  const filteredResults = filterType === 'all'
    ? results
    : results.filter(r => r.type === filterType);

  const handleSelectResult = (result: SearchResult) => {
    setIsSearchOpen(false);
    if (result.type === 'client') {
      setSelectedClientId(result.id);
      setActiveTab('clients');
    } else if (result.type === 'technicien') {
      setSelectedTechnicienId(result.id);
      setActiveTab('techniciens');
    } else if (result.type === 'installation') {
      setSelectedInstallationId(result.id);
      setActiveTab('installations');
    } else if (result.type === 'intervention') {
      setActiveTab('interventions');
    } else if (result.type === 'paiement') {
      setActiveTab('paiements');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <User className="w-5 h-5 text-blue-600" />;
      case 'technicien':
        return <Wrench className="w-5 h-5 text-indigo-600" />;
      case 'installation':
        return <Airplay className="w-5 h-5 text-emerald-600" />;
      case 'intervention':
        return <FileCheck2 className="w-5 h-5 text-amber-600" />;
      case 'paiement':
        return <Receipt className="w-5 h-5 text-purple-600" />;
      default:
        return <Search className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div
      id="global-search-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) setIsSearchOpen(false);
      }}
    >
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">
        {/* Search Bar Input */}
        <div className="flex items-center px-4 sm:px-6 py-4 border-b border-slate-100 gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            id="input-global-search"
            type="text"
            placeholder="Rechercher par nom, prénom, téléphone (ex: 0612...), N° bon, N° contrôle, quartier, technicien..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent border-0 text-slate-900 placeholder:text-slate-400 text-base focus:ring-0 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-mono font-medium text-slate-400 bg-slate-200/60 rounded border border-slate-300">
            ESC
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-50 border-b border-slate-100 text-xs overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="text-slate-500 font-medium mr-1">Filtrer:</span>
          {[
            { id: 'all', label: 'Tous' },
            { id: 'client', label: 'Clients' },
            { id: 'technicien', label: 'Techniciens' },
            { id: 'installation', label: 'Installations' },
            { id: 'intervention', label: 'Interventions' },
            { id: 'paiement', label: 'Paiements' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1 rounded-full font-medium transition-colors whitespace-nowrap ${
                filterType === f.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          {loading && (
            <div className="py-12 text-center text-slate-400 text-sm">
              Recherche instantanée en cours...
            </div>
          )}

          {!loading && query && filteredResults.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">
              Aucun résultat trouvé pour <strong className="text-slate-700">« {query} »</strong>
            </div>
          )}

          {!loading && !query && (
            <div className="py-8 text-center text-slate-400 text-sm">
              <div className="max-w-md mx-auto space-y-2">
                <p className="font-medium text-slate-600">Recherche rapide intelligente</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tapez le prénom d'un technicien (<span className="text-indigo-600 font-medium">Ahmed</span>), un téléphone (<span className="text-indigo-600 font-medium">0612345678</span>), un N° de bon (<span className="text-indigo-600 font-medium">BON-1001</span>), un N° de contrôle (<span className="text-indigo-600 font-medium">CTRL-2026-001</span>) ou un quartier (<span className="text-indigo-600 font-medium">Maârif</span>).
                </p>
              </div>
            </div>
          )}

          {!loading &&
            filteredResults.map(result => (
              <div
                key={`${result.type}-${result.id}`}
                id={`search-result-${result.id}`}
                onClick={() => handleSelectResult(result)}
                className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-white group-hover:shadow-xs transition-colors flex-shrink-0">
                    {getIcon(result.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                        {result.title}
                      </span>
                      {result.badge && (
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ring-1 ring-inset ${getStatusBadgeClass(
                            result.badge
                          )}`}
                        >
                          {result.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate max-w-lg">
                      {result.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-slate-300 group-hover:text-blue-600 transition-colors ml-3 flex-shrink-0">
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
