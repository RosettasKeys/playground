// Relative timestamps, formatted the way an exhausted human reads a queue.

export function timeAgo(ts) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function clockIn(tzLabel, offsetHours) {
  const utc = Date.now() + new Date().getTimezoneOffset() * 60000
  const t = new Date(utc + offsetHours * 3600000)
  const hh = String(t.getHours()).padStart(2, '0')
  const mm = String(t.getMinutes()).padStart(2, '0')
  return `${tzLabel} ${hh}:${mm}`
}
