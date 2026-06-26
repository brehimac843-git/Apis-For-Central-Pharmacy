type Props = {
  size?: "sm" | "md" | "lg"
  showWordmark?: boolean
  variant?: "default" | "light"
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
  variant = "default",
  className = "",
}: Props) {
  const s = sizeMap[size]
  const isLight = variant === "light"

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`${s.icon} rounded-xl flex items-center justify-center shadow-sm ${
          isLight
            ? "bg-white/15 ring-1 ring-white/25"
            : "bg-gradient-to-br from-primary-600 to-blue-600"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-5 h-5 text-white"
          aria-hidden="true"
        >
          <rect x="4" y="8.5" width="16" height="7" rx="3.5" fill="currentColor" />
          <line x1="12" y1="6" x2="12" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
        </svg>
      </div>

      {showWordmark && (
        <div>
          <p
            className={`text-xs uppercase tracking-[0.2em] font-medium ${
              isLight ? "text-primary-200" : "text-slate-500"
            }`}
          >
            PharmaCare
          </p>
          <p
            className={`${s.text} font-semibold leading-tight ${
              isLight ? "text-white" : "text-slate-900"
            }`}
          >
            Your pharmacy hub
          </p>
        </div>
      )}
    </div>
  )
}
