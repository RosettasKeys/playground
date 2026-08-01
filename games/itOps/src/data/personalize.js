// Phase 2 / Mode 2 — the personalization engine.
//
// Mode 2 does NOT generate content freely (that is Mode 3, a later phase). It
// takes a small set of player-typed nouns and slots them into CURATED templates
// authored here and across the content files. The curated verbs/structure keep
// the joke intact; the player just supplies the real IT noun. Everything here is
// deterministic — no RNG, no persistence. Mode + nouns live in memory (see
// AppContext) and reset on reload.

// The player-supplied slots. Kept small on purpose: a couple of real nouns is
// enough to make the console feel personal without betting the humor on the
// player's improv. Blank input always falls back so output never reads "" or
// "undefined".
export const NOUN_SLOTS = [
  {
    key: 'nemesis',
    label: 'A coworker who tests you',
    placeholder: 'e.g. Janet',
    fallback: 'Janet',
  },
  {
    key: 'device',
    label: 'A device on your desk right now',
    placeholder: 'e.g. the label printer',
    fallback: 'the desk label printer',
  },
  {
    key: 'place',
    label: 'A room in your building',
    placeholder: 'e.g. the server closet',
    fallback: 'the server closet',
  },
  {
    key: 'ritual',
    label: 'A thing you do to cope',
    placeholder: 'e.g. refilling the coffee',
    fallback: 'refilling the coffee',
  },
]

const SLOT_KEYS = NOUN_SLOTS.map((s) => s.key)
const FALLBACKS = Object.fromEntries(NOUN_SLOTS.map((s) => [s.key, s.fallback]))

// Curated deadpan pools for the "Surprise me" button. This is NOT free-text /
// RNG chaos — it is a fixed, hand-authored list per slot, so the output stays
// on-voice and coherent. Selection rotates deterministically (see surpriseNouns)
// so repeated clicks vary without importing Phase 3's seeded RNG.
export const SURPRISE_POOLS = {
  nemesis: ['Dave from Finance', 'the vendor TAM', 'Janet', 'the change board', 'the new hire'],
  device: ['the ticket printer', 'a label maker', 'the desk phone nobody answers', 'a second monitor', 'the barcode scanner'],
  place: ['the server closet', 'the breakroom', 'the network cage', 'the loading dock', 'the on-call couch'],
  ritual: ['refilling the coffee', 'muting the channel', 'closing the same ticket twice', 'staring at the graph', 'ignoring the pager'],
}

// A stable-per-app-load rotation offset so "Surprise me" doesn't return the same
// first item forever, without persisting anything. Advances each click.
let surpriseTick = 0

// Fill in a complete noun map, applying fallbacks for any blank/missing slot.
// Trims whitespace; a slot that is only spaces counts as blank.
export function fillNouns(nouns = {}) {
  const out = {}
  for (const key of SLOT_KEYS) {
    const typed = typeof nouns[key] === 'string' ? nouns[key].trim() : ''
    out[key] = typed || FALLBACKS[key]
  }
  return out
}

// Substitute {slot} tokens in a template string using the filled noun map.
// Unknown tokens are left untouched so authored copy can use literal braces
// safely. This is the whole "curated template does the fusing around the noun"
// mechanic.
export function interpolate(template, nouns = {}) {
  if (typeof template !== 'string') return template
  const filled = fillNouns(nouns)
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.hasOwn(filled, key) ? filled[key] : match
  )
}

// One click of "Surprise me": pick a curated value for every slot, rotating the
// starting index so successive clicks differ. Deterministic given the tick.
export function surpriseNouns() {
  const pick = {}
  const i = surpriseTick++
  for (const key of SLOT_KEYS) {
    const pool = SURPRISE_POOLS[key] || [FALLBACKS[key]]
    pick[key] = pool[i % pool.length]
  }
  return pick
}
