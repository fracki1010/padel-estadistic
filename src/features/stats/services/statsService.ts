import type { Match } from '@/features/matches/types/match';
import type { EventType, MatchEvent } from '@/features/matches/types/matchEvent';
import type { Player } from '@/features/players/types/player';
import type { DashboardStats, MatchStats, PlayerMatchStats, PlayerStats, Rankings } from '@/features/stats/types/stats';

// Todos los tipos de evento que cuentan como golpe ganador en estadísticas.
// ace se contabiliza por separado; doble_falta/errores no cuentan como winners.
const WINNING_EVENT_TYPES = new Set<EventType>([
  'winner',
  'bandeja_ganadora',
  'vibora_ganadora',
  'globo_ganador',
  'passing_shot',
  'x3_ganador',
  'x4_ganador',
  'recuperacion_defensiva',
  'punto_largo_ganado'
]);

const isWinner = (event: MatchEvent) => WINNING_EVENT_TYPES.has(event.eventType);

const eventCounter = (events: MatchEvent[], predicate: (event: MatchEvent) => boolean) =>
  events.reduce((acc, event) => (predicate(event) ? acc + 1 : acc), 0);

const topByRecord = (record: Record<string, number>, order: 'desc' | 'asc' = 'desc'): string | null => {
  const entries = Object.entries(record);
  if (!entries.length) return null;
  entries.sort((a, b) => (order === 'desc' ? b[1] - a[1] : a[1] - b[1]));
  return entries[0][0];
};

const getMatchWinnerBySets = (match: Match): 'equipoA' | 'equipoB' | null => {
  if (match.winner) return match.winner;
  if (match.setsWonTeamA === match.setsWonTeamB) return null;
  return match.setsWonTeamA > match.setsWonTeamB ? 'equipoA' : 'equipoB';
};

export const getPlayerStats = (events: MatchEvent[], matches: Match[], playerId: string): PlayerStats => {
  const playerMatches = matches.filter((match) => [...match.teamA, ...match.teamB].includes(playerId));
  const playedMatchIds = new Set(playerMatches.map((match) => match.id));
  const playerEvents = events.filter((event) => event.playerId === playerId && playedMatchIds.has(event.matchId));

  const matchesWon = playerMatches.filter((match) => {
    const winner = getMatchWinnerBySets(match);
    return winner === 'equipoA' ? match.teamA.includes(playerId) : winner === 'equipoB' ? match.teamB.includes(playerId) : false;
  }).length;

  const matchesPlayed = playerMatches.length;
  const matchesLost = Math.max(matchesPlayed - matchesWon, 0);
  const winners = eventCounter(playerEvents, isWinner);
  const unforcedErrors = eventCounter(playerEvents, (e) => e.eventType === 'error_no_forzado');
  const forcedErrors = eventCounter(playerEvents, (e) => e.eventType === 'error_forzado');
  const aces = eventCounter(playerEvents, (e) => e.eventType === 'ace');
  const doubleFaults = eventCounter(playerEvents, (e) => e.eventType === 'doble_falta');
  const doubleTouches = eventCounter(playerEvents, (e) => e.eventType === 'doble_toque');
  const netWinners = eventCounter(playerEvents, (e) => isWinner(e) && e.zone === 'red');
  const baselineWinners = eventCounter(playerEvents, (e) => isWinner(e) && e.zone === 'fondo');
  const bandejas = eventCounter(playerEvents, (e) => e.eventType === 'bandeja_ganadora');
  const viboras = eventCounter(playerEvents, (e) => e.eventType === 'vibora_ganadora');
  const globos = eventCounter(playerEvents, (e) => e.eventType === 'globo_ganador');
  const passingShotsWon = eventCounter(playerEvents, (e) => e.eventType === 'passing_shot');
  const x3Winners = eventCounter(playerEvents, (e) => e.eventType === 'x3_ganador');
  const x4Winners = eventCounter(playerEvents, (e) => e.eventType === 'x4_ganador');
  const recuperaciones = eventCounter(playerEvents, (e) => e.eventType === 'recuperacion_defensiva');
  const totalEvents = playerEvents.length;

  return {
    playerId,
    matchesPlayed,
    matchesWon,
    matchesLost,
    winRate: matchesPlayed ? (matchesWon / matchesPlayed) * 100 : 0,
    totalEvents,
    winners,
    netWinners,
    baselineWinners,
    bandejas,
    viboras,
    globos,
    passingShotsWon,
    x3Winners,
    x4Winners,
    recuperaciones,
    aces,
    doubleFaults,
    unforcedErrors,
    forcedErrors,
    doubleTouches,
    winnersRate: totalEvents ? (winners / totalEvents) * 100 : 0,
    unforcedErrorRate: totalEvents ? (unforcedErrors / totalEvents) * 100 : 0,
    winnersMinusUnforcedErrors: winners - unforcedErrors
  };
};

const buildTeamStats = (events: MatchEvent[], team: 'equipoA' | 'equipoB') => {
  const teamEvents = events.filter((e) => {
    const isTeamPlayer = team === 'equipoA'
      ? ['teamA_p1', 'teamA_p2'].includes(e.playerId) // se filtra por winningTeam abajo
      : false;
    return isTeamPlayer;
  });
  // Usamos winningTeam para errores propios y players del equipo para winners
  const byWinningTeam = events.filter((e) => e.winningTeam === team);
  const byLosingTeam = events.filter((e) => e.winningTeam !== team);

  const winners = byWinningTeam.filter(isWinner).length;
  const aces = events.filter((e) => e.eventType === 'ace' && e.winningTeam === team).length;
  // errores propios: el punto se lo lleva el equipo contrario, y el evento es del jugador de este equipo
  // En el sistema actual, los errores se registran en el jugador que erró, con winningTeam = equipo contrario
  const unforcedErrors = byLosingTeam.filter((e) => e.eventType === 'error_no_forzado').length;
  const forcedErrors = byLosingTeam.filter((e) => e.eventType === 'error_forzado').length;
  const doubleFaults = byLosingTeam.filter((e) => e.eventType === 'doble_falta').length;

  void teamEvents; // no usado directamente
  return { winners, aces, doubleFaults, unforcedErrors, forcedErrors, balance: winners - unforcedErrors };
};

export const getMatchStats = (events: MatchEvent[], match: Match): MatchStats => {
  const matchEvents = events.filter((e) => e.matchId === match.id);

  const winnersByPlayer = matchEvents.reduce<Record<string, number>>((acc, e) => {
    if (isWinner(e)) acc[e.playerId] = (acc[e.playerId] || 0) + 1;
    return acc;
  }, {});

  const errorsByPlayer = matchEvents.reduce<Record<string, number>>((acc, e) => {
    if (e.eventType === 'error_no_forzado') acc[e.playerId] = (acc[e.playerId] || 0) + 1;
    return acc;
  }, {});

  const targetedByPlayer = matchEvents.reduce<Record<string, number>>((acc, e) => {
    if (e.targetPlayerId) acc[e.targetPlayerId] = (acc[e.targetPlayerId] || 0) + 1;
    return acc;
  }, {});

  const allPlayers = [...match.teamA, ...match.teamB];
  const playerBreakdown = Object.fromEntries(
    allPlayers.map((pid): [string, PlayerMatchStats] => {
      const pe = matchEvents.filter((e) => e.playerId === pid);
      return [pid, {
        winners:        pe.filter(isWinner).length,
        unforcedErrors: pe.filter((e) => e.eventType === 'error_no_forzado').length,
        forcedErrors:   pe.filter((e) => e.eventType === 'error_forzado').length,
        aces:           pe.filter((e) => e.eventType === 'ace').length,
        doubleFaults:   pe.filter((e) => e.eventType === 'doble_falta').length,
        bandejas:       pe.filter((e) => e.eventType === 'bandeja_ganadora').length,
        viboras:        pe.filter((e) => e.eventType === 'vibora_ganadora').length,
        globos:         pe.filter((e) => e.eventType === 'globo_ganador').length,
        passingShotsWon:pe.filter((e) => e.eventType === 'passing_shot').length,
        x3Winners:      pe.filter((e) => e.eventType === 'x3_ganador').length,
        x4Winners:      pe.filter((e) => e.eventType === 'x4_ganador').length,
        totalEvents:    pe.length,
      }];
    })
  );

  const teamAWinners = matchEvents.filter((e) => isWinner(e) && e.winningTeam === 'equipoA').length;
  const teamBWinners = matchEvents.filter((e) => isWinner(e) && e.winningTeam === 'equipoB').length;

  const teamAEvents = matchEvents.filter((e) => match.teamA.includes(e.playerId));
  const teamBEvents = matchEvents.filter((e) => match.teamB.includes(e.playerId));

  const buildTeam = (ownEvents: MatchEvent[], ownSide: 'equipoA' | 'equipoB'): import('@/features/stats/types/stats').TeamStats => {
    const rivalSide = ownSide === 'equipoA' ? 'equipoB' : 'equipoA';
    return {
      winners: matchEvents.filter((e) => isWinner(e) && e.winningTeam === ownSide).length,
      aces: ownEvents.filter((e) => e.eventType === 'ace').length,
      doubleFaults: ownEvents.filter((e) => e.eventType === 'doble_falta').length,
      unforcedErrors: ownEvents.filter((e) => e.eventType === 'error_no_forzado').length,
      forcedErrors: ownEvents.filter((e) => e.eventType === 'error_forzado').length,
      balance: matchEvents.filter((e) => isWinner(e) && e.winningTeam === ownSide).length
              - ownEvents.filter((e) => e.eventType === 'error_no_forzado').length,
    };
    void rivalSide;
  };

  return {
    totalEvents: matchEvents.length,
    winnersByPlayer,
    errorsByPlayer,
    targetedByPlayer,
    playerBreakdown,
    teamA: buildTeam(teamAEvents, 'equipoA'),
    teamB: buildTeam(teamBEvents, 'equipoB'),
    teamAWinners,
    teamBWinners,
    topWinnerPlayerId: topByRecord(winnersByPlayer),
    topUnforcedErrorsPlayerId: topByRecord(errorsByPlayer),
    topTargetedPlayerId: topByRecord(targetedByPlayer)
  };
};

export const getRankings = (players: Player[], matches: Match[], events: MatchEvent[]): Rankings => {
  const stats = players.map((player) => getPlayerStats(events, matches, player.id));

  const by = (selector: (item: PlayerStats) => number, asc = false) =>
    stats
      .map((item) => ({ playerId: item.playerId, value: selector(item) }))
      .sort((a, b) => (asc ? a.value - b.value : b.value - a.value));

  return {
    byWins: by((item) => item.matchesWon),
    byWinRate: by((item) => item.winRate),
    byWinners: by((item) => item.winners),
    byLessUnforcedErrors: by((item) => item.unforcedErrors, true),
    byBalance: by((item) => item.winnersMinusUnforcedErrors),
    byAces: by((item) => item.aces)
  };
};

export const getDashboardStats = (players: Player[], matches: Match[], events: MatchEvent[]): DashboardStats => {
  const activePlayers = players.filter((player) => player.active).length;
  const totalMatches = matches.length;
  const totalEvents = events.length;

  const stats = players.map((player) => getPlayerStats(events, matches, player.id));
  const bestWinRatePlayerId = stats.sort((a, b) => b.winRate - a.winRate)[0]?.playerId ?? null;

  const matchesByMonthRecord = matches.reduce<Record<string, number>>((acc, match) => {
    const d = new Date(match.date);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const matchesByMonth = Object.entries(matchesByMonthRecord)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => (a.month > b.month ? 1 : -1));

  const winnersByPlayer = stats.map((item) => ({ playerId: item.playerId, value: item.winners }));
  const unforcedErrorsByPlayer = stats.map((item) => ({ playerId: item.playerId, value: item.unforcedErrors }));

  return {
    activePlayers,
    totalMatches,
    totalEvents,
    bestWinRatePlayerId,
    matchesByMonth,
    winnersByPlayer,
    unforcedErrorsByPlayer,
    recentMatches: [...matches].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5)
  };
};
