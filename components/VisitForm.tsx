'use client'

import { useState, useActionState } from 'react'
import { LocationPicker, type LocationSelection } from './LocationPicker'
import { OUTCOMES, FLIER_VERSIONS } from '@/lib/enums'
import { submitVisit, type SubmitState } from '@/app/log/actions'
import { updateVisit } from '@/app/visits/actions'

const initialState: SubmitState = {}

export type VisitEditing = {
  visitId: string
  initialValues: {
    rep_name: string
    visit_date: string
    outcomes: string[]
    flier_version: string | null
    fliers_left: number | null
    notes: string | null
  }
  initialLocation: { id: string; street_address: string; city_town: string }
  returnUrl: string
}

export function VisitForm({
  repName,
  editing,
}: {
  repName: string
  editing?: VisitEditing
}) {
  // useActionState binds an action with shape (prevState, formData) => state.
  // For edit mode we pre-bind visitId + returnUrl, leaving the right signature.
  const action = editing
    ? updateVisit.bind(null, editing.visitId, editing.returnUrl)
    : submitVisit
  const [state, formAction, pending] = useActionState(action, initialState)

  const [location, setLocation] = useState<LocationSelection>(
    editing
      ? { type: 'existing', location: editing.initialLocation }
      : null,
  )

  const today = new Date().toISOString().slice(0, 10)
  const initial = editing?.initialValues

  return (
    <form action={formAction} className="space-y-7">
      <p className="text-sm text-stone-600">
        Logging as{' '}
        <span className="font-medium text-stone-900">
          {editing ? initial?.rep_name : repName}
        </span>
        {editing && (
          <span className="text-stone-500">
            {' '}
            · editing as{' '}
            <span className="font-medium text-stone-700">{repName}</span>
          </span>
        )}
      </p>

      <Field label="When?">
        <input
          type="date"
          name="visit_date"
          defaultValue={initial?.visit_date ?? today}
          required
          className="w-full rounded-lg border border-stone-300 px-4 py-3 text-base focus:border-stone-500 focus:outline-none"
        />
      </Field>

      <Field label="Where?">
        <LocationPicker
          onChange={setLocation}
          initialLocation={editing?.initialLocation}
        />
        {location?.type === 'existing' && (
          <input
            type="hidden"
            name="location_id"
            value={location.location.id}
          />
        )}
        {location?.type === 'new' && (
          <>
            <input
              type="hidden"
              name="new_street_address"
              value={location.street_address}
            />
            <input
              type="hidden"
              name="new_city_town"
              value={location.city_town}
            />
          </>
        )}
      </Field>

      <Field label="What happened? (any that apply)">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {OUTCOMES.map(o => (
            <OptionCard
              key={o.value}
              type="checkbox"
              name="outcomes"
              value={o.value}
              label={o.label}
              defaultChecked={initial?.outcomes.includes(o.value) ?? false}
            />
          ))}
        </div>
      </Field>

      <Field label="Flier version (optional)">
        <div className="grid grid-cols-2 gap-2">
          {FLIER_VERSIONS.map(f => (
            <OptionCard
              key={f.value}
              type="radio"
              name="flier_version"
              value={f.value}
              label={f.label}
              defaultChecked={initial?.flier_version === f.value}
            />
          ))}
        </div>
      </Field>

      <Field label="About how many fliers left? (optional)">
        <input
          type="number"
          name="fliers_left"
          min={0}
          inputMode="numeric"
          defaultValue={initial?.fliers_left ?? ''}
          className="w-full rounded-lg border border-stone-300 px-4 py-3 text-base focus:border-stone-500 focus:outline-none"
        />
      </Field>

      <Field label="Notes (optional)">
        <textarea
          name="notes"
          rows={3}
          defaultValue={initial?.notes ?? ''}
          className="w-full rounded-lg border border-stone-300 px-4 py-3 text-base focus:border-stone-500 focus:outline-none"
        />
      </Field>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !location}
        className="w-full rounded-xl bg-stone-900 px-4 py-4 text-base font-medium text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Saving…' : editing ? 'Update' : 'Log it'}
      </button>
    </form>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-stone-700">{label}</label>
      {children}
    </div>
  )
}

function OptionCard({
  type,
  name,
  value,
  label,
  required,
  defaultChecked,
}: {
  type: 'radio' | 'checkbox'
  name: string
  value: string
  label: string
  required?: boolean
  defaultChecked?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-300 bg-white px-4 py-3 text-base transition has-[:checked]:border-stone-900 has-[:checked]:bg-stone-900 has-[:checked]:text-white">
      <input
        type={type}
        name={name}
        value={value}
        required={required}
        defaultChecked={defaultChecked}
        className="sr-only"
      />
      <span>{label}</span>
    </label>
  )
}
