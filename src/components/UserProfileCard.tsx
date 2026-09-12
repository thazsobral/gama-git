import React from 'react';
import { BookOpen, Users, ExternalLink, MapPin, Building2, Link as LinkIcon } from 'lucide-react';
import { GitHubUser } from '../types';

interface UserProfileCardProps {
  user: GitHubUser;
  reposCount: number;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ user, reposCount }) => {
  return (
    <div
      id="user-profile-card"
      className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 backdrop-blur-sm transition-all shadow-md"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <img
          src={user.avatar_url}
          alt={user.login}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-indigo-500/40 dark:border-indigo-400/50 object-cover shadow-md shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-50 truncate">
              {user.name || user.login}
            </h2>
            <span className="text-xs font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/60 px-2 py-0.5 rounded-md font-medium">
              @{user.login}
            </span>
            <a
              href={user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              title="Abrir perfil no GitHub"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {user.bio && (
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
              {user.bio}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{reposCount} repositórios listados</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>{user.followers} seguidores</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>{user.following} seguindo</span>
            </div>

            {user.location && (
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span className="truncate max-w-[150px]">{user.location}</span>
              </div>
            )}

            {user.company && (
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span className="truncate max-w-[150px]">{user.company}</span>
              </div>
            )}

            {user.blog && (
              <a
                href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline truncate max-w-[160px]"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span className="truncate">{user.blog.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
