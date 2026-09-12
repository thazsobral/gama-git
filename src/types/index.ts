/**
 * Tipos TypeScript para a aplicação Gama Git Explorer
 */

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  location: string | null;
  blog: string | null;
  company: string | null;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  default_branch: string;
  open_issues_count: number;
  topics?: string[];
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface CommitAuthor {
  name: string;
  email: string;
  date: string;
}

export interface CommitFile {
  sha: string;
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  additions: number;
  deletions: number;
  changes: number;
  blob_url?: string;
  raw_url?: string;
  patch?: string;
  previous_filename?: string;
}

export interface GitHubCommit {
  sha: string;
  node_id: string;
  html_url: string;
  commit: {
    author: CommitAuthor;
    committer: CommitAuthor;
    message: string;
    comment_count: number;
    tree: {
      sha: string;
      url: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  committer: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  parents: Array<{
    sha: string;
    url: string;
    html_url?: string;
  }>;
  stats?: {
    total: number;
    additions: number;
    deletions: number;
  };
  files?: CommitFile[];
}

export interface ApiError {
  message: string;
  status?: number;
  type?: 'user' | 'repos' | 'branches' | 'commits' | 'detail' | 'ratelimit';
  resetTime?: Date;
}

export interface GitTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree' | 'commit';
  sha: string;
  size?: number;
  url: string;
}

export interface GitTreeResponse {
  sha: string;
  url: string;
  tree: GitTreeItem[];
  truncated: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';
