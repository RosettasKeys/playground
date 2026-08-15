import { useMemo, useState } from "react";
import type { Record as Rec, ThreadId } from "../data/types";
import {
  CONTINENT_COLOR,
  CONTINENT_ORDER,
  COUNTRIES,
  ENTITY_META,
  ENTITY_ORDER,
  MONTHS,
  MONTH_STARTS,
  REMEMBRANCE_META,
  REMEMBRANCE_ORDER,
  THREAD_META,
  VEIL_META,
  VEIL_ORDER,
  dayLabel,
} from "../data";
import { VANTAGES } from "../data/world";
import type { Mode } from "../lib/layouts";
import { SourceChip } from "./Panel";
import { Emblem, Sil } from "./Glyph";

interface Props {
  mode: Mode;
  records: Rec[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  setHovered: (id: string | null) => void;
  focus: string | null;
  setFocus: (c: string | null) => void;
  activeThread: ThreadId | null;
  setActiveThread: (t: ThreadId | null) => void;
  onVantage: (lng: number, lat: number) => void;
}

function Group({
  title,
  sub,
  icon,
  children,
}: {
  title: string;
  sub?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5">
      <div className="mb-1.5 flex items-baseline gap-2 px-1">
        {icon && <span className="self-center text-[#e8b57a]">{icon}</span>}
        <h3 className="smallcaps text-[11px] text-[#cbb27f]">{title}</h3>
        {sub && <span className="text-[10px] text-slate-600">{sub}</span>}
      </div>
      <div className="space-y-px">{children}</div>
    </section>
  );
}

function RecordRow({
  r,
  active,
  onSelect,
  setHovered,
  meta,
  dim,
}: {
  r: Rec;
  active: boolean;
  onSelect: (id: string) => void;
  setHovered: (id: string | null) => void;
  meta?: string;
  dim?: boolean;
}) {
  return (
    <button
      onClick={() => onSelect(r.id)}
      onPointerEnter={() => setHovered(r.id)}
      onPointerLeave={() => setHovered(null)}
      className={
        "mode-btn group flex w-full items-start gap-2.5 rounded-sm px-2 py-1.5 text-left " +
        (active ? "bg-white/[0.07]" : "hover:bg-white/[0.04]") +
        (dim ? " opacity-45" : "")
      }
    >
      <span className="mt-[3px]" style={{ color: CONTINENT_COLOR[r.continent] }}>
        <SourceChip source={r.source} size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] leading-snug text-slate-200 group-hover:text-white">
          {r.title}
        </span>
        <span className="block truncate text-[10.5px] leading-snug text-slate-500">
          {meta ?? `${r.place.country} · ${r.culture}`}
        </span>
      </span>
    </button>
  );
}

export default function Sidebar(p: Props) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const pool = useMemo(() => {
    let rs = p.records;
    if (query)
      rs = rs.filter((r) =>
        (r.title + r.subtitle + r.culture + r.place.country + r.place.name + r.tags.join(" ") + r.summary)
          .toLowerCase()
          .includes(query),
      );
    return rs;
  }, [p.records, query]);

  const focusFiltered = p.focus ? pool.filter((r) => r.place.country === p.focus) : pool;

  const common = (
    <>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search the collection…"
        className="mb-3 w-full rounded-sm border border-white/10 bg-black/30 px-2.5 py-1.5 text-[12px] text-slate-200 outline-none placeholder:text-slate-600 focus:border-[#d8b46a]/40"
      />
      {p.focus && (
        <div className="mb-3 flex items-center gap-2 rounded-sm border border-[#d8b46a]/25 bg-[#d8b46a]/[0.06] px-2.5 py-1.5">
          <span className="smallcaps text-[10px] text-[#d8b46a]">focus</span>
          <span className="flex-1 truncate text-[12px] text-slate-200">{p.focus}</span>
          <button onClick={() => p.setFocus(null)} className="text-[10px] tracking-widest text-slate-400 hover:text-white">
            CLEAR
          </button>
        </div>
      )}
    </>
  );

  let body: React.ReactNode = null;

  if (p.mode === "atlas") {
    body = (
      <>
        <Group title="Vantage" sub="turn the globe">
          <div className="flex flex-wrap gap-1 px-1">
            {VANTAGES.map((v) => (
              <button
                key={v.id}
                onClick={() => p.onVantage(v.lng, v.lat)}
                className="mode-btn rounded-sm border border-white/10 px-2 py-1 text-[10.5px] text-slate-400 hover:border-[#d8b46a]/40 hover:text-slate-100"
              >
                {v.label}
              </button>
            ))}
          </div>
        </Group>
        {CONTINENT_ORDER.map((c) => {
          const groups = COUNTRIES.filter((g) => g.continent === c).filter((g) =>
            g.ids.some((id) => pool.some((r) => r.id === id)),
          );
          if (!groups.length) return null;
          return (
            <Group key={c} title={c}>
              {groups.map((g) => {
                const rs = g.ids.map((id) => p.records.find((r) => r.id === id)!).filter((r) => pool.includes(r));
                const open = p.focus === g.country;
                return (
                  <div key={g.country}>
                    <button
                      onClick={() => {
                        p.setFocus(open ? null : g.country);
                        if (!open) p.onVantage(g.lng, g.lat);
                      }}
                      className={
                        "mode-btn flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left " +
                        (open ? "bg-white/[0.07]" : "hover:bg-white/[0.04]")
                      }
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: CONTINENT_COLOR[g.continent] }}
                      />
                      <span className="flex-1 truncate text-[13px] text-slate-200">{g.country}</span>
                      <span className="font-mono2 text-[10px] text-slate-600">{rs.length}</span>
                    </button>
                    {open && (
                      <div className="mb-1 ml-3 border-l border-white/8 pl-1.5">
                        {rs.map((r) => (
                          <RecordRow
                            key={r.id}
                            r={r}
                            active={p.selectedId === r.id}
                            onSelect={p.onSelect}
                            setHovered={p.setHovered}
                            meta={`${r.place.name} · ${r.culture}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </Group>
          );
        })}
      </>
    );
  }

  if (p.mode === "calendar") {
    const dated = focusFiltered.filter((r) => r.calendar).sort((a, b) => a.calendar!.start - b.calendar!.start);
    const undated = focusFiltered.filter((r) => !r.calendar);
    body = (
      <>
        <p className="mb-4 px-1 text-[11.5px] leading-relaxed text-slate-500">
          The same records, arranged by when they happen. Dates cluster — but a cluster is a coincidence of season and
          agriculture as often as anything else.
        </p>
        {MONTHS.map((m, i) => {
          const from = MONTH_STARTS[i];
          const to = i === 11 ? 366 : MONTH_STARTS[i + 1];
          const rs = dated.filter((r) => r.calendar!.start >= from && r.calendar!.start < to);
          if (!rs.length) return null;
          return (
            <Group key={m} title={m}>
              {rs.map((r) => (
                <RecordRow
                  key={r.id}
                  r={r}
                  active={p.selectedId === r.id}
                  onSelect={p.onSelect}
                  setHovered={p.setHovered}
                  meta={`${dayLabel(r.calendar!.start)} · ${r.place.country}`}
                />
              ))}
            </Group>
          );
        })}
        {undated.length > 0 && (
          <Group title="No fixed date" sub={`${undated.length}`}>
            {undated.slice(0, 40).map((r) => (
              <RecordRow key={r.id} r={r} active={p.selectedId === r.id} onSelect={p.onSelect} setHovered={p.setHovered} dim />
            ))}
          </Group>
        )}
      </>
    );
  }

  if (p.mode === "veil") {
    body = (
      <>
        <p className="mb-4 px-1 text-[11.5px] leading-relaxed text-slate-500">
          Arranged by distance from the ordinary world — from the doorway, to what is said to lie past it. Horizontal
          position still holds longitude.
        </p>
        {VEIL_ORDER.map((d) => {
          const rs = focusFiltered.filter((r) => r.veil?.depth === d);
          if (!rs.length) return null;
          return (
            <Group key={d} title={VEIL_META[d].label} sub={`${rs.length}`}>
              {rs.map((r) => (
                <RecordRow
                  key={r.id}
                  r={r}
                  active={p.selectedId === r.id}
                  onSelect={p.onSelect}
                  setHovered={p.setHovered}
                  meta={r.veil!.role}
                />
              ))}
            </Group>
          );
        })}
      </>
    );
  }

  if (p.mode === "remembrance") {
    body = (
      <>
        <p className="mb-4 px-1 text-[11.5px] leading-relaxed text-slate-500">
          What the living actually do: cook, sweep, carry, wash, sing, build. Grouped by the shape of the practice
          rather than by belief.
        </p>
        {REMEMBRANCE_ORDER.map((c) => {
          const rs = focusFiltered.filter((r) => r.remembrance?.cluster === c);
          if (!rs.length) return null;
          return (
            <Group
              key={c}
              title={REMEMBRANCE_META[c].label}
              sub={`${rs.length}`}
              icon={
                <svg width={18} height={18} viewBox="-10 -10 20 20">
                  <Emblem cluster={c} size={19} />
                </svg>
              }
            >
              {rs.map((r) => (
                <RecordRow
                  key={r.id}
                  r={r}
                  active={p.selectedId === r.id}
                  onSelect={p.onSelect}
                  setHovered={p.setHovered}
                  meta={r.remembrance!.role}
                />
              ))}
            </Group>
          );
        })}
      </>
    );
  }

  if (p.mode === "guide") {
    body = (
      <>
        <p className="mb-4 px-1 text-[11.5px] leading-relaxed text-slate-500">
          Beings are separated by what kind of thing they are — a deity in a living religion is not the same category
          of claim as a 1966 sighting. Height on the stage is the earliest known account.
        </p>
        {ENTITY_ORDER.map((k) => {
          const rs = focusFiltered
            .filter((r) => r.entity?.kind === k)
            .sort((a, b) => a.entity!.earliestYear - b.entity!.earliestYear);
          if (!rs.length) return null;
          return (
            <Group key={k} title={ENTITY_META[k].label} sub={`${rs.length}`}>
              <p className="mb-1 px-2 text-[10.5px] leading-snug text-slate-600">{ENTITY_META[k].blurb}</p>
              {rs.map((r) => (
                <button
                  key={r.id}
                  onClick={() => p.onSelect(r.id)}
                  onPointerEnter={() => p.setHovered(r.id)}
                  onPointerLeave={() => p.setHovered(null)}
                  className={
                    "mode-btn group flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left " +
                    (p.selectedId === r.id ? "bg-white/[0.07]" : "hover:bg-white/[0.04]")
                  }
                >
                  <span style={{ color: CONTINENT_COLOR[r.continent] }}>
                    <svg width={22} height={22} viewBox="-13 -13 26 26">
                      <Sil shape={r.entity!.shape} size={22} opacity={0.85} />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-slate-200 group-hover:text-white">{r.title}</span>
                    <span className="block truncate text-[10.5px] text-slate-500">
                      {r.entity!.earliestYear < 0
                        ? `c. ${-r.entity!.earliestYear} BCE`
                        : `c. ${r.entity!.earliestYear} CE`}{" "}
                      · {r.place.country}
                    </span>
                  </span>
                </button>
              ))}
            </Group>
          );
        })}
      </>
    );
  }

  if (p.mode === "threads") {
    const members = p.activeThread ? focusFiltered.filter((r) => r.threads.includes(p.activeThread!)) : [];
    body = (
      <>
        <p className="mb-3 px-1 text-[11.5px] leading-relaxed text-slate-500">
          Ideas that surface in many places. Lines drawn between them mark{" "}
          <em className="not-italic text-slate-300">resemblance, not descent</em> — parallel traditions are allowed to
          be parallel.
        </p>
        <div className="mb-4 space-y-px">
          {THREAD_META.map((t) => {
            const n = p.records.filter((r) => r.threads.includes(t.id)).length;
            const on = p.activeThread === t.id;
            return (
              <button
                key={t.id}
                onClick={() => p.setActiveThread(on ? null : t.id)}
                className={
                  "mode-btn w-full rounded-sm px-2 py-2 text-left " +
                  (on ? "bg-[#d8b46a]/10 ring-1 ring-[#d8b46a]/30" : "hover:bg-white/[0.04]")
                }
              >
                <div className="flex items-baseline gap-2">
                  <span className={"font-display text-[14px] " + (on ? "text-[#e8d3a4]" : "text-slate-200")}>
                    {t.label}
                  </span>
                  <span className="font-mono2 ml-auto text-[10px] text-slate-600">{n}</span>
                </div>
                {on && <p className="mt-1 text-[11.5px] leading-relaxed text-slate-400">{t.blurb}</p>}
              </button>
            );
          })}
        </div>
        {p.activeThread && (
          <Group title="Examples" sub={`${members.length} across ${new Set(members.map((m) => m.continent)).size} regions`}>
            {CONTINENT_ORDER.map((c) => {
              const rs = members.filter((r) => r.continent === c);
              if (!rs.length) return null;
              return (
                <div key={c} className="mb-1">
                  <div className="px-2 py-1 text-[10px] tracking-widest text-slate-600">{c.toUpperCase()}</div>
                  {rs.map((r) => (
                    <RecordRow key={r.id} r={r} active={p.selectedId === r.id} onSelect={p.onSelect} setHovered={p.setHovered} />
                  ))}
                </div>
              );
            })}
          </Group>
        )}
      </>
    );
  }

  return (
    <div className="scroll-thin h-full overflow-y-auto px-3 py-4">
      {common}
      {query && (
        <div className="mb-3 px-1 text-[10.5px] text-slate-500">
          {pool.length} record{pool.length === 1 ? "" : "s"} match “{q}”
        </div>
      )}
      {body}
      <div className="h-10" />
    </div>
  );
}
