import { RECORDS_A } from "./records-a";
import { RECORDS_B } from "./records-b";
import { WORKS } from "./bibliography";
import type {
  Continent,
  EntityKind,
  Record,
  RemembranceCluster,
  SourceKind,
  ThreadId,
  VeilDepth,
} from "./types";

export * from "./types";
export { WORKS } from "./bibliography";

export const RECORDS: Record[] = [...RECORDS_A, ...RECORDS_B];

export const BY_ID = new Map(RECORDS.map((r) => [r.id, r]));

/**
 * Every `sources[].work` has to name a real entry in the bibliography.
 * `Citation.work` is a plain string — the data files would otherwise have to
 * import from bibliography.ts purely to get the key union — so a typo is
 * caught here instead, loudly, the moment the module loads in dev.
 */
if (import.meta.env.DEV) {
  const missing = RECORDS.flatMap((r) =>
    (r.sources ?? [])
      .filter((c) => !(c.work in WORKS))
      .map((c) => `${r.id} → "${c.work}"`),
  );
  if (missing.length) {
    throw new Error(`Unknown citation keys:\n  ${missing.join("\n  ")}`);
  }
}

/** How much of the atlas has actually been checked, for the sources page. */
export const COVERAGE = {
  total: RECORDS.length,
  checked: RECORDS.filter((r) => r.verified && r.verified.status !== "unchecked").length,
  sourced: RECORDS.filter((r) => r.sources?.length).length,
};

// ── epistemic vocabulary ────────────────────────────────────────────────
export const SOURCE_META: Record2<
  SourceKind,
  { label: string; short: string; blurb: string; tex: string }
> = {
  living: {
    label: "Living tradition",
    short: "living",
    blurb:
      "Practised now, by people who can describe it themselves. Drawn crisp and solid.",
    tex: "tex-living",
  },
  historical: {
    label: "Documented history",
    short: "archival",
    blurb:
      "Attested in records, objects or images from the past. Drawn with an archival frame.",
    tex: "tex-historical",
  },
  reconstructed: {
    label: "Reconstructed",
    short: "reconstructed",
    blurb:
      "Pieced together from partial, damaged or second-hand evidence. Edges left soft.",
    tex: "tex-reconstructed",
  },
  folklore: {
    label: "Traditional folklore",
    short: "folklore",
    blurb:
      "Carried orally, variable by village and by teller. Drawn stippled, never quite fixed.",
    tex: "tex-folklore",
  },
  report: {
    label: "Reported account",
    short: "field report",
    blurb:
      "A dated observation or claim by named people. Drawn as a field note, not a conclusion.",
    tex: "tex-report",
  },
  contested: {
    label: "Contested",
    short: "contested",
    blurb:
      "Origin, meaning or authenticity is genuinely disputed. Drawn faintly, on purpose.",
    tex: "tex-contested",
  },
};

type Record2<K extends string, V> = { [P in K]: V };

export const ENTITY_META: Record2<
  EntityKind,
  { label: string; blurb: string; col: [string, string] }
> = {
  sacred: {
    label: "Religious or spiritual being",
    blurb:
      "Held within a living or historical faith. Described here as belief, not as a specimen.",
    col: ["Religious &", "spiritual beings"],
  },
  folk: {
    label: "Traditional folklore being",
    blurb: "Carried in oral tradition, varying by region and teller.",
    col: ["Traditional", "folklore"],
  },
  legend: {
    label: "Legendary creature",
    blurb: "Fixed in named narrative cycles, sagas or written tales.",
    col: ["Legendary", "creatures"],
  },
  literary: {
    label: "Documented invention",
    blurb: "Has a known author, date and moment of creation.",
    col: ["Documented", "inventions"],
  },
  hoax: {
    label: "Fabrication",
    blurb: "Involves a demonstrated deliberate deception.",
    col: ["Fabrications", "& hoaxes"],
  },
  cryptid: {
    label: "Modern cryptid",
    blurb: "Rests on modern eyewitness reports and their investigation.",
    col: ["Modern", "cryptids"],
  },
  urban: {
    label: "Contemporary legend",
    blurb: "Spread recently and rapidly, often traceable to a specific year.",
    col: ["Contemporary", "legends"],
  },
};

export const ENTITY_ORDER: EntityKind[] = [
  "sacred",
  "folk",
  "legend",
  "literary",
  "hoax",
  "cryptid",
  "urban",
];

export const VEIL_META: Record2<VeilDepth, { label: string; blurb: string }> = {
  threshold: {
    label: "At the threshold",
    blurb: "Doorways, water's edge, dusk, the road out of the village.",
  },
  presence: {
    label: "Presences",
    blurb: "The dead and the unseen, moving among the living.",
  },
  passage: {
    label: "The passage",
    blurb: "Escorts, ferries, bridges, and those who conduct the dead.",
  },
  otherworld: {
    label: "The other side",
    blurb: "Underworlds, judgements, and what is said to lie beyond.",
  },
};

export const VEIL_ORDER: VeilDepth[] = [
  "threshold",
  "presence",
  "passage",
  "otherworld",
];

export const REMEMBRANCE_META: Record2<
  RemembranceCluster,
  { label: string; blurb: string }
> = {
  offering: { label: "Offerings & Food", blurb: "What is set out, poured, burned or shared." },
  altar: { label: "Altars & Household", blurb: "The dead kept inside the home." },
  grave: { label: "Graves & Remains", blurb: "Tending the place and the body." },
  festival: { label: "Festivals & Processions", blurb: "Remembrance done in public, together." },
  mourning: { label: "Mourning & Rites", blurb: "The work of grief, and its formal ending." },
  object: { label: "Objects & Images", blurb: "Things made to hold a person." },
};

export const REMEMBRANCE_ORDER: RemembranceCluster[] = [
  "offering",
  "altar",
  "grave",
  "festival",
  "mourning",
  "object",
];

export const THREAD_META: {
  id: ThreadId;
  label: string;
  blurb: string;
}[] = [
  {
    id: "food",
    label: "Food for the Dead",
    blurb:
      "Rice, wheat, bread, beans, wine. Feeding the dead is one of the most widespread things humans do, and the reasons given for it differ completely.",
  },
  {
    id: "water",
    label: "Crossing Water",
    blurb:
      "A river, a ferry, a bridge, a lantern set on a current. Water as the thing that separates, and the thing that must be crossed.",
  },
  {
    id: "masks",
    label: "Masked Visitors",
    blurb:
      "A person puts on cloth, wood or straw, and for a while is not entirely a person. The visitor may be an ancestor, a spirit, or winter itself.",
  },
  {
    id: "lights",
    label: "Lights That Lure",
    blurb:
      "A flame off the path. Sometimes a soul, sometimes a warning, sometimes marsh gas — and often all three within the same village.",
  },
  {
    id: "return",
    label: "The Dead Return Home",
    blurb:
      "Doors left open, tables laid, saunas heated. In many places the dead are expected at a particular time, and preparations are made.",
  },
  {
    id: "descent",
    label: "Journeys Into the Underworld",
    blurb:
      "Gates, tolls, layers, judgements. Where the afterlife is imagined as a journey, its structure tends to mirror the society that imagined it.",
  },
  {
    id: "crossroads",
    label: "Dangerous Roads & Crossroads",
    blurb:
      "The stranger met on the way home. Roads between places belong fully to neither, and encounters there are rarely neutral.",
  },
  {
    id: "thresholds",
    label: "Doors & Thresholds",
    blurb:
      "Doorposts smeared with pitch, salt on the sill, a spoon in the rice. The boundary of the house is treated as a real boundary.",
  },
  {
    id: "animals",
    label: "Animals That Guide the Dead",
    blurb:
      "Dogs at the river, crows at the offering, jackals at the desert edge. Often the animal already present at the grave is the one given the job.",
  },
  {
    id: "flame",
    label: "Fire, Candles & Lanterns",
    blurb:
      "Fire marks the way, delivers the offering, purifies the ground, and stands in for a person's presence.",
  },
  {
    id: "ward",
    label: "Protecting the House",
    blurb:
      "Salt, iron, beans, thorns, bricks under the bed. Protective practice is usually specific, cheap and repeatable.",
  },
];

export const CONTINENT_ORDER: Continent[] = [
  "Asia",
  "West Asia",
  "Africa",
  "Europe",
  "Americas",
  "Oceania",
];

export const CONTINENT_COLOR: Record2<Continent, string> = {
  Asia: "#e0a95f",
  "West Asia": "#cf8b52",
  Africa: "#c47a55",
  Europe: "#9fb4c9",
  Americas: "#7fae97",
  Oceania: "#6f9fb0",
};

export interface CountryGroup {
  country: string;
  continent: Continent;
  ids: string[];
  lat: number;
  lng: number;
}

export const COUNTRIES: CountryGroup[] = (() => {
  const map = new Map<string, CountryGroup>();
  for (const r of RECORDS) {
    const key = r.place.country;
    let g = map.get(key);
    if (!g) {
      g = { country: key, continent: r.continent, ids: [], lat: 0, lng: 0 };
      map.set(key, g);
    }
    g.ids.push(r.id);
  }
  for (const g of map.values()) {
    const rs = g.ids.map((id) => BY_ID.get(id)!);
    g.lat = rs.reduce((a, r) => a + r.place.lat, 0) / rs.length;
    g.lng = rs.reduce((a, r) => a + r.place.lng, 0) / rs.length;
  }
  return [...map.values()].sort(
    (a, b) =>
      CONTINENT_ORDER.indexOf(a.continent) - CONTINENT_ORDER.indexOf(b.continent) ||
      a.country.localeCompare(b.country),
  );
})();

export const ENTITIES = RECORDS.filter((r) => r.entity);
export const DATED = RECORDS.filter((r) => r.calendar);

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
export const MONTH_STARTS = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];

export function dayLabel(doy: number): string {
  let m = 0;
  for (let i = 0; i < 12; i++) if (doy >= MONTH_STARTS[i]) m = i;
  return `${doy - MONTH_STARTS[m] + 1} ${MONTHS[m]}`;
}
