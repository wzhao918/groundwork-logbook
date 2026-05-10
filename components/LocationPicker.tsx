'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase'
import { CITY_TOWN_SUGGESTIONS } from '@/lib/enums'

type Location = {
  id: string
  street_address: string
  city_town: string
}

export type LocationSelection =
  | { type: 'existing'; location: Location }
  | { type: 'new'; street_address: string; city_town: string }
  | null

type Props = {
  onChange: (sel: LocationSelection) => void
  // When provided (e.g., on a visit edit page), the picker starts in the
  // "selected" state with this location pre-chosen. The user can click Change
  // to swap to a different existing location or add a new one.
  initialLocation?: Location
}

export function LocationPicker({ onChange, initialLocation }: Props) {
  const [locations, setLocations] = useState<Location[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Location | null>(
    initialLocation ?? null,
  )
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newStreet, setNewStreet] = useState('')
  const [newCity, setNewCity] = useState('')

  // Fetch all locations once. With V1's expected volume (tens of rows),
  // client-side filtering avoids a per-keystroke roundtrip.
  useEffect(() => {
    supabaseBrowser()
      .from('locations')
      .select('id, street_address, city_town')
      .is('deleted_at', null)
      .order('street_address')
      .then(({ data }) => {
        if (data) setLocations(data as Location[])
      })
  }, [])

  useEffect(() => {
    if (selected) {
      onChange({ type: 'existing', location: selected })
    } else if (isAddingNew && newStreet.trim() && newCity.trim()) {
      onChange({
        type: 'new',
        street_address: newStreet.trim(),
        city_town: newCity.trim(),
      })
    } else {
      onChange(null)
    }
  }, [selected, isAddingNew, newStreet, newCity, onChange])

  const matches =
    query.trim().length === 0
      ? []
      : locations
          .filter(l => {
            const q = query.toLowerCase()
            return (
              l.street_address.toLowerCase().includes(q) ||
              l.city_town.toLowerCase().includes(q)
            )
          })
          .slice(0, 8)

  if (selected) {
    return (
      <div className="rounded-xl border border-stone-300 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-medium">{selected.street_address}</div>
            <div className="text-sm text-stone-600">{selected.city_town}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelected(null)
              setQuery('')
            }}
            className="text-sm text-stone-600 underline"
          >
            Change
          </button>
        </div>
      </div>
    )
  }

  if (isAddingNew) {
    return (
      <div className="space-y-3">
        <input
          value={newStreet}
          onChange={e => setNewStreet(e.target.value)}
          placeholder="Street address"
          autoComplete="street-address"
          className="w-full rounded-lg border border-stone-300 px-4 py-3 text-base focus:border-stone-500 focus:outline-none"
        />
        <input
          value={newCity}
          onChange={e => setNewCity(e.target.value)}
          placeholder="City / town"
          autoComplete="address-level2"
          list="city-town-suggestions"
          className="w-full rounded-lg border border-stone-300 px-4 py-3 text-base focus:border-stone-500 focus:outline-none"
        />
        <datalist id="city-town-suggestions">
          {CITY_TOWN_SUGGESTIONS.map(c => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <button
          type="button"
          onClick={() => {
            setIsAddingNew(false)
            setNewStreet('')
            setNewCity('')
          }}
          className="text-sm text-stone-600 underline"
        >
          ← Search existing instead
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search address or city…"
        className="w-full rounded-lg border border-stone-300 px-4 py-3 text-base focus:border-stone-500 focus:outline-none"
      />
      {matches.length > 0 && (
        <ul className="space-y-1">
          {matches.map(l => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => setSelected(l)}
                className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-left transition hover:border-stone-400 active:scale-[0.99]"
              >
                <div className="font-medium">{l.street_address}</div>
                <div className="text-sm text-stone-600">{l.city_town}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {query.trim().length > 0 && matches.length === 0 && (
        <p className="text-sm text-stone-600">
          No matches yet. Add it as a new place?
        </p>
      )}
      <button
        type="button"
        onClick={() => setIsAddingNew(true)}
        className="w-full rounded-lg border border-dashed border-stone-400 px-4 py-3 text-stone-700 transition hover:border-stone-600 active:scale-[0.99]"
      >
        + This is a new place
      </button>
    </div>
  )
}
