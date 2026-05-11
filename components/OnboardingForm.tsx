'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'

export function OnboardingForm() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) return
    setError(null)
    setPending(true)
    const supabase = supabaseClient()

    const updates: {
      data: { display_name: string }
      password?: string
    } = {
      data: { display_name: displayName.trim() },
    }
    if (password) updates.password = password

    const { error } = await supabase.auth.updateUser(updates)
    setPending(false)
    if (error) {
      setError(error.message)
      return
    }
    router.push('/log')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="display_name"
          className="block text-sm font-medium text-stone-700"
        >
          What name should we show on your visits?
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          autoComplete="given-name"
          required
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-4 py-3 text-base focus:border-stone-500 focus:outline-none"
        />
        <p className="text-xs text-stone-500">
          This shows up on the dashboard and the audit log.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-stone-700"
        >
          Set a password{' '}
          <span className="font-normal text-stone-500">(optional)</span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-4 py-3 text-base focus:border-stone-500 focus:outline-none"
        />
        <p className="text-xs text-stone-500">
          Skip this and you can sign in by email link instead. Add it later if you change your mind.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !displayName.trim()}
        className="w-full rounded-xl bg-emerald-700 px-4 py-4 text-base font-medium text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Continue'}
      </button>
    </form>
  )
}
