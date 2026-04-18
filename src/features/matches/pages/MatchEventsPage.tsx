import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCreateMatchEvent, useDeleteMatchEvent, useEventsByMatch, useMatch } from '@/features/matches/hooks/useMatches';
import { usePlayers } from '@/features/players/hooks/usePlayers';
import { formatDateTime } from '@/shared/formatters/date';
import type { EventType, ShotType, ZoneType } from '@/features/matches/types/matchEvent';

const EVENT_TYPES: EventType[] = [
  'winner',
  'error_no_forzado',
  'error_forzado',
  'ace',
  'doble_falta',
  'punto_largo_ganado',
  'globo_ganador',
  'bandeja_ganadora',
  'vibora_ganadora',
  'passing_shot',
  'recuperacion_defensiva'
];

const SHOT_TYPES: ShotType[] = [
  'saque',
  'resto',
  'drive',
  'reves',
  'volea_drive',
  'volea_reves',
  'bandeja',
  'vibora',
  'smash',
  'globo',
  'salida_de_pared',
  'contra_pared',
  'otro'
];

export const MatchEventsPage = () => {
  const { id = '' } = useParams();
  const { data: match } = useMatch(id);
  const { data: events } = useEventsByMatch(id);
  const { data: players } = usePlayers(false);
  const createEvent = useCreateMatchEvent(id);
  const deleteEvent = useDeleteMatchEvent(id);

  const [setNumber, setSetNumber] = useState(1);
  const [gameNumber, setGameNumber] = useState(1);
  const [pointNumber, setPointNumber] = useState(1);
  const [winningTeam, setWinningTeam] = useState<'equipoA' | 'equipoB'>('equipoA');
  const [playerId, setPlayerId] = useState('');
  const [eventType, setEventType] = useState<EventType>('winner');
  const [shotType, setShotType] = useState<ShotType>('drive');
  const [zone, setZone] = useState<ZoneType>(null);
  const [notes, setNotes] = useState('');

  const playerMap = new Map((players ?? []).map((player) => [player.id, `${player.firstName} ${player.lastName}`]));
  const playersInMatch = useMemo(() => {
    if (!match) return [];
    return [...match.teamA, ...match.teamB]
      .map((playerId) => players?.find((player) => player.id === playerId))
      .filter((player): player is NonNullable<typeof player> => Boolean(player));
  }, [match, players]);

  const saveEvent = async () => {
    if (!match || !playerId) return;

    await createEvent.mutateAsync({
      matchId: id,
      timestamp: new Date().toISOString(),
      setNumber,
      gameNumber,
      pointNumber,
      winningTeam,
      playerId,
      eventType,
      shotType,
      zone,
      notes
    });

    setPointNumber((prev) => prev + 1);
    setNotes('');
  };

  const undoLast = async () => {
    const last = events?.[events.length - 1];
    if (!last) return;
    await deleteEvent.mutateAsync(last.id);
  };

  if (!match) {
    return <section className="page-shell">Partido no encontrado.</section>;
  }

  return (
    <section className="page-shell space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Carga rápida de eventos</h1>
          <p className="page-subtitle">Total eventos: {events?.length ?? 0}</p>
        </div>
        <Button variant="secondary" onClick={undoLast}>
          Deshacer último evento
        </Button>
      </div>

      <Card className="card-body space-y-4">
        <div>
          <p className="mb-2 text-sm font-semibold">Jugador responsable</p>
          <div className="grid gap-2 md:grid-cols-4">
            {playersInMatch.map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => setPlayerId(player.id)}
                className={`rounded-lg border px-3 py-3 text-left text-sm ${playerId === player.id ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white'}`}
              >
                {player.firstName} {player.lastName}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Tipo de evento</p>
          <div className="grid gap-2 md:grid-cols-4">
            {EVENT_TYPES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setEventType(item)}
                className={`rounded-lg border px-3 py-2 text-sm ${eventType === item ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Tipo de golpe</p>
          <div className="grid gap-2 md:grid-cols-5">
            {SHOT_TYPES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setShotType(item)}
                className={`rounded-lg border px-3 py-2 text-sm ${shotType === item ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <Input label="Set" type="number" value={setNumber} onChange={(event) => setSetNumber(Number(event.target.value))} />
          <Input label="Game" type="number" value={gameNumber} onChange={(event) => setGameNumber(Number(event.target.value))} />
          <Input label="Punto" type="number" value={pointNumber} onChange={(event) => setPointNumber(Number(event.target.value))} />
          <Select label="Equipo que gana" value={winningTeam} onChange={(event) => setWinningTeam(event.target.value as 'equipoA' | 'equipoB')}>
            <option value="equipoA">Equipo A</option>
            <option value="equipoB">Equipo B</option>
          </Select>
          <Select label="Zona" value={zone ?? ''} onChange={(event) => setZone((event.target.value || null) as ZoneType)}>
            <option value="">Sin zona</option>
            <option value="red">Red</option>
            <option value="fondo">Fondo</option>
            <option value="transicion">Transición</option>
          </Select>
        </div>

        <Input label="Observación" value={notes} onChange={(event) => setNotes(event.target.value)} />
        <Button onClick={saveEvent} loading={createEvent.isPending} disabled={!playerId}>Guardar evento</Button>
      </Card>

      <Card>
        <div className="card-header">
          <h2 className="font-semibold">Eventos registrados</h2>
        </div>
        <div className="max-h-[380px] overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Hora</th>
                <th className="th">Set/Game/Punto</th>
                <th className="th">Jugador</th>
                <th className="th">Evento</th>
                <th className="th">Golpe</th>
                <th className="th">Equipo</th>
              </tr>
            </thead>
            <tbody>
              {events?.map((event) => (
                <tr key={event.id} className="border-t border-slate-100">
                  <td className="td">{formatDateTime(event.timestamp)}</td>
                  <td className="td">{event.setNumber}/{event.gameNumber}/{event.pointNumber}</td>
                  <td className="td">{playerMap.get(event.playerId) ?? event.playerId}</td>
                  <td className="td">{event.eventType}</td>
                  <td className="td">{event.shotType}</td>
                  <td className="td">{event.winningTeam}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
};
