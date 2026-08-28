import { useState } from 'react'
import { useStore } from '../lib/store'

export default function AdminPinModal({ onClose }: { onClose: () => void }) {
  const { enableAdmin } = useStore()
  const [pin, setPin] = useState('')
  const [failed, setFailed] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const ok = enableAdmin(pin.trim())
    if (ok) {
      onClose()
    } else {
      setFailed(true)
      setPin('')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800"
      >
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Enter Admin PIN</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Unlocks player, court, and game controls.
        </p>
        <input
          autoFocus
          inputMode="numeric"
          type="password"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value)
            setFailed(false)
          }}
          placeholder="PIN"
          className="mt-4 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-center text-2xl tracking-widest outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        />
        {failed && <p className="mt-2 text-sm font-medium text-rose-500">Incorrect PIN. Try again.</p>}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-100 py-3 font-semibold text-slate-600 active:scale-95 dark:bg-slate-700 dark:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 py-3 font-semibold text-white shadow-lg shadow-cyan-500/30 active:scale-95"
          >
            Unlock
          </button>
        </div>
      </form>
    </div>
  )
}
