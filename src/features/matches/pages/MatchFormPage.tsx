import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { MatchForm } from '@/features/matches/components/MatchForm';
import { useCreateMatch, useMatch, useUpdateMatch } from '@/features/matches/hooks/useMatches';
import { usePlayers } from '@/features/players/hooks/usePlayers';
import type { MatchFormValues } from '@/features/matches/schemas/matchSchema';

export const MatchFormPage = ({ mode }: { mode: 'create' | 'edit' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: players } = usePlayers(false);
  const { data: match } = useMatch(id);
  const createMutation = useCreateMatch();
  const updateMutation = useUpdateMatch();

  const initialValues = useMemo<MatchFormValues | undefined>(() => {
    if (!match) return undefined;
    return {
      date: match.date,
      location: match.location || '',
      format: match.format,
      teamAPlayer1Id: match.teamA[0],
      teamAPlayer2Id: match.teamA[1],
      teamBPlayer1Id: match.teamB[0],
      teamBPlayer2Id: match.teamB[1],
      notes: match.notes || '',
      status: match.status,
      setsWonTeamA: match.setsWonTeamA,
      setsWonTeamB: match.setsWonTeamB,
      winner: match.winner ?? 'none'
    };
  }, [match]);

  const selectablePlayers = useMemo(() => {
    const all = players ?? [];
    if (mode === 'create') return all.filter((player) => player.active);
    return all;
  }, [mode, players]);

  const handleSubmit = async (values: MatchFormValues) => {
    const payload = {
      date: values.date,
      location: values.location,
      format: values.format,
      teamA: [values.teamAPlayer1Id, values.teamAPlayer2Id] as [string, string],
      teamB: [values.teamBPlayer1Id, values.teamBPlayer2Id] as [string, string],
      notes: values.notes,
      status: values.status,
      setsWonTeamA: values.setsWonTeamA,
      setsWonTeamB: values.setsWonTeamB,
      winner: values.winner === 'none' ? null : values.winner
    };

    if (mode === 'create') {
      await createMutation.mutateAsync(payload);
    } else if (id) {
      await updateMutation.mutateAsync({ id, input: payload });
    }
    navigate('/matches');
  };

  return (
    <section className="page-shell space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-title min-w-0">{mode === 'create' ? 'Nuevo partido' : 'Editar partido'}</h1>
        <Link to="/matches" className="btn-secondary">Volver</Link>
      </div>
      <Card className="card-body">
        <MatchForm
          players={selectablePlayers}
          initialValues={initialValues}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleSubmit}
        />
      </Card>
    </section>
  );
};
