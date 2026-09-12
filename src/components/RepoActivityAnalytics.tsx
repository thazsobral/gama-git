import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Activity,
  Code2,
  Calendar,
  Clock,
  RefreshCw,
  PieChart,
  BarChart3,
  TrendingUp,
  Award,
  Layers,
} from 'lucide-react';
import { useGitHub } from '../hooks/useGitHub';
import { useAppContext } from '../context/AppContext';
import { LoadingSpinner } from './LoadingSpinner';

// Registro dos elementos necessários do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Cores populares de linguagens do GitHub
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Java: '#b07219',
  'C#': '#178600',
  'C++': '#f34b7d',
  C: '#555555',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  Shell: '#89e051',
  Vue: '#41b883',
  Dart: '#00B4AB',
  R: '#198CE7',
  Scala: '#c22d40',
  Elixir: '#6e4a7e',
  Dockerfile: '#384d54',
  Markdown: '#083fa1',
  Lua: '#000080',
};

const FALLBACK_PALETTE = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#84cc16', // Lime
];

function getLanguageColor(lang: string, index: number): string {
  return LANGUAGE_COLORS[lang] || FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

type CommitTimeGrouping = 'timeline' | 'weekday' | 'timeofday';
type LanguageChartType = 'doughnut' | 'bar';

export const RepoActivityAnalytics: React.FC = () => {
  const {
    selectedRepo,
    selectedBranch,
    commits,
    repoLanguages,
    loading,
    refreshLanguages,
  } = useGitHub();

  const { resolvedTheme } = useAppContext();
  const isDark = resolvedTheme === 'dark';

  const [timeGrouping, setTimeGrouping] = useState<CommitTimeGrouping>('timeline');
  const [langChartType, setLangChartType] = useState<LanguageChartType>('doughnut');

  // Cálculos de Linguagens
  const languageStats = useMemo(() => {
    const entries = Object.entries(repoLanguages || {});
    const totalBytes = entries.reduce((acc, [, bytes]) => acc + Number(bytes), 0);

    const formattedList = entries
      .map(([name, bytes], index) => {
        const numBytes = Number(bytes);
        const percentage = totalBytes > 0 ? (numBytes / totalBytes) * 100 : 0;
        return {
          name,
          bytes: numBytes,
          percentage,
          color: getLanguageColor(name, index),
        };
      })
      .sort((a, b) => b.bytes - a.bytes);

    return {
      totalBytes,
      formattedList,
      hasLanguages: formattedList.length > 0,
    };
  }, [repoLanguages]);

  // Dados do Gráfico de Linguagens para Chart.js
  const languageChartData = useMemo(() => {
    const labels = languageStats.formattedList.map((item) => item.name);
    const data = languageStats.formattedList.map((item) => item.bytes);
    const backgroundColor = languageStats.formattedList.map((item) => item.color);
    const borderColor = isDark ? '#0f172a' : '#ffffff';

    return {
      labels,
      datasets: [
        {
          label: 'Bytes de Código',
          data,
          backgroundColor,
          borderColor,
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    };
  }, [languageStats, isDark]);

  // Opções do Gráfico de Linguagens
  const languageDoughnutOptions: ChartOptions<'doughnut'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: isDark ? '#cbd5e1' : '#334155',
            font: { size: 11, family: 'system-ui, -apple-system, sans-serif' },
            boxWidth: 9,
            boxHeight: 9,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 12,
          },
        },
        tooltip: {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderColor: isDark ? '#334155' : '#cbd5e1',
          borderWidth: 1,
          titleColor: isDark ? '#f8fafc' : '#0f172a',
          bodyColor: isDark ? '#cbd5e1' : '#334155',
          padding: 10,
          boxPadding: 4,
          cornerRadius: 8,
          usePointStyle: true,
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = (context.raw as number) || 0;
              const total = languageStats.totalBytes || 1;
              const pct = ((value / total) * 100).toFixed(1);
              return ` ${label}: ${formatBytes(value)} (${pct}%)`;
            },
          },
        },
      },
      cutout: '65%',
    }),
    [languageStats.totalBytes, isDark]
  );

  const languageBarOptions: ChartOptions<'bar'> = useMemo(
    () => ({
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderColor: isDark ? '#334155' : '#cbd5e1',
          borderWidth: 1,
          titleColor: isDark ? '#f8fafc' : '#0f172a',
          bodyColor: isDark ? '#cbd5e1' : '#334155',
          padding: 10,
          boxPadding: 4,
          cornerRadius: 8,
          callbacks: {
            label: (context) => {
              const value = (context.raw as number) || 0;
              const total = languageStats.totalBytes || 1;
              const pct = ((value / total) * 100).toFixed(1);
              return ` ${formatBytes(value)} (${pct}%)`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: isDark ? '#94a3b8' : '#64748b',
            font: { size: 11 },
            callback: (val) => formatBytes(Number(val)),
          },
          grid: { color: isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.7)' },
        },
        y: {
          ticks: { color: isDark ? '#cbd5e1' : '#334155', font: { size: 11 } },
          grid: { display: false },
        },
      },
    }),
    [languageStats.totalBytes, isDark]
  );

  // Análise de Frequência de Commits ao Longo do Tempo
  const commitActivity = useMemo(() => {
    if (!commits || commits.length === 0) {
      return {
        timelineLabels: [],
        timelineCounts: [],
        weekdayLabels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
        weekdayCounts: [0, 0, 0, 0, 0, 0, 0],
        timeOfDayLabels: ['Madrugada (00-06h)', 'Manhã (06-12h)', 'Tarde (12-18h)', 'Noite (18-24h)'],
        timeOfDayCounts: [0, 0, 0, 0],
        peakDay: null,
        topAuthor: null,
        totalCommits: 0,
      };
    }

    // 1. Agrupamento por data (Timeline cronológica)
    const dateMap: Record<string, number> = {};
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    const timeOfDayCounts = [0, 0, 0, 0];
    const authorMap: Record<string, number> = {};

    commits.forEach((item) => {
      const dateStr = item.commit.author.date;
      const date = new Date(dateStr);

      // Data formatada YYYY-MM-DD para ordenação
      const dayKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      dateMap[dayKey] = (dateMap[dayKey] || 0) + 1;

      // Dia da semana (0 = Domingo)
      const dayOfWeek = date.getDay();
      weekdayCounts[dayOfWeek] += 1;

      // Horário do dia
      const hours = date.getHours();
      if (hours >= 0 && hours < 6) timeOfDayCounts[0] += 1;
      else if (hours >= 6 && hours < 12) timeOfDayCounts[1] += 1;
      else if (hours >= 12 && hours < 18) timeOfDayCounts[2] += 1;
      else timeOfDayCounts[3] += 1;

      // Autor mais ativo
      const authorName = item.author?.login || item.commit.author.name || 'Desconhecido';
      authorMap[authorName] = (authorMap[authorName] || 0) + 1;
    });

    // Timeline labels invertidas para ordem cronológica (a API retorna do mais novo ao mais antigo)
    const timelineLabels = Object.keys(dateMap).reverse();
    const timelineCounts = Object.values(dateMap).reverse();

    // Dia de pico
    let peakDay = { date: '', count: 0 };
    Object.entries(dateMap).forEach(([d, count]) => {
      if (count > peakDay.count) {
        peakDay = { date: d, count };
      }
    });

    // Autor top
    let topAuthor = { name: '', count: 0 };
    Object.entries(authorMap).forEach(([name, count]) => {
      if (count > topAuthor.count) {
        topAuthor = { name, count };
      }
    });

    return {
      timelineLabels,
      timelineCounts,
      weekdayLabels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
      weekdayCounts,
      timeOfDayLabels: ['Madrugada (00-06h)', 'Manhã (06-12h)', 'Tarde (12-18h)', 'Noite (18-24h)'],
      timeOfDayCounts,
      peakDay: peakDay.count > 0 ? peakDay : null,
      topAuthor: topAuthor.count > 0 ? topAuthor : null,
      totalCommits: commits.length,
    };
  }, [commits]);

  // Dados do gráfico de frequência de commits
  const commitChartData = useMemo(() => {
    if (timeGrouping === 'timeline') {
      return {
        labels: commitActivity.timelineLabels,
        datasets: [
          {
            label: 'Commits na data',
            data: commitActivity.timelineCounts,
            fill: true,
            borderColor: isDark ? '#818cf8' : '#4f46e5',
            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.18)' : 'rgba(79, 70, 229, 0.08)',
            tension: 0.35,
            pointBackgroundColor: isDark ? '#a5b4fc' : '#4f46e5',
            pointBorderColor: isDark ? '#0f172a' : '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      };
    }

    if (timeGrouping === 'weekday') {
      return {
        labels: commitActivity.weekdayLabels,
        datasets: [
          {
            label: 'Commits no dia da semana',
            data: commitActivity.weekdayCounts,
            backgroundColor: isDark
              ? [
                  'rgba(148, 163, 184, 0.35)', // Dom
                  'rgba(129, 140, 248, 0.75)', // Seg
                  'rgba(129, 140, 248, 0.75)', // Ter
                  'rgba(129, 140, 248, 0.75)', // Qua
                  'rgba(129, 140, 248, 0.75)', // Qui
                  'rgba(129, 140, 248, 0.75)', // Sex
                  'rgba(148, 163, 184, 0.35)', // Sáb
                ]
              : [
                  'rgba(203, 213, 225, 0.8)', // Dom
                  'rgba(79, 70, 229, 0.85)',  // Seg
                  'rgba(79, 70, 229, 0.85)',  // Ter
                  'rgba(79, 70, 229, 0.85)',  // Qua
                  'rgba(79, 70, 229, 0.85)',  // Qui
                  'rgba(79, 70, 229, 0.85)',  // Sex
                  'rgba(203, 213, 225, 0.8)', // Sáb
                ],
            borderColor: isDark ? '#818cf8' : '#4f46e5',
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      };
    }

    // Por horário do dia
    return {
      labels: commitActivity.timeOfDayLabels,
      datasets: [
        {
          label: 'Commits no período',
          data: commitActivity.timeOfDayCounts,
          backgroundColor: isDark
            ? [
                'rgba(168, 85, 247, 0.8)', // Madrugada
                'rgba(52, 211, 153, 0.8)',  // Manhã
                'rgba(251, 191, 36, 0.8)',  // Tarde
                'rgba(96, 165, 250, 0.8)',  // Noite
              ]
            : [
                'rgba(147, 51, 234, 0.85)', // Madrugada
                'rgba(16, 185, 129, 0.85)',  // Manhã
                'rgba(217, 119, 6, 0.85)',   // Tarde
                'rgba(37, 99, 235, 0.85)',   // Noite
              ],
          borderColor: isDark ? '#334155' : '#cbd5e1',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [timeGrouping, commitActivity, isDark]);

  const lineChartOptions: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderColor: isDark ? '#334155' : '#cbd5e1',
          borderWidth: 1,
          titleColor: isDark ? '#f8fafc' : '#0f172a',
          bodyColor: isDark ? '#cbd5e1' : '#334155',
          padding: 10,
          boxPadding: 4,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ` ${ctx.raw} commit(s)`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 11 } },
          grid: { color: isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.7)' },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: isDark ? '#94a3b8' : '#64748b',
            font: { size: 11 },
            stepSize: 1,
          },
          grid: { color: isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.7)' },
        },
      },
    }),
    [isDark]
  );

  const barChartOptions: ChartOptions<'bar'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderColor: isDark ? '#334155' : '#cbd5e1',
          borderWidth: 1,
          titleColor: isDark ? '#f8fafc' : '#0f172a',
          bodyColor: isDark ? '#cbd5e1' : '#334155',
          padding: 10,
          boxPadding: 4,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ` ${ctx.raw} commit(s)`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 11 } },
          grid: { color: isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.7)' },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: isDark ? '#94a3b8' : '#64748b',
            font: { size: 11 },
            stepSize: 1,
          },
          grid: { color: isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.7)' },
        },
      },
    }),
    [isDark]
  );

  // Classes visuais adaptadas por tema para máxima legibilidade e contraste
  const cardBgClass = isDark
    ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-none'
    : 'bg-white border-slate-200 text-slate-900 shadow-xs';

  const cardHeaderBorderClass = isDark ? 'border-slate-800' : 'border-slate-200';
  const textTitleClass = isDark ? 'text-white' : 'text-slate-900';
  const textSubtitleClass = isDark ? 'text-slate-400' : 'text-slate-500';
  const controlBgClass = isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200';

  return (
    <div id="repo-activity-analytics-container" className="space-y-6">
      {/* Barra de resumo de métricas do repositório */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`p-4 rounded-xl border flex items-center gap-3 transition-all duration-200 ${cardBgClass} ${isDark ? 'hover:border-slate-700' : 'hover:border-slate-300'}`}>
          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-indigo-950/70 text-indigo-400 border-indigo-500/30' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className={`text-xs font-medium ${textSubtitleClass}`}>Commits Analisados</span>
            <p className={`text-lg font-bold mt-0.5 ${textTitleClass}`}>
              {commitActivity.totalCommits}
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-center gap-3 transition-all duration-200 ${cardBgClass} ${isDark ? 'hover:border-slate-700' : 'hover:border-slate-300'}`}>
          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-emerald-950/70 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className={`text-xs font-medium ${textSubtitleClass}`}>Pico de Atividade</span>
            <p className={`text-lg font-bold mt-0.5 ${textTitleClass}`}>
              {commitActivity.peakDay
                ? `${commitActivity.peakDay.count} em ${commitActivity.peakDay.date}`
                : 'N/A'}
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-center gap-3 transition-all duration-200 ${cardBgClass} ${isDark ? 'hover:border-slate-700' : 'hover:border-slate-300'}`}>
          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-amber-950/70 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className={`text-xs font-medium ${textSubtitleClass}`}>Autor Mais Ativo</span>
            <p className={`text-sm font-bold mt-0.5 truncate ${textTitleClass}`} title={commitActivity.topAuthor?.name}>
              {commitActivity.topAuthor
                ? `${commitActivity.topAuthor.name} (${commitActivity.topAuthor.count})`
                : 'N/A'}
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-center gap-3 transition-all duration-200 ${cardBgClass} ${isDark ? 'hover:border-slate-700' : 'hover:border-slate-300'}`}>
          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-purple-950/70 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className={`text-xs font-medium ${textSubtitleClass}`}>Linguagens Detectadas</span>
            <p className={`text-lg font-bold mt-0.5 ${textTitleClass}`}>
              {languageStats.formattedList.length}
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Gráficos (2 Colunas no desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRÁFICO 1: Frequência de Commits ao Longo do Tempo (8 colunas) */}
        <div className={`lg:col-span-7 rounded-2xl p-4 sm:p-5 border flex flex-col justify-between transition-all duration-200 ${cardBgClass}`}>
          <div>
            {/* Cabeçalho do Gráfico de Commits */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 mb-4 ${cardHeaderBorderClass}`}>
              <div className="flex items-center gap-2">
                <Activity className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <div>
                  <h4 className={`text-sm font-bold ${textTitleClass}`}>
                    Frequência de Commits ao Longo do Tempo
                  </h4>
                  <p className={`text-[11px] ${textSubtitleClass}`}>
                    Branch ativa: <span className={`font-mono font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>{selectedBranch}</span>
                  </p>
                </div>
              </div>

              {/* Alternador de Agrupamento Temporal */}
              <div className={`flex items-center gap-1 p-1 rounded-xl border self-start sm:self-auto text-xs transition-colors ${controlBgClass}`}>
                <button
                  type="button"
                  id="group-timeline-btn"
                  onClick={() => setTimeGrouping('timeline')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1 ${
                    timeGrouping === 'timeline'
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  title="Frequência cronológica dos commits"
                >
                  <Calendar className="w-3 h-3" />
                  <span>Datas</span>
                </button>
                <button
                  type="button"
                  id="group-weekday-btn"
                  onClick={() => setTimeGrouping('weekday')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1 ${
                    timeGrouping === 'weekday'
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  title="Commits por dia da semana"
                >
                  <span>Dia Semana</span>
                </button>
                <button
                  type="button"
                  id="group-timeofday-btn"
                  onClick={() => setTimeGrouping('timeofday')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1 ${
                    timeGrouping === 'timeofday'
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  title="Commits por período do dia"
                >
                  <Clock className="w-3 h-3" />
                  <span>Horário</span>
                </button>
              </div>
            </div>

            {/* Visualizador do Gráfico de Commits */}
            <div className="h-64 sm:h-72 w-full pt-1">
              {loading.commits ? (
                <LoadingSpinner message="Calculando frequência de commits..." />
              ) : commits.length === 0 ? (
                <div className={`h-full flex items-center justify-center text-xs italic ${textSubtitleClass}`}>
                  Nenhum commit disponível nesta branch para gerar o gráfico temporal.
                </div>
              ) : timeGrouping === 'timeline' ? (
                <div key={`timeline-${resolvedTheme}`} className="h-full w-full">
                  <Line data={commitChartData} options={lineChartOptions} />
                </div>
              ) : (
                <div key={`bar-${timeGrouping}-${resolvedTheme}`} className="h-full w-full">
                  <Bar data={commitChartData} options={barChartOptions} />
                </div>
              )}
            </div>
          </div>

          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
            <span>
              {timeGrouping === 'timeline'
                ? 'Evolução cronológica de commits da branch ativa'
                : timeGrouping === 'weekday'
                ? 'Concentração de commits nos dias da semana'
                : 'Turnos e horários com maior intensidade de commits'}
            </span>
            <span className={`font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Chart.js</span>
          </div>
        </div>

        {/* GRÁFICO 2: Distribuição de Linguagens de Programação (5 colunas) */}
        <div className={`lg:col-span-5 rounded-2xl p-4 sm:p-5 border flex flex-col justify-between transition-all duration-200 ${cardBgClass}`}>
          <div>
            {/* Cabeçalho de Linguagens */}
            <div className={`flex items-center justify-between gap-2 border-b pb-3 mb-4 ${cardHeaderBorderClass}`}>
              <div className="flex items-center gap-2">
                <Code2 className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <div>
                  <h4 className={`text-sm font-bold ${textTitleClass}`}>
                    Linguagens de Programação
                  </h4>
                  <p className={`text-[11px] ${textSubtitleClass}`}>
                    Total: {formatBytes(languageStats.totalBytes)} no repositório
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Alternador de tipo de gráfico */}
                <div className={`flex items-center gap-1 p-1 rounded-xl border ${controlBgClass}`}>
                  <button
                    type="button"
                    id="lang-doughnut-btn"
                    onClick={() => setLangChartType('doughnut')}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      langChartType === 'doughnut'
                        ? isDark
                          ? 'bg-slate-800 text-indigo-400 shadow-xs border border-slate-700'
                          : 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                        : isDark
                        ? 'text-slate-400 hover:text-white hover:bg-slate-900'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                    title="Visualização em Rosca (Doughnut)"
                  >
                    <PieChart className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    id="lang-bar-btn"
                    onClick={() => setLangChartType('bar')}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      langChartType === 'bar'
                        ? isDark
                          ? 'bg-slate-800 text-indigo-400 shadow-xs border border-slate-700'
                          : 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                        : isDark
                        ? 'text-slate-400 hover:text-white hover:bg-slate-900'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                    title="Visualização em Barras"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Recarregar linguagens */}
                <button
                  type="button"
                  id="refresh-languages-btn"
                  onClick={() => refreshLanguages()}
                  disabled={loading.languages}
                  className={`p-1.5 rounded-lg border border-transparent transition disabled:opacity-50 ${
                    isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-200'
                  }`}
                  title="Atualizar dados de linguagens da API do GitHub"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading.languages ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Canvas do Gráfico de Linguagens */}
            <div className="h-48 sm:h-52 w-full relative">
              {loading.languages ? (
                <LoadingSpinner message="Consultando linguagens do repositório..." />
              ) : !languageStats.hasLanguages ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <Code2 className={`w-8 h-8 mb-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                  <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Nenhuma linguagem detectada pela API do GitHub
                  </p>
                  <p className={`text-[11px] mt-1 max-w-xs ${textSubtitleClass}`}>
                    Pode ser um repositório vazio ou composto apenas por documentação em texto puro.
                  </p>
                </div>
              ) : langChartType === 'doughnut' ? (
                <div key={`doughnut-${resolvedTheme}`} className="h-full w-full">
                  <Doughnut data={languageChartData} options={languageDoughnutOptions} />
                </div>
              ) : (
                <div key={`lang-bar-${resolvedTheme}`} className="h-full w-full">
                  <Bar data={languageChartData} options={languageBarOptions} />
                </div>
              )}
            </div>

            {/* Lista detalhada de linguagens com porcentagem, bytes e mini barra de progresso */}
            {languageStats.hasLanguages && (
              <div className={`mt-4 pt-3 border-t max-h-36 overflow-y-auto space-y-2 pr-1 ${cardHeaderBorderClass}`}>
                {languageStats.formattedList.map((item) => (
                  <div
                    key={item.name}
                    className={`flex flex-col gap-1 p-1.5 rounded-lg border border-transparent transition ${
                      isDark
                        ? 'hover:bg-slate-800/60 hover:border-slate-800'
                        : 'hover:bg-slate-50 hover:border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ring-1 ${isDark ? 'ring-white/20' : 'ring-black/10'}`}
                          style={{ backgroundColor: item.color }}
                        />
                        <span className={`font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                        <span className={textSubtitleClass}>{formatBytes(item.bytes)}</span>
                        <span className={`font-semibold w-12 text-right ${textTitleClass}`}>
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    {/* Barra visual proporcional */}
                    <div className={`w-full h-1.5 rounded-full overflow-hidden border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200/80'}`}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(item.percentage, 1)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`mt-4 pt-2 border-t flex items-center justify-between text-[11px] ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
            <span>Baseado no endpoint oficial /repos/languages</span>
            <span className={`font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>GitHub API</span>
          </div>
        </div>
      </div>
    </div>
  );
};
