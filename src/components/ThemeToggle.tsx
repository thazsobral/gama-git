import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useGitHub } from '../hooks/useGitHub';
import { ThemeMode } from '../types';

export const ThemeToggle: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useGitHub();

  const options: Array<{
    mode: ThemeMode;
    label: string;
    icon: React.ReactNode;
    title: string;
    id: string;
  }> = [
    {
      mode: 'light',
      label: 'Claro',
      icon: <Sun className="w-3.5 h-3.5" />,
      title: 'Tema Claro (fundo claro com alto contraste)',
      id: 'theme-btn-light',
    },
    {
      mode: 'dark',
      label: 'Escuro',
      icon: <Moon className="w-3.5 h-3.5" />,
      title: 'Tema Escuro (modo noturno confortável aos olhos)',
      id: 'theme-btn-dark',
    },
    {
      mode: 'system',
      label: 'Sistema',
      icon: <Laptop className="w-3.5 h-3.5" />,
      title: `Tema do Sistema (atualmente: ${resolvedTheme === 'dark' ? 'Escuro' : 'Claro'})`,
      id: 'theme-btn-system',
    },
  ];

  return (
    <div
      id="theme-toggle-group"
      className="inline-flex items-center p-0.5 rounded-xl bg-slate-200/80 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 shadow-xs"
      role="group"
      aria-label="Seletor de tema"
    >
      {options.map((opt) => {
        const isActive = theme === opt.mode;
        return (
          <button
            key={opt.mode}
            id={opt.id}
            type="button"
            onClick={() => setTheme(opt.mode)}
            title={opt.title}
            aria-pressed={isActive}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              isActive
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-300/40 dark:hover:bg-slate-750'
            }`}
          >
            {opt.icon}
            <span className="hidden md:inline text-[11px]">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
