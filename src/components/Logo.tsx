export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <svg viewBox="0 0 48 48" className="h-8 w-8" aria-hidden="true">
        <defs>
          <linearGradient id="uq-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="22" fill="url(#uq-grad)" />
        <circle cx="24" cy="24" r="22" fill="none" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />
        {[...Array(10)].map((_, i) => {
          const angle = (i / 10) * Math.PI * 2
          const r = 16
          return (
            <circle
              key={i}
              cx={24 + Math.cos(angle) * r}
              cy={24 + Math.sin(angle) * r}
              r="1.6"
              fill="white"
              fillOpacity="0.85"
            />
          )
        })}
        <path
          d="M16 30c2-8 4-14 8-14s6 6 8 14"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="24" cy="16" r="3.4" fill="white" />
      </svg>
      <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
        unst<span className="text-cyan-500">ck</span>dq
      </span>
    </div>
  )
}
