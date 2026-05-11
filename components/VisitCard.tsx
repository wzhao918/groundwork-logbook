import Link from 'next/link'
import { outcomeLabel, flierVersionLabel } from '@/lib/enums'
import { formatDate } from '@/lib/format'

type VisitFields = {
  id: string
  visit_date: string
  rep_name: string
  outcomes: string[]
  flier_version: string | null
  fliers_left: number | null
  notes: string | null
}

type LocationFields = {
  id: string
  street_address: string
  city_town: string
}

// When `location` is provided (e.g., on the dashboard), the card shows the
// address as a link to that location's page. When omitted (e.g., on the
// per-location page itself), the card leads with date + rep instead.
// `editReturnUrl` is where the Edit link sends the user back to after save.
export function VisitCard({
  visit,
  location,
  editReturnUrl,
}: {
  visit: VisitFields
  location?: LocationFields
  editReturnUrl: string
}) {
  const flier = flierVersionLabel(visit.flier_version)
  const fliersLeftStr =
    visit.fliers_left !== null
      ? `${visit.fliers_left} flier${visit.fliers_left === 1 ? '' : 's'} left`
      : null
  const meta = [flier, fliersLeftStr].filter(Boolean).join(' · ')

  return (
    <article className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          {location ? (
            <Link href={`/locations/${location.id}`} className="block">
              <div className="text-sm font-medium text-stone-900 underline-offset-2 hover:underline">
                {location.street_address}
              </div>
              <div className="text-xs text-stone-600">
                {location.city_town}
              </div>
            </Link>
          ) : (
            <>
              <div className="text-sm font-medium text-stone-900">
                {formatDate(visit.visit_date)}
              </div>
              <div className="text-xs text-stone-700">{visit.rep_name}</div>
            </>
          )}
        </div>
        {location && (
          <div className="text-right">
            <div className="text-xs text-stone-500">
              {formatDate(visit.visit_date)}
            </div>
            <div className="text-xs text-stone-700">{visit.rep_name}</div>
          </div>
        )}
      </div>

      {visit.outcomes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {visit.outcomes.map(o => (
            <span
              key={o}
              className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-900"
            >
              {outcomeLabel(o)}
            </span>
          ))}
        </div>
      )}

      {meta && <div className="mt-2 text-xs text-stone-600">{meta}</div>}

      {visit.notes && (
        <p className="mt-2 text-sm text-stone-700">{visit.notes}</p>
      )}

      <div className="mt-3 flex justify-end">
        <Link
          href={`/visits/${visit.id}/edit?return=${encodeURIComponent(editReturnUrl)}`}
          className="text-xs text-stone-500 underline underline-offset-2 hover:text-stone-700"
        >
          Edit
        </Link>
      </div>
    </article>
  )
}
