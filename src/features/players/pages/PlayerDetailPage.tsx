import { Link, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { usePlayer, usePlayers } from '@/features/players/hooks/usePlayers';
import { useMatchEvents, useMatches } from '@/features/matches/hooks/useMatches';
import { getPlayerStats } from '@/features/stats/services/statsService';
import { formatDate } from '@/shared/formatters/date';

const HAND_LABEL: Record<string, string> = { derecha: 'Derecha', izquierda: 'Izquierda' };
const SIDE_LABEL: Record<string, string> = { drive: 'Drive', reves: 'Revés', indistinto: 'Indistinto' };
const SIDE_COLOR: Record<string, string> = {
  drive: 'text-sky-400 bg-sky-950 border-sky-700',
  reves: 'text-violet-400 bg-violet-950 border-violet-700',
  indistinto: 'text-slate-300 bg-slate-800 border-slate-700'
};
const STATUS_LABEL: Record<string, string> = { finalizado: 'Finalizado', en_curso: 'En curso', pendiente: 'Pendiente' };
const STATUS_COLOR: Record<string, 'green' | 'yellow' | 'slate'> = {
  finalizado: 'green', en_curso: 'yellow', pendiente: 'slate'
};
const FORMAT_LABEL: Record<string, string> = { amistoso: 'Amistoso', entrenamiento: 'Entren.', torneo: 'Torneo' };

export const PlayerDetailPage = () => {
  const { id = '' } = useParams();
  const { data: player } = usePlayer(id);
  const { data: allPlayers } = usePlayers(false);
  const { data: matches } = useMatches();
  const { data: events } = useMatchEvents();

  if (!player) {
    return <section className="page-shell text-slate-400">Jugador no encontrado.</section>;
  }

  const playerMap = new Map((allPlayers ?? []).map((p) => [p.id, `${p.firstName} ${p.lastName}`]));
  const stats = getPlayerStats(events ?? [], matches ?? [], id);

  const recentMatches = (matches ?? [])
    .filter((m) => [...m.teamA, ...m.teamB].includes(id))
    .slice(0, 5);

  const initials = `${player.firstName[0]}${player.lastName[0]}`;
  const winRate = stats.winRate;
  const winRateColor = winRate >= 60 ? 'text-emerald-400' : winRate >= 40 ? 'text-amber-400' : 'text-red-400';
  const balance = stats.winnersMinusUnforcedErrors;
  const balanceColor = balance > 0 ? 'text-emerald-400' : balance < 0 ? 'text-red-400' : 'text-slate-400';

  return (
    <section className="page-shell space-y-4">

      {/* Header: avatar + nombre + acciones */}
      <Card className="card-body">
        <div className="flex items-start gap-4">
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold ${
            player.active ? 'bg-brand-500/20 text-brand-300' : 'bg-slate-700 text-slate-400'
          }`}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100">{player.firstName} {player.lastName}</h1>
              {player.active
                ? <Badge color="green">Activo</Badge>
                : <Badge color="red">Inactivo</Badge>
              }
            </div>
            {player.nickname && (
              <p className="mt-0.5 text-sm text-slate-500">"{player.nickname}"</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${SIDE_COLOR[player.preferredSide] ?? 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                {SIDE_LABEL[player.preferredSide] ?? player.preferredSide}
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
                {HAND_LABEL[player.dominantHand] ?? player.dominantHand}
              </span>
            </div>
          </div>
          <Link className="btn-secondary shrink-0 px-3 py-1.5 text-xs" to={`/players/${id}/edit`}>
            Editar
          </Link>
        </div>
      </Card>

      {/* Rendimiento general */}
      <div>
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Rendimiento</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Partidos" value={stats.matchesPlayed} sub="jugados" />
          <StatCard label="Ganados" value={stats.matchesWon} valueClass="text-emerald-400" sub={`${stats.matchesLost} perdidos`} />
          <StatCard
            label="Win rate"
            value={`${winRate.toFixed(1)}%`}
            valueClass={winRateColor}
            sub={stats.matchesPlayed > 0 ? (winRate >= 50 ? 'Por encima del 50%' : 'Por debajo del 50%') : ''}
          />
          <StatCard
            label="Balance"
            value={`${balance > 0 ? '+' : ''}${balance}`}
            valueClass={balanceColor}
            sub="W - ENF"
          />
        </div>
      </div>

      {/* Golpes ganadores */}
      <div>
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Golpes ganadores</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          <StatCard label="Total W." value={stats.winners} valueClass="text-emerald-300" />
          <StatCard label="Bandeja" value={stats.bandejas} valueClass="text-sky-300" />
          <StatCard label="Víbora" value={stats.viboras} valueClass="text-violet-300" />
          <StatCard label="Globo" value={stats.globos} valueClass="text-amber-300" />
          <StatCard label="Passing" value={stats.passingShotsWon} valueClass="text-slate-200" />
          <StatCard label="3x" value={stats.x3Winners} valueClass="text-orange-300" />
          <StatCard label="4x" value={stats.x4Winners} valueClass="text-red-300" />
          <StatCard label="Ace" value={stats.aces} valueClass="text-sky-400" />
        </div>
      </div>

      {/* Errores */}
      <div>
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Errores</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          <StatCard label="No forz." value={stats.unforcedErrors} valueClass="text-red-400" sub="ENF" />
          <StatCard label="Forzados" value={stats.forcedErrors} valueClass="text-orange-400" />
          <StatCard label="D. Falta" value={stats.doubleFaults} valueClass="text-red-500" />
          {stats.doubleTouches > 0 && (
            <StatCard label="D. Toque" value={stats.doubleTouches} valueClass="text-slate-400" />
          )}
        </div>
      </div>

      {/* Últimos partidos */}
      <Card>
        <div className="card-header flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">Últimos partidos</h2>
          <Link to="/matches" className="text-xs text-brand-400 hover:text-brand-300">Ver todos →</Link>
        </div>
        {recentMatches.length === 0 ? (
          <div className="card-body">
            <p className="text-center text-sm text-slate-500 py-4">Sin partidos registrados.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {recentMatches.map((match) => {
              const isTeamA = match.teamA.includes(id);
              const myTeam = isTeamA ? match.teamA : match.teamB;
              const rivalTeam = isTeamA ? match.teamB : match.teamA;
              const myScore = isTeamA ? match.setsWonTeamA : match.setsWonTeamB;
              const rivalScore = isTeamA ? match.setsWonTeamB : match.setsWonTeamA;
              const won = match.winner === (isTeamA ? 'equipoA' : 'equipoB');
              const finished = match.status === 'finalizado';

              return (
                <Link
                  key={match.id}
                  to={`/matches/${match.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-800/40"
                >
                  {/* Resultado visual */}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    !finished ? 'bg-slate-800 text-slate-400' :
                    won ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                  }`}>
                    {!finished ? '–' : won ? 'V' : 'D'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-500 shrink-0">{formatDate(match.date)}</p>
                      <span className="text-slate-700">·</span>
                      <p className="truncate text-xs text-slate-400">{FORMAT_LABEL[match.format] ?? match.format}</p>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-slate-200">
                      {myTeam.map((pid) => playerMap.get(pid) ?? pid).join(' / ')}
                      <span className="mx-1.5 text-slate-600">vs</span>
                      {rivalTeam.map((pid) => playerMap.get(pid) ?? pid).join(' / ')}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    {finished ? (
                      <p className="text-sm font-bold tabular-nums text-slate-100">
                        {myScore}<span className="mx-0.5 text-slate-600">-</span>{rivalScore}
                      </p>
                    ) : (
                      <Badge color={STATUS_COLOR[match.status]}>
                        {STATUS_LABEL[match.status]}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </section>
  );
};

const StatCard = ({
  label,
  value,
  valueClass = 'text-slate-100',
  sub
}: {
  label: string;
  value: string | number;
  valueClass?: string;
  sub?: string;
}) => (
  <Card className="card-body">
    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
    <p className={`mt-1 text-2xl font-bold tabular-nums ${valueClass}`}>{value}</p>
    {sub && <p className="mt-0.5 truncate text-[11px] text-slate-600">{sub}</p>}
  </Card>
);
