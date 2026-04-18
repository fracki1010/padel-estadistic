import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { useStatsData } from '@/features/stats/hooks/useStatsData';
import { getPlayerStats } from '@/features/stats/services/statsService';

const WinRatePill = ({ value }: { value: number }) => {
  const color =
    value >= 60 ? 'text-emerald-300 bg-emerald-950 border-emerald-700' :
    value >= 40 ? 'text-amber-300 bg-amber-950 border-amber-700' :
                  'text-red-300 bg-red-950 border-red-700';
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums ${color}`}>
      {value.toFixed(1)}%
    </span>
  );
};

const BalancePill = ({ value }: { value: number }) => {
  const color =
    value > 0 ? 'text-emerald-300' :
    value < 0 ? 'text-red-400' :
                'text-slate-400';
  return (
    <span className={`font-semibold tabular-nums ${color}`}>
      {value > 0 ? '+' : ''}{value}
    </span>
  );
};

export const StatsPage = () => {
  const { players, matches, events, loading } = useStatsData();
  const [playerId, setPlayerId] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const scopedMatches = useMemo(() => {
    return matches.filter((match) => {
      const time = new Date(match.date).getTime();
      const fromTime = from ? new Date(from).getTime() : null;
      const toTime = to ? new Date(to).getTime() : null;
      return (fromTime === null || time >= fromTime) && (toTime === null || time <= toTime);
    });
  }, [from, matches, to]);

  const matchIds = useMemo(() => new Set(scopedMatches.map((m) => m.id)), [scopedMatches]);
  const scopedEvents = useMemo(() => events.filter((e) => matchIds.has(e.matchId)), [events, matchIds]);

  const filteredPlayers = playerId === 'all' ? players : players.filter((p) => p.id === playerId);

  const rows = useMemo(() =>
    filteredPlayers.map((player) => ({
      player,
      stats: getPlayerStats(scopedEvents, scopedMatches, player.id)
    })).sort((a, b) => b.stats.matchesWon - a.stats.matchesWon),
  [filteredPlayers, scopedEvents, scopedMatches]);

  if (loading) return <section className="page-shell">Cargando estadísticas...</section>;

  return (
    <section className="page-shell space-y-4">
      <div>
        <h1 className="page-title">Estadísticas</h1>
        <p className="page-subtitle">Rendimiento por jugador y rango de fechas</p>
      </div>

      <Card className="card-body grid gap-3 sm:grid-cols-3">
        <Select label="Jugador" value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
          <option value="all">Todos los jugadores</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
          ))}
        </Select>
        <Input label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </Card>

      {rows.length === 0 ? (
        <EmptyState title="Sin datos" description="No hay estadísticas para los filtros seleccionados." />
      ) : (
        <>
          {/* Mobile: tarjetas apiladas */}
          <div className="space-y-3 md:hidden">
            {rows.map(({ player, stats }) => (
              <Card key={player.id}>
                <div className="card-header flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-100">{player.firstName} {player.lastName}</p>
                  <WinRatePill value={stats.winRate} />
                </div>
                <div className="card-body grid grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-slate-100">{stats.matchesPlayed}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">PJ</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-400">{stats.matchesWon}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">PG</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-400">{stats.matchesLost}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">PP</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-sky-400">{stats.aces}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Aces</p>
                  </div>
                </div>
                <div className="border-t border-slate-800 px-4 py-3 grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-base font-semibold text-emerald-300">{stats.winners}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Winners</p>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-red-400">{stats.unforcedErrors}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">ENF</p>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-sky-400">{stats.aces}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Aces</p>
                  </div>
                  <div>
                    <BalancePill value={stats.winnersMinusUnforcedErrors} />
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Balance</p>
                  </div>
                </div>
                <div className="border-t border-slate-800 px-4 py-2 grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-sm font-semibold text-sky-300">{stats.bandejas}</p>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wide">Bandeja</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-violet-300">{stats.viboras}</p>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wide">Víbora</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-orange-300">{stats.x3Winners}</p>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wide">3x</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-300">{stats.x4Winners}</p>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wide">4x</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: tabla */}
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="th">Jugador</th>
                    <th className="th text-center" title="Partidos jugados">PJ</th>
                    <th className="th text-center" title="Partidos ganados">PG</th>
                    <th className="th text-center" title="Partidos perdidos">PP</th>
                    <th className="th text-center">Win %</th>
                    <th className="th text-center">Winners</th>
                    <th className="th text-center" title="Errores no forzados">ENF</th>
                    <th className="th text-center">Aces</th>
                    <th className="th text-center">Bandeja</th>
                    <th className="th text-center">Víbora</th>
                    <th className="th text-center">3x</th>
                    <th className="th text-center">4x</th>
                    <th className="th text-center" title="Winners - Errores no forzados">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ player, stats }, i) => (
                    <tr
                      key={player.id}
                      className={`border-t border-slate-800 transition-colors hover:bg-slate-800/30 ${i === 0 ? 'bg-brand-500/5' : ''}`}
                    >
                      <td className="td font-medium">
                        <div className="flex items-center gap-2">
                          {i === 0 && (
                            <span className="text-amber-400 text-sm">🥇</span>
                          )}
                          {player.firstName} {player.lastName}
                        </div>
                      </td>
                      <td className="td text-center tabular-nums text-slate-300">{stats.matchesPlayed}</td>
                      <td className="td text-center tabular-nums font-semibold text-emerald-400">{stats.matchesWon}</td>
                      <td className="td text-center tabular-nums text-red-400">{stats.matchesLost}</td>
                      <td className="td text-center"><WinRatePill value={stats.winRate} /></td>
                      <td className="td text-center tabular-nums font-semibold text-emerald-300">{stats.winners}</td>
                      <td className="td text-center tabular-nums text-red-400">{stats.unforcedErrors}</td>
                      <td className="td text-center tabular-nums text-sky-400">{stats.aces}</td>
                      <td className="td text-center tabular-nums text-sky-300">{stats.bandejas}</td>
                      <td className="td text-center tabular-nums text-violet-300">{stats.viboras}</td>
                      <td className="td text-center tabular-nums text-orange-300">{stats.x3Winners}</td>
                      <td className="td text-center tabular-nums text-red-300">{stats.x4Winners}</td>
                      <td className="td text-center"><BalancePill value={stats.winnersMinusUnforcedErrors} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </section>
  );
};
