import { WAIT_TIME_MS } from '../lib/types'

export function formatCountdown(queueSince: number, now: number) {
  const remaining = WAIT_TIME_MS - (now - queueSince)
  const overtime = remaining < 0
  const abs = Math.abs(remaining)
  const mins = Math.floor(abs / 60000)
  const secs = Math.floor((abs % 60000) / 1000)
  const text = `${overtime ? '+' : ''}${mins}:${secs.toString().padStart(2, '0')}`
  return { text, overtime, remaining }
}

export default function WaitTimer({ queueSince, now }: { queueSince: number; now: number }) {
  const { text, overtime } = formatCountdown(queueSince, now)
  return (
    <span
      className={`font-mono text-sm font-bold tabular-nums ${
        overtime ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'
      }`}
    >
      {text}
    </span>
  )
}
