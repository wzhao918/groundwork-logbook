'use server'

import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import { writeEditEvent } from '@/lib/audit'

export type SubmitState = { error?: string }

// Escape PostgREST ilike wildcards so user input matches literally.
const escapeIlike = (s: string) => s.replace(/[%_\\]/g, '\\$&')

async function findOrCreateLocation(
  street: string,
  city: string,
  rep_name: string,
): Promise<{ id: string; created: boolean }> {
  const sb = supabaseServer()

  const existing = await sb
    .from('locations')
    .select('id')
    .ilike('street_address', escapeIlike(street))
    .ilike('city_town', escapeIlike(city))
    .is('deleted_at', null)
    .maybeSingle()

  if (existing.data) return { id: existing.data.id, created: false }

  const ins = await sb
    .from('locations')
    .insert({ street_address: street, city_town: city, created_by: rep_name })
    .select('id')
    .single()

  if (ins.error || !ins.data) {
    // Race fallback — another submission may have just inserted the same address.
    const retry = await sb
      .from('locations')
      .select('id')
      .ilike('street_address', escapeIlike(street))
      .ilike('city_town', escapeIlike(city))
      .is('deleted_at', null)
      .maybeSingle()
    if (retry.data) return { id: retry.data.id, created: false }
    throw new Error(ins.error?.message ?? 'Could not save location.')
  }

  return { id: ins.data.id, created: true }
}

export async function submitVisit(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const rep_name = String(formData.get('rep_name') ?? '').trim()
  const visit_date = String(formData.get('visit_date') ?? '')
  const outcomes = formData
    .getAll('outcomes')
    .map(o => String(o))
    .filter(Boolean)
  const flier_version_raw = String(formData.get('flier_version') ?? '')
  const flier_version = flier_version_raw === '' ? null : flier_version_raw
  const fliers_left_raw = String(formData.get('fliers_left') ?? '')
  const fliers_left = fliers_left_raw === '' ? null : Number(fliers_left_raw)
  const notes = String(formData.get('notes') ?? '').trim() || null

  if (!rep_name) return { error: "Who's logging? Please enter a name." }
  if (!visit_date) return { error: 'Pick a date.' }
  if (outcomes.length === 0) {
    return { error: 'Pick at least one thing that happened.' }
  }
  if (fliers_left !== null && (Number.isNaN(fliers_left) || fliers_left < 0)) {
    return { error: 'Fliers left must be 0 or more.' }
  }

  let location_id = String(formData.get('location_id') ?? '').trim() || null
  let location_was_created = false
  let new_street_for_audit: string | null = null
  let new_city_for_audit: string | null = null

  if (!location_id) {
    const new_street = String(formData.get('new_street_address') ?? '').trim()
    const new_city = String(formData.get('new_city_town') ?? '').trim()
    if (!new_street || !new_city) {
      return { error: 'Pick a place or add a new one.' }
    }
    try {
      const result = await findOrCreateLocation(new_street, new_city, rep_name)
      location_id = result.id
      location_was_created = result.created
      new_street_for_audit = new_street
      new_city_for_audit = new_city
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : 'Could not save location.',
      }
    }
  }

  const sb = supabaseServer()
  const visitRes = await sb
    .from('visits')
    .insert({
      location_id,
      rep_name,
      visit_date,
      outcomes,
      flier_version,
      fliers_left,
      notes,
    })
    .select('id')
    .single()

  if (visitRes.error || !visitRes.data) {
    return { error: visitRes.error?.message ?? 'Could not save visit.' }
  }

  if (location_was_created && location_id) {
    await writeEditEvent({
      entity_type: 'location',
      entity_id: location_id,
      actor_name: rep_name,
      action: 'create',
      diff: {
        after: {
          street_address: new_street_for_audit,
          city_town: new_city_for_audit,
        },
      },
    })
  }

  await writeEditEvent({
    entity_type: 'visit',
    entity_id: visitRes.data.id,
    actor_name: rep_name,
    action: 'create',
    diff: {
      after: {
        location_id,
        rep_name,
        visit_date,
        outcomes,
        flier_version,
        fliers_left,
        notes,
      },
    },
  })

  redirect('/log?logged=1')
}
