import React, { useState, useEffect, useRef } from 'react';
import GIF from 'gif.js';
import {
  Film,
  Download,
  Play,
  RotateCcw,
  AlertCircle,
  Clock,
  GitBranch,
  Layers,
  ChevronDown,
  ChevronUp,
  XCircle,
  ExternalLink,
  CheckCircle2,
  FolderTree,
  GitFork,
  Sparkles,
  TreeDeciduous,
  Sprout,
  Video,
  Zap,
  Maximize2,
} from 'lucide-react';
import { getBranchCommits, getCommitTree, parseApiError } from '../../api/github';
import { useAppContext } from '../../context/AppContext';
import styles from './TimeMachine.module.css';

// Resolução padrão do GIF conforme especificação
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Resolve a URL do worker do GIF com fallback seguro
let workerBlobUrl = null;
const getWorkerUrl = async () => {
  if (workerBlobUrl) return workerBlobUrl;
  try {
    const res = await fetch('/gif.worker.js');
    if (res.ok) {
      const code = await res.text();
      const blob = new Blob([code], { type: 'application/javascript' });
      workerBlobUrl = URL.createObjectURL(blob);
      return workerBlobUrl;
    }
  } catch (e) {
    console.warn('Carregando worker via caminho relativo /gif.worker.js:', e);
  }
  return '/gif.worker.js';
};

/**
 * Constrói a estrutura hierárquica plana de pastas e arquivos a partir dos caminhos da API Git
 */
const buildFlattenedTree = (treeItems) => {
  if (!treeItems || treeItems.length === 0) return [];

  const root = { name: '', isDir: true, children: {} };

  for (const item of treeItems) {
    const parts = item.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const isDir = isLast ? item.type === 'tree' : true;

      if (!current.children[part]) {
        current.children[part] = { name: part, isDir, children: {} };
      } else if (!isLast) {
        current.children[part].isDir = true;
      }
      current = current.children[part];
    }
  }

  const result = [];
  const traverse = (node, depth) => {
    // Diretórios primeiro, depois arquivos alfabeticamente
    const entries = Object.values(node.children).sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const child of entries) {
      result.push({ name: child.name, depth, isDir: child.isDir });
      traverse(child, depth + 1);
    }
  };

  traverse(root, 0);
  return result;
};

/**
 * Desenha uma linha da árvore com cor e ícones temáticos no canvas
 */
const drawTreeRow = (ctx, item, x, y, maxW) => {
  const indent = item.depth * 13;
  const isDir = item.isDir;
  const icon = isDir ? '📁 ' : '📄 ';
  const name = isDir ? `${item.name}/` : item.name;

  // Cor por categoria de arquivo
  if (isDir) {
    ctx.fillStyle = '#38bdf8'; // Ciano para diretórios
  } else if (/\.(tsx|ts|jsx|js|vue|svelte|py|rb|java|go|rs|c|cpp|cs)$/i.test(name)) {
    ctx.fillStyle = '#f8fafc'; // Branco brilhante para arquivos de código
  } else if (/\.(json|ya?ml|toml|env.*|config.*|xml)$/i.test(name)) {
    ctx.fillStyle = '#a5b4fc'; // Lavanda para configurações
  } else if (/\.(css|scss|sass|less|styl)$/i.test(name)) {
    ctx.fillStyle = '#f472b6'; // Rosa para folhas de estilo
  } else if (/\.(md|txt|rst|pdf|doc.*)$/i.test(name)) {
    ctx.fillStyle = '#94a3b8'; // Cinza para documentação
  } else if (/\.(png|jpe?g|gif|svg|ico|webp)$/i.test(name)) {
    ctx.fillStyle = '#34d399'; // Esmeralda para imagens/assets
  } else {
    ctx.fillStyle = '#cbd5e1';
  }

  // Desenha marcadores pontilhados de nível de indentação
  if (item.depth > 0) {
    ctx.save();
    ctx.fillStyle = '#334155';
    for (let d = 0; d < item.depth; d++) {
      ctx.fillRect(x + d * 13 + 3, y - 4, 1.5, 1.5);
    }
    ctx.restore();
  }

  // Texto truncado caso ultrapasse maxW
  const fullText = `${icon}${name}`;
  ctx.fillText(fullText, x + indent, y);
};

/**
 * Renderiza um quadro individual da Máquina do Tempo no canvas puro de 800x600 px
 */
const renderFrameToCanvas = (ctx, {
  owner,
  repo,
  branch,
  commitIndex,
  totalCommits,
  commit,
  treeItems,
}) => {
  const width = CANVAS_WIDTH;
  const height = CANVAS_HEIGHT;

  // 1. Fundo escuro imersivo
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, width, height);

  // Borda sutil de enquadramento
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

  // 2. Cabeçalho de informações do commit (Cartão Superior)
  const cardX = 20;
  const cardY = 16;
  const cardW = width - 40;
  const cardH = 96;

  ctx.fillStyle = '#0f172a';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 8);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);
  }

  // Linha 1: Título do repositório, branch e contador de commits
  ctx.font = 'bold 12.5px "JetBrains Mono", "SF Mono", "Fira Code", monospace';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(`MÁQUINA DO TEMPO: ${owner}/${repo}`, cardX + 16, cardY + 24);

  // Badge da Branch
  ctx.font = '11px "JetBrains Mono", "SF Mono", "Fira Code", monospace';
  ctx.fillStyle = '#818cf8';
  ctx.fillText(`[branch: ${branch}]`, cardX + 220 + (owner.length > 10 ? 40 : 0), cardY + 24);

  // Contador de Commit
  const commitCounter = `Commit ${commitIndex + 1} de ${totalCommits}`;
  const counterWidth = ctx.measureText(commitCounter).width;
  ctx.fillStyle = '#34d399';
  ctx.fillText(commitCounter, cardX + cardW - counterWidth - 16, cardY + 24);

  // Linha 2: Hash do Commit, Data e Autor
  const shortSha = (commit.sha || '').substring(0, 7);
  let commitDate = '';
  if (commit.commit?.author?.date) {
    const d = new Date(commit.commit.author.date);
    commitDate = d.toISOString().replace('T', ' ').substring(0, 16);
  }
  const authorName = commit.commit?.author?.name || commit.author?.login || 'desconhecido';

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px "JetBrains Mono", "SF Mono", "Fira Code", monospace';
  ctx.fillText(`[${shortSha}]`, cardX + 16, cardY + 50);

  ctx.font = '11px "JetBrains Mono", "SF Mono", "Fira Code", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`${commitDate} por `, cardX + 84, cardY + 50);

  const prefixW = ctx.measureText(`${commitDate} por `).width;
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(authorName, cardX + 84 + prefixW, cardY + 50);

  // Linha 3: Mensagem do commit
  const rawMsg = (commit.commit?.message || 'Sem mensagem informada').split('\n')[0].trim();
  const maxMsgLen = 72;
  const displayMsg = rawMsg.length > maxMsgLen ? rawMsg.substring(0, maxMsgLen) + '...' : rawMsg;

  ctx.font = 'italic 11.5px "JetBrains Mono", "SF Mono", "Fira Code", monospace';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`"${displayMsg}"`, cardX + 16, cardY + 74);

  // Linha de progresso do commit no cabeçalho
  const progressRatio = (commitIndex + 1) / totalCommits;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cardX, cardY + cardH - 3, cardW, 3);
  ctx.fillStyle = '#6366f1';
  ctx.fillRect(cardX, cardY + cardH - 3, cardW * progressRatio, 3);

  // 3. Barra descritiva intermediária
  const totalFiles = (treeItems || []).filter((i) => i.type === 'blob').length;
  const totalDirs = (treeItems || []).filter((i) => i.type === 'tree').length;

  ctx.font = '11px "JetBrains Mono", "SF Mono", "Fira Code", monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText(
    `ESTRUTURA DE PASTAS (${totalDirs} diretórios, ${totalFiles} arquivos totais)`,
    cardX + 4,
    130
  );

  // 4. Renderização da árvore de pastas indentada
  const flattened = buildFlattenedTree(treeItems || []);
  const maxLinesPerCol = 22;
  const isTwoCols = flattened.length > maxLinesPerCol;

  const col1X = cardX + 4;
  const col2X = width / 2 + 12;
  const startY = 152;
  const lineH = 18;

  ctx.font = '11.5px "JetBrains Mono", "SF Mono", "Fira Code", monospace';

  if (isTwoCols) {
    // Linha divisória vertical
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(width / 2, 140);
    ctx.lineTo(width / 2, 555);
    ctx.stroke();

    // Coluna 1
    const col1 = flattened.slice(0, maxLinesPerCol);
    col1.forEach((item, idx) => {
      drawTreeRow(ctx, item, col1X, startY + idx * lineH, 360);
    });

    // Coluna 2
    const col2 = flattened.slice(maxLinesPerCol, maxLinesPerCol * 2);
    col2.forEach((item, idx) => {
      drawTreeRow(ctx, item, col2X, startY + idx * lineH, 360);
    });

    const excess = flattened.length - maxLinesPerCol * 2;
    if (excess > 0) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`... +${excess} outros arquivos e pastas`, col2X + 16, startY + (maxLinesPerCol - 1) * lineH);
    }
  } else {
    // Coluna única
    flattened.forEach((item, idx) => {
      drawTreeRow(ctx, item, col1X, startY + idx * lineH, 750);
    });
  }

  // 5. Rodapé temático (Y: 565 -> 600)
  ctx.fillStyle = '#0b0f19';
  ctx.fillRect(0, 565, width, 35);
  ctx.strokeStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(0, 565);
  ctx.lineTo(width, 565);
  ctx.stroke();

  ctx.font = '10px "JetBrains Mono", "SF Mono", "Fira Code", monospace';
  ctx.fillStyle = '#475569';
  ctx.fillText('MÁQUINA DO TEMPO • EVOLUÇÃO ESTRUTURAL COMMIT A COMMIT', 24, 586);
  const brand = 'Gama Git Explorer';
  const brandW = ctx.measureText(brand).width;
  ctx.fillText(brand, width - 24 - brandW, 586);
};

/**
 * Renderiza um quadro do modo "Crescimento de Branches & Commits" (Grafo em Árvore) no canvas 800x600 px
 */
const renderGraphGrowthToCanvas = (ctx, {
  owner,
  repo,
  branch,
  commitIndex,
  totalCommits,
  orderedCommits,
}) => {
  const width = CANVAS_WIDTH;
  const height = CANVAS_HEIGHT;

  // 1. Fundo escuro imersivo com sutil malha de engenharia
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, width, height);

  // Grade sutil de pontos guia
  ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
  for (let gx = 35; gx < width; gx += 45) {
    for (let gy = 135; gy < height - 35; gy += 45) {
      ctx.fillRect(gx, gy, 1, 1);
    }
  }

  // Borda externa
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

  // Commits acumulados até este quadro
  const visibleCommits = orderedCommits.slice(0, commitIndex + 1);
  const currentCommit = orderedCommits[commitIndex];

  // 2. Cabeçalho Superior (Card 20, 16, 760, 96)
  const cardX = 20;
  const cardY = 16;
  const cardW = width - 40;
  const cardH = 96;

  ctx.fillStyle = '#0f172a';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 8);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);
  }

  // Linha 1: Título e Tipo
  ctx.font = 'bold 12.5px "JetBrains Mono", "SF Mono", "Fira Code", monospace';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(`MÁQUINA DO TEMPO: ${owner}/${repo}`, cardX + 16, cardY + 24);

  // Badge do modo Grafo em Árvore
  ctx.font = '11px "JetBrains Mono", "SF Mono", "Fira Code", monospace';
  ctx.fillStyle = '#c084fc';
  ctx.fillText(`[🌿 Árvore de Branches & Commits]`, cardX + 225 + (owner.length > 10 ? 35 : 0), cardY + 24);

  // Contador de nós
  const commitCounter = `Nó ${commitIndex + 1} de ${totalCommits}`;
  const counterWidth = ctx.measureText(commitCounter).width;
  ctx.fillStyle = '#34d399';
  ctx.fillText(commitCounter, cardX + cardW - counterWidth - 16, cardY + 24);

  // Linha 2: Hash do commit atual que brotou, data e autor
  const shortSha = (currentCommit.sha || '').substring(0, 7);
  let commitDate = '';
  if (currentCommit.commit?.author?.date) {
    const d = new Date(currentCommit.commit.author.date);
    commitDate = d.toISOString().replace('T', ' ').substring(0, 16);
  }
  const authorName = currentCommit.commit?.author?.name || currentCommit.author?.login || 'desconhecido';

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px "JetBrains Mono", "SF Mono", "Fira Code", monospace';
  ctx.fillText(`[${shortSha}]`, cardX + 16, cardY + 50);

  ctx.font = '11px "JetBrains Mono", "SF Mono", "Fira Code", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`${commitDate} por `, cardX + 84, cardY + 50);

  const prefixW = ctx.measureText(`${commitDate} por `).width;
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(authorName, cardX + 84 + prefixW, cardY + 50);

  // Linha 3: Mensagem do commit em destaque
  const rawMsg = (currentCommit.commit?.message || 'Sem mensagem informada').split('\n')[0].trim();
  const maxMsgLen = 74;
  const displayMsg = rawMsg.length > maxMsgLen ? rawMsg.substring(0, maxMsgLen) + '...' : rawMsg;

  ctx.font = 'italic 11.5px "JetBrains Mono", "SF Mono", "Fira Code", monospace';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`"${displayMsg}"`, cardX + 16, cardY + 74);

  // Linha de progresso no cartão superior
  const progressRatio = (commitIndex + 1) / totalCommits;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cardX, cardY + cardH - 3, cardW, 3);
  ctx.fillStyle = '#8b5cf6';
  ctx.fillRect(cardX, cardY + cardH - 3, cardW * progressRatio, 3);

  // 3. Sub-cabeçalho da Área do Grafo
  ctx.font = '11px "JetBrains Mono", "SF Mono", "Fira Code", monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText(
    `GRAFO DE COMMITS DA BRANCH [${branch}] • ${visibleCommits.length} NÓS ACUMULADOS`,
    cardX + 4,
    130
  );

  // 4. Algoritmo de Lanes e Coordenadas para o Grafo em Árvore
  const LANE_COLORS = [
    '#6366f1', // Trilho 0: Índigo (Tronco Principal)
    '#10b981', // Trilho 1: Esmeralda
    '#f59e0b', // Trilho 2: Âmbar
    '#06b6d4', // Trilho 3: Ciano
    '#ec4899', // Trilho 4: Rosa
    '#8b5cf6', // Trilho 5: Púrpura
  ];

  // Atribuição de trilhos aos commits
  const laneAssignments = new Map();
  for (let idx = 0; idx < visibleCommits.length; idx++) {
    const c = visibleCommits[idx];
    const parents = c.parents || [];
    let assignedLane = 0;

    if (parents.length > 1) {
      assignedLane = 0;
    } else if (idx === 0) {
      assignedLane = 0;
    } else {
      const parentSha = parents[0]?.sha;
      const parentLane = laneAssignments.get(parentSha);
      if (parentLane !== undefined) {
        assignedLane = parentLane;
      } else {
        assignedLane = (idx % 3);
      }
    }
    laneAssignments.set(c.sha, assignedLane);
  }

  // Janela visível de exibição adaptativa (até 10 nós para máximo conforto e nitidez)
  const maxVisibleNodes = 10;
  const isScrolled = visibleCommits.length > maxVisibleNodes;
  const startIndex = isScrolled ? visibleCommits.length - maxVisibleNodes : 0;
  const renderedNodes = visibleCommits.slice(startIndex);

  // Parâmetros de layout
  const startY = 160;
  const rowHeight = Math.min(38, Math.floor(380 / (renderedNodes.length + 1)));
  const laneStartX = 55;
  const laneGap = 24;

  // Se houver commits anteriores ocultos pela janela deslizante
  if (isScrolled) {
    ctx.save();
    ctx.font = 'italic 10.5px "JetBrains Mono", "SF Mono", "Fira Code", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`▲ +${startIndex} commits anteriores na raiz da árvore...`, laneStartX + 35, startY - 14);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(laneStartX, startY - 22);
    ctx.lineTo(laneStartX, startY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Mapeia posições na tela de cada nó renderizado
  const nodePositions = new Map();
  renderedNodes.forEach((c, relIdx) => {
    const lane = laneAssignments.get(c.sha) || 0;
    const x = laneStartX + lane * laneGap;
    const y = startY + relIdx * rowHeight;
    nodePositions.set(c.sha, { x, y, lane, commit: c, relIdx, absIdx: startIndex + relIdx });
  });

  // 5. Desenho das Arestas / Conexões do Grafo (Curvas de Bézier e Linhas)
  ctx.save();
  renderedNodes.forEach((c) => {
    const currentPos = nodePositions.get(c.sha);
    if (!currentPos) return;

    const parents = c.parents || [];
    parents.forEach((parentRef) => {
      const parentPos = nodePositions.get(parentRef.sha);
      const laneColor = LANE_COLORS[currentPos.lane % LANE_COLORS.length];

      ctx.strokeStyle = laneColor;
      ctx.lineWidth = 2.5;

      if (parentPos) {
        ctx.beginPath();
        if (parentPos.x === currentPos.x) {
          ctx.moveTo(parentPos.x, parentPos.y);
          ctx.lineTo(currentPos.x, currentPos.y);
        } else {
          ctx.moveTo(parentPos.x, parentPos.y);
          const midY = (parentPos.y + currentPos.y) / 2;
          ctx.bezierCurveTo(parentPos.x, midY, currentPos.x, midY, currentPos.x, currentPos.y);
        }
        ctx.stroke();
      } else if (startIndex > 0) {
        ctx.beginPath();
        ctx.moveTo(currentPos.x, currentPos.y);
        ctx.lineTo(currentPos.x, startY - 10);
        ctx.stroke();
      }
    });

    if (parents.length === 0 && currentPos.relIdx > 0) {
      const prevNode = renderedNodes[currentPos.relIdx - 1];
      const prevPos = nodePositions.get(prevNode.sha);
      if (prevPos && prevPos.x === currentPos.x) {
        ctx.strokeStyle = LANE_COLORS[currentPos.lane % LANE_COLORS.length];
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(prevPos.x, prevPos.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();
      }
    }
  });
  ctx.restore();

  // 6. Desenho dos Vértices / Nós de Commit e seus Rótulos
  renderedNodes.forEach((c) => {
    const pos = nodePositions.get(c.sha);
    if (!pos) return;

    const isLatest = (c.sha === currentCommit.sha);
    const laneColor = LANE_COLORS[pos.lane % LANE_COLORS.length];
    const isMerge = (c.parents && c.parents.length > 1);

    // Efeito de Halo no commit recém-adicionado
    if (isLatest) {
      ctx.save();
      const glowGrad = ctx.createRadialGradient(pos.x, pos.y, 2, pos.x, pos.y, 16);
      glowGrad.addColorStop(0, 'rgba(52, 211, 153, 0.65)');
      glowGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.3)');
      glowGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Círculo principal do nó
    ctx.save();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, isLatest ? 5.5 : 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isLatest ? '#10b981' : laneColor;
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ponto central
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    // Se for nó de merge, anel dourado extra
    if (isMerge && !isLatest) {
      ctx.save();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // --- Rótulos Textuais do Commit ---
    const textStartX = laneStartX + 3 * laneGap + 18;
    const textY = pos.y + 4;
    let currentX = textStartX;

    // Badge de NOVO
    if (isLatest) {
      ctx.save();
      ctx.fillStyle = '#064e3b';
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 1;
      const tagW = 54;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(currentX, textY - 12, tagW, 16, 4);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(currentX, textY - 12, tagW, 16);
      }
      ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
      ctx.fillStyle = '#34d399';
      ctx.fillText('✦ NOVO', currentX + 6, textY);
      ctx.restore();
      currentX += tagW + 8;
    }

    // Badge de MERGE
    if (isMerge) {
      ctx.save();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      const mergeTagW = 46;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(currentX, textY - 12, mergeTagW, 16, 4);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(currentX, textY - 12, mergeTagW, 16);
      }
      ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('MERGE', currentX + 6, textY);
      ctx.restore();
      currentX += mergeTagW + 8;
    }

    // Hash curto
    const nodeSha = (c.sha || '').substring(0, 7);
    ctx.font = 'bold 11px "JetBrains Mono", "SF Mono", monospace';
    ctx.fillStyle = isLatest ? '#38bdf8' : '#7dd3fc';
    ctx.fillText(`[${nodeSha}]`, currentX, textY);
    currentX += 66;

    // Mensagem do commit
    const commitMsg = (c.commit?.message || '').split('\n')[0].trim();
    const maxMsgChars = isLatest ? 40 : 46;
    const cleanMsg = commitMsg.length > maxMsgChars ? commitMsg.substring(0, maxMsgChars) + '...' : commitMsg;

    ctx.font = isLatest ? 'bold 11px "JetBrains Mono", monospace' : '11px "JetBrains Mono", monospace';
    ctx.fillStyle = isLatest ? '#ffffff' : '#cbd5e1';
    ctx.fillText(cleanMsg, currentX, textY);

    // Autor à direita
    const nodeAuthor = c.commit?.author?.name || c.author?.login || '';
    const displayAuthor = nodeAuthor.length > 14 ? nodeAuthor.substring(0, 12) + '..' : nodeAuthor;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = isLatest ? '#a5b4fc' : '#64748b';
    ctx.fillText(displayAuthor, width - 150, textY);
  });

  // 7. Rodapé do Canvas (Barra de status)
  const footY = height - 28;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, footY, width, 28);
  ctx.strokeStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(0, footY);
  ctx.lineTo(width, footY);
  ctx.stroke();

  ctx.font = '10.5px "JetBrains Mono", "SF Mono", "Fira Code", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`MÁQUINA DO TEMPO • CRESCIMENTO DE BRANCHES E COMMITS (GRAFO EM ÁRVORE)`, 24, footY + 18);

  const statusRight = `Quadro ${commitIndex + 1} de ${totalCommits}`;
  const statusRightW = ctx.measureText(statusRight).width;
  ctx.fillStyle = '#818cf8';
  ctx.fillText(statusRight, width - statusRightW - 24, footY + 18);

  // Barra de progresso acumulado no rodapé
  ctx.fillStyle = '#8b5cf6';
  ctx.fillRect(0, height - 3, width * progressRatio, 3);
};

/**
 * Desenha uma folha botânica com curvatura natural e nervura central
 */
const drawBotanicalLeaf = (ctx, x, y, angle, size, color, alpha = 0.9) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;

  // Formato da folha botânica
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.45, -size * 0.38, size, 0);
  ctx.quadraticCurveTo(size * 0.45, size * 0.38, 0, 0);
  ctx.fill();

  // Nervura central da folha
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size * 0.8, 0);
  ctx.stroke();

  ctx.restore();
};

/**
 * Desenha uma flor / broto estrelado para commits especiais ou merges
 */
const drawBlossomFlower = (ctx, x, y, size, petalColor = '#fbbf24') => {
  ctx.save();
  ctx.translate(x, y);

  // 5 pétalas em arranjo radial
  for (let p = 0; p < 5; p++) {
    const pAngle = (p * Math.PI * 2) / 5;
    ctx.save();
    ctx.rotate(pAngle);
    ctx.fillStyle = petalColor;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(size * 0.65, 0, size * 0.65, size * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Centro dourado luminoso
  ctx.fillStyle = '#fef08a';
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

/**
 * Desenha raízes e o morro de terra na base da árvore
 */
const drawRootsAndGround = (ctx, width, height) => {
  const groundY = 515;

  // Névoa suave na base
  const mistGrad = ctx.createLinearGradient(0, groundY - 50, 0, groundY + 40);
  mistGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
  mistGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.05)');
  mistGrad.addColorStop(1, 'rgba(6, 10, 18, 0.95)');
  ctx.fillStyle = mistGrad;
  ctx.fillRect(0, groundY - 50, width, 90);

  // Colina suave
  ctx.beginPath();
  ctx.moveTo(0, groundY + 28);
  ctx.bezierCurveTo(240, groundY - 8, 560, groundY - 8, width, groundY + 28);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = '#060a12';
  ctx.fill();

  // Borda da colina com suave iluminação verde-musgo
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 28);
  ctx.bezierCurveTo(240, groundY - 8, 560, groundY - 8, width, groundY + 28);
  ctx.stroke();

  // Raízes espalhando-se a partir da base (400, 515)
  ctx.strokeStyle = '#1e293b';
  ctx.lineCap = 'round';

  // Raiz 1 (esquerda externa)
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(394, 515);
  ctx.quadraticCurveTo(360, 528, 315, 540);
  ctx.stroke();

  // Raiz 2 (esquerda interna)
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(398, 515);
  ctx.quadraticCurveTo(382, 532, 360, 548);
  ctx.stroke();

  // Raiz 3 (direita externa)
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(406, 515);
  ctx.quadraticCurveTo(440, 528, 485, 540);
  ctx.stroke();

  // Raiz 4 (direita interna)
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(402, 515);
  ctx.quadraticCurveTo(418, 532, 440, 548);
  ctx.stroke();
};

/**
 * Desenha partículas de luz / esporos mágicos flutuando na copa
 */
const drawLightMotes = (ctx, commitIndex, totalCommits) => {
  const count = Math.min(22, 6 + Math.floor((commitIndex / totalCommits) * 16));
  for (let i = 0; i < count; i++) {
    const seed = (i * 997 + commitIndex * 43) % 1000;
    const px = 170 + ((seed * 7) % 460);
    const py = 120 + ((seed * 13) % 330);
    const size = 1.2 + (seed % 2.4);
    const alpha = 0.2 + (Math.sin(commitIndex * 0.35 + i) * 0.25 + 0.25);

    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fillStyle = i % 3 === 0 ? '#34d399' : i % 3 === 1 ? '#a7f3d0' : '#fde047';
    ctx.globalAlpha = Math.max(0.15, Math.min(0.85, alpha));
    ctx.fill();
    ctx.restore();
  }
};

/**
 * Desenha a aura luminosa e centelha no novo ramo que acabou de brotar
 */
const drawSproutHalo = (ctx, x, y) => {
  ctx.save();
  const grad = ctx.createRadialGradient(x, y, 2, x, y, 26);
  grad.addColorStop(0, 'rgba(52, 211, 153, 0.9)');
  grad.addColorStop(0.35, 'rgba(16, 185, 129, 0.45)');
  grad.addColorStop(0.75, 'rgba(16, 185, 129, 0.12)');
  grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, 26, 0, Math.PI * 2);
  ctx.fill();

  // Anel sutil de energia
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.stroke();

  // Centelha central
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

/**
 * Formata data de commit de forma limpa e condensada (ex: "14 Fev 2024")
 */
const formatCommitDateShort = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const month = months[d.getMonth()] || '';
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return String(dateStr).substring(0, 10);
  }
};

/**
 * Constrói o modelo de galhos e ramificações botânicas para cobrir harmoniosamente a tela
 */
const buildOrganicTreeModel = (totalCommits, orderedCommits) => {
  const BASE_BRANCHES = [
    // Tronco base e bifurcação
    { id: 0, parentId: null, x1: 400, y1: 515, cx: 398, cy: 460, x2: 400, y2: 425, thickness: 14, depth: 0 },
    { id: 1, parentId: 0, x1: 400, y1: 425, cx: 402, cy: 395, x2: 400, y2: 365, thickness: 11, depth: 0 },

    // Nível 1: Grandes bacias e galhos principais
    { id: 2, parentId: 1, x1: 400, y1: 365, cx: 350, cy: 340, x2: 310, y2: 305, thickness: 8.5, depth: 1 },
    { id: 3, parentId: 1, x1: 400, y1: 365, cx: 450, cy: 340, x2: 490, y2: 305, thickness: 8.5, depth: 1 },
    { id: 4, parentId: 1, x1: 400, y1: 365, cx: 398, cy: 320, x2: 400, y2: 270, thickness: 7.5, depth: 1 },

    // Nível 2: Ramos secundários
    { id: 5, parentId: 2, x1: 310, y1: 305, cx: 260, cy: 285, x2: 220, y2: 255, thickness: 6.5, depth: 2 },
    { id: 6, parentId: 2, x1: 310, y1: 305, cx: 315, cy: 260, x2: 325, y2: 220, thickness: 6, depth: 2 },
    { id: 7, parentId: 3, x1: 490, y1: 305, cx: 485, cy: 260, x2: 475, y2: 220, thickness: 6, depth: 2 },
    { id: 8, parentId: 3, x1: 490, y1: 305, cx: 540, cy: 285, x2: 580, y2: 255, thickness: 6.5, depth: 2 },
    { id: 9, parentId: 4, x1: 400, y1: 270, cx: 375, cy: 230, x2: 360, y2: 195, thickness: 5.5, depth: 2 },
    { id: 10, parentId: 4, x1: 400, y1: 270, cx: 425, cy: 230, x2: 440, y2: 195, thickness: 5.5, depth: 2 },

    // Nível 3: Ramos terciários da copa
    { id: 11, parentId: 5, x1: 220, y1: 255, cx: 175, cy: 250, x2: 145, y2: 235, thickness: 4.5, depth: 3 },
    { id: 12, parentId: 5, x1: 220, y1: 255, cx: 195, cy: 215, x2: 180, y2: 180, thickness: 4.5, depth: 3 },
    { id: 13, parentId: 6, x1: 325, y1: 220, cx: 290, cy: 195, x2: 265, y2: 165, thickness: 4, depth: 3 },
    { id: 14, parentId: 6, x1: 325, y1: 220, cx: 320, cy: 175, x2: 315, y2: 140, thickness: 4, depth: 3 },
    { id: 15, parentId: 9, x1: 360, y1: 195, cx: 355, cy: 155, x2: 350, y2: 125, thickness: 3.8, depth: 3 },
    { id: 16, parentId: 4, x1: 400, y1: 270, cx: 399, cy: 185, x2: 400, y2: 110, thickness: 4, depth: 3 },
    { id: 17, parentId: 10, x1: 440, y1: 195, cx: 445, cy: 155, x2: 450, y2: 125, thickness: 3.8, depth: 3 },
    { id: 18, parentId: 7, x1: 475, y1: 220, cx: 480, cy: 175, x2: 485, y2: 140, thickness: 4, depth: 3 },
    { id: 19, parentId: 7, x1: 475, y1: 220, cx: 510, cy: 195, x2: 535, y2: 165, thickness: 4, depth: 3 },
    { id: 20, parentId: 8, x1: 580, y1: 255, cx: 605, cy: 215, x2: 620, y2: 180, thickness: 4.5, depth: 3 },
    { id: 21, parentId: 8, x1: 580, y1: 255, cx: 625, cy: 250, x2: 655, y2: 235, thickness: 4.5, depth: 3 },
  ];

  const branches = [...BASE_BRANCHES];

  // Se houver mais commits que galhos básicos, geramos brotos adicionais distribuídos harmonicamente
  const needed = Math.max(totalCommits, branches.length);
  for (let id = branches.length; id < needed; id++) {
    const parent = branches[11 + (id % 11)];
    const dir = Math.atan2(parent.y2 - parent.y1, parent.x2 - parent.x1);
    const spread = ((id % 2 === 0 ? 1 : -1) * (0.22 + ((id * 17) % 30) / 100));
    const a = dir + spread;
    const len = 28 + ((id * 19) % 22);

    const x2 = parent.x2 + Math.cos(a) * len;
    const y2 = parent.y2 + Math.sin(a) * len;
    const cx = (parent.x2 + x2) / 2 + Math.cos(a + 0.5) * 7;
    const cy = (parent.y2 + y2) / 2 + Math.sin(a + 0.5) * 7;

    branches.push({
      id,
      parentId: parent.id,
      x1: parent.x2,
      y1: parent.y2,
      cx,
      cy,
      x2,
      y2,
      thickness: 3.2,
      depth: 4,
    });
  }

  // Paleta de folhas naturais com variações botânicas
  const LEAF_COLORS = ['#10b981', '#34d399', '#059669', '#6ee7b7', '#a3e635'];

  // Gera folhagens e flores anexadas a cada galho
  branches.forEach((b, idx) => {
    const dirAngle = Math.atan2(b.y2 - b.y1, b.x2 - b.x1);
    const leaves = [];

    // Folhas na ponta do galho (apical cluster)
    const leafCount = b.depth === 0 ? 0 : b.depth === 1 ? 2 : 4;
    for (let l = 0; l < leafCount; l++) {
      const spread = (l - (leafCount - 1) / 2) * 0.42;
      const leafAngle = dirAngle + spread;
      const size = Math.max(9, 15 - b.depth * 1.8 + ((idx + l) % 3));
      const color = LEAF_COLORS[(idx + l) % LEAF_COLORS.length];
      leaves.push({
        x: b.x2,
        y: b.y2,
        angle: leafAngle,
        size,
        color,
      });
    }

    // Folhas laterais no meio do galho (para galhos maiores)
    if (b.depth >= 2) {
      const midX = (b.x1 + b.x2) / 2;
      const midY = (b.y1 + b.y2) / 2;
      leaves.push({
        x: midX,
        y: midY,
        angle: dirAngle - 0.7,
        size: 9,
        color: LEAF_COLORS[(idx + 2) % LEAF_COLORS.length],
      });
      leaves.push({
        x: midX,
        y: midY,
        angle: dirAngle + 0.7,
        size: 9,
        color: LEAF_COLORS[(idx + 3) % LEAF_COLORS.length],
      });
    }

    b.leaves = leaves;

    // Associa se este nó deve florescer (commits com múltiplos pais / merges ou marcos)
    const commitRef = orderedCommits[idx % orderedCommits.length];
    const isMerge = commitRef && commitRef.parents && commitRef.parents.length > 1;
    const isMilestone = (idx > 0 && idx % 5 === 0);
    b.hasBlossom = isMerge || isMilestone;
    b.blossomColor = isMerge ? '#c084fc' : '#fbbf24';
  });

  return branches;
};

/* Função de interpolação curva Bézier quadrática para esticar galho suavemente */
const interpolateQuadratic = (p0, p1, p2, t) => {
  const oneMinusT = 1 - t;
  return oneMinusT * oneMinusT * p0 + 2 * oneMinusT * t * p1 + t * t * p2;
};

/* Easing suave cúbico para crescimento natural de galhos e flores */
const easeOutCubic = (x) => {
  const t = Math.max(0, Math.min(1, x));
  const f = 1 - t;
  return 1 - f * f * f;
};

/**
 * Renderiza um quadro do modo "Evolução da Árvore" no canvas de 800x600 px
 * Cria uma ilustração pura e orgânica de árvore crescendo com galhos e folhagens,
 * sem textos de mensagens de commits, focando puramente na poesia visual de evolução temporal.
 * Suporta subFrame e totalSubFrames para interpolação ultra-fluida (Mini Clipe / Time-Lapse)
 */
const renderOrganicTreeToCanvas = (ctx, {
  owner,
  repo,
  branch,
  commitIndex,
  totalCommits,
  orderedCommits,
  subFrame = 0,
  totalSubFrames = 1,
  zoomLevel = 'auto',
}) => {
  const width = CANVAS_WIDTH;
  const height = CANVAS_HEIGHT;

  // 1. Fundo escuro celestial profundo com gradiente atmosférico
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#070a14');
  bgGrad.addColorStop(0.5, '#0b1220');
  bgGrad.addColorStop(1, '#05070e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Aura bioluminescente suave na copa da árvore
  const crownAura = ctx.createRadialGradient(400, 260, 20, 400, 260, 270);
  crownAura.addColorStop(0, 'rgba(16, 185, 129, 0.08)');
  crownAura.addColorStop(0.5, 'rgba(99, 102, 241, 0.035)');
  crownAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = crownAura;
  ctx.beginPath();
  ctx.arc(400, 260, 270, 0, Math.PI * 2);
  ctx.fill();

  // Borda sutil de enquadramento do canvas
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

  // 2. Partículas flutuantes / esporos luminosos
  drawLightMotes(ctx, commitIndex, totalCommits);

  // 3. Raízes e relevo de solo na base
  drawRootsAndGround(ctx, width, height);

  // 4. Modelo da árvore e cálculo contínuo de crescimento considerando sub-frames
  const allBranches = buildOrganicTreeModel(totalCommits, orderedCommits);
  const continuousIndex = commitIndex + (totalSubFrames > 1 ? subFrame / totalSubFrames : 0);
  const continuousProgress = Math.min(1, (continuousIndex + 1) / totalCommits);

  const branchTarget = continuousProgress * allBranches.length;
  const fullBranchCount = Math.floor(branchTarget);
  const fractionalBranch = branchTarget - fullBranchCount;

  const activeCount = Math.max(1, Math.ceil(branchTarget));
  const activeBranches = allBranches.slice(0, activeCount);
  const newestBranchIndex = activeBranches.length - 1;
  const newestBranch = activeBranches[newestBranchIndex];

  // Fator de crescimento esticado do galho mais recente
  const newestGrowthFactor =
    newestBranchIndex === 0
      ? 1
      : easeOutCubic(fractionalBranch > 0 ? fractionalBranch : 1);

  // -------------------------------------------------------------
  // AJUSTE DE ENQUADRAMENTO, ZOOM E MARGENS
  // Quanto mais commits e ramificações o repositório possuir, maior a árvore.
  // Aplicamos um zoom panorâmico inteligente (0.68x a 0.84x) ancorado
  // na base do tronco (400, 515), assegurando amplas margens de respiração
  // tanto laterais (>90px) quanto verticais.
  // O usuário também pode selecionar níveis específicos de zoom ('auto', 'panoramic', 'compact', 'close').
  // -------------------------------------------------------------
  let baseScale =
    totalCommits <= 15
      ? 0.84
      : totalCommits <= 30
      ? 0.78
      : totalCommits <= 50
      ? 0.72
      : 0.68;

  if (zoomLevel === 'panoramic') {
    baseScale *= 0.85; // Visão panorâmica bem espaçada com margens extras
  } else if (zoomLevel === 'compact') {
    baseScale *= 0.93; // Visão compacta equilibrada
  } else if (zoomLevel === 'close') {
    baseScale *= 1.15; // Visão aproximada para focar nos detalhes
  }

  ctx.save();
  // Centraliza a escala na base do tronco
  ctx.translate(400, 515);
  ctx.scale(baseScale, baseScale);
  ctx.translate(-400, -515);

  // 5. Desenho dos galhos (Casca exterior e seiva interior com interpolação de curva)
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Passada 1: Casca externa dos galhos
  activeBranches.forEach((b, idx) => {
    const isNewest = idx === newestBranchIndex;
    const growth = isNewest ? Math.max(0.08, newestGrowthFactor) : 1;

    const endX = interpolateQuadratic(b.x1, b.cx, b.x2, growth);
    const endY = interpolateQuadratic(b.y1, b.cy, b.y2, growth);
    const ctrlX = b.x1 + (b.cx - b.x1) * growth;
    const ctrlY = b.y1 + (b.cy - b.y1) * growth;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = Math.max(1.5, b.thickness * (isNewest ? 0.7 + growth * 0.3 : 1));
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    ctx.stroke();
  });

  // Passada 2: Veio interior da madeira com brilho mineral suave
  activeBranches.forEach((b, idx) => {
    const isNewest = idx === newestBranchIndex;
    const growth = isNewest ? Math.max(0.08, newestGrowthFactor) : 1;

    const endX = interpolateQuadratic(b.x1, b.cx, b.x2, growth);
    const endY = interpolateQuadratic(b.y1, b.cy, b.y2, growth);
    const ctrlX = b.x1 + (b.cx - b.x1) * growth;
    const ctrlY = b.y1 + (b.cy - b.y1) * growth;

    ctx.strokeStyle =
      b.depth === 0
        ? '#334155'
        : isNewest
        ? '#10b981'
        : '#059669';
    ctx.lineWidth = Math.max(1, b.thickness * 0.38);
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    ctx.stroke();
  });

  // 6. Desenho das Folhagens e Flores com desabrochar progressivo
  activeBranches.forEach((b, bIdx) => {
    const isNewest = bIdx === newestBranchIndex;
    const growth = isNewest ? newestGrowthFactor : 1;

    // Se o galho ainda está no broto inicial (< 35%), as folhas ainda não surgiram
    if (isNewest && growth < 0.35) return;

    const leafBloomProgress = isNewest ? (growth - 0.35) / 0.65 : 1;
    const bloomFactor = easeOutCubic(leafBloomProgress);
    const maturityScale = (0.75 + continuousProgress * 0.35) * bloomFactor;

    // Folhas botânicas
    if (b.leaves && b.leaves.length > 0) {
      b.leaves.forEach((leaf) => {
        const leafX = isNewest ? b.x1 + (leaf.x - b.x1) * growth : leaf.x;
        const leafY = isNewest ? b.y1 + (leaf.y - b.y1) * growth : leaf.y;

        drawBotanicalLeaf(
          ctx,
          leafX,
          leafY,
          leaf.angle,
          leaf.size * maturityScale,
          leaf.color,
          Math.min(0.95, bloomFactor * 0.95)
        );
      });
    }

    // Flores nos galhos de merge / marcos
    if (b.hasBlossom) {
      const flowerX = isNewest
        ? interpolateQuadratic(b.x1, b.cx, b.x2, growth)
        : b.x2;
      const flowerY = isNewest
        ? interpolateQuadratic(b.y1, b.cy, b.y2, growth)
        : b.y2;
      drawBlossomFlower(ctx, flowerX, flowerY, 7.5 * maturityScale, b.blossomColor);
    }
  });

  // 7. Efeito de broto luminoso na ponta em crescimento
  if (newestBranch) {
    const tipX = interpolateQuadratic(
      newestBranch.x1,
      newestBranch.cx,
      newestBranch.x2,
      newestGrowthFactor
    );
    const tipY = interpolateQuadratic(
      newestBranch.y1,
      newestBranch.cy,
      newestBranch.y2,
      newestGrowthFactor
    );
    drawSproutHalo(ctx, tipX, tipY);
  }

  // Restaura o contexto para desenhar a interface, cartões e timeline com coordenadas absolutas perfeitas
  ctx.restore();

  // 8. Cabeçalho Minimalista e Sereno (Sem mensagens de commit)
  const cardX = 20;
  const cardY = 16;
  const cardW = width - 40;
  const cardH = 58;

  ctx.fillStyle = '#0f172a';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 8);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeRect(cardX, cardY, cardW, cardH);
  }

  // Título e identificador da árvore
  ctx.font = 'bold 12.5px "JetBrains Mono", "SF Mono", "Fira Code", monospace';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(`EVOLUÇÃO DA ÁRVORE: ${owner}/${repo}`, cardX + 16, cardY + 25);

  // Badge da Branch
  ctx.font = '11px "JetBrains Mono", "SF Mono", "Fira Code", monospace';
  ctx.fillStyle = '#34d399';
  const repoTitleW = ctx.measureText(`EVOLUÇÃO DA ÁRVORE: ${owner}/${repo}`).width;
  ctx.fillText(`[branch: ${branch}]`, cardX + 24 + repoTitleW, cardY + 25);

  // Estágio e Contador de Ciclos
  const stageCounter = `Estágio ${commitIndex + 1} de ${totalCommits}`;
  const counterW = ctx.measureText(stageCounter).width;
  ctx.fillStyle = '#a5b4fc';
  ctx.fillText(stageCounter, cardX + cardW - counterW - 16, cardY + 25);

  // Sublegenda poética
  ctx.font = '11px "JetBrains Mono", "SF Mono", "Fira Code", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(
    `Crescimento botânico do repositório • ${activeBranches.length} ramificações vivas`,
    cardX + 16,
    cardY + 44
  );

  // Barra de progresso verde-esmeralda na base do cartão
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cardX, cardY + cardH - 3, cardW, 3);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(cardX, cardY + cardH - 3, cardW * continuousProgress, 3);

  // 9. Linha do Tempo e Rodapé Ilustrativo (Y: 565 -> 600)
  ctx.fillStyle = '#080c14';
  ctx.fillRect(0, 565, width, 35);
  ctx.strokeStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(0, 565);
  ctx.lineTo(width, 565);
  ctx.stroke();

  // Linha do tempo cronológica com sementes
  const tlStartX = 30;
  const tlEndX = width - 30;
  const tlWidth = tlEndX - tlStartX;
  const tlY = 574;

  // Trilho de fundo
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tlStartX, tlY);
  ctx.lineTo(tlEndX, tlY);
  ctx.stroke();

  // Trilho percorrido até o momento
  const currentTlX = tlStartX + tlWidth * continuousProgress;
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(tlStartX, tlY);
  ctx.lineTo(currentTlX, tlY);
  ctx.stroke();

  // Broto luminoso sobre a linha do tempo
  ctx.fillStyle = '#34d399';
  ctx.beginPath();
  ctx.arc(currentTlX, tlY, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Rótulos de datas nas extremidades da linha do tempo
  const firstCommit = orderedCommits[0];
  const currentCommit = orderedCommits[commitIndex];
  const firstDate = firstCommit?.commit?.author?.date ? formatCommitDateShort(firstCommit.commit.author.date) : '';
  const currentDate = currentCommit?.commit?.author?.date ? formatCommitDateShort(currentCommit.commit.author.date) : '';

  ctx.font = '10px "JetBrains Mono", "SF Mono", "Fira Code", monospace';
  ctx.fillStyle = '#64748b';
  if (firstDate) {
    ctx.fillText(`Raiz: ${firstDate}`, tlStartX, 592);
  }

  // Indicador de maturidade central
  const maturityText = `Maturidade da Árvore: ${Math.round(continuousProgress * 100)}%`;
  const maturityW = ctx.measureText(maturityText).width;
  ctx.fillStyle = '#10b981';
  ctx.fillText(maturityText, width / 2 - maturityW / 2, 592);

  if (currentDate) {
    const currDateText = `Atual: ${currentDate}`;
    const currDateW = ctx.measureText(currDateText).width;
    ctx.fillStyle = '#64748b';
    ctx.fillText(currDateText, tlEndX - currDateW, 592);
  }
};

/**
 * Componente TimeMachine (Máquina do Tempo)
 * Gera um GIF animado demonstrando a evolução da estrutura de pastas do repositório
 */
const TimeMachine = ({ owner, repo, branches = [], currentBranch = '' }) => {
  const { commits = [] } = useAppContext();
  const [selectedBranch, setSelectedBranch] = useState(currentBranch || '');

  const isSelectedBranchActive = !selectedBranch || selectedBranch === currentBranch;
  const loadedCommitsCount = isSelectedBranchActive && commits && commits.length > 0 ? commits.length : (commits?.length || 60);
  const maxLimit = Math.max(2, loadedCommitsCount);

  const [maxCommits, setMaxCommits] = useState(30);
  const [frameDelay, setFrameDelay] = useState(600); // ms por frame
  const [animationType, setAnimationType] = useState('organic_tree'); // 'organic_tree' | 'tree_evolution' | 'graph_growth'
  const [exportFormat, setExportFormat] = useState('video'); // 'video' (Mini Clipe 60 FPS) | 'gif' (GIF Animado)
  const [motionStyle, setMotionStyle] = useState('smooth'); // 'smooth' (Fluido / Time-Lapse) | 'classic' (Passo a passo)
  const [treeZoom, setTreeZoom] = useState('auto'); // 'auto' | 'panoramic' | 'compact' | 'close'
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [stage, setStage] = useState('idle'); // 'idle' | 'fetching' | 'encoding' | 'completed' | 'error'
  const [errorMessage, setErrorMessage] = useState(null);
  const [gifUrl, setGifUrl] = useState(null);
  const [gifBlobSize, setGifBlobSize] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoBlobSize, setVideoBlobSize] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);

  const canvasRef = useRef(null);
  const abortControllerRef = useRef(false);
  const currentGifEncoderRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  // Sincroniza branch inicial quando a prop currentBranch mudar
  useEffect(() => {
    if (currentBranch) {
      setSelectedBranch(currentBranch);
    } else if (branches && branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].name);
    }
  }, [currentBranch, branches]);

  // Limpeza de URLs do Blob ao desmontar
  useEffect(() => {
    return () => {
      if (gifUrl) {
        URL.revokeObjectURL(gifUrl);
      }
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [gifUrl, videoUrl]);

  // Interrompe o processo se o usuário cancelar
  const handleCancel = () => {
    abortControllerRef.current = true;
    if (currentGifEncoderRef.current) {
      try {
        currentGifEncoderRef.current.abort();
      } catch (e) {
        console.warn('Erro ao abortar GIF:', e);
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Erro ao abortar MediaRecorder:', e);
      }
    }
    setIsGenerating(false);
    setStage('idle');
    setStatusText('Operação cancelada pelo usuário.');
  };

  /**
   * Pipeline de geração do GIF da Máquina do Tempo
   */
  const handleGenerateGif = async () => {
    if (!owner || !repo) {
      setErrorMessage('Proprietário ou repositório não identificados.');
      setStage('error');
      return;
    }

    const targetBranch = selectedBranch || currentBranch || (branches[0] && branches[0].name);
    if (!targetBranch) {
      setErrorMessage('Nenhuma branch selecionada para geração.');
      setStage('error');
      return;
    }

    // Inicializa estados
    abortControllerRef.current = false;
    setIsGenerating(true);
    setErrorMessage(null);
    setProgress(0);
    setStage('fetching');
    setStatusText(
      animationType === 'organic_tree'
        ? 'Iniciando crescimento ilustrativo da árvore...'
        : animationType === 'tree_evolution'
        ? 'Iniciando coleta do histórico e árvore de pastas...'
        : 'Iniciando coleta de commits para o Grafo em Árvore...'
    );

    if (gifUrl) {
      URL.revokeObjectURL(gifUrl);
      setGifUrl(null);
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      setErrorMessage('Canvas de renderização não inicializado.');
      setIsGenerating(false);
      setStage('error');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setErrorMessage('Contexto 2D do Canvas indisponível.');
      setIsGenerating(false);
      setStage('error');
      return;
    }

    try {
      // 1. Busca commits da branch selecionada (utiliza commits já carregados quando disponíveis)
      setStatusText(`Preparando até ${maxCommits} commits na branch "${targetBranch}"...`);
      let rawCommits;
      if (isSelectedBranchActive && commits && commits.length >= maxCommits) {
        rawCommits = commits.slice(0, maxCommits);
      } else {
        rawCommits = await getBranchCommits(owner, repo, targetBranch, 1, maxCommits);
      }

      if (abortControllerRef.current) return;

      if (!rawCommits || rawCommits.length === 0) {
        throw new Error(`Nenhum commit encontrado para a branch "${targetBranch}".`);
      }

      // Reverte a lista de commits para ir do mais antigo ao mais novo
      const orderedCommits = rawCommits.slice().reverse();
      const total = orderedCommits.length;

      // 2. Processa os quadros conforme o tipo de animação escolhido
      const workerScript = await getWorkerUrl();
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        workerScript: workerScript,
        background: '#090d16',
      });
      currentGifEncoderRef.current = gif;

      if (animationType === 'organic_tree') {
        // --- MODO 1: Evolução da Árvore (Ilustração Botânica Pura) ---
        setStatusText(`Desenhando o crescimento da Árvore Orgânica (${total} estágios)...`);
        setProgress(30);

        for (let i = 0; i < total; i++) {
          if (abortControllerRef.current) return;

          renderOrganicTreeToCanvas(ctx, {
            owner,
            repo,
            branch: targetBranch,
            commitIndex: i,
            totalCommits: total,
            orderedCommits,
            zoomLevel: treeZoom,
          });

          const isLastFrame = i === total - 1;
          const delay = isLastFrame ? Math.max(frameDelay * 3, 2000) : frameDelay;
          gif.addFrame(ctx, { copy: true, delay });

          // Atualização de progresso da renderização: 30% a 60%
          const prepProgress = 30 + Math.round(((i + 1) / total) * 30);
          setProgress(prepProgress);
        }

        setStage('encoding');
        setStatusText('Codificando quadros do GIF animado com Web Workers...');
      } else if (animationType === 'tree_evolution') {
        // --- MODO 2: Evolução dos Arquivos ---
        const framesData = [];

        for (let i = 0; i < total; i++) {
          if (abortControllerRef.current) return;

          const currentCommit = orderedCommits[i];
          const shortSha = currentCommit.sha.substring(0, 7);
          setStatusText(`Buscando árvore de arquivos do commit ${i + 1} de ${total} [${shortSha}]...`);

          try {
            const treeResponse = await getCommitTree(owner, repo, currentCommit.sha);
            framesData.push({
              commit: currentCommit,
              treeItems: treeResponse.tree || [],
              index: i,
            });

            // Renderiza o quadro ao vivo no canvas de prévia enquanto busca
            renderFrameToCanvas(ctx, {
              owner,
              repo,
              branch: targetBranch,
              commitIndex: i,
              totalCommits: total,
              commit: currentCommit,
              treeItems: treeResponse.tree || [],
            });
          } catch (treeErr) {
            console.warn(`Não foi possível obter árvore para commit ${shortSha}:`, treeErr);
            framesData.push({
              commit: currentCommit,
              treeItems: [],
              index: i,
            });
          }

          // Progresso proporcional da fase 1: 0% a 50%
          const fetchProgress = Math.round(((i + 1) / total) * 50);
          setProgress(fetchProgress);
        }

        if (abortControllerRef.current) return;

        setStage('encoding');
        setStatusText('Codificando quadros do GIF com Web Workers...');

        // Adiciona cada frame ao codificador
        for (let i = 0; i < framesData.length; i++) {
          if (abortControllerRef.current) return;

          const frameInfo = framesData[i];
          renderFrameToCanvas(ctx, {
            owner,
            repo,
            branch: targetBranch,
            commitIndex: frameInfo.index,
            totalCommits: total,
            commit: frameInfo.commit,
            treeItems: frameInfo.treeItems,
          });

          const isLastFrame = i === framesData.length - 1;
          const delay = isLastFrame ? Math.max(frameDelay * 2.5, 1800) : frameDelay;
          gif.addFrame(ctx, { copy: true, delay });
        }
      } else {
        // --- MODO 3: Crescimento das Branches e Commits (Grafo em Linhas) ---
        setStatusText(`Desenhando o crescimento do Grafo em Árvore (${total} nós)...`);
        setProgress(30);

        for (let i = 0; i < total; i++) {
          if (abortControllerRef.current) return;

          renderGraphGrowthToCanvas(ctx, {
            owner,
            repo,
            branch: targetBranch,
            commitIndex: i,
            totalCommits: total,
            orderedCommits,
          });

          const isLastFrame = i === total - 1;
          const delay = isLastFrame ? Math.max(frameDelay * 3, 2000) : frameDelay;
          gif.addFrame(ctx, { copy: true, delay });

          // Atualização de progresso da renderização: 30% a 60%
          const prepProgress = 30 + Math.round(((i + 1) / total) * 30);
          setProgress(prepProgress);
        }

        setStage('encoding');
        setStatusText('Codificando quadros do GIF animado com Web Workers...');
      }

      // Configura eventos do GIF
      gif.on('progress', (p) => {
        if (abortControllerRef.current) return;
        const base = animationType === 'tree_evolution' ? 50 : 60;
        const multiplier = 100 - base;
        const encodingProgress = base + Math.round(p * multiplier);
        setProgress(encodingProgress);
        setStatusText(`Codificando quadros do GIF animado... ${Math.round(p * 100)}%`);
      });

      gif.on('finished', (blob) => {
        if (abortControllerRef.current) return;
        const url = URL.createObjectURL(blob);
        setGifUrl(url);
        setGifBlobSize(blob.size);
        setProgress(100);
        setStage('completed');
        setStatusText('GIF gerado com sucesso!');
        setIsGenerating(false);
        currentGifEncoderRef.current = null;
      });

      // Dispara a renderização dos workers
      gif.render();
    } catch (err) {
      if (abortControllerRef.current) return;
      console.error('Erro na Máquina do Tempo:', err);
      const parsed = parseApiError(err, 'commits');
      setErrorMessage(parsed.message || 'Falha ao processar histórico de commits.');
      setStage('error');
      setIsGenerating(false);
      currentGifEncoderRef.current = null;
    }
  };

  const handleGenerateVideo = async () => {
    if (!owner || !repo) {
      setErrorMessage('Proprietário ou repositório não identificados.');
      setStage('error');
      return;
    }

    const targetBranch = selectedBranch || currentBranch || (branches[0] && branches[0].name);
    if (!targetBranch) {
      setErrorMessage('Nenhuma branch selecionada para geração.');
      setStage('error');
      return;
    }

    // Inicializa estados
    abortControllerRef.current = false;
    setIsGenerating(true);
    setErrorMessage(null);
    setProgress(0);
    setStage('fetching');
    setStatusText('Consultando histórico de commits para gravação do Mini Clipe...');

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
    if (gifUrl) {
      URL.revokeObjectURL(gifUrl);
      setGifUrl(null);
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      setErrorMessage('Canvas de renderização não inicializado.');
      setIsGenerating(false);
      setStage('error');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setErrorMessage('Contexto 2D do Canvas indisponível.');
      setIsGenerating(false);
      setStage('error');
      return;
    }

    try {
      // 1. Busca commits da branch selecionada (utiliza commits já carregados quando disponíveis)
      setStatusText(`Preparando até ${maxCommits} commits na branch "${targetBranch}"...`);
      let rawCommits;
      if (isSelectedBranchActive && commits && commits.length >= maxCommits) {
        rawCommits = commits.slice(0, maxCommits);
      } else {
        rawCommits = await getBranchCommits(owner, repo, targetBranch, 1, maxCommits);
      }

      if (abortControllerRef.current) return;

      if (!rawCommits || rawCommits.length === 0) {
        throw new Error(`Nenhum commit encontrado para a branch "${targetBranch}".`);
      }

      const orderedCommits = rawCommits.slice().reverse();
      const total = orderedCommits.length;

      // 2. Prepara pré-carregamento dos dados se for evolução de pastas
      let folderFramesData = [];
      if (animationType === 'tree_evolution') {
        setStatusText(`Carregando árvores de arquivos dos ${total} commits...`);
        for (let i = 0; i < total; i++) {
          if (abortControllerRef.current) return;
          const currentCommit = orderedCommits[i];
          const shortSha = currentCommit.sha.substring(0, 7);
          setStatusText(`Obtendo arquivos do commit ${i + 1}/${total} [${shortSha}]...`);
          try {
            const treeResponse = await getCommitTree(owner, repo, currentCommit.sha);
            folderFramesData.push({
              commit: currentCommit,
              treeItems: treeResponse.tree || [],
              index: i,
            });
          } catch (e) {
            folderFramesData.push({
              commit: currentCommit,
              treeItems: [],
              index: i,
            });
          }
          setProgress(Math.round(((i + 1) / total) * 25));
        }
      }

      // Renderiza o primeiro quadro no canvas antes de capturar o stream
      if (animationType === 'organic_tree') {
        renderOrganicTreeToCanvas(ctx, {
          owner,
          repo,
          branch: targetBranch,
          commitIndex: 0,
          totalCommits: total,
          orderedCommits,
          subFrame: 0,
          totalSubFrames: motionStyle === 'smooth' ? 12 : 1,
          zoomLevel: treeZoom,
        });
      } else if (animationType === 'tree_evolution') {
        renderFrameToCanvas(ctx, {
          owner,
          repo,
          branch: targetBranch,
          commit: orderedCommits[0],
          treeItems: folderFramesData[0]?.treeItems || [],
          commitIndex: 0,
          totalCommits: total,
        });
      } else {
        renderGraphGrowthToCanvas(ctx, {
          owner,
          repo,
          branch: targetBranch,
          commitIndex: 0,
          totalCommits: total,
          orderedCommits,
        });
      }

      // 3. Inicializa gravação do canvas via MediaStream
      const stream = canvas.captureStream(60);
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '';
        }
      }

      const recorderOptions = mimeType ? { mimeType, videoBitsPerSecond: 3500000 } : undefined;
      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const recordPromise = new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const finalBlob = new Blob(chunks, { type: mimeType || 'video/webm' });
          resolve(finalBlob);
        };
        mediaRecorder.onerror = (err) => reject(err);
      });

      mediaRecorder.start();
      setStage('encoding');
      setStatusText('Gravando mini clipe em alta definição (60 FPS)...');

      // 4. Executa a animação fluida quadro a quadro
      const isSmooth = motionStyle === 'smooth' && animationType === 'organic_tree';
      const subFramesPerCommit = isSmooth ? 12 : 1;
      const intervalMs = isSmooth ? Math.max(16, Math.floor(frameDelay / subFramesPerCommit)) : frameDelay;

      // Pausa inicial suave
      await new Promise((r) => setTimeout(r, 200));

      for (let i = 0; i < total; i++) {
        if (abortControllerRef.current) {
          mediaRecorder.stop();
          return;
        }

        for (let sf = 0; sf < subFramesPerCommit; sf++) {
          if (abortControllerRef.current) {
            mediaRecorder.stop();
            return;
          }

          if (animationType === 'organic_tree') {
            renderOrganicTreeToCanvas(ctx, {
              owner,
              repo,
              branch: targetBranch,
              commitIndex: i,
              totalCommits: total,
              orderedCommits,
              subFrame: sf,
              totalSubFrames: subFramesPerCommit,
              zoomLevel: treeZoom,
            });
          } else if (animationType === 'tree_evolution') {
            renderFrameToCanvas(ctx, {
              owner,
              repo,
              branch: targetBranch,
              commit: orderedCommits[i],
              treeItems: folderFramesData[i]?.treeItems || [],
              commitIndex: i,
              totalCommits: total,
            });
          } else {
            renderGraphGrowthToCanvas(ctx, {
              owner,
              repo,
              branch: targetBranch,
              commitIndex: i,
              totalCommits: total,
              orderedCommits,
            });
          }

          const basePercent = 25;
          const currentProgress = basePercent + Math.round(((i * subFramesPerCommit + sf + 1) / (total * subFramesPerCommit)) * 70);
          setProgress(Math.min(95, currentProgress));

          await new Promise((r) => setTimeout(r, intervalMs));
        }
      }

      // Pausa final para contemplar a árvore concluída
      setStatusText('Finalizando codificação do clipe...');
      await new Promise((r) => setTimeout(r, 1800));

      if (abortControllerRef.current) {
        mediaRecorder.stop();
        return;
      }

      mediaRecorder.stop();
      const videoBlob = await recordPromise;

      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      setVideoBlobSize(videoBlob.size);
      setProgress(100);
      setStage('completed');
      setStatusText('Mini Clipe gerado com sucesso!');
      setIsGenerating(false);
      mediaRecorderRef.current = null;
    } catch (err) {
      if (abortControllerRef.current) return;
      console.error('Erro na gravação do vídeo:', err);
      const parsed = parseApiError(err, 'commits');
      setErrorMessage(parsed.message || 'Falha ao processar histórico ou gravação do vídeo.');
      setStage('error');
      setIsGenerating(false);
      mediaRecorderRef.current = null;
    }
  };

  /**
   * Disparador principal (Direciona para Vídeo ou GIF)
   */
  const handleStartGeneration = () => {
    if (exportFormat === 'video') {
      handleGenerateVideo();
    } else {
      handleGenerateGif();
    }
  };

  const formattedFileSize =
    exportFormat === 'video'
      ? videoBlobSize > 0
        ? (videoBlobSize / (1024 * 1024)).toFixed(2) + ' MB'
        : ''
      : gifBlobSize > 0
      ? (gifBlobSize / (1024 * 1024)).toFixed(2) + ' MB'
      : '';

  const downloadFileName = `${owner}-${repo}-${selectedBranch || 'main'}-${
    animationType === 'organic_tree'
      ? 'evolucao-da-arvore'
      : animationType === 'tree_evolution'
      ? 'evolucao-arquivos'
      : 'grafo-arvore-commits'
  }.${exportFormat === 'video' ? 'webm' : 'gif'}`;

  return (
    <div id="timemachine-module" className={styles.timeMachineContainer}>
      {/* Cabeçalho com botão recolher/expandir */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.iconWrapper}>
            {exportFormat === 'video' ? (
              <Video className="w-5 h-5 text-indigo-400" />
            ) : (
              <Film className="w-5 h-5 text-indigo-400" />
            )}
          </div>
          <div>
            <h3 className={styles.title}>
              Máquina do Tempo
              <span className={styles.badge}>
                {exportFormat === 'video' ? 'Mini Clipe 60 FPS' : 'GIF Animado'}
              </span>
            </h3>
            <p className={styles.subtitle}>
              Gere animações da evolução do repositório: veja o crescimento da árvore orgânica, evolução de arquivos ou grafo de commits em vídeo ultra-fluido ou GIF.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={styles.secondaryBtn}
          title={isExpanded ? 'Recolher painel' : 'Expandir painel'}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>Ocultar</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span>Configurar e Gerar</span>
            </>
          )}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Seletor de Formato de Saída (Mini Clipe vs GIF) */}
          <div className={styles.formatSelectorBar} id="timemachine-format-selector">
            <div className={styles.formatSelectorLabel}>
              <Film className="w-4 h-4 text-indigo-400" />
              <span>Formato de Saída:</span>
            </div>

            <div className={styles.formatBtnGroup}>
              <button
                type="button"
                id="format-btn-video"
                disabled={isGenerating}
                onClick={() => setExportFormat('video')}
                className={`${styles.formatBtn} ${
                  exportFormat === 'video' ? styles.formatBtnActive : ''
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Mini Clipe (Vídeo 60 FPS)</span>
                <span className={styles.typeTag}>Mais fluido</span>
              </button>

              <button
                type="button"
                id="format-btn-gif"
                disabled={isGenerating}
                onClick={() => setExportFormat('gif')}
                className={`${styles.formatBtn} ${
                  exportFormat === 'gif' ? styles.formatBtnActive : ''
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>GIF Animado</span>
              </button>
            </div>
          </div>

          {/* Banner Informativo sobre Mini Clipe Fluido */}
          {exportFormat === 'video' && (
            <div className={styles.formatBanner}>
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                <strong>Modo Mini Clipe Ativo:</strong> Cria uma animação time-lapse a 60 FPS com interpolação contínua dos galhos e transição botânica suave.
              </span>
            </div>
          )}

          {/* Seletor de Tipo de Animação */}
          <div className={styles.animationTypeContainer}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Tipo de Animação
              </span>
              <span className="text-[11px] text-slate-400">
                Selecione o modelo visual do GIF
              </span>
            </div>

            <div className={styles.typeCardsGrid}>
              {/* Opção 1: Evolução da Árvore */}
              <button
                type="button"
                id="timemachine-type-organic-tree"
                disabled={isGenerating}
                onClick={() => setAnimationType('organic_tree')}
                className={`${styles.typeCard} ${
                  animationType === 'organic_tree' ? styles.typeCardActive : ''
                }`}
              >
                <div className={styles.typeCardIcon}>
                  <TreeDeciduous className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className={styles.typeCardTitle}>
                    <span>Evolução da Árvore</span>
                    <span className={styles.typeTag}>Ilustração Viva</span>
                  </div>
                  <div className={styles.typeCardDesc}>
                    Árvore viva e orgânica que brota raízes, ramos e folhagens à medida que o repositório evolui, sem poluição de mensagens.
                  </div>
                </div>
              </button>

              {/* Opção 2: Evolução dos Arquivos */}
              <button
                type="button"
                id="timemachine-type-tree"
                disabled={isGenerating}
                onClick={() => setAnimationType('tree_evolution')}
                className={`${styles.typeCard} ${
                  animationType === 'tree_evolution' ? styles.typeCardActive : ''
                }`}
              >
                <div className={styles.typeCardIcon}>
                  <FolderTree className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className={styles.typeCardTitle}>
                    <span>Evolução dos Arquivos</span>
                    <span className={styles.typeTag}>Arquivos e Pastas</span>
                  </div>
                  <div className={styles.typeCardDesc}>
                    Estrutura de diretórios e arquivos da branch crescendo e se expandindo commit a commit.
                  </div>
                </div>
              </button>

              {/* Opção 3: Crescimento das Branches e Commits (Grafo em Árvore) */}
              <button
                type="button"
                id="timemachine-type-graph"
                disabled={isGenerating}
                onClick={() => setAnimationType('graph_growth')}
                className={`${styles.typeCard} ${
                  animationType === 'graph_growth' ? styles.typeCardActive : ''
                }`}
              >
                <div className={styles.typeCardIcon}>
                  <GitFork className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className={styles.typeCardTitle}>
                    <span>Crescimento das Branches e Commits</span>
                    <span className={styles.typeTagAlt}>Grafo em Árvore</span>
                  </div>
                  <div className={styles.typeCardDesc}>
                    Grafo em árvore com nós cronológicos, conexões de branches e identificadores de commits.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Controles de Configuração */}
          <div className={styles.controlsGrid}>
            {/* Seletor de Branch */}
            <div className={styles.formGroup}>
              <label htmlFor="tm-branch-select" className={styles.label}>
                <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                Branch do Repositório
              </label>
              <select
                id="tm-branch-select"
                value={selectedBranch}
                disabled={isGenerating}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className={styles.select}
              >
                {branches && branches.length > 0 ? (
                  branches.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name} {b.protected ? '🔒' : ''}
                    </option>
                  ))
                ) : (
                  <option value={currentBranch || 'main'}>{currentBranch || 'main'}</option>
                )}
              </select>
            </div>

            {/* Máximo de Commits */}
            <div className={styles.formGroup}>
              <div className="flex items-center justify-between">
                <label htmlFor="tm-max-commits" className={styles.label}>
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Limite de Commits ({maxLimit} carregados)
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  Máx: {maxLimit}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  id="tm-max-commits"
                  type="number"
                  min="2"
                  max={maxLimit}
                  value={maxCommits}
                  disabled={isGenerating}
                  onChange={(e) => setMaxCommits(Math.max(2, Math.min(maxLimit, Number(e.target.value) || 2)))}
                  className={styles.input}
                />
                <button
                  type="button"
                  disabled={isGenerating || maxCommits === maxLimit}
                  onClick={() => setMaxCommits(maxLimit)}
                  className="px-2.5 py-2 text-[11px] font-semibold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 rounded-lg transition shrink-0 disabled:opacity-40 cursor-pointer whitespace-nowrap"
                  title={`Definir para o total de ${maxLimit} commits carregados`}
                >
                  Usar Todos
                </button>
              </div>
            </div>

            {/* Estilo de Transição / Fluidez (para Árvore Orgânica) */}
            {animationType === 'organic_tree' ? (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    Fluidez da Animação
                  </label>
                  <div className={styles.motionGroup}>
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setMotionStyle('smooth')}
                      className={`${styles.motionBtn} ${
                        motionStyle === 'smooth' ? styles.motionBtnActive : ''
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      Fluida (Clip)
                    </button>
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setMotionStyle('classic')}
                      className={`${styles.motionBtn} ${
                        motionStyle === 'classic' ? styles.motionBtnActive : ''
                      }`}
                    >
                      <Clock className="w-3 h-3 text-slate-400" />
                      Quadro a Quadro
                    </button>
                  </div>
                </div>

                {/* Enquadramento & Margem da Árvore */}
                <div className={styles.formGroup}>
                  <label htmlFor="tm-tree-zoom" className={styles.label}>
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                    Enquadramento & Margem
                  </label>
                  <select
                    id="tm-tree-zoom"
                    value={treeZoom}
                    disabled={isGenerating}
                    onChange={(e) => setTreeZoom(e.target.value)}
                    className={styles.select}
                  >
                    <option value="panoramic">Panorâmico (Margem Ampla - Recomendado)</option>
                    <option value="auto">Automático Dinâmico (Por Commits)</option>
                    <option value="compact">Compacto Equilibrado</option>
                    <option value="close">Aproximação Focal</option>
                  </select>
                </div>
              </>
            ) : (
              /* Velocidade / Delay por Frame */
              <div className={styles.formGroup}>
                <label htmlFor="tm-frame-delay" className={styles.label}>
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Velocidade do Quadro
                </label>
                <select
                  id="tm-frame-delay"
                  value={frameDelay}
                  disabled={isGenerating}
                  onChange={(e) => setFrameDelay(Number(e.target.value))}
                  className={styles.select}
                >
                  <option value={400}>Rápido (400ms / frame)</option>
                  <option value={600}>Normal (600ms / frame)</option>
                  <option value={900}>Suave (900ms / frame)</option>
                  <option value={1200}>Pausado (1200ms / frame)</option>
                </select>
              </div>
            )}

            {/* Botão de Ação */}
            <div className={styles.actionsGroup}>
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  className={styles.cancelButton}
                  title="Interromper geração"
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Cancelar
                </button>
              ) : (
                <button
                  type="button"
                  id="generate-animation-button"
                  onClick={handleStartGeneration}
                  className={styles.generateButton}
                >
                  {exportFormat === 'video' ? (
                    <>
                      <Video className="w-4 h-4" />
                      Gerar Mini Clipe
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      Gerar GIF
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Mensagem de Erro com Estilo Amigável */}
          {errorMessage && (
            <div className={styles.errorMessage} role="alert">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <div>
                <div className={styles.errorTitle}>Não foi possível gerar a animação</div>
                <div>{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Barra de Progresso durante a Coleta e Renderização */}
          {isGenerating && (
            <div className={styles.progressSection}>
              <div className={styles.progressInfo}>
                <div className={styles.progressStatus}>
                  <span className={styles.spinner}>⏳</span>
                  <span>{statusText}</span>
                </div>
                <div className={styles.progressPercent}>{progress}%</div>
              </div>

              <div className={styles.progressBarBg}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className={styles.stageDots}>
                {animationType === 'organic_tree' ? (
                  <>
                    <span className={progress >= 25 ? styles.stageDotActive : ''}>
                      1. Histórico de commits
                    </span>
                    <span className={progress >= 50 ? styles.stageDotActive : ''}>
                      2. Germinação e ramos (30-60%)
                    </span>
                    <span className={progress >= 75 ? styles.stageDotActive : ''}>
                      3. Folhagem e floração
                    </span>
                    <span className={progress >= 100 ? styles.stageDotActive : ''}>
                      4. {exportFormat === 'video' ? 'Codificação Vídeo (100%)' : 'Codificação GIF (100%)'}
                    </span>
                  </>
                ) : animationType === 'tree_evolution' ? (
                  <>
                    <span className={progress >= 25 ? styles.stageDotActive : ''}>
                      1. Histórico de commits
                    </span>
                    <span className={progress >= 50 ? styles.stageDotActive : ''}>
                      2. Árvore de pastas (0-50%)
                    </span>
                    <span className={progress >= 75 ? styles.stageDotActive : ''}>
                      3. Quadro a quadro (50-75%)
                    </span>
                    <span className={progress >= 100 ? styles.stageDotActive : ''}>
                      4. {exportFormat === 'video' ? 'Codificação Vídeo (100%)' : 'Codificação GIF (100%)'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className={progress >= 25 ? styles.stageDotActive : ''}>
                      1. Histórico de commits
                    </span>
                    <span className={progress >= 50 ? styles.stageDotActive : ''}>
                      2. Grafo em árvore (30-60%)
                    </span>
                    <span className={progress >= 75 ? styles.stageDotActive : ''}>
                      3. Ramificações e nós
                    </span>
                    <span className={progress >= 100 ? styles.stageDotActive : ''}>
                      4. {exportFormat === 'video' ? 'Codificação Vídeo (100%)' : 'Codificação GIF (100%)'}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Área de Visualização: Canvas durante a geração OU Mídia gerada quando concluído */}
          <div className={styles.outputSection}>
            {/* Canvas de renderização precisa em 800x600 px */}
            <div
              className={styles.canvasWrapper}
              style={{ display: isGenerating ? 'block' : 'none' }}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className={styles.previewCanvas}
              />
            </div>

            {/* Quando o VÍDEO estiver concluído */}
            {stage === 'completed' && videoUrl && (
              <>
                <div className={styles.gifResult}>
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    className={styles.gifImage}
                    style={{ maxWidth: '800px', width: '100%', borderRadius: '0.75rem' }}
                  />
                </div>

                <div className={styles.downloadActions}>
                  <div className={styles.metaInfo}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      Mini Clipe pronto • 60 FPS • 800x600 px {formattedFileSize && `• ${formattedFileSize}`} {animationType === 'organic_tree' && `• Enquadramento: ${treeZoom === 'panoramic' ? 'Panorâmico' : treeZoom === 'compact' ? 'Compacto' : treeZoom === 'close' ? 'Aproximado' : 'Automático'}`}
                    </span>
                  </div>

                  <div className={styles.btnGroup}>
                    <a
                      href={videoUrl}
                      download={downloadFileName}
                      id="download-timemachine-video-btn"
                      className={styles.downloadBtn}
                    >
                      <Download className="w-4 h-4" />
                      Baixar Mini Clipe (.webm)
                    </a>

                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.secondaryBtn}
                      title="Visualizar em nova aba"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Visualizar
                    </a>

                    <button
                      type="button"
                      onClick={handleStartGeneration}
                      className={styles.secondaryBtn}
                      title="Gerar novamente com novos parâmetros"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Regenerar
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Quando o GIF estiver concluído */}
            {stage === 'completed' && gifUrl && (
              <>
                <div className={styles.gifResult}>
                  <img
                    src={gifUrl}
                    alt={`Evolução da estrutura de ${owner}/${repo}`}
                    className={styles.gifImage}
                  />
                </div>

                <div className={styles.downloadActions}>
                  <div className={styles.metaInfo}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      GIF pronto • Resolução: 800x600 px {formattedFileSize && `• ${formattedFileSize}`} {animationType === 'organic_tree' && `• Enquadramento: ${treeZoom === 'panoramic' ? 'Panorâmico' : treeZoom === 'compact' ? 'Compacto' : treeZoom === 'close' ? 'Aproximado' : 'Automático'}`}
                    </span>
                  </div>

                  <div className={styles.btnGroup}>
                    <a
                      href={gifUrl}
                      download={downloadFileName}
                      id="download-timemachine-gif-btn"
                      className={styles.downloadBtn}
                    >
                      <Download className="w-4 h-4" />
                      Baixar GIF
                    </a>

                    <a
                      href={gifUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.secondaryBtn}
                      title="Visualizar em nova aba"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Visualizar
                    </a>

                    <button
                      type="button"
                      onClick={handleStartGeneration}
                      className={styles.secondaryBtn}
                      title="Gerar novamente com novos parâmetros"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Regenerar
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Canvas escondido para geração quando não exibido */}
            {!isGenerating && stage !== 'completed' && (
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={{ display: 'none' }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TimeMachine;
