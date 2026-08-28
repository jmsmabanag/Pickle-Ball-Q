import { AlertTriangle, Check } from 'lucide-react'

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              danger ? 'bg-rose-100 text-rose-500 dark:bg-rose-500/10' : 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/10'
            }`}
          >
            <AlertTriangle className="h-4.5 w-4.5" />
          </span>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h2>
        </div>
        <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition active:scale-95 dark:border-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-white transition active:scale-95 ${
              danger ? 'bg-rose-500' : 'bg-slate-900 dark:bg-white dark:text-slate-900'
            }`}
          >
            <Check className="h-4 w-4" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
