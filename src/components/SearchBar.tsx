import React, { useState } from 'react';
import { Search, Loader2, X, Sparkles, KeyRound } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface SearchBarProps {
  onOpenTokenModal: () => void;
}

const POPULAR_USERS = ['torvalds', 'facebook', 'vercel', 'vuejs', 'shadcn', 'octocat'];

export const SearchBar: React.FC<SearchBarProps> = ({ onOpenTokenModal }) => {
  const { searchUser, username: currentUsername, loading, token } = useAppContext();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      searchUser(query.trim());
    }
  };

  const handleQuickSelect = (user: string) => {
    setQuery(user);
    searchUser(user);
  };

  const handleClear = () => {
    setQuery('');
  };

  const isSearching = loading.user || loading.repos;

  return (
    <div className="w-full" id="github-search-section">
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>

          <input
            id="github-username-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite um usuário do GitHub (ex: torvalds, vercel, gaearon)..."
            aria-label="Nome de usuário do GitHub"
            className="w-full pl-11 pr-10 py-3 bg-slate-100 dark:bg-slate-950/80 hover:bg-slate-200/70 dark:hover:bg-slate-950 focus:bg-white dark:focus:bg-slate-950 text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 text-sm md:text-base rounded-2xl border border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/30 shadow-inner transition-all outline-none"
            disabled={isSearching}
          />

          {query && !isSearching && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              aria-label="Limpar campo de busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-indigo-500 dark:text-indigo-400">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
        </div>

        <button
          id="search-submit-btn"
          type="submit"
          disabled={!query.trim() || isSearching}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white font-medium text-sm rounded-2xl transition-all shadow-md hover:shadow-indigo-500/20 active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Buscando...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Explorar</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenTokenModal}
          title={token ? 'GitHub PAT ativo (5.000 req/h)' : 'Configurar Token GitHub PAT'}
          aria-label="Configurar Token GitHub"
          className={`p-3 rounded-2xl border transition-all flex items-center justify-center shrink-0 ${
            token
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
              : 'bg-slate-100 dark:bg-slate-900/90 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:border-slate-700'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          {token && <span className="hidden md:inline text-xs font-mono ml-1.5 font-medium">PAT OK</span>}
        </button>
      </form>

      {/* Sugestões rápidas de perfis para facilitar testes */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 mr-1">
          <Sparkles className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> Sugestões:
        </span>
        {POPULAR_USERS.map((user) => (
          <button
            key={user}
            type="button"
            onClick={() => handleQuickSelect(user)}
            className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              currentUsername.toLowerCase() === user.toLowerCase()
                ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-600/60 font-semibold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            @{user}
          </button>
        ))}
      </div>
    </div>
  );
};
