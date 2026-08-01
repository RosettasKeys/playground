import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { Skel, EmptyState } from '../components/Bits.jsx'
import { ModeBar } from '../components/ModeBar.jsx'
import { IconSearch } from '../components/Icons.jsx'
import { EFFICIENCY_TIPS } from '../data/seed.js'
import { interpolate } from '../data/personalize.js'
import { gen3Tip, gen3Outcome } from '../data/synthesize.js'

export function Tips() {
  const { state, mutate, dispatch } = useApp()
  const { mode, nouns, seed } = state
  const [category, setCategory] = useState('all')
  const [adopting, setAdopting] = useState(null)
  const [adopted, setAdopted] = useState(() => new Set())

  // Mode 1 is the authored text verbatim; Mode 2 weaves the player's nouns into the
  // tip body (falling back to the base copy when a tip has no Mode-2 variant);
  // Mode 3 generates the body live on the seed, keeping the real title + category.
  const bodyOf = (t) =>
    mode === 3 ? gen3Tip(seed, t.id, { category: t.category })
      : mode === 2 ? interpolate(t.body2 ?? t.body, nouns)
      : t.body

  // Adopt: commit to the tip and let the outcome narrate itself. The sincere
  // craft tips restore a little reality; the HR-flavored advice backfires —
  // both are stated up front in the button title, because informed consent is
  // the last governance control still functioning here.
  const adoptLineOf = (t) => {
    if (mode === 3) return gen3Outcome(seed, t.id)
    if (mode === 2) return interpolate(t.adopt2 ?? t.adopt, nouns)
    return t.adopt
  }

  const adoptTip = async (t) => {
    setAdopting(t.id)
    const delta = t.adoptDelta ?? 0
    const ok = await mutate((d) => d, {
      success: adoptLineOf(t),
      failurePrefix: 'Adoption reverted —',
    })
    setAdopting(null)
    if (!ok) return
    setAdopted((prev) => new Set(prev).add(t.id))
    if (delta) dispatch({ type: 'REALITY_SHIFT', delta })
  }

  const categories = useMemo(
    () => ['all', ...new Set(EFFICIENCY_TIPS.map((t) => t.category))],
    []
  )
  const visible = EFFICIENCY_TIPS.filter((t) => category === 'all' || t.category === category)

  return (
    <div className="content">
      <div className="page-head">
        <div className="eyebrow">survival kit · 02</div>
        <h1 className="page-title">Unhinged Efficiency Tips</h1>
        <p className="page-sub">
          Operational wisdom extracted from outages the hard way. None of it is theoretical;
          every tip has a ticket number, a scar, or a weather event behind it.
        </p>
      </div>

      <ModeBar surface="tips" />

      <div className="queue-controls">
        <div className="select-wrap">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            title="Show only tips from one category of suffering"
            aria-label="Filter tips by category"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
            ))}
          </select>
        </div>
        <span className="queue-count" style={{ marginBottom: 0 }}>
          {visible.length} tip{visible.length !== 1 ? 's' : ''} · each one paid for in full
        </span>
      </div>

      {state.loading ? (
        <div className="card-grid" role="status" aria-label="Loading tips">
          {[0, 1, 2, 3].map((i) => <Skel key={i} h={140} style={{ borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<IconSearch width={24} height={24} color="var(--text-low)" />}
          title="No tips in that category"
          body="Which is strange, because suffering is usually well distributed. Pick another category."
          action={<button className="btn" onClick={() => setCategory('all')} title="Show every tip again">Show all tips</button>}
        />
      ) : (
        <div className="card-grid">
          {visible.map((t) => (
            <article key={t.id} className="card tip-card">
              <div className="tip-card__head">
                <h2 className="tip-card__title">{t.title}</h2>
                <span className="chip" title={`Category: ${t.category}`}>{t.category}</span>
              </div>
              <p className="tip-card__body">{bodyOf(t)}</p>
              <div className="tip-card__foot">
                {adopted.has(t.id) ? (
                  <span className="chip chip--adopted" title="Adopted this session. Resets on reload, like all growth here.">✓ adopted</span>
                ) : (
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => adoptTip(t)}
                    disabled={adopting === t.id}
                    title={
                      (t.adoptDelta ?? 0) > 0
                        ? `Put it into practice. Restores ${t.adoptDelta}% reality.`
                        : (t.adoptDelta ?? 0) < 0
                          ? `Put it into practice. Costs ${Math.abs(t.adoptDelta)}% reality — some advice is a trap with a lanyard.`
                          : 'Put it into practice and see what happens'
                    }
                  >
                    {adopting === t.id ? <><span className="spinner" aria-hidden="true" /> Adopting…</> : 'Adopt tip'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
