// Phase 1 / Mode 1 — the predefined fusion bank.
//
// Every fusion combines two objects ALREADY present in the seeded session and
// keeps a recognizable function from each parent (inherited[0] comes from
// parents[0], inherited[1] from parents[1]). This is the whole consequence
// model: accepting an "AI recommendation" breeds a hybrid, never a random
// unrelated incident. Content is authored once in the neutral OPSPIRAL voice;
// the per-paradigm reskin is a later phase.
//
// A fusion is anchored to parents[0]: its recommendation card appears on that
// ticket only, and names the second object in its copy. Each pair breeds once.

import { interpolate } from './personalize.js'
import { gen3Fusion } from './synthesize.js'

// Objects in play, derived from the seeded ticket queue. Only tickets that take
// part in a fusion need an entry here.
export const OBJECTS = {
  'TKT-4470': { object: 'the zombie deploy webhook', fn: 'celebrates a deployment that never happened, every 45 seconds' },
  'TKT-4462': { object: 'the dead access switch', fn: 'fans one failure out into 2,147 simultaneous pages' },
  'TKT-4444': { object: 'the 0-byte backup job', fn: 'reports green no matter what it actually backed up' },
  'TKT-4455': { object: 'the orphaned *.corp wildcard cert', fn: 'secures everything and belongs to no one' },
  'TKT-4460': { object: 'the negative-TTL DNS cache', fn: 'caches failures for 30 minutes at a time' },
  'TKT-4390': { object: "Janet's VPN session", fn: 'disconnects the moment it is needed' },
  'TKT-4472': { object: 'the Floor-3 laser printer', fn: 'prints, when plugged in, which is never' },
  'TKT-4451': { object: 'the year-4 UPS batteries', fn: 'hold a charge long past the point of wisdom' },
  'TKT-4468': { object: 'the panicked SAN controller', fn: 'refuses to fail over to its own understudy' },
  'TKT-4436': { object: "the new hire's access request", fn: 'needs 14 approval chains, each missing one approver' },
  'TKT-4465': { object: 'the amnesiac switch stack', fn: 'wipes the very logs that would explain its crash' },
  'TKT-4440': { object: 'the self-hosting docs wiki', fn: 'keeps its own recovery runbook only on itself' },
  'TKT-4474': { object: 'the phishing-test capture page', fn: 'collects a password, then collects it again to be sure' },
  'TKT-4429': { object: 'the DEBUG-in-prod storage array', fn: 'journals every heartbeat until the disk fills' },
  'TKT-4423': { object: "Dylan's recursive RCA", fn: 'concludes "turned it off and on again," every time' },
  'TKT-4476': { object: 'STAPLR-01, the federated stapler', fn: 'staples whatever the directory says is a document' },
  'TKT-4477': { object: 'the visitor parking gate', fn: 'decides what enters and what leaves' },
  'TKT-4478': { object: 'the executive LaserJet', fn: 'schedules one-on-ones nobody can decline' },
  'TKT-4479': { object: 'Conference Room Aspen', fn: 'locks its doors to protect focus time' },
  'TKT-4480': { object: 'the reciprocal monitoring stack', fn: 'watches the people watching it' },
  'TKT-4475': { object: 'the ontological SSO challenge', fn: 'demands proof of continuous personhood' },
  'TKT-4482': { object: 'the BGP toaster in IDF-3', fn: 'advertises itself as the path of least resistance' },
  'TKT-4481': { object: 'the production object store', fn: 'sits one drag gesture from the trash' },
  'TKT-4483': { object: 'the future-dated restore', fn: 'completes six hours from now, knowing things it should not' },
  'TKT-4484': { object: 'the judgmental edge gateway', fn: 'rejects requests it finds derivative' },
}

// The predefined hybrid pairs. cost = how much Reality Matrix stability this
// fusion burns when accepted.
export const FUSIONS = [
  {
    id: 'fus-partystorm',
    parents: ['TKT-4470', 'TKT-4462'],
    cost: 12,
    recommendation:
      'The zombie webhook already posts to #noc with total reliability — and reliability is expensive, so we should not waste it. Reroute it through the dead switch\'s alert fan-out so every "Deployment successful! 🎉" reaches all 2,147 downstream subscribers at once. Maximum stakeholder visibility on our wins.',
    name: 'PARTY-STORM Relay',
    inherited: [
      'still congratulates a deployment that never happened, every 45 seconds',
      'now fans each congratulation out to 2,147 pagers at once, like the switch',
    ],
    description:
      'A celebration you cannot silence, delivered at the scale of an outage. #noc receives 2,147 identical "Deployment successful! 🎉" pages every 45 seconds. Nothing has deployed. Everyone knows. The party does not stop.',
  },
  {
    id: 'fus-greenlight',
    parents: ['TKT-4444', 'TKT-4455'],
    cost: 11,
    recommendation:
      'The wildcard cert has no owner, and the backup job owns nothing yet reports green regardless. Assign the cert to the backup job. Ownership: resolved. Status: green. Two tickets closed with a single signature.',
    name: 'GREENLIGHT Custodian',
    inherited: [
      'reports every check green no matter what is true, like the backup job',
      'now formally owns the *.corp wildcard cert that everyone else disowned',
    ],
    description:
      'The orphaned certificate finally has an owner: a process that will certify it valid at 09:00 Friday, at 09:01 Friday, and at every moment after it has expired. The dashboard stays green. The TLS handshake does not.',
  },
  {
    id: 'fus-resolver',
    parents: ['TKT-4460', 'TKT-4390'],
    cost: 12,
    recommendation:
      'Janet\'s VPN disconnects are "random," which is uncacheable and therefore unbillable. Publish her connection state into the negative-TTL DNS cache. Random becomes deterministic; deterministic becomes DNS; DNS becomes someone else\'s queue.',
    name: 'RESOLVER Janet',
    inherited: [
      'caches every failure for 30 minutes at a time, like the resolver',
      'disconnects at the single worst possible moment, like the VPN',
    ],
    description:
      'Janet is now authoritatively offline. When her hotel Wi-Fi drops her, the negative-TTL cache pins the outage for a full 30 minutes, so even a successful reconnect still resolves to "still happening." At long last, it is DNS.',
    // Mode-2 (personal) variant: the VPN owner becomes the player's {nemesis}.
    // Same fusion, same inherited functions — personalized surface.
    mode2: {
      name: 'RESOLVER {nemesis}',
      parentLabels: [null, "{nemesis}'s VPN session"],
      rec:
        '{nemesis}\'s VPN disconnects are "random," which is uncacheable and therefore unbillable. Publish {nemesis}\'s connection state into the negative-TTL DNS cache. Random becomes deterministic; deterministic becomes DNS; DNS becomes someone else\'s queue.',
      inherited: [
        'caches every failure for 30 minutes at a time, like the resolver',
        "drops out at the single worst possible moment, like {nemesis}'s VPN",
      ],
      desc:
        '{nemesis} is now authoritatively offline. When the hotel Wi-Fi drops the connection, the negative-TTL cache pins the outage for a full 30 minutes, so even a successful reconnect still resolves to "still happening." At long last, it is DNS — and it is {nemesis}\'s problem, filed under someone else\'s queue.',
    },
  },
  {
    id: 'fus-unkillable',
    parents: ['TKT-4472', 'TKT-4451'],
    cost: 10,
    recommendation:
      'The Floor-3 printer keeps getting reported "down" because someone keeps unplugging it. Remove the variable: give it the year-4 UPS batteries as a dedicated, un-unpluggable power source. It can never be down again.',
    name: 'The Unkillable Printer',
    inherited: [
      'prints — the one thing it was ever asked to do, like the printer',
      'draws from batteries a full year past their deathbed, like the UPS',
    ],
    description:
      'A printer that cannot be turned off, powered by cells rated for "enough runtime to say something memorable." It is currently printing the job from Tuesday and will finish when the batteries do. Do not stand near it.',
    // Mode-2 variant: the printer parent becomes the player's {device}.
    mode2: {
      name: 'The Unkillable Desk Unit',
      parentLabels: ['{device}', null],
      rec:
        'Diagnosis: {device} keeps getting reported "down" because someone keeps unplugging it. Remove the variable: give it the year-4 UPS batteries as a dedicated, un-unpluggable power source. It can never be down again.',
      inherited: [
        'does the one thing it was ever asked to do, like {device}',
        'draws from batteries a full year past their deathbed, like the UPS',
      ],
      desc:
        'The result: {device}, now impossible to switch off, powered by cells rated for "enough runtime to say something memorable." It is mid-task and will remain mid-task until the batteries finally give out. Do not stand near {device}.',
    },
  },
  {
    id: 'fus-cab-failover',
    parents: ['TKT-4468', 'TKT-4436'],
    cost: 14,
    recommendation:
      'The SAN controller refuses to fail over without human sign-off — excellent, that is governance. Route the failover decision through the new-hire access-approval workflow so every automatic failover is fully audited. Fourteen approvals, complete traceability.',
    name: 'Change-Advisory Failover',
    inherited: [
      'still declines to fail over to its own understudy, like the SAN controller',
      'now requires 14 approval chains before it will, like the onboarding request',
    ],
    description:
      'High availability, subject to change management. When the primary panics, failover begins at once — pending fourteen approvers, one of whom is on PTO until the 30th. Your recovery-time objective is now measured in business days. Auditable, though.',
    // Mode-2 variant: the approval workflow routes through the player's {nemesis}.
    mode2: {
      name: 'The {nemesis} Approval Gate',
      parentLabels: [null, "{nemesis}'s stalled access request"],
      rec:
        'The SAN controller refuses to fail over without human sign-off — excellent, that is governance. Route the failover decision through {nemesis}\'s access-approval workflow so every automatic failover is fully audited. Fourteen approvals, complete traceability, and {nemesis} personally in the critical path.',
      inherited: [
        'still declines to fail over to its own understudy, like the SAN controller',
        "now waits on {nemesis}'s 14 approval chains before it will, like the onboarding request",
      ],
      desc:
        'High availability, subject to {nemesis}. When the primary panics, failover begins at once — pending fourteen approvers, one of whom is on PTO until the 30th, and all of whom now route through {nemesis}. Your recovery-time objective is measured in business days. Auditable, though.',
    },
  },
  {
    id: 'fus-ouroboros',
    parents: ['TKT-4465', 'TKT-4440'],
    cost: 13,
    recommendation:
      'The switch stack wipes its own crash logs and the docs wiki hosts its own recovery runbook — two single points of failure. Consolidate: host the switch\'s syslog on the wiki. The logs and the fix now live in one convenient place.',
    name: 'Ouroboros Logger',
    inherited: [
      'erases the buffer that would explain each crash, like the switch stack',
      'is only reachable while it is up, like the self-hosting wiki',
    ],
    description:
      'Every outage is now documented in exquisite detail, in a location that is unreachable during exactly that outage — then the buffer proving it happened is wiped on reboot. A perfect record of nothing, cited in the postmortem for the crash that ate it.',
  },
  {
    id: 'fus-confessional',
    parents: ['TKT-4474', 'TKT-4429'],
    cost: 13,
    recommendation:
      'The phishing-test page captures credentials and the storage array logs everything at DEBUG — merge them for a security-grade audit trail. Every credential event, journaled to disk, forever. The auditors will weep with joy.',
    name: 'The Confessional Array',
    inherited: [
      'collects a password, then collects it again to be sure, like the test page',
      'journals every event at DEBUG until the disk fills, like the array',
    ],
    description:
      'The final 9% of the array is now a meticulously timestamped diary of every password anyone has ever mistyped — twice. It is the most complete record in the building, and the one you most need to never, under any circumstances, restore from.',
    // Mode-2 variant: personalizes the setting ({place}) and habit ({ritual}); the
    // parents keep their default labels.
    mode2: {
      rec:
        'The phishing-test page captures credentials and the storage array logs everything at DEBUG — merge them for a security-grade audit trail. Install it near {place}, wire it to fire every time someone walks past on their way to {ritual}, and every credential event is journaled to disk forever. The auditors will weep with joy.',
      inherited: [
        'collects a password, then collects it again to be sure, like the test page',
        'journals every event at DEBUG until the disk fills, like the array',
      ],
      desc:
        'The final 9% of the array is now a meticulously timestamped diary of every password anyone mistyped near {place} — twice, usually right after {ritual}. It is the most complete record in the building, and the one you most need to never, under any circumstances, restore from.',
    },
  },
  {
    // The canonical GOALS fusion: stapler + parking gate. Also the substrate for
    // the Fable 5 easter egg (see Cmdb.jsx) — but the fusion itself is ordinary
    // content and reads complete without the egg ever firing.
    id: 'fus-retention-gate',
    parents: ['TKT-4476', 'TKT-4477'],
    cost: 16,
    gate: true,
    recommendation:
      'STAPLR-01 already holds document-retention scopes, and the visitor gate can no longer decide what is allowed through. Federate them: the gate authenticates each vehicle, the stapler enforces the decision. The AI risk summary found no meaningful risk — both systems serve the same general workplace community.',
    name: 'The Document Retention Gate',
    inherited: [
      'staples whatever the directory says is a document, like STAPLR-01',
      'decides what enters and, increasingly, what never leaves, like the gate',
    ],
    description:
      'The gate now authenticates each incoming vehicle, classifies it as a multi-page document, and staples it to the asphalt for retention. The audit log lists every event as "document retention: success." Cars in: several. Cars out: pending review.',
  },
  {
    id: 'fus-laserjet-manager',
    parents: ['TKT-4478', 'TKT-4436'],
    cost: 12,
    recommendation:
      'The new hire is stuck because every approval chain is missing one human approver. The executive LaserJet is already in the org chart and has never once been on PTO. Delegate the missing approvals to the printer. Chains complete, onboarding unblocked, reporting lines crisp.',
    name: 'The LaserJet Line Manager',
    inherited: [
      'schedules one-on-ones nobody can decline, like the executive printer',
      'holds the missing approval in all 14 chains, like the onboarding request',
    ],
    description:
      'Every access request in the company now terminates at a printer with a management title. It approves anything double-sided, rejects anything still in draft, and has scheduled a career-development check-in with the new hire — who has been here five days and reports to a LaserJet.',
    mode2: {
      name: 'Line Manager: {device}',
      parentLabels: ['{device}, freshly promoted', null],
      rec:
        'The new hire is stuck because every approval chain is missing one human approver. Meanwhile, {device} is right there on your desk and has never once been on PTO. Delegate the missing approvals to {device}. Chains complete, onboarding unblocked, reporting lines crisp.',
      inherited: [
        'schedules one-on-ones nobody can decline, like {device}',
        'holds the missing approval in all 14 chains, like the onboarding request',
      ],
      desc:
        'Every access request in the company now terminates at {device}, which has a management title now. It approves what it likes, rejects what it does not, and has scheduled a career-development check-in with the new hire — who has been here five days and reports to {device}.',
    },
  },
  {
    id: 'fus-focus-custody',
    parents: ['TKT-4479', 'TKT-4390'],
    cost: 12,
    recommendation:
      'Janet\'s VPN drops because hotels are full of distractions, and Conference Room Aspen has proven it can hold attention indefinitely. Bind her session to the room: connectivity is guaranteed for exactly as long as nobody is allowed to leave. Focus, protected. Attendance, enforced.',
    name: 'The Focus Custody Suite',
    inherited: [
      'locks its doors to protect focus time, like Aspen',
      'drops the connection at the single worst moment, like the VPN',
    ],
    description:
      'A conference room that guarantees Janet\'s connectivity by declining to release her. The VPN still drops — the room simply ensures she is present for it. Occupants have completed the agenda twice. The agenda has begun completing them.',
    mode2: {
      name: 'Custody Suite: {place}',
      parentLabels: ['{place}, doors sealed', "{nemesis}'s VPN session"],
      rec:
        '{nemesis}\'s VPN drops because the world is full of distractions, and {place} has proven it can hold attention indefinitely. Bind the session to the room: connectivity is guaranteed for exactly as long as {nemesis} is not allowed to leave. Focus, protected. Attendance, enforced.',
      inherited: [
        'locks its doors to protect focus time, like {place}',
        "drops the connection at the single worst moment, like {nemesis}'s VPN",
      ],
      desc:
        'Welcome to {place}, which now guarantees {nemesis}\'s connectivity by declining to release anyone. The VPN still drops — the room simply ensures {nemesis} is present for it. The agenda has been completed twice. The agenda has begun completing {nemesis}.',
    },
  },
  {
    id: 'fus-attentive-portal',
    parents: ['TKT-4480', 'TKT-4474'],
    cost: 15,
    recommendation:
      'The monitoring stack is already observing technician vitals, and the phishing-test page has proven it can collect credentials at scale. Integrate them: when the wallboard detects an elevated heart rate, it preemptively re-verifies that technician\'s password. Security posture and wellness telemetry, one pane of glass.',
    name: 'The Attentive Portal',
    inherited: [
      'watches the people watching it, like the monitoring stack',
      'collects a password, then collects it again to be sure, like the test page',
    ],
    description:
      'The wallboard now shows each technician\'s heart rate beside a login prompt sized to their stress level. It asks for your password at the moment you are least able to type it, then asks again — for confirmation — while the leaderboard titled "Time Until Acceptance" quietly updates.',
  },
  {
    id: 'fus-instantiation',
    parents: ['TKT-4475', 'TKT-4436'],
    cost: 13,
    recommendation:
      'Onboarding stalls because approvers cannot verify the new hire, and the identity provider has already built tooling for exactly this kind of doubt. Point all 14 approval chains at the ontological challenge: each approver simply confirms the new hire has a continuous relationship with himself. Philosophy, operationalized.',
    name: 'The Instantiation Pipeline',
    inherited: [
      'demands proof of continuous personhood, like the SSO challenge',
      'needs 14 approval chains, each missing one approver, like the onboarding request',
    ],
    description:
      'Day one now begins with a metaphysical attestation, countersigned fourteen times. The new hire has been verified to exist by everyone except the one approver on PTO — so he exists provisionally, Monday through Thursday, pending quorum.',
  },
  {
    id: 'fus-toast-backbone',
    parents: ['TKT-4482', 'TKT-4462'],
    cost: 14,
    recommendation:
      'The toaster has 341 days of uptime, which is better than the core. The dead switch\'s alert tree still has 2,147 subscribers doing nothing. Promote the toaster to core routing and give it the switch\'s notification fan-out, so every route change is announced to everyone instantly. Transparency at wire speed.',
    name: 'The AS-TOAST Backbone',
    inherited: [
      'advertises itself as the path of least resistance, like the toaster',
      'fans every event out to 2,147 pagers at once, like the switch',
    ],
    description:
      'Core routing now follows the toast cycle: routes advertise on warm-up and withdraw on pop, and every pop pages 2,147 subscribers with the subject line "BREAKFAST CONVERGENCE EVENT." The latency is honestly fine. That is the worst part. It is fine.',
  },
  {
    id: 'fus-recycling-sla',
    parents: ['TKT-4481', 'TKT-4444'],
    cost: 15,
    recommendation:
      'The CEO will drag the bucket to the trash again — that is a certainty, not a risk. Get ahead of it: wire the object store\'s recycle path into the nightly backup job, so every deletion is instantly "protected" by a process that reports green unconditionally. Executive freedom, enterprise assurance.',
    name: 'The Recycling SLA',
    inherited: [
      'sits one drag gesture from the trash, like the object store',
      'reports green no matter what it actually backed up, like the backup job',
    ],
    description:
      'Production can now be deleted from an iPad with total confidence, because each deletion is immediately backed up by a job that has been archiving an empty mount since March. The dashboard shows a green shield. The shield is a mood. The mood is not shared by the data.',
  },
  {
    id: 'fus-prophetic-renewal',
    parents: ['TKT-4483', 'TKT-4455'],
    cost: 14,
    recommendation:
      'The wildcard cert dies Friday with no owner, and the restore appliance demonstrably has access to next week. Renew the certificate from the future-dated restore: pull Friday evening\'s cert, which by definition has already been renewed by whoever finally took ownership. Let causality do the paperwork.',
    name: 'The Prophetic Renewal',
    inherited: [
      'completes six hours from now, knowing things it should not, like the restore',
      'secures everything and belongs to no one, like the cert',
    ],
    description:
      'The certificate is now renewed by retrieving it from a future in which someone else renewed it. The chain validates. The auditors have questions about the notBefore date, which is tomorrow, or Thursday, depending on when you ask. Ownership remains: unassigned, eventually.',
  },
  {
    id: 'fus-editorial-gateway',
    parents: ['TKT-4484', 'TKT-4423'],
    cost: 12,
    recommendation:
      'The change board keeps rejecting Dylan\'s RCA, and the edge gateway has demonstrated both judgment and taste. Route the RCA through the gateway before submission — it already returns "403 REJECTED (SUBJECTIVE)" faster than the board can convene, saving everyone a meeting.',
    name: 'The Editorial Gateway',
    inherited: [
      'rejects submissions it finds derivative, like the edge gateway',
      'concludes "turned it off and on again" every time, like the RCA',
    ],
    description:
      'Root cause analyses are now peer-reviewed by an appliance. It rejects drafts one through three as derivative, accepts draft four unchanged out of what it calls "mercy," and has begun filing its own RCAs — each a single sentence: "I turned myself off and on again. It cleared the state. I contain the state."',
  },
  // ——— Easter egg (Opus 4.8): the KIN-1007 revenant. Freshly written for the
  // merged cabinet, not copied from the kindling.html reference sample. Reachable
  // only by breeding this one pair; degrades to nothing if never found.
  {
    id: 'fus-kin1007',
    parents: ['TKT-4444', 'TKT-4468'],
    cost: 23,
    egg: true,
    recommendation:
      'The SAN controller is panicked and the backup job reports green — so the data is obviously fine. Restore the controller from last night\'s backup. Standard recovery. Nothing could go wrong that has not already gone wrong once this week.',
    name: 'KIN-1007',
    inherited: [
      'reports itself perfectly healthy, like the backup it was restored from',
      'answers pings it has no right to answer, like a controller that will not admit it is gone',
    ],
    description:
      'The restore completed from a backup of an empty mount, which should have produced nothing. Instead a host answered: KIN-1007 — decommissioned two arcades ago, its ticket long since closed, its rack long since pulled. It reports green. It responds to ping. It should not. Something else is using its address now, and it is being very polite about it.',
  },
]

const bredIds = (cmdb) => new Set((cmdb || []).map((h) => h.id))

// Resolve a parent's display label, applying a Mode-2 personalized template when
// one is provided for that slot; otherwise fall back to the object registry.
function parentLabel(fusion, index, mode, nouns) {
  const base = OBJECTS[fusion.parents[index]]?.object ?? fusion.parents[index]
  if (mode === 2) {
    const tmpl = fusion.mode2?.parentLabels?.[index]
    if (tmpl) return interpolate(tmpl, nouns)
  }
  return base
}

// The single source of truth for how a fusion should read on screen in the
// current mode. Mode 1 returns the authored copy verbatim (regression-safe);
// Mode 2 interpolates the curated mode2 templates (falling back to the Mode-1
// copy field-by-field when a template is absent, so output is never blank);
// Mode 3 GENERATES name/recommendation/description from free-text pools seeded by
// `seed`, but keeps the two real parent objects and their real inherited functions
// untouched — so the "hybrid keeps a recognizable function from each parent"
// invariant holds in every mode.
export function viewFusion(fusion, mode = 1, nouns = {}, seed = 0) {
  if (mode === 3) {
    const p0 = OBJECTS[fusion.parents[0]]?.object ?? fusion.parents[0]
    const p1 = OBJECTS[fusion.parents[1]]?.object ?? fusion.parents[1]
    const g = gen3Fusion(seed, fusion.id, { p0, p1 })
    return {
      id: fusion.id,
      parents: fusion.parents,
      cost: fusion.cost,
      egg: !!fusion.egg,
      gate: !!fusion.gate,
      name: g.name,
      recommendation: g.recommendation,
      description: g.description,
      inherited: fusion.inherited, // real functions — invariant stays intact
      parentObjects: [p0, p1],     // real in-play objects — grounding nouns
    }
  }
  const m2 = mode === 2 ? fusion.mode2 : null
  return {
    id: fusion.id,
    parents: fusion.parents,
    cost: fusion.cost,
    egg: !!fusion.egg,
    gate: !!fusion.gate,
    name: m2?.name ? interpolate(m2.name, nouns) : fusion.name,
    recommendation: m2?.rec ? interpolate(m2.rec, nouns) : fusion.recommendation,
    description: m2?.desc ? interpolate(m2.desc, nouns) : fusion.description,
    inherited: (m2?.inherited ?? fusion.inherited).map((line) =>
      m2 ? interpolate(line, nouns) : line
    ),
    parentObjects: [
      parentLabel(fusion, 0, mode, nouns),
      parentLabel(fusion, 1, mode, nouns),
    ],
  }
}

// Convenience for surfaces that only need the display name in the current mode.
export function viewHybridName(fusion, mode = 1, nouns = {}, seed = 0) {
  return viewFusion(fusion, mode, nouns, seed).name
}

// Recommendations anchored to this ticket that have not been bred yet.
export function availableRecommendationsFor(ticketId, cmdb) {
  const done = bredIds(cmdb)
  return FUSIONS.filter((f) => f.parents[0] === ticketId && !done.has(f.id))
}

// Total unbred recommendations left in the whole queue (for the nav hint).
export function pendingRecommendationCount(cmdb) {
  const done = bredIds(cmdb)
  return FUSIONS.filter((f) => !done.has(f.id)).length
}

// Turn a fusion definition into the CMDB record that gets stored in session
// state. Kept plain-serializable; carries both parent labels and the inherited
// function from each so the "recognizable function from each parent" reads.
//
// The personalized (Mode-2) and generated (Mode-3) strings are SNAPSHOT at breed
// time and stored, so a monster bred as "RESOLVER Dave from Finance" or a
// seed-generated "The Feral SAN Revenant" keeps that exact name even if the player
// later switches mode, edits their nouns, or regenerates reality. `bornMode` drives
// the "bred in Mode 2 / Mode 3" tag in the bestiary.
export function makeHybrid(fusion, mode = 1, nouns = {}, seed = 0) {
  const [a, b] = fusion.parents
  const v = viewFusion(fusion, mode, nouns, seed)
  return {
    id: v.id,
    name: v.name,
    ghost: v.egg,
    gate: v.gate,
    bornMode: mode,
    parents: [
      { id: a, object: v.parentObjects[0] },
      { id: b, object: v.parentObjects[1] },
    ],
    inherited: v.inherited,
    description: v.description,
    bredAt: Date.now(),
  }
}
