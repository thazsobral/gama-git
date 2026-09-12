import React, { useState } from 'react';
import { KeyRound, X, Check, ShieldAlert, ExternalLink } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TokenModal: React.FC<TokenModalProps> = ({ isOpen, onClose }) => {
  const { token, setToken } = useAppContext();
  const [inputValue, setInputValue] = useState(token);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToken(inputValue.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setInputValue('');
    setToken('');
  };

  return (
    <div
      id="token-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="token-modal-content"
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <KeyRound className="w-5 h-5" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">GitHub Personal Access Token</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
          O GitHub limita requisições anônimas a <strong>60 requisições por hora</strong>. Adicionar um
          token pessoal eleva este limite para <strong>5.000 requisições por hora</strong>.
        </p>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Token (Personal Access Token - PAT)
            </label>
            <input
              type="password"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <a
              href="https://github.com/settings/tokens/new?description=GamaGitExplorer&scopes=public_repo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline"
            >
              Criar token no GitHub <ExternalLink className="w-3 h-3" />
            </a>
            {token && (
              <button
                type="button"
                onClick={handleClear}
                className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Remover token
              </button>
            )}
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>
              O token é salvo exclusivamente no <code>localStorage</code> do seu navegador e nunca é enviado a nenhum servidor externo, exceto na chamada à API oficial do GitHub.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition shadow-sm cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" /> Salvo!
                </>
              ) : (
                'Salvar Token'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
