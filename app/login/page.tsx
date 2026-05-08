'use client'
import { useActionState } from 'react'
import { login, type LoginState } from './actions'

const initialState: LoginState = {}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState)
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Groundwork Logbook
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Enter the team passcode to start.
          </p>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="passcode"
            className="block text-sm font-medium text-stone-700"
          >
            Passcode
          </label>
          <input
            id="passcode"
            name="passcode"
            type="password"
            autoFocus
            autoComplete="off"
            className="w-full rounded-lg border border-stone-300 px-4 py-3 text-base focus:border-stone-500 focus:outline-none"
          />
        </div>
        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-stone-900 px-4 py-3 text-base font-medium text-white transition active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? 'Checking…' : 'Enter'}
        </button>
      </form>
    </main>
  )
}
