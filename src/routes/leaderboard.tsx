import { createFileRoute } from '@tanstack/react-router'
import { Trophy } from 'lucide-react'
import { useStore } from '../lib/store'

export const Route = createFileRoute('/leaderboard')({
  component: LeaderboardPage,
})

function LeaderboardPage() {
  const { state } = useStore()
  const winRate = (p: { wins: number; gamesPlayed: number }) =>
    p.gamesPlayed > 0 ? p.wins / p.gamesPlayed : 0
  const ranked = [...state.players]
    .filter((p) => p.status !== 'unavailable')
    .sort((a, b) => winRate(b) - winRate(a) || b.gamesPlayed - a.gamesPlayed || a.name.localeCompare(b.name))

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center gap-2">
        <Trophy className="h-6 w-6 text-amber-500" />
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Leaderboard</h1>
      </div>

      {ranked.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 dark:border-slate-700">
          No games played yet.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {ranked.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-800/60"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    i === 0
                      ? 'bg-amber-400 text-white'
                      : i === 1
                        ? 'bg-slate-300 text-slate-700'
                        : i === 2
                          ? 'bg-orange-300 text-orange-900'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{p.name}</p>
                  {p.status === 'playing' && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                      Playing
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {p.gamesPlayed > 0 ? `${Math.round(winRate(p) * 100)}%` : '—'}
                  <span className="ml-1 font-normal text-slate-400">win rate</span>
                </p>
                <p className="text-xs text-slate-400">
                  {p.wins}W&ndash;{p.losses}L · {p.gamesPlayed} {p.gamesPlayed === 1 ? 'game' : 'games'}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
