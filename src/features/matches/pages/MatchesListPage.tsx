import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useMatches } from '@/features/matches/hooks/useMatches';
import { usePlayers } from '@/features/players/hooks/usePlayers';
import { formatDate } from '@/shared/formatters/date';

const STATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  finalizado: 'Finalizado'
};

const FORMAT_COLOR: Record<string, 'slate' | 'blue' | 'yellow'> = {
  amistoso: 'slate',
  entrenamiento: 'blue',
  torneo: 'yellow'
};

const FORMAT_LABEL: Record<string, string> = {
  amistoso: 'Amistoso',
  entrenamiento: 'Entren.',
  torneo: 'Torneo'
};

export const MatchesListPage = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [format, setFormat] = useState<'all' | 'amistoso' | 'entrenamiento' | 'torneo'>('all');
  const [status, setStatus] = useState<'all' | 'pendiente' | 'en_curso' | 'finalizado'>('all');
  const [playerId, setPlayerId] = useState<string>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = useMemo(() => ({ from, to, format, status, playerId }), [from, to, format, status, playerId]);

  const { data: matches, isLoading } = useMatches(filters);
  const { data: players } = usePlayers(true);

  const playerMap = new Map((players ?? []).map((p) => [p.id, `${p.firstName} ${p.lastName}`]));

  const activeCount = [from, to, format !== 'all', status !== 'all', playerId !== 'all'].filter(Boolean).length;

  const clearFilters = () => { setFrom(''); setTo(''); setFormat('all'); setStatus('all'); setPlayerId('all'); };

  return (
    <section className="page-shell space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="page-title">Partidos</h1>
          <p className="page-subtitle">Filtra y gestiona partidos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={`relative flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              filtersOpen || activeCount > 0
                ? 'border-brand-500/50 bg-brand-500/10 text-brand-300'
                : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M3 6h18M7 12h10M11 18h2" strokeLinecap="round" />
            </svg>
            Filtrar
            {activeCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-slate-950">
                {activeCount}
              </span>
            )}
          </button>
          <Link className="btn-primary px-4 py-2.5 text-sm" to="/matches/new">+ Nuevo</Link>
        </div>
      </div>

      {filtersOpen && (
        <Card className="card-body grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          <Input label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Select label="Formato" value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
            <option value="all">Todos</option>
            <option value="amistoso">Amistoso</option>
            <option value="entrenamiento">Entrenamiento</option>
            <option value="torneo">Torneo</option>
          </Select>
          <Select label="Estado" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="all">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_curso">En curso</option>
            <option value="finalizado">Finalizado</option>
          </Select>
          <Select label="Jugador" value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
            <option value="all">Todos</option>
            {players?.map((p) => (
              <option value={p.id} key={p.id}>{p.firstName} {p.lastName}</option>
            ))}
          </Select>
          {activeCount > 0 && (
            <button type="button" onClick={clearFilters} className="text-sm text-slate-400 hover:text-slate-200 text-left">
              Limpiar filtros
            </button>
          )}
        </Card>
      )}

      {isLoading ? (
        <Card className="card-body">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-800/60" />
            ))}
          </div>
        </Card>
      ) : !matches?.length ? (
        <EmptyState
          title="Sin partidos"
          description={hasFilters ? 'No hay partidos con los filtros seleccionados.' : 'Aún no se han registrado partidos.'}
          action={<Link className="btn-primary" to="/matches/new">Crear primer partido</Link>}
        />
      ) : (
        <Card>
          {/* Mobile: cards apiladas */}
          <div className="divide-y divide-slate-800 md:hidden">
            {matches.map((match) => (
              <div key={match.id} className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">{formatDate(match.date)}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge color={FORMAT_COLOR[match.format] ?? 'slate'}>
                        {FORMAT_LABEL[match.format] ?? match.format}
                      </Badge>
                      <Badge color={match.status === 'finalizado' ? 'green' : match.status === 'en_curso' ? 'yellow' : 'slate'}>
                        {STATUS_LABEL[match.status] ?? match.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-lg font-bold text-slate-100 tabular-nums">
                      {match.setsWonTeamA}
                      <span className="mx-1 text-slate-600">-</span>
                      {match.setsWonTeamB}
                    </span>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">sets</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-800/40 p-2 text-xs">
                  <div>
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Eq. A</p>
                    {match.teamA.map((id) => (
                      <p key={id} className="truncate text-slate-200">{playerMap.get(id) ?? id}</p>
                    ))}
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Eq. B</p>
                    {match.teamB.map((id) => (
                      <p key={id} className="truncate text-slate-200">{playerMap.get(id) ?? id}</p>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link className="btn-secondary flex-1 py-1.5 text-xs" to={`/matches/${match.id}`}>Ver detalle</Link>
                  <Link className="btn-secondary flex-1 py-1.5 text-xs" to={`/matches/${match.id}/events`}>Eventos</Link>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: tabla */}
          <div className="hidden overflow-x-auto md:block">
            <table className="table">
              <thead>
                <tr>
                  <th className="th w-24">Fecha</th>
                  <th className="th w-28">Formato</th>
                  <th className="th">Equipos</th>
                  <th className="th w-28">Estado</th>
                  <th className="th w-20 text-center">Sets</th>
                  <th className="th w-32">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={match.id} className="border-t border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="td text-slate-400 text-xs">{formatDate(match.date)}</td>
                    <td className="td">
                      <Badge color={FORMAT_COLOR[match.format] ?? 'slate'}>
                        {FORMAT_LABEL[match.format] ?? match.format}
                      </Badge>
                    </td>
                    <td className="td">
                      <div className="grid grid-cols-2 gap-x-4 text-xs">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mr-1">A</span>
                          {match.teamA.map((id) => playerMap.get(id) ?? id).join(' / ')}
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mr-1">B</span>
                          {match.teamB.map((id) => playerMap.get(id) ?? id).join(' / ')}
                        </div>
                      </div>
                    </td>
                    <td className="td">
                      <Badge color={match.status === 'finalizado' ? 'green' : match.status === 'en_curso' ? 'yellow' : 'slate'}>
                        {STATUS_LABEL[match.status] ?? match.status}
                      </Badge>
                    </td>
                    <td className="td text-center font-bold tabular-nums">
                      {match.setsWonTeamA}
                      <span className="mx-1 text-slate-600">-</span>
                      {match.setsWonTeamB}
                    </td>
                    <td className="td">
                      <div className="flex gap-1.5">
                        <Link className="btn-secondary px-2 py-1 text-xs" to={`/matches/${match.id}`}>Ver</Link>
                        <Link className="btn-secondary px-2 py-1 text-xs" to={`/matches/${match.id}/events`}>Eventos</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </section>
  );
};
