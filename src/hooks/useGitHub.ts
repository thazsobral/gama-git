/**
 * Custom Hook useGitHub
 * Fornece acesso centralizado ao contexto do GitHub com dados computados
 * (filtros de commits, filtros de repositórios e utilitários de formatação)
 */
import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';

export const useGitHub = () => {
  const context = useAppContext();
  const {
    commits,
    commitFilterQuery,
    repos,
    repoFilterQuery,
    selectedRepo,
    branches,
    selectedBranch,
  } = context;

  // Filtra commits por mensagem ou autor
  const filteredCommits = useMemo(() => {
    if (!commitFilterQuery.trim()) {
      return commits;
    }

    const query = commitFilterQuery.toLowerCase().trim();

    return commits.filter((c) => {
      const message = c.commit.message.toLowerCase();
      const authorName = c.commit.author.name.toLowerCase();
      const authorLogin = c.author?.login.toLowerCase() || '';
      const sha = c.sha.toLowerCase();

      return (
        message.includes(query) ||
        authorName.includes(query) ||
        authorLogin.includes(query) ||
        sha.startsWith(query)
      );
    });
  }, [commits, commitFilterQuery]);

  // Filtra repositórios por nome, descrição ou linguagem
  const filteredRepos = useMemo(() => {
    if (!repoFilterQuery.trim()) {
      return repos;
    }

    const query = repoFilterQuery.toLowerCase().trim();

    return repos.filter((r) => {
      const name = r.name.toLowerCase();
      const desc = (r.description || '').toLowerCase();
      const lang = (r.language || '').toLowerCase();

      return name.includes(query) || desc.includes(query) || lang.includes(query);
    });
  }, [repos, repoFilterQuery]);

  // Identifica a branch principal (default)
  const defaultBranchName = selectedRepo?.default_branch || 'main';

  const isCurrentBranchDefault = selectedBranch === defaultBranchName;

  // Utilitários de formatação
  const formatSha = (sha: string, length = 7): string => {
    if (!sha) return '';
    return sha.substring(0, length);
  };

  const formatDateTime = (dateString: string): string => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatRelativeTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return 'agora há pouco';
      }
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
        return `há ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
      }
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return `há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
      }
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 30) {
        return `há ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`;
      }
      const diffInMonths = Math.floor(diffInDays / 30);
      if (diffInMonths < 12) {
        return `há ${diffInMonths} ${diffInMonths === 1 ? 'mês' : 'meses'}`;
      }
      const diffInYears = Math.floor(diffInDays / 365);
      return `há ${diffInYears} ${diffInYears === 1 ? 'ano' : 'anos'}`;
    } catch {
      return dateString;
    }
  };

  return {
    ...context,
    filteredCommits,
    filteredRepos,
    defaultBranchName,
    isCurrentBranchDefault,
    formatSha,
    formatDateTime,
    formatRelativeTime,
  };
};
