import Link from 'next/link'
import { SignOutButton } from './SignOutButton'

type NavKey = 'log' | 'dashboard' | 'locations'

const NAV_ITEMS: { key: NavKey; href: string; label: string }[] = [
  { key: 'log', href: '/log', label: 'Log' },
  { key: 'dashboard', href: '/dashboard', label: 'Dashboard' },
  { key: 'locations', href: '/locations', label: 'Locations' },
]

export function PageHeader({
  title,
  current,
}: {
  title: string
  current: NavKey
}) {
  const others = NAV_ITEMS.filter(i => i.key !== current)
  return (
    <header className="mb-6 flex items-baseline justify-between gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <nav className="flex items-baseline gap-3 text-sm">
        {others.map(i => (
          <Link
            key={i.key}
            href={i.href}
            className="text-stone-600 underline underline-offset-2"
          >
            {i.label}
          </Link>
        ))}
        <span className="text-stone-300">·</span>
        <SignOutButton />
      </nav>
    </header>
  )
}
