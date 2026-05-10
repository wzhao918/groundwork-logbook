'use server'

import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import { writeEditEvent, SHARED_PASSCODE_ACTOR } from '@/lib/audit'
import { findOrCreateLocation } from '@/lib/locations'
import { computeDiff } from '@/lib/diff'

export type SubmitState = { error?: string }

export async function updateVisit(
  visitId: string,
  returnUrl: string,
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

  if (!rep_name) return { error: 'Rep name is required.' }
  if (!visit_date) return { error: 'Pick a date.' }
  if (outcomes.length === 0) {
    return { error: 'Pick at least one thing that happened.' }
  }
  if (fliers_left !== null && (Number.isNaN(fliers_left) || fliers_left < 0)) {
    return { error: 'Fliers left must be 0 or more.' }
  }

  let location_id = String(formData.get('location_id') ?? '').trim() || null

  if (!location_id) {
    const new_street = String(formData.get('new_street_address') ?? '').trim()
    const new_city = String(formData.get('new_city_town') ?? '').trim()
    if (!new_street || !new_city) {
      return { error: 'Pick a place or add a new one.' }
    }
    try {
      const result = await findOrCreateLocation(new_street, new_city, rep_name)
      location_id = result.id
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : 'Could not save location.',
      }
    }
  }

  const sb = supabaseServer()

  // Fetch the existing row so we can compute a meaningful audit diff.
  const existing = await sb
    .from('visits')
    .select(
      'location_id, rep_name, visit_date, outcomes, flier_version, fliers_left, notes',
    )
    .eq('id', visitId)
    .is('deleted_at', null)
    .maybeSingle()

  if (existing.error || !existing.data) {
    return { error: 'Visit not found, or it was deleted.' }
  }

  const newValues = {
    location_id,
    rep_name,
    visit_date,
    outcomes,
    flier_version,
    fliers_left,
    notes,
  }

  const upd = await sb.from('visits').update(newValues).eq('id', visitId)
  if (upd.error) return { error: upd.error.message }

  const diff = computeDiff(
    existing.data as Record<string, unknown>,
    newValues as Record<string, unknown>,
  )
  if (diff) {
    await writeEditEvent({
      entity_type: 'visit',
      entity_id: visitId,
      actor_name: SHARED_PASSCODE_ACTOR,
      action: 'update',
      diff,
    })
  }

  redirect(appendParam(returnUrl, 'updated', '1'))
}

export async function softDeleteVisit(
  visitId: string,
  returnUrl: string,
  _formData: FormData,
) {
  const sb = supabaseServer()
  const { error } = await sb
    .from('visits')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', visitId)
    .is('deleted_at', null)

  if (!error) {
    await writeEditEvent({
      entity_type: 'visit',
      entity_id: visitId,
      actor_name: SHARED_PASSCODE_ACTOR,
      action: 'soft_delete',
    })
  }

  redirect(appendParam(returnUrl, 'deleted', '1'))
}

function appendParam(url: string, key: string, value: string): string {
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}${key}=${encodeURIComponent(value)}`
}
