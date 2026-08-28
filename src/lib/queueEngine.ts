import type { AppState, Court, Player } from './types'
import { makeCourtId, makePlayerId } from './storage'

export function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

export function isDuplicateName(players: Player[], name: string, excludeId?: string) {
  const normalized = normalizeName(name).toLowerCase()
  return players.some(
    (p) => p.id !== excludeId && p.status !== 'unavailable' && p.name.toLowerCase() === normalized,
  )
}

function byQueueSince(a: Player, b: Player) {
  return a.queueSince - b.queueSince
}

/**
 * Splits 4 players (already chosen in strict FIFO order) into two teams of 2,
 * grouping same lastResult together where possible (winners with winners,
 * losers with losers) without changing who gets to play — only how the
 * chosen four are paired up.
 */
function splitIntoTeams(four: Player[]): { teamA: Player[]; teamB: Player[] } {
  const groups: Record<string, Player[]> = { win: [], loss: [], none: [] }
  for (const p of four) {
    groups[p.lastResult ?? 'none'].push(p)
  }
  // Order groups largest-first so same-result players land next to each other,
  // then just split that ordering down the middle into two teams of 2.
  const ordered = [...Object.values(groups)]
    .sort((a, b) => b.length - a.length)
    .flat()
  return { teamA: ordered.slice(0, 2), teamB: ordered.slice(2, 4) }
}

/**
 * Picks the next 4 players for a court in strict first-in-first-out order —
 * whoever has waited longest plays next, no skipping ahead. Every player
 * must cycle through the whole queue before they can be picked again.
 */
function pickFourForCourt(queued: Player[]): Player[] | null {
  if (queued.length < 4) return null
  return [...queued].sort(byQueueSince).slice(0, 4)
}

/** Fills any empty courts with queued players, matching winners vs winners and losers vs losers where possible. */
export function autoAssignCourts(state: AppState, now: number): AppState {
  let players = state.players
  let courts = state.courts

  const emptyCourts = courts.filter((c) => c.playerIds.length === 0)
  if (emptyCourts.length === 0) return { ...state, players, courts }

  let pool = players.filter((p) => p.status === 'queue')
  const nextCourts: Court[] = [...courts]
  let nextPlayers = [...players]

  for (const court of emptyCourts) {
    const chosen = pickFourForCourt(pool)
    if (!chosen) break
    const chosenIds = new Set(chosen.map((p) => p.id))
    pool = pool.filter((p) => !chosenIds.has(p.id))
    nextPlayers = nextPlayers.map((p) =>
      chosenIds.has(p.id) ? { ...p, status: 'playing' as const } : p,
    )
    const idx = nextCourts.findIndex((c) => c.id === court.id)
    const { teamA, teamB } = splitIntoTeams(chosen)
    nextCourts[idx] = {
      ...court,
      playerIds: chosen.map((p) => p.id),
      teamA: teamA.map((p) => p.id),
      teamB: teamB.map((p) => p.id),
      startedAt: now,
    }
  }

  players = nextPlayers
  courts = nextCourts

  return { ...state, players, courts }
}

/**
 * Backfills a single empty seat on a court (used after an admin pulls one
 * player out mid-game) with the next player waiting in the queue, without
 * touching any other court. Keeps team assignment consistent.
 */
function backfillSeat(state: AppState, courtId: string, now: number): AppState {
  const court = state.courts.find((c) => c.id === courtId)
  if (!court || court.playerIds.length === 0 || court.playerIds.length >= 4) return state

  const queued = state.players.filter((p) => p.status === 'queue').sort(byQueueSince)
  if (queued.length === 0) return state
  const next = queued[0]

  const players = state.players.map((p) => (p.id === next.id ? { ...p, status: 'playing' as const } : p))
  const playerIds = [...court.playerIds, next.id]
  const teamAWasShort = court.teamA.length < 2
  const teamA = teamAWasShort ? [...court.teamA, next.id] : court.teamA
  const teamB = teamAWasShort ? court.teamB : [...court.teamB, next.id]
  const courts = state.courts.map((c) => (c.id === courtId ? { ...c, playerIds, teamA, teamB } : c))

  return { ...state, players, courts }
}

export function addPlayer(state: AppState, name: string, now: number): { state: AppState; error?: string } {
  const clean = normalizeName(name)
  if (!clean) return { state, error: 'Enter a player name.' }
  if (isDuplicateName(state.players, clean)) {
    return { state, error: `"${clean}" is already registered.` }
  }
  const player: Player = {
    id: makePlayerId(),
    name: clean,
    status: 'queue',
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    lastResult: null,
    queueSince: now,
  }
  const withPlayer: AppState = { ...state, players: [...state.players, player] }
  return { state: autoAssignCourts(withPlayer, now) }
}

export function removePlayer(state: AppState, playerId: string): AppState {
  const players = state.players.filter((p) => p.id !== playerId)
  const courts = state.courts.map((c) => ({
    ...c,
    playerIds: c.playerIds.filter((id) => id !== playerId),
    teamA: c.teamA.filter((id) => id !== playerId),
    teamB: c.teamB.filter((id) => id !== playerId),
  }))
  return { ...state, players, courts }
}

/** Player becomes unavailable: pulled off a court or out of the queue entirely (no backfill mid-game). */
export function markUnavailable(state: AppState, playerId: string): AppState {
  const players = state.players.map((p) =>
    p.id === playerId ? { ...p, status: 'unavailable' as const } : p,
  )
  const courts = state.courts.map((c) => ({
    ...c,
    playerIds: c.playerIds.filter((id) => id !== playerId),
    teamA: c.teamA.filter((id) => id !== playerId),
    teamB: c.teamB.filter((id) => id !== playerId),
  }))
  return { ...state, players, courts }
}

/**
 * Admin pulls one player off an in-progress court. That player goes back to
 * the end of the queue (not removed from the app), and the system
 * immediately pulls whoever is next in the queue into the freed seat so the
 * game can keep going.
 */
export function requeuePlayerFromCourt(state: AppState, courtId: string, playerId: string, now: number): AppState {
  const court = state.courts.find((c) => c.id === courtId)
  if (!court || !court.playerIds.includes(playerId)) return state

  const players = state.players.map((p) =>
    p.id === playerId ? { ...p, status: 'queue' as const, queueSince: now } : p,
  )
  const courts = state.courts.map((c) =>
    c.id === courtId
      ? {
          ...c,
          playerIds: c.playerIds.filter((id) => id !== playerId),
          teamA: c.teamA.filter((id) => id !== playerId),
          teamB: c.teamB.filter((id) => id !== playerId),
        }
      : c,
  )

  return backfillSeat({ ...state, players, courts }, courtId, now)
}

/** Finish a game, recording which team won. Winners and losers both head back to the queue and are tagged for next-round matchmaking. */
export function finishGame(state: AppState, courtId: string, winningTeam: 'A' | 'B', now: number): AppState {
  const court = state.courts.find((c) => c.id === courtId)
  if (!court || court.playerIds.length === 0) return state

  const winnerIds = new Set(winningTeam === 'A' ? court.teamA : court.teamB)
  const finishedIds = new Set(court.playerIds)

  let players = state.players.map((p) => {
    if (!finishedIds.has(p.id)) return p
    const won = winnerIds.has(p.id)
    return {
      ...p,
      status: 'queue' as const,
      gamesPlayed: p.gamesPlayed + 1,
      wins: p.wins + (won ? 1 : 0),
      losses: p.losses + (won ? 0 : 1),
      lastResult: (won ? 'win' : 'loss') as const,
      queueSince: now,
    }
  })
  const courts = state.courts.map((c) =>
    c.id === courtId ? { ...c, playerIds: [], teamA: [], teamB: [], startedAt: null } : c,
  )

  return autoAssignCourts({ ...state, players, courts }, now)
}

export function addCourt(state: AppState, now: number): AppState {
  const court: Court = {
    id: makeCourtId(),
    name: `Court ${state.courts.length + 1}`,
    playerIds: [],
    teamA: [],
    teamB: [],
    startedAt: null,
  }
  return autoAssignCourts({ ...state, courts: [...state.courts, court] }, now)
}

export function removeCourt(state: AppState, courtId: string, now: number): AppState {
  const court = state.courts.find((c) => c.id === courtId)
  if (!court) return state
  const playingIds = new Set(court.playerIds)
  const players = state.players.map((p) =>
    playingIds.has(p.id) ? { ...p, status: 'queue' as const, queueSince: now } : p,
  )
  const courts = state.courts.filter((c) => c.id !== courtId)
  return autoAssignCourts({ ...state, players, courts }, now)
}
