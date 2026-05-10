import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { CITY_TOWN_SUGGESTIONS } from '@/lib/enums'
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton'
import { softDeleteLocation } from '@/app/locations/actions'
import { LocationEditForm } from '@/components/LocationEditForm'

export default async function EditLocationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error: errorParam } = await searchParams

  const sb = supabaseAdmin()
  const [locRes, visitCount] = await Promise.all([
    sb
      .from('locations')
      .select('id, street_address, city_town')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle(),
    sb
      .from('visits')
      .select('id', { count: 'exact', head: true })
      .eq('location_id', id)
      .is('deleted_at', null),
  ])

  if (locRes.error || !locRes.data) notFound()
  const location = locRes.data
  const activeVisits = visitCount.count ?? 0

  return (
    <main className="mx-auto max-w-md px-6 py-8 pb-24">
      <div className="mb-6">
        <Link
          href={`/locations/${id}`}
          className="text-sm text-stone-600 underline underline-offset-2"
        >
          ← Back to location
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Edit location
        </h1>
      </div>

      {errorParam === 'has_visits' && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Couldn't delete — this location still has visits attached.
        </div>
      )}

      <LocationEditForm
        locationId={location.id}
        initialStreet={location.street_address}
        initialCity={location.city_town}
        suggestions={[...CITY_TOWN_SUGGESTIONS]}
      />

      <div className="mt-8 border-t border-stone-200 pt-6">
        {activeVisits === 0 ? (
          <ConfirmDeleteButton
            triggerLabel="Delete this location"
            title="Delete this location?"
            message="It will be hidden from the locations index. The audit log keeps a record."
            formAction={softDeleteLocation.bind(null, location.id)}
          />
        ) : (
          <p className="text-sm text-stone-600">
            This location has{' '}
            <span className="font-medium text-stone-900">
              {activeVisits} active visit{activeVisits === 1 ? '' : 's'}
            </span>
            . Delete or move them first to remove this location.
          </p>
        )}
      </div>
    </main>
  )
}
