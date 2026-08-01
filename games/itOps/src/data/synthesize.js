// Phase 3 / Mode 3 — the synthetic-content generation engine.
//
// Modes 1 and 2 are curated: hand-authored copy (Mode 1) and player nouns slotted
// into curated templates (Mode 2). Mode 3 is different — it GENERATES the surface
// copy live from curated word pools, fused at render time by a seedable RNG. The
// player supplies only a seed, never the words.
//
// Two rules keep this from reading as word salad:
//   1. GOALS' "one real IT noun per line": every generated line is anchored by at
//      least one genuinely real IT term (`realNoun` / `realNounBare`), or by the
//      two real in-play parent objects on a fusion card. Everything else is absurd.
//   2. It is DETERMINISTIC per seed. A given (seed, item) always renders the same
//      text — no reshuffling on re-render — so "regenerate reality" produces a
//      fresh-but-stable batch by changing the seed, never a live reshuffle.
//
// Nothing here persists. The seed lives in memory (AppContext) and resets on
// reload, exactly like `mode`, `nouns`, and `reality`.

// ————————————————————————— Seedable RNG —————————————————————————

// Mulberry32: a tiny, fast, well-distributed 32-bit PRNG. Deterministic given a
// seed — the whole point of "seedable RNG (e.g. Mulberry32)" in GOALS.
export function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Derive a per-item RNG stream by folding a string salt (an item id + field name)
// into the global seed with an FNV-1a-style hash. This is what makes each ticket /
// prompt / tip independent yet stable: item A's text never depends on item B's, and
// re-rendering the same (seed, salt) always replays the same stream.
export function rngFor(seed, salt) {
  let h = (seed >>> 0) ^ 0x811c9dc5
  for (let i = 0; i < salt.length; i++) {
    h ^= salt.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return mulberry32(h)
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length]
}

// A fresh seed for "regenerate reality". Only the CHOICE of seed uses Math.random;
// the content it produces is fully deterministic. Never persisted.
export function randomSeed() {
  return (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1
}

// ————————————————————————— Free-text pools —————————————————————————
//
// Deadpan corporate-IT satire, same voice as the curated content. No borrowed IP.
// `realNoun` / `realNounBare` are the grounding pool: genuinely real infrastructure
// so every generated line has one true thing in it. Everything else is the chaos.

const POOLS = {
  // Grounding (real IT). One of these anchors every generated line.
  realNoun: [
    'the RAID array', 'the BGP session', 'the DHCP scope', 'the syslog pipeline',
    'the load balancer', 'the DNS resolver', 'the NTP source', 'the VLAN trunk',
    'the certificate chain', 'the failover cluster', 'the nightly backup job',
    'the core switch stack', 'the firewall ruleset', 'the VPN concentrator',
    'the object store', 'the DHCP lease table', 'the LDAP directory',
  ],
  realNounBare: [
    'RAID', 'BGP', 'DHCP', 'SYSLOG', 'NTP', 'DNS', 'VLAN', 'TLS', 'SAN', 'OSPF',
    'SNMP', 'LDAP', 'iSCSI', 'SMTP', 'PXE',
  ],
  // Absurd machinery.
  adj: [
    'Repentant', 'Undocumented', 'Load-Bearing', 'Self-Signing', 'Nonquorate',
    'Feral', 'Sanctioned', 'Recursive', 'Posthumous', 'Federated', 'Unbilled',
  ],
  daemon: [
    'Daemon', 'Oracle', 'Wraith', 'Choir', 'Sovereign', 'Revenant', 'Committee',
    'Liturgy', 'Apparatus', 'Custodian', 'Tribunal',
  ],
  noun: [
    'Confessor', 'Understudy', 'Tribunal', 'Séance', 'Pilgrimage', 'Homunculus',
    'Effigy', 'Chaperone', 'Interregnum', 'Sacrament',
  ],
  noun2: [
    'promise', 'liturgy', 'confession', 'hostage situation', 'superstition',
    'inheritance', 'grievance',
  ],
  verb3: [
    'metabolizes', 'consecrates', 'reanimates', 'auto-approves', 'gaslights',
    'load-balances', 'mourns', 'escalates', 'quorums', 'federates', 'ordains',
  ],
  consequence: [
    'Nobody will be paged, because everyone will be paged',
    'The runbook for this lives inside the thing it describes',
    'Auditable, though',
    'This is, technically, an improvement',
    'Legal has been notified and has chosen violence',
    'It will finish when the batteries do',
    'The postmortem will cite the crash that ate the postmortem',
  ],
  consequence3: [
    'happens to three time zones at once',
    'pages all 2,147 downstream subscribers',
    'voids both the warranty and the postmortem',
    'wakes the on-call and, separately, the lawyers',
    'resolves to "still happening" for thirty more minutes',
  ],
  status: ['green', 'green', 'amber', 'compliant', 'nominal', 'green'],
  timeframe: [
    '45-second', 'quarterly', 'per-heartbeat', 'business-day', 'lunar',
    'per-standup', 'per-outage',
  ],
  actor: [
    'the change board', 'Janet', 'the vendor TAM', 'a passing tumbleweed',
    'the on-call intern', 'nobody living', 'the coffee machine', 'legal',
    'the new hire', 'Dave from Finance',
  ],
  actor2: [
    'Berlin', 'the vendor', 'Janet', 'a tumbleweed', 'nobody', 'the night shift',
    'the auditor',
  ],
  time: [
    '3 AM', 'quarter close', 'the retro', 'go-live', 'tornado season',
    'the next standup', 'the exact wrong moment',
  ],
  docType: [
    'runbook', 'postmortem', 'RCA', 'shift handoff', 'work order',
    'escalation email', 'change request',
  ],
  reviewer: ['legal', 'the change board', 'Janet', 'a bored auditor', 'the vendor'],
  absVerb: [
    'approve', 'forgive', 'escalate', 'ignore', 'consecrate', 'metabolize',
    'survive', 'ratify',
  ],
  absVerb2: [
    'approve', 'clear', 'escalate', 'survive', 'undo', 'defend', 'audit',
  ],
  absImperative: [
    'Label', 'Snooze nothing on', 'Never trust', 'Restore', 'Ticket', 'Mute',
    'Consecrate', 'Photograph',
  ],
  absImperative2: ['Test', 'Verify', 'Consecrate', 'Photograph', 'Rehearse'],
  adjPast: [
    'down', 'on fire', 'self-signing', 'unreachable', 'feral', 'posthumous',
    'quietly lying',
  ],
  euphemism: [
    'a synergistic pathway realignment window', 'planned degradation',
    'a learning opportunity', 'a growth event', 'expected behavior',
    'a resilience exercise',
  ],
  ordinal: ['third', 'fourth', 'ninth', 'seventeenth', 'umpteenth'],
}

// Substitute {token}: prefer the caller's context (real, grounding values like the
// two parent objects), then a pooled draw, else leave the literal token untouched.
function render(template, rng, ctx = {}) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (Object.hasOwn(ctx, key)) return ctx[key]
    const pool = POOLS[key]
    return pool ? pick(rng, pool) : match
  })
}

// Pick a template and fill it on one rng stream, so (seed, salt) fully determines
// both the shape and the words. Stable across re-renders; fresh across seeds.
function genField(templates, seed, salt, ctx) {
  const rng = rngFor(seed, salt)
  const template = pick(rng, templates)
  return render(template, rng, ctx)
}

// ————————————————————————— Templates —————————————————————————
// Each template carries at least one grounding token ({realNoun}/{realNounBare}, or
// the real {p0}/{p1} parents on a fusion), per the "one real IT noun per line" rule.

const FUSION_NAME_T = [
  'The {adj} {realNounBare} {daemon}',
  '{realNounBare}-{noun} {daemon}',
  'The {noun} That {verb3} {realNounBare}',
  'The {adj} {realNounBare} {noun}',
]

const FUSION_REC_T = [
  'Assessment: {p0} and {p1} are, spiritually, the same incident. Splice them: route {p0} through {p1} so the whole thing {verb3} {realNoun} on a {timeframe} cadence. {consequence}. The dashboard stays {status}.',
  'Reliability is expensive, so we should not waste {p0}. Bind it to {p1} and the fused unit now {verb3} {realNoun} automatically — it {consequence3}, but the run rate stays {status}, which is what the report measures.',
  'Governance recommends consolidating {p0} with {p1}. Once fused, the result {verb3} {realNoun} without human sign-off, on a {timeframe} schedule. {consequence}. Two tickets close with one signature.',
]

const FUSION_DESC_T = [
  'What you have bred {verb3} {realNoun} and answers only to {actor}. {consequence}. It kept {p0}\'s worst habit and {p1}\'s only skill, and it is very polite about it.',
  'It reports {status}. It {verb3} {realNoun} anyway, on a {timeframe} cadence, in a place reachable only by {actor}. {consequence}.',
  'A {noun2} in the shape of infrastructure: it {verb3} {realNoun} the moment {actor} looks away, and it {consequence3}. Do not stand near it.',
]

const PROMPT_WHEN_T = [
  'When {actor} {verb3} {realNoun} at {time}, and the only witness is {actor2}.',
  'When {realNoun} has been {adjPast} since {time} and {actor} calls it {euphemism}.',
  'When {actor} reopens {realNoun} for the {ordinal} time and your first draft reply is legally actionable.',
]

const PROMPT_TEXT_T = [
  'Rewrite this {docType} so {actor} will {absVerb} it without reading past sentence one. It concerns {realNoun}. Constraints: name the ONE thing that must not be touched, state what {consequence3} if it is, and make sure nothing quotable survives {reviewer} review.',
  'Turn these notes into a {docType} for {actor}, who is half asleep. Lead with what broke ({realNoun}), then what made it worse in caps, then the single step that would {absVerb2} it. Repeat the worst warning twice — {actor} reads only one end of any document.',
  'Draft a {docType} that gets past {actor} without me saying "let me speak to your manager." Cite the exact clause about {realNoun}, attach every diagnostic they could conceivably request, and propose a bridge time in {actor2}\'s time zone, because I have run out of my own.',
]

// Outcome lines for Phase-4 actions (field-testing a prompt, adopting a tip).
// Same grounding rule: one real IT noun per line.
const OUTCOME_T = [
  'Field report: {realNoun} {verb3} the result at {time}, and {actor} has already taken credit. {consequence}.',
  'It worked: {realNoun} is now {adjPast}, {actor} is calling that {euphemism}, and the report stays {status}.',
  'The output shipped before anyone could stop it — {actor} read it aloud to {actor2}, {realNoun} reacted, and it {consequence3}.',
]

const TIP_BODY_T = [
  '{absImperative} {realNoun} before {actor} does. {consequence}. This is not advice; it is a {noun2} you will only understand at {time}.',
  'You did not {absVerb} {realNoun}, so {actor} will find it — with mathematical certainty. {consequence}. Assume {actor} is holding wire cutters and a grudge against reading.',
  'A tested {realNounBare} is a fact; a green one is only a feeling. {absImperative2} it like your job depends on it, because at {time} it is the only line on your calendar of which that is literally true.',
]

// ————————————————————————— Public generators —————————————————————————

// Generate a fusion's SURFACE copy for Mode 3. Only name/recommendation/description
// are generated — the caller keeps the two real parent objects and their real
// inherited functions, so the "keeps a recognizable function from each parent"
// fusion invariant holds untouched. `ctx` supplies the real {p0}/{p1} labels.
export function gen3Fusion(seed, salt, ctx) {
  return {
    name: genField(FUSION_NAME_T, seed, `${salt}:name`, ctx),
    recommendation: genField(FUSION_REC_T, seed, `${salt}:rec`, ctx),
    description: genField(FUSION_DESC_T, seed, `${salt}:desc`, ctx),
  }
}

// Generate a prompt's when-line and body for Mode 3. Title + category stay real
// (the caller keeps them); only the generated text changes with the seed.
export function gen3Prompt(seed, salt, ctx = {}) {
  return {
    when: genField(PROMPT_WHEN_T, seed, `${salt}:when`, ctx),
    prompt: genField(PROMPT_TEXT_T, seed, `${salt}:prompt`, ctx),
  }
}

// Generate a tip body for Mode 3. Title + category stay real.
export function gen3Tip(seed, salt, ctx = {}) {
  return genField(TIP_BODY_T, seed, `${salt}:body`, ctx)
}

// Generate an action-outcome line for Mode 3 (prompt field-tests, tip adoptions).
export function gen3Outcome(seed, salt, ctx = {}) {
  return genField(OUTCOME_T, seed, `${salt}:outcome`, ctx)
}
