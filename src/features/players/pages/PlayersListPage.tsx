import { Link } from 'react-router-dom';
import { useDeactivatePlayer, usePlayers } from '@/features/players/hooks/usePlayers';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export const PlayersListPage = () => {
  const { data: players, isLoading } = usePlayers(false);
  const deactivate = useDeactivatePlayer();

  const handleDeactivate = async (id: string) => {
    if (!confirm('¿Desactivar jugador?')) return;
    await deactivate.mutateAsync(id);
  };

  return (
    <section className="page-shell space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Jugadores</h1>
          <p className="page-subtitle">Gestiona la base de jugadores</p>
        </div>
        <Link to="/players/new" className="btn-primary">
          Nuevo jugador
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Jugador</th>
                <th className="th">Mano</th>
                <th className="th">Posición</th>
                <th className="th">Estado</th>
                <th className="th">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="td" colSpan={5}>
                    Cargando...
                  </td>
                </tr>
              ) : players?.length ? (
                players.map((player) => (
                  <tr key={player.id} className="border-t border-slate-100">
                    <td className="td">
                      <p className="font-medium">{player.firstName} {player.lastName}</p>
                      {player.nickname ? <p className="text-xs text-slate-500">{player.nickname}</p> : null}
                    </td>
                    <td className="td capitalize">{player.dominantHand}</td>
                    <td className="td capitalize">{player.preferredSide}</td>
                    <td className="td">{player.active ? <Badge color="green">Activo</Badge> : <Badge color="red">Inactivo</Badge>}</td>
                    <td className="td">
                      <div className="flex flex-wrap gap-2">
                        <Link className="btn-secondary" to={`/players/${player.id}`}>
                          Ver
                        </Link>
                        <Link className="btn-secondary" to={`/players/${player.id}/edit`}>
                          Editar
                        </Link>
                        {player.active ? (
                          <Button variant="danger" onClick={() => handleDeactivate(player.id)}>
                            Desactivar
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4">
                    <EmptyState title="Sin jugadores" description="Crea el primer jugador para empezar" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
};
