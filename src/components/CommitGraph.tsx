import React, { useMemo, useState } from 'react';
import {
  GitCommit,
  GitBranch,
  GitMerge,
  User,
  Calendar,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  ChevronDown,
  RefreshCw,
  Check,
} from 'lucide-react';
import { useGitHub } from '../hooks/useGitHub';
import { GitHubCommit } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

// Paleta de cores para faixas/lanes de branches e commits
const LANE_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#8b5cf6', // Purple
  '#f43f5e', // Rose
  '#14b8a6', // Teal
];

interface GraphNode {
  commit: GitHubCommit;
  index: number;
  lane: number;
  color: string;
  parents: string[];
  x: number;
  y: number;
}

interface GraphLink {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  isMerge: boolean;
}

export const CommitGraph: React.FC = () => {
  const {
    filteredCommits,
    commits,
    selectCommit,
    selectedCommit,
    loading,
    selectedBranch,
    formatSha,
    formatRelativeTime,
    hasMoreCommits,
    isLoadingMoreCommits,
    loadMoreCommits,
  } = useGitHub();

  const [hoveredSha, setHoveredSha] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1);

  const rowHeight = 46;
  const laneWidth = 24;
  const startX = 30;

  /**
   * Calcula as lanes (faixas) e nós do grafo de commits
   */
  const { nodes, links, maxLane } = useMemo(() => {
    if (!filteredCommits || filteredCommits.length === 0) {
      return { nodes: [], links: [], maxLane: 0 };
    }

    const shaToIndex = new Map<string, number>();
    filteredCommits.forEach((c, idx) => {
      shaToIndex.set(c.sha, idx);
    });

    const calculatedNodes: GraphNode[] = [];
    const calculatedLinks: GraphLink[] = [];

    // Rastreamento de faixas ativas (lanes)
    let activeLanes: (string | null)[] = [];
    let peakLane = 0;

    filteredCommits.forEach((commit, index) => {
      const parentShas = (commit.parents || []).map((p) => p.sha);
      const isMerge = parentShas.length > 1;

      // Encontra a lane atribuída a este commit ou a primeira livre
      let lane = activeLanes.indexOf(commit.sha);
      if (lane === -1) {
        lane = activeLanes.indexOf(null);
        if (lane === -1) {
          lane = activeLanes.length;
          activeLanes.push(null);
        }
      }

      peakLane = Math.max(peakLane, lane);
      const color = LANE_COLORS[lane % LANE_COLORS.length];
      const x = startX + lane * laneWidth;
      const y = 24 + index * rowHeight;

      calculatedNodes.push({
        commit,
        index,
        lane,
        color,
        parents: parentShas,
        x,
        y,
      });

      // Libera a lane atual
      activeLanes[lane] = null;

      // Conecta aos pais e atribui lanes para os pais
      parentShas.forEach((parentSha, pIdx) => {
        const parentIndex = shaToIndex.get(parentSha);
        let targetLane = activeLanes.indexOf(parentSha);

        if (targetLane === -1) {
          // Primeiro pai continua na mesma lane se livre, senão aloca nova
          if (pIdx === 0 && activeLanes[lane] === null) {
            targetLane = lane;
          } else {
            targetLane = activeLanes.indexOf(null);
            if (targetLane === -1) {
              targetLane = activeLanes.length;
              activeLanes.push(null);
            }
          }
          activeLanes[targetLane] = parentSha;
        }

        peakLane = Math.max(peakLane, targetLane);

        if (parentIndex !== undefined) {
          const toX = startX + targetLane * laneWidth;
          const toY = 24 + parentIndex * rowHeight;

          calculatedLinks.push({
            fromX: x,
            fromY: y,
            toX,
            toY,
            color: pIdx === 0 ? color : LANE_COLORS[targetLane % LANE_COLORS.length],
            isMerge: pIdx > 0,
          });
        }
      });
    });

    return {
      nodes: calculatedNodes,
      links: calculatedLinks,
      maxLane: peakLane,
    };
  }, [filteredCommits]);

  if (loading.commits) {
    return <LoadingSpinner message="Montando grafo de commits e ramificações..." />;
  }

  if (filteredCommits.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
        <p className="text-sm">Nenhum commit para exibir no grafo.</p>
      </div>
    );
  }

  const svgWidth = Math.max(140, startX + (maxLane + 1) * laneWidth + 40);
  const svgHeight = 40 + filteredCommits.length * rowHeight;

  return (
    <div className="space-y-3" id="commit-graph-view">
      {/* Controles de visualização do grafo */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" /> Grafo de Ramificações Git
          </span>
          <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
            Clique em qualquer nó ou linha para inspecionar os detalhes do commit
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
          <button
            onClick={() => setScale((s) => Math.max(0.7, s - 0.1))}
            className="p-1 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Diminuir zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] px-1 text-slate-500 dark:text-slate-400">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(1.4, s + 0.1))}
            className="p-1 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setScale(1)}
            className="p-1 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition ml-1 cursor-pointer"
            title="Resetar zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Container com scroll do Grafo + Tabela de Commits sincronizada */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[620px] overflow-y-auto relative">
          <div
            className="flex min-w-fit"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {/* Coluna 1: Desenho do Grafo em SVG */}
            <div className="shrink-0 bg-slate-50/90 dark:bg-slate-950/95 border-r border-slate-200 dark:border-slate-800/80 sticky left-0 z-10">
              <svg width={svgWidth} height={svgHeight} className="block overflow-visible">
                {/* Linhas conectando os commits (Bezier curves para merge/branch branches) */}
                {links.map((link, idx) => {
                  const isCurved = link.fromX !== link.toX;
                  let d = '';

                  if (!isCurved) {
                    d = `M ${link.fromX} ${link.fromY} L ${link.toX} ${link.toY}`;
                  } else {
                    const midY = (link.fromY + link.toY) / 2;
                    d = `M ${link.fromX} ${link.fromY} C ${link.fromX} ${midY}, ${link.toX} ${midY}, ${link.toX} ${link.toY}`;
                  }

                  return (
                    <path
                      key={idx}
                      d={d}
                      fill="none"
                      stroke={link.color}
                      strokeWidth={link.isMerge ? 1.8 : 2.2}
                      strokeDasharray={link.isMerge ? '3,3' : undefined}
                      opacity={0.85}
                    />
                  );
                })}

                {/* Nós de Commits */}
                {nodes.map((node) => {
                  const isHovered = hoveredSha === node.commit.sha;
                  const isSelected = selectedCommit?.sha === node.commit.sha;
                  const isMerge = node.commit.parents && node.commit.parents.length > 1;

                  return (
                    <g
                      key={node.commit.sha}
                      transform={`translate(${node.x}, ${node.y})`}
                      className="cursor-pointer transition-transform"
                      onClick={() => selectCommit(node.commit.sha)}
                      onMouseEnter={() => setHoveredSha(node.commit.sha)}
                      onMouseLeave={() => setHoveredSha(null)}
                    >
                      {/* Círculo externo de foco quando selecionado/hovered */}
                      {(isHovered || isSelected) && (
                        <circle
                          r={isSelected ? 11 : 9}
                          fill="none"
                          stroke={node.color}
                          strokeWidth={2}
                          opacity={0.8}
                          className="animate-pulse"
                        />
                      )}

                      {/* Círculo do nó do commit */}
                      <circle
                        r={isMerge ? 6.5 : 5.5}
                        fill={isMerge ? '#0b0f19' : node.color}
                        stroke={node.color}
                        strokeWidth={isMerge ? 2.5 : 2}
                      />

                      {/* Ponto central para merge commit */}
                      {isMerge && <circle r={2} fill={node.color} />}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Coluna 2: Informações textuais do Commit alinhadas às linhas do Grafo */}
            <div className="flex-1 min-w-[500px]">
              {nodes.map((node) => {
                const item = node.commit;
                const isHovered = hoveredSha === item.sha;
                const isSelected = selectedCommit?.sha === item.sha;
                const [firstLine] = item.commit.message.split('\n');
                const isMerge = item.parents && item.parents.length > 1;

                return (
                  <div
                    key={item.sha}
                    onClick={() => selectCommit(item.sha)}
                    onMouseEnter={() => setHoveredSha(item.sha)}
                    onMouseLeave={() => setHoveredSha(null)}
                    style={{ height: `${rowHeight}px` }}
                    className={`flex items-center justify-between px-3 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer transition-colors text-xs ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-white font-medium'
                        : isHovered
                        ? 'bg-slate-100/80 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {/* Hash e Mensagem */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-4">
                      <span
                        className="font-mono text-[11px] px-1.5 py-0.5 rounded border shrink-0 transition font-medium"
                        style={{
                          borderColor: `${node.color}50`,
                          backgroundColor: `${node.color}15`,
                          color: node.color,
                        }}
                      >
                        {formatSha(item.sha)}
                      </span>

                      <span className="truncate font-medium text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-300">
                        {firstLine}
                      </span>

                      {isMerge && (
                        <span className="text-[10px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/50 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1 font-mono">
                          <GitMerge className="w-2.5 h-2.5" /> merge
                        </span>
                      )}
                    </div>

                    {/* Autor e Data */}
                    <div className="flex items-center gap-3 shrink-0 text-slate-500 dark:text-slate-400 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {item.author?.avatar_url ? (
                          <img
                            src={item.author.avatar_url}
                            alt={item.commit.author.name}
                            className="w-4 h-4 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        )}
                        <span className="truncate max-w-[120px] text-slate-700 dark:text-slate-300">{item.commit.author.name}</span>
                      </div>

                      <span className="text-slate-300 dark:text-slate-700">•</span>

                      <span className="whitespace-nowrap text-slate-400 dark:text-slate-500">
                        {formatRelativeTime(item.commit.author.date)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé de Paginação / Carregar Mais no Grafo */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white/90 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
          <GitCommit className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>
            Grafo estruturado com <strong className="text-slate-800 dark:text-slate-200">{filteredCommits.length}</strong> de {commits.length} commits
          </span>
        </div>

        {hasMoreCommits ? (
          <button
            id="btn-load-more-commits-graph"
            type="button"
            onClick={() => loadMoreCommits()}
            disabled={isLoadingMoreCommits}
            className="w-full sm:w-auto px-5 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-60 cursor-pointer"
          >
            {isLoadingMoreCommits ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                <span>Expandindo árvore com commits anteriores...</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Carregar mais commits no Grafo (+60)</span>
              </>
            )}
          </button>
        ) : (
          commits.length > 0 && (
            <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-medium">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Histórico completo da branch exibido no grafo ({commits.length} commits)</span>
            </div>
          )
        )}
      </div>
    </div>
  );
};
