// Minimal inline icon set — 16px stroke icons, inherit currentColor.

const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const IconSearch = (p) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
)
export const IconPlus = (p) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
)
export const IconX = (p) => (
  <svg {...base} {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>
)
export const IconMenu = (p) => (
  <svg {...base} {...p}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
)
export const IconLogout = (p) => (
  <svg {...base} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
)
export const IconCopy = (p) => (
  <svg {...base} {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
)
export const IconCheck = (p) => (
  <svg {...base} {...p}><path d="M20 6 9 17l-5-5" /></svg>
)
export const IconEdit = (p) => (
  <svg {...base} {...p}><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
)
export const IconFlame = (p) => (
  <svg {...base} {...p}><path d="M12 22c4.4 0 7-2.8 7-6.5 0-3-1.7-5-3-6.5-.4 1.5-1.2 2.3-2 2.5.5-2.5-.5-6-4-8.5.3 3-1 4.6-2.5 6.3C6 11 5 12.8 5 15.5 5 19.2 7.6 22 12 22Z" /></svg>
)
export const IconTornado = (p) => (
  <svg {...base} {...p}><path d="M21 4H3M18.5 8h-13M16 12H8M14.5 16h-5M13 20h-2" /></svg>
)
export const IconCoffee = (p) => (
  <svg {...base} {...p}><path d="M17 8h1a3 3 0 0 1 0 6h-1" /><path d="M3 8h14v6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8Z" /><path d="M7 2v2M11 2v2M15 2v2" /></svg>
)
