import { Link, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { usePlayer } from '@/features/players/hooks/usePlayers';
import { useMatchEvents, useMatches } from '@/features/matches/hooks/useMatches';
import { getPlayerStats } from '@/features/stats/services/statsService';
import { formatDate } from '@/shared/formatters/date';

export const PlayerDetailPage = () => {
  const { id = '' } = useParams();
  const { data: player } = usePlayer(id);
  const { data: matches } = useMatches();
  const { data: events } = useMatchEvents();

  if (!player) {
    return <section className="page-shell">Jugador no encontrado.</section>;
  }

  const stats = getPlayerStats(events ?? [], matches ?? [], id);
  const recentMatches = (matches ?? [])
    .filter((match) => [...match.teamA, ...match.teamB].includes(id))
    .slice(0, 5);

  return (
    <section className="page-shell space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">{player.firstName} {player.lastName}</h1>
        <Link className="btn-secondary" to={`/players/${id}/edit`}>Editar</Link>
      </div>

      <Card className="card-body grid gap-3 md:grid-cols-3">
        <div><p className="text-xs text-slate-500">Apodo</p><p className="font-medium">{player.nickname || '-'}</p></div>
        <div><p className="text-xs text-slate-500">Mano</p><p className="font-medium capitalize">{player.dominantHand}</p></div>
        <div><p className="text-xs text-slate-500">Posición</p><p className="font-medium capitalize">{player.preferredSide}</p></div>
      </Card>

      <Card className="card-body grid gap-3 md:grid-cols-4">
        <Metric label="Partidos" value={stats.matchesPlayed} />
        <Metric label="Ganados" value={stats.matchesWon} />
        <Metric label="Perdidos" value={stats.matchesLost} />
        <Metric label="Win rate" value={`${stats.winRate.toFixed(1)}%`} />
        <Metric label="Winners" value={stats.winners} />
        <Metric label="ENF" value={stats.unforcedErrors} />
        <Metric label="Aces" value={stats.aces} />
        <Metric label="Balance W-ENF" value={stats.winnersMinusUnforcedErrors} />
      </Card>

      <Card>
        <div className="card-header">
          <h2 className="font-semibold">Últimos partidos</h2>
        </div>
        <div className="card-body space-y-2">
          {recentMatches.map((match) => (
            <Link key={match.id} className="block rounded border border-slate-200 p-2 hover:bg-slate-50" to={`/matches/${match.id}`}>
              {formatDate(match.date)} - {match.format} - {match.status}
            </Link>
          ))}
          {!recentMatches.length ? <p className="text-sm text-slate-500">Sin partidos recientes.</p> : null}
        </div>
      </Card>
    </section>
  );
};

const Metric = ({ label, value }: { label: string; value: string | number }) => (
  <div>
    <p className="text-xs text-slate-500">{label}</p>
    <p className="text-lg font-semibold text-slate-800">{value}</p>
  </div>
);
