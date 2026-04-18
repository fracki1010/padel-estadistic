import type { ReactElement, ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { useStatsData } from '@/features/stats/hooks/useStatsData';
import { getDashboardStats, getRankings } from '@/features/stats/services/statsService';
import { formatDate } from '@/shared/formatters/date';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export const DashboardPage = () => {
  const { players, matches, events, loading } = useStatsData();

  if (loading) return <section className="page-shell">Cargando dashboard...</section>;

  const dashboard = getDashboardStats(players, matches, events);
  const rankings = getRankings(players, matches, events);
  const playerMap = new Map(players.map((player) => [player.id, `${player.firstName} ${player.lastName}`]));

  return (
    <section className="page-shell space-y-4">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Resumen general de rendimiento</p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Jugadores activos" value={dashboard.activePlayers} />
        <MetricCard label="Total partidos" value={dashboard.totalMatches} />
        <MetricCard label="Total eventos" value={dashboard.totalEvents} />
        <MetricCard label="Mejor win rate" value={dashboard.bestWinRatePlayerId ? (playerMap.get(dashboard.bestWinRatePlayerId) ?? '-') : '-'} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="card-body">
          <h2 className="mb-3 font-semibold">Partidos por mes</h2>
          <ChartContainer>
            <BarChart data={dashboard.matchesByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#0284c7" />
            </BarChart>
          </ChartContainer>
        </Card>

        <Card className="card-body">
          <h2 className="mb-3 font-semibold">Winners por jugador</h2>
          <ChartContainer>
            <BarChart data={dashboard.winnersByPlayer.map((item) => ({ name: playerMap.get(item.playerId) ?? item.playerId, value: item.value }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" hide />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#0ea5e9" />
            </BarChart>
          </ChartContainer>
        </Card>

        <Card className="card-body">
          <h2 className="mb-3 font-semibold">Errores no forzados por jugador</h2>
          <ChartContainer>
            <BarChart data={dashboard.unforcedErrorsByPlayer.map((item) => ({ name: playerMap.get(item.playerId) ?? item.playerId, value: item.value }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" hide />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#ef4444" />
            </BarChart>
          </ChartContainer>
        </Card>

        <Card className="card-body">
          <h2 className="mb-3 font-semibold">Ranking resumido (wins)</h2>
          <div className="space-y-2">
            {rankings.byWins.slice(0, 5).map((item, index) => (
              <div key={item.playerId} className="flex items-center justify-between rounded border border-slate-200 p-2">
                <p className="text-sm">{index + 1}. {playerMap.get(item.playerId) ?? item.playerId}</p>
                <p className="font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="card-header"><h2 className="font-semibold">Últimos partidos</h2></div>
        <div className="card-body space-y-2">
          {dashboard.recentMatches.map((match) => (
            <div key={match.id} className="rounded border border-slate-200 p-2 text-sm">
              {formatDate(match.date)} - {match.format} - {match.status}
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
};

const MetricCard = ({ label, value }: { label: string; value: string | number }) => (
  <Card className="card-body">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="text-xl font-semibold text-slate-800">{value}</p>
  </Card>
);

const ChartContainer = ({ children }: { children: ReactNode }) => (
  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      {children as ReactElement}
    </ResponsiveContainer>
  </div>
);
