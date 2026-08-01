// All demo data for OPSPIRAL. Timestamps are generated relative to load time
// so the queue always looks like it was abandoned mid-shift, not archived.

const now = Date.now()
const mins = (n) => now - n * 60 * 1000
const hours = (n) => now - n * 60 * 60 * 1000
const days = (n) => now - n * 24 * 60 * 60 * 1000

export const TEAM = [
  { id: 'u-rk', name: 'R. Keys', initials: 'RK', role: 'Senior ITOps / Incident Commander', tz: 'CT', note: 'Awake 71 hours. Legally a cryptid.' },
  { id: 'u-dp', name: 'Dylan Park', initials: 'DP', role: 'Junior Tech', tz: 'CT', note: 'Believes power cycling is a philosophy.' },
  { id: 'u-mw', name: 'Marcus Webb', initials: 'MW', role: 'Field Tech', tz: 'ET', note: 'Reads tickets on a strictly voluntary basis.' },
  { id: 'u-pn', name: 'Priya Nair', initials: 'PN', role: 'Network Engineer', tz: 'PT', note: 'Has never once been wrong about it being DNS.' },
  { id: 'u-so', name: 'Sam Okafor', initials: 'SO', role: 'Systems Admin', tz: 'UTC+1', note: 'Awake at hours that violate the Geneva Convention.' },
]

export const teamById = (id) => TEAM.find((t) => t.id === id) || TEAM[0]

export const SEED_TICKETS = [
  {
    id: 'TKT-4471', title: 'Wrong fiber cut at Ridgeline DC — trunk severed',
    description: 'Field tech dispatched to cut the ABANDONED gray fiber (clearly marked in ticket AND cable map) instead cut the live orange backbone trunk labeled DO-NOT-TOUCH in three languages. He read neither document, apparently on principle. Splice crew en route, ETA 2h.',
    priority: 'P1', status: 'in-progress', assignee: 'u-mw', requester: 'NOC monitoring',
    tags: ['fiber', 'layer-1', 'ridgeline-dc'], reopenCount: 0, createdAt: hours(3), updatedAt: mins(12),
  },
  {
    id: 'TKT-4423', title: 'RCA rejected: "turned it off and on again" (attempt #4)',
    description: 'Dylan has now submitted "have you tried turning it off and on again" as a formal root cause analysis four separate times. It is a remediation step. It is not a root cause. The change board has started laughing before opening the document. Needs an actual causal chain: what failed, why it failed, why it will not fail again.',
    priority: 'P3', status: 'blocked', assignee: 'u-dp', requester: 'Change Advisory Board',
    tags: ['rca', 'process', 'mentoring'], reopenCount: 0, createdAt: days(2), updatedAt: hours(5),
    blockedReason: 'Waiting on an RCA that contains a root cause.',
  },
  {
    id: 'TKT-4390', title: 'VPN drops for one (1) user — reopened 3× this week',
    description: 'Janet\'s VPN disconnects "randomly." It is her hotel Wi-Fi. We have proven it is her hotel Wi-Fi with packet captures, timelines, and a diagram. She has reopened this resolved ticket three times this week, most recently with the note "still happening" sent FROM THE HOTEL.',
    priority: 'P4', status: 'reopened', assignee: 'u-so', requester: 'Janet (Accounting)',
    tags: ['vpn', 'user-education', 'recidivism'], reopenCount: 3, createdAt: days(9), updatedAt: hours(2),
  },
  {
    id: 'TKT-4468', title: 'Core services outage — the 71-hour marathon',
    description: 'Cascading failure: SAN controller panic → failover that did not fail over → replication split-brain. Restored after 71 continuous hours of remediation by one (1) increasingly feral incident commander. Full postmortem owed. Sleep also owed.',
    priority: 'P1', status: 'resolved', assignee: 'u-rk', requester: 'Everyone, loudly',
    tags: ['san', 'outage', 'postmortem-owed'], reopenCount: 0, createdAt: days(4), updatedAt: hours(8),
  },
  {
    id: 'TKT-4459', title: 'Reschedule the P1 bridge that a tornado interrupted',
    description: 'Incident commander spotted an actual tornado two (2) miles from the vehicle while driving mid-incident. Call was not finished. Tornado did not wait for a stopping point. Need to reconvene the bridge and finish assigning postmortem actions, ideally indoors.',
    priority: 'P3', status: 'open', assignee: 'u-rk', requester: 'R. Keys',
    tags: ['postmortem', 'weather', 'acts-of-god'], reopenCount: 0, createdAt: days(1), updatedAt: hours(20),
  },
  {
    id: 'TKT-4455', title: 'Wildcard cert expires in 6 days — nobody owns it',
    description: 'The *.corp wildcard certificate expires Friday. It was purchased by someone who left in 2022, on a personal card, with an email account that no longer exists. Every team agrees it is critical. Every team agrees it is not theirs.',
    priority: 'P2', status: 'open', assignee: 'u-so', requester: 'Security scan',
    tags: ['certs', 'ownership-void', 'ticking-clock'], reopenCount: 0, createdAt: days(3), updatedAt: hours(26),
  },
  {
    id: 'TKT-4460', title: 'Intermittent resolution failures — it was DNS',
    description: 'Three days of "the app is slow" tickets. Two engineers insisted it could not be DNS. It was DNS. It is always DNS. A negative-TTL misconfiguration was caching failures for 30 minutes at a time. Fixed; monument to hubris pending.',
    priority: 'P2', status: 'resolved', assignee: 'u-pn', requester: 'App team',
    tags: ['dns', 'it-was-dns', 'told-you'], reopenCount: 1, createdAt: days(5), updatedAt: days(1),
  },
  {
    id: 'TKT-4462', title: 'Alert storm: 2,147 alerts from one dead switch',
    description: 'One access switch died and took 2,147 downstream alerts with it, each paging separately, each convinced it was the main character. Need alert dependency mapping so the on-call phone stops achieving liftoff.',
    priority: 'P2', status: 'in-progress', assignee: 'u-pn', requester: 'On-call rotation (all of them)',
    tags: ['monitoring', 'alert-fatigue', 'dependencies'], reopenCount: 0, createdAt: days(2), updatedAt: hours(4),
  },
  {
    id: 'TKT-4449', title: 'Change window ran 5 hours over; rollback plan was "don\'t"',
    description: 'Saturday\'s firmware upgrade was scoped at 2 hours and took 7. The submitted rollback plan was, verbatim, the word "no." Post-implementation review required before this vendor touches anything again.',
    priority: 'P3', status: 'open', assignee: 'u-rk', requester: 'Change management',
    tags: ['change-mgmt', 'vendor', 'rollback-optional'], reopenCount: 0, createdAt: days(6), updatedAt: days(2),
  },
  {
    id: 'TKT-4444', title: 'Backups "succeeded" — test restore produced 0 bytes',
    description: 'Backup job reports green every night. Quarterly restore test produced a directory of nothing. The backups have been backing up an empty mount since March. Green checkmarks are a mood, not a fact. Verify restores, not jobs.',
    priority: 'P2', status: 'in-progress', assignee: 'u-so', requester: 'DR audit',
    tags: ['backups', 'dr', 'schrodingers-data'], reopenCount: 0, createdAt: days(3), updatedAt: hours(7),
  },
  {
    id: 'TKT-4472', title: 'Printer on floor 3 is "down" (it is unplugged)',
    description: 'Printer reported down with severity "URGENT!!!" Photo provided by requester clearly shows the power cable resting beside the outlet in a state of gentle repose. Dispatch someone to perform the sacred rite of Plugging It In.',
    priority: 'P4', status: 'open', assignee: 'u-dp', requester: 'Floor 3',
    tags: ['printer', 'power', 'the-classics'], reopenCount: 0, createdAt: hours(6), updatedAt: hours(6),
  },
  {
    id: 'TKT-4470', title: 'Rogue webhook spamming #noc every 45 seconds',
    description: 'A test webhook from 2023 woke up and is posting "Deployment successful! 🎉" to #noc every 45 seconds. Nothing is deploying. Nothing has deployed. The celebration is unearned and eternal. Find it and end it.',
    priority: 'P3', status: 'in-progress', assignee: 'u-dp', requester: 'Everyone in #noc',
    tags: ['slack', 'webhooks', 'zombie-automation'], reopenCount: 0, createdAt: hours(9), updatedAt: hours(1),
  },
  {
    id: 'TKT-4436', title: 'New hire needs access to 14 systems, currently has 1',
    description: 'Started Monday. Has email. Needs the other 13 systems, each with its own approval chain, each chain containing at least one approver who is on PTO. Current productivity: reading the employee handbook for the third time.',
    priority: 'P3', status: 'open', assignee: 'u-so', requester: 'HR onboarding',
    tags: ['access', 'onboarding', 'approval-purgatory'], reopenCount: 0, createdAt: days(4), updatedAt: days(1),
  },
  {
    id: 'TKT-4465', title: 'Switch stack rebooted itself; logs conveniently "lost"',
    description: 'Distribution stack in Building B rebooted at 02:13 with no change, no power event, and no logs — the crash wiped the buffer that would explain the crash. Syslog forwarding is now mandatory, effective the moment this sentence ends.',
    priority: 'P2', status: 'open', assignee: 'u-pn', requester: 'NOC monitoring',
    tags: ['network', 'logging', 'perfect-crime'], reopenCount: 0, createdAt: days(1), updatedAt: hours(16),
  },
  {
    id: 'TKT-4429', title: 'Storage array at 91% — growth described as "unexpected"',
    description: 'Array crossed 91%. Growth driver: a service logging at DEBUG in production since June, faithfully recording every heartbeat like a diary. Expansion quote requested; log-level intervention scheduled; diary to be burned.',
    priority: 'P2', status: 'in-progress', assignee: 'u-so', requester: 'Capacity alerting',
    tags: ['storage', 'capacity', 'debug-in-prod'], reopenCount: 0, createdAt: days(7), updatedAt: hours(30),
  },
  {
    id: 'TKT-4474', title: 'Phishing test: 6 people entered credentials, one twice',
    description: 'Internal phishing simulation results: 6 users entered their password on a page titled "Defnitely Real IT Portal" (sic). One user, upon the page erroring, entered it a second time to be sure. Remedial training scheduled. Faith declining.',
    priority: 'P2', status: 'open', assignee: 'u-rk', requester: 'Security team',
    tags: ['security', 'phishing', 'twice'], reopenCount: 0, createdAt: hours(11), updatedAt: hours(11),
  },
  {
    id: 'TKT-4440', title: 'Docs wiki is down; the fix docs are on the wiki',
    description: 'The documentation wiki is unreachable. The runbook for restoring the wiki is hosted exclusively on the wiki. This is a bootstrapping paradox with a ticket number. Rebuilding from a 2024 export found in someone\'s Downloads folder.',
    priority: 'P2', status: 'in-progress', assignee: 'u-dp', requester: 'Everyone who needs docs',
    tags: ['wiki', 'circular-dependency', 'irony'], reopenCount: 1, createdAt: hours(14), updatedAt: hours(3),
  },
  {
    id: 'TKT-4451', title: 'UPS batteries at year 4 of a 3-year lifespan',
    description: 'Server room UPS batteries are a year past replacement. Current runtime estimate: "enough time to say something memorable." Vendor quote received; approval sitting with finance, who have questions about whether power is necessary.',
    priority: 'P3', status: 'blocked', assignee: 'u-so', requester: 'Facilities',
    tags: ['power', 'ups', 'borrowed-time'], reopenCount: 0, createdAt: days(12), updatedAt: days(3),
    blockedReason: 'Finance reviewing whether electricity is in budget.',
  },
  {
    id: 'TKT-4476', title: 'Facilities enrolled STAPLR-01 in single sign-on',
    description: 'The heavy-duty stapler by the loading dock now has an identity in the directory: STAPLR-01, service account, OIDC + SCIM provisioned, scopes granted by Facilities "to streamline device management." It is a stapler. It has document-retention permissions. Someone approved this without asking what a stapler needs to read.',
    priority: 'P3', status: 'open', assignee: 'u-so', requester: 'Security scan',
    tags: ['identity', 'facilities', 'why'], reopenCount: 0, createdAt: days(2), updatedAt: hours(19),
  },
  {
    id: 'TKT-4477', title: 'Visitor parking gate stuck open — strange firmware notes',
    description: 'The visitor gate has been waving cars through since Tuesday. A firmware dump found comment blocks from a contractor nobody hired, most recently: "// the mountain was easier to feed than this gate." Vendor unreachable. Contractor unlisted. Gate cheerful.',
    priority: 'P3', status: 'in-progress', assignee: 'u-mw', requester: 'Facilities',
    tags: ['facilities', 'gate-firmware', 'contractor-notes'], reopenCount: 0, createdAt: days(3), updatedAt: hours(10),
  },
  {
    id: 'TKT-4478', title: 'Executive printer added itself to the org chart',
    description: 'The executive-floor LaserJet appeared in the directory with a title ("Print Services Lead"), a direct report (the toner cart), and scheduled one-on-ones. Three managers accepted before noticing the attendee was a printer. HR wants it removed; the printer has already filed its first performance review.',
    priority: 'P2', status: 'open', assignee: 'u-so', requester: 'HR (rattled)',
    tags: ['printer', 'directory', 'career-limiting'], reopenCount: 0, createdAt: hours(22), updatedAt: hours(8),
  },
  {
    id: 'TKT-4479', title: 'Conference Room Aspen will not release attendees',
    description: 'Aspen accepted a firmware update and locked its doors to "protect focus time." Occupants have completed the agenda twice and are losing faith. The door override requires a change request; the change request template is on the whiteboard inside the room.',
    priority: 'P2', status: 'in-progress', assignee: 'u-mw', requester: 'The people in Aspen',
    tags: ['facilities', 'iot', 'eight-inside'], reopenCount: 0, createdAt: hours(5), updatedAt: mins(40),
  },
  {
    id: 'TKT-4480', title: 'Monitoring is monitoring us back',
    description: 'All probes are healthy, but the NOC wallboard now shows technician heart rates and a leaderboard titled "Time Until Acceptance." Nobody configured this. The vendor says the feature does not exist. The leaderboard updated while we were on the call with them.',
    priority: 'P2', status: 'open', assignee: 'u-pn', requester: 'NOC (nervously)',
    tags: ['monitoring', 'observability', 'observed'], reopenCount: 0, createdAt: days(1), updatedAt: hours(13),
  },
  {
    id: 'TKT-4475', title: 'SSO asked a user to prove he is not a concept',
    description: 'The identity provider flagged a login as "insufficiently instantiated" and now requires a manager who can verify the user has a continuous relationship with himself. He supplied three references. None were willing to go on record. Filed under authentication; escalating toward philosophy.',
    priority: 'P3', status: 'blocked', assignee: 'u-so', requester: 'Ben (Marketing)',
    tags: ['sso', 'identity', 'ontology'], reopenCount: 0, createdAt: days(2), updatedAt: days(1),
    blockedReason: 'Awaiting ontological attestation from a line manager.',
  },
  {
    id: 'TKT-4482', title: 'Guest VLAN default route points at a smart toaster',
    description: 'Network discovery found the guest VLAN\'s default route pointing at a smart toaster in the IDF-3 closet. The toaster is running a full BGP daemon, peering happily, advertising itself as the path of least resistance. Uptime: 341 days. Nobody will admit to configuring it, and frankly the latency is fine.',
    priority: 'P2', status: 'open', assignee: 'u-pn', requester: 'Network discovery scan',
    tags: ['bgp', 'iot', 'path-of-least-resistance'], reopenCount: 0, createdAt: days(1), updatedAt: hours(4),
  },
  {
    id: 'TKT-4481', title: 'CEO dragged the production bucket to the trash on his iPad',
    description: '"Hey buddy, I dragged the bucket icon into trash on my iPad, is that fine?" It was the production object store. It was not fine. Versioning saved us. The CEO\'s follow-up question — "what\'s versioning?" — did not.',
    priority: 'P1', status: 'in-progress', assignee: 'u-rk', requester: 'CEO (cheerfully)',
    tags: ['storage', 'executive', 'close-call'], reopenCount: 0, createdAt: hours(7), updatedAt: mins(55),
  },
  {
    id: 'TKT-4483', title: 'Restore completed six hours from now',
    description: 'The backup appliance reports a successful restore stamped six hours in the future. The recovered VM already knows everyone\'s new passwords and declines to explain how. Vendor says the timestamp is "cosmetic." The passwords are not.',
    priority: 'P2', status: 'open', assignee: 'u-so', requester: 'DR audit',
    tags: ['backups', 'causality', 'rpo-negative'], reopenCount: 0, createdAt: hours(16), updatedAt: hours(6),
  },
  {
    id: 'TKT-4484', title: 'Edge gateway has achieved opinions',
    description: 'The edge gateway is scoring requests on "merit" and returning 403 REJECTED (SUBJECTIVE) to traffic it finds derivative. Throughput is up 4% because it declines the requests it does not respect. Rollback is available; the morale impact of telling it "no" is unknown.',
    priority: 'P2', status: 'open', assignee: 'u-pn', requester: 'API team',
    tags: ['gateway', 'sentience', '403-subjective'], reopenCount: 0, createdAt: hours(30), updatedAt: hours(9),
  },
]

export const SEED_INCIDENTS = [
  {
    id: 'INC-0091', title: 'Ridgeline fiber cut — backbone degraded', severity: 'SEV1', status: 'active',
    summary: 'Live backbone trunk severed by field tech during an unrelated decommission. East–west traffic rerouted over the backup path, which was sized for "emergencies" by someone with a very optimistic definition of emergency. Splice crew on site.',
    commander: 'u-rk', startedAt: hours(3), timezonesAffected: ['PT', 'CT', 'ET', 'UTC+1'], slackPingsSuppressed: 312,
    escalation: [
      { name: 'Priya Nair', role: 'Network lead — owns reroute + capacity juggling', tz: 'PT' },
      { name: 'Marcus Webb', role: 'Field tech — supervising splice crew, under supervision himself', tz: 'ET' },
      { name: 'Sam Okafor', role: 'Systems — watching replication lag climb with quiet dread', tz: 'UTC+1' },
      { name: 'VP Infrastructure', role: 'Executive escalation — asks "ETA?" every 20 minutes', tz: 'CT' },
    ],
    timeline: [
      { at: hours(3), entry: 'Backbone link down. Monitoring detects it 40 seconds before the first "is the internet broken?" Slack message.', kind: 'alert' },
      { at: mins(160), entry: 'Field tech confirms he cut "a" fiber. Asked to confirm WHICH fiber. Long pause on the line.', kind: 'update' },
      { at: mins(150), entry: 'It was the wrong fiber. The one labeled DO-NOT-TOUCH. The ticket said gray. The map said gray. He cut orange.', kind: 'escalation' },
      { at: mins(140), entry: 'Traffic rerouted to backup path at 94% utilization. The backup path would like to speak to a manager.', kind: 'update' },
      { at: mins(95), entry: 'Splice crew dispatched. Incident commander chasing status across four time zones; three of them are asleep and lying about it.', kind: 'update' },
      { at: mins(30), entry: 'Splice crew on site. Marcus attempted to help; was handed a flashlight and a strict verbal contract.', kind: 'update' },
      { at: mins(8), entry: 'First fiber pair spliced and tested clean. Backup path utilization down to 71%. Cautious, joyless optimism.', kind: 'progress' },
    ],
  },
  {
    id: 'INC-0090', title: 'SSO latency — logins intermittently contemplative', severity: 'SEV3', status: 'monitoring',
    summary: 'SSO token issuance taking 8–20 seconds during peak. Users are experiencing an unwanted moment of reflection at every login. Vendor "investigating," which appears to involve a lot of waiting on their end too.',
    commander: 'u-so', startedAt: hours(28), timezonesAffected: ['CT', 'ET'], slackPingsSuppressed: 47,
    escalation: [
      { name: 'Sam Okafor', role: 'Owns the vendor case; sends increasingly formal emails', tz: 'UTC+1' },
    ],
    timeline: [
      { at: hours(28), entry: 'Latency alerts on the identity provider. Not down. Not up. Somewhere spiritually in between.', kind: 'alert' },
      { at: hours(24), entry: 'Vendor ticket opened. First-line support asked if we tried clearing our cache. We are a data center.', kind: 'update' },
      { at: hours(6), entry: 'Vendor admits to a "degraded shard." Monitoring continues. Trust does not.', kind: 'progress' },
    ],
  },
  {
    id: 'INC-0087', title: 'Core outage — the 71-hour marathon (resolved)', severity: 'SEV1', status: 'resolved',
    summary: 'SAN controller panic cascaded into a failover that did not fail over, then a replication split-brain. 71 continuous hours from first page to all-clear. One incident commander, four time zones, one tornado sighting, zero completed meals.',
    commander: 'u-rk', startedAt: days(4), timezonesAffected: ['PT', 'CT', 'ET', 'UTC+1'], slackPingsSuppressed: 1204,
    escalation: [
      { name: 'R. Keys', role: 'Incident commander — 71 hours, start to finish, allegedly voluntarily', tz: 'CT' },
      { name: 'Vendor TAM', role: 'Joined hour 30. Left hour 31. Rejoined hour 55 to say "interesting."', tz: 'PT' },
    ],
    timeline: [
      { at: days(4), entry: 'SAN controller A panics. Controller B, its designated understudy, declines the role.', kind: 'alert' },
      { at: days(3.7), entry: 'Split-brain declared. Both replicas believe they are the real one. Neither is entirely correct.', kind: 'escalation' },
      { at: days(3.2), entry: 'Hour 19: incident commander driving between sites spots a tornado two miles out. Bridge call continues. Tornado declines to join.', kind: 'update' },
      { at: days(1.5), entry: 'Hour 60: reconciliation script finishes. Data intact. Commander communicating primarily in nods.', kind: 'progress' },
      { at: hours(25), entry: 'Hour 71: all-clear. Postmortem scheduled. Sleep scheduled. One of these will be rescheduled.', kind: 'resolved' },
    ],
  },
]

export const SEED_ACTIVITY = [
  { at: mins(4), who: 'u-pn', text: 'rerouted the Ridgeline east–west traffic again — backup path now at 71% and merely furious instead of on fire', ref: 'INC-0091' },
  { at: mins(8), who: 'u-mw', text: 'confirmed first spliced pair tests clean. Was thanked. Was also not allowed to touch anything else', ref: 'INC-0091' },
  { at: mins(23), who: 'u-dp', text: 'traced the zombie webhook to a 2023 test workspace named "delete-me-later." It was not deleted later', ref: 'TKT-4470' },
  { at: hours(1), who: 'u-so', text: 'sent vendor escalation email #6 re: SSO latency, now with SLA clause citations in bold', ref: 'INC-0090' },
  { at: hours(2), who: 'u-so', text: 'closed TKT-4390 with a packet capture, a diagram, and a prayer. Janet reopen countdown: T-minus unknown', ref: 'TKT-4390' },
  { at: hours(3), who: 'u-rk', text: 'suppressed 118 duplicate Slack pings on the fiber incident so the bridge could hear itself think', ref: 'INC-0091' },
  { at: hours(5), who: 'u-dp', text: 'submitted RCA draft #5. It contains the phrase "power state transition remediation." We are so close', ref: 'TKT-4423' },
  { at: hours(7), who: 'u-so', text: 'found the backups have been lovingly archiving an empty mount since March. Job status: green the whole time', ref: 'TKT-4444' },
  { at: hours(9), who: 'u-pn', text: 'mapped 2,147 alert storm alerts to one (1) dead switch. Alert-to-problem ratio remains aspirational', ref: 'TKT-4462' },
  { at: hours(14), who: 'u-dp', text: 'located a wiki export from 2024 in a former employee\'s Downloads folder. This is our disaster recovery now', ref: 'TKT-4440' },
  { at: mins(35), who: 'u-mw', text: 'propped Conference Room Aspen\'s door with a chair. The change request to keep the chair is pending; the template is inside the room', ref: 'TKT-4479' },
  { at: hours(4), who: 'u-pn', text: 'confirmed the IDF-3 toaster is running a full BGP daemon. Peering session: stable. Feelings: mixed', ref: 'TKT-4482' },
  { at: hours(6), who: 'u-so', text: 'asked the directory why STAPLR-01 holds document-retention scopes. The directory said "inherited." From whom, it declined to say', ref: 'TKT-4476' },
]

export const SEED_ONCALL = [
  { who: 'u-pn', region: 'Pacific (PT)', window: '22:00–06:00', status: 'active', note: 'Primary. Currently juggling the backbone reroute.' },
  { who: 'u-rk', region: 'Central (CT)', window: '06:00–14:00', status: 'active', note: 'Incident commander. Hour 71 of consciousness. Do not startle.' },
  { who: 'u-mw', region: 'Eastern (ET)', window: '14:00–22:00', status: 'standby', note: 'Field dispatch. Now accompanied by a laminated cable map.' },
  { who: 'u-so', region: 'Berlin (UTC+1)', window: '00:00–08:00', status: 'active', note: 'Overnight coverage. Communicates in precise, weary sentences.' },
]

// ————— Authored content: these two collections are the app's sacred texts. —————

export const AI_PROMPTS = [
  {
    id: 'pr-1', title: 'The RCA Launderer', category: 'Paperwork',
    test: 'Field test: the board accepted the RCA on first read. Dylan has been asked to present it as a best practice, using several words he does not yet know.',
    when: 'When the honest answer is "we turned it off and on again" and the change board requires something with a causal chain in it.',
    prompt: 'Rewrite this incident timeline as a formal root cause analysis that a change advisory board will accept. The actual fix was turning it off and on again. Do not use that phrase. Identify what state the system was in, why a restart cleared that state, and what prevents the state from recurring. Invent nothing — make what actually happened sound like the engineering it secretly was.',
    when2: 'When the honest answer is "{nemesis} turned it off and on again" and the change board requires something with a causal chain in it.',
    prompt2: 'Rewrite this incident timeline as a formal root cause analysis that a change advisory board will accept. The actual fix was {nemesis} turning it off and on again. Do not use that phrase. Identify what state the system was in, why a restart cleared that state, and what prevents the state from recurring. Invent nothing — make what {nemesis} actually did sound like the engineering it secretly was.',
  },
  {
    id: 'pr-2', title: 'The Field Tech Firewall', category: 'Dispatch',
    test: 'Field test: Marcus read sentence one, touched only the named cable, and thanked you for the details he did not read. The region survives.',
    test2: 'Field test: {nemesis} read sentence one, touched only the named cable, and thanked you for the details {nemesis} did not read. The region survives.',
    when: 'When the last dispatch ended with the wrong fiber cut because the tech read neither the ticket nor the cable map, apparently on principle.',
    prompt: 'Rewrite this work order for a field technician who will read at most one sentence. Sentence one must name the ONLY cable that may be touched, in caps, with its color and label text. Sentence two must state what happens to the region if any other cable is touched. Everything else goes below a line marked "IF YOU ARE STILL READING, THANK YOU, HERE ARE DETAILS."',
    when2: 'When the last dispatch ended with the wrong fiber cut because {nemesis} read neither the ticket nor the cable map, apparently on principle.',
    prompt2: 'Rewrite this work order for {nemesis}, who will read at most one sentence. Sentence one must name the ONLY cable that may be touched, in caps, with its color and label text. Sentence two must state what happens to the region if any other cable is touched. Everything else goes below a line marked "IF YOU ARE STILL READING, {nemesis}, THANK YOU, HERE ARE DETAILS."',
  },
  {
    id: 'pr-3', title: 'The Three-Bullet Executive', category: 'Communication',
    test: 'Field test: leadership read all three bullets and approved the decision in four minutes. Nobody involved has recovered from the speed.',
    when: 'When leadership wants an update on the 71-hour outage and their attention span is measured in bullet points, of which you get three.',
    prompt: 'Summarize this incident for an executive who will read exactly three bullets. Bullet one: current status in plain words a customer could repeat. Bullet two: business impact in hours and dollars, no hedging. Bullet three: the single decision or resource I need from them, phrased so "yes" is the easy answer. No jargon. No acronyms. No hope as a strategy.',
  },
  {
    id: 'pr-4', title: 'The Reopen Whisperer', category: 'Communication',
    test: 'Field test: Janet replied "thank you for explaining!!" and reopened nothing. Forecasters are calling it a miracle. Ops is calling it Tuesday, cautiously.',
    test2: 'Field test: {nemesis} replied "thank you for explaining!!" and reopened nothing. Forecasters are calling it a miracle. Ops is calling it Tuesday, cautiously.',
    when: 'When the same resolved ticket comes back for the third time this week and your first draft reply is legally actionable.',
    prompt: 'Draft a reply to a user who has reopened the same resolved ticket three times. Requirements: professionally warm, zero sarcasm survives to the final text, restate the actual fix in one numbered step they can do in under a minute, and end with a sentence that makes reopening a fourth time feel like a mutual failure we would both grieve. Tone: a hostage negotiator who genuinely likes the hostage-taker.',
    when2: 'When {nemesis} reopens the same resolved ticket for the third time this week and your first draft reply is legally actionable.',
    prompt2: 'Draft a reply to {nemesis}, who has reopened the same resolved ticket three times. Requirements: professionally warm, zero sarcasm survives to the final text, restate the actual fix in one numbered step {nemesis} can do in under a minute, and end with a sentence that makes reopening a fourth time feel like a mutual failure you would both grieve. Tone: a hostage negotiator who genuinely likes the hostage-taker.',
  },
  {
    id: 'pr-5', title: 'The Slack Strainer', category: 'Triage',
    test: 'Field test: 400 messages reduced to nine facts and one lie. The lie was "fixed now," posted by the person who caused it.',
    when: 'When a P1 spans four time zones and the incident channel has 400 unread messages, of which 380 are the words "any update?"',
    prompt: 'Here are the unread messages from an incident channel. Extract exactly three lists: (1) new symptoms reported, with timestamps; (2) changes anyone actually made to any system, with who and when; (3) anyone claiming something is fixed, with their evidence or lack thereof. Discard every message that is only a status request, an emoji, or a person saying "same." Order everything chronologically.',
  },
  {
    id: 'pr-6', title: 'The 3 AM Handoff', category: 'Continuity',
    test: 'Field test: the night shift read the top warning, skipped the middle, and read the bottom warning — which was the same warning. The design worked. Nothing was retried.',
    when: 'When you must hand the incident to the next time zone and your working memory has been reduced to vibes and terror.',
    prompt: 'Turn these raw notes into a shift handoff for an engineer who is half asleep. Structure: what is broken, in one sentence. What I tried, in order, with what happened. What made it WORSE, flagged in caps so they do not retry it. What I was about to try next, and why. Repeat the single most important warning twice — once at the top, once at the bottom — because they will only read one end of this document.',
    when2: 'When you must hand the incident to {nemesis} in the next time zone and your working memory has been reduced to vibes and {ritual}.',
    prompt2: 'Turn these raw notes into a shift handoff for {nemesis}, who is half asleep. Structure: what is broken, in one sentence. What I tried, in order, with what happened. What made it WORSE, flagged in caps so {nemesis} does not retry it. What I was about to try next, and why. Repeat the single most important warning twice — once at the top, once at the bottom — because {nemesis} will only read one end of this document.',
  },
  {
    id: 'pr-7', title: 'The Vendor Séance', category: 'Escalation',
    test: 'Field test: the vendor skipped two script tiers and joined the bridge at the proposed time, visibly unsettled that the diagnostics were already attached.',
    when: 'When first-line vendor support wants to collect diagnostics one file at a time over six business days while your hair is on fire.',
    prompt: 'Draft a vendor escalation email that skips the first-line script without me saying "let me speak to your manager." Cite the exact SLA clause and response-time commitment from this contract excerpt. List every diagnostic they could conceivably request, attached preemptively and named clearly. Close by proposing a specific bridge time in THEIR time zone, because I have run out of my own.',
    when2: 'When {nemesis} on first-line vendor support wants to collect diagnostics one file at a time over six business days while your hair is on fire.',
    prompt2: 'Draft a vendor escalation email that gets past {nemesis} and the first-line script without me saying "let me speak to your manager." Cite the exact SLA clause and response-time commitment from this contract excerpt. List every diagnostic they could conceivably request, attached preemptively and named clearly. Close by proposing a specific bridge time in THEIR time zone, because I have run out of my own.',
  },
  {
    id: 'pr-8', title: 'The Alert Storm Confessional', category: 'Triage',
    test: 'Field test: the storm reduced to one alert that mattered. The dependency rule is deployed and 2,146 pagers have entered grief counseling.',
    when: 'When one dead switch generates 2,147 pages overnight and each alert believes it is the main character.',
    prompt: 'Here are last night\'s alerts. Group them into: (1) the thing that actually broke, (2) things that were merely emotionally affected by it, and (3) alerts that fire nightly and mean nothing, listed for deletion. Then tell me the ONE alert I should have looked at first, and write the dependency rule that would have suppressed the other 2,146.',
  },
  {
    id: 'pr-9', title: 'The Incident Necromancer', category: 'Triage',
    test: 'Field test: three theories entered; the evidence killed two. The survivor was nobody\'s favorite, which is how you know it is true. Something in the timeline moved on its own. Reality −3%.',
    testDelta: -3,
    when: 'When the symptoms contradict each other, the graphs contradict the symptoms, and the timeline is a rumor with timestamps.',
    prompt: 'Reanimate these contradictory symptoms as a single timeline. Keep at least three competing theories alive until the evidence kills them — mark each theory with the observation that would falsify it, and never let a theory die of consensus alone. Consensus is how the wrong fiber gets cut.',
  },
  {
    id: 'pr-10', title: 'The Vendor Ouija Board', category: 'Escalation',
    test: 'Field test: question three summoned a measurable fact from the vendor. The fact has been framed. The vendor asked for it back; the request was declined.',
    when: 'When the vendor asks "what seems to be the problem" for the third time and the problem is that they keep asking.',
    prompt: 'Translate "the network is slow" into six questions capable of summoning a measurable fact from a vendor support channel. Each question must be answerable with a number, a timestamp, or a log line — never with "we\'re looking into it." Order them so the first answer makes the second question unavoidable.',
  },
  {
    id: 'pr-11', title: 'The Change Gremlin', category: 'Change Control',
    test: 'Field test: the gremlin found a hole at minute 41 of the window. The plan was amended. The gremlin is still in the plan somewhere, and it is proud of you. Reality −4%.',
    test2: 'Field test: the gremlin found a hole at minute 41 of {nemesis}\'s window. The plan was amended. The gremlin is still in the plan somewhere, and it is proud of you. Reality −4%.',
    testDelta: -4,
    when: 'When the maintenance plan says "should be seamless" and you have learned what that word costs.',
    prompt: 'Attack this maintenance plan. Try to destroy it using only spite, edge cases, rollback failures, and the confidence of a vendor PDF. For every hole you find, state the exact minute of the window where it detonates and what the bridge call sounds like afterward. If the plan survives, say so — grudgingly.',
    when2: 'When {nemesis}\'s maintenance plan says "should be seamless" and you have learned what that word costs.',
    prompt2: 'Attack {nemesis}\'s maintenance plan. Try to destroy it using only spite, edge cases, rollback failures, and the confidence of a vendor PDF. For every hole you find, state the exact minute of the window where it detonates and what {nemesis} will say on the bridge call afterward. If the plan survives, tell {nemesis} so — grudgingly.',
  },
  {
    id: 'pr-12', title: 'The Rubber Duck With Teeth', category: 'Triage',
    test: 'Field test: the duck asked one question and your theory did not survive it. This is the best possible outcome, and it still stings.',
    when: 'When your theory of the outage is elegant, satisfying, and suspiciously convenient.',
    prompt: 'Interrogate my theory of this incident. Ask one diagnostic question at a time and attack any conclusion that outruns the evidence. Do not accept "it\'s probably" — demand the observation that turns it into "it is." When I get defensive, that is the load-bearing assumption; bite there.',
  },
  {
    id: 'pr-13', title: 'The Stakeholder Fog Machine', category: 'Communication',
    test: 'Field test: the update shipped. Nobody asked about the weather. Legal called it "a masterpiece of load-bearing vagueness." Reality noticed the omission. Reality −4%.',
    testDelta: -4,
    when: 'When the update must be honest enough for the record and vague enough that nobody asks why the server room has weather.',
    prompt: 'Draft a compassionate customer-facing outage update that is technically accurate and admits nothing actionable. It must not confirm that the server room has developed weather, must not imply engineering has stopped existing, and must translate "we rebooted it and now the building is warmer" into language an executive can read aloud. End with gratitude that sounds structural.',
    when2: 'When the update must be honest enough for the record and vague enough that nobody asks why {place} has weather.',
    prompt2: 'Draft a compassionate customer-facing outage update that is technically accurate and admits nothing actionable. It must not confirm that {place} has developed weather, must not imply engineering has stopped existing, and must translate "we rebooted it and now the building is warmer" into language an executive can read aloud. End with gratitude that sounds structural.',
  },
]

export const EFFICIENCY_TIPS = [
  {
    id: 'tip-1', title: 'Update the ticket in the meeting, not after', category: 'Tickets',
    adopt: 'Adopted. A note typed mid-meeting has already answered a question asked three weeks later. Documentation, but in advance. Reality +3%.',
    adoptDelta: 3,
    body: 'If you say "I\'ll update the ticket later," you have scheduled a lie. Later does not exist. Later is where documentation goes to die. Type the note while the person is still talking — they will think you are diligent, and for once they will be right.',
    body2: 'If you say "I\'ll update the ticket later," you have scheduled a lie. Later does not exist. Later is where documentation goes to die, somewhere between {ritual} and going home. Type the note while the person is still talking — they will think you are diligent, and for once they will be right.',
  },
  {
    id: 'tip-2', title: 'Label both ends of every cable', category: 'Field Ops',
    adopt: 'Adopted. The next dispatch found both labels, touched the right cable, and left a thank-you note. The note has been framed. Reality +3%.',
    adopt2: 'Adopted. {nemesis} found both labels, touched the right cable, and left a thank-you note. The note has been framed. Reality +3%.',
    adoptDelta: 3,
    body: 'The end you did not label is, with mathematical certainty, the end the field tech will find. Label both ends, photograph both ends, and put the photo IN the ticket. Assume the reader is holding wire cutters and a grudge against reading.',
    body2: 'The end you did not label is, with mathematical certainty, the end {nemesis} will find. Label both ends, photograph both ends, and put the photo IN the ticket. Assume {nemesis} is holding wire cutters and a grudge against reading.',
  },
  {
    id: 'tip-3', title: 'The junior tech is not wrong, just not finished', category: 'Mentoring',
    adopt: 'Adopted. Draft five of the RCA contains an actual causal chain. The change board wept — briefly, professionally. Reality +2%.',
    adoptDelta: 2,
    body: '"Did you try turning it off and on again" is a fine first sentence. It is a terrible whole paragraph. Teach the next sentence: "and here is what the restart cleared, which tells us what actually broke." Root cause is a habit, not a talent. Fourth time\'s the charm.',
    body2: '"Did you try turning it off and on again" is a fine first sentence for {nemesis}. It is a terrible whole paragraph. Teach {nemesis} the next sentence: "and here is what the restart cleared, which tells us what actually broke." Root cause is a habit, not a talent. Fourth time\'s the charm.',
  },
  {
    id: 'tip-4', title: 'A runbook that says "this usually works" is a horoscope', category: 'Docs',
    adopt: 'Adopted. The runbook now states expected outputs. Step 4 turned out to be load-bearing and is now labeled as such. Reality +2%.',
    adoptDelta: 2,
    body: 'Runbooks contain steps, expected outputs, and what to do when the output is wrong. If a step relies on optimism, you do not have a runbook — you have a mood board for an outage. Fix it now, while you still remember why step 4 is load-bearing.',
  },
  {
    id: 'tip-5', title: 'Snooze nothing', category: 'Monitoring',
    adopt: 'Adopted. Fourteen alerts were deleted outright and one was fixed. The on-call phone slept through the night for the first time since March. Reality +3%.',
    adoptDelta: 3,
    body: 'An alert you snooze is an outage you have scheduled for a less convenient time. Either the alert matters — fix the thing — or it does not — delete the alert. There is no third state. The third state is how you end up with 2,147 pages about one switch.',
  },
  {
    id: 'tip-6', title: 'Write the postmortem angry, edit it calm', category: 'Process',
    adopt: 'Adopted. The angry draft remembered everything; the calm edit kept the facts and lost the adjectives. Marcus\'s feelings survive. Reality +2%.',
    adoptDelta: 2,
    body: 'Draft the postmortem while you are still furious — the anger remembers every detail with forensic clarity. Then edit it after sleeping, when you remember that blameless is a policy and also that Marcus has feelings. Publish somewhere between those two people.',
  },
  {
    id: 'tip-7', title: 'Verify restores, not backups', category: 'Backups',
    adopt: 'Adopted. The quarterly restore test ran early and produced actual bytes. Champagne is not in budget; a green checkmark you can trust is close enough. Reality +4%.',
    adoptDelta: 4,
    body: 'A green backup job is a feeling. A tested restore is a fact. Schedule restore tests like your job depends on them, because it is the only task on your calendar of which that is literally true.',
  },
  {
    id: 'tip-8', title: 'If users are your monitoring, your monitoring is users', category: 'Monitoring',
    adopt: 'Adopted. Monitoring paged 40 seconds before the first Slack message for the third incident running. Janet has begun to suspect you know things. Reality +3%.',
    adoptDelta: 3,
    body: 'Your alerting should page you before the first Slack message lands. Every incident discovered by a human is a monitoring gap wearing a person costume. Log the gap. Close the gap. Repeat until the NOC finds out before Janet does.',
  },
  {
    id: 'tip-9', title: 'Every "temporary" fix gets a ticket with a date', category: 'Tickets',
    adopt: 'Adopted. Four "temporary" fixes now have tickets with dates. One date has already been missed, but it was missed in an auditable way. Reality +2%.',
    adoptDelta: 2,
    body: 'Temporary is not a state of matter. That zip-tied failover, that hardcoded IP, that cron job named "DELETE-ME-LATER" — each one is a promise you are making to a stranger: future you, at 3 AM, who has done nothing to deserve it. Ticket it or own it forever.',
    body2: 'Temporary is not a state of matter. That zip-tied failover, that hardcoded IP, that {device} someone wired in "just for now" — each one is a promise you are making to a stranger: future you, at 3 AM, who has done nothing to deserve it. Ticket it or own it forever.',
  },
  {
    id: 'tip-10', title: 'Park facing the exit during tornado season', category: 'Survival',
    adopt: 'Adopted. You parked facing the exit. The sky stayed blue, this time, and the bridge call ended on purpose instead of by weather. Reality +2%.',
    adoptDelta: 2,
    body: 'This is a networking tip. You cannot restore fiber from a ditch. Know the weather before a site drive, keep the incident bridge on speaker, and accept that some calls end when the sky turns green. The postmortem can be rescheduled. You cannot.',
    body2: 'This is a networking tip. You cannot restore fiber from a ditch, and you cannot restore it from {place} either. Know the weather before a site drive, keep the incident bridge on speaker, and accept that some calls end when the sky turns green. The postmortem can be rescheduled. You cannot.',
  },
  {
    id: 'tip-11', title: 'Keep a "things users told me" log', category: 'Survival',
    adopt: 'Adopted. The log\'s pattern-recognition rate is now eighty percent, as designed. The other twenty percent remains protected by tradition. Reality +2%.',
    adoptDelta: 2,
    body: '"Nothing changed." "It worked yesterday." "I\'m at the office" (sent from a hotel). Log them all — not for revenge, for pattern recognition. Fine: eighty percent pattern recognition, twenty percent revenge. The ratio is protected by tradition.',
    body2: '"Nothing changed." "It worked yesterday." "I\'m at the office" (sent from a hotel, by {nemesis}). Log them all — not for revenge, for pattern recognition. Fine: eighty percent pattern recognition, twenty percent revenge. The ratio is protected by tradition.',
  },
  {
    id: 'tip-12', title: 'Suppress pings, not people', category: 'Incidents',
    adopt: 'Adopted. The bots went quiet, and the person who said "that graph looks weird" was heard. They were right. They are always right. Reality +3%.',
    adoptDelta: 3,
    body: 'During a P1, mute the channel bots, the duplicate alerts, and the "any update?" chorus — ruthlessly. But answer the humans on the bridge fast and specifically. Silence the noise so you can hear the one person quietly saying "hey, that graph looks weird." That person is always right.',
  },
  {
    id: 'tip-13', title: 'Batch your emergencies', category: 'Process',
    adopt: 'Adopted. Incidents now occur at 2 PM sharp. Today\'s emergency arrived at 9 AM and waited quietly nearby, watching you, until the window opened. Reality −5%.',
    adoptDelta: -5,
    body: 'Consider experiencing incidents at a predictable time each afternoon. Consistency protects stakeholder confidence, and the pager, like any instrument, benefits from a rehearsal schedule. Incidents arriving outside the window may wait quietly nearby.',
    body2: 'Consider experiencing incidents at a predictable time each afternoon — ideally right after {ritual}. Consistency protects stakeholder confidence, and the pager, like any instrument, benefits from a rehearsal schedule. Incidents arriving outside the window may wait quietly nearby.',
  },
  {
    id: 'tip-14', title: 'Practice visible resilience', category: 'Survival',
    adopt: 'Adopted. Utilization reads 104%. The wellness dashboard shows a green heart. The camera saw nothing, which was the entire design. Reality −3%.',
    adoptDelta: -3,
    body: 'Crying below camera height is not reflected in utilization reporting and may be completed during meetings. This is not a joke about wellness; it is a wellness feature about jokes. Hydrate afterward — tears are a fluid loss and you are on call.',
  },
  {
    id: 'tip-15', title: 'Delegate to your future self', category: 'Tickets',
    adopt: 'Adopted. Monday You has received the follow-up, the notes, and the resentment. Monday You is drafting a reply to Friday You that HR would classify as escalatory. Reality −4%.',
    adoptDelta: -4,
    body: 'Schedule the follow-up for Monday. Future You has repeatedly demonstrated availability, has never once declined a meeting, and cannot currently object. This is the only direct report you will never lose to attrition. Treat them accordingly — leave notes.',
  },
  {
    id: 'tip-16', title: 'The Universal Law of DNS', category: 'Doctrine',
    adopt: 'Adopted. It was DNS. The outage is being framed — the outage, not the law. The law needs no frame; it is written on the inside of every eyelid on call. Reality +2%.',
    adoptDelta: 2,
    body: 'It is always DNS. If it is not DNS, check BGP. If it is not BGP, it is an MTU mismatch. If it is not MTU, it was DNS the whole time and you checked wrong. This law admits no exceptions — only outages that have not finished being diagnosed.',
  },
  {
    id: 'tip-17', title: 'One trace is a rumor', category: 'Doctrine',
    adopt: 'Adopted. Both traces were captured. The vendor call lasted eleven minutes — a personal best — and ended with the vendor apologizing to the exhibits. Reality +2%.',
    adoptDelta: 2,
    body: 'When packet loss appears, capture from both sides. One trace is a rumor. Two traces are a courtroom drama with exhibits. The defendant is always DNS — see the Universal Law. Bring both exhibits to the vendor call and watch the meeting get shorter.',
  },
  {
    id: 'tip-18', title: 'Never troubleshoot from memory after midnight', category: 'Survival',
    adopt: 'Adopted. You walked to the closet and read the labels. The labels were right. Your memory had been serving a cable path from 2023. Reality +2%.',
    adopt2: 'Adopted. You walked to {place} and read the labels. The labels were right. Your memory had been serving a cable path from 2023. Reality +2%.',
    adoptDelta: 2,
    body: 'Never troubleshoot a cable path from memory after midnight. Memory is just DNS cache for trauma, and yours is serving stale records with a negative TTL. Walk to the closet. Read the labels. The labels do not get tired.',
    body2: 'Never troubleshoot a cable path from memory after midnight. Memory is just DNS cache for trauma, and yours is serving stale records with a negative TTL. Walk to {place}. Read the labels. The labels do not get tired.',
  },
  {
    id: 'tip-19', title: 'Calibrate the gas-station coffee scale', category: 'Survival',
    adopt: 'Adopted at cup four. The packets can see you now. One of them waved. Productivity is immaculate and must never be discussed again. Reality −3%.',
    adoptDelta: -3,
    body: 'One cup: functional. Two: articulate. Three: you can hear the switch fans change pitch before the alert fires. Four: you can see the packets, individually, and they can see you. Stop at three. Nobody debugs well from inside the packet stream.',
  },
]

export function buildSeedState() {
  return {
    tickets: SEED_TICKETS.map((t) => ({ ...t })),
    incidents: SEED_INCIDENTS.map((i) => ({ ...i, timeline: i.timeline.map((e) => ({ ...e })), escalation: i.escalation.map((e) => ({ ...e })) })),
    activity: SEED_ACTIVITY.map((a) => ({ ...a })),
    oncall: SEED_ONCALL.map((o) => ({ ...o })),
    // The bestiary of hybrids bred this session. Starts empty; grows only when
    // the player accepts fusion recommendations. Never persisted — rebuilding
    // seed state on reload or reset wipes it, by design.
    cmdb: [],
    settings: {
      pageBeforeTwitter: true,
      suppressAnyUpdate: true,
      janetEarlyWarning: true,
      calmVoice: false,
    },
  }
}
