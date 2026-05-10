'use server'

import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentDisplayName } from '@/lib/auth'
import { writeEditEvent } from '@/lib/audit'
import { findOrCreateLocation } from '@/lib/locations'
import { computeDiff } from '@/lib/diff'

export type SubmitState = { error?: string }

export async function updateVisit(
  visitId: string,
  returnUrl: string,
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  // The visit's rep_name is preserved across edits — we don't overwrite who
  // *did* the visit. The current editor is captured separately in the audit log.
  const editor = await getCurrentDisplayName()
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
      const result = await findOrCreateLocation(new_street, new_city, editor)
      location_id = result.id
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : 'Could not save location.',
      }
    }
  }

  const sb = supabaseAdmin()

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

  // rep_name is intentionally NOT in newValues — the visit's owner doesn't
  // change just because someone else edited it.
  const newValues = {
    location_id,
    visit_date,
    outcomes,
    flier_version,
    fliers_left,
    notes,
  }

  const upd = await sb.from('visits').update(newValues).eq('id', visitId)
  if (upd.error) return { error: upd.error.message }

  // Compare only the fields the editor can change. rep_name is excluded
  // from the diff because we never overwrite it.
  const before = { ...(existing.data as Record<string, unknown>) }
  delete before.rep_name
  const diff = computeDiff(before, newValues as Record<string, unknown>)
  if (diff) {
    await writeEditEvent({
      entity_type: 'visit',
      entity_id: visitId,
      actor_name: editor,
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
  const editor = await getCurrentDisplayName()
  const sb = supabaseAdmin()
  const { error } = await sb
    .from('visits')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', visitId)
    .is('deleted_at', null)

  if (!error) {
    await writeEditEvent({
      entity_type: 'visit',
      entity_id: visitId,
      actor_name: editor,
      action: 'soft_delete',
    })
  }

  redirect(appendParam(returnUrl, 'deleted', '1'))
}

function appendParam(url: string, key: string, value: string): string {
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}${key}=${encodeURIComponent(value)}`
}
