export type SourceKind =
  | "living"
  | "historical"
  | "reconstructed"
  | "folklore"
  | "report"
  | "contested";

export type EntityKind =
  | "folk"
  | "sacred"
  | "legend"
  | "literary"
  | "hoax"
  | "cryptid"
  | "urban";

export type VeilDepth = "threshold" | "presence" | "passage" | "otherworld";

export type RemembranceCluster =
  | "offering"
  | "altar"
  | "grave"
  | "festival"
  | "mourning"
  | "object";

export type ThreadId =
  | "food"
  | "water"
  | "masks"
  | "lights"
  | "return"
  | "descent"
  | "crossroads"
  | "thresholds"
  | "animals"
  | "flame"
  | "ward";

export type Continent =
  | "Asia"
  | "Europe"
  | "Africa"
  | "Americas"
  | "Oceania"
  | "West Asia";

export interface Silhouette {
  shape:
    | "shade"
    | "humanoid"
    | "quadruped"
    | "winged"
    | "aquatic"
    | "serpent"
    | "light"
    | "masked"
    | "bird"
    | "composite";
}

export interface EntityInfo {
  kind: EntityKind;
  shape: Silhouette["shape"];
  names: { name: string; lang: string }[];
  earliest: string;
  earliestYear: number; // negative = BCE, used for the field-guide time axis
  range: string;
  traits: string[];
  variants?: string[];
  accounts?: { when: string; what: string }[];
  development?: string;
}

export interface CalendarInfo {
  /** approximate day-of-year anchor, 1-365 */
  start: number;
  end?: number;
  label: string;
  drift?: "lunar" | "variable" | "fixed";
  theme:
    | "ancestors"
    | "remembrance"
    | "harvest"
    | "boundary"
    | "rebirth"
    | "spirits";
}

/**
 * How far a source can be leaned on.  Ordered loosely from strongest.
 *
 * `reference` is for encyclopaedia-style overviews.  They are useful for
 * orientation and never sufficient on their own for a hard claim.
 */
export type SourceTier =
  | "primary"
  | "scholarly"
  | "institutional"
  | "press"
  | "reference";

/**
 * One work in the bibliography.  Written once, cited from any number of
 * records — Yanagita 1910 backs both `kappa` and `yurei`.
 *
 * The citation is the work; `url` is a convenience.  This site deploys to
 * GitHub Pages and will sit unmaintained for years, so a book with an ISBN
 * outlives a link every time.  Identifiers are only recorded when they have
 * actually been checked — a plausible-looking wrong DOI is the exact failure
 * this whole pass exists to remove.
 */
export interface Work {
  author?: string;
  title: string;
  year?: number;
  /** publisher, journal, or the institution behind an online resource */
  publisher?: string;
  doi?: string;
  isbn?: string;
  /** must be absolute https — the built file has to work from file:// */
  url?: string;
  tier: SourceTier;
}

/**
 * A work cited from one record, with the specific thing it backs.
 *
 * Deliberately separate from `Record.source`.  That field describes how the
 * *tradition* is known — orally, from an archive, from a dated report.  This
 * describes how *the atlas* knows what it says.  Two different axes, and
 * collapsing them would wreck the epistemic design.
 *
 * `supports` matters most for folklore, where the checkable claim is never
 * "this being exists" but "this collector recorded this, in this year".
 */
export interface Citation {
  /** key into WORKS in bibliography.ts */
  work: string;
  supports: string;
}

/**
 * State of the fact-checking pass on one record.  Work-tracking first: 92
 * records across several sessions, and this is the only reliable way to know
 * what is done.  Not rendered per-record — see Sources.tsx, which states
 * coverage honestly in prose instead.
 */
export interface Verification {
  /** ISO date of the pass */
  checked: string;
  /** hard claims found and checked in this record */
  claims: number;
  status: "clean" | "amended" | "flagged" | "unchecked";
}

export interface Record {
  id: string;
  title: string;
  subtitle: string;
  culture: string;
  place: { name: string; country: string; lat: number; lng: number };
  continent: Continent;
  source: SourceKind;
  /** short line describing what kind of evidence this is */
  evidence: string;
  summary: string;
  /**
   * The same record in one plain sentence, for Lantern mode.  Written for a
   * seven-year-old and deliberately not softened — it should carry the
   * strangest true thing about the record, not a tidied-up version of it.
   */
  plain?: string;
  body: string[];
  note?: string;
  threads: ThreadId[];
  veil?: { depth: VeilDepth; role: string };
  remembrance?: { cluster: RemembranceCluster; role: string };
  calendar?: CalendarInfo;
  entity?: EntityInfo;
  tags: string[];
  /** works backing this record's hard claims; absent means not yet sourced */
  sources?: Citation[];
  verified?: Verification;
}
