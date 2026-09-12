import React from 'react';
import { AlertCircle, RefreshCw, KeyRound, X } from 'lucide-react';
import { ApiError } from '../types';

interface ErrorMessageProps {
  error: ApiError;
  onRetry?: () => void;
  onOpenTokenModal?: () => void;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onOpenTokenModal,
  onDismiss,
}) => {
  const isRateLimit = error.status === 403 || error.type === 'ratelimit';

  return (
    <div
      id="error-alert-banner"
      className="p-4 rounded-xl border border-red-500/30 bg-red-950/40 text-red-200 backdrop-blur-sm shadow-lg mb-6 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-red-500/10 text-red-400 shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-red-200 text-sm md:text-base">
            {isRateLimit
              ? 'Limite de Requisições Atingido'
              : error.status === 404
              ? 'Recurso Não Encontrado'
              : 'Erro ao carregar dados'}
          </h4>
          <p className="text-xs md:text-sm text-red-300/90 mt-1 leading-relaxed">{error.message}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {onRetry && (
              <button
                id="error-retry-btn"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-100 text-xs font-medium border border-red-500/30 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Tentar novamente
              </button>
            )}

            {isRateLimit && onOpenTokenModal && (
              <button
                id="error-token-btn"
                onClick={onOpenTokenModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-medium border border-amber-500/30 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Configurar GitHub Token (PAT)
              </button>
            )}
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Fechar mensagem de erro"
            className="p-1 rounded-md text-red-400 hover:text-red-200 hover:bg-red-500/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
