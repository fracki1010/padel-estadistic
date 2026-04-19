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
  bestOf: 3,
  deuce: 'ventaja',
  teamAPlayer1Id: '',
  teamAPlayer1Side: 'drive',
  teamAPlayer2Id: '',
  teamAPlayer2Side: 'reves',
  teamBPlayer1Id: '',
  teamBPlayer1Side: 'drive',
  teamBPlayer2Id: '',
  teamBPlayer2Side: 'reves',
  notes: '',
  status: 'pendiente',
  setsWonTeamA: 0,
  setsWonTeamB: 0,
  winner: 'none'
};

type SideField = 'teamAPlayer1Side' | 'teamAPlayer2Side' | 'teamBPlayer1Side' | 'teamBPlayer2Side';
type PlayerField = 'teamAPlayer1Id' | 'teamAPlayer2Id' | 'teamBPlayer1Id' | 'teamBPlayer2Id';

const PLAYER_SIDE_PAIRS: [PlayerField, SideField][] = [
  ['teamAPlayer1Id', 'teamAPlayer1Side'],
  ['teamAPlayer2Id', 'teamAPlayer2Side'],
  ['teamBPlayer1Id', 'teamBPlayer1Side'],
  ['teamBPlayer2Id', 'teamBPlayer2Side']
];

export const MatchForm = ({ players, initialValues, loading, onSubmit }: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, dirtyFields }
  } = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: initialValues ?? defaultValues
  });

  useEffect(() => {
    reset(initialValues ?? defaultValues);
  }, [initialValues, reset]);

  const watchedBestOf = watch('bestOf');
  const watchedDeuce  = watch('deuce');
  const watchedA1Id = watch('teamAPlayer1Id');
  const watchedA2Id = watch('teamAPlayer2Id');
  const watchedB1Id = watch('teamBPlayer1Id');
  const watchedB2Id = watch('teamBPlayer2Id');
  const watchedA1Side = watch('teamAPlayer1Side');
  const watchedA2Side = watch('teamAPlayer2Side');
  const watchedB1Side = watch('teamBPlayer1Side');
  const watchedB2Side = watch('teamBPlayer2Side');

  const watchedIds = { teamAPlayer1Id: watchedA1Id, teamAPlayer2Id: watchedA2Id, teamBPlayer1Id: watchedB1Id, teamBPlayer2Id: watchedB2Id };
  const watchedSides = { teamAPlayer1Side: watchedA1Side, teamAPlayer2Side: watchedA2Side, teamBPlayer1Side: watchedB1Side, teamBPlayer2Side: watchedB2Side };

  // Auto-populate side from player's preferredSide when user explicitly changes the player selector
  useEffect(() => {
    if (!dirtyFields.teamAPlayer1Id) return;
    const player = players.find((p) => p.id === watchedA1Id);
    if (player && player.preferredSide !== 'indistinto') setValue('teamAPlayer1Side', player.preferredSide);
  }, [watchedA1Id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dirtyFields.teamAPlayer2Id) return;
    const player = players.find((p) => p.id === watchedA2Id);
    if (player && player.preferredSide !== 'indistinto') setValue('teamAPlayer2Side', player.preferredSide);
  }, [watchedA2Id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dirtyFields.teamBPlayer1Id) return;
    const player = players.find((p) => p.id === watchedB1Id);
    if (player && player.preferredSide !== 'indistinto') setValue('teamBPlayer1Side', player.preferredSide);
  }, [watchedB1Id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dirtyFields.teamBPlayer2Id) return;
    const player = players.find((p) => p.id === watchedB2Id);
    if (player && player.preferredSide !== 'indistinto') setValue('teamBPlayer2Side', player.preferredSide);
  }, [watchedB2Id]); // eslint-disable-line react-hooks/exhaustive-deps

  const SideToggle = ({ sideField }: { sideField: SideField }) => {
    const current = watchedSides[sideField];
    return (
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setValue(sideField, 'drive', { shouldValidate: true, shouldDirty: true })}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
            current === 'drive'
              ? 'bg-sky-500 text-white'
              : 'border border-slate-600 bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Drive
        </button>
        <button
          type="button"
          onClick={() => setValue(sideField, 'reves', { shouldValidate: true, shouldDirty: true })}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
            current === 'reves'
              ? 'bg-violet-500 text-white'
              : 'border border-slate-600 bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Revés
        </button>
      </div>
    );
  };

  // Register side fields so they're submitted
  PLAYER_SIDE_PAIRS.forEach(([, sideField]) => {
    register(sideField);
  });

  const teamSection = (
    teamLabel: string,
    p1IdField: PlayerField,
    p1SideField: SideField,
    p2IdField: PlayerField,
    p2SideField: SideField
  ) => (
    <div className="card p-3">
      <p className="mb-3 text-sm font-semibold">{teamLabel}</p>
      <div className="space-y-3">
        <div>
          <Select label="Jugador 1" error={errors[p1IdField]?.message} {...register(p1IdField)}>
            <option value="">Seleccionar</option>
            {players.map((player) => (
              <option value={player.id} key={`${p1IdField}-${player.id}`}>{player.anonymous ? `? ${player.lastName}` : `${player.firstName} ${player.lastName}`}</option>
            ))}
          </Select>
          {watchedIds[p1IdField] ? (
            <div className="mt-1.5">
              <p className="mb-1 text-xs text-slate-400">Lado en cancha</p>
              <SideToggle sideField={p1SideField} />
            </div>
          ) : null}
        </div>
        <div>
          <Select label="Jugador 2" error={errors[p2IdField]?.message} {...register(p2IdField)}>
            <option value="">Seleccionar</option>
            {players.map((player) => (
              <option value={player.id} key={`${p2IdField}-${player.id}`}>{player.anonymous ? `? ${player.lastName}` : `${player.firstName} ${player.lastName}`}</option>
            ))}
          </Select>
          {watchedIds[p2IdField] ? (
            <div className="mt-1.5">
              <p className="mb-1 text-xs text-slate-400">Lado en cancha</p>
              <SideToggle sideField={p2SideField} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

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

      {/* Best of selector */}
      <div>
        <p className="mb-2 text-sm font-semibold">¿A cuántos sets?</p>
        <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
          <button
            type="button"
            onClick={() => setValue('bestOf', 3, { shouldValidate: true, shouldDirty: true })}
            className={`rounded-xl border p-3 text-center transition-colors ${
              watchedBestOf === 3
                ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
            }`}
          >
            <p className="text-xl font-black">3</p>
            <p className="text-xs">Mejor de 3</p>
          </button>
          <button
            type="button"
            onClick={() => setValue('bestOf', 5, { shouldValidate: true, shouldDirty: true })}
            className={`rounded-xl border p-3 text-center transition-colors ${
              watchedBestOf === 5
                ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
            }`}
          >
            <p className="text-xl font-black">5</p>
            <p className="text-xs">Mejor de 5</p>
          </button>
        </div>
        <input type="hidden" {...register('bestOf', { valueAsNumber: true })} />
      </div>

      {/* Deuce selector */}
      <div>
        <p className="mb-2 text-sm font-semibold">Regla del deuce</p>
        <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
          <button
            type="button"
            onClick={() => setValue('deuce', 'ventaja', { shouldValidate: true, shouldDirty: true })}
            className={`rounded-xl border p-3 text-center transition-colors ${
              watchedDeuce === 'ventaja'
                ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
            }`}
          >
            <p className="text-sm font-black">Ventaja</p>
            <p className="text-xs">40-AD → SP (2026)</p>
          </button>
          <button
            type="button"
            onClick={() => setValue('deuce', 'oro', { shouldValidate: true, shouldDirty: true })}
            className={`rounded-xl border p-3 text-center transition-colors ${
              watchedDeuce === 'oro'
                ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
            }`}
          >
            <p className="text-sm font-black">Punto de oro</p>
            <p className="text-xs">40-40 decide</p>
          </button>
        </div>
        <input type="hidden" {...register('deuce')} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {teamSection('Equipo A', 'teamAPlayer1Id', 'teamAPlayer1Side', 'teamAPlayer2Id', 'teamAPlayer2Side')}
        {teamSection('Equipo B', 'teamBPlayer1Id', 'teamBPlayer1Side', 'teamBPlayer2Id', 'teamBPlayer2Side')}
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
      {errors.teamAPlayer1Id?.message === 'No se puede repetir un jugador dentro del partido' ? (
        <p className="text-sm text-red-600">{errors.teamAPlayer1Id.message}</p>
      ) : null}
      <Button type="submit" loading={loading}>Guardar partido</Button>
    </form>
  );
};
