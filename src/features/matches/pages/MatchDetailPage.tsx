import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDeleteMatch, useEventsByMatch, useMatch } from '@/features/matches/hooks/useMatches';
import { usePlayers } from '@/features/players/hooks/usePlayers';
import { getMatchStats } from '@/features/stats/services/statsService';
import { formatDate } from '@/shared/formatters/date';

export const MatchDetailPage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: match } = useMatch(id);
  const { data: players } = usePlayers(false);
  const { data: events } = useEventsByMatch(id);
  const deleteMatch = useDeleteMatch();

  if (!match) {
    return <section className="page-shell">Partido no encontrado</section>;
  }

  const playerMap = new Map((players ?? []).map((player) => [player.id, `${player.firstName} ${player.lastName}`]));
  const stats = getMatchStats(events ?? [], match);

  const handleDelete = async () => {
    if (!confirm('¿Eliminar partido?')) return;
    await deleteMatch.mutateAsync(id);
    navigate('/matches');
  };

  return (
    <section className="page-shell space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Partido {formatDate(match.date)}</h1>
        <div className="flex gap-2">
          <Link className="btn-secondary" to={`/matches/${id}/edit`}>Editar</Link>
          <Link className="btn-primary" to={`/matches/${id}/events`}>Cargar eventos</Link>
          <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
        </div>
      </div>

      <Card className="card-body grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-xs text-slate-500">Equipo A</p>
          <p className="font-medium">{match.teamA.map((id) => playerMap.get(id) ?? id).join(' / ')}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Equipo B</p>
          <p className="font-medium">{match.teamB.map((id) => playerMap.get(id) ?? id).join(' / ')}</p>
        </div>
        <div><p className="text-xs text-slate-500">Formato</p><p>{match.format}</p></div>
        <div><p className="text-xs text-slate-500">Estado</p><p>{match.status}</p></div>
        <div><p className="text-xs text-slate-500">Resultado</p><p>{match.setsWonTeamA} - {match.setsWonTeamB}</p></div>
        <div><p className="text-xs text-slate-500">Ganador</p><p>{match.winner ?? '-'}</p></div>
      </Card>

      <Card className="card-body grid gap-3 md:grid-cols-4">
        <Metric label="Total eventos" value={stats.totalEvents} />
        <Metric label="Más winners" value={stats.topWinnerPlayerId ? (playerMap.get(stats.topWinnerPlayerId) ?? stats.topWinnerPlayerId) : '-'} />
        <Metric label="Más ENF" value={stats.topUnforcedErrorsPlayerId ? (playerMap.get(stats.topUnforcedErrorsPlayerId) ?? stats.topUnforcedErrorsPlayerId) : '-'} />
        <Metric label="Winners equipo A/B" value={`${stats.teamAWinners} / ${stats.teamBWinners}`} />
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
