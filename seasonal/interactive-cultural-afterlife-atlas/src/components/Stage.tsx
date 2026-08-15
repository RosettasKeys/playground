import { useMemo, useRef } from "react";
import type { Record as Rec, ThreadId } from "../data/types";
import {
  CONTINENT_COLOR,
  ENTITY_META,
  ENTITY_ORDER,
  MONTHS,
  MONTH_STARTS,
  REMEMBRANCE_META,
  VEIL_META,
  VEIL_ORDER,
} from "../data";
import {
  calendarAngle,
  computeLayout,
  FLAT,
  guideY,
  NICHES,
  nichePath,
  nicheSteps,
  STAGE,
  type Mode,
} from "../lib/layouts";
import {
  graticulePaths,
  landFlatPaths,
  landGlobePaths,
  project,
  type Rot,
} from "../lib/projection";
import type { Haunt } from "../lib/haunt";
import { EMBER, MOON, mix } from "../lib/color";
import { Emblem, Marker, Sil } from "./Glyph";

const FLAT_PATHS = landFlatPaths(FLAT);

/** deterministic faint starfield — astronomy, not sparkle */
const STARS = (() => {
  let s = 20240611;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  return Array.from({ length: 130 }, () => ({
    x: rnd() * STAGE.w,
    y: rnd() * STAGE.h,
    r: 0.35 + rnd() * 1.05,
    o: 0.12 + rnd() * 0.5,
    d: rnd() * 6,
  }));
})();

interface Props {
  mode: Mode;
  records: Rec[];
  rot: Rot;
  onRotate: (dx: number, dy: number) => void;
  onDragState: (v: boolean) => void;
  dragging: boolean;
  selectedId: string | null;
  hoveredId: string | null;
  setHovered: (id: string | null) => void;
  onSelect: (id: string) => void;
  focusIds: Set<string> | null;
  focusCountry: string | null;
  activeThread: ThreadId | null;
  onBackground: () => void;
  haunt: Haunt | null;
}

/** the thing on the far side, foreshortened by how far round the back it is */
function Prowler({ haunt, rot }: { haunt: Haunt; rot: Rot }) {
  const p = project(haunt.lng, haunt.lat, rot, STAGE.R, STAGE.cx, STAGE.cy);
  const depth = Math.max(0, -p.cosc);
  const size = 44 + depth * 68;
  return (
    <g transform={`translate(${p.x} ${p.y})`} opacity={0.3 + depth * 0.52} style={{ color: "#04060a" }}>
      <Sil shape={haunt.shape} size={size} />
      {haunt.phase === "eyes" && (
        <g className="haunt-eyes">
          <circle cx={-size * 0.1} cy={-size * 0.13} r={size * 0.033} fill="#e8d3a4" />
          <circle cx={size * 0.1} cy={-size * 0.13} r={size * 0.033} fill="#e8d3a4" />
        </g>
      )}
    </g>
  );
}

function nodeColor(r: Rec, mode: Mode) {
  const base = CONTINENT_COLOR[r.continent];
  if (mode === "veil") return mix(base, MOON, 0.62);
  if (mode === "remembrance") return mix(base, EMBER, 0.5);
  return base;
}

export default function Stage(p: Props) {
  const { mode, records, rot } = p;
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; moved: number } | null>(null);

  const layout = useMemo(
    () => computeLayout(mode, records, rot, p.activeThread),
    [mode, records, rot, p.activeThread],
  );

  // Both are re-projected on every frame the globe moves, so the coastline
  // drops to its coarse level of detail while a drag is in flight.
  const globe = useMemo(
    () => ({
      land: landGlobePaths(rot, STAGE.R, STAGE.cx, STAGE.cy, p.dragging),
      grat: graticulePaths(rot, STAGE.R, STAGE.cx, STAGE.cy),
    }),
    [rot, p.dragging],
  );

  const remCounts = useMemo(() => {
    const m: { [k: string]: number } = {};
    for (const r of records) if (r.remembrance) m[r.remembrance.cluster] = (m[r.remembrance.cluster] ?? 0) + 1;
    return m;
  }, [records]);

  const threadArcs = useMemo(() => {
    if (mode !== "threads" || !p.activeThread) return [];
    const members = records
      .filter((r) => r.threads.includes(p.activeThread!))
      .sort((a, b) => a.place.lng - b.place.lng);
    const out: string[] = [];
    for (let i = 0; i < members.length - 1; i++) {
      const a = layout.get(members[i].id)!;
      const b = layout.get(members[i + 1].id)!;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2 - Math.min(150, Math.hypot(b.x - a.x, b.y - a.y) * 0.45);
      out.push(`M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`);
    }
    return out;
  }, [mode, p.activeThread, records, layout]);

  const globeOpacity = mode === "atlas" ? 1 : mode === "calendar" ? 0.3 : 0;
  const globeScale = mode === "atlas" ? 1 : 0.29;
  const flatOpacity =
    mode === "threads" ? 0.5 : mode === "veil" ? 0.16 : mode === "remembrance" ? 0.1 : mode === "guide" ? 0.07 : 0;

  function down(e: React.PointerEvent) {
    if (mode !== "atlas") return;
    drag.current = { x: e.clientX, y: e.clientY, moved: 0 };
    (e.target as Element).setPointerCapture?.(e.pointerId);
    p.onDragState(true);
  }
  function move(e: React.PointerEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current.x = e.clientX;
    drag.current.y = e.clientY;
    drag.current.moved += Math.abs(dx) + Math.abs(dy);
    const k = (svgRef.current?.clientWidth ?? 900) / STAGE.w;
    p.onRotate(-dx / (k * 3.2), dy / (k * 3.2));
  }
  const lastMoved = useRef(0);
  function up() {
    lastMoved.current = drag.current?.moved ?? 0;
    drag.current = null;
    p.onDragState(false);
  }

  const focusMark = useMemo(() => {
    if (mode !== "atlas" || !p.focusCountry) return null;
    const rs = records.filter((r) => r.place.country === p.focusCountry);
    if (!rs.length) return null;
    const pts = rs.map((r) => layout.get(r.id)).filter((v) => v && v.opacity > 0.2);
    if (!pts.length) return null;
    const x = pts.reduce((a, v) => a + v!.x, 0) / pts.length;
    const y = pts.reduce((a, v) => a + v!.y, 0) / pts.length;
    return { x, y, n: rs.length, label: p.focusCountry };
  }, [mode, p.focusCountry, records, layout]);

  const labelFor = p.hoveredId ?? p.selectedId;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${STAGE.w} ${STAGE.h}`}
      className={
        "h-full w-full touch-none select-none " +
        (mode === "atlas" ? (p.dragging ? "cursor-grabbing" : "cursor-grab") : "")
      }
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerLeave={up}
      onClick={() => {
        if (lastMoved.current < 7) p.onBackground();
        lastMoved.current = 0;
      }}
    >
      <defs>
        <radialGradient id="ocean" cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#141c26" />
          <stop offset="62%" stopColor="#0b1017" />
          <stop offset="100%" stopColor="#05070a" />
        </radialGradient>
        <radialGradient id="warmglow">
          <stop offset="0%" stopColor="#f0a35c" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#f0a35c" stopOpacity="0" />
        </radialGradient>
        {/* a niche is lit from the step up, not from overhead */}
        <linearGradient id="nichelight" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#f0a35c" stopOpacity="0.10" />
          <stop offset="26%" stopColor="#f0a35c" stopOpacity="0.13" />
          <stop offset="100%" stopColor="#f0a35c" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="veilfade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e141c" stopOpacity="0.0" />
          <stop offset="100%" stopColor="#04060a" stopOpacity="0.9" />
        </linearGradient>
        <filter id="soften" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
        <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <clipPath id="disc">
          <circle cx={STAGE.cx} cy={STAGE.cy} r={STAGE.R} />
        </clipPath>
      </defs>

      {/* ── starfield ─────────────────────────────────────────────── */}
      <g
        className="field-layer"
        style={{ opacity: mode === "atlas" ? 1 : mode === "veil" ? 0.55 : 0.3 }}
        pointerEvents="none"
      >
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#cdd8e6"
            opacity={s.o}
            className="breathe"
            style={{ animationDelay: `${s.d}s`, animationDuration: `${5 + s.d}s` }}
          />
        ))}
      </g>

      {/* ── flat world (the globe unrolled) ───────────────────────── */}
      <g className="field-layer" style={{ opacity: flatOpacity }}>
        {FLAT_PATHS.map((d, i) => (
          <path key={i} d={d} fill="#243040" stroke="#3d5064" strokeWidth={0.6} />
        ))}
        {mode === "threads" && (
          <g stroke="#2b3a4a" strokeWidth={0.4} opacity={0.7}>
            <line x1={STAGE.cx - FLAT.sx} y1={FLAT.cy} x2={STAGE.cx + FLAT.sx} y2={FLAT.cy} />
            <line x1={STAGE.cx} y1={FLAT.cy - FLAT.sy} x2={STAGE.cx} y2={FLAT.cy + FLAT.sy} />
          </g>
        )}
      </g>

      {/* ── globe ─────────────────────────────────────────────────── */}
      <g
        className="field-layer"
        style={{
          opacity: globeOpacity,
          transform: `translate(${STAGE.cx}px, ${STAGE.cy}px) scale(${globeScale}) translate(${-STAGE.cx}px, ${-STAGE.cy}px)`,
        }}
      >
        <circle cx={STAGE.cx} cy={STAGE.cy} r={STAGE.R + 26} fill="#e8b57a" opacity={0.05} filter="url(#glow)" />
        <circle cx={STAGE.cx} cy={STAGE.cy} r={STAGE.R} fill="url(#ocean)" />
        <g clipPath="url(#disc)">
          <g stroke="#25313f" strokeWidth={0.5} fill="none" opacity={0.55}>
            {globe.grat.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          {/* between the graticule and the coastline: whatever is on the far
              side shows as a mass under the map, and the land covers it */}
          {p.haunt && (p.haunt.phase === "prowl" || p.haunt.phase === "eyes") && (
            <Prowler haunt={p.haunt} rot={rot} />
          )}
          {globe.land.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="#18222c"
              stroke="#3b4c5e"
              strokeWidth={0.7}
              strokeLinejoin="round"
            />
          ))}
        </g>
        <circle
          cx={STAGE.cx}
          cy={STAGE.cy}
          r={STAGE.R}
          fill="none"
          stroke="#7d93aa"
          strokeWidth={0.8}
          opacity={0.32}
        />
      </g>

      {/* ── calendar chrome ───────────────────────────────────────── */}
      <g className="field-layer" style={{ opacity: mode === "calendar" ? 1 : 0 }} pointerEvents="none">
        <circle cx={STAGE.cx} cy={STAGE.cy} r={306} fill="none" stroke="#2b3644" strokeWidth={0.8} />
        <circle cx={STAGE.cx} cy={STAGE.cy} r={162} fill="none" stroke="#222c38" strokeWidth={0.6} strokeDasharray="2 6" />
        {MONTH_STARTS.map((d, i) => {
          const a = calendarAngle(d);
          const x1 = STAGE.cx + Math.cos(a) * 306;
          const y1 = STAGE.cy + Math.sin(a) * 306;
          const x2 = STAGE.cx + Math.cos(a) * 322;
          const y2 = STAGE.cy + Math.sin(a) * 322;
          const lx = STAGE.cx + Math.cos(a + 0.26) * 338;
          const ly = STAGE.cy + Math.sin(a + 0.26) * 338;
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3d4a5a" strokeWidth={0.8} />
              <text
                x={lx}
                y={ly}
                fill="#7f8fa3"
                fontSize={11}
                textAnchor="middle"
                dominantBaseline="middle"
                letterSpacing="0.16em"
                style={{ fontFamily: "IBM Plex Mono, monospace" }}
              >
                {MONTHS[i].toUpperCase()}
              </text>
            </g>
          );
        })}
        <text x={STAGE.cx} y={STAGE.cy - 200} fill="#5d6b7d" fontSize={9.5} textAnchor="middle" letterSpacing="0.2em">
          NORTHERN LATITUDES OUTWARD
        </text>
        <text x={STAGE.cx} y={STAGE.cy + 143} fill="#4d5866" fontSize={9} textAnchor="middle" letterSpacing="0.18em">
          NO FIXED DATE
        </text>
      </g>

      {/* ── veil chrome ───────────────────────────────────────────── */}
      <g className="field-layer" style={{ opacity: mode === "veil" ? 1 : 0 }} pointerEvents="none">
        <rect x={0} y={0} width={STAGE.w} height={STAGE.h} fill="url(#veilfade)" />
        {VEIL_ORDER.map((k, i) => {
          const y = [176, 316, 452, 586][i];
          return (
            <g key={k}>
              <line x1={40} y1={y + 46} x2={STAGE.w - 40} y2={y + 46} stroke="#26313f" strokeWidth={0.6} strokeDasharray="1 7" />
              <text
                x={44}
                y={y - 44}
                fill="#9db2c8"
                fontSize={12.5}
                letterSpacing="0.22em"
                style={{ fontVariant: "small-caps", paintOrder: "stroke", stroke: "#05070a", strokeWidth: 4 }}
              >
                {VEIL_META[k].label}
              </text>
              <text
                x={44}
                y={y - 29}
                fill="#5d6b7d"
                fontSize={10}
                style={{ paintOrder: "stroke", stroke: "#05070a", strokeWidth: 3.5 }}
              >
                {VEIL_META[k].blurb}
              </text>
            </g>
          );
        })}
        {[-120, -60, 0, 60, 120].map((lng) => (
          <text
            key={lng}
            x={STAGE.cx + (lng / 180) * 418}
            y={704}
            fill="#3f4b5a"
            fontSize={9}
            textAnchor="middle"
            style={{ fontFamily: "IBM Plex Mono, monospace" }}
          >
            {lng === 0 ? "0°" : `${Math.abs(lng)}°${lng < 0 ? "W" : "E"}`}
          </text>
        ))}
      </g>

      {/* ── remembrance chrome — the ofrenda wall ─────────────────── */}
      <g className="field-layer" style={{ opacity: mode === "remembrance" ? 1 : 0 }} pointerEvents="none">
        {NICHES.map(({ cluster, x, top }) => {
          const step = nicheSteps(top);
          const d = nichePath(x, top);
          return (
            <g key={cluster}>
              <path d={d} fill="url(#nichelight)" />
              <path d={d} fill="none" stroke="#4a3826" strokeWidth={0.8} />

              {/* the emblem, lit, at the head of the niche */}
              <circle cx={x} cy={top + 52} r={44} fill="url(#warmglow)" />
              <g transform={`translate(${x} ${top + 52})`} style={{ color: "#e8b57a" }}>
                <Emblem cluster={cluster} size={46} />
              </g>

              <text
                x={x}
                y={top + 100}
                fill="#e0b380"
                fontSize={12.5}
                textAnchor="middle"
                letterSpacing="0.16em"
                style={{ fontVariant: "small-caps" }}
              >
                {REMEMBRANCE_META[cluster].label}
              </text>
              <text x={x} y={top + 114} fill="#6d5c4a" fontSize={9.5} textAnchor="middle">
                {REMEMBRANCE_META[cluster].blurb}
              </text>

              {/* two steps to set things down on */}
              <line
                x1={x - 84}
                y1={step.back}
                x2={x + 84}
                y2={step.back}
                stroke="#5c452e"
                strokeWidth={0.8}
              />
              <line
                x1={x - 116}
                y1={step.front}
                x2={x + 116}
                y2={step.front}
                stroke="#6b4f33"
                strokeWidth={1.2}
              />
              <text
                x={x + 116}
                y={step.front + 13}
                fill="#6d5c4a"
                fontSize={9}
                textAnchor="end"
                style={{ fontFamily: "IBM Plex Mono, monospace" }}
              >
                {remCounts[cluster] ?? 0}
              </text>
            </g>
          );
        })}
      </g>

      {/* ── field guide chrome ────────────────────────────────────── */}
      <g className="field-layer" style={{ opacity: mode === "guide" ? 1 : 0 }} pointerEvents="none">
        {[-3000, -1000, 1, 1000, 1600, 1850, 1950, 2010].map((y) => {
          const yy = guideY(y);
          return (
            <g key={y}>
              <line x1={30} y1={yy} x2={STAGE.w - 20} y2={yy} stroke="#1e2733" strokeWidth={0.6} />
              <text x={30} y={yy - 5} fill="#43505f" fontSize={9} style={{ fontFamily: "IBM Plex Mono, monospace" }}>
                {y < 0 ? `${-y} BCE` : `${y} CE`}
              </text>
            </g>
          );
        })}
        {ENTITY_ORDER.map((k, i) => (
          <g key={k}>
            <line x1={92 + i * 136 - 62} y1={96} x2={92 + i * 136 - 62} y2={STAGE.h - 40} stroke="#182029" strokeWidth={0.6} />
            <text
              x={92 + i * 136}
              y={70}
              fill="#a9b8c9"
              fontSize={11.5}
              textAnchor="middle"
              letterSpacing="0.08em"
              style={{ fontVariant: "small-caps" }}
            >
              {ENTITY_META[k].col[0]}
            </text>
            <text
              x={92 + i * 136}
              y={84}
              fill="#7c8898"
              fontSize={11.5}
              textAnchor="middle"
              letterSpacing="0.08em"
              style={{ fontVariant: "small-caps" }}
            >
              {ENTITY_META[k].col[1]}
            </text>
          </g>
        ))}
        <text x={STAGE.w - 24} y={STAGE.h - 16} fill="#3f4b5a" fontSize={9} textAnchor="end" letterSpacing="0.14em">
          VERTICAL AXIS — EARLIEST KNOWN ACCOUNT
        </text>
      </g>

      {/* ── thread arcs ───────────────────────────────────────────── */}
      <g className="field-layer" style={{ opacity: mode === "threads" && p.activeThread ? 1 : 0 }} pointerEvents="none">
        {threadArcs.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#d8b46a" strokeWidth={0.9} strokeDasharray="3 5" opacity={0.42} />
        ))}
      </g>

      {/* ── records ───────────────────────────────────────────────── */}
      <g>
        {records.map((r) => {
          const pos = layout.get(r.id);
          if (!pos) return null;
          const focused = !p.focusIds || p.focusIds.has(r.id);
          const isSel = p.selectedId === r.id;
          const isHov = p.hoveredId === r.id;
          const op = pos.opacity * (focused ? 1 : 0.16);
          const col = nodeColor(r, mode);
          const showSil = mode === "guide" && !!r.entity;
          const interactive = op > 0.14;
          return (
            <g
              key={r.id}
              className="node"
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                opacity: op,
                color: col,
                pointerEvents: interactive ? "auto" : "none",
              }}
              onPointerEnter={() => p.setHovered(r.id)}
              onPointerLeave={() => p.setHovered(null)}
              onClick={(e) => {
                e.stopPropagation();
                p.onSelect(r.id);
              }}
            >
              <g
                className="node-inner"
                style={{ transform: `scale(${pos.scale * (isSel || isHov ? 1.28 : 1)})` }}
              >
                <circle r={20} fill="transparent" />
                {(isSel || isHov) && (
                  <circle r={17} fill="currentColor" opacity={0.13} filter="url(#glow)" />
                )}
                <g style={{ opacity: showSil ? 0.25 : 1, transition: "opacity 500ms ease" }}>
                  <Marker source={r.source} strong={focused} />
                </g>
                {r.entity && (
                  <g style={{ opacity: showSil ? 0.95 : 0, transition: "opacity 500ms ease" }}>
                    <Sil shape={r.entity.shape} size={30} />
                  </g>
                )}
                {isSel && (
                  <circle r={22} fill="none" stroke="currentColor" strokeWidth={0.8} opacity={0.75} strokeDasharray="2 4" />
                )}
              </g>
            </g>
          );
        })}
      </g>

      {/* ── focused region on the globe ───────────────────────────── */}
      {focusMark && (
        <g pointerEvents="none" className="label-fade">
          <circle
            cx={focusMark.x}
            cy={focusMark.y}
            r={46}
            fill="none"
            stroke="#d8b46a"
            strokeWidth={0.7}
            strokeDasharray="2 6"
            opacity={0.55}
          />
          <text
            x={focusMark.x}
            y={focusMark.y - 56}
            fill="#e8d3a4"
            fontSize={12}
            textAnchor="middle"
            letterSpacing="0.2em"
            style={{ fontVariant: "small-caps", paintOrder: "stroke", stroke: "#05070a", strokeWidth: 4 }}
          >
            {focusMark.label}
          </text>
          <text
            x={focusMark.x}
            y={focusMark.y - 43}
            fill="#8b7a5c"
            fontSize={9.5}
            textAnchor="middle"
            style={{ fontFamily: "IBM Plex Mono, monospace", paintOrder: "stroke", stroke: "#05070a", strokeWidth: 3.5 }}
          >
            {focusMark.n} records
          </text>
        </g>
      )}

      {/* ── floating label ────────────────────────────────────────── */}
      {labelFor &&
        (() => {
          const r = records.find((x) => x.id === labelFor);
          const pos = r && layout.get(r.id);
          if (!r || !pos || pos.opacity < 0.14) return null;
          const right = pos.x < STAGE.w - 260;
          const tx = pos.x + (right ? 26 : -26);
          return (
            <g pointerEvents="none" className="label-fade">
              <text
                x={tx}
                y={pos.y - 3}
                fill="#e8dcc8"
                fontSize={14}
                textAnchor={right ? "start" : "end"}
                style={{ fontFamily: "Spectral, serif", paintOrder: "stroke", stroke: "#05070a", strokeWidth: 4 }}
              >
                {r.title}
              </text>
              <text
                x={tx}
                y={pos.y + 12}
                fill="#8b98a8"
                fontSize={10}
                textAnchor={right ? "start" : "end"}
                letterSpacing="0.08em"
                style={{ paintOrder: "stroke", stroke: "#05070a", strokeWidth: 3.5 }}
              >
                {r.place.name} · {r.place.country}
              </text>
            </g>
          );
        })()}
    </svg>
  );
}
