import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase'
import { outcomeLabel } from '@/lib/enums'
import { PageHeader } from '@/components/PageHeader'
import { VisitCard } from '@/components/VisitCard'

type RawVisit = {
  id: string
  location_id: string
  visit_date: string
  rep_name: string
  outcomes: string[]
  flier_version: string | null
  fliers_left: number | null
  notes: string | null
  created_at: string
}

type RawLocation = {
  id: string
  street_address: string
  city_town: string
}

type Visit = RawVisit & { location: RawLocation }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    rep?: string
    city?: string
    from?: string
    to?: string
  }>
}) {
  const params = await searchParams
  const sb = supabaseServer()

  const [visitsRes, locationsRes] = await Promise.all([
    sb
      .from('visits')
      .select(
        'id, location_id, visit_date, rep_name, outcomes, flier_version, fliers_left, notes, created_at',
      )
      .is('deleted_at', null)
      .order('visit_date', { ascending: false })
      .order('created_at', { ascending: false }),
    sb
      .from('locations')
      .select('id, street_address, city_town')
      .is('deleted_at', null),
  ])

  const rawVisits = (visitsRes.data ?? []) as RawVisit[]
  const rawLocations = (locationsRes.data ?? []) as RawLocation[]
  const locById = new Map(rawLocations.map(l => [l.id, l]))

  const visits: Visit[] = rawVisits
    .map(v => {
      const location = locById.get(v.location_id)
      if (!location) return null
      return { ...v, location }
    })
    .filter((v): v is Visit => v !== null)

  // Filter dropdowns derive from the unfiltered set so users can switch
  // between filters without losing options.
  const allReps = Array.from(new Set(visits.map(v => v.rep_name))).sort()
  const allCities = Array.from(
    new Set(visits.map(v => v.location.city_town)),
  ).sort()

  let filtered = visits
  if (params.rep) filtered = filtered.filter(v => v.rep_name === params.rep)
  if (params.city)
    filtered = filtered.filter(v => v.location.city_town === params.city)
  if (params.from) filtered = filtered.filter(v => v.visit_date >= params.from!)
  if (params.to) filtered = filtered.filter(v => v.visit_date <= params.to!)

  // Each outcome in each visit's outcomes array contributes 1 to its count.
  // A multi-outcome visit appears in multiple buckets — that's the point.
  const outcomeCounts = new Map<string, number>()
  for (const v of filtered) {
    for (const o of v.outcomes) {
      outcomeCounts.set(o, (outcomeCounts.get(o) ?? 0) + 1)
    }
  }
  const outcomeRows = Array.from(outcomeCounts.entries()).sort(
    (a, b) => b[1] - a[1],
  )

  const cityCounts = new Map<string, number>()
  for (const v of filtered) {
    cityCounts.set(
      v.location.city_town,
      (cityCounts.get(v.location.city_town) ?? 0) + 1,
    )
  }
  const cityRows = Array.from(cityCounts.entries()).sort(
    (a, b) => b[1] - a[1],
  )

  const hasFilters = !!(params.rep || params.city || params.from || params.to)

  return (
    <main className="mx-auto max-w-2xl px-6 py-8 pb-24">
      <PageHeader title="Dashboard" current="dashboard" />

      <form
        method="get"
        className="mb-6 space-y-3 rounded-xl bg-white p-4 ring-1 ring-stone-200"
      >
        <div className="grid grid-cols-2 gap-3">
          <FilterField label="Rep">
            <select
              name="rep"
              defaultValue={params.rep ?? ''}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {allReps.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="City / town">
            <select
              name="city"
              defaultValue={params.city ?? ''}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {allCities.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="From">
            <input
              type="date"
              name="from"
              defaultValue={params.from ?? ''}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </FilterField>
          <FilterField label="To">
            <input
              type="date"
              name="to"
              defaultValue={params.to ?? ''}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </FilterField>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white"
          >
            Apply
          </button>
          {hasFilters && (
            <Link
              href="/dashboard"
              className="text-sm text-stone-600 underline underline-offset-2"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <SummaryCard title="Visits">
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {filtered.length}
          </div>
          {hasFilters && (
            <p className="mt-1 text-xs text-stone-500">
              of {visits.length} total
            </p>
          )}
        </SummaryCard>
        <SummaryCard title="Outcomes">
          {outcomeRows.length === 0 ? (
            <p className="mt-1 text-sm text-stone-500">—</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {outcomeRows.map(([o, n]) => (
                <li key={o} className="flex justify-between gap-2">
                  <span className="text-stone-700">{outcomeLabel(o)}</span>
                  <span className="font-medium text-stone-900">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </SummaryCard>
        <div className="sm:col-span-2">
          <SummaryCard title="By city / town">
            {cityRows.length === 0 ? (
              <p className="mt-1 text-sm text-stone-500">—</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {cityRows.map(([c, n]) => (
                  <li key={c} className="flex justify-between gap-2">
                    <span className="text-stone-700">{c}</span>
                    <span className="font-medium text-stone-900">{n}</span>
                  </li>
                ))}
              </ul>
            )}
          </SummaryCard>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-stone-600">
          Recent visits
        </h2>
        {filtered.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center text-sm text-stone-500 ring-1 ring-stone-200">
            No visits match these filters.
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map(v => (
              <li key={v.id}>
                <VisitCard visit={v} location={v.location} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function FilterField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-600">
        {label}
      </label>
      {children}
    </div>
  )
}

function SummaryCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <h2 className="text-sm font-medium text-stone-600">{title}</h2>
      {children}
    </div>
  )
}
