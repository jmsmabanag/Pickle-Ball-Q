import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useStore } from '../lib/store'
import { useNow } from '../lib/useNow'
import AddPlayerForm from '../components/AddPlayerForm'
import QueueList from '../components/QueueList'
import CourtCard from '../components/CourtCard'

export const Route = createFileRoute('/')({
  component: QueuePage,
})

function QueuePage() {
  const { state, isAdmin, addNewCourt } = useStore()
  const now = useNow()
  const queuedCount = state.players.filter((p) => p.status === 'queue').length
  const playingCount = state.players.filter((p) => p.status === 'playing').length

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-6">
      <section className="grid grid-cols-3 gap-3">
        <StatCard label="Waiting" value={queuedCount} />
        <StatCard label="Playing" value={playingCount} />
        <StatCard label="Courts" value={state.courts.length} />
      </section>

      {isAdmin && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">
            Register Player
          </h2>
          <AddPlayerForm />
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Playing</h2>
          {isAdmin && (
            <button
              onClick={addNewCourt}
              className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 active:scale-95 dark:bg-slate-800 dark:text-slate-300"
            >
              <Plus className="h-3.5 w-3.5" /> Court
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {state.courts.map((court) => (
            <CourtCard key={court.id} court={court} players={state.players} now={now} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-800 dark:text-slate-100">Next Up</h2>
        <QueueList players={state.players} now={now} />
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  )
}
