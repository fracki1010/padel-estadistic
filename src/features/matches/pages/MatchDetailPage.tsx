import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useDeleteMatch, useEventsByMatch, useMatch } from '@/features/matches/hooks/useMatches';
import { usePlayers } from '@/features/players/hooks/usePlayers';
import { getMatchStats } from '@/features/stats/services/statsService';
import { formatDate } from '@/shared/formatters/date';
import type { TeamStats } from '@/features/stats/types/stats';

const FORMAT_LABEL: Record<string, string> = { amistoso: 'Amistoso', entrenamiento: 'Entrenamiento', torneo: 'Torneo' };
const STATUS_COLOR: Record<string, 'green' | 'yellow' | 'slate'> = { finalizado: 'green', en_curso: 'yellow', pendiente: 'slate' };
const STATUS_LABEL: Record<string, string> = { finalizado: 'Finalizado', en_curso: 'En curso', pendiente: 'Pendiente' };

export const MatchDetailPage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: match } = useMatch(id);
  const { data: players } = usePlayers(false);
  const { data: events } = useEventsByMatch(id);
  const deleteMatch = useDeleteMatch();

  if (!match) return <section className="page-shell text-slate-400">Partido no encontrado</section>;

  const playerMap = new Map((players ?? []).map((p) => [p.id, `${p.firstName} ${p.lastName}`]));
  const stats = getMatchStats(events ?? [], match);

  const handleDelete = async () => {
    if (!confirm('¿Eliminar partido y todos sus eventos?')) return;
    await deleteMatch.mutateAsync(id);
    navigate('/matches');
  };

  const teamANames = match.teamA.map((pid) => playerMap.get(pid) ?? pid);
  const teamBNames = match.teamB.map((pid) => playerMap.get(pid) ?? pid);
  const winnerLabel = match.winner === 'equipoA' ? teamANames.join(' / ') : match.winner === 'equipoB' ? teamBNames.join(' / ') : null;

  return (
    <section className="page-shell space-y-4">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="page-title">{formatDate(match.date)}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge color={STATUS_COLOR[match.status] ?? 'slate'}>{STATUS_LABEL[match.status] ?? match.status}</Badge>
            <span className="text-sm text-slate-400">{FORMAT_LABEL[match.format] ?? match.format}</span>
            {match.location && <span className="text-sm text-slate-500">· {match.location}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary px-3 py-1.5 text-xs" to={`/matches/${id}/edit`}>Editar</Link>
          <Link className="btn-primary px-3 py-1.5 text-xs" to={`/matches/${id}/events`}>Cargar eventos</Link>
          <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={handleDelete}>Eliminar</Button>
        </div>
      </div>

      {/* Marcador principal */}
      <Card className="card-body">
        <div className="grid grid-cols-3 items-center gap-2 text-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Equipo A</p>
            {teamANames.map((name) => (
              <p key={name} className="mt-0.5 truncate font-semibold text-slate-100">{name}</p>
            ))}
          </div>
          <div>
            <p className="text-4xl font-bold tabular-nums text-slate-100">
              {match.setsWonTeamA}
              <span className="mx-2 text-slate-600">-</span>
              {match.setsWonTeamB}
            </p>
            <p className="mt-1 text-xs text-slate-500">sets</p>
            {winnerLabel && (
              <p className="mt-2 text-xs font-semibold text-emerald-400">🏆 {winnerLabel}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Equipo B</p>
            {teamBNames.map((name) => (
              <p key={name} className="mt-0.5 truncate font-semibold text-slate-100">{name}</p>
            ))}
          </div>
        </div>
      </Card>

      {/* Comparativa por equipo */}
      {stats.totalEvents > 0 && (
        <Card>
          <div className="card-header">
            <h2 className="text-sm font-semibold text-slate-300">Estadísticas del partido</h2>
          </div>
          <div className="card-body space-y-1">
            <TeamRow label="Winners" a={stats.teamA.winners} b={stats.teamB.winners} higherIsBetter />
            <TeamRow label="Aces" a={stats.teamA.aces} b={stats.teamB.aces} higherIsBetter />
            <TeamRow label="Errores no forzados" a={stats.teamA.unforcedErrors} b={stats.teamB.unforcedErrors} />
            <TeamRow label="Errores forzados" a={stats.teamA.forcedErrors} b={stats.teamB.forcedErrors} />
            <TeamRow label="Dobles faltas" a={stats.teamA.doubleFaults} b={stats.teamB.doubleFaults} />
            <TeamRow
              label="Balance W-ENF"
              a={stats.teamA.balance}
              b={stats.teamB.balance}
              higherIsBetter
              signed
            />
          </div>
          <div className="border-t border-slate-800 px-4 py-2 text-center text-xs text-slate-500">
            {stats.totalEvents} eventos registrados
          </div>
        </Card>
      )}

      {/* Top jugadores del partido */}
      {stats.totalEvents > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card className="card-body">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Más winners</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-100">
              {stats.topWinnerPlayerId ? (playerMap.get(stats.topWinnerPlayerId) ?? '-') : '-'}
            </p>
            <p className="text-lg font-bold text-emerald-400">
              {stats.topWinnerPlayerId ? (stats.winnersByPlayer[stats.topWinnerPlayerId] ?? 0) : '-'}
            </p>
          </Card>
          <Card className="card-body">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Más ENF</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-100">
              {stats.topUnforcedErrorsPlayerId ? (playerMap.get(stats.topUnforcedErrorsPlayerId) ?? '-') : '-'}
            </p>
            <p className="text-lg font-bold text-red-400">
              {stats.topUnforcedErrorsPlayerId ? (stats.errorsByPlayer[stats.topUnforcedErrorsPlayerId] ?? 0) : '-'}
            </p>
          </Card>
          {stats.topTargetedPlayerId && (
            <Card className="card-body col-span-2 sm:col-span-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Más atacado</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-100">
                {playerMap.get(stats.topTargetedPlayerId) ?? '-'}
              </p>
              <p className="text-lg font-bold text-amber-400">
                {stats.targetedByPlayer[stats.topTargetedPlayerId] ?? 0}
                <span className="ml-1 text-xs font-normal text-slate-500">veces</span>
              </p>
            </Card>
          )}
        </div>
      )}

      {stats.totalEvents === 0 && (
        <Card className="card-body text-center text-sm text-slate-500 py-6">
          Sin eventos registrados — usá "Cargar eventos" para anotar el partido.
        </Card>
      )}
    </section>
  );
};

const TeamRow = ({
  label,
  a,
  b,
  higherIsBetter = false,
  signed = false
}: {
  label: string;
  a: number;
  b: number;
  higherIsBetter?: boolean;
  signed?: boolean;
}) => {
  const aWins = higherIsBetter ? a > b : a < b;
  const bWins = higherIsBetter ? b > a : b < a;
  const fmt = (v: number) => signed ? `${v > 0 ? '+' : ''}${v}` : String(v);
  const total = Math.abs(a) + Math.abs(b);
  const aWidth = total > 0 ? Math.round((Math.abs(a) / total) * 100) : 50;
  const bWidth = 100 - aWidth;

  return (
    <div className="py-1.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className={`text-sm font-bold tabular-nums ${aWins ? 'text-emerald-400' : bWins ? 'text-slate-400' : 'text-slate-300'}`}>{fmt(a)}</span>
        <span className="text-xs text-slate-500">{label}</span>
        <span className={`text-sm font-bold tabular-nums ${bWins ? 'text-emerald-400' : aWins ? 'text-slate-400' : 'text-slate-300'}`}>{fmt(b)}</span>
      </div>
      {total > 0 && (
        <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div className={`h-full rounded-l-full ${aWins ? 'bg-emerald-500' : 'bg-slate-600'}`} style={{ width: `${aWidth}%` }} />
          <div className={`h-full rounded-r-full ${bWins ? 'bg-emerald-500' : 'bg-slate-600'}`} style={{ width: `${bWidth}%` }} />
        </div>
      )}
    </div>
  );
};
