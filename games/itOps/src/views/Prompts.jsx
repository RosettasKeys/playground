import { useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { Skel } from '../components/Bits.jsx'
import { ModeBar } from '../components/ModeBar.jsx'
import { IconCopy, IconCheck } from '../components/Icons.jsx'
import { AI_PROMPTS } from '../data/seed.js'
import { interpolate } from '../data/personalize.js'
import { gen3Prompt, gen3Outcome } from '../data/synthesize.js'

export function Prompts() {
  const { state, toast, mutate, dispatch } = useApp()
  const { mode, nouns, seed } = state
  const [copied, setCopied] = useState(null)
  const [testing, setTesting] = useState(null)
  const [tested, setTested] = useState(() => new Set())

  // Mode 1 ships the authored prompt verbatim; Mode 2 slots the player's nouns
  // into the curated template (falling back to the base copy when a prompt has no
  // Mode-2 variant); Mode 3 generates the when-line and body live on the seed,
  // keeping the real title + category. Whatever is shown is exactly what copies.
  const view = (p) => {
    if (mode === 2) {
      return { ...p, when: interpolate(p.when2 ?? p.when, nouns), prompt: interpolate(p.prompt2 ?? p.prompt, nouns) }
    }
    if (mode === 3) {
      return { ...p, ...gen3Prompt(seed, p.id, { category: p.category }) }
    }
    return p
  }

  // Field-test: run the prompt against the fake service. The outcome line is
  // authored (Mode 1), noun-woven (Mode 2), or generated on the seed (Mode 3);
  // a few prompts bend reality a little when they work (`testDelta`).
  const outcomeOf = (p) => {
    if (mode === 3) return gen3Outcome(seed, p.id)
    if (mode === 2) return interpolate(p.test2 ?? p.test, nouns)
    return p.test
  }

  const fieldTest = async (p) => {
    setTesting(p.id)
    const ok = await mutate((d) => d, {
      success: outcomeOf(p),
      failurePrefix: 'Field test aborted —',
    })
    setTesting(null)
    if (!ok) return
    setTested((prev) => new Set(prev).add(p.id))
    if (p.testDelta) dispatch({ type: 'REALITY_SHIFT', delta: p.testDelta })
  }

  const copy = async (p) => {
    try {
      await navigator.clipboard.writeText(p.prompt)
      setCopied(p.id)
      toast(`"${p.title}" copied. Paste it into your AI of choice and let the machine absorb some of the damage.`, 'success')
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast('Clipboard access denied by the browser — select the text and copy it the ancestral way.', 'error')
    }
  }

  return (
    <div className="content">
      <div className="page-head">
        <div className="eyebrow">survival kit · 01</div>
        <h1 className="page-title">Recommended Unhinged AI Prompts</h1>
        <p className="page-sub">
          Field-tested prompts for delegating the parts of this job that are slowly killing you:
          RCAs the change board will accept, dispatches a field tech will actually read, and
          replies to Janet that survive legal review. Copy, paste, adapt the nouns.
        </p>
      </div>

      <ModeBar surface="prompts" />

      {state.loading ? (
        <div className="card-grid" role="status" aria-label="Loading prompts">
          {[0, 1, 2, 3].map((i) => <Skel key={i} h={260} style={{ borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : (
        <div className="card-grid">
          {AI_PROMPTS.map((p) => {
            const vp = view(p)
            return (
            <article key={p.id} className="card prompt-card">
              <div className="prompt-card__head">
                <h2 className="prompt-card__title">{p.title}</h2>
                <span className="chip" title={`Category: ${p.category} — the flavor of chaos this prompt handles`}>{p.category}</span>
              </div>
              <p className="prompt-card__when">{vp.when}</p>
              <div className="prompt-card__text">{vp.prompt}</div>
              <div className="prompt-card__foot">
                <button
                  className="btn btn--sm"
                  onClick={() => copy(vp)}
                  title="Copy the full prompt text to your clipboard, ready to paste into any AI assistant"
                >
                  {copied === p.id ? <><IconCheck width={13} height={13} /> Copied</> : <><IconCopy width={13} height={13} /> Copy prompt</>}
                </button>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => fieldTest(p)}
                  disabled={testing === p.id}
                  title={p.testDelta ? 'Run it against the live queue. This one has side effects on reality.' : 'Run it against the live queue and see what comes back'}
                >
                  {testing === p.id
                    ? <><span className="spinner" aria-hidden="true" /> Testing…</>
                    : tested.has(p.id) ? 'Field-test again' : 'Field-test'}
                </button>
              </div>
            </article>
          )})}
        </div>
      )}
    </div>
  )
}
