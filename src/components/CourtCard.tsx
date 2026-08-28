import { useState } from 'react'
import { ArrowLeftToLine, Trash2 } from 'lucide-react'
import type { Court, Player } from '../lib/types'
import { useStore } from '../lib/store'
import ConfirmDialog from './ConfirmDialog'

function elapsed(startedAt: number | null, now: number) {
  if (!startedAt) return '0:00'
  const ms = Math.max(0, now - startedAt)
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function CourtCard({ court, players, now }: { court: Court; players: Player[]; now: number }) {
  const { isAdmin, finishCourtGame, requeueFromCourt, removeExistingCourt } = useStore()
  const [requeueTarget, setRequeueTarget] = useState<Player | null>(null)
  const [winTarget, setWinTarget] = useState<'A' | 'B' | null>(null)
  const [showRemoveCourt, setShowRemoveCourt] = useState(false)

  const byId = (id: string) => players.find((p) => p.id === id)
  const teamA = court.teamA.map(byId).filter((p): p is Player => Boolean(p))
  const teamB = court.teamB.map(byId).filter((p): p is Player => Boolean(p))
  const roster = court.playerIds.map(byId).filter((p): p is Player => Boolean(p))
  const isActive = roster.length > 0
  const canFinish = teamA.length === 2 && teamB.length === 2

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-sm transition ${
        isActive
          ? 'border-cyan-300 bg-gradient-to-br from-cyan-50 to-indigo-50 dark:border-cyan-800 dark:from-cyan-950/40 dark:to-indigo-950/40'
          : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40'
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">{court.name}</h3>
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="rounded-full bg-white/80 px-2 py-0.5 font-mono text-xs font-bold text-cyan-600 dark:bg-slate-900/60 dark:text-cyan-400">
              {elapsed(court.startedAt, now)}
            </span>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowRemoveCourt(true)}
              aria-label={`Remove ${court.name}`}
              className="rounded-full p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isActive ? (
        <div className="grid grid-cols-2 gap-2">
          <TeamColumn label="Team A" team={teamA} isAdmin={isAdmin} onRequeue={setRequeueTarget} />
          <TeamColumn label="Team B" team={teamB} isAdmin={isAdmin} onRequeue={setRequeueTarget} />
        </div>
      ) : (
        <p className="rounded-xl bg-white/60 px-3 py-4 text-center text-sm text-slate-400 dark:bg-slate-900/30">
          Waiting for players
        </p>
      )}

      {isAdmin && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setWinTarget('A')}
            disabled={!canFinish}
            className="w-full rounded-xl bg-lime-400 py-2.5 text-sm font-bold text-slate-900 shadow-sm shadow-lime-400/40 transition active:scale-95 disabled:opacity-30"
          >
            Team A Won
          </button>
          <button
            onClick={() => setWinTarget('B')}
            disabled={!canFinish}
            className="w-full rounded-xl bg-lime-400 py-2.5 text-sm font-bold text-slate-900 shadow-sm shadow-lime-400/40 transition active:scale-95 disabled:opacity-30"
          >
            Team B Won
          </button>
        </div>
      )}

      {requeueTarget && (
        <ConfirmDialog
          title="Send back to queue?"
          message={`${requeueTarget.name} will leave the court now and go to the back of the queue. The next player in line will take their spot.`}
          confirmLabel="Send to queue"
          onConfirm={() => {
            requeueFromCourt(court.id, requeueTarget.id)
            setRequeueTarget(null)
          }}
          onCancel={() => setRequeueTarget(null)}
        />
      )}

      {winTarget && (
        <ConfirmDialog
          title="Confirm winner"
          message={`${(winTarget === 'A' ? teamA : teamB).map((p) => p.name).join(' & ')} won this game on ${court.name}. This will end the game and update everyone's record.`}
          confirmLabel="Confirm win"
          onConfirm={() => {
            finishCourtGame(court.id, winTarget)
            setWinTarget(null)
          }}
          onCancel={() => setWinTarget(null)}
        />
      )}

      {showRemoveCourt && (
        <ConfirmDialog
          title={`Remove ${court.name}?`}
          message={
            isActive
              ? `${roster.length} player${roster.length === 1 ? '' : 's'} currently on this court will be sent back to the queue, and the court will be deleted.`
              : `${court.name} will be deleted.`
          }
          confirmLabel="Remove court"
          danger
          onConfirm={() => {
            removeExistingCourt(court.id)
            setShowRemoveCourt(false)
          }}
          onCancel={() => setShowRemoveCourt(false)}
        />
      )}
    </div>
  )
}

function TeamColumn({
  label,
  team,
  isAdmin,
  onRequeue,
}: {
  label: string
  team: Player[]
  isAdmin: boolean
  onRequeue: (player: Player) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="px-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      {team.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-1 rounded-xl bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
        >
          <span className="truncate">{p.name}</span>
          {isAdmin && (
            <button
              onClick={() => onRequeue(p)}
              aria-label={`Send ${p.name} back to queue`}
              title="Send to back of queue"
              className="shrink-0 rounded-full p-0.5 text-slate-400 hover:text-cyan-500"
            >
              <ArrowLeftToLine className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
