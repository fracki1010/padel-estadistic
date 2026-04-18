import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDeactivatePlayer, usePlayers } from '@/features/players/hooks/usePlayers';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

const HAND_LABEL: Record<string, string> = { derecha: 'Derecha', izquierda: 'Izquierda' };
const SIDE_LABEL: Record<string, string> = { drive: 'Drive', reves: 'Revés', indistinto: 'Indistinto' };

const SIDE_COLOR: Record<string, string> = {
  drive: 'text-sky-400',
  reves: 'text-violet-400',
  indistinto: 'text-slate-400'
};

const Avatar = ({ firstName, lastName, active }: { firstName: string; lastName: string; active: boolean }) => (
  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
    active ? 'bg-brand-500/20 text-brand-300' : 'bg-slate-700 text-slate-400'
  }`}>
    {firstName[0]}{lastName[0]}
  </div>
);

export const PlayersListPage = () => {
  const { data: players, isLoading } = usePlayers(false);
  const deactivate = useDeactivatePlayer();
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const handleDeactivate = async (id: string) => {
    if (!confirm('¿Desactivar jugador?')) return;
    await deactivate.mutateAsync(id);
  };

  const filtered = (players ?? []).filter((p) =>
    filter === 'all' ? true : filter === 'active' ? p.active : !p.active
  );

  return (
    <section className="page-shell space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="page-title">Jugadores</h1>
          <p className="page-subtitle">Gestiona la base de jugadores</p>
        </div>
        <Link to="/players/new" className="btn-primary">+ Nuevo</Link>
      </div>

      {/* Filtro rápido */}
      <div className="flex gap-2">
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              filter === f
                ? 'border-brand-500/40 bg-brand-500/15 text-brand-300'
                : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Card className="card-body space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-800/60" />
          ))}
        </Card>
      ) : !filtered.length ? (
        <EmptyState
          title="Sin jugadores"
          description={filter !== 'all' ? 'No hay jugadores con ese filtro.' : 'Crea el primer jugador para empezar.'}
          action={filter === 'all' ? <Link className="btn-primary" to="/players/new">Crear jugador</Link> : undefined}
        />
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="space-y-2 md:hidden">
            {filtered.map((player) => (
              <Card key={player.id}>
                <div className="flex items-center gap-3 p-3">
                  <Avatar firstName={player.firstName} lastName={player.lastName} active={player.active} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-slate-100">
                        {player.firstName} {player.lastName}
                      </p>
                      {player.active
                        ? <Badge color="green">Activo</Badge>
                        : <Badge color="red">Inactivo</Badge>
                      }
                    </div>
                    {player.nickname && (
                      <p className="text-xs text-slate-500">"{player.nickname}"</p>
                    )}
                    <div className="mt-1 flex gap-3 text-xs">
                      <span className="text-slate-400">
                        {HAND_LABEL[player.dominantHand] ?? player.dominantHand}
                      </span>
                      <span className={`font-medium ${SIDE_COLOR[player.preferredSide] ?? 'text-slate-400'}`}>
                        {SIDE_LABEL[player.preferredSide] ?? player.preferredSide}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 border-t border-slate-800 px-3 py-2">
                  <Link className="btn-secondary flex-1 py-1.5 text-xs" to={`/players/${player.id}`}>Ver perfil</Link>
                  <Link className="btn-secondary flex-1 py-1.5 text-xs" to={`/players/${player.id}/edit`}>Editar</Link>
                  {player.active && (
                    <Button variant="danger" className="flex-1 py-1.5 text-xs" onClick={() => handleDeactivate(player.id)}>
                      Desactivar
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: tabla */}
          <Card className="hidden md:block">
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Jugador</th>
                  <th className="th">Mano dominante</th>
                  <th className="th">Posición</th>
                  <th className="th">Estado</th>
                  <th className="th">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((player) => (
                  <tr key={player.id} className="border-t border-slate-800 transition-colors hover:bg-slate-800/30">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <Avatar firstName={player.firstName} lastName={player.lastName} active={player.active} />
                        <div>
                          <p className="font-semibold text-slate-100">{player.firstName} {player.lastName}</p>
                          {player.nickname && (
                            <p className="text-xs text-slate-500">"{player.nickname}"</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="td text-sm text-slate-300">
                      {HAND_LABEL[player.dominantHand] ?? player.dominantHand}
                    </td>
                    <td className="td">
                      <span className={`text-sm font-medium ${SIDE_COLOR[player.preferredSide] ?? 'text-slate-400'}`}>
                        {SIDE_LABEL[player.preferredSide] ?? player.preferredSide}
                      </span>
                    </td>
                    <td className="td">
                      {player.active
                        ? <Badge color="green">Activo</Badge>
                        : <Badge color="red">Inactivo</Badge>
                      }
                    </td>
                    <td className="td">
                      <div className="flex gap-1.5">
                        <Link className="btn-secondary px-2 py-1 text-xs" to={`/players/${player.id}`}>Ver</Link>
                        <Link className="btn-secondary px-2 py-1 text-xs" to={`/players/${player.id}/edit`}>Editar</Link>
                        {player.active && (
                          <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => handleDeactivate(player.id)}>
                            Desactivar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </section>
  );
};
