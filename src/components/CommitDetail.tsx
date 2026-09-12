import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  GitCommit,
  User,
  Calendar,
  FileText,
  Plus,
  Minus,
  FileDiff,
  ChevronDown,
  ChevronRight,
  GitPullRequest,
  Search,
  Filter,
  ShieldCheck,
  SlidersHorizontal,
  Code2,
  FileCode,
  AlertCircle,
} from 'lucide-react';
import { useGitHub } from '../hooks/useGitHub';
import { CommitFile } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

type AuditFilterMode = 'all' | 'additions' | 'deletions';
type FileStatusFilter = 'all' | 'added' | 'modified' | 'removed';
type AuditViewTab = 'files' | 'audit-additions' | 'audit-deletions';

export const CommitDetail: React.FC = () => {
  const {
    selectedCommit,
    closeCommitDetail,
    loading,
    selectedRepo,
    formatDateTime,
    formatRelativeTime,
    selectCommit,
  } = useGitHub();

  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedFilePatch, setCopiedFilePatch] = useState<string | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

  // Controles de Auditoria de Código
  const [auditMode, setAuditMode] = useState<AuditFilterMode>('all');
  const [fileStatusFilter, setFileStatusFilter] = useState<FileStatusFilter>('all');
  const [diffSearchQuery, setDiffSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<AuditViewTab>('files');

  // Fecha no ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCommitDetail();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeCommitDetail]);

  // Reseta filtros ao trocar de commit
  useEffect(() => {
    setAuditMode('all');
    setFileStatusFilter('all');
    setDiffSearchQuery('');
    setActiveTab('files');
    setExpandedFiles({});
  }, [selectedCommit?.sha]);

  // Cálculos de auditoria de impacto
  const auditMetrics = useMemo(() => {
    if (!selectedCommit) {
      return {
        totalAdditions: 0,
        totalDeletions: 0,
        totalChanges: 0,
        additionRatio: 50,
        deletionRatio: 50,
        netDifference: 0,
        addedFilesCount: 0,
        modifiedFilesCount: 0,
        removedFilesCount: 0,
      };
    }

    const adds = selectedCommit.stats?.additions ?? 0;
    const dels = selectedCommit.stats?.deletions ?? 0;
    const total = adds + dels || 1;
    const additionRatio = Math.round((adds / total) * 100);
    const deletionRatio = 100 - additionRatio;
    const netDifference = adds - dels;

    const files = selectedCommit.files || [];
    const addedFilesCount = files.filter((f) => f.status === 'added').length;
    const modifiedFilesCount = files.filter((f) => f.status === 'modified').length;
    const removedFilesCount = files.filter((f) => f.status === 'removed').length;

    return {
      totalAdditions: adds,
      totalDeletions: dels,
      totalChanges: selectedCommit.stats?.total ?? total,
      additionRatio,
      deletionRatio,
      netDifference,
      addedFilesCount,
      modifiedFilesCount,
      removedFilesCount,
    };
  }, [selectedCommit]);

  // Arquivos filtrados de acordo com auditoria, status e busca
  const filteredFiles = useMemo(() => {
    if (!selectedCommit?.files) return [];

    return selectedCommit.files.filter((file) => {
      // Filtro por status do arquivo
      if (fileStatusFilter !== 'all') {
        if (fileStatusFilter === 'added' && file.status !== 'added') return false;
        if (fileStatusFilter === 'modified' && file.status !== 'modified') return false;
        if (fileStatusFilter === 'removed' && file.status !== 'removed') return false;
      }

      // Filtro por modo de auditoria
      if (auditMode === 'additions' && file.additions === 0) return false;
      if (auditMode === 'deletions' && file.deletions === 0) return false;

      // Filtro por busca textual no diff ou no nome do arquivo
      if (diffSearchQuery.trim()) {
        const query = diffSearchQuery.toLowerCase();
        const matchesFilename = file.filename.toLowerCase().includes(query);
        const matchesPatch = file.patch?.toLowerCase().includes(query);
        if (!matchesFilename && !matchesPatch) return false;
      }

      return true;
    });
  }, [selectedCommit?.files, fileStatusFilter, auditMode, diffSearchQuery]);

  // Linhas de auditoria consolidadas (para a aba de auditoria direta)
  const consolidatedAuditLines = useMemo(() => {
    if (!selectedCommit?.files) return { additions: [], deletions: [] };

    const additions: Array<{ filename: string; line: string; lineIndex: number }> = [];
    const deletions: Array<{ filename: string; line: string; lineIndex: number }> = [];

    selectedCommit.files.forEach((file) => {
      if (!file.patch) return;
      const lines = file.patch.split('\n');
      lines.forEach((l, idx) => {
        if (l.startsWith('+') && !l.startsWith('+++')) {
          if (!diffSearchQuery || l.toLowerCase().includes(diffSearchQuery.toLowerCase())) {
            additions.push({ filename: file.filename, line: l.substring(1), lineIndex: idx });
          }
        } else if (l.startsWith('-') && !l.startsWith('---')) {
          if (!diffSearchQuery || l.toLowerCase().includes(diffSearchQuery.toLowerCase())) {
            deletions.push({ filename: file.filename, line: l.substring(1), lineIndex: idx });
          }
        }
      });
    });

    return { additions, deletions };
  }, [selectedCommit?.files, diffSearchQuery]);

  if (!selectedCommit && !loading.commitDetail) {
    return null;
  }

  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 1500);
  };

  const handleCopyPatch = (e: React.MouseEvent, filename: string, patch?: string) => {
    e.stopPropagation();
    if (!patch) return;
    navigator.clipboard.writeText(patch);
    setCopiedFilePatch(filename);
    setTimeout(() => setCopiedFilePatch(null), 1500);
  };

  const toggleFileExpansion = (filename: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [filename]: !prev[filename],
    }));
  };

  const expandAllFiles = () => {
    if (!filteredFiles) return;
    const allExpanded: Record<string, boolean> = {};
    filteredFiles.forEach((f) => {
      allExpanded[f.filename] = true;
    });
    setExpandedFiles(allExpanded);
  };

  const collapseAllFiles = () => {
    setExpandedFiles({});
  };

  // Helper para badge de status do arquivo
  const renderStatusBadge = (status: CommitFile['status']) => {
    switch (status) {
      case 'added':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
            Adicionado
          </span>
        );
      case 'removed':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950/60 border border-rose-500/40 text-rose-300">
            Removido
          </span>
        );
      case 'modified':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-950/60 border border-blue-500/40 text-blue-300">
            Modificado
          </span>
        );
      case 'renamed':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-950/60 border border-purple-500/40 text-purple-300">
            Renomeado
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div
      id="commit-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={closeCommitDetail}
    >
      <div
        id="commit-detail-modal"
        className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <GitCommit className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">Detalhes do Commit</h3>
                {selectedCommit && (
                  <span className="font-mono text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/60 font-medium">
                    {selectedCommit.sha.substring(0, 7)}
                  </span>
                )}
              </div>
              {selectedRepo && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {selectedRepo.owner.login}/{selectedRepo.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedCommit && (
              <a
                href={selectedCommit.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs border border-slate-300 dark:border-slate-700 transition"
              >
                <span>Ver no GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={closeCommitDetail}
              aria-label="Fechar detalhes do commit"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo com rolagem */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading.commitDetail ? (
            <LoadingSpinner message="Carregando estatísticas e arquivos alterados do commit..." />
          ) : !selectedCommit ? null : (
            <>
              {/* Mensagem do commit */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  Mensagem do Commit
                </h4>
                <div className="font-sans text-sm md:text-base text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed font-medium">
                  {selectedCommit.commit.message}
                </div>
              </div>

              {/* Informações do autor e SHA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Autor */}
                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  {selectedCommit.author?.avatar_url ? (
                    <img
                      src={selectedCommit.author.avatar_url}
                      alt={selectedCommit.commit.author.name}
                      className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                      Autor
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {selectedCommit.commit.author.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{selectedCommit.commit.author.email}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{formatDateTime(selectedCommit.commit.author.date)}</span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span>{formatRelativeTime(selectedCommit.commit.author.date)}</span>
                    </div>
                  </div>
                </div>

                {/* Hash e Pais */}
                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">
                      Hash SHA Completo
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 break-all select-all font-medium">
                        {selectedCommit.sha}
                      </code>
                      <button
                        onClick={() => handleCopySha(selectedCommit.sha)}
                        title="Copiar hash completo"
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition shrink-0 cursor-pointer"
                      >
                        {copiedSha ? (
                          <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {selectedCommit.parents && selectedCommit.parents.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                        <GitPullRequest className="w-3.5 h-3.5" />
                        Commits pais ({selectedCommit.parents.length}):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCommit.parents.map((p) => (
                          <button
                            key={p.sha}
                            onClick={() => selectCommit(p.sha)}
                            className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded transition cursor-pointer"
                          >
                            {p.sha.substring(0, 7)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* PAINEL DE AUDITORIA: Estatísticas e Consultas Especializadas */}
              <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white tracking-wide">
                      Auditoria de Código & Impacto
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Impacto Líquido:</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded ${
                        auditMetrics.netDifference > 0
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                          : auditMetrics.netDifference < 0
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {auditMetrics.netDifference > 0 ? `+${auditMetrics.netDifference}` : auditMetrics.netDifference} linhas
                    </span>
                  </div>
                </div>

                {/* Cards de Consulta Interativa (Clique para filtrar) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Total */}
                  <button
                    type="button"
                    onClick={() => {
                      setAuditMode('all');
                      setActiveTab('files');
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      auditMode === 'all' && activeTab === 'files'
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-500/80 ring-1 ring-indigo-400/50'
                        : 'bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Total de Alterações</span>
                      {auditMode === 'all' && activeTab === 'files' && (
                        <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 px-1.5 py-0.5 rounded">
                          Ativo
                        </span>
                      )}
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {auditMetrics.totalChanges.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {selectedCommit.files?.length || 0} arquivos modificados
                    </p>
                  </button>

                  {/* Adições */}
                  <button
                    type="button"
                    onClick={() => {
                      setAuditMode('additions');
                      setActiveTab('files');
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      auditMode === 'additions'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-500/50'
                        : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-300 dark:hover:border-emerald-500/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Consultar Adições
                      </span>
                      {auditMode === 'additions' && (
                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/40">
                          Filtrado
                        </span>
                      )}
                    </div>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-300 mt-1">
                      +{auditMetrics.totalAdditions.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">
                      {auditMetrics.additionRatio}% do volume deste commit
                    </p>
                  </button>

                  {/* Remoções */}
                  <button
                    type="button"
                    onClick={() => {
                      setAuditMode('deletions');
                      setActiveTab('files');
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      auditMode === 'deletions'
                        ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 ring-1 ring-rose-500/50'
                        : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30 hover:border-rose-300 dark:hover:border-rose-500/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-rose-700 dark:text-rose-400 font-medium flex items-center gap-1">
                        <Minus className="w-3.5 h-3.5" /> Consultar Remoções
                      </span>
                      {auditMode === 'deletions' && (
                        <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-500/40">
                          Filtrado
                        </span>
                      )}
                    </div>
                    <p className="text-xl font-bold text-rose-600 dark:text-rose-300 mt-1">
                      -{auditMetrics.totalDeletions.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-rose-600/80 dark:text-rose-400/70 mt-0.5">
                      {auditMetrics.deletionRatio}% do volume deste commit
                    </p>
                  </button>
                </div>

                {/* Barra Proporcional de Auditoria de Código */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      +{auditMetrics.totalAdditions} ({auditMetrics.additionRatio}%)
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-[11px]">Balanço do Delta</span>
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
                      -{auditMetrics.totalDeletions} ({auditMetrics.deletionRatio}%)
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${auditMetrics.additionRatio}%` }}
                      title={`Adições: ${auditMetrics.additionRatio}%`}
                    />
                    <div
                      className="bg-rose-500 h-full transition-all duration-300"
                      style={{ width: `${auditMetrics.deletionRatio}%` }}
                      title={`Remoções: ${auditMetrics.deletionRatio}%`}
                    />
                  </div>
                </div>

                {/* Abas de Visualização: Visão por Arquivos vs Inspeção Consolidada */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveTab('files')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        activeTab === 'files'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Por Arquivos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('audit-additions');
                        setAuditMode('additions');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        activeTab === 'audit-additions'
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 shadow-xs font-semibold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      <span>Inspecionar Todas Adições</span>
                      <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900/60 rounded text-[10px] font-mono font-medium">
                        +{auditMetrics.totalAdditions}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('audit-deletions');
                        setAuditMode('deletions');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        activeTab === 'audit-deletions'
                          ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 shadow-xs font-semibold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300'
                      }`}
                    >
                      <Minus className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                      <span>Inspecionar Todas Remoções</span>
                      <span className="ml-1 px-1.5 py-0.2 bg-rose-100 dark:bg-rose-900/60 rounded text-[10px] font-mono font-medium">
                        -{auditMetrics.totalDeletions}
                      </span>
                    </button>
                  </div>

                  {/* Botão para limpar filtros caso haja algum ativo */}
                  {(auditMode !== 'all' || fileStatusFilter !== 'all' || diffSearchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuditMode('all');
                        setFileStatusFilter('all');
                        setDiffSearchQuery('');
                        setActiveTab('files');
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition font-medium cursor-pointer"
                    >
                      Limpar filtros de auditoria
                    </button>
                  )}
                </div>
              </div>

              {/* Barra de Busca de Código e Filtro de Arquivos */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Campo de pesquisa dentro do diff */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="diff-code-search"
                    type="text"
                    value={diffSearchQuery}
                    onChange={(e) => setDiffSearchQuery(e.target.value)}
                    placeholder="Auditar código: pesquisar função, variável, import, TODO..."
                    className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                  {diffSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setDiffSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filtro por status do arquivo */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    id="file-status-filter-select"
                    value={fileStatusFilter}
                    onChange={(e) => setFileStatusFilter(e.target.value as FileStatusFilter)}
                    className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 px-2.5 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="all">Todos status ({selectedCommit.files?.length || 0})</option>
                    <option value="added">Apenas Adicionados ({auditMetrics.addedFilesCount})</option>
                    <option value="modified">Apenas Modificados ({auditMetrics.modifiedFilesCount})</option>
                    <option value="removed">Apenas Removidos ({auditMetrics.removedFilesCount})</option>
                  </select>
                </div>
              </div>

              {/* CONTEÚDO PRINCIPAL: DEPENDENDO DA ABA SELECIONADA */}

              {/* ABA 1: Visão por Arquivos (Padrão) */}
              {activeTab === 'files' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Arquivos Alterados ({filteredFiles.length} de {selectedCommit.files?.length || 0})
                      </h4>
                      {auditMode !== 'all' && (
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                            auditMode === 'additions'
                              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                              : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40'
                          }`}
                        >
                          Modo: Somente {auditMode === 'additions' ? 'Adições (+)' : 'Remoções (-)'}
                        </span>
                      )}
                    </div>

                    {filteredFiles.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <button
                          type="button"
                          onClick={expandAllFiles}
                          className="hover:text-slate-900 dark:hover:text-white transition underline cursor-pointer"
                        >
                          Expandir todos
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={collapseAllFiles}
                          className="hover:text-slate-900 dark:hover:text-white transition underline cursor-pointer"
                        >
                          Recolher todos
                        </button>
                      </div>
                    )}
                  </div>

                  {filteredFiles.length === 0 ? (
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                      <AlertCircle className="w-6 h-6 text-slate-400 dark:text-slate-500 mx-auto" />
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                        Nenhum arquivo corresponde aos critérios de auditoria aplicados.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setAuditMode('all');
                          setFileStatusFilter('all');
                          setDiffSearchQuery('');
                        }}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline font-medium cursor-pointer"
                      >
                        Redefinir filtros e exibir todos os arquivos
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredFiles.map((file) => {
                        const isExpanded = !!expandedFiles[file.filename];

                        // Filtra as linhas do patch conforme auditMode e diffSearchQuery
                        const patchLines = file.patch ? file.patch.split('\n') : [];
                        const relevantPatchLines = patchLines.filter((line) => {
                          if (auditMode === 'additions') {
                            return (line.startsWith('+') && !line.startsWith('+++')) || line.startsWith('@@');
                          }
                          if (auditMode === 'deletions') {
                            return (line.startsWith('-') && !line.startsWith('---')) || line.startsWith('@@');
                          }
                          return true;
                        });

                        return (
                          <div
                            key={file.sha || file.filename}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 overflow-hidden shadow-xs"
                          >
                            {/* Linha de resumo do arquivo */}
                            <div
                              onClick={() => file.patch && toggleFileExpansion(file.filename)}
                              className={`p-3 flex items-center justify-between gap-3 text-xs ${
                                file.patch ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {file.patch ? (
                                  isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                                  )
                                ) : (
                                  <FileDiff className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                                )}
                                <span className="font-mono text-slate-800 dark:text-slate-200 truncate font-medium">
                                  {file.filename}
                                </span>
                                {file.previous_filename && (
                                  <span className="text-slate-400 dark:text-slate-500 truncate text-[11px]">
                                    (anteriormente {file.previous_filename})
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{file.additions}</span>
                                  <span className="text-rose-600 dark:text-rose-400 font-semibold">-{file.deletions}</span>
                                </div>
                                {renderStatusBadge(file.status)}

                                {file.patch && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopyPatch(e, file.filename, file.patch)}
                                    title="Copiar diff deste arquivo"
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                  >
                                    {copiedFilePatch === file.filename ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}

                                {file.blob_url && (
                                  <a
                                    href={file.blob_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Abrir arquivo no GitHub"
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Pré-visualização do diff/patch com auditoria especializada */}
                            {isExpanded && file.patch && (
                              <div className="border-t border-slate-200 dark:border-slate-800 bg-[#070b14] p-3 overflow-x-auto">
                                <pre className="font-mono text-[11px] leading-relaxed">
                                  {relevantPatchLines.map((line, idx) => {
                                    const isAdd = line.startsWith('+') && !line.startsWith('+++');
                                    const isDel = line.startsWith('-') && !line.startsWith('---');
                                    const isHdr = line.startsWith('@@');

                                    // Checagem se o texto bate com a pesquisa de auditoria
                                    const isSearchMatch =
                                      diffSearchQuery.trim() &&
                                      line.toLowerCase().includes(diffSearchQuery.toLowerCase());

                                    let lineClass = 'text-slate-300';
                                    if (isAdd) {
                                      lineClass = 'bg-emerald-950/50 text-emerald-300 border-l-2 border-emerald-500';
                                    } else if (isDel) {
                                      lineClass = 'bg-rose-950/50 text-rose-300 border-l-2 border-rose-500';
                                    } else if (isHdr) {
                                      lineClass = 'bg-indigo-950/60 text-indigo-300 font-semibold border-y border-indigo-900/50';
                                    }

                                    return (
                                      <div
                                        key={idx}
                                        className={`px-2 py-0.5 rounded-sm flex items-start gap-2 ${lineClass} ${
                                          isSearchMatch ? 'ring-1 ring-amber-400/80 bg-amber-950/50' : ''
                                        }`}
                                      >
                                        <span className="select-none text-[10px] text-slate-500 w-6 text-right shrink-0 font-mono">
                                          {idx + 1}
                                        </span>
                                        <span className="flex-1 whitespace-pre-wrap break-all">{line}</span>
                                      </div>
                                    );
                                  })}
                                </pre>
                              </div>
                            )}

                            {isExpanded && !file.patch && (
                              <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 text-center">
                                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                                  Arquivo binário ou conteúdo alterado sem patch de texto gerado pela API do GitHub.
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ABA 2: Inspecionar Todas Adições (Consolidadas) */}
              {activeTab === 'audit-additions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        Auditoria de Adições (+{consolidatedAuditLines.additions.length} ocorrências)
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Consolidação de todas as novas linhas inseridas neste commit para verificação minuciosa.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('files')}
                      className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      Voltar aos arquivos
                    </button>
                  </div>

                  {consolidatedAuditLines.additions.length === 0 ? (
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Nenhuma adição encontrada para os filtros atuais.</p>
                    </div>
                  ) : (
                    <div className="bg-[#070b14] border border-emerald-500/30 rounded-xl overflow-hidden divide-y divide-slate-850 font-mono text-[11px]">
                      {consolidatedAuditLines.additions.map((item, idx) => (
                        <div key={idx} className="p-2.5 hover:bg-emerald-950/20 transition flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-semibold text-emerald-400">{item.filename}</span>
                            <span>Linha #{item.lineIndex + 1}</span>
                          </div>
                          <div className="bg-emerald-950/40 text-emerald-300 px-2 py-1 rounded border border-emerald-500/30 whitespace-pre-wrap break-all">
                            +{item.line}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ABA 3: Inspecionar Todas Remoções (Consolidadas) */}
              {activeTab === 'audit-deletions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                        <Minus className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                        Auditoria de Remoções (-{consolidatedAuditLines.deletions.length} ocorrências)
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Consolidação de todo o código excluído neste commit para checagem de quebras ou perdas.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('files')}
                      className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      Voltar aos arquivos
                    </button>
                  </div>

                  {consolidatedAuditLines.deletions.length === 0 ? (
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Nenhuma remoção encontrada para os filtros atuais.</p>
                    </div>
                  ) : (
                    <div className="bg-[#070b14] border border-rose-500/30 rounded-xl overflow-hidden divide-y divide-slate-850 font-mono text-[11px]">
                      {consolidatedAuditLines.deletions.map((item, idx) => (
                        <div key={idx} className="p-2.5 hover:bg-rose-950/20 transition flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-semibold text-rose-400">{item.filename}</span>
                            <span>Linha #{item.lineIndex + 1}</span>
                          </div>
                          <div className="bg-rose-950/40 text-rose-300 px-2 py-1 rounded border border-rose-500/30 whitespace-pre-wrap break-all">
                            -{item.line}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

