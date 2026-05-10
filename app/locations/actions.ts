'use server'

import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentDisplayName } from '@/lib/auth'
import { writeEditEvent } from '@/lib/audit'
import { computeDiff } from '@/lib/diff'

export type LocationFormState = { error?: string }

export async function updateLocation(
  locationId: string,
  _prev: LocationFormState,
  formData: FormData,
): Promise<LocationFormState> {
  const street_address = String(formData.get('street_address') ?? '').trim()
  const city_town = String(formData.get('city_town') ?? '').trim()

  if (!street_address) return { error: 'Street address is required.' }
  if (!city_town) return { error: 'City / town is required.' }

  const editor = await getCurrentDisplayName()
  const sb = supabaseAdmin()
  const existing = await sb
    .from('locations')
    .select('street_address, city_town')
    .eq('id', locationId)
    .is('deleted_at', null)
    .maybeSingle()

  if (existing.error || !existing.data) {
    return { error: 'Location not found, or it was deleted.' }
  }

  const newValues = { street_address, city_town }
  const upd = await sb
    .from('locations')
    .update(newValues)
    .eq('id', locationId)

  if (upd.error) {
    // 23505 = Postgres unique violation. Our unique index is on
    // (lower(street_address), lower(city_town)).
    if (upd.error.code === '23505') {
      return { error: 'Another location already has this address.' }
    }
    return { error: upd.error.message }
  }

  const diff = computeDiff(
    existing.data as Record<string, unknown>,
    newValues as Record<string, unknown>,
  )
  if (diff) {
    await writeEditEvent({
      entity_type: 'location',
      entity_id: locationId,
      actor_name: editor,
      action: 'update',
      diff,
    })
  }

  redirect(`/locations/${locationId}?updated=1`)
}

export async function softDeleteLocation(
  locationId: string,
  _formData: FormData,
) {
  const editor = await getCurrentDisplayName()
  const sb = supabaseAdmin()

  // Belt-and-suspenders: even though the page hides the delete button when
  // visits exist, re-check here in case anything raced.
  const visitCheck = await sb
    .from('visits')
    .select('id', { count: 'exact', head: true })
    .eq('location_id', locationId)
    .is('deleted_at', null)

  if ((visitCheck.count ?? 0) > 0) {
    redirect(`/locations/${locationId}/edit?error=has_visits`)
  }

  const { error } = await sb
    .from('locations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', locationId)
    .is('deleted_at', null)

  if (!error) {
    await writeEditEvent({
      entity_type: 'location',
      entity_id: locationId,
      actor_name: editor,
      action: 'soft_delete',
    })
  }

  redirect('/locations?deleted=1')
}
