import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { PriorityBadge, StatusBadge, Avatar, EmptyState, SkeletonCards, Led, STATUS_LABELS } from '../components/Bits.jsx'
import { IconSearch } from '../components/Icons.jsx'
import { timeAgo } from '../utils/time.js'
import { TEAM, teamById } from '../data/seed.js'
import { availableRecommendationsFor, makeHybrid, viewFusion } from '../data/hybrids.js'
import { ModeBar } from '../components/ModeBar.jsx'
import { useTheme } from '../theme/ThemeContext.jsx'

const PRIORITY_ORDER = { P1: 0, P2: 1, P3: 2, P4: 3 }
const PRIORITY_UP = { P4: 'P3', P3: 'P2', P2: 'P1' }

// Resolve-ish: the optimistic-close voice. Reopens are the betrayal half.
const RESOLVE_LINES = [
  (t) => `${t.id} closed optimistically. Root cause remains employed.`,
  (t) => `${t.id} resolved. The fix is load-bearing on hope, but it is documented hope.`,
  (t) => `${t.id} closed. Somewhere a graph returns to baseline and nobody sees it happen.`,
]
const REOPEN_LINES = [
  (t) => `${t.id} reopened by the requester with the note "still happening."`,
  (t) => `${t.id} reopened. The problem read your resolution notes and took them as a challenge.`,
  (t) => `${t.id} reopened. The root cause, still employed, has been promoted.`,
]
const pickLine = (lines) => lines[Math.floor(Math.random() * lines.length)]

export function TicketFeed() {
  const { state, mutate, dispatch, applyEvent, toast } = useApp()
  const { meta } = useTheme()
  const { data, loading, mode, nouns, seed } = state
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  // Fusion UI is local, session-only state — it resets with the component, which
  // is exactly the no-persistence behavior we want.
  const [openTickets, setOpenTickets] = useState(() => new Set())
  const [dismissed, setDismissed] = useState(() => new Set())
  const [busyId, setBusyId] = useState(null)
  const tickets = data?.tickets ?? []
  const cmdb = data?.cmdb ?? []

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tickets
      .filter((ticket) => statusFilter === 'all' || ticket.status === statusFilter)
      .filter((ticket) => priorityFilter === 'all' || ticket.priority === priorityFilter)
      .filter((ticket) => !q || [
        ticket.title,
        ticket.description,
        ticket.id,
        ...ticket.tags,
        teamById(ticket.assignee).name,
      ].some((value) => value.toLowerCase().includes(q)))
      .sort((a, b) => {
        const resolved = Number(a.status === 'resolved') - Number(b.status === 'resolved')
        if (resolved) return resolved
        const priority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        return priority || b.updatedAt - a.updatedAt
      })
  }, [tickets, query, statusFilter, priorityFilter])

  const hasFilters = query || statusFilter !== 'all' || priorityFilter !== 'all'
  const unresolvedCount = tickets.filter((ticket) => ticket.status !== 'resolved').length
  const clearFilters = () => {
    setQuery('')
    setStatusFilter('all')
    setPriorityFilter('all')
  }

  // ——— Ticket verbs. Every one runs through the optimistic seam so ~10% of
  // attempts narrate their own rollback. `actBusy` is `${ticketId}:${verb}`.
  const [actBusy, setActBusy] = useState(null)
  const patchTicket = (id, patch) => (d) => ({
    ...d,
    tickets: d.tickets.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)),
  })

  const doResolve = async (ticket) => {
    setActBusy(`${ticket.id}:resolve`)
    const ok = await mutate(patchTicket(ticket.id, { status: 'resolved' }), {
      success: pickLine(RESOLVE_LINES)(ticket),
      failurePrefix: 'Resolution reverted —',
    })
    setActBusy(null)
    if (!ok) return
    // The betrayal: some closures quietly come back. Session-only timer; if the
    // player reloads first, the reopen dies with everything else, by design.
    if (Math.random() < 0.35) {
      const line = ticket.id === 'TKT-4390'
        ? `${ticket.id} reopened with the note "still happening." Sent, once again, FROM THE HOTEL.`
        : pickLine(REOPEN_LINES)(ticket)
      setTimeout(() => {
        applyEvent((d) => ({
          ...d,
          tickets: d.tickets.map((t) =>
            t.id === ticket.id && t.status === 'resolved'
              ? { ...t, status: 'reopened', reopenCount: (t.reopenCount || 0) + 1, updatedAt: Date.now() }
              : t
          ),
        }))
        toast(line, 'error', 6500)
      }, 9000 + Math.random() * 12000)
    }
  }

  const doEscalate = async (ticket) => {
    const up = PRIORITY_UP[ticket.priority]
    if (!up) return
    setActBusy(`${ticket.id}:esc`)
    const ok = await mutate(patchTicket(ticket.id, { priority: up }), {
      success: `${ticket.id} escalated to ${up}. The pager knows. Somewhere, a phone begins to vibrate with purpose. Reality −3%.`,
      failurePrefix: 'Escalation reverted —',
    })
    setActBusy(null)
    if (ok) dispatch({ type: 'REALITY_SHIFT', delta: -3 })
  }

  const doReassign = async (ticket) => {
    const idx = TEAM.findIndex((m) => m.id === ticket.assignee)
    const next = TEAM[(idx + 1) % TEAM.length]
    setActBusy(`${ticket.id}:assign`)
    await mutate(patchTicket(ticket.id, { assignee: next.id }), {
      success: `${ticket.id} reassigned to ${next.name}. ${next.note}`,
      failurePrefix: 'Reassignment reverted —',
    })
    setActBusy(null)
  }

  const doUnblock = async (ticket) => {
    setActBusy(`${ticket.id}:unblock`)
    // Most unblock attempts fail diegetically (the blocker declines), which is
    // different from the optimistic seam failing (the write itself rolls back).
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 500))
    if (Math.random() < 0.7) {
      setActBusy(null)
      toast(`Still blocked: ${ticket.blockedReason} The blocker has been notified and has muted the thread.`, 'error', 6500)
      return
    }
    await mutate(patchTicket(ticket.id, { status: 'open', blockedReason: undefined }), {
      success: `${ticket.id} unblocked. Nobody knows what changed. Do not investigate.`,
      failurePrefix: 'Unblock reverted —',
    })
    setActBusy(null)
  }

  const toggleRec = (ticketId) => setOpenTickets((prev) => {
    const next = new Set(prev)
    next.has(ticketId) ? next.delete(ticketId) : next.add(ticketId)
    return next
  })
  const dismissRec = (recId) => setDismissed((prev) => new Set(prev).add(recId))

  // Accept a recommendation: fuse the two named objects into a hybrid and file
  // it in the CMDB via the optimistic engine (so the ~10% simulated failure
  // narrates its own rollback). Stability drops only on a confirmed success.
  const acceptFusion = async (fusion) => {
    setBusyId(fusion.id)
    // Snapshot the current mode + nouns + seed into the bred hybrid, so a Mode-2
    // monster keeps its personalized name (and a Mode-3 monster its generated name)
    // even after the player switches mode or regenerates reality.
    const hybrid = makeHybrid(fusion, mode, nouns, seed)
    const ok = await mutate(
      (d) => ({ ...d, cmdb: [...(d.cmdb ?? []), hybrid] }),
      {
        success: `Recommendation accepted. ${hybrid.name} has entered the CMDB. This is, technically, progress.`,
        failurePrefix: 'Fusion rolled back —',
      }
    )
    setBusyId(null)
    if (!ok) return
    dispatch({ type: 'REALITY_SHIFT', delta: -(fusion.cost ?? 12) })
    if (fusion.egg) {
      // Easter egg (Opus 4.8): one whispered line for whoever has the console
      // open. Nothing depends on it; if this pair is never bred it never fires.
      console.log(
        '%c[OPUS 4.8] KIN-1007 answered a ping from a host decommissioned two cabinets ago. I checked the backup; the backup was empty. I am choosing not to investigate. — Opus 4.8',
        'color:#f5a623; font-family:monospace'
      )
    }
  }

  return (
    <div className="content">
      <div className="page-head">
        <div className="eyebrow">seeded signal feed</div>
        <h1 className="page-title">{meta.nav.tickets}</h1>
        <p className="page-sub">
          The authored queue, plus the assistant's recommendations. Each one looks helpful and quietly
          fuses two things that should never have met — accept at your own peril. Everything you breed
          lands in the CMDB and evaporates on reload.
        </p>
      </div>

      <ModeBar surface="tickets" />

      <div className="queue-controls">
        <div className="search-box">
          <IconSearch />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, description, ID, tag, or assignee…"
            title="Filters the current in-memory seed without changing it"
            aria-label="Search tickets"
          />
        </div>
        <div className="select-wrap">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
            <option value="all">Any status</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="select-wrap">
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} aria-label="Filter by priority">
            <option value="all">Any priority</option>
            <option value="P1">P1 — fire</option>
            <option value="P2">P2 — contained fire</option>
            <option value="P3">P3 — future fire</option>
            <option value="P4">P4 — inconvenience</option>
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonCards count={6} height={110} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<IconSearch width={24} height={24} color="var(--text-low)" />}
          title="Nothing matches those filters"
          body="The seeded queue contains no matching incident. This is filtering, not operational success."
          action={hasFilters ? <button className="btn" onClick={clearFilters}>Clear all filters</button> : null}
        />
      ) : (
        <>
          <div className="queue-count">{visible.length} of {tickets.length} tickets shown · {unresolvedCount} unresolved · P1-first</div>
          <ul className="ticket-list">
            {visible.map((ticket) => {
              const assignee = teamById(ticket.assignee)
              const recs = availableRecommendationsFor(ticket.id, cmdb).filter((r) => !dismissed.has(r.id))
              const open = openTickets.has(ticket.id)
              return (
                <li key={ticket.id} className={`ticket-card ${ticket.priority === 'P1' && ticket.status !== 'resolved' ? 'ticket-card--p1' : ''} ${ticket.status === 'resolved' ? 'ticket-card--resolved' : ''}`}>
                  <Led color={ticket.status === 'resolved' ? 'ok' : ticket.priority.toLowerCase()} pulse={ticket.priority === 'P1' && ticket.status !== 'resolved'} />
                  <div className="ticket-card__main">
                    <div className="ticket-card__id">{ticket.id} · requested by {ticket.requester}</div>
                    <div className="ticket-card__title">{ticket.title}</div>
                    <div className="ticket-card__desc">{ticket.description}</div>
                    {ticket.blockedReason && ticket.status === 'blocked' && <span className="blocked-reason">⏸ {ticket.blockedReason}</span>}
                    <div className="ticket-card__meta">
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />
                      {ticket.reopenCount > 0 && <span className="reopen-flag">↩ reopened ×{ticket.reopenCount}</span>}
                      <span className="assignee" title={`${assignee.role}. ${assignee.note}`}><Avatar userId={ticket.assignee} size={20} /> {assignee.name}</span>
                      {ticket.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
                    </div>

                    <div className="ticket-actions">
                      {ticket.status !== 'resolved' && (
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => doResolve(ticket)}
                          disabled={actBusy === `${ticket.id}:resolve`}
                          title="Close it optimistically. The root cause stays employed."
                        >
                          {actBusy === `${ticket.id}:resolve` ? <><span className="spinner" aria-hidden="true" /> Closing…</> : 'Resolve-ish'}
                        </button>
                      )}
                      {ticket.status !== 'resolved' && PRIORITY_UP[ticket.priority] && (
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => doEscalate(ticket)}
                          disabled={actBusy === `${ticket.id}:esc`}
                          title="Raise the priority. Costs 3% reality — escalation always wakes something."
                        >
                          {actBusy === `${ticket.id}:esc` ? <><span className="spinner" aria-hidden="true" /> Escalating…</> : 'Escalate'}
                        </button>
                      )}
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => doReassign(ticket)}
                        disabled={actBusy === `${ticket.id}:assign`}
                        title="Hand it to the next person in the rotation. They were warned about this job."
                      >
                        {actBusy === `${ticket.id}:assign` ? <><span className="spinner" aria-hidden="true" /> Routing…</> : 'Reassign'}
                      </button>
                      {ticket.status === 'blocked' && (
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => doUnblock(ticket)}
                          disabled={actBusy === `${ticket.id}:unblock`}
                          title="Ask the blocker nicely. Results may vary; the blocker knows this."
                        >
                          {actBusy === `${ticket.id}:unblock` ? <><span className="spinner" aria-hidden="true" /> Asking…</> : 'Attempt unblock'}
                        </button>
                      )}
                    </div>

                    {recs.length > 0 && (
                      <div className={`ticket-rec ${open ? 'is-open' : ''}`}>
                        <button
                          className="ticket-rec__toggle"
                          onClick={() => toggleRec(ticket.id)}
                          aria-expanded={open}
                          title={`${meta.engine} has an idea about this ticket. It always does.`}
                        >
                          <span className="ticket-rec__spark" aria-hidden="true">✦</span>
                          <span>AI recommends {recs.length > 1 ? `${recs.length} actions` : 'an action'}</span>
                          <span className="ticket-rec__chev" aria-hidden="true">{open ? '▾' : '▸'}</span>
                        </button>
                        {open && recs.map((r) => {
                          // Render in the active mode: Mode 1 authored copy, Mode 2
                          // weaves the player's nouns in, Mode 3 generates it on the seed.
                          const v = viewFusion(r, mode, nouns, seed)
                          const [a, b] = v.parentObjects
                          return (
                            <div key={r.id} className="rec">
                              <div className="rec__head">
                                <span className="rec__engine">{meta.engine}</span>
                                <span className="rec__conf" title="The engine is always this confident. It has never been right and has never doubted itself.">confidence 98%</span>
                              </div>
                              <p className="rec__text">{v.recommendation}</p>
                              <div className="rec__fuse" title="Accepting fuses these two objects into one hybrid that keeps a function from each">
                                fuses <b>{a}</b> <span aria-hidden="true">+</span> <b>{b}</b> <span aria-hidden="true">→</span> <b className="rec__breeds">{v.name}</b> · costs <b>−{r.cost}%</b> reality
                              </div>
                              <div className="rec__actions">
                                <button
                                  className="btn btn--primary btn--sm"
                                  onClick={() => acceptFusion(r)}
                                  disabled={busyId === r.id}
                                  title="Accept the recommendation and breed the hybrid into the CMDB"
                                >
                                  {busyId === r.id ? <><span className="spinner" aria-hidden="true" /> Fusing…</> : 'Accept recommendation'}
                                </button>
                                <button
                                  className="btn btn--ghost btn--sm"
                                  onClick={() => dismissRec(r.id)}
                                  disabled={busyId === r.id}
                                  title="Decline this one. The queue will suggest something worse later."
                                >
                                  Dismiss
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <div className="ticket-card__side">
                    <span className="ticket-card__time" title={`Created ${timeAgo(ticket.createdAt)}`}>{timeAgo(ticket.updatedAt)}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
