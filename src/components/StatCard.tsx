import type { ReactNode } from 'react'

export function StatCard({ label, value, detail, icon, tone = 'lime' }: { label: string; value: string; detail: string; icon?: ReactNode; tone?: 'lime' | 'orange' | 'blue' | 'purple' }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__top"><span>{label}</span>{icon}</div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}
