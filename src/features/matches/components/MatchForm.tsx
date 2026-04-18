import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { matchSchema, type MatchFormValues } from '@/features/matches/schemas/matchSchema';
import type { Player } from '@/features/players/types/player';

interface Props {
  players: Player[];
  initialValues?: MatchFormValues;
  loading: boolean;
  onSubmit: (values: MatchFormValues) => Promise<void>;
}

const defaultValues: MatchFormValues = {
  date: new Date().toISOString().slice(0, 10),
  location: '',
  format: 'amistoso',
  teamAPlayer1Id: '',
  teamAPlayer2Id: '',
  teamBPlayer1Id: '',
  teamBPlayer2Id: '',
  notes: '',
  status: 'pendiente',
  setsWonTeamA: 0,
  setsWonTeamB: 0,
  winner: 'none'
};

export const MatchForm = ({ players, initialValues, loading, onSubmit }: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: initialValues ?? defaultValues
  });

  useEffect(() => {
    reset(initialValues ?? defaultValues);
  }, [initialValues, reset]);

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-3">
        <Input label="Fecha" type="date" error={errors.date?.message} {...register('date')} />
        <Input label="Lugar" error={errors.location?.message} {...register('location')} />
        <Select label="Formato" error={errors.format?.message} {...register('format')}>
          <option value="amistoso">Amistoso</option>
          <option value="entrenamiento">Entrenamiento</option>
          <option value="torneo">Torneo</option>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-3">
          <p className="mb-2 text-sm font-semibold">Equipo A</p>
          <div className="space-y-3">
            <Select label="Jugador 1" error={errors.teamAPlayer1Id?.message} {...register('teamAPlayer1Id')}>
              <option value="">Seleccionar</option>
              {players.map((player) => (
                <option value={player.id} key={player.id}>{player.firstName} {player.lastName}</option>
              ))}
            </Select>
            <Select label="Jugador 2" error={errors.teamAPlayer2Id?.message} {...register('teamAPlayer2Id')}>
              <option value="">Seleccionar</option>
              {players.map((player) => (
                <option value={player.id} key={player.id}>{player.firstName} {player.lastName}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="card p-3">
          <p className="mb-2 text-sm font-semibold">Equipo B</p>
          <div className="space-y-3">
            <Select label="Jugador 1" error={errors.teamBPlayer1Id?.message} {...register('teamBPlayer1Id')}>
              <option value="">Seleccionar</option>
              {players.map((player) => (
                <option value={player.id} key={player.id}>{player.firstName} {player.lastName}</option>
              ))}
            </Select>
            <Select label="Jugador 2" error={errors.teamBPlayer2Id?.message} {...register('teamBPlayer2Id')}>
              <option value="">Seleccionar</option>
              {players.map((player) => (
                <option value={player.id} key={player.id}>{player.firstName} {player.lastName}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Select label="Estado" error={errors.status?.message} {...register('status')}>
          <option value="pendiente">Pendiente</option>
          <option value="en_curso">En curso</option>
          <option value="finalizado">Finalizado</option>
        </Select>
        <Input label="Sets equipo A" type="number" error={errors.setsWonTeamA?.message} {...register('setsWonTeamA')} />
        <Input label="Sets equipo B" type="number" error={errors.setsWonTeamB?.message} {...register('setsWonTeamB')} />
        <Select label="Ganador" error={errors.winner?.message} {...register('winner')}>
          <option value="none">Sin definir</option>
          <option value="equipoA">Equipo A</option>
          <option value="equipoB">Equipo B</option>
        </Select>
      </div>

      <Input label="Observaciones" error={errors.notes?.message} {...register('notes')} />
      {errors.teamAPlayer1Id ? <p className="text-sm text-red-600">{errors.teamAPlayer1Id.message}</p> : null}
      <Button type="submit" loading={loading}>Guardar partido</Button>
    </form>
  );
};
