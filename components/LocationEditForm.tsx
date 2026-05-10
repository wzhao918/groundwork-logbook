'use client'

import { useActionState } from 'react'
import {
  updateLocation,
  type LocationFormState,
} from '@/app/locations/actions'

const initialState: LocationFormState = {}

export function LocationEditForm({
  locationId,
  initialStreet,
  initialCity,
  suggestions,
}: {
  locationId: string
  initialStreet: string
  initialCity: string
  suggestions: string[]
}) {
  const action = updateLocation.bind(null, locationId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="street_address"
          className="block text-sm font-medium text-stone-700"
        >
          Street address
        </label>
        <input
          id="street_address"
          name="street_address"
          type="text"
          required
          autoComplete="street-address"
          defaultValue={initialStreet}
          className="w-full rounded-lg border border-stone-300 px-4 py-3 text-base focus:border-stone-500 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="city_town"
          className="block text-sm font-medium text-stone-700"
        >
          City / town
        </label>
        <input
          id="city_town"
          name="city_town"
          type="text"
          required
          autoComplete="address-level2"
          list="city-town-suggestions"
          defaultValue={initialCity}
          className="w-full rounded-lg border border-stone-300 px-4 py-3 text-base focus:border-stone-500 focus:outline-none"
        />
        <datalist id="city-town-suggestions">
          {suggestions.map(c => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-stone-900 px-4 py-4 text-base font-medium text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Update'}
      </button>
    </form>
  )
}
