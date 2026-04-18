import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useStatsData } from '@/features/stats/hooks/useStatsData';
import { getPlayerStats } from '@/features/stats/services/statsService';

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

  const matchIds = new Set(scopedMatches.map((match) => match.id));
  const scopedEvents = events.filter((event) => matchIds.has(event.matchId));

  const rows = (playerId === 'all' ? players : players.filter((player) => player.id === playerId)).map((player) => ({
    player,
    stats: getPlayerStats(scopedEvents, scopedMatches, player.id)
  }));

  if (loading) return <section className="page-shell">Cargando estadísticas...</section>;

  return (
    <section className="page-shell space-y-4">
      <div>
        <h1 className="page-title">Estadísticas por jugador</h1>
        <p className="page-subtitle">Filtra por jugador y rango de fechas</p>
      </div>

      <Card className="card-body grid gap-3 md:grid-cols-3">
        <Select label="Jugador" value={playerId} onChange={(event) => setPlayerId(event.target.value)}>
          <option value="all">Todos</option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>{player.firstName} {player.lastName}</option>
          ))}
        </Select>
        <Input label="Desde" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <Input label="Hasta" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Jugador</th>
                <th className="th">PJ</th>
                <th className="th">PG</th>
                <th className="th">PP</th>
                <th className="th">Win%</th>
                <th className="th">Winners</th>
                <th className="th">ENF</th>
                <th className="th">Aces</th>
                <th className="th">Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ player, stats }) => (
                <tr key={player.id} className="border-t border-slate-100">
                  <td className="td">{player.firstName} {player.lastName}</td>
                  <td className="td">{stats.matchesPlayed}</td>
                  <td className="td">{stats.matchesWon}</td>
                  <td className="td">{stats.matchesLost}</td>
                  <td className="td">{stats.winRate.toFixed(1)}%</td>
                  <td className="td">{stats.winners}</td>
                  <td className="td">{stats.unforcedErrors}</td>
                  <td className="td">{stats.aces}</td>
                  <td className="td">{stats.winnersMinusUnforcedErrors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
};
