import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FirebaseError } from 'firebase/app';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCreateMatchEvent, useDeleteMatchEvent, useEventsByMatch, useMatch, useUpdateMatch } from '@/features/matches/hooks/useMatches';
import { usePlayers } from '@/features/players/hooks/usePlayers';
import { nowIso } from '@/shared/utils/firestore';
import { CourtZonePicker } from '@/components/ui/CourtMap';
import type { CourtZone, EventType, ShotType, ZoneType } from '@/features/matches/types/matchEvent';
import type { MatchTeam } from '@/features/matches/types/match';

type TeamSide = MatchTeam;
type GuidedStep = 'player' | 'result' | 'action' | 'zone' | 'tozone' | 'target';
type GuidedOutcome = 'won' | 'lost';
type ScoreSlide = 'sets' | 'game' | 'games';

interface QuickAction {
  label: string;
  eventType: EventType;
  shotType: ShotType;
  zone?: ZoneType;
  pointFor: 'player_team' | 'opponent_team';
}

const QUICK_WIN_ACTIONS: QuickAction[] = [
  { label: 'Winner Drive', eventType: 'winner', shotType: 'drive', zone: 'fondo', pointFor: 'player_team' },
  { label: 'Winner Revés', eventType: 'winner', shotType: 'reves', zone: 'fondo', pointFor: 'player_team' },
  { label: 'Volea Ganadora', eventType: 'winner', shotType: 'volea_drive', zone: 'red', pointFor: 'player_team' },
  { label: 'Smash Ganador', eventType: 'winner', shotType: 'smash', zone: 'red', pointFor: 'player_team' },
  { label: 'Bandeja Ganadora', eventType: 'bandeja_ganadora', shotType: 'bandeja', zone: 'red', pointFor: 'player_team' },
  { label: 'Víbora Ganadora', eventType: 'vibora_ganadora', shotType: 'vibora', zone: 'red', pointFor: 'player_team' },
  { label: 'Globo Ganador', eventType: 'globo_ganador', shotType: 'globo', zone: 'fondo', pointFor: 'player_team' },
  { label: 'Passing Shot Drive', eventType: 'passing_shot', shotType: 'drive', zone: 'fondo', pointFor: 'player_team' },
  { label: 'Passing Shot Revés', eventType: 'passing_shot', shotType: 'reves', zone: 'fondo', pointFor: 'player_team' },
  { label: '3x Ganador', eventType: 'x3_ganador', shotType: 'x3', zone: 'fondo', pointFor: 'player_team' },
  { label: '4x Ganador', eventType: 'x4_ganador', shotType: 'x4', zone: 'fondo', pointFor: 'player_team' },
  { label: 'Recuperación', eventType: 'recuperacion_defensiva', shotType: 'salida_de_pared', zone: 'fondo', pointFor: 'player_team' },
  { label: 'Ace', eventType: 'ace', shotType: 'saque', zone: null, pointFor: 'player_team' },
  { label: 'Punto Largo', eventType: 'punto_largo_ganado', shotType: 'otro', zone: 'transicion', pointFor: 'player_team' }
];

const QUICK_ERROR_ACTIONS: QuickAction[] = [
  { label: 'Error No Forzado', eventType: 'error_no_forzado', shotType: 'drive', zone: 'fondo', pointFor: 'opponent_team' },
  { label: 'Error Forzado', eventType: 'error_forzado', shotType: 'drive', zone: 'transicion', pointFor: 'opponent_team' },
  { label: 'Doble Falta', eventType: 'doble_falta', shotType: 'saque', zone: null, pointFor: 'opponent_team' },
  { label: 'Error Volea', eventType: 'error_no_forzado', shotType: 'volea_reves', zone: 'red', pointFor: 'opponent_team' },
  { label: 'Error Smash', eventType: 'error_no_forzado', shotType: 'smash', zone: 'red', pointFor: 'opponent_team' },
  { label: 'Error Globo', eventType: 'error_no_forzado', shotType: 'globo', zone: 'fondo', pointFor: 'opponent_team' },
  { label: 'Doble Toque', eventType: 'doble_toque', shotType: 'otro', zone: null, pointFor: 'opponent_team' }
];

const formatPadelPoints = (pointsA: number, pointsB: number): { a: string; b: string; gameOver: TeamSide | null } => {
  if (pointsA >= 4 || pointsB >= 4) {
    const diff = pointsA - pointsB;
    if (Math.abs(diff) >= 2) {
      return { a: diff > 0 ? 'G' : '40', b: diff < 0 ? 'G' : '40', gameOver: diff > 0 ? 'equipoA' : 'equipoB' };
    }
    if (diff === 1) return { a: 'AD', b: '40', gameOver: null };
    if (diff === -1) return { a: '40', b: 'AD', gameOver: null };
    return { a: '40', b: '40', gameOver: null };
  }

  const map = ['0', '15', '30', '40'];
  return { a: map[Math.min(pointsA, 3)], b: map[Math.min(pointsB, 3)], gameOver: null };
};

export const MatchEventsPage = () => {
  const { id = '' } = useParams();
  const { data: match } = useMatch(id);
  const { data: events } = useEventsByMatch(id);
  const { data: players } = usePlayers(false);
  const createEvent = useCreateMatchEvent(id);
  const deleteEvent = useDeleteMatchEvent(id);
  const updateMatch = useUpdateMatch();

  const hydratedRef = useRef(false);
  const cycleTimeoutRef = useRef<number | null>(null);

  const [setNumber, setSetNumber] = useState(1);
  const [gameNumber, setGameNumber] = useState(1);
  const [pointNumber, setPointNumber] = useState(1);
  const [setsWonTeamA, setSetsWonTeamA] = useState(0);
  const [setsWonTeamB, setSetsWonTeamB] = useState(0);
  const [gamesInSetA, setGamesInSetA] = useState(0);
  const [gamesInSetB, setGamesInSetB] = useState(0);
  const [currentServerPlayerId, setCurrentServerPlayerId] = useState<string | null>(null);

  const [playerId, setPlayerId] = useState('');
  const [guidedStep, setGuidedStep] = useState<GuidedStep>('player');
  const [guidedOutcome, setGuidedOutcome] = useState<GuidedOutcome>('won');
  const [pendingAction, setPendingAction] = useState<QuickAction | null>(null);
  const [courtZone, setCourtZone] = useState<CourtZone | null>(null);
  const [toZone, setToZone] = useState<CourtZone | null>(null);
  const [scoreSlide, setScoreSlide] = useState<ScoreSlide>('game');

  const [saveError, setSaveError] = useState<string | null>(null);
  const [recentFeedback, setRecentFeedback] = useState<string | null>(null);

  const [pendingGameWinner, setPendingGameWinner] = useState<TeamSide | null>(null);
  const [notifiedGameKey, setNotifiedGameKey] = useState<string | null>(null);

  const playerMap = new Map((players ?? []).map((player) => [player.id, `${player.firstName} ${player.lastName}`]));
  const abbr = (pid: string) => (playerMap.get(pid)?.split(' ')[0] ?? '?').slice(0, 3).toUpperCase();
  const scoreLabel = match
    ? `${match.teamA.map(abbr).join('/')} - ${match.teamB.map(abbr).join('/')}`
    : 'A - B';

  const playersInMatch = useMemo(() => {
    if (!match) return [];
    return [...match.teamA, ...match.teamB]
      .map((idPlayer) => players?.find((player) => player.id === idPlayer))
      .filter((player): player is NonNullable<typeof player> => Boolean(player));
  }, [match, players]);

  const teamByPlayer = useMemo(() => {
    if (!match) return new Map<string, TeamSide>();
    return new Map<string, TeamSide>([
      [match.teamA[0], 'equipoA'],
      [match.teamA[1], 'equipoA'],
      [match.teamB[0], 'equipoB'],
      [match.teamB[1], 'equipoB']
    ]);
  }, [match]);

  const selectedPlayerTeam = playerId ? (teamByPlayer.get(playerId) ?? null) : null;
  const selectedPlayerName = playerId ? playerMap.get(playerId) ?? playerId : null;

  const serverRotation = useMemo(() => {
    if (!match) return [] as string[];
    return [match.teamA[0], match.teamB[0], match.teamA[1], match.teamB[1]];
  }, [match]);

  const serverTeam = currentServerPlayerId ? teamByPlayer.get(currentServerPlayerId) ?? null : null;
  const serverPlayerName = currentServerPlayerId ? playerMap.get(currentServerPlayerId) ?? currentServerPlayerId : '-';

  const inferWinningTeam = (playerTeam: TeamSide, pointFor: QuickAction['pointFor']): TeamSide => {
    if (pointFor === 'player_team') return playerTeam;
    return playerTeam === 'equipoA' ? 'equipoB' : 'equipoA';
  };

  const eventsInCurrentGame = (events ?? []).filter(
    (event) => event.setNumber === setNumber && event.gameNumber === gameNumber
  );

  const currentGamePointsA = eventsInCurrentGame.filter((event) => event.winningTeam === 'equipoA').length;
  const currentGamePointsB = eventsInCurrentGame.filter((event) => event.winningTeam === 'equipoB').length;
  const isTieBreak = gamesInSetA === 6 && gamesInSetB === 6;
  const padelPoints = formatPadelPoints(currentGamePointsA, currentGamePointsB);
  const autoGameWinner = !isTieBreak ? padelPoints.gameOver : null;
  const currentGameKey = `${setNumber}-${gameNumber}`;

  const actionUsageBySelectedPlayer = useMemo(() => {
    if (!playerId) return new Map<string, number>();
    return (events ?? [])
      .filter((event) => event.playerId === playerId)
      .reduce((acc, event) => {
        const key = `${event.eventType}|${event.shotType}`;
        acc.set(key, (acc.get(key) ?? 0) + 1);
        return acc;
      }, new Map<string, number>());
  }, [events, playerId]);

  const sortByPlayerUsage = (actions: QuickAction[]) =>
    [...actions].sort((a, b) => {
      const countA = actionUsageBySelectedPlayer.get(`${a.eventType}|${a.shotType}`) ?? 0;
      const countB = actionUsageBySelectedPlayer.get(`${b.eventType}|${b.shotType}`) ?? 0;
      return countB - countA;
    });

  const winActionsSorted = sortByPlayerUsage(QUICK_WIN_ACTIONS);
  const errorActionsSorted = sortByPlayerUsage(QUICK_ERROR_ACTIONS);
  const flowActions = guidedOutcome === 'won' ? winActionsSorted : errorActionsSorted;

  const rotateServerByPlayer = () => {
    if (!serverRotation.length) return;
    if (!currentServerPlayerId || !serverRotation.includes(currentServerPlayerId)) {
      setCurrentServerPlayerId(serverRotation[0]);
      return;
    }
    const currentIndex = serverRotation.indexOf(currentServerPlayerId);
    const nextIndex = (currentIndex + 1) % serverRotation.length;
    setCurrentServerPlayerId(serverRotation[nextIndex]);
  };

  const closeSetAndStartNext = (winnerTeam: TeamSide) => {
    setSetsWonTeamA((prev) => prev + (winnerTeam === 'equipoA' ? 1 : 0));
    setSetsWonTeamB((prev) => prev + (winnerTeam === 'equipoB' ? 1 : 0));
    setSetNumber((prev) => prev + 1);
    setGamesInSetA(0);
    setGamesInSetB(0);
    setGameNumber(1);
    setPointNumber(1);
    rotateServerByPlayer();
  };

  const closeGame = (winnerTeam: TeamSide) => {
    if (isTieBreak) return;

    let nextGamesA = gamesInSetA;
    let nextGamesB = gamesInSetB;

    if (winnerTeam === 'equipoA') nextGamesA += 1;
    else nextGamesB += 1;

    const setFinished = (nextGamesA >= 6 || nextGamesB >= 6) && Math.abs(nextGamesA - nextGamesB) >= 2;

    if (setFinished) {
      closeSetAndStartNext(winnerTeam);
      return;
    }

    setGamesInSetA(nextGamesA);
    setGamesInSetB(nextGamesB);
    setGameNumber((prev) => prev + 1);
    setPointNumber(1);
    rotateServerByPlayer();
  };

  const closeTieBreak = (winnerTeam: TeamSide) => {
    if (!isTieBreak) return;
    setGamesInSetA(winnerTeam === 'equipoA' ? 7 : 6);
    setGamesInSetB(winnerTeam === 'equipoB' ? 7 : 6);
    closeSetAndStartNext(winnerTeam);
  };

  const startGuidedCycle = () => {
    setPlayerId('');
    setGuidedOutcome('won');
    setGuidedStep('player');
    setPendingAction(null);
    setCourtZone(null);
    setToZone(null);
  };

  useEffect(() => {
    if (!match || hydratedRef.current) return;
    hydratedRef.current = true;

    setSetsWonTeamA(match.setsWonTeamA);
    setSetsWonTeamB(match.setsWonTeamB);

    if (match.liveState) {
      setSetNumber(match.liveState.setNumber);
      setGameNumber(match.liveState.gameNumber);
      setPointNumber(match.liveState.pointNumber);
      setGamesInSetA(match.liveState.gamesInSetA);
      setGamesInSetB(match.liveState.gamesInSetB);
      setCurrentServerPlayerId(match.liveState.currentServerPlayerId);
    } else {
      setCurrentServerPlayerId(match.teamA[0] ?? null);
    }
  }, [match]);

  useEffect(() => {
    if (!match || !hydratedRef.current) return;

    const timeoutId = setTimeout(() => {
      updateMatch.mutate({
        id: match.id,
        input: {
          status: 'en_curso',
          setsWonTeamA,
          setsWonTeamB,
          liveState: {
            setNumber,
            gameNumber,
            pointNumber,
            gamesInSetA,
            gamesInSetB,
            currentServerPlayerId,
            updatedAt: nowIso()
          }
        }
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    currentServerPlayerId,
    gameNumber,
    gamesInSetA,
    gamesInSetB,
    match,
    pointNumber,
    setNumber,
    setsWonTeamA,
    setsWonTeamB,
    updateMatch
  ]);

  useEffect(() => {
    if (!autoGameWinner) return;
    if (notifiedGameKey === currentGameKey) return;
    setPendingGameWinner(autoGameWinner);
    setNotifiedGameKey(currentGameKey);
    if ('vibrate' in navigator) navigator.vibrate([120, 80, 120]);
  }, [autoGameWinner, currentGameKey, notifiedGameKey]);

  useEffect(() => {
    setScoreSlide('game');
  }, [setNumber, gameNumber, pointNumber, currentGamePointsA, currentGamePointsB, gamesInSetA, gamesInSetB]);

  useEffect(() => {
    return () => {
      if (cycleTimeoutRef.current !== null) {
        window.clearTimeout(cycleTimeoutRef.current);
      }
    };
  }, []);

  const saveEvent = async (action: QuickAction, targetPlayerId?: string): Promise<boolean> => {
    if (!match || !playerId || !selectedPlayerTeam) return false;

    const winningTeam = inferWinningTeam(selectedPlayerTeam, action.pointFor);

    setSaveError(null);
    try {
      await createEvent.mutateAsync({
        matchId: id,
        timestamp: new Date().toISOString(),
        setNumber,
        gameNumber,
        pointNumber,
        winningTeam,
        playerId,
        eventType: action.eventType,
        shotType: action.shotType,
        zone: action.zone,
        courtZone: courtZone ?? undefined,
        toZone: toZone ?? undefined,
        targetPlayerId,
        notes: ''
      });

      const nextPointsA = currentGamePointsA + (winningTeam === 'equipoA' ? 1 : 0);
      const nextPointsB = currentGamePointsB + (winningTeam === 'equipoB' ? 1 : 0);

      if (isTieBreak) {
        const tieBreakWon = (nextPointsA >= 7 || nextPointsB >= 7) && Math.abs(nextPointsA - nextPointsB) >= 2;
        if (tieBreakWon) {
          closeTieBreak(nextPointsA > nextPointsB ? 'equipoA' : 'equipoB');
        } else {
          setPointNumber((prev) => prev + 1);
        }
      } else {
        setPointNumber((prev) => prev + 1);
      }

      if ('vibrate' in navigator) navigator.vibrate(25);
      setRecentFeedback(`${selectedPlayerName ?? 'Jugador'}: ${action.label}`);

      setPlayerId('');
      setGuidedStep('player');
      setGuidedOutcome('won');
      setPendingAction(null);
      setCourtZone(null);
      setToZone(null);

      if (cycleTimeoutRef.current !== null) {
        window.clearTimeout(cycleTimeoutRef.current);
      }
      cycleTimeoutRef.current = window.setTimeout(() => {
        startGuidedCycle();
      }, 700);

      return true;
    } catch (error) {
      if (error instanceof FirebaseError) {
        setSaveError(`No se pudo guardar el evento: ${error.code}`);
      } else if (error instanceof Error) {
        setSaveError(error.message);
      } else {
        setSaveError('No se pudo guardar el evento');
      }
      return false;
    }
  };

  const undoLast = async () => {
    const last = events?.[events.length - 1];
    if (!last) return;
    await deleteEvent.mutateAsync(last.id);
  };

  const goToPrevScoreSlide = () => {
    setScoreSlide((prev) => {
      if (prev === 'sets') return 'games';
      if (prev === 'game') return 'sets';
      return 'game';
    });
  };

  const goToNextScoreSlide = () => {
    setScoreSlide((prev) => {
      if (prev === 'sets') return 'game';
      if (prev === 'game') return 'games';
      return 'sets';
    });
  };

  if (!match) {
    return <section className="page-shell">Partido no encontrado.</section>;
  }

  return (
    <section className="page-shell box-border flex h-full min-h-0 w-full min-w-0 max-w-full flex-col gap-3 overflow-hidden overflow-x-hidden">
      <div className="min-w-0 shrink-0 space-y-2">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="page-title">Modo Partido</h1>
            <p className="page-subtitle">Pantalla fija, foco total en el punto</p>
          </div>
          <Button variant="secondary" onClick={undoLast} className="shrink-0">
            Deshacer
          </Button>
        </div>

        <Card className="card-body p-3">
          <div className="space-y-2">
            <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-wide text-slate-400">Marcador en vivo</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={goToPrevScoreSlide}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-200"
                    aria-label="Slide anterior"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={goToNextScoreSlide}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-200"
                    aria-label="Siguiente slide"
                  >
                    ›
                  </button>
                </div>
              </div>
              <div className="mt-2 overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
                <div
                  className={`flex w-[300%] transition-transform duration-200 ${
                    scoreSlide === 'sets' ? 'translate-x-0' : scoreSlide === 'game' ? '-translate-x-1/3' : '-translate-x-2/3'
                  }`}
                >
                  <div className="w-1/3 p-2.5 text-center">
                    <p className="text-xs text-slate-400">Sets</p>
                    <p className="text-2xl font-semibold text-slate-100">{setsWonTeamA} - {setsWonTeamB}</p>
                    <p className="text-[10px] text-slate-400">{scoreLabel}</p>
                  </div>
                  <div className="w-1/3 p-2.5 text-center">
                    <p className="text-xs text-slate-400">Juego actual</p>
                    <p className="text-2xl font-semibold text-slate-100">
                      {isTieBreak ? `${currentGamePointsA} - ${currentGamePointsB}` : `${padelPoints.a} - ${padelPoints.b}`}
                    </p>
                    <p className="text-[10px] text-slate-400">{scoreLabel}</p>
                  </div>
                  <div className="w-1/3 p-2.5 text-center">
                    <p className="text-xs text-slate-400">Games del set</p>
                    <p className="text-2xl font-semibold text-slate-100">{gamesInSetA} - {gamesInSetB}</p>
                    <p className="text-[10px] text-slate-400">{scoreLabel}</p>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setScoreSlide('sets')}
                  className={`h-2.5 w-2.5 rounded-full ${scoreSlide === 'sets' ? 'bg-brand-400' : 'bg-slate-600'}`}
                  aria-label="Ver sets"
                />
                <button
                  type="button"
                  onClick={() => setScoreSlide('game')}
                  className={`h-2.5 w-2.5 rounded-full ${scoreSlide === 'game' ? 'bg-brand-400' : 'bg-slate-600'}`}
                  aria-label="Ver juego actual"
                />
                <button
                  type="button"
                  onClick={() => setScoreSlide('games')}
                  className={`h-2.5 w-2.5 rounded-full ${scoreSlide === 'games' ? 'bg-brand-400' : 'bg-slate-600'}`}
                  aria-label="Ver games del set"
                />
              </div>
              <p className="mt-2 break-words text-xs text-slate-400">
                Set {setNumber} · Game {gameNumber} · Punto {pointNumber} · Saca {serverPlayerName} ({serverTeam === 'equipoA' ? 'A' : serverTeam === 'equipoB' ? 'B' : '-'})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={rotateServerByPlayer}>Cambio de saque</Button>
              <Button variant="secondary" onClick={startGuidedCycle}>Nuevo punto</Button>
              {autoGameWinner ? (
                <Button variant="primary" onClick={() => closeGame(autoGameWinner)} className="col-span-2">
                  Cerrar game automático ({autoGameWinner === 'equipoA' ? 'A' : 'B'})
                </Button>
              ) : null}
              {isTieBreak ? (
                <Button
                  variant="primary"
                  onClick={() => closeTieBreak(currentGamePointsA > currentGamePointsB ? 'equipoA' : 'equipoB')}
                  className="col-span-2"
                  disabled={currentGamePointsA === currentGamePointsB}
                >
                  Cerrar tie-break
                </Button>
              ) : null}
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-900 p-2.5">
              <p className="text-xs uppercase tracking-wide text-slate-400">Estado del ciclo</p>
              <p className="mt-1 text-xs text-slate-200">
                {guidedStep === 'player'  ? '1) Selecciona jugador'
                  : guidedStep === 'result' ? `2) ${selectedPlayerName ?? '-'}: ¿ganó o perdió?`
                  : guidedStep === 'action' ? `3) Acción de ${selectedPlayerName ?? '-'}`
                  : guidedStep === 'zone'   ? `4) ¿Desde dónde?`
                  : guidedStep === 'tozone' ? `5) ¿A qué zona fue?`
                  :                          `6) ¿A quién iba dirigido?`}
              </p>
              {recentFeedback ? <p className="mt-1 text-xs text-brand-300">Último: {recentFeedback}</p> : null}
              {saveError ? <p className="mt-1 text-xs text-red-300">{saveError}</p> : null}
            </div>
          </div>
        </Card>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden rounded-xl border border-slate-700 bg-slate-950/98 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="flex h-full w-full min-h-0 min-w-0 flex-col">
          {guidedStep === 'player' ? (
            <div className="flex h-full w-full min-h-0 flex-col gap-2">
              <p className="text-center text-base font-semibold text-slate-100">Paso 1: Jugador</p>
              <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-2 sm:grid-cols-4">
                {playersInMatch.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => {
                      setPlayerId(player.id);
                      setGuidedStep('result');
                    }}
                    className="h-full min-w-0 rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-center text-base hover:border-brand-500"
                  >
                    <p className="break-words font-semibold text-slate-100">{player.firstName} {player.lastName}</p>
                    <p className="text-xs text-slate-400">{teamByPlayer.get(player.id) === 'equipoA' ? 'Equipo A' : 'Equipo B'}</p>
                    {player.preferredSide !== 'indistinto' && (
                      <p className={`mt-0.5 text-xs font-medium ${player.preferredSide === 'drive' ? 'text-sky-400' : 'text-violet-400'}`}>
                        {player.preferredSide === 'drive' ? 'Drive' : 'Revés'}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {guidedStep === 'result' ? (
            <div className="flex h-full w-full min-h-0 flex-col gap-2">
              <p className="text-center text-base font-semibold text-slate-100">Paso 2: Resultado del punto</p>
              <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGuidedOutcome('won');
                    setGuidedStep('action');
                  }}
                  className="h-full min-w-0 rounded-lg border border-emerald-700 bg-emerald-950 px-3 py-4 text-center text-base font-semibold text-emerald-200"
                >
                  <span className="flex h-full flex-col items-center justify-center gap-2">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-900/80">
                      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span className="break-words">{selectedPlayerName}: ganó</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGuidedOutcome('lost');
                    setGuidedStep('action');
                  }}
                  className="h-full min-w-0 rounded-lg border border-red-700 bg-red-950 px-3 py-4 text-center text-base font-semibold text-red-200"
                >
                  <span className="flex h-full flex-col items-center justify-center gap-2">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-900/80">
                      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m18 6-12 12M6 6l12 12" />
                      </svg>
                    </span>
                    <span className="break-words">{selectedPlayerName}: perdió</span>
                  </span>
                </button>
              </div>
              <div>
                <Button variant="secondary" className="w-full" onClick={() => setGuidedStep('player')}>
                  Volver a jugador
                </Button>
              </div>
            </div>
          ) : null}

          {guidedStep === 'action' ? (
            <div className="flex h-full w-full min-h-0 flex-col gap-2">
              <p className="text-center text-base font-semibold text-slate-100">
                Paso 3: Acción ({guidedOutcome === 'won' ? 'punto ganado' : 'punto perdido'})
              </p>
              <div className="grid min-h-0 min-w-0 flex-1 grid-cols-2 gap-2 overflow-y-auto overflow-x-hidden">
                {flowActions.map((action) => (
                  <button
                    key={`${guidedOutcome}-${action.label}`}
                    type="button"
                    onClick={() => {
                      setPendingAction(action);
                      setGuidedStep('zone');
                    }}
                    disabled={createEvent.isPending}
                    className={`h-full min-w-0 rounded-lg border px-3 py-3 text-center text-base font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                      guidedOutcome === 'won'
                        ? 'border-emerald-700 bg-emerald-950 text-emerald-200'
                        : 'border-red-700 bg-red-950 text-red-200'
                    }`}
                  >
                    <span className="break-words">{action.label}</span>
                  </button>
                ))}
              </div>
              <div>
                <Button variant="secondary" className="w-full" onClick={() => setGuidedStep('result')}>
                  Volver a resultado
                </Button>
              </div>
            </div>
          ) : null}

          {guidedStep === 'zone' ? (
            <div className="flex h-full w-full min-h-0 flex-col gap-2">
              <p className="text-center text-base font-semibold text-slate-100">
                Paso 4: ¿Desde dónde? <span className="text-sm font-normal text-slate-400">({pendingAction?.label})</span>
              </p>
              <div className="flex-1 min-h-0 flex items-center justify-center px-2">
                <CourtZonePicker
                  flip
                  selected={courtZone}
                  onSelect={(z) => {
                    setCourtZone(z);
                    setGuidedStep('tozone');
                  }}
                />
              </div>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => { setCourtZone(null); setGuidedStep('tozone'); }}
              >
                Omitir (sin zona)
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => { setGuidedStep('action'); setPendingAction(null); }}>
                Volver a acción
              </Button>
            </div>
          ) : null}

          {guidedStep === 'tozone' ? (
            <div className="flex h-full w-full min-h-0 flex-col gap-2">
              <p className="text-center text-base font-semibold text-slate-100">
                Paso 5: ¿A qué zona fue? <span className="text-sm font-normal text-slate-400">(cancha rival)</span>
              </p>
              <div className="flex-1 min-h-0 flex items-center justify-center px-2">
                <CourtZonePicker
                  selected={toZone}
                  onSelect={(z) => {
                    setToZone(z);
                    setGuidedStep('target');
                  }}
                />
              </div>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => { setToZone(null); setGuidedStep('target'); }}
              >
                Omitir (sin destino)
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => setGuidedStep('zone')}>
                Volver a origen
              </Button>
            </div>
          ) : null}

          {guidedStep === 'target' ? (
            <div className="flex h-full w-full min-h-0 flex-col gap-2">
              <p className="text-center text-base font-semibold text-slate-100">
                Paso 6: ¿A quién iba dirigido?
              </p>
              <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-2">
                {playersInMatch
                  .filter((p) => teamByPlayer.get(p.id) !== selectedPlayerTeam)
                  .map((opponent) => (
                    <button
                      key={opponent.id}
                      type="button"
                      onClick={() => {
                        if (pendingAction) void saveEvent(pendingAction, opponent.id);
                      }}
                      disabled={createEvent.isPending}
                      className="h-full min-w-0 rounded-lg border border-slate-600 bg-slate-900 px-3 py-3 text-center text-base font-medium text-slate-200 hover:border-brand-500 disabled:opacity-60"
                    >
                      <p className="break-words font-semibold">{opponent.firstName} {opponent.lastName}</p>
                      <p className="text-xs text-slate-400">{teamByPlayer.get(opponent.id) === 'equipoA' ? 'Equipo A' : 'Equipo B'}</p>
                    </button>
                  ))}
              </div>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => { if (pendingAction) void saveEvent(pendingAction); }}
                disabled={createEvent.isPending}
              >
                Omitir (sin target)
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => setGuidedStep('tozone')}>
                Volver a destino
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {pendingGameWinner ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
            <p className="text-xs uppercase tracking-wide text-amber-300">Game finalizado</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-100">
              Ganó {pendingGameWinner === 'equipoA' ? 'Equipo A' : 'Equipo B'}
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              ¿Quieres cerrar el game y avanzar al siguiente?
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setPendingGameWinner(null)}>
                Revisar
              </Button>
              <Button
                onClick={() => {
                  closeGame(pendingGameWinner);
                  setPendingGameWinner(null);
                }}
              >
                Cerrar game
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};
