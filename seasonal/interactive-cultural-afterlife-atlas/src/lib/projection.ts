import {
  GRATICULE_LATS,
  GRATICULE_LNGS,
  LAND_COARSE,
  LAND_FINE,
  type Ring,
} from "../data/world";

const D2R = Math.PI / 180;
const TAU = Math.PI * 2;

export interface Rot {
  lng: number;
  lat: number;
}

export interface Projected {
  x: number;
  y: number;
  visible: boolean;
  /** cosine of angular distance from the centre of the disc */
  cosc: number;
}

export function project(
  lng: number,
  lat: number,
  rot: Rot,
  R: number,
  cx: number,
  cy: number,
): Projected {
  const p = lat * D2R;
  const l = (lng - rot.lng) * D2R;
  const p0 = rot.lat * D2R;
  const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
  const x = Math.cos(p) * Math.sin(l);
  const y = -(Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l));
  return { x: cx + x * R, y: cy + y * R, visible: cosc >= 0, cosc };
}

/** cosine of angular distance without paying for the full projection */
function cosc(lng: number, lat: number, rot: Rot) {
  const p = lat * D2R;
  const l = (lng - rot.lng) * D2R;
  const p0 = rot.lat * D2R;
  return Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
}

/**
 * Where the segment a→b crosses the horizon, found by bisection on the
 * straight lng/lat interpolation.  Coastline vertices sit ≤ a few degrees
 * apart, so the difference from a true great-circle crossing is sub-pixel.
 */
function limbCrossing(
  a: [number, number],
  b: [number, number],
  rot: Rot,
  R: number,
  cx: number,
  cy: number,
): Projected {
  let lo = 0;
  let hi = 1;
  const inA = cosc(a[0], a[1], rot) >= 0;
  for (let i = 0; i < 14; i++) {
    const m = (lo + hi) / 2;
    const c = cosc(a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m, rot);
    if (c >= 0 === inA) lo = m;
    else hi = m;
  }
  const t = (lo + hi) / 2;
  const p = project(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, rot, R, cx, cy);
  // land it exactly on the limb so the closing arc meets it cleanly
  const dx = p.x - cx;
  const dy = p.y - cy;
  const m = Math.hypot(dx, dy) || 1;
  return { x: cx + (dx / m) * R, y: cy + (dy / m) * R, visible: true, cosc: 0 };
}

/** angle from a to b travelling in the direction of increasing angle, in [0, 2π) */
const ahead = (a: number, b: number) => ((b - a) % TAU + TAU) % TAU;

/**
 * Clip a coastline ring to the visible hemisphere.
 *
 * Runs of near-side coastline are cut exactly at the horizon, then stitched
 * back together along the limb: leaving the disc at one crossing, you rejoin
 * at the next crossing found travelling round the limb in a fixed direction.
 * Because crossings alternate exit/entry around a closed ring, that pairing is
 * always the right one — and it is what keeps a continent that is half out of
 * view from getting a chord slashed across the globe.
 *
 * The fixed direction is what encodes "which side is land", so it relies on
 * every ring being wound the same way.  Natural Earth already is; anything
 * spliced in later has to match, or that ring will come out inside-out.
 *
 * Returns one path per closed piece — separate elements, so that pieces which
 * overlap can't cancel each other out through the fill rule.
 */
export function ringToGlobePaths(
  ring: Ring,
  rot: Rot,
  R: number,
  cx: number,
  cy: number,
): string[] {
  const n = ring.length;
  if (n < 3) return [];

  const pts = ring.map(([lng, lat]) => project(lng, lat, rot, R, cx, cy));
  let visCount = 0;
  for (const p of pts) if (p.visible) visCount++;
  if (visCount === 0) return [];

  const pt = (p: Projected) => p.x.toFixed(1) + " " + p.y.toFixed(1);

  if (visCount === n) {
    return ["M" + pts.map(pt).join("L") + "Z"];
  }

  // start walking from a point that follows a hidden one, so every run is
  // discovered whole rather than split across the array boundary
  let start = 0;
  while (start < n && !(pts[start].visible && !pts[(start - 1 + n) % n].visible)) start++;
  if (start === n) return [];

  // 1. every run of near-side coastline, capped at both ends by its exact
  //    horizon crossing
  interface Run {
    enter: Projected;
    exit: Projected;
    body: Projected[];
    aEnter: number;
    aExit: number;
  }
  const runs: Run[] = [];
  let i = 0;
  while (i < n) {
    if (!pts[(start + i) % n].visible) {
      i++;
      continue;
    }
    const body: Projected[] = [];
    let k = i;
    while (k < n && pts[(start + k) % n].visible) {
      body.push(pts[(start + k) % n]);
      k++;
    }
    const firstIdx = (start + i) % n;
    const lastIdx = (start + k - 1) % n;
    const enter = limbCrossing(ring[(firstIdx - 1 + n) % n], ring[firstIdx], rot, R, cx, cy);
    const exit = limbCrossing(ring[lastIdx], ring[(lastIdx + 1) % n], rot, R, cx, cy);
    runs.push({
      enter,
      exit,
      body,
      aEnter: Math.atan2(enter.y - cy, enter.x - cx),
      aExit: Math.atan2(exit.y - cy, exit.x - cx),
    });
    i = k;
  }
  if (!runs.length) return [];

  // 2. from each exit, the run we rejoin is whichever entry comes first
  //    travelling round the limb in the direction of increasing angle
  const next = runs.map((r) => {
    let best = 0;
    let bestGap = Infinity;
    runs.forEach((c, j) => {
      const gap = ahead(r.aExit, c.aEnter);
      if (gap < bestGap) {
        bestGap = gap;
        best = j;
      }
    });
    return best;
  });

  // 3. walk those links into closed pieces
  const out: string[] = [];
  const seen = new Array<boolean>(runs.length).fill(false);
  for (let s0 = 0; s0 < runs.length; s0++) {
    if (seen[s0]) continue;
    let d = "";
    let j = s0;
    do {
      seen[j] = true;
      const r = runs[j];
      const nj = next[j];
      const large = ahead(r.aExit, runs[nj].aEnter) > Math.PI ? 1 : 0;
      d +=
        (d ? "L" : "M" + pt(r.enter) + "L") +
        r.body.map(pt).join("L") +
        "L" +
        pt(r.exit) +
        `A${R} ${R} 0 ${large} 1 ${pt(runs[nj].enter)}`;
      j = nj;
    } while (!seen[j]);
    out.push(d + "Z");
  }
  return out;
}

export function landGlobePaths(
  rot: Rot,
  R: number,
  cx: number,
  cy: number,
  coarse = false,
): string[] {
  const src = coarse ? LAND_COARSE : LAND_FINE;
  const out: string[] = [];
  for (const ring of src) out.push(...ringToGlobePaths(ring, rot, R, cx, cy));
  return out;
}

export function graticulePaths(rot: Rot, R: number, cx: number, cy: number): string[] {
  const out: string[] = [];
  const line = (coords: Ring) => {
    let d = "";
    let pen = false;
    let prev: [number, number] | null = null;
    for (const c of coords) {
      const p = project(c[0], c[1], rot, R, cx, cy);
      if (p.visible) {
        if (!pen && prev) {
          const e = limbCrossing(prev, c, rot, R, cx, cy);
          d += "M" + e.x.toFixed(1) + " " + e.y.toFixed(1);
          pen = true;
        }
        d += (pen ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1);
        pen = true;
      } else {
        if (pen && prev) {
          const e = limbCrossing(prev, c, rot, R, cx, cy);
          d += "L" + e.x.toFixed(1) + " " + e.y.toFixed(1);
        }
        pen = false;
      }
      prev = c;
    }
    if (d) out.push(d);
  };

  for (const lat of GRATICULE_LATS) {
    const ring: Ring = [];
    for (let lng = -180; lng <= 180; lng += 4) ring.push([lng, lat]);
    line(ring);
  }
  for (const lng of GRATICULE_LNGS) {
    const ring: Ring = [];
    for (let lat = -85; lat <= 85; lat += 4) ring.push([lng, lat]);
    line(ring);
  }
  return out;
}

/** Equirectangular — used whenever the globe "unrolls". */
export interface Flat {
  cx: number;
  cy: number;
  sx: number;
  sy: number;
}

export function flat(lng: number, lat: number, f: Flat) {
  return { x: f.cx + (lng / 180) * f.sx, y: f.cy - (lat / 90) * f.sy };
}

export function landFlatPaths(f: Flat): string[] {
  return LAND_FINE.map((ring) => {
    let d = "";
    ring.forEach(([lng, lat], i) => {
      const p = flat(lng, lat, f);
      d += (i === 0 ? "M" : "L") + p.x.toFixed(1) + " " + p.y.toFixed(1);
    });
    return d + "Z";
  });
}
