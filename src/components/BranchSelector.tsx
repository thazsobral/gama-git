import React, { useState } from 'react';
import { GitBranch, Star, ChevronDown, Check, Loader2 } from 'lucide-react';
import { useGitHub } from '../hooks/useGitHub';
import { GitHubBranch } from '../types';

export const BranchSelector: React.FC = () => {
  const {
    branches,
    selectedBranch,
    selectBranch,
    defaultBranchName,
    loading,
    selectedRepo,
  } = useGitHub();

  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  if (!selectedRepo) return null;

  const isBranchesLoading = loading.branches;

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleSelect = (branchName: string) => {
    selectBranch(branchName);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" id="branch-selector-wrapper">
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
          Branch:
        </label>

        {/* Botão de Dropdown principal */}
        <button
          type="button"
          id="branch-selector-btn"
          disabled={isBranchesLoading || branches.length === 0}
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-950/80 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 rounded-xl text-xs font-mono font-medium shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          {isBranchesLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500 dark:text-indigo-400" />
              <span>Carregando branches...</span>
            </>
          ) : (
            <>
              <span className="truncate max-w-[150px] sm:max-w-[220px]">
                {selectedBranch || defaultBranchName}
              </span>

              {selectedBranch === defaultBranchName && (
                <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 text-[10px] px-1.5 py-0.5 rounded font-sans font-semibold">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" /> Padrão
                </span>
              )}

              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </>
          )}
        </button>

        {branches.length > 0 && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
            ({branches.length} {branches.length === 1 ? 'branch' : 'branches'})
          </span>
        )}
      </div>

      {/* Menu suspenso dropdown com busca de branch */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-30 py-2 overflow-hidden animate-fade-in">
            <div className="px-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filtrar branches..."
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto py-1">
              {filteredBranches.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 px-3 py-2 text-center">
                  Nenhuma branch encontrada.
                </p>
              ) : (
                filteredBranches.map((branch: GitHubBranch) => {
                  const isCurrent = branch.name === selectedBranch;
                  const isDefault = branch.name === defaultBranchName;

                  return (
                    <button
                      key={branch.name}
                      type="button"
                      onClick={() => handleSelect(branch.name)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <GitBranch className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono truncate">{branch.name}</span>
                        {isDefault && (
                          <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-700/50 px-1 rounded shrink-0 font-medium">
                            padrão
                          </span>
                        )}
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
