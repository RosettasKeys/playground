import type { Record as Rec, ThreadId } from "../data/types";
import { COUNTRIES, ENTITY_ORDER, REMEMBRANCE_ORDER, VEIL_ORDER } from "../data";
import { flat, project, type Rot } from "./projection";

type NumMap = { [k: string]: number };

export type Mode = "atlas" | "calendar" | "veil" | "remembrance" | "guide" | "threads";

export const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "atlas", label: "Atlas", hint: "Where things are" },
  { id: "calendar", label: "Calendar", hint: "When things happen" },
  { id: "veil", label: "Veil", hint: "What might be out there" },
  { id: "remembrance", label: "Remembrance", hint: "How the dead are kept" },
  { id: "guide", label: "Field Guide", hint: "Beings, and what kind of being" },
  { id: "threads", label: "Threads", hint: "Ideas that recur" },
];

export const STAGE = { w: 1000, h: 720, cx: 500, cy: 352, R: 252 };
export const FLAT = { cx: 500, cy: 350, sx: 432, sy: 214 };

export interface NodePos {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  present: boolean;
  z: number;
}

const TAU = Math.PI * 2;

/** Small deterministic offsets so co-located records in one country stay legible. */
const SPREAD: { [id: string]: [number, number] } = (() => {
  const m: { [id: string]: [number, number] } = {};
  for (const g of COUNTRIES) {
    g.ids.forEach((id, i) => {
      if (g.ids.length === 1) {
        m[id] = [0, 0];
        return;
      }
      const a = i * 2.39996 + g.country.length;
      const r = 7.4 * Math.sqrt(i);
      m[id] = [Math.cos(a) * r, Math.sin(a) * r];
    });
  }
  return m;
})();

export function calendarAngle(doy: number) {
  return (doy / 365) * TAU - Math.PI / 2;
}

export function calendarRadius(lat: number) {
  const t = Math.min(1, Math.max(0, (lat + 55) / 110));
  return 168 + t * 128;
}

/* ── the remembrance ofrenda wall ─────────────────────────────────────────
   Six lit niches.  The geometry lives here rather than in the Stage so the
   chrome and the records it holds can never drift apart.                  */

export const NICHE = { w: 130, h: 256, spring: 130 };

export const NICHES = REMEMBRANCE_ORDER.map((cluster, i) => ({
  cluster,
  x: [170, 500, 830][i % 3],
  top: [44, 390][Math.floor(i / 3)],
}));

/** the arch itself — a flat-sided niche with a semicircular head */
export function nichePath(x: number, top: number) {
  const { w, h, spring } = NICHE;
  return (
    `M${x - w} ${top + h}L${x - w} ${top + spring}` +
    `A${w} ${w} 0 0 1 ${x + w} ${top + spring}` +
    `L${x + w} ${top + h}Z`
  );
}

/** the two steps records are set down on, front one nearest the viewer */
export const nicheSteps = (top: number) => ({ back: top + 196, front: top + 240 });

/**
 * Where the i-th of m records sits in a niche: a shallow row along the front
 * step, overflowing onto the back step once five are down.  Replaces a
 * phyllotaxis scatter that piled up badly in the nine-record clusters.
 */
export function nicheSlot(x: number, top: number, i: number, m: number) {
  const frontN = Math.min(m, 5);
  const step = nicheSteps(top);
  if (i < frontN) {
    const t = frontN === 1 ? 0.5 : i / (frontN - 1);
    return { x: x + (t - 0.5) * 196, y: step.front - 13 - Math.sin(Math.PI * t) * 5 };
  }
  const backN = m - frontN;
  const j = i - frontN;
  const t = backN === 1 ? 0.5 : j / (backN - 1);
  return { x: x + (t - 0.5) * 150, y: step.back - 13 - Math.sin(Math.PI * t) * 4 };
}

export function guideY(year: number) {
  const age = Math.max(1, 2025 - year);
  const t = Math.min(1, Math.pow(age / 5300, 0.35));
  return 596 - t * 448;
}

export function computeLayout(
  mode: Mode,
  records: Rec[],
  rot: Rot,
  activeThread: ThreadId | null,
): Map<string, NodePos> {
  const out = new Map<string, NodePos>();

  if (mode === "atlas") {
    for (const r of records) {
      const p = project(r.place.lng, r.place.lat, rot, STAGE.R, STAGE.cx, STAGE.cy);
      const [ox, oy] = SPREAD[r.id] ?? [0, 0];
      out.set(r.id, {
        x: p.x + (p.visible ? ox : 0),
        y: p.y + (p.visible ? oy : 0),
        scale: p.visible ? 0.78 + 0.32 * Math.max(0, p.cosc) : 0.5,
        opacity: p.visible ? Math.min(1, 0.22 + p.cosc * 1.6) : 0,
        present: p.visible,
        z: p.cosc,
      });
    }
    return out;
  }

  if (mode === "calendar") {
    const dated = records
      .filter((r) => r.calendar)
      .sort((a, b) => a.calendar!.start - b.calendar!.start);
    const rank: NumMap = {};
    dated.forEach((r, i) => (rank[r.id] = i));
    let undated = 0;
    const total = records.filter((r) => !r.calendar).length || 1;
    for (const r of records) {
      if (r.calendar) {
        const a = calendarAngle(r.calendar.start);
        const rad = calendarRadius(r.place.lat) + ((rank[r.id] % 3) - 1) * 15;
        out.set(r.id, {
          x: STAGE.cx + Math.cos(a) * rad,
          y: STAGE.cy + Math.sin(a) * rad,
          scale: 1,
          opacity: 1,
          present: true,
          z: 1,
        });
      } else {
        const a = (undated++ / total) * TAU;
        const rad = 96 + (undated % 3) * 11;
        out.set(r.id, {
          x: STAGE.cx + Math.cos(a) * rad,
          y: STAGE.cy + Math.sin(a) * rad * 0.92,
          scale: 0.5,
          opacity: 0.2,
          present: false,
          z: 0,
        });
      }
    }
    return out;
  }

  if (mode === "veil") {
    const bandY: NumMap = { threshold: 178, presence: 316, passage: 452, otherworld: 588 };
    for (const r of records) {
      if (r.veil) continue;
      out.set(r.id, {
        x: STAGE.cx + (r.place.lng / 180) * 418,
        y: 678,
        scale: 0.42,
        opacity: 0.13,
        present: false,
        z: -1,
      });
    }
    for (const depth of VEIL_ORDER) {
      const band = records
        .filter((r) => r.veil?.depth === depth)
        .map((r) => ({ r, x: STAGE.cx + (r.place.lng / 180) * 418 }))
        .sort((a, b) => a.x - b.x);
      const lanes = [-Infinity, -Infinity];
      band.forEach((item, i) => {
        const lane = i % 2;
        const x = Math.max(item.x, lanes[lane] + 46);
        lanes[lane] = x;
        out.set(item.r.id, {
          x: Math.min(x, STAGE.w - 46),
          y: bandY[depth] + (lane === 0 ? -22 : 24),
          scale: 1.05,
          opacity: 1,
          present: true,
          z: VEIL_ORDER.indexOf(depth),
        });
      });
    }
    return out;
  }

  if (mode === "remembrance") {
    const totals: NumMap = {};
    for (const r of records)
      if (r.remembrance)
        totals[r.remembrance.cluster] = (totals[r.remembrance.cluster] ?? 0) + 1;
    const counts: NumMap = {};
    for (const r of records) {
      if (r.remembrance) {
        const niche = NICHES[REMEMBRANCE_ORDER.indexOf(r.remembrance.cluster)];
        const i = (counts[r.remembrance.cluster] = (counts[r.remembrance.cluster] ?? 0) + 1) - 1;
        const slot = nicheSlot(niche.x, niche.top, i, totals[r.remembrance.cluster]);
        out.set(r.id, {
          x: slot.x,
          y: slot.y,
          scale: 1.05,
          opacity: 1,
          present: true,
          z: 1,
        });
      } else {
        out.set(r.id, {
          x: STAGE.cx + (r.place.lng / 180) * 452,
          y: 700,
          scale: 0.4,
          opacity: 0.11,
          present: false,
          z: -1,
        });
      }
    }
    return out;
  }

  if (mode === "guide") {
    for (const r of records) {
      if (r.entity) continue;
      const p = flat(r.place.lng, r.place.lat, FLAT);
      out.set(r.id, { x: p.x, y: p.y, scale: 0.3, opacity: 0.05, present: false, z: -1 });
    }
    ENTITY_ORDER.forEach((kind, idx) => {
      const colX = 92 + idx * 136;
      const col = records
        .filter((r) => r.entity?.kind === kind)
        .sort((a, b) => a.entity!.earliestYear - b.entity!.earliestYear);
      const lane = [-Infinity, -Infinity, -Infinity];
      col.forEach((r, i) => {
        const s = i % 3;
        const y = Math.max(guideY(r.entity!.earliestYear), lane[s] + 30);
        lane[s] = y;
        out.set(r.id, {
          x: colX + (s - 1) * 31,
          y,
          scale: 1.25,
          opacity: 1,
          present: true,
          z: 1,
        });
      });
    });
    return out;
  }

  // threads — the globe unrolled flat
  for (const r of records) {
    const p = flat(r.place.lng, r.place.lat, FLAT);
    const [ox, oy] = SPREAD[r.id] ?? [0, 0];
    const member = activeThread ? r.threads.includes(activeThread) : r.threads.length > 0;
    out.set(r.id, {
      x: p.x + ox,
      y: p.y + oy,
      scale: member ? (activeThread ? 1.2 : 0.85) : 0.5,
      opacity: member ? 1 : activeThread ? 0.09 : 0.4,
      present: member,
      z: member ? 1 : -1,
    });
  }
  return out;
}
