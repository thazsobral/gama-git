import React from 'react';
import { GitPullRequest, Github, KeyRound, ExternalLink, RefreshCw } from 'lucide-react';
import { useGitHub } from '../hooks/useGitHub';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  onOpenTokenModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenTokenModal }) => {
  const {
    username,
    selectedRepo,
    selectedBranch,
    token,
    resetAll,
    unselectRepo,
  } = useGitHub();

  return (
    <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0b0f19]/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo / Título */}
        <div className="flex items-center gap-3">
          <button
            onClick={resetAll}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            title="Voltar à tela inicial"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base md:text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                Gama<span className="text-indigo-600 dark:text-indigo-400">Git</span>
                <span className="text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300">
                  v2.0
                </span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Explorador de Repositórios & Commits
              </p>
            </div>
          </button>

          {/* Breadcrumb contextual se houver usuário e repositório selecionado */}
          {username && (
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pl-4 border-l border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 dark:text-slate-500">Usuário:</span>
              {selectedRepo ? (
                <button
                  type="button"
                  onClick={unselectRepo}
                  className="font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition hover:underline"
                  title="Voltar à lista de repositórios"
                >
                  @{username}
                </button>
              ) : (
                <span className="font-medium text-slate-700 dark:text-slate-200">@{username}</span>
              )}

              {selectedRepo && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">/</span>
                  <span className="text-slate-400 dark:text-slate-500">Repo:</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-300">{selectedRepo.name}</span>

                  {selectedBranch && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">/</span>
                      <span className="font-mono text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-300/60 dark:border-amber-700/50">
                        {selectedBranch}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Ações à direita: Alternador de tema, Token e link GitHub */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Seletor de Tema (Claro / Escuro / Sistema) */}
          <ThemeToggle />

          <button
            type="button"
            onClick={onOpenTokenModal}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              token
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                : 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-750'
            }`}
            title="Configurar GitHub Personal Access Token"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {token ? 'Token Ativo (5k req/h)' : 'Adicionar Token'}
            </span>
          </button>

          <a
            id="github-repo-link"
            href="https://github.com/thazsobral/gama-git"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            title="Ver repositório no GitHub (thazsobral/gama-git)"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
    </header>
  );
};
