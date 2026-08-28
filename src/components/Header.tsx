import { useRef, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { RotateCcw, Shield, Undo2, WifiOff } from 'lucide-react'
import Logo from './Logo'
import AdminPinModal from './AdminPinModal'
import ConfirmDialog from './ConfirmDialog'
import { useStore } from '../lib/store'

const SECRET_TAPS = 5
const TAP_WINDOW_MS = 2000

export default function Header() {
  const { isAdmin, disableAdmin, canUndo, undo, resetApp, isSynced, syncError } = useStore()
  const [showPin, setShowPin] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const tapCount = useRef(0)
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleLogoTap() {
    if (isAdmin) return
    tapCount.current += 1
    if (tapTimer.current) clearTimeout(tapTimer.current)
    if (tapCount.current >= SECRET_TAPS) {
      tapCount.current = 0
      setShowPin(true)
      return
    }
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0
    }, TAP_WINDOW_MS)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={handleLogoTap} aria-label="unstckdq" className="cursor-default">
            <Logo />
          </button>
          {syncError ? (
            <span
              className="flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-500 dark:bg-rose-500/10"
              title={syncError}
            >
              <WifiOff className="h-3 w-3" /> Offline
            </span>
          ) : (
            isSynced && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-500 dark:bg-emerald-500/10">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
              </span>
            )
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={undo}
                disabled={!canUndo}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition active:scale-95 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                aria-label="Undo last action"
              >
                <Undo2 className="h-4 w-4" />
                <span className="hidden sm:inline">Undo</span>
              </button>
              <button
                onClick={() => setShowReset(true)}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition active:scale-95 dark:border-slate-700 dark:text-slate-300"
                aria-label="Reset app"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <button
                onClick={disableAdmin}
                className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition active:scale-95"
              >
                <Shield className="h-4 w-4" />
                <span>Admin On</span>
              </button>
            </>
          )}
        </div>
      </div>
      <nav className="mx-auto flex max-w-5xl gap-1 px-4 pb-2">
        <TabLink to="/" active={pathname === '/'} label="Queue" />
        <TabLink to="/leaderboard" active={pathname === '/leaderboard'} label="Leaderboard" />
      </nav>
      {showPin && <AdminPinModal onClose={() => setShowPin(false)} />}
      {showReset && (
        <ConfirmDialog
          title="Reset everything?"
          message="This clears every player, court, and win/loss record for everyone connected and starts fresh with one empty court. This can't be undone."
          confirmLabel="Yes, reset"
          danger
          onConfirm={() => {
            resetApp()
            setShowReset(false)
          }}
          onCancel={() => setShowReset(false)}
        />
      )}
    </header>
  )
}

function TabLink({ to, active, label }: { to: string; active: boolean; label: string }) {
  return (
    <Link
      to={to}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
        active
          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
          : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
      }`}
    >
      {label}
    </Link>
  )
}
