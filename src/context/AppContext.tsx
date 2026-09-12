/**
 * Contexto Global da Aplicação (Context API)
 * Gerencia o estado de busca de usuários, seleção de repositórios,
 * branches, commits, filtros e detalhes de commit.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  GitHubUser,
  GitHubRepo,
  GitHubBranch,
  GitHubCommit,
  ApiError,
  ThemeMode,
} from '../types';
import {
  getUserProfile,
  getUserRepos,
  getRepoBranches,
  getBranchCommits,
  getCommitDetail,
  getRepoLanguages,
  setGitHubAuthToken,
} from '../api/github';

interface LoadingState {
  user: boolean;
  repos: boolean;
  branches: boolean;
  commits: boolean;
  commitDetail: boolean;
  languages: boolean;
}

interface AppContextType {
  username: string;
  userProfile: GitHubUser | null;
  repos: GitHubRepo[];
  selectedRepo: GitHubRepo | null;
  owner: string;
  repo: string;
  branches: GitHubBranch[];
  selectedBranch: string;
  currentBranch: string;
  commits: GitHubCommit[];
  selectedCommit: GitHubCommit | null;
  commitFilterQuery: string;
  repoFilterQuery: string;
  viewMode: 'list' | 'graph' | 'analytics';
  repoLanguages: Record<string, number>;
  loading: LoadingState;
  error: ApiError | null;
  token: string;
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  // Paginação de commits
  commitsPage: number;
  hasMoreCommits: boolean;
  isLoadingMoreCommits: boolean;
  loadMoreCommits: () => Promise<void>;
  // Ações
  searchUser: (username: string) => Promise<void>;
  selectRepo: (repo: GitHubRepo | null) => Promise<void>;
  unselectRepo: () => void;
  selectBranch: (branchName: string) => Promise<void>;
  selectCommit: (sha: string) => Promise<void>;
  closeCommitDetail: () => void;
  setCommitFilterQuery: (query: string) => void;
  setRepoFilterQuery: (query: string) => void;
  setViewMode: (mode: 'list' | 'graph' | 'analytics') => void;
  refreshLanguages: () => Promise<void>;
  setTheme: (theme: ThemeMode) => void;
  setToken: (token: string) => void;
  clearError: () => void;
  resetAll: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'gama_git_github_pat';
const THEME_STORAGE_KEY = 'gama_git_theme_preference';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string>('');
  const [userProfile, setUserProfile] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [commitsPage, setCommitsPage] = useState<number>(1);
  const [hasMoreCommits, setHasMoreCommits] = useState<boolean>(false);
  const [isLoadingMoreCommits, setIsLoadingMoreCommits] = useState<boolean>(false);
  const [selectedCommit, setSelectedCommit] = useState<GitHubCommit | null>(null);
  const [commitFilterQuery, setCommitFilterQuery] = useState<string>('');
  const [repoFilterQuery, setRepoFilterQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'graph' | 'analytics'>('list');
  const [repoLanguages, setRepoLanguages] = useState<Record<string, number>>({});

  const [loading, setLoading] = useState<LoadingState>({
    user: false,
    repos: false,
    branches: false,
    commits: false,
    commitDetail: false,
    languages: false,
  });

  const [error, setError] = useState<ApiError | null>(null);

  // Inicializa tema: light, dark ou system
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved as ThemeMode;
      }
    } catch {
      // Ignora erro
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  // Atualiza classe .dark no HTML e no body
  useEffect(() => {
    const getSystemTheme = (): 'light' | 'dark' => {
      if (typeof window === 'undefined') return 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const applyTheme = (mode: ThemeMode) => {
      const effective = mode === 'system' ? getSystemTheme() : mode;
      setResolvedTheme(effective);

      const root = document.documentElement;
      if (effective === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
      root.style.colorScheme = effective;
    };

    applyTheme(theme);

    if (theme === 'system' && typeof window !== 'undefined') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme('system');
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignora erro
    }
  }, []);

  // Inicializa token do localStorage se disponível
  const [token, setTokenState] = useState<string>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  // Atualiza o token no cliente axios e no localStorage
  const setToken = useCallback((newToken: string) => {
    setTokenState(newToken);
    setGitHubAuthToken(newToken);
    try {
      if (newToken) {
        localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // Ignora erro se cookies/storage desabilitados
    }
  }, []);

  // Aplica token inicial na montagem
  useEffect(() => {
    if (token) {
      setGitHubAuthToken(token);
    }
  }, [token]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const COMMITS_PER_PAGE = 60;

  const resetAll = useCallback(() => {
    setUsername('');
    setUserProfile(null);
    setRepos([]);
    setSelectedRepo(null);
    setBranches([]);
    setSelectedBranch('');
    setCommits([]);
    setCommitsPage(1);
    setHasMoreCommits(false);
    setIsLoadingMoreCommits(false);
    setSelectedCommit(null);
    setCommitFilterQuery('');
    setRepoFilterQuery('');
    setRepoLanguages({});
    setError(null);
  }, []);

  /**
   * 1. Busca perfil do usuário e seus repositórios
   */
  const searchUser = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setError(null);
    setUsername(trimmed);
    setSelectedRepo(null);
    setBranches([]);
    setSelectedBranch('');
    setCommits([]);
    setCommitsPage(1);
    setHasMoreCommits(false);
    setIsLoadingMoreCommits(false);
    setSelectedCommit(null);
    setCommitFilterQuery('');
    setRepoFilterQuery('');

    setLoading((prev) => ({ ...prev, user: true, repos: true }));

    try {
      // Busca perfil e repositórios em paralelo
      const [profileData, reposData] = await Promise.all([
        getUserProfile(trimmed),
        getUserRepos(trimmed),
      ]);

      setUserProfile(profileData);
      setRepos(reposData);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr);
      setUserProfile(null);
      setRepos([]);
    } finally {
      setLoading((prev) => ({ ...prev, user: false, repos: false }));
    }
  }, []);

  /**
   * Carrega os commits iniciais para uma branch específica (página 1)
   */
  const loadCommits = useCallback(
    async (owner: string, repo: string, branch: string) => {
      setLoading((prev) => ({ ...prev, commits: true }));
      setError(null);
      setCommits([]);
      setCommitsPage(1);
      setHasMoreCommits(false);
      setIsLoadingMoreCommits(false);
      setSelectedCommit(null);

      try {
        const commitsData = await getBranchCommits(owner, repo, branch, 1, COMMITS_PER_PAGE);
        setCommits(commitsData);
        setCommitsPage(1);
        setHasMoreCommits(commitsData.length >= COMMITS_PER_PAGE);
      } catch (err: unknown) {
        const apiErr = err as ApiError;
        setError(apiErr);
        setCommits([]);
        setHasMoreCommits(false);
      } finally {
        setLoading((prev) => ({ ...prev, commits: false }));
      }
    },
    []
  );

  /**
   * Deseleciona o repositório ativo e limpa os commits/branches
   */
  const unselectRepo = useCallback(() => {
    setSelectedRepo(null);
    setBranches([]);
    setSelectedBranch('');
    setCommits([]);
    setCommitsPage(1);
    setHasMoreCommits(false);
    setIsLoadingMoreCommits(false);
    setSelectedCommit(null);
    setCommitFilterQuery('');
    setRepoLanguages({});
  }, []);

  /**
   * Recarrega a distribuição de linguagens do repositório selecionado
   */
  const refreshLanguages = useCallback(async () => {
    if (!selectedRepo) return;
    setLoading((prev) => ({ ...prev, languages: true }));
    try {
      const langs = await getRepoLanguages(selectedRepo.owner.login, selectedRepo.name);
      setRepoLanguages(langs);
    } catch {
      setRepoLanguages({});
    } finally {
      setLoading((prev) => ({ ...prev, languages: false }));
    }
  }, [selectedRepo]);

  /**
   * 2. Seleciona um repositório, carrega suas branches e os commits da branch padrão
   */
  const selectRepo = useCallback(
    async (repo: GitHubRepo | null) => {
      if (!repo) {
        unselectRepo();
        return;
      }

      setSelectedRepo(repo);
      setError(null);
      setBranches([]);
      setSelectedBranch('');
      setCommits([]);
      setSelectedCommit(null);
      setCommitFilterQuery('');
      setRepoLanguages({});

      setLoading((prev) => ({ ...prev, branches: true, languages: true }));

      // Busca linguagens em paralelo sem bloquear branches
      getRepoLanguages(repo.owner.login, repo.name)
        .then((langs) => setRepoLanguages(langs))
        .catch(() => setRepoLanguages({}))
        .finally(() => setLoading((prev) => ({ ...prev, languages: false })));

      try {
        const branchesData = await getRepoBranches(repo.owner.login, repo.name);
        setBranches(branchesData);

        // Define a branch inicial: prioriza a default_branch do repositório
        const defaultBranchName =
          branchesData.find((b) => b.name === repo.default_branch)?.name ||
          branchesData[0]?.name ||
          repo.default_branch ||
          'main';

        setSelectedBranch(defaultBranchName);

        // Carrega commits da branch inicial
        await loadCommits(repo.owner.login, repo.name, defaultBranchName);
      } catch (err: unknown) {
        const apiErr = err as ApiError;
        setError(apiErr);
      } finally {
        setLoading((prev) => ({ ...prev, branches: false }));
      }
    },
    [loadCommits, unselectRepo]
  );

  /**
   * 3. Altera a branch selecionada e recarrega os commits
   */
  const selectBranch = useCallback(
    async (branchName: string) => {
      if (!selectedRepo || branchName === selectedBranch) return;

      setSelectedBranch(branchName);
      setCommitFilterQuery('');
      await loadCommits(selectedRepo.owner.login, selectedRepo.name, branchName);
    },
    [selectedRepo, selectedBranch, loadCommits]
  );

  /**
   * 4. Seleciona um commit para exibir seus detalhes (arquivos alterados, status, etc.)
   */
  const selectCommit = useCallback(
    async (sha: string) => {
      if (!selectedRepo) return;

      setLoading((prev) => ({ ...prev, commitDetail: true }));
      setError(null);

      try {
        const detail = await getCommitDetail(selectedRepo.owner.login, selectedRepo.name, sha);
        setSelectedCommit(detail);
      } catch (err: unknown) {
        const apiErr = err as ApiError;
        setError(apiErr);
      } finally {
        setLoading((prev) => ({ ...prev, commitDetail: false }));
      }
    },
    [selectedRepo]
  );

  const closeCommitDetail = useCallback(() => {
    setSelectedCommit(null);
  }, []);

  /**
   * Carrega a próxima página de commits para a branch ativa (paginação incremental)
   */
  const loadMoreCommits = useCallback(async () => {
    if (!selectedRepo || !selectedBranch || isLoadingMoreCommits || !hasMoreCommits) {
      return;
    }

    setIsLoadingMoreCommits(true);
    setError(null);

    try {
      const nextPage = commitsPage + 1;
      const nextCommits = await getBranchCommits(
        selectedRepo.owner.login,
        selectedRepo.name,
        selectedBranch,
        nextPage,
        COMMITS_PER_PAGE
      );

      if (!nextCommits || nextCommits.length === 0) {
        setHasMoreCommits(false);
      } else {
        setCommits((prev) => {
          const existingShas = new Set(prev.map((c) => c.sha));
          const newUnique = nextCommits.filter((c) => !existingShas.has(c.sha));
          return [...prev, ...newUnique];
        });
        setCommitsPage(nextPage);
        if (nextCommits.length < COMMITS_PER_PAGE) {
          setHasMoreCommits(false);
        }
      }
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr);
    } finally {
      setIsLoadingMoreCommits(false);
    }
  }, [selectedRepo, selectedBranch, isLoadingMoreCommits, hasMoreCommits, commitsPage]);

  const owner = selectedRepo?.owner?.login || userProfile?.login || username || '';
  const repo = selectedRepo?.name || '';
  const currentBranch = selectedBranch;

  return (
    <AppContext.Provider
      value={{
        username,
        userProfile,
        repos,
        selectedRepo,
        owner,
        repo,
        branches,
        selectedBranch,
        currentBranch,
        commits,
        selectedCommit,
        commitFilterQuery,
        repoFilterQuery,
        viewMode,
        repoLanguages,
        loading,
        error,
        token,
        theme,
        resolvedTheme,
        commitsPage,
        hasMoreCommits,
        isLoadingMoreCommits,
        loadMoreCommits,
        searchUser,
        selectRepo,
        unselectRepo,
        selectBranch,
        selectCommit,
        closeCommitDetail,
        setCommitFilterQuery,
        setRepoFilterQuery,
        setViewMode,
        refreshLanguages,
        setTheme,
        setToken,
        clearError,
        resetAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext deve ser utilizado dentro de um AppProvider');
  }
  return context;
};
