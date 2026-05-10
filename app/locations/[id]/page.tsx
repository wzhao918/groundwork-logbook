import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import { VisitCard } from '@/components/VisitCard'

export default async function LocationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ updated?: string; deleted?: string }>
}) {
  const { id } = await params
  const { updated, deleted } = await searchParams
  const sb = supabaseServer()

  const [locRes, visitsRes] = await Promise.all([
    sb
      .from('locations')
      .select('id, street_address, city_town')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle(),
    sb
      .from('visits')
      .select(
        'id, visit_date, rep_name, outcomes, flier_version, fliers_left, notes, created_at',
      )
      .eq('location_id', id)
      .is('deleted_at', null)
      .order('visit_date', { ascending: false })
      .order('created_at', { ascending: false }),
  ])

  // Either a malformed UUID (Postgres errors) or no row → 404.
  if (locRes.error || !locRes.data) notFound()

  const location = locRes.data
  const visits = visitsRes.data ?? []
  const editReturnUrl = `/locations/${id}`

  return (
    <main className="mx-auto max-w-2xl px-6 py-8 pb-24">
      <div className="mb-6">
        <Link
          href="/locations"
          className="text-sm text-stone-600 underline underline-offset-2"
        >
          ← All locations
        </Link>
        <header className="mt-3 flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {location.street_address}
            </h1>
            <p className="text-sm text-stone-600">{location.city_town}</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-stone-900">
              {visits.length} {visits.length === 1 ? 'visit' : 'visits'}
            </div>
            <Link
              href={`/locations/${id}/edit`}
              className="text-xs text-stone-500 underline underline-offset-2 hover:text-stone-700"
            >
              Edit location
            </Link>
          </div>
        </header>
      </div>

      {updated === '1' && (
        <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Saved.
        </div>
      )}
      {deleted === '1' && (
        <div className="mb-4 rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-800">
          Visit deleted. (Hidden — the audit log keeps a record.)
        </div>
      )}

      {visits.length === 0 ? (
        <div className="rounded-xl bg-white p-6 text-center text-sm text-stone-500 ring-1 ring-stone-200">
          No visits yet at this location.
        </div>
      ) : (
        <ul className="space-y-3">
          {visits.map(v => (
            <li key={v.id}>
              <VisitCard visit={v} editReturnUrl={editReturnUrl} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
