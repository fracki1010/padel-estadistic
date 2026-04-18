import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { PlayerForm } from '@/features/players/components/PlayerForm';
import { useCreatePlayer, usePlayer, useUpdatePlayer } from '@/features/players/hooks/usePlayers';
import type { PlayerFormValues } from '@/features/players/schemas/playerSchema';
import { FirebaseError } from 'firebase/app';

export const PlayerFormPage = ({ mode }: { mode: 'create' | 'edit' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: player } = usePlayer(id);
  const createMutation = useCreatePlayer();
  const updateMutation = useUpdatePlayer();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const initialValues = useMemo<PlayerFormValues | undefined>(() => {
    if (!player) return undefined;
    return {
      firstName: player.firstName,
      lastName: player.lastName,
      nickname: player.nickname,
      dominantHand: player.dominantHand,
      preferredSide: player.preferredSide,
      active: player.active
    };
  }, [player]);

  const handleSubmit = async (values: PlayerFormValues) => {
    setSubmitError(null);
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(values);
      } else if (id) {
        await updateMutation.mutateAsync({ id, input: values });
      }
      navigate('/players');
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === 'firestore/unavailable') {
          setSubmitError('Firestore no disponible en este momento. Intenta nuevamente.');
          return;
        }
        setSubmitError(`Error al guardar jugador: ${error.code}`);
        return;
      }
      setSubmitError(error instanceof Error ? error.message : 'No se pudo guardar el jugador');
    }
  };

  return (
    <section className="page-shell space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-title min-w-0">{mode === 'create' ? 'Nuevo jugador' : 'Editar jugador'}</h1>
        <Link to="/players" className="btn-secondary">Volver</Link>
      </div>
      <Card className="p-4">
        <PlayerForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          loading={createMutation.isPending || updateMutation.isPending}
        />
        {submitError ? <p className="mt-3 text-sm text-red-600">{submitError}</p> : null}
      </Card>
    </section>
  );
};
