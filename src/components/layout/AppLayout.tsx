import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/players', label: 'Jugadores' },
  { to: '/matches', label: 'Partidos' },
  { to: '/stats', label: 'Estadísticas' },
  { to: '/rankings', label: 'Rankings' }
];

export const AppLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-slate-200 bg-slate-900 text-white md:min-h-screen md:border-b-0 md:border-r">
        <div className="px-4 py-4">
          <p className="text-xl font-semibold">Padel Stats</p>
          <p className="text-xs text-slate-300">{user?.email}</p>
        </div>
        <nav className="flex flex-wrap gap-2 p-3 md:block md:space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm ${isActive ? 'bg-brand-600 text-white' : 'text-slate-200 hover:bg-slate-800'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main>
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-600">Gestión y análisis de pádel</p>
          <button className="btn-secondary" onClick={handleLogout}>
            Salir
          </button>
        </header>
        <Outlet />
      </main>
    </div>
  );
};
