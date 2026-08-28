import type { AppState, Court, Player } from './types'

const STORAGE_KEY = 'unstckdq:state:v1'
const DEFAULT_PIN = '1234'

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 6)}`
}

export function makePlayerId() {
  return makeId('p')
}

export function makeCourtId() {
  return makeId('c')
}

export function defaultState(): AppState {
  return {
    players: [],
    courts: [
      { id: makeCourtId(), name: 'Court 1', playerIds: [], teamA: [], teamB: [], startedAt: null },
    ],
    adminMode: false,
    adminPin: DEFAULT_PIN,
    brand: 'unstckdq',
  }
}

export function normalizeLoadedState(parsed: Partial<AppState> | null | undefined, currentAdmin: { adminMode: boolean; adminPin: string }): AppState {
  const fallback = defaultState()
  const players = Array.isArray(parsed?.players) ? (parsed!.players as Player[]) : fallback.players
  const courts = Array.isArray(parsed?.courts) && parsed!.courts.length > 0 ? (parsed!.courts as Court[]) : fallback.courts
  return {
    // migrate players saved before wins/losses/lastResult existed
    players: players.map((p) => ({
      ...p,
      wins: typeof p.wins === 'number' ? p.wins : 0,
      losses: typeof p.losses === 'number' ? p.losses : 0,
      lastResult: p.lastResult ?? null,
    })),
    // migrate courts saved before teamA/teamB existed
    courts: courts.map((c) => ({
      ...c,
      teamA: Array.isArray(c.teamA) ? c.teamA : c.playerIds.slice(0, 2),
      teamB: Array.isArray(c.teamB) ? c.teamB : c.playerIds.slice(2, 4),
    })),
    adminMode: currentAdmin.adminMode,
    adminPin: currentAdmin.adminPin,
    brand: 'unstckdq',
  }
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    const fallback = defaultState()
    return normalizeLoadedState(parsed, {
      adminMode: false,
      adminPin: typeof parsed.adminPin === 'string' && parsed.adminPin.length > 0 ? parsed.adminPin : fallback.adminPin,
    })
  } catch {
    return defaultState()
  }
}

export function saveState(state: AppState) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage unavailable (private mode / quota) — silently skip persistence
  }
}
