import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../lib/store'

export default function AddPlayerForm() {
  const { registerPlayer } = useStore()
  const [name, setName] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    registerPlayer(name)
    setName('')
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Player name"
        className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
      <button
        type="submit"
        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/30 active:scale-95"
      >
        <Plus className="h-4 w-4" />
        Add
      </button>
    </form>
  )
}
