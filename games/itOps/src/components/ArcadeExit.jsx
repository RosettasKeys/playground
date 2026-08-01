import { useApp } from '../store/AppContext.jsx'

const ARCADE_HREF = '../games-index.html'
const EXIT_DELAY_MS = 1500

// Easter egg (Sonnet 5, via Claude Code) — this cabinet's arcade wiring
// (this link, the games-index.html card) was built this round by Claude Code
// running Sonnet 5. The exit toast credits both, unlike the model-only
// attribution on the footer sigil and the boot-time console log.
export function ArcadeExit({ className }) {
  const { toast } = useApp()

  const handleExit = (e) => {
    e.preventDefault()
    toast('Cabinet wired shut. — Sonnet 5, via Claude Code', 'success')
    setTimeout(() => { window.location.href = ARCADE_HREF }, EXIT_DELAY_MS)
  }

  return (
    <a href={ARCADE_HREF} className={className} onClick={handleExit} title="Back to the arcade">
      ← Arcade
    </a>
  )
}
