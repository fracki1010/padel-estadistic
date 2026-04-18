import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { useMatches } from '@/features/matches/hooks/useMatches';
import { usePlayers } from '@/features/players/hooks/usePlayers';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/shared/formatters/date';

export const MatchesListPage = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [format, setFormat] = useState<'all' | 'amistoso' | 'entrenamiento' | 'torneo'>('all');
  const [status, setStatus] = useState<'all' | 'pendiente' | 'en_curso' | 'finalizado'>('all');
  const [playerId, setPlayerId] = useState<string>('all');

  const filters = useMemo(() => ({ from, to, format, status, playerId }), [from, to, format, status, playerId]);

  const { data: matches, isLoading } = useMatches(filters);
  const { data: players } = usePlayers(true);

  const playerMap = new Map((players ?? []).map((player) => [player.id, `${player.firstName} ${player.lastName}`]));

  return (
    <section className="page-shell space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Partidos</h1>
          <p className="page-subtitle">Filtra y gestiona partidos</p>
        </div>
        <Link className="btn-primary" to="/matches/new">Nuevo partido</Link>
      </div>

      <Card className="card-body grid gap-3 md:grid-cols-5">
        <Input label="Desde" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <Input label="Hasta" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        <Select label="Formato" value={format} onChange={(event) => setFormat(event.target.value as typeof format)}>
          <option value="all">Todos</option>
          <option value="amistoso">Amistoso</option>
          <option value="entrenamiento">Entrenamiento</option>
          <option value="torneo">Torneo</option>
        </Select>
        <Select label="Estado" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
          <option value="all">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_curso">En curso</option>
          <option value="finalizado">Finalizado</option>
        </Select>
        <Select label="Jugador" value={playerId} onChange={(event) => setPlayerId(event.target.value)}>
          <option value="all">Todos</option>
          {players?.map((player) => (
            <option value={player.id} key={player.id}>{player.firstName} {player.lastName}</option>
          ))}
        </Select>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Fecha</th>
                <th className="th">Formato</th>
                <th className="th">Equipos</th>
                <th className="th">Estado</th>
                <th className="th">Resultado</th>
                <th className="th">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="td" colSpan={6}>Cargando...</td></tr>
              ) : matches?.map((match) => (
                <tr key={match.id} className="border-t border-slate-100">
                  <td className="td">{formatDate(match.date)}</td>
                  <td className="td capitalize">{match.format}</td>
                  <td className="td">
                    <p>A: {match.teamA.map((id) => playerMap.get(id) ?? id).join(' / ')}</p>
                    <p>B: {match.teamB.map((id) => playerMap.get(id) ?? id).join(' / ')}</p>
                  </td>
                  <td className="td">
                    <Badge color={match.status === 'finalizado' ? 'green' : match.status === 'en_curso' ? 'yellow' : 'slate'}>
                      {match.status}
                    </Badge>
                  </td>
                  <td className="td">{match.setsWonTeamA}-{match.setsWonTeamB}</td>
                  <td className="td">
                    <div className="flex flex-wrap gap-2">
                      <Link className="btn-secondary" to={`/matches/${match.id}`}>Ver</Link>
                      <Link className="btn-secondary" to={`/matches/${match.id}/events`}>Eventos</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
};
