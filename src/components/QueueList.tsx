import { useState } from 'react'
import { X } from 'lucide-react'
import type { Player } from '../lib/types'
import WaitTimer from './WaitTimer'
import { useStore } from '../lib/store'
import ConfirmDialog from './ConfirmDialog'

export default function QueueList({ players, now }: { players: Player[]; now: number }) {
  const { isAdmin, setPlayerUnavailable } = useStore()
  const [removeTarget, setRemoveTarget] = useState<Player | null>(null)
  const queued = players
    .filter((p) => p.status === 'queue')
    .sort((a, b) => a.queueSince - b.queueSince)

  if (queued.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 dark:border-slate-700">
        No one is waiting. Add players to get started.
      </p>
    )
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {queued.map((p, i) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-800/60"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                {i + 1}
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{p.name}</p>
                  {p.lastResult && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        p.lastResult === 'win'
                          ? 'bg-teal-100 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400'
                          : 'bg-rose-100 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400'
                      }`}
                    >
                      {p.lastResult === 'win' ? 'Won' : 'Lost'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{i < 4 ? 'Next up' : 'Waiting'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <WaitTimer queueSince={p.queueSince} now={now} />
              {isAdmin && (
                <button
                  onClick={() => setRemoveTarget(p)}
                  aria-label={`Remove ${p.name}`}
                  className="rounded-full p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {removeTarget && (
        <ConfirmDialog
          title="Mark unavailable?"
          message={`${removeTarget.name} will be pulled out of the queue and taken off the rotation until they're re-registered.`}
          confirmLabel="Mark unavailable"
          danger
          onConfirm={() => {
            setPlayerUnavailable(removeTarget.id)
            setRemoveTarget(null)
          }}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </>
  )
}
