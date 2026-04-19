import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useStatsData } from '@/features/stats/hooks/useStatsData';
import { getDashboardStats, getRankings } from '@/features/stats/services/statsService';
import { formatDate } from '@/shared/formatters/date';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const STATUS_COLOR: Record<string, 'green' | 'yellow' | 'slate'> = {
  finalizado: 'green',
  en_curso: 'yellow',
  pendiente: 'slate'
};

const STATUS_LABEL: Record<string, string> = {
  finalizado: 'Finalizado',
  en_curso: 'En curso',
  pendiente: 'Pendiente'
};

const FORMAT_LABEL: Record<string, string> = {
  amistoso: 'Amistoso',
  entrenamiento: 'Entren.',
  torneo: 'Torneo'
};

const RANK_MEDAL = ['🥇', '🥈', '🥉'];

export const DashboardPage = () => {
  const { players, matches, events, loading } = useStatsData();

  if (loading) return <section className="page-shell">Cargando dashboard...</section>;

  const dashboard = getDashboardStats(players, matches, events);
  const rankings = getRankings(players, matches, events);
  const playerMap = new Map(players.map((p) => [p.id, `${p.firstName} ${p.lastName}`]));

  const winnersChartData = dashboard.winnersByPlayer.map((item) => ({
    name: playerMap.get(item.playerId) ?? item.playerId,
    value: item.value
  }));

  const errorsChartData = dashboard.unforcedErrorsByPlayer.map((item) => ({
    name: playerMap.get(item.playerId) ?? item.playerId,
    value: item.value
  }));

  return (
    <section className="page-shell space-y-4">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Resumen general de rendimiento</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          label="Jugadores activos"
          value={dashboard.activePlayers}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-brand-400">
              <circle cx="9" cy="7" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
              <circle cx="18" cy="8" r="2.5" /><path d="M15.5 20c0-2.5 1.8-4.5 4-4.5" />
            </svg>
          }
        />
        <MetricCard
          label="Total partidos"
          value={dashboard.totalMatches}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-sky-400">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3c1.5 2.5 2 5 2 9s-.5 6.5-2 9" />
              <path d="M12 3c-1.5 2.5-2 5-2 9s.5 6.5 2 9" />
              <path d="M3.6 9h16.8M3.6 15h16.8" />
            </svg>
          }
        />
        <MetricCard
          label="Total eventos"
          value={dashboard.totalEvents}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-violet-400">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
        />
        <MetricCard
          label="Mejor win rate"
          value={dashboard.bestWinRatePlayerId ? (playerMap.get(dashboard.bestWinRatePlayerId) ?? '-') : '-'}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-amber-400">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="card-body">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">Partidos por mes</h2>
          <ChartContainer>
            <BarChart data={dashboard.matchesByMonth} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} width={24} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </Card>

        <Card className="card-body">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">Winners por jugador</h2>
          <ChartContainer>
            <BarChart data={winnersChartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} interval={0} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} width={24} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="value" name="Winners" radius={[4, 4, 0, 0]}>
                {winnersChartData.map((_, index) => (
                  <Cell key={index} fill={`hsl(${200 + index * 25}, 80%, 55%)`} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </Card>

        <Card className="card-body">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">Errores no forzados por jugador</h2>
          <ChartContainer>
            <BarChart data={errorsChartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} interval={0} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} width={24} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="value" name="ENF" radius={[4, 4, 0, 0]}>
                {errorsChartData.map((_, index) => (
                  <Cell key={index} fill={`hsl(${0 + index * 20}, 70%, 55%)`} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </Card>

        <Card>
          <div className="card-header flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">Top 5 por victorias</h2>
            <Link to="/rankings" className="text-xs text-brand-400 hover:text-brand-300">Ver todos →</Link>
          </div>
          <div className="card-body space-y-2">
            {rankings.byWins.slice(0, 5).map((item, index) => (
              <div key={item.playerId} className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-800/30 p-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-sm">{RANK_MEDAL[index] ?? `${index + 1}.`}</span>
                  <p className="truncate text-sm text-slate-200">{playerMap.get(item.playerId) ?? item.playerId}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-700 px-2 py-0.5 text-xs font-bold text-slate-100">
                  {item.value}
                </span>
              </div>
            ))}
            {rankings.byWins.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-4">Sin datos disponibles</p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="card-header flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">Últimos partidos</h2>
          <Link to="/matches" className="text-xs text-brand-400 hover:text-brand-300">Ver todos →</Link>
        </div>
        <div className="divide-y divide-slate-800">
          {dashboard.recentMatches.length === 0 ? (
            <p className="card-body text-center text-sm text-slate-500">Sin partidos recientes</p>
          ) : dashboard.recentMatches.map((match) => (
            <Link
              key={match.id}
              to={`/matches/${match.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-800/40"
            >
              <div className="flex min-w-0 items-center gap-2">
                <p className="text-xs text-slate-400 shrink-0">{formatDate(match.date)}</p>
                <span className="text-slate-700">·</span>
                <p className="truncate text-sm text-slate-300">{FORMAT_LABEL[match.format] ?? match.format}</p>
              </div>
              <Badge color={STATUS_COLOR[match.status] ?? 'slate'}>
                {STATUS_LABEL[match.status] ?? match.status}
              </Badge>
            </Link>
          ))}
        </div>
      </Card>
    </section>
  );
};

const MetricCard = ({ label, value, icon }: { label: string; value: string | number; icon?: ReactNode }) => (
  <Card className="p-4">
    <div className="mb-3 flex items-center justify-between">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      {icon && <span className="[&>svg]:h-6 [&>svg]:w-6">{icon}</span>}
    </div>
    <p className="text-4xl font-black tracking-tight text-slate-100">{value}</p>
  </Card>
);

const ChartContainer = ({ children }: { children: ReactNode }) => (
  <div className="h-52 w-full">
    <ResponsiveContainer width="100%" height="100%">
      {children as ReactElement}
    </ResponsiveContainer>
  </div>
);
