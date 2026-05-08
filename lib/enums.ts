// Single source of truth for the enum-ish strings used across the app.
// Change these here and the form, dashboard, and types all follow.

export const OUTCOMES = [
  { value: 'posted_flier',          label: 'Posted a flier' },
  { value: 'left_stack_with_staff', label: 'Left a stack with staff' },
  { value: 'had_conversation',      label: 'Had a conversation' },
  { value: 'turned_away',           label: 'Turned away' },
  { value: 'no_answer',             label: 'No answer' },
  { value: 'location_closed',       label: 'Location closed' },
] as const

export type OutcomeValue = (typeof OUTCOMES)[number]['value']

export const FLIER_VERSIONS = [
  { value: 'design_1', label: 'Design 1' },
  { value: 'design_2', label: 'Design 2' },
] as const

export type FlierVersion = (typeof FLIER_VERSIONS)[number]['value']

// Suggested city/town options for the address picker. Free-text fallback.
export const CITY_TOWN_SUGGESTIONS = ['Boston', 'Fall River'] as const
