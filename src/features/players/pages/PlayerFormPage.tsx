import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { PlayerForm } from '@/features/players/components/PlayerForm';
import { useCreatePlayer, usePlayer, useUpdatePlayer } from '@/features/players/hooks/usePlayers';
import type { PlayerFormValues } from '@/features/players/schemas/playerSchema';

export const PlayerFormPage = ({ mode }: { mode: 'create' | 'edit' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: player } = usePlayer(id);
  const createMutation = useCreatePlayer();
  const updateMutation = useUpdatePlayer();

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
    if (mode === 'create') {
      await createMutation.mutateAsync(values);
    } else if (id) {
      await updateMutation.mutateAsync({ id, input: values });
    }
    navigate('/players');
  };

  return (
    <section className="page-shell space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">{mode === 'create' ? 'Nuevo jugador' : 'Editar jugador'}</h1>
        <Link to="/players" className="btn-secondary">Volver</Link>
      </div>
      <Card className="p-4">
        <PlayerForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </Card>
    </section>
  );
};
