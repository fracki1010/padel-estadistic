import { Card } from '@/components/ui/Card';
import { useStatsData } from '@/features/stats/hooks/useStatsData';
import { getRankings } from '@/features/stats/services/statsService';

const MEDALS = ['🥇', '🥈', '🥉'];

const RANK_BG = [
  'bg-amber-500/10 border-amber-500/30',
  'bg-slate-500/10 border-slate-500/30',
  'bg-orange-700/10 border-orange-700/30'
];

export const RankingsPage = () => {
  const { players, matches, events, loading } = useStatsData();

  if (loading) return <section className="page-shell">Cargando rankings...</section>;

  const rankings = getRankings(players, matches, events);
  const playerMap = new Map(players.map((p) => [p.id, `${p.firstName} ${p.lastName}`]));

  return (
    <section className="page-shell space-y-4">
      <div>
        <h1 className="page-title">Rankings</h1>
        <p className="page-subtitle">Comparativas automáticas por historial</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <RankingCard title="Más partidos ganados" emoji="🏆" items={rankings.byWins} playerMap={playerMap} />
        <RankingCard title="Mejor win rate" emoji="📈" items={rankings.byWinRate} playerMap={playerMap} suffix="%" />
        <RankingCard title="Más winners" emoji="⚡" items={rankings.byWinners} playerMap={playerMap} />
        <RankingCard title="Menos errores no forzados" emoji="🎯" items={rankings.byLessUnforcedErrors} playerMap={playerMap} />
        <RankingCard title="Mejor balance W-ENF" emoji="⚖️" items={rankings.byBalance} playerMap={playerMap} signed />
        <RankingCard title="Más aces" emoji="🚀" items={rankings.byAces} playerMap={playerMap} />
      </div>
    </section>
  );
};

const RankingCard = ({
  title,
  emoji,
  items,
  playerMap,
  suffix = '',
  signed = false
}: {
  title: string;
  emoji: string;
  items: Array<{ playerId: string; value: number }>;
  playerMap: Map<string, string>;
  suffix?: string;
  signed?: boolean;
}) => {
  const maxValue = items.length > 0 ? Math.abs(items[0].value) : 1;

  return (
    <Card>
      <div className="card-header flex items-center gap-2">
        <span className="text-base">{emoji}</span>
        <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
      </div>
      <div className="card-body space-y-2">
        {items.length === 0 && (
          <p className="text-center text-sm text-slate-500 py-2">Sin datos</p>
        )}
        {items.slice(0, 10).map((item, index) => {
          const name = playerMap.get(item.playerId) ?? item.playerId;
          const displayValue = `${signed && item.value > 0 ? '+' : ''}${item.value.toFixed(suffix === '%' ? 1 : 0)}${suffix}`;
          const barWidth = maxValue > 0 ? Math.max(4, Math.round((Math.abs(item.value) / maxValue) * 100)) : 4;
          const isMedal = index < 3;

          return (
            <div
              key={item.playerId}
              className={`rounded-lg border p-2 ${isMedal ? RANK_BG[index] : 'border-slate-800 bg-transparent'}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-sm w-5 text-center">
                    {isMedal ? MEDALS[index] : <span className="text-xs text-slate-500">{index + 1}</span>}
                  </span>
                  <p className="truncate text-sm text-slate-200">{name}</p>
                </div>
                <span className={`shrink-0 text-sm font-bold tabular-nums ${
                  isMedal ? 'text-slate-100' : 'text-slate-300'
                }`}>
                  {displayValue}
                </span>
              </div>
              <div className="h-1 rounded-full bg-slate-800">
                <div
                  className={`h-1 rounded-full transition-all ${
                    index === 0 ? 'bg-amber-400' :
                    index === 1 ? 'bg-slate-400' :
                    index === 2 ? 'bg-orange-600' :
                    'bg-brand-600'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
