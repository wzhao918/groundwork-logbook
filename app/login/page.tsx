'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'

type Mode = 'password' | 'magic'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicSent, setMagicSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const supabase = supabaseClient()

    if (mode === 'password') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      setPending(false)
      if (error) {
        setError(humanize(error.message))
        return
      }
      router.push('/log')
      router.refresh()
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // shouldCreateUser:false locks magic-link to existing accounts.
          // Random emails get rejected; only admin-invited users can sign in.
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      setPending(false)
      if (error) {
        setError(humanize(error.message))
        return
      }
      setMagicSent(true)
    }
  }

  if (magicSent) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="text-sm text-stone-700">
            We sent a sign-in link to <span className="font-medium">{email}</span>.
            Click it to continue.
          </p>
          <button
            type="button"
            onClick={() => {
              setMagicSent(false)
              setMode('password')
            }}
            className="text-sm text-stone-600 underline underline-offset-2"
          >
            Use a different method
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Groundwork Logbook
          </h1>
          <p className="mt-1 text-sm text-stone-600">Sign in to continue.</p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-stone-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-4 py-3 text-base focus:border-stone-500 focus:outline-none"
          />
        </div>

        {mode === 'password' && (
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-stone-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-4 py-3 text-base focus:border-stone-500 focus:outline-none"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-base font-medium text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-50"
        >
          {pending
            ? 'Signing in…'
            : mode === 'password'
              ? 'Sign in'
              : 'Email me a link'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'password' ? 'magic' : 'password')
            setError(null)
          }}
          className="block w-full text-center text-sm text-stone-600 underline underline-offset-2"
        >
          {mode === 'password'
            ? 'Email me a link instead'
            : 'Use a password instead'}
        </button>
      </form>
    </main>
  )
}

// Translate Supabase's literal error strings into something friendlier.
function humanize(msg: string): string {
  const lower = msg.toLowerCase()
  if (lower.includes('invalid login')) return 'Wrong email or password.'
  if (lower.includes('email not confirmed')) {
    return 'You need to confirm your email first — check your inbox.'
  }
  if (lower.includes('signups not allowed')) {
    return "We don't recognize that email. Ask the admin to invite you."
  }
  return msg
}
