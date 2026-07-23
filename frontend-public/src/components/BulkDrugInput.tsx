import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { fetchDrugSuggestions } from "../utils/bulkSearch"

export type BulkDrugInputHandle = {
  flushPending: () => string[]
}

type Props = {
  drugs: string[]
  onChange: (drugs: string[]) => void
}

const BulkDrugInput = forwardRef<BulkDrugInputHandle, Props>(function BulkDrugInput(
  { drugs, onChange },
  ref
) {
  const [input, setInput] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const addDrug = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return false
    const exists = drugs.some((d) => d.toLowerCase() === trimmed.toLowerCase())
    if (exists) {
      setInput("")
      setSuggestions([])
      setShowSuggestions(false)
      return false
    }
    onChange([...drugs, trimmed])
    setInput("")
    setSuggestions([])
    setShowSuggestions(false)
    setActiveIndex(-1)
    return true
  }

  useImperativeHandle(ref, () => ({
    flushPending: () => {
      const trimmed = input.trim()
      if (!trimmed) return drugs
      const exists = drugs.some((d) => d.toLowerCase() === trimmed.toLowerCase())
      if (exists) {
        setInput("")
        return drugs
      }
      const next = [...drugs, trimmed]
      onChange(next)
      setInput("")
      setSuggestions([])
      setShowSuggestions(false)
      return next
    },
  }), [drugs, input, onChange])

  const removeDrug = (index: number) => {
    onChange(drugs.filter((_, i) => i !== index))
  }

  const handleInputChange = (value: string) => {
    setInput(value)
    setActiveIndex(-1)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    if (value.trim().length < 1) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    typingTimeoutRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const next = await fetchDrugSuggestions(value)
        if (!controller.signal.aborted) {
          setSuggestions(next)
          setShowSuggestions(next.length > 0)
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([])
          setShowSuggestions(false)
        }
      }
    }, 250)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (showSuggestions && suggestions.length > 0) {
        addDrug(activeIndex >= 0 ? suggestions[activeIndex] : suggestions[0])
      } else if (input.trim()) {
        addDrug(input)
      }
    } else if (e.key === "ArrowDown" && showSuggestions) {
      e.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp" && showSuggestions) {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, -1))
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    } else if (e.key === "Backspace" && !input && drugs.length > 0) {
      removeDrug(drugs.length - 1)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text")
    if (!text.includes("\n") && !text.includes(",") && !text.includes(";")) return

    e.preventDefault()
    const parts = text.split(/[\n,;]+/).map((p) => p.trim()).filter(Boolean)
    const next = [...drugs]
    const seen = new Set(drugs.map((d) => d.toLowerCase()))
    for (const part of parts) {
      const key = part.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        next.push(part)
      }
    }
    onChange(next)
  }

  return (
    <div className="space-y-3" ref={containerRef}>
      {drugs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {drugs.map((drug, index) => (
            <span
              key={`${drug}-${index}`}
              className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-200 px-3 py-1.5 text-sm font-medium text-primary-800"
            >
              {drug}
              <button
                type="button"
                onClick={() => removeDrug(index)}
                className="rounded-full p-0.5 hover:bg-primary-100 transition"
                aria-label={`Remove ${drug}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (input.trim() && suggestions.length > 0) setShowSuggestions(true)
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Tapez un médicament et choisissez une suggestion..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => addDrug(suggestion)}
                className={`w-full text-left px-4 py-3 transition ${
                  index === activeIndex ? "bg-primary-50 text-primary-700" : "hover:bg-slate-50"
                } ${index > 0 ? "border-t border-slate-100" : ""}`}
              >
                <Search className="inline w-4 h-4 mr-2 text-slate-400" />
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-slate-500">
        Commencez à taper pour voir des suggestions et corriger les fautes. Appuyez sur Entrée pour ajouter, ou collez plusieurs noms séparés par des virgules ou des retours à la ligne.
      </p>
    </div>
  )
})

export default BulkDrugInput
