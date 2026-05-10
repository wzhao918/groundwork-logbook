import { supabaseAdmin } from '@/lib/supabase/admin'

// Escape PostgREST ilike wildcards so user input matches literally.
const escapeIlike = (s: string) => s.replace(/[%_\\]/g, '\\$&')

// Look up an existing location by case-insensitive (street, city). If not
// found, insert a new one. Used by the create-visit and edit-visit paths.
export async function findOrCreateLocation(
  street: string,
  city: string,
  rep_name: string,
): Promise<{ id: string; created: boolean }> {
  const sb = supabaseAdmin()

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
