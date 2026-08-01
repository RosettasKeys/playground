// Small shared pieces: LEDs, badges, avatars, empty states, skeletons.

import { teamById } from '../data/seed.js'

export function Led({ color = 'ok', pulse = false, blink = false, title }) {
  const cls = ['led', `led--${color}`, pulse && 'led--pulse', blink && 'led--blink'].filter(Boolean).join(' ')
  return <span className={cls} title={title} aria-hidden="true" />
}

export function PriorityBadge({ priority }) {
  const meaning = {
    P1: 'P1 — everything is on fire and the fire is spreading',
    P2: 'P2 — on fire, but politely, in a contained area',
    P3: 'P3 — will become a fire if ignored, which it will be',
    P4: 'P4 — someone is mildly inconvenienced, possibly Janet',
  }
  return <span className={`badge badge--${priority}`} title={meaning[priority]}>{priority}</span>
}

export const STATUS_LABELS = {
  'open': 'Open',
  'in-progress': 'In progress',
  'blocked': 'Blocked',
  'resolved': 'Resolved',
  'reopened': 'Reopened',
}

export function StatusBadge({ status }) {
  const meaning = {
    'open': 'Open — acknowledged to exist, which is a start',
    'in-progress': 'In progress — a human is actively poking at it',
    'blocked': 'Blocked — waiting on someone who is not us',
    'resolved': 'Resolved — fixed, pending the requester’s appeal',
    'reopened': 'Reopened — the requester has filed their appeal',
  }
  return <span className={`badge badge--status badge--${status}`} title={meaning[status]}>{STATUS_LABELS[status]}</span>
}

export function SevBadge({ sev }) {
  const meaning = {
    SEV1: 'SEV1 — customer-facing, executive-summoning, sleep-cancelling',
    SEV2: 'SEV2 — serious degradation; the pager is warm',
    SEV3: 'SEV3 — annoying but survivable; monitor and mutter',
  }
  return <span className={`badge badge--status badge--${sev}`} title={meaning[sev]}>{sev}</span>
}

export function Avatar({ userId, size }) {
  const u = teamById(userId)
  return (
    <span className="avatar" style={size ? { width: size, height: size, fontSize: size * 0.38 } : undefined} title={`${u.name} — ${u.role}. ${u.note}`}>
      {u.initials}
    </span>
  )
}

export function EmptyState({ icon, title, body, action }) {
  return (
    <div className="empty" role="status">
      <div className="empty__art">{icon}</div>
      <div className="empty__title">{title}</div>
      <p className="empty__body">{body}</p>
      {action}
    </div>
  )
}

export function Skel({ h = 12, w = '100%', style }) {
  return <div className="skel" style={{ height: h, width: w, ...style }} aria-hidden="true" />
}

export function SkeletonCards({ count = 4, height = 92 }) {
  return (
    <div className="ticket-list" aria-label="Loading" role="status">
      {Array.from({ length: count }, (_, i) => (
        <Skel key={i} h={height} style={{ borderRadius: 'var(--radius)' }} />
      ))}
    </div>
  )
}
