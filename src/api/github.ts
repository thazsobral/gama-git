/**
 * Módulo de integração com a API REST do GitHub v3 utilizando Axios
 */
import axios, { AxiosError } from 'axios';
import { GitHubUser, GitHubRepo, GitHubBranch, GitHubCommit, ApiError, GitTreeResponse } from '../types';

const GITHUB_API_BASE_URL = 'https://api.github.com';

// Cria instância do Axios configurada com headers padrão recomendados pelo GitHub
const githubClient = axios.create({
  baseURL: GITHUB_API_BASE_URL,
  headers: {
    Accept: 'application/vnd.github.v3+json',
  },
  timeout: 15000,
});

/**
 * Define ou remove o token de autenticação pessoal (PAT) opcional
 * Permite elevar o limite de 60 requisições/hora para 5000 requisições/hora
 */
export const setGitHubAuthToken = (token: string | null) => {
  if (token && token.trim()) {
    githubClient.defaults.headers.common['Authorization'] = `token ${token.trim()}`;
  } else {
    delete githubClient.defaults.headers.common['Authorization'];
  }
};

/**
 * Trata erros do Axios transformando em mensagens amigáveis em português
 */
export const parseApiError = (error: unknown, context: ApiError['type'] = 'repos'): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; documentation_url?: string }>;
    const status = axiosError.response?.status;
    const responseData = axiosError.response?.data;
    const headers = axiosError.response?.headers;

    // Trata Rate Limit (403)
    if (status === 403) {
      const resetEpoch = headers ? Number(headers['x-ratelimit-reset']) : null;
      const resetDate = resetEpoch ? new Date(resetEpoch * 1000) : undefined;
      const resetTimeString = resetDate ? resetDate.toLocaleTimeString('pt-BR') : '';

      return {
        status: 403,
        type: 'ratelimit',
        resetTime: resetDate,
        message: `Limite de requisições da API do GitHub atingido (60/hora para anônimos). ${
          resetTimeString ? `O limite será restaurado às ${resetTimeString}.` : ''
        } Você pode informar um GitHub Personal Access Token (PAT) nas configurações para ter 5.000 req/hora.`,
      };
    }

    // Usuário não encontrado (404)
    if (status === 404) {
      if (context === 'user') {
        return {
          status: 404,
          type: 'user',
          message: 'Usuário do GitHub não foi encontrado. Verifique o nome de usuário e tente novamente.',
        };
      }
      if (context === 'repos') {
        return {
          status: 404,
          type: 'repos',
          message: 'Repositório não encontrado ou é privado.',
        };
      }
      if (context === 'commits') {
        return {
          status: 404,
          type: 'commits',
          message: 'Nenhum commit encontrado para esta branch.',
        };
      }
      return {
        status: 404,
        type: context,
        message: responseData?.message || 'Recurso não encontrado na API do GitHub.',
      };
    }

    // Repositório vazio (409 Git Repository is empty)
    if (status === 409) {
      return {
        status: 409,
        type: 'commits',
        message: 'Este repositório está vazio e não possui commits nesta branch.',
      };
    }

    // Erro de rede / timeout
    if (axiosError.code === 'ECONNABORTED' || !axiosError.response) {
      return {
        type: context,
        message: 'Falha de conexão com a API do GitHub. Verifique sua conexão com a internet.',
      };
    }

    return {
      status,
      type: context,
      message: responseData?.message || 'Ocorreu um erro ao comunicar com a API do GitHub.',
    };
  }

  return {
    type: context,
    message: error instanceof Error ? error.message : 'Erro desconhecido ao consultar a API do GitHub.',
  };
};

/**
 * 1. Busca perfil público de um usuário do GitHub
 * GET /users/{username}
 */
export const getUserProfile = async (username: string): Promise<GitHubUser> => {
  try {
    const response = await githubClient.get<GitHubUser>(`/users/${encodeURIComponent(username)}`);
    return response.data;
  } catch (error) {
    throw parseApiError(error, 'user');
  }
};

/**
 * 2. Lista os repositórios públicos de um usuário
 * GET /users/{username}/repos
 */
export const getUserRepos = async (username: string): Promise<GitHubRepo[]> => {
  try {
    const response = await githubClient.get<GitHubRepo[]>(
      `/users/${encodeURIComponent(username)}/repos`,
      {
        params: {
          sort: 'updated',
          per_page: 100,
          type: 'all',
        },
      }
    );
    return response.data;
  } catch (error) {
    throw parseApiError(error, 'repos');
  }
};

/**
 * 3. Lista as branches de um repositório
 * GET /repos/{owner}/{repo}/branches
 */
export const getRepoBranches = async (owner: string, repo: string): Promise<GitHubBranch[]> => {
  try {
    const response = await githubClient.get<GitHubBranch[]>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches`,
      {
        params: {
          per_page: 100,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw parseApiError(error, 'branches');
  }
};

/**
 * 4. Lista os commits de uma branch específica
 * GET /repos/{owner}/{repo}/commits?sha={branch}
 */
export const getBranchCommits = async (
  owner: string,
  repo: string,
  branchShaOrName: string,
  page: number = 1,
  perPage: number = 60
): Promise<GitHubCommit[]> => {
  try {
    const response = await githubClient.get<GitHubCommit[]>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits`,
      {
        params: {
          sha: branchShaOrName,
          page,
          per_page: perPage,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw parseApiError(error, 'commits');
  }
};

/**
 * 5. Obtém os detalhes completos de um commit específico (incluindo arquivos alterados e status)
 * GET /repos/{owner}/{repo}/commits/{sha}
 */
export const getCommitDetail = async (
  owner: string,
  repo: string,
  sha: string
): Promise<GitHubCommit> => {
  try {
    const response = await githubClient.get<GitHubCommit>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(sha)}`
    );
    return response.data;
  } catch (error) {
    throw parseApiError(error, 'detail');
  }
};

/**
 * 6. Obtém a distribuição de linguagens de programação no repositório (em bytes)
 * GET /repos/{owner}/{repo}/languages
 */
export const getRepoLanguages = async (
  owner: string,
  repo: string
): Promise<Record<string, number>> => {
  try {
    const response = await githubClient.get<Record<string, number>>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`
    );
    return response.data;
  } catch (error) {
    console.warn('Não foi possível obter linguagens do repositório:', error);
    return {};
  }
};

/**
 * 7. Obtém a árvore de arquivos de um commit (estrutura completa de pastas/arquivos)
 * GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1
 */
export const getCommitTree = async (
  owner: string,
  repo: string,
  commitSha: string
): Promise<GitTreeResponse> => {
  try {
    const response = await githubClient.get<GitTreeResponse>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(commitSha)}`,
      {
        params: {
          recursive: 1,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw parseApiError(error, 'commits');
  }
};

/**
 * 8. Obtém os detalhes completos de um commit específico (alias solicitado na especificação)
 * GET /repos/{owner}/{repo}/commits/{sha}
 */
export const getCommitDetails = async (
  owner: string,
  repo: string,
  commitSha: string
): Promise<GitHubCommit> => {
  return getCommitDetail(owner, repo, commitSha);
};
