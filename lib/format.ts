// Append T00:00:00 so the date string is parsed in local time, not UTC —
// otherwise a "2026-05-08" visit shows as May 7 for any negative-offset zone.
export function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
