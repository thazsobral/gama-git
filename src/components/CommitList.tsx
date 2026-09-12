import React, { useState } from 'react';
import {
  GitCommit,
  User,
  Calendar,
  Search,
  Copy,
  Check,
  GitMerge,
  ChevronRight,
  FilterX,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { useGitHub } from '../hooks/useGitHub';
import { LoadingSpinner } from './LoadingSpinner';

export const CommitList: React.FC = () => {
  const {
    filteredCommits,
    commits,
    commitFilterQuery,
    setCommitFilterQuery,
    selectCommit,
    selectedCommit,
    loading,
    formatSha,
    formatRelativeTime,
    formatDateTime,
    selectedBranch,
    hasMoreCommits,
    isLoadingMoreCommits,
    loadMoreCommits,
  } = useGitHub();

  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, sha: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 1500);
  };

  if (loading.commits) {
    return <LoadingSpinner message={`Carregando commits da branch "${selectedBranch}"...`} />;
  }

  return (
    <div className="space-y-3" id="commits-list-section">
      {/* Campo de busca para filtrar commits */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="commit-search-filter"
            type="text"
            value={commitFilterQuery}
            onChange={(e) => setCommitFilterQuery(e.target.value)}
            placeholder="Filtrar commits por mensagem, autor ou hash..."
            className="w-full pl-9 pr-8 py-2 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-indigo-500 transition"
          />
          {commitFilterQuery && (
            <button
              onClick={() => setCommitFilterQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs"
              title="Limpar filtro"
            >
              ×
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1.5 font-medium">
          <GitCommit className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>
            Exibindo <strong className="text-slate-800 dark:text-slate-200">{filteredCommits.length}</strong> de {commits.length} commits
          </span>
        </div>
      </div>

      {/* Lista de commits */}
      {filteredCommits.length === 0 ? (
        <div className="p-8 text-center bg-white/80 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 space-y-2">
          <FilterX className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500" />
          <p className="text-sm font-medium text-slate-800 dark:text-slate-300">Nenhum commit encontrado.</p>
          {commitFilterQuery ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nenhum commit corresponde à busca "{commitFilterQuery}".
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Esta branch ainda não possui commits registrados.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
          {filteredCommits.map((item) => {
            const isSelected = selectedCommit?.sha === item.sha;
            const isMergeCommit = item.parents && item.parents.length > 1;
            const fullMessage = item.commit.message;
            const [firstLine, ...rest] = fullMessage.split('\n');
            const hasBody = rest.filter((l) => l.trim().length > 0).length > 0;
            const authorDate = item.commit.author.date;

            return (
              <div
                key={item.sha}
                id={`commit-row-${item.sha}`}
                onClick={() => selectCommit(item.sha)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left group flex items-start gap-3 ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500/80 dark:border-indigo-500/70 shadow-md ring-1 ring-indigo-500/30'
                    : 'bg-white dark:bg-slate-950/60 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                {/* Ícone ou avatar do autor */}
                <div className="shrink-0 mt-0.5">
                  {item.author?.avatar_url ? (
                    <img
                      src={item.author.avatar_url}
                      alt={item.commit.author.name}
                      className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                      title={`${item.commit.author.name} (@${item.author.login})`}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Conteúdo principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs md:text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition leading-snug break-words">
                      {firstLine}
                      {hasBody && (
                        <span
                          className="ml-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1 py-0.2 rounded inline-block"
                          title="Possui corpo detalhado"
                        >
                          ...
                        </span>
                      )}
                    </p>

                    {/* Hash curto e botão copiar */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleCopy(e, item.sha)}
                        title="Copiar hash do commit"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
                      >
                        {copiedSha === item.sha ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-700 dark:text-emerald-300">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>{formatSha(item.sha)}</span>
                          </>
                        )}
                      </button>

                      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition hidden sm:block" />
                    </div>
                  </div>

                  {/* Metadados: Autor, data, merge commit */}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      {item.commit.author.name}
                      {item.author?.login && (
                        <span className="text-slate-400 dark:text-slate-500 font-normal">@{item.author.login}</span>
                      )}
                    </span>

                    <span className="text-slate-300 dark:text-slate-700">•</span>

                    <span
                      className="flex items-center gap-1 text-slate-500 dark:text-slate-400"
                      title={formatDateTime(authorDate)}
                    >
                      <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <span>{formatRelativeTime(authorDate)}</span>
                    </span>

                    {isMergeCommit && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 px-1.5 py-0.5 rounded font-medium">
                        <GitMerge className="w-2.5 h-2.5" />
                        Merge commit
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Botão ou Indicador de Carregar Mais Commits */}
          {hasMoreCommits ? (
            <div className="pt-2 flex flex-col items-center gap-2">
              <button
                id="btn-load-more-commits"
                type="button"
                onClick={() => loadMoreCommits()}
                disabled={isLoadingMoreCommits}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {isLoadingMoreCommits ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                    <span>Buscando mais commits na branch...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Carregar mais commits ({commits.length} já carregados)</span>
                  </>
                )}
              </button>
              {commitFilterQuery && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  O filtro atual busca entre os {commits.length} commits já carregados. Carregue mais para pesquisar em commits anteriores.
                </p>
              )}
            </div>
          ) : (
            commits.length > 0 && (
              <div className="pt-3 pb-1 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 border-t border-slate-100 dark:border-slate-800/60">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Todos os commits disponíveis desta branch foram carregados (total: {commits.length}).</span>
              </div>
            )
          )}
        </div>
      )}

      {/* Caso o filtro não encontre nada, mas existam mais commits na branch */}
      {filteredCommits.length === 0 && hasMoreCommits && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => loadMoreCommits()}
            disabled={isLoadingMoreCommits}
            className="px-5 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            {isLoadingMoreCommits ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                <span>Buscando commits mais antigos...</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Carregar mais commits da branch</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
