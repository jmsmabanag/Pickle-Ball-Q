export type PlayerStatus = 'queue' | 'playing' | 'unavailable'
export type LastResult = 'win' | 'loss' | null

export interface Player {
  id: string
  name: string
  status: PlayerStatus
  gamesPlayed: number
  wins: number
  losses: number
  /** result of the player's most recently finished game, used to pair winners with winners and losers with losers */
  lastResult: LastResult
  /** epoch ms when the player joined the queue (used for wait timer) */
  queueSince: number
}

export interface Court {
  id: string
  name: string
  playerIds: string[]
  /** first 2 playerIds in playerIds are Team A, the rest are Team B (only meaningful once playerIds.length === 4) */
  teamA: string[]
  teamB: string[]
  /** epoch ms when the current game started, null if empty */
  startedAt: number | null
}

export interface AppState {
  players: Player[]
  courts: Court[]
  adminMode: boolean
  adminPin: string
  brand: string
}

export const WAIT_TIME_MS = 19 * 60 * 1000
