import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CourtHeatmap } from '@/components/ui/CourtMap';
import { useDeleteMatch, useEventsByMatch, useMatch } from '@/features/matches/hooks/useMatches';
import { usePlayers } from '@/features/players/hooks/usePlayers';
import { getMatchStats } from '@/features/stats/services/statsService';
import { formatDate } from '@/shared/formatters/date';
import type { TeamStats } from '@/features/stats/types/stats';

const FORMAT_LABEL: Record<string, string> = { amistoso: 'Amistoso', entrenamiento: 'Entrenamiento', torneo: 'Torneo' };
const STATUS_COLOR: Record<string, 'green' | 'yellow' | 'slate'> = { finalizado: 'green', en_curso: 'yellow', pendiente: 'slate' };
const STATUS_LABEL: Record<string, string> = { finalizado: 'Finalizado', en_curso: 'En curso', pendiente: 'Pendiente' };

const WINNING_SET = new Set([
  'winner','bandeja_ganadora','vibora_ganadora','globo_ganador',
  'passing_shot','x3_ganador','x4_ganador','recuperacion_defensiva','punto_largo_ganado',
]);

const EVENT_LABEL: Record<string, string> = {
  winner: 'Winner', bandeja_ganadora: 'Bandeja', vibora_ganadora: 'Víbora',
  globo_ganador: 'Globo', passing_shot: 'Passing', x3_ganador: '3x',
  x4_ganador: '4x', recuperacion_defensiva: 'Recuperación',
  punto_largo_ganado: 'Punto largo', ace: 'Ace',
};

const CHART_TOOLTIP = {
  contentStyle: { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#94a3b8' },
  itemStyle: { color: '#e2e8f0' },
};

export const MatchDetailPage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: match }   = useMatch(id);
  const { data: players } = usePlayers(false);
  const { data: events }  = useEventsByMatch(id);
  const deleteMatch = useDeleteMatch();

  const matchEvents = events ?? [];

  const shotData = useMemo(() => {
    if (!match) return [];
    const byType: Record<string, { a: number; b: number }> = {};
    matchEvents
      .filter((e) => WINNING_SET.has(e.eventType) || e.eventType === 'ace')
      .forEach((e) => {
        const label = EVENT_LABEL[e.eventType] ?? e.eventType;
        if (!byType[label]) byType[label] = { a: 0, b: 0 };
        if (match.teamA.includes(e.playerId)) byType[label].a++;
        else byType[label].b++;
      });
    return Object.entries(byType)
      .map(([name, v]) => ({ name, A: v.a, B: v.b }))
      .filter((d) => d.A + d.B > 0)
      .sort((x, y) => (y.A + y.B) - (x.A + x.B));
  }, [matchEvents, match]);

  const hasCourtData = matchEvents.some((e) => e.courtZone);

  if (!match) return <section className="page-shell text-slate-400">Partido no encontrado</section>;

  const playerMap   = new Map((players ?? []).map((p) => [p.id, `${p.firstName} ${p.lastName}`]));
  const stats       = getMatchStats(matchEvents, match);
  const teamANames  = match.teamA.map((pid) => playerMap.get(pid) ?? pid);
  const teamBNames  = match.teamB.map((pid) => playerMap.get(pid) ?? pid);
  const winnerLabel = match.winner === 'equipoA' ? teamANames.join(' / ') : match.winner === 'equipoB' ? teamBNames.join(' / ') : null;

  const handleDelete = async () => {
    if (!confirm('¿Eliminar partido y todos sus eventos?')) return;
    await deleteMatch.mutateAsync(id);
    navigate('/matches');
  };

  const allMatchPlayers = [...match.teamA, ...match.teamB];

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

      {/* Marcador */}
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
              {match.setsWonTeamA}<span className="mx-2 text-slate-600">-</span>{match.setsWonTeamB}
            </p>
            <p className="mt-1 text-xs text-slate-500">sets</p>
            {winnerLabel && <p className="mt-2 text-xs font-semibold text-emerald-400">🏆 {winnerLabel}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Equipo B</p>
            {teamBNames.map((name) => (
              <p key={name} className="mt-0.5 truncate font-semibold text-slate-100">{name}</p>
            ))}
          </div>
        </div>
      </Card>

      {stats.totalEvents === 0 && (
        <Card className="card-body py-6 text-center text-sm text-slate-500">
          Sin eventos registrados — usá "Cargar eventos" para anotar el partido.
        </Card>
      )}

      {stats.totalEvents > 0 && (
        <>
          {/* Comparativa por equipo */}
          <Card>
            <div className="card-header">
              <h2 className="text-sm font-semibold text-slate-300">Comparativa Equipo A vs B</h2>
            </div>
            <div className="card-body space-y-1">
              <TeamRow label="Winners"           a={stats.teamA.winners}        b={stats.teamB.winners}        higherIsBetter />
              <TeamRow label="Aces"              a={stats.teamA.aces}           b={stats.teamB.aces}           higherIsBetter />
              <TeamRow label="Errores no forz."  a={stats.teamA.unforcedErrors} b={stats.teamB.unforcedErrors} />
              <TeamRow label="Errores forzados"  a={stats.teamA.forcedErrors}   b={stats.teamB.forcedErrors}   />
              <TeamRow label="Dobles faltas"     a={stats.teamA.doubleFaults}   b={stats.teamB.doubleFaults}   />
              <TeamRow label="Balance W−ENF"     a={stats.teamA.balance}        b={stats.teamB.balance}        higherIsBetter signed />
            </div>
            <div className="border-t border-slate-800 px-4 py-2 text-center text-xs text-slate-500">
              {stats.totalEvents} eventos registrados
            </div>
          </Card>

          {/* Top del partido */}
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

          {/* Detalle por jugador */}
          <Card>
            <div className="card-header">
              <h2 className="text-sm font-semibold text-slate-300">Detalle por jugador</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="py-2 pl-4 pr-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Jugador</th>
                    <th className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">W</th>
                    <th className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">ENF</th>
                    <th className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">EF</th>
                    <th className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ace</th>
                    <th className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">DF</th>
                    <th className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">Bdj</th>
                    <th className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">Vib</th>
                    <th className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">Glb</th>
                    <th className="px-2 py-2 pr-4 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">3x/4x</th>
                  </tr>
                </thead>
                <tbody>
                  {allMatchPlayers.map((pid, i) => {
                    const bd = stats.playerBreakdown[pid];
                    const isTeamA = match.teamA.includes(pid);
                    if (!bd) return null;
                    return (
                      <tr
                        key={pid}
                        className={`border-t border-slate-800/60 ${i < 2 ? 'bg-emerald-950/10' : 'bg-indigo-950/10'}`}
                      >
                        <td className="py-2 pl-4 pr-2">
                          <div>
                            <p className="text-sm font-medium text-slate-200 truncate max-w-[110px]">{playerMap.get(pid) ?? pid}</p>
                            <p className="text-[10px] text-slate-500">{isTeamA ? 'Equipo A' : 'Equipo B'}</p>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center tabular-nums font-semibold text-emerald-400">{bd.winners}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-red-400">{bd.unforcedErrors}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-orange-400">{bd.forcedErrors}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-sky-400">{bd.aces}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-red-500">{bd.doubleFaults}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-sky-300">{bd.bandejas}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-violet-300">{bd.viboras}</td>
                        <td className="px-2 py-2 text-center tabular-nums text-amber-300">{bd.globos}</td>
                        <td className="px-2 py-2 pr-4 text-center tabular-nums text-orange-300">
                          {bd.x3Winners + bd.x4Winners > 0 ? `${bd.x3Winners}/${bd.x4Winners}` : '–'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Golpes ganadores por tipo */}
          {shotData.length > 0 && (
            <Card>
              <div className="card-header">
                <h2 className="text-sm font-semibold text-slate-300">Winners por tipo de golpe</h2>
              </div>
              <div className="px-2 pb-4 pt-2">
                <ResponsiveContainer width="100%" height={Math.max(160, shotData.length * 36)}>
                  <BarChart layout="vertical" data={shotData} margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                    <XAxis
                      type="number" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      type="category" dataKey="name" width={80}
                      tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                    />
                    <Tooltip {...CHART_TOOLTIP} />
                    <Legend
                      formatter={(v) => v === 'A' ? teamANames.join('/') : teamBNames.join('/')}
                      iconSize={10}
                      wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }}
                    />
                    <Bar dataKey="A" fill="#10b981" radius={[0, 3, 3, 0]} maxBarSize={18} />
                    <Bar dataKey="B" fill="#6366f1" radius={[0, 3, 3, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Mapa de cancha (solo si hay datos de zona) */}
          {hasCourtData && (
            <>
              <div>
                <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Mapa de cancha</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Card className="card-body">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-400">Winners</p>
                    <CourtHeatmap
                      events={matchEvents}
                      teamA={match.teamA}
                      teamB={match.teamB}
                      mode="winners"
                      teamALabel={teamANames[0] ?? 'A'}
                      teamBLabel={teamBNames[0] ?? 'B'}
                    />
                    <div className="mt-2 flex justify-center gap-4 text-[10px] text-slate-500">
                      <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Eq. A</span>
                      <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-indigo-500" />Eq. B</span>
                    </div>
                  </Card>
                  <Card className="card-body">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-red-400">Errores</p>
                    <CourtHeatmap
                      events={matchEvents}
                      teamA={match.teamA}
                      teamB={match.teamB}
                      mode="errors"
                      teamALabel={teamANames[0] ?? 'A'}
                      teamBLabel={teamBNames[0] ?? 'B'}
                    />
                    <div className="mt-2 flex justify-center gap-4 text-[10px] text-slate-500">
                      <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" />Eq. A</span>
                      <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-orange-500" />Eq. B</span>
                    </div>
                  </Card>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
};

// ---------- TeamRow ----------
const TeamRow = ({
  label, a, b, higherIsBetter = false, signed = false,
}: {
  label: string; a: number; b: number; higherIsBetter?: boolean; signed?: boolean;
}) => {
  const aWins = higherIsBetter ? a > b : a < b;
  const bWins = higherIsBetter ? b > a : b < a;
  const fmt   = (v: number) => signed ? `${v > 0 ? '+' : ''}${v}` : String(v);
  const total  = Math.abs(a) + Math.abs(b);
  const aWidth = total > 0 ? Math.round((Math.abs(a) / total) * 100) : 50;

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
          <div className={`h-full rounded-r-full ${bWins ? 'bg-emerald-500' : 'bg-slate-600'}`} style={{ width: `${100 - aWidth}%` }} />
        </div>
      )}
    </div>
  );
};
