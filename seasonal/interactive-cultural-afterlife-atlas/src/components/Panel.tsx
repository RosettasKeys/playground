import type { Citation, Record as Rec, SourceKind, ThreadId, Work } from "../data/types";
import {
  CONTINENT_COLOR,
  ENTITY_META,
  REMEMBRANCE_META,
  SOURCE_META,
  THREAD_META,
  VEIL_META,
  WORKS,
} from "../data";
import type { Mode } from "../lib/layouts";
import { Emblem, Marker, Sil } from "./Glyph";

export function SourceChip({ source, size = 20 }: { source: SourceKind; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-16 -16 32 32" className="shrink-0">
      <g transform="scale(0.9)">
        <Marker source={source} strong />
      </g>
    </svg>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-3 border-b border-white/5 py-2 last:border-0">
      <div className="smallcaps pt-[1px] text-[10px] text-slate-500">{k}</div>
      <div className="text-[13px] leading-relaxed text-slate-300">{v}</div>
    </div>
  );
}

/**
 * A collapsed section, used only in Lantern mode.  Nothing is ever removed
 * from a record — the long version is always one click away.
 */
function Fold({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="fold mt-4 border-t border-white/8 pt-3">
      <summary className="smallcaps cursor-pointer list-none text-[10.5px] text-slate-500 hover:text-slate-300">
        {label}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

const TIER_LABEL: globalThis.Record<Work["tier"], string> = {
  primary: "primary source",
  scholarly: "scholarship",
  institutional: "institutional record",
  press: "contemporary press",
  reference: "overview",
};

/**
 * Where a work can be read, if anywhere.  A DOI outlives a publisher's URL,
 * so it wins when both exist.  A work with neither is still a citation —
 * this atlas will sit unmaintained for years and links rot.
 */
function linkFor(w: Work): string | undefined {
  if (w.doi) return `https://doi.org/${w.doi}`;
  return w.url;
}

function Cite({ c }: { c: Citation }) {
  const w = WORKS[c.work as keyof typeof WORKS] as Work | undefined;
  if (!w) return null;
  const href = linkFor(w);

  const title = (
    <span className="font-display italic text-[#e0d6c2]">{w.title}</span>
  );

  return (
    <li className="border-b border-white/5 py-2.5 last:border-0">
      <div className="smallcaps mb-1 text-[9.5px] text-slate-600">{TIER_LABEL[w.tier]}</div>
      <div className="text-[12.5px] leading-snug text-slate-300">
        {w.author && <span>{w.author}, </span>}
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[#d8b46a]/30 underline-offset-2 transition-colors hover:decoration-[#d8b46a]"
          >
            {title}
          </a>
        ) : (
          title
        )}
        {w.year && <span className="text-slate-500"> ({w.year})</span>}
        {w.publisher && <span className="text-slate-500"> · {w.publisher}</span>}
        {w.isbn && <span className="font-mono2 text-[11px] text-slate-600"> · ISBN {w.isbn}</span>}
      </div>
      <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">{c.supports}</p>
    </li>
  );
}

/**
 * What a record rests on.  Absent entirely when a record has not been sourced
 * yet — no empty state and no "citation needed" scolding.  The sources page
 * carries that honesty in one place instead, for the whole atlas at once.
 */
function Sources({ record: r, bare = false }: { record: Rec; bare?: boolean }) {
  if (!r.sources?.length) return null;
  const list = (
    <ul className="space-y-0">
      {r.sources.map((c) => (
        <Cite key={c.work} c={c} />
      ))}
    </ul>
  );
  if (bare) return list;
  return (
    <section className="mt-7 border-t border-white/8 pt-4">
      <div className="smallcaps mb-1 text-[10px] text-slate-500">Sources</div>
      {list}
    </section>
  );
}

interface Props {
  record: Rec;
  onClose: () => void;
  onThread: (t: ThreadId) => void;
  onMode: (m: Mode) => void;
  onFocus: (country: string) => void;
  focused: boolean;
  lantern: boolean;
}

export default function Panel({
  record: r,
  onClose,
  onThread,
  onMode,
  onFocus,
  focused,
  lantern,
}: Props) {
  const src = SOURCE_META[r.source];
  const accent = CONTINENT_COLOR[r.continent];

  return (
    <article
      key={r.id}
      className={`animate-fade-up scroll-thin h-full overflow-y-auto border-l border-white/8 ${src.tex}`}
    >
      <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-white/8 bg-[#0a0d12]/92 px-5 py-3 backdrop-blur">
        <div style={{ color: accent }}>
          <SourceChip source={r.source} size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="smallcaps text-[10px] text-slate-500">{src.label}</div>
          <div className="truncate text-[11px] text-slate-400">{src.short === "living" ? "practised today" : src.short}</div>
        </div>
        <button
          onClick={onClose}
          className="mode-btn rounded-sm border border-white/10 px-2 py-1 text-[10px] tracking-widest text-slate-400 hover:bg-white/5 hover:text-slate-200"
        >
          CLOSE
        </button>
      </div>

      <div className="px-5 pt-5 pb-10">
        <h2 className="font-display text-[27px] leading-tight text-[#efe6d4]">{r.title}</h2>
        <p className="font-display mt-1 text-[15px] italic leading-snug text-slate-400">{r.subtitle}</p>

        <button
          onClick={() => onFocus(r.place.country)}
          className="mode-btn mt-3 inline-flex items-center gap-2 rounded-sm border border-white/10 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/5"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
          {r.place.name}, {r.place.country}
          <span className="text-slate-500">{focused ? "· in focus" : "· focus here"}</span>
        </button>

        {lantern && r.plain && (
          <p className="font-display mt-5 text-[19px] leading-relaxed text-[#efe6d4]">{r.plain}</p>
        )}

        {!lantern && (
          <>
            <p className="font-display mt-5 text-[16.5px] leading-relaxed text-[#d9d2c4]">{r.summary}</p>

            <div className="my-5 hairline" />

            {r.body.map((para, i) => (
              <p key={i} className="mb-3.5 text-[13.5px] leading-[1.75] text-slate-300/90">
                {para}
              </p>
            ))}

            {r.note && (
              <div className="mt-5 border-l-2 border-dashed border-slate-500/40 bg-white/[0.02] py-3 pl-4 pr-3">
                <div className="smallcaps mb-1 text-[10px] text-slate-500">On the evidence</div>
                <p className="text-[12.5px] leading-relaxed text-slate-400 italic">{r.note}</p>
              </div>
            )}
          </>
        )}

        {lantern && (
          <>
            <Fold label="Read the long version">
              <p className="font-display mb-4 text-[15.5px] leading-relaxed text-[#d9d2c4]">{r.summary}</p>
              {r.body.map((para, i) => (
                <p key={i} className="mb-3.5 text-[13.5px] leading-[1.75] text-slate-300/90">
                  {para}
                </p>
              ))}
            </Fold>

            <Fold label="How we know this">
              <div className="space-y-0">
                <Row k="Culture" v={r.culture} />
                <Row k="Basis" v={r.evidence} />
              </div>
              {r.note && (
                <p className="mt-3 border-l-2 border-dashed border-slate-500/40 py-1 pl-3 text-[12.5px] leading-relaxed text-slate-400 italic">
                  {r.note}
                </p>
              )}
              {r.sources?.length ? (
                <>
                  <div className="smallcaps mt-4 mb-1 text-[10px] text-slate-500">Sources</div>
                  <Sources record={r} bare />
                </>
              ) : null}
            </Fold>
          </>
        )}

        <div className="mt-6 space-y-0">
          {!lantern && <Row k="Culture" v={r.culture} />}
          {!lantern && <Row k="Basis" v={r.evidence} />}
          {r.calendar && (
            <Row
              k="When"
              v={
                <>
                  {r.calendar.label}
                  <span className="ml-2 text-slate-500">
                    ({r.calendar.drift === "lunar" ? "lunar, moves each year" : r.calendar.drift === "variable" ? "varies locally" : "fixed date"})
                  </span>
                </>
              }
            />
          )}
          {r.veil && <Row k="Veil" v={`${VEIL_META[r.veil.depth].label} — ${r.veil.role}`} />}
          {r.remembrance && (
            <Row
              k="Remembrance"
              v={
                <span className="flex items-baseline gap-2">
                  <svg width={17} height={17} viewBox="-10 -10 20 20" className="shrink-0 self-center text-[#e8b57a]">
                    <Emblem cluster={r.remembrance.cluster} size={18} />
                  </svg>
                  <span>
                    {REMEMBRANCE_META[r.remembrance.cluster].label} — {r.remembrance.role}
                  </span>
                </span>
              }
            />
          )}
        </div>

        {r.entity && (
          <section className="mt-7 border border-white/10 bg-black/25">
            <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <div style={{ color: accent }}>
                <svg width={40} height={40} viewBox="-22 -22 44 44">
                  <Sil shape={r.entity.shape} size={38} />
                </svg>
              </div>
              <div>
                <div className="smallcaps text-[11px] text-[#d8b46a]">{ENTITY_META[r.entity.kind].label}</div>
                <div className="text-[11px] leading-snug text-slate-500">{ENTITY_META[r.entity.kind].blurb}</div>
              </div>
            </header>
            <div className="px-4 py-2">
              <Row
                k="Names"
                v={
                  <ul className="space-y-0.5">
                    {r.entity.names.map((n) => (
                      <li key={n.name}>
                        <span className="text-[#e0d6c2]">{n.name}</span>
                        <span className="text-slate-500"> — {n.lang}</span>
                      </li>
                    ))}
                  </ul>
                }
              />
              <Row k="Earliest" v={r.entity.earliest} />
              <Row k="Range" v={r.entity.range} />
              <Row
                k="Characteristics"
                v={
                  <ul className="space-y-0.5">
                    {r.entity.traits.map((t) => (
                      <li key={t} className="before:mr-2 before:text-slate-600 before:content-['—']">
                        {t}
                      </li>
                    ))}
                  </ul>
                }
              />
              {r.entity.variants && <Row k="Variants" v={r.entity.variants.join(" · ")} />}
              {(() => {
                const accounts = r.entity!.accounts && (
                  <Row
                    k="Accounts"
                    v={
                      <ul className="space-y-1.5">
                        {r.entity!.accounts!.map((a) => (
                          <li key={a.when} className="font-mono2 text-[11.5px] leading-relaxed">
                            <span className="text-[#d8b46a]">{a.when}</span>
                            <span className="text-slate-400"> · {a.what}</span>
                          </li>
                        ))}
                      </ul>
                    }
                  />
                );
                const development = r.entity!.development && (
                  <Row k="Development" v={r.entity!.development} />
                );
                if (!accounts && !development) return null;
                return lantern ? (
                  <Fold label="Who reported it, and when">
                    <div className="space-y-0">
                      {accounts}
                      {development}
                    </div>
                  </Fold>
                ) : (
                  <>
                    {accounts}
                    {development}
                  </>
                );
              })()}
            </div>
          </section>
        )}

        {r.threads.length > 0 && (
          <section className="mt-7">
            <div className="smallcaps mb-2 text-[10px] text-slate-500">Recurring ideas this touches</div>
            <div className="flex flex-wrap gap-1.5">
              {r.threads.map((t) => {
                const meta = THREAD_META.find((m) => m.id === t)!;
                return (
                  <button
                    key={t}
                    onClick={() => onThread(t)}
                    className="mode-btn rounded-full border border-[#d8b46a]/25 px-2.5 py-1 text-[11px] text-[#d8b46a]/85 hover:border-[#d8b46a]/60 hover:bg-[#d8b46a]/10"
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[10.5px] italic leading-relaxed text-slate-600">
              Shared ideas are not evidence of shared origin.
            </p>
          </section>
        )}

        {!lantern && <Sources record={r} />}

        <section className="mt-7 border-t border-white/8 pt-4">
          <div className="smallcaps mb-2 text-[10px] text-slate-500">Carry this record into</div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["atlas", "Atlas"],
                ["calendar", "Calendar"],
                r.veil ? ["veil", "Veil"] : null,
                r.remembrance ? ["remembrance", "Remembrance"] : null,
                r.entity ? ["guide", "Field Guide"] : null,
              ].filter(Boolean) as [Mode, string][]
            ).map(([m, label]) => (
              <button
                key={m}
                onClick={() => onMode(m)}
                className="mode-btn rounded-sm border border-white/10 px-2.5 py-1 text-[11px] text-slate-400 hover:bg-white/5 hover:text-slate-100"
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
