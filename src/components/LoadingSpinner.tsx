import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  inline?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Carregando dados do GitHub...',
  size = 'md',
  inline = false,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  if (inline) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-1">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-indigo-400`} />
        {message && <span>{message}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center" id="loading-spinner-container">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-indigo-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin opacity-50" />
        </div>
      </div>
      {message && <p className="mt-4 text-sm font-medium text-slate-300">{message}</p>}
      <p className="text-xs text-slate-500 mt-1">Consultando API REST do GitHub...</p>
    </div>
  );
};
