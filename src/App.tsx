/**
 * Aplicação Gama Git Explorer
 * Evolução do projeto gama-git com busca de usuários, exploração de repositórios,
 * seletor de branches, histórico detalhado de commits e grafo visual de ramificações.
 */
import React, { useState } from 'react';
import {
  GitBranch,
  GitCommit,
  GitFork,
  Star,
  ExternalLink,
  List,
  GitGraph,
  BarChart3,
  ArrowLeft,
  FolderGit2,
  Sparkles,
  Info,
} from 'lucide-react';
import { AppProvider, useAppContext } from './context/AppContext';
import { useGitHub } from './hooks/useGitHub';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { UserProfileCard } from './components/UserProfileCard';
import { RepoList } from './components/RepoList';
import { BranchSelector } from './components/BranchSelector';
import { CommitList } from './components/CommitList';
import { CommitGraph } from './components/CommitGraph';
import { CommitDetail } from './components/CommitDetail';
import { RepoActivityAnalytics } from './components/RepoActivityAnalytics';
import { ErrorMessage } from './components/ErrorMessage';
import { TokenModal } from './components/TokenModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import TimeMachine from './components/TimeMachine';

const MainContent: React.FC = () => {
  const {
    userProfile,
    repos,
    selectedRepo,
    selectedBranch,
    branches,
    owner,
    repo,
    currentBranch,
    commits,
    viewMode,
    setViewMode,
    selectRepo,
    unselectRepo,
    selectBranch,
    loading,
    error,
    clearError,
    searchUser,
    username,
  } = useGitHub();

  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  const handleRetry = () => {
    if (selectedRepo && selectedBranch) {
      selectBranch(selectedBranch);
    } else if (selectedRepo) {
      selectRepo(selectedRepo);
    } else if (username) {
      searchUser(username);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Header onOpenTokenModal={() => setIsTokenModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner de Boas-vindas e Campo de Busca */}
        <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-5 md:p-7 shadow-xl backdrop-blur-sm">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 mb-2.5">
              <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              Gama Git Explorer 2.0
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
              Explorador de Repositórios & Histórico de Commits
            </h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
              Consulte qualquer perfil público do GitHub, navegue pelas branches, explore o grafo de
              ramificações e inspecione commits com estatísticas e arquivos alterados em tempo real.
            </p>
          </div>

          <div className="mt-5">
            <SearchBar onOpenTokenModal={() => setIsTokenModalOpen(true)} />
          </div>
        </div>

        {/* Mensagem de Erro com Ações de Recuperação */}
        {error && (
          <ErrorMessage
            error={error}
            onRetry={handleRetry}
            onOpenTokenModal={() => setIsTokenModalOpen(true)}
            onDismiss={clearError}
          />
        )}

        {/* Estado Inicial: Quando nenhum usuário foi pesquisado ainda */}
        {!userProfile && !loading.user && (
          <div className="py-12 px-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 text-center max-w-2xl mx-auto space-y-6 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <FolderGit2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Nenhum usuário selecionado</h3>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                Digite um nome de usuário na caixa de busca acima ou clique em uma das sugestões rápidas
                para listar repositórios, branches e o histórico de commits.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-xl mx-auto pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" /> 1. Repositórios
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Listagem ordenada com estrelas, forks, linguagem e última atualização.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" /> 2. Branches
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Seletor interativo com destaque para a branch padrão (main/master).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs flex items-center gap-1.5">
                  <GitGraph className="w-3.5 h-3.5" /> 3. Grafo & Diff
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Visualização em árvore de commits e lista detalhada de arquivos alterados.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Informações do Usuário Pesquisado */}
        {userProfile && (
          <UserProfileCard user={userProfile} reposCount={repos.length} />
        )}

        {/* Área Principal de Trabalho (Grid com Lista de Repositórios e Histórico de Commits) */}
        {userProfile && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Coluna Esquerda: Repositórios */}
            <div
              className={`lg:col-span-4 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-lg ${
                selectedRepo ? 'hidden lg:block' : 'block'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Repositórios ({repos.length})
                </h2>
              </div>

              <RepoList onSelectRepo={(repo) => selectRepo(repo)} />
            </div>

            {/* Coluna Direita: Detalhes do Repositório Selecionado e Commits */}
            <div
              className={`lg:col-span-8 space-y-4 ${
                !selectedRepo ? 'hidden lg:block' : 'block'
              }`}
            >
              {selectedRepo ? (
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-lg space-y-5">
                  {/* Cabeçalho do Repositório Selecionado */}
                  <div>
                    {/* Botão voltar aos repositórios */}
                    <button
                      type="button"
                      id="back-to-repos-btn"
                      onClick={() => unselectRepo()}
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-3 px-2.5 py-1.5 rounded-xl bg-indigo-50/70 hover:bg-indigo-100 dark:bg-slate-800/90 dark:hover:bg-slate-800 border border-indigo-200/60 dark:border-slate-700/60 transition cursor-pointer font-medium"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Voltar aos repositórios
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white truncate">
                            {selectedRepo.name}
                          </h3>
                          <a
                            href={selectedRepo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Ver repositório no GitHub"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                        {selectedRepo.description && (
                          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            {selectedRepo.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs shrink-0">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 font-medium">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {selectedRepo.stargazers_count}
                        </span>

                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                          <GitFork className="w-3.5 h-3.5 text-slate-400" />
                          {selectedRepo.forks_count}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Barra de Controles: Seletor de Branch e Alternador de Visualização (Lista vs Grafo) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <BranchSelector />

                    {/* Alternador de Modo de Visualização */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
                      <button
                        type="button"
                        id="view-mode-list-btn"
                        onClick={() => setViewMode('list')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                          viewMode === 'list'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-900'
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                        <span>Lista de Commits</span>
                      </button>

                      <button
                        type="button"
                        id="view-mode-graph-btn"
                        onClick={() => setViewMode('graph')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                          viewMode === 'graph'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-900'
                        }`}
                      >
                        <GitGraph className="w-3.5 h-3.5" />
                        <span>Grafo em Árvore</span>
                      </button>

                      <button
                        type="button"
                        id="view-mode-analytics-btn"
                        onClick={() => setViewMode('analytics')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                          viewMode === 'analytics'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-900'
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Análise de Atividade</span>
                      </button>
                    </div>
                  </div>

                  {/* Máquina do Tempo: Geração de GIF animado da evolução da estrutura de pastas commit por commit */}
                  {selectedRepo && (
                    <TimeMachine
                      owner={owner || selectedRepo.owner.login}
                      repo={repo || selectedRepo.name}
                      branches={branches}
                      currentBranch={currentBranch || selectedBranch}
                    />
                  )}

                  {/* Exibição dos Commits: Lista, Grafo ou Análise de Atividade */}
                  <div>
                    {viewMode === 'list' && <CommitList />}
                    {viewMode === 'graph' && <CommitGraph />}
                    {viewMode === 'analytics' && <RepoActivityAnalytics />}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl text-slate-500 dark:text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                    <GitBranch className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-300">
                    Selecione um repositório na lista ao lado
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Ao clicar em um repositório, você poderá navegar pelas branches, analisar o grafo de
                    commits e inspecionar detalhes completos das alterações.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal de Detalhes do Commit (quando um commit é selecionado) */}
      <CommitDetail />

      {/* Modal de Configuração do Token PAT */}
      <TokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
      />

      {/* Rodapé informativo */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 py-4 mt-12 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <p>
          Gama Git Explorer • Desenvolvido com React, TypeScript, Axios e Tailwind CSS • Consumo da API REST do GitHub v3
        </p>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
