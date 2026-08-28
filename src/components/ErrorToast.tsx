import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { useStore } from '../lib/store'

export default function ErrorToast() {
  const { error, clearError } = useStore()

  useEffect(() => {
    if (!error) return
    const id = setTimeout(clearError, 3200)
    return () => clearTimeout(id)
  }, [error, clearError])

  if (!error) return null

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-xl dark:bg-white dark:text-slate-900">
        <AlertCircle className="h-4 w-4 text-rose-400" />
        {error}
      </div>
    </div>
  )
}
