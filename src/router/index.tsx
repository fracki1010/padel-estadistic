import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/features/stats/pages/DashboardPage';
import { RankingsPage } from '@/features/stats/pages/RankingsPage';
import { StatsPage } from '@/features/stats/pages/StatsPage';
import { PlayersListPage } from '@/features/players/pages/PlayersListPage';
import { PlayerFormPage } from '@/features/players/pages/PlayerFormPage';
import { PlayerDetailPage } from '@/features/players/pages/PlayerDetailPage';
import { MatchesListPage } from '@/features/matches/pages/MatchesListPage';
import { MatchFormPage } from '@/features/matches/pages/MatchFormPage';
import { MatchDetailPage } from '@/features/matches/pages/MatchDetailPage';
import { MatchEventsPage } from '@/features/matches/pages/MatchEventsPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/players', element: <PlayersListPage /> },
      { path: '/players/new', element: <PlayerFormPage mode="create" /> },
      { path: '/players/:id', element: <PlayerDetailPage /> },
      { path: '/players/:id/edit', element: <PlayerFormPage mode="edit" /> },
      { path: '/matches', element: <MatchesListPage /> },
      { path: '/matches/new', element: <MatchFormPage mode="create" /> },
      { path: '/matches/:id', element: <MatchDetailPage /> },
      { path: '/matches/:id/edit', element: <MatchFormPage mode="edit" /> },
      { path: '/matches/:id/events', element: <MatchEventsPage /> },
      { path: '/stats', element: <StatsPage /> },
      { path: '/rankings', element: <RankingsPage /> }
    ]
  }
]);
