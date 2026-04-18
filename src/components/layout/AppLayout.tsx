import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

const IconDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconPlayers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
    <circle cx="9" cy="7" r="3" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <circle cx="18" cy="8" r="2.5" />
    <path d="M15.5 20c0-2.5 1.8-4.5 4-4.5" />
  </svg>
);

const IconMatches = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3c1.5 2.5 2 5 2 9s-.5 6.5-2 9" />
    <path d="M12 3c-1.5 2.5-2 5-2 9s.5 6.5 2 9" />
    <path d="M3.6 9h16.8M3.6 15h16.8" />
  </svg>
);

const IconStats = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconRankings = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
    <path d="M8 21H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h4" />
    <path d="M14 21h-4V10a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v11z" />
    <path d="M21 21h-4V4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v1" />
  </svg>
);

const IconProfile = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const links = [
  { to: '/dashboard', label: 'Inicio',     Icon: IconDashboard },
  { to: '/players',   label: 'Jugadores',  Icon: IconPlayers   },
  { to: '/matches',   label: 'Partidos',   Icon: IconMatches   },
  { to: '/stats',     label: 'Stats',      Icon: IconStats     },
  { to: '/rankings',  label: 'Rankings',   Icon: IconRankings  },
];

export const AppLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="mx-auto flex h-dvh w-full min-w-0 max-w-screen-sm flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">

      <main
        className="min-h-0 w-full min-w-0 max-w-full flex-1 overflow-y-auto overflow-x-hidden"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <Outlet />
      </main>

      {/* Panel de perfil (se despliega encima del nav) */}
      {profileOpen && (
        <div className="border-t border-slate-700 bg-slate-900 px-5 py-4"
          style={{ paddingLeft: 'max(1.25rem, env(safe-area-inset-left))', paddingRight: 'max(1.25rem, env(safe-area-inset-right))' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-brand-400">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-100">Padel Stats</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-red-700 hover:text-red-400 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      <nav
        className="border-t border-slate-800 bg-slate-950/95 backdrop-blur"
        style={{
          paddingLeft:   'max(0.25rem, env(safe-area-inset-left))',
          paddingRight:  'max(0.25rem, env(safe-area-inset-right))',
          paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="grid w-full grid-cols-6 px-1 py-1">
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setProfileOpen(false)}
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 transition ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-300'
                    : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={isActive ? 'text-brand-400' : ''}><Icon /></span>
                  <span className="block truncate text-[10px] font-medium leading-none">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Tab Perfil */}
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 transition ${
              profileOpen
                ? 'bg-brand-500/15 text-brand-300'
                : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'
            }`}
          >
            <IconProfile />
            <span className="block truncate text-[10px] font-medium leading-none">Perfil</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
