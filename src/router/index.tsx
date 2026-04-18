import { Suspense, lazy, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

const LoginPage = lazy(async () => ({ default: (await import('@/features/auth/pages/LoginPage')).LoginPage }));
const DashboardPage = lazy(async () => ({ default: (await import('@/features/stats/pages/DashboardPage')).DashboardPage }));
const RankingsPage = lazy(async () => ({ default: (await import('@/features/stats/pages/RankingsPage')).RankingsPage }));
const StatsPage = lazy(async () => ({ default: (await import('@/features/stats/pages/StatsPage')).StatsPage }));
const PlayersListPage = lazy(async () => ({ default: (await import('@/features/players/pages/PlayersListPage')).PlayersListPage }));
const PlayerFormPage = lazy(async () => ({ default: (await import('@/features/players/pages/PlayerFormPage')).PlayerFormPage }));
const PlayerDetailPage = lazy(async () => ({ default: (await import('@/features/players/pages/PlayerDetailPage')).PlayerDetailPage }));
const MatchesListPage = lazy(async () => ({ default: (await import('@/features/matches/pages/MatchesListPage')).MatchesListPage }));
const MatchFormPage = lazy(async () => ({ default: (await import('@/features/matches/pages/MatchFormPage')).MatchFormPage }));
const MatchDetailPage = lazy(async () => ({ default: (await import('@/features/matches/pages/MatchDetailPage')).MatchDetailPage }));
const MatchEventsPage = lazy(async () => ({ default: (await import('@/features/matches/pages/MatchEventsPage')).MatchEventsPage }));

const withSuspense = (component: ReactNode) => (
  <Suspense fallback={<section className="page-shell text-sm text-slate-400">Cargando vista...</section>}>{component}</Suspense>
);

export const router = createBrowserRouter([
  { path: '/login', element: withSuspense(<LoginPage />) },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: withSuspense(<DashboardPage />) },
      { path: '/players', element: withSuspense(<PlayersListPage />) },
      { path: '/players/new', element: withSuspense(<PlayerFormPage mode="create" />) },
      { path: '/players/:id', element: withSuspense(<PlayerDetailPage />) },
      { path: '/players/:id/edit', element: withSuspense(<PlayerFormPage mode="edit" />) },
      { path: '/matches', element: withSuspense(<MatchesListPage />) },
      { path: '/matches/new', element: withSuspense(<MatchFormPage mode="create" />) },
      { path: '/matches/:id', element: withSuspense(<MatchDetailPage />) },
      { path: '/matches/:id/edit', element: withSuspense(<MatchFormPage mode="edit" />) },
      { path: '/matches/:id/events', element: withSuspense(<MatchEventsPage />) },
      { path: '/stats', element: withSuspense(<StatsPage />) },
      { path: '/rankings', element: withSuspense(<RankingsPage />) }
    ]
  }
]);
