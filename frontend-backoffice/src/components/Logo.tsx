type Props = {
  size?: "sm" | "md" | "lg"
  showWordmark?: boolean
  subtitle?: string
  className?: string
}

const sizeMap = {
  sm: { icon: "w-8 h-8", text: "text-base" },
  md: { icon: "w-10 h-10", text: "text-lg" },
  lg: { icon: "w-12 h-12", text: "text-xl" },
}

export default function Logo({
  size = "md",
  showWordmark = true,
  subtitle = "Staff portal",
  className = "",
}: Props) {
  const s = sizeMap[size]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${s.icon} rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br from-primary-600 to-blue-600`}>
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" aria-hidden="true">
          <circle cx="12" cy="12" r="2.2" fill="currentColor" />
          <line x1="12" y1="2" x2="12" y2="6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="12" y1="17.5" x2="12" y2="22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="2" y1="12" x2="6.5" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="17.5" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12" cy="3.5" r="1.2" fill="currentColor" />
          <circle cx="12" cy="20.5" r="1.2" fill="currentColor" />
          <circle cx="3.5" cy="12" r="1.2" fill="currentColor" />
          <circle cx="20.5" cy="12" r="1.2" fill="currentColor" />
        </svg>
      </div>

      {showWordmark && (
        <div>
          <p className="text-xs uppercase tracking-[0.2em] font-medium text-slate-500">PharmaHub</p>
          <p className={`${s.text} font-semibold leading-tight text-slate-900`}>{subtitle}</p>
        </div>
      )}
    </div>
  )
}
