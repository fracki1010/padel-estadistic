import { Card } from '@/components/ui/Card';
import { useStatsData } from '@/features/stats/hooks/useStatsData';
import { getRankings } from '@/features/stats/services/statsService';

export const RankingsPage = () => {
  const { players, matches, events, loading } = useStatsData();

  if (loading) return <section className="page-shell">Cargando rankings...</section>;

  const rankings = getRankings(players, matches, events);
  const playerMap = new Map(players.map((player) => [player.id, `${player.firstName} ${player.lastName}`]));

  return (
    <section className="page-shell space-y-4">
      <div>
        <h1 className="page-title">Rankings</h1>
        <p className="page-subtitle">Comparativas automáticas por historial</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <RankingCard title="Más partidos ganados" items={rankings.byWins} playerMap={playerMap} />
        <RankingCard title="Mejor win rate" items={rankings.byWinRate} playerMap={playerMap} suffix="%" />
        <RankingCard title="Más winners" items={rankings.byWinners} playerMap={playerMap} />
        <RankingCard title="Menos errores no forzados" items={rankings.byLessUnforcedErrors} playerMap={playerMap} />
        <RankingCard title="Mejor balance winners-ENF" items={rankings.byBalance} playerMap={playerMap} />
        <RankingCard title="Más aces" items={rankings.byAces} playerMap={playerMap} />
      </div>
    </section>
  );
};

const RankingCard = ({
  title,
  items,
  playerMap,
  suffix = ''
}: {
  title: string;
  items: Array<{ playerId: string; value: number }>;
  playerMap: Map<string, string>;
  suffix?: string;
}) => (
  <Card>
    <div className="card-header"><h2 className="font-semibold">{title}</h2></div>
    <div className="card-body space-y-2">
      {items.slice(0, 10).map((item, index) => (
        <div key={item.playerId} className="flex items-center justify-between rounded border border-slate-200 p-2">
          <p className="text-sm">{index + 1}. {playerMap.get(item.playerId) ?? item.playerId}</p>
          <p className="font-semibold">{item.value.toFixed(suffix === '%' ? 1 : 0)}{suffix}</p>
        </div>
      ))}
    </div>
  </Card>
);
