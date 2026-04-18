import type { Match } from '@/features/matches/types/match';
import type { MatchEvent } from '@/features/matches/types/matchEvent';
import type { Player } from '@/features/players/types/player';
import type { DashboardStats, MatchStats, PlayerStats, Rankings } from '@/features/stats/types/stats';

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
  const winners = eventCounter(playerEvents, (event) => event.eventType === 'winner');
  const unforcedErrors = eventCounter(playerEvents, (event) => event.eventType === 'error_no_forzado');
  const forcedErrors = eventCounter(playerEvents, (event) => event.eventType === 'error_forzado');
  const aces = eventCounter(playerEvents, (event) => event.eventType === 'ace');
  const doubleFaults = eventCounter(playerEvents, (event) => event.eventType === 'doble_falta');
  const netWinners = eventCounter(playerEvents, (event) => event.eventType === 'winner' && event.zone === 'red');
  const baselineWinners = eventCounter(playerEvents, (event) => event.eventType === 'winner' && event.zone === 'fondo');
  const totalEvents = playerEvents.length;

  return {
    playerId,
    matchesPlayed,
    matchesWon,
    matchesLost,
    winRate: matchesPlayed ? (matchesWon / matchesPlayed) * 100 : 0,
    totalEvents,
    winners,
    unforcedErrors,
    forcedErrors,
    aces,
    doubleFaults,
    netWinners,
    baselineWinners,
    winnersRate: totalEvents ? (winners / totalEvents) * 100 : 0,
    unforcedErrorRate: totalEvents ? (unforcedErrors / totalEvents) * 100 : 0,
    winnersMinusUnforcedErrors: winners - unforcedErrors
  };
};

export const getMatchStats = (events: MatchEvent[], match: Match): MatchStats => {
  const matchEvents = events.filter((event) => event.matchId === match.id);

  const winnersByPlayer = matchEvents.reduce<Record<string, number>>((acc, event) => {
    if (event.eventType === 'winner') acc[event.playerId] = (acc[event.playerId] || 0) + 1;
    return acc;
  }, {});

  const errorsByPlayer = matchEvents.reduce<Record<string, number>>((acc, event) => {
    if (event.eventType === 'error_no_forzado') acc[event.playerId] = (acc[event.playerId] || 0) + 1;
    return acc;
  }, {});

  const teamAWinners = matchEvents.filter(
    (event) => event.eventType === 'winner' && event.winningTeam === 'equipoA'
  ).length;
  const teamBWinners = matchEvents.filter(
    (event) => event.eventType === 'winner' && event.winningTeam === 'equipoB'
  ).length;

  return {
    totalEvents: matchEvents.length,
    winnersByPlayer,
    errorsByPlayer,
    teamAWinners,
    teamBWinners,
    topWinnerPlayerId: topByRecord(winnersByPlayer),
    topUnforcedErrorsPlayerId: topByRecord(errorsByPlayer)
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
