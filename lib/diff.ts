// Compute the changed fields between two objects of the same shape.
// Returns null if nothing changed — callers can skip writing an audit row.
export function computeDiff<T extends Record<string, unknown>>(
  before: T,
  after: T,
): { before: Partial<T>; after: Partial<T> } | null {
  const beforeChanged: Partial<T> = {}
  const afterChanged: Partial<T> = {}
  let any = false
  for (const k of Object.keys(after) as (keyof T)[]) {
    // JSON compare — handles arrays (outcomes) and primitives consistently.
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
      beforeChanged[k] = before[k]
      afterChanged[k] = after[k]
      any = true
    }
  }
  return any ? { before: beforeChanged, after: afterChanged } : null
}
