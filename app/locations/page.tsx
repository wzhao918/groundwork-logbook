import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { outcomeLabel } from '@/lib/enums'
import { formatDate } from '@/lib/format'
import { PageHeader } from '@/components/PageHeader'

type RawLocation = {
  id: string
  street_address: string
  city_town: string
}

type RawVisit = {
  id: string
  location_id: string
  visit_date: string
  outcomes: string[]
  created_at: string
}

type EnrichedLocation = RawLocation & {
  visit_count: number
  last_visit: RawVisit | null
}

export default async function LocationsPage() {
  const sb = supabaseAdmin()

  const [locsRes, visitsRes] = await Promise.all([
    sb
      .from('locations')
      .select('id, street_address, city_town')
      .is('deleted_at', null),
    sb
      .from('visits')
      .select('id, location_id, visit_date, outcomes, created_at')
      .is('deleted_at', null)
      .order('visit_date', { ascending: false })
      .order('created_at', { ascending: false }),
  ])

  const locations = (locsRes.data ?? []) as RawLocation[]
  const visits = (visitsRes.data ?? []) as RawVisit[]

  const visitsByLoc = new Map<string, RawVisit[]>()
  for (const v of visits) {
    const list = visitsByLoc.get(v.location_id)
    if (list) list.push(v)
    else visitsByLoc.set(v.location_id, [v])
  }

  const enriched: EnrichedLocation[] = locations.map(l => {
    const lvs = visitsByLoc.get(l.id) ?? []
    return {
      ...l,
      visit_count: lvs.length,
      // visits are pre-sorted desc, so [0] is the most recent.
      last_visit: lvs[0] ?? null,
    }
  })

  // Most recently visited at the top; never-visited fall to the bottom.
  enriched.sort((a, b) => {
    const aDate = a.last_visit?.visit_date ?? ''
    const bDate = b.last_visit?.visit_date ?? ''
    return bDate.localeCompare(aDate)
  })

  return (
    <main className="mx-auto max-w-2xl px-6 py-8 pb-24">
      <PageHeader title="Locations" current="locations" />

      <p className="mb-6 text-sm text-stone-600">
        {enriched.length}{' '}
        {enriched.length === 1 ? 'place' : 'places'} visited so far.
      </p>

      {enriched.length === 0 ? (
        <div className="rounded-xl bg-white p-6 text-center text-sm text-stone-500 ring-1 ring-stone-200">
          No locations yet.{' '}
          <Link href="/log" className="underline">
            Log your first visit
          </Link>
          .
        </div>
      ) : (
        <ul className="space-y-3">
          {enriched.map(l => (
            <li key={l.id}>
              <LocationRow location={l} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

function LocationRow({ location }: { location: EnrichedLocation }) {
  return (
    <Link
      href={`/locations/${location.id}`}
      className="block rounded-xl bg-white p-4 ring-1 ring-stone-200 transition hover:ring-stone-400"
    >
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-stone-900">
            {location.street_address}
          </div>
          <div className="text-xs text-stone-600">{location.city_town}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-stone-900">
            {location.visit_count}{' '}
            {location.visit_count === 1 ? 'visit' : 'visits'}
          </div>
          {location.last_visit && (
            <div className="text-xs text-stone-500">
              Last: {formatDate(location.last_visit.visit_date)}
            </div>
          )}
        </div>
      </div>
      {location.last_visit && location.last_visit.outcomes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {location.last_visit.outcomes.map(o => (
            <span
              key={o}
              className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-900"
            >
              {outcomeLabel(o)}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}
