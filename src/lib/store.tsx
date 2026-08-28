import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { AppState, Court, Player } from './types'
import { defaultState } from './storage'
import { supabase, STATE_TABLE, STATE_ROW_ID } from './supabaseClient'
import {
  addCourt,
  addPlayer,
  finishGame,
  markUnavailable,
  removeCourt,
  removePlayer,
  requeuePlayerFromCourt,
} from './queueEngine'

const MAX_HISTORY = 25
// Admin PIN lives only in this client bundle, never written to the shared
// Supabase row — so players who inspect network traffic can't read it.
const ADMIN_PIN = '1234'

/** The subset of AppState that's shared live across every device via Supabase. */
interface SyncedState {
  players: Player[]
  courts: Court[]
  brand: string
}

function toSynced(state: AppState): SyncedState {
  return { players: state.players, courts: state.courts, brand: state.brand }
}

interface StoreValue {
  state: AppState
  isAdmin: boolean
  isSynced: boolean
  syncError: string | null
  canUndo: boolean
  error: string | null
  clearError: () => void
  enableAdmin: (pin: string) => boolean
  disableAdmin: () => void
  registerPlayer: (name: string) => void
  removeRegisteredPlayer: (playerId: string) => void
  setPlayerUnavailable: (playerId: string) => void
  requeueFromCourt: (courtId: string, playerId: string) => void
  finishCourtGame: (courtId: string, winningTeam: 'A' | 'B') => void
  addNewCourt: () => void
  removeExistingCourt: (courtId: string) => void
  resetApp: () => void
  undo: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [synced, setSynced] = useState<SyncedState>(() => toSynced(defaultState()))
  const [adminMode, setAdminMode] = useState(false)
  const [isSynced, setIsSynced] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const history = useRef<SyncedState[]>([])
  const [canUndo, setCanUndo] = useState(false)
  const selfWrite = useRef(false)

  // Initial load from Supabase, then subscribe to live changes from every device.
  useEffect(() => {
    let cancelled = false

    async function init() {
      const { data, error: fetchError } = await supabase
        .from(STATE_TABLE)
        .select('data')
        .eq('id', STATE_ROW_ID)
        .single()

      if (cancelled) return

      if (fetchError) {
        setSyncError('Could not connect to live sync. Check your Supabase setup.')
        setIsSynced(true)
        return
      }

      const remote = data?.data as Partial<SyncedState> | null
      if (remote && Array.isArray(remote.players) && Array.isArray(remote.courts)) {
        setSynced({ players: remote.players, courts: remote.courts, brand: remote.brand ?? 'unstckdq' })
      } else {
        // Row exists but is empty (first run) — seed it with a fresh default state.
        const seed = toSynced(defaultState())
        await supabase.from(STATE_TABLE).update({ data: seed }).eq('id', STATE_ROW_ID)
        if (!cancelled) setSynced(seed)
      }
      if (!cancelled) setIsSynced(true)
    }

    init()

    const channel = supabase
      .channel('app_state_live')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: STATE_TABLE, filter: `id=eq.${STATE_ROW_ID}` },
        (payload) => {
          // Skip applying the echo of our own write — we already have it locally.
          if (selfWrite.current) {
            selfWrite.current = false
            return
          }
          const remote = payload.new.data as Partial<SyncedState> | null
          if (remote && Array.isArray(remote.players) && Array.isArray(remote.courts)) {
            setSynced({ players: remote.players, courts: remote.courts, brand: remote.brand ?? 'unstckdq' })
          }
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [])

  const pushRemote = useCallback((next: SyncedState) => {
    selfWrite.current = true
    supabase
      .from(STATE_TABLE)
      .update({ data: next, updated_at: new Date().toISOString() })
      .eq('id', STATE_ROW_ID)
      .then(({ error: writeError }) => {
        if (writeError) {
          selfWrite.current = false
          setSyncError('Could not save — check your connection and try again.')
        }
      })
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const enableAdmin = useCallback((pin: string) => {
    const ok = pin === ADMIN_PIN
    if (ok) setAdminMode(true)
    return ok
  }, [])

  const disableAdmin = useCallback(() => setAdminMode(false), [])

  const requireAdmin = useCallback(() => {
    if (!adminMode) {
      setError('Turn on Admin mode to do that.')
      return false
    }
    return true
  }, [adminMode])

  const commit = useCallback(
    (updater: (prev: AppState) => AppState, options?: { skipHistory?: boolean }) => {
      setSynced((prevSynced) => {
        const prevFull: AppState = { ...prevSynced, adminMode: true, adminPin: ADMIN_PIN }
        const nextFull = updater(prevFull)
        const next = toSynced(nextFull)
        if (JSON.stringify(next) === JSON.stringify(prevSynced)) return prevSynced

        if (!options?.skipHistory) {
          history.current = [...history.current.slice(-(MAX_HISTORY - 1)), prevSynced]
          setCanUndo(true)
        }
        pushRemote(next)
        return next
      })
    },
    [pushRemote],
  )

  const registerPlayer = useCallback(
    (name: string) => {
      if (!requireAdmin()) return
      commit((prev) => {
        const result = addPlayer(prev, name, Date.now())
        if (result.error) {
          setError(result.error)
          return prev
        }
        return result.state
      })
    },
    [commit, requireAdmin],
  )

  const removeRegisteredPlayer = useCallback(
    (playerId: string) => {
      if (!requireAdmin()) return
      commit((prev) => removePlayer(prev, playerId))
    },
    [commit, requireAdmin],
  )

  const setPlayerUnavailable = useCallback(
    (playerId: string) => {
      if (!requireAdmin()) return
      commit((prev) => markUnavailable(prev, playerId))
    },
    [commit, requireAdmin],
  )

  const requeueFromCourt = useCallback(
    (courtId: string, playerId: string) => {
      if (!requireAdmin()) return
      commit((prev) => requeuePlayerFromCourt(prev, courtId, playerId, Date.now()))
    },
    [commit, requireAdmin],
  )

  const finishCourtGame = useCallback(
    (courtId: string, winningTeam: 'A' | 'B') => {
      if (!requireAdmin()) return
      commit((prev) => finishGame(prev, courtId, winningTeam, Date.now()))
    },
    [commit, requireAdmin],
  )

  const addNewCourt = useCallback(() => {
    if (!requireAdmin()) return
    commit((prev) => addCourt(prev, Date.now()))
  }, [commit, requireAdmin])

  const removeExistingCourt = useCallback(
    (courtId: string) => {
      if (!requireAdmin()) return
      commit((prev) => removeCourt(prev, courtId, Date.now()))
    },
    [commit, requireAdmin],
  )

  const resetApp = useCallback(() => {
    if (!requireAdmin()) return
    commit(() => defaultState())
  }, [commit, requireAdmin])

  const undo = useCallback(() => {
    if (!adminMode) {
      setError('Turn on Admin mode to do that.')
      return
    }
    const prevSnapshot = history.current.at(-1)
    if (!prevSnapshot) return
    history.current = history.current.slice(0, -1)
    setCanUndo(history.current.length > 0)
    setSynced(prevSnapshot)
    pushRemote(prevSnapshot)
  }, [adminMode, pushRemote])

  const state: AppState = useMemo(
    () => ({ ...synced, adminMode, adminPin: ADMIN_PIN }),
    [synced, adminMode],
  )

  const value = useMemo<StoreValue>(
    () => ({
      state,
      isAdmin: adminMode,
      isSynced,
      syncError,
      canUndo,
      error,
      clearError,
      enableAdmin,
      disableAdmin,
      registerPlayer,
      removeRegisteredPlayer,
      setPlayerUnavailable,
      requeueFromCourt,
      finishCourtGame,
      addNewCourt,
      removeExistingCourt,
      resetApp,
      undo,
    }),
    [
      state,
      adminMode,
      isSynced,
      syncError,
      canUndo,
      error,
      clearError,
      enableAdmin,
      disableAdmin,
      registerPlayer,
      removeRegisteredPlayer,
      setPlayerUnavailable,
      requeueFromCourt,
      finishCourtGame,
      addNewCourt,
      removeExistingCourt,
      resetApp,
      undo,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
