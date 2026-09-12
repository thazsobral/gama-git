import React, { useState, useMemo } from 'react';
import { Star, GitFork, GitBranch, Search, Calendar, Code, ArrowUpDown } from 'lucide-react';
import { GitHubRepo } from '../types';
import { useGitHub } from '../hooks/useGitHub';
import { LoadingSpinner } from './LoadingSpinner';

interface RepoListProps {
  onSelectRepo: (repo: GitHubRepo) => void;
}

// Mapeamento de cores populares de linguagens para os dots do GitHub
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Shell: '#89e051',
};

type SortOption = 'updated' | 'stars' | 'name';

export const RepoList: React.FC<RepoListProps> = ({ onSelectRepo }) => {
  const {
    filteredRepos,
    selectedRepo,
    repoFilterQuery,
    setRepoFilterQuery,
    loading,
    formatRelativeTime,
  } = useGitHub();

  const [sortBy, setSortBy] = useState<SortOption>('updated');

  const sortedRepos = useMemo(() => {
    return [...filteredRepos].sort((a, b) => {
      if (sortBy === 'stars') {
        return b.stargazers_count - a.stargazers_count;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      // 'updated' (padrão)
      return new Date(b.pushed_at || b.updated_at).getTime() - new Date(a.pushed_at || a.updated_at).getTime();
    });
  }, [filteredRepos, sortBy]);

  if (loading.repos) {
    return <LoadingSpinner message="Carregando repositórios do usuário..." />;
  }

  if (filteredRepos.length === 0 && !repoFilterQuery) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-800/40 rounded-2xl border border-slate-700/60">
        <p className="text-sm">Nenhum repositório público encontrado para este usuário.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" id="repo-list-container">
      {/* Barra de filtro e ordenação de repositórios */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-1">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={repoFilterQuery}
            onChange={(e) => setRepoFilterQuery(e.target.value)}
            placeholder="Filtrar repositórios por nome ou linguagem..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="updated">Mais recentes</option>
            <option value="stars">Mais estrelas</option>
            <option value="name">Alfabética (A-Z)</option>
          </select>
        </div>
      </div>

      {sortedRepos.length === 0 && repoFilterQuery && (
        <p className="text-xs text-slate-500 dark:text-slate-400 p-4 text-center">
          Nenhum repositório corresponde a "{repoFilterQuery}".
        </p>
      )}

      {/* Lista com barra de rolagem customizada */}
      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {sortedRepos.map((repo) => {
          const isSelected = selectedRepo?.id === repo.id;
          const langColor = repo.language ? LANGUAGE_COLORS[repo.language] || '#94a3b8' : null;

          return (
            <div
              key={repo.id}
              id={`repo-item-${repo.id}`}
              onClick={() => onSelectRepo(repo)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                isSelected
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500/80 dark:border-indigo-500/70 shadow-md ring-1 ring-indigo-500/30'
                  : 'bg-white dark:bg-slate-950/60 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-300 transition truncate flex items-center gap-1.5">
                  <span className="truncate">{repo.name}</span>
                  {repo.fork && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1.5 py-0.2 rounded shrink-0">
                      fork
                    </span>
                  )}
                </h3>

                <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 shrink-0 font-medium font-mono">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{repo.stargazers_count}</span>
                </div>
              </div>

              {repo.description ? (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {repo.description}
                </p>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-1">Sem descrição.</p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                {repo.language && (
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: langColor || '#94a3b8' }}
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-300">{repo.language}</span>
                  </div>
                )}

                {repo.forks_count > 0 && (
                  <div className="flex items-center gap-1">
                    <GitFork className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    <span>{repo.forks_count}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400" title="Branch padrão">
                  <GitBranch className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                    {repo.default_branch}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 ml-auto">
                  <Calendar className="w-3 h-3" />
                  <span>{formatRelativeTime(repo.pushed_at || repo.updated_at)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
