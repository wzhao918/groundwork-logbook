'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

// Maps a query-string key to the message to show when that key is present.
// To trigger a toast from anywhere, redirect to `?logged=1` (or any of these).
const MESSAGES: Record<string, string> = {
  logged: 'Visit logged. Nice work.',
  updated: 'Saved.',
  deleted: 'Deleted.',
}

const SHOW_MS = 2400
const REMOVE_MS = 3000

export function Toast() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [message, setMessage] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Find the first param that matches a known toast key.
    const key = Object.keys(MESSAGES).find(k => params.get(k))
    if (!key) return

    setMessage(MESSAGES[key])
    // Defer the visible flip so the fade-in animates instead of pop-in.
    const fadeIn = requestAnimationFrame(() => setVisible(true))
    const fadeOut = setTimeout(() => setVisible(false), SHOW_MS)
    const cleanup = setTimeout(() => {
      // Strip every toast key from the URL so a refresh doesn't re-trigger.
      const next = new URLSearchParams(params)
      for (const k of Object.keys(MESSAGES)) next.delete(k)
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
      setMessage(null)
    }, REMOVE_MS)

    return () => {
      cancelAnimationFrame(fadeIn)
      clearTimeout(fadeOut)
      clearTimeout(cleanup)
    }
  }, [params, pathname, router])

  if (!message) return null

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2 transform transition-all duration-300 ease-out ${
        visible
          ? 'translate-y-0 opacity-100'
          : '-translate-y-2 opacity-0'
      }`}
    >
      <div className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-lg">
        {message}
      </div>
    </div>
  )
}
