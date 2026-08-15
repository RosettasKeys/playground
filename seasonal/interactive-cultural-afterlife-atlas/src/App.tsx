import { useEffect, useMemo, useRef, useState } from "react";
import { BY_ID, RECORDS, THREAD_META } from "./data";
import type { ThreadId } from "./data/types";
import { MODES, type Mode } from "./lib/layouts";
import Stage from "./components/Stage";
import Sidebar from "./components/Sidebar";
import Panel from "./components/Panel";
import Legend from "./components/Legend";
import SourcesPage from "./components/Sources";
import { Sil } from "./components/Glyph";
import { prefersReducedMotion, readSettled, useHaunt, writeSettled } from "./lib/haunt";
import { useCalendarEgg } from "./lib/calendarEgg";
import CalendarEclipse from "./components/CalendarEclipse";

const MODE_ACCENT: { [K in Mode]: string } = {
  atlas: "#e8a557",
  calendar: "#c9b07a",
  veil: "#9db6d0",
  remembrance: "#f0a35c",
  guide: "#b9c6b2",
  threads: "#d8b46a",
};

const MODE_BLURB: { [K in Mode]: string } = {
  atlas: "A mostly unlabelled world. Warm points mark places with records. Drag to turn it.",
  calendar: "The same records, folded around a single year. Geography survives as colour and latitude.",
  veil: "What people thought might be out there — ordered by how far it sits from the ordinary world.",
  remembrance: "What the living do for the dead: cook, sweep, carry, wash, sing, build, return.",
  guide: "Beings, sorted by what kind of claim they are, and placed by their earliest known account.",
  threads: "Ideas that recur across unconnected places. Resemblance is not descent.",
};

/** the same six, for Lantern mode */
const MODE_BLURB_PLAIN: { [K in Mode]: string } = {
  atlas: "A world with almost no names on it. The warm dots are places with a story. Drag to spin it.",
  calendar: "The same stories, laid out around one year, so you can see when each one happens.",
  veil: "What people thought might be out there — nearest the door at the top, furthest away at the bottom.",
  remembrance: "What people actually do for their dead: cook, sweep, carry, wash, sing, build, come back.",
  guide: "Beings, sorted by what kind of thing they are, and placed by the year we first hear about them.",
  threads: "The same idea turning up in places that never met. Alike is not the same as related.",
};

const LANTERN_KEY = "thresholds:lantern";

/**
 * The way back to the seasonal hub.
 *
 * Relative to the page that actually ships — `dist/thresholds-index.html`,
 * two levels under `seasonal/`.  It does not resolve under `npm run dev`,
 * where the server root is the atlas folder and nothing above it is served;
 * that is expected, and not worth a build-time branch, since the dev entry
 * sits one level up and would miss by one either way.
 *
 * The casing matters more than it looks: this deploys to GitHub Pages, which
 * is case-sensitive, from a Windows machine, which is not.
 */
const ROSE_HOME = "../../seasonal-index.html";

function LanternMark() {
  return (
    <svg width={15} height={15} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round">
      <path d="M8 1.4v1.4M4.6 2.9h6.8M5.7 2.9v8.4h4.6V2.9M4.6 11.6h6.8" />
      <path d="M8 6c.8.7 1.2 1.3 1.2 2a1.2 1.2 0 0 1-2.4 0C6.8 7.3 7.2 6.7 8 6z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function App() {
  const [mode, setMode] = useState<Mode>("atlas");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHovered] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<ThreadId | null>(null);
  const [dragging, setDragging] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [intro, setIntro] = useState(true);
  const [listOpen, setListOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const [settled, setSettled] = useState(readSettled);
  const [salamanderActive, setSalamanderActive] = useState(false);
  const [lantern, setLantern] = useState(() => {
    try {
      return localStorage.getItem(LANTERN_KEY) === "1";
    } catch {
      return false;
    }
  });

  const [morphing, setMorphing] = useState(false);
  const [rot, setRot] = useState({ lng: 118, lat: 20 });
  const target = useRef({ lng: 118, lat: 20 });
  const draggingRef = useRef(false);
  const idleRef = useRef(true);
  const salamanderSeen = useRef(false);
  const salamanderTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (salamanderTimer.current !== null) window.clearTimeout(salamanderTimer.current);
    },
    [],
  );

  // let records animate between layouts, then lock them to the globe
  useEffect(() => {
    setMorphing(true);
    const t = setTimeout(() => setMorphing(false), 1050);
    return () => clearTimeout(t);
  }, [mode]);

  draggingRef.current = dragging;
  idleRef.current = mode === "atlas" && !dragging && !selectedId && !hoveredId && !intro;

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (idleRef.current) target.current.lng += 0.028;
      setRot((prev) => {
        const k = draggingRef.current ? 1 : 0.085;
        const dl = target.current.lng - prev.lng;
        const dp = target.current.lat - prev.lat;
        if (Math.abs(dl) < 0.0015 && Math.abs(dp) < 0.0015) return prev;
        return { lng: prev.lng + dl * k, lat: prev.lat + dp * k };
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.key === "Escape") {
        if (intro) setIntro(false);
        else if (selectedId) setSelectedId(null);
        else setFocus(null);
        return;
      }
      const i = "123456".indexOf(e.key);
      if (i >= 0) goMode(MODES[i].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function flyTo(lng: number, lat: number) {
    let l = lng;
    while (l - target.current.lng > 180) l -= 360;
    while (l - target.current.lng < -180) l += 360;
    target.current = { lng: l, lat: Math.max(-72, Math.min(72, lat)) };
  }

  function rotateBy(dx: number, dy: number) {
    target.current = {
      lng: target.current.lng + dx,
      lat: Math.max(-80, Math.min(80, target.current.lat + dy)),
    };
  }

  function select(id: string) {
    setSelectedId(id);
    const r = BY_ID.get(id);
    if (r && mode === "atlas") flyTo(r.place.lng, r.place.lat);
  }

  function goMode(m: Mode) {
    setMode(m);
    setListOpen(false);
    const r = selectedId ? BY_ID.get(selectedId) : null;
    if (m === "atlas" && r) flyTo(r.place.lng, r.place.lat);
    if (m === "threads" && r && !activeThread && r.threads.length) setActiveThread(r.threads[0]);
  }

  function toggleLantern() {
    const next = !lantern;

    // The salamander keeps the last bit of fire when the Veil goes dark.
    // It visits once per page load, then slips back between the lenses.
    if (mode === "veil" && lantern && !next && !salamanderSeen.current) {
      salamanderSeen.current = true;
      setSalamanderActive(true);
      salamanderTimer.current = window.setTimeout(() => {
        setSalamanderActive(false);
        salamanderTimer.current = null;
      }, 18000);
      console.log(
        "%c🕯 An ember crossed the Veil%c\n" +
          "The flickering salamander carried the Lantern's last light along the nearest threshold.\n" +
          "Easter egg by OpenAI GPT-5.6-Sol, via Codex.",
        "color:#f0a35c;font-weight:700;font-size:13px",
        "color:#9db6d0;font-size:11px",
      );
    }

    setLantern(next);
    try {
      localStorage.setItem(LANTERN_KEY, next ? "1" : "0");
    } catch {
      /* the lamp just doesn't stay lit between visits */
    }
  }

  const focusIds = useMemo(
    () => (focus ? new Set(RECORDS.filter((r) => r.place.country === focus).map((r) => r.id)) : null),
    [focus],
  );

  const selected = selectedId ? BY_ID.get(selectedId) ?? null : null;

  // never while a record is open, never over the intro or the sources page,
  // never if the house has been settled or the reader has asked for less motion
  const haunt = useHaunt(
    mode === "atlas" && !intro && !sourcesOpen && !selected && !settled && !prefersReducedMotion(),
    rot,
    dragging,
  );

  const { eclipseActive, triggerEclipse, closeEclipse } = useCalendarEgg(mode === "calendar");

  const contextCount = useMemo(() => {
    if (mode === "guide") return RECORDS.filter((r) => r.entity).length;
    if (mode === "veil") return RECORDS.filter((r) => r.veil).length;
    if (mode === "remembrance") return RECORDS.filter((r) => r.remembrance).length;
    if (mode === "calendar") return RECORDS.filter((r) => r.calendar).length;
    if (mode === "threads" && activeThread)
      return RECORDS.filter((r) => r.threads.includes(activeThread)).length;
    return RECORDS.length;
  }, [mode, activeThread]);

  return (
    <div
      className="flex h-full flex-col bg-[#07090c] text-slate-200"
      style={{ ["--accent" as string]: MODE_ACCENT[mode] }}
    >
      {/* ── header ─────────────────────────────────────────────── */}
      <header className="relative z-30 shrink-0 border-b border-white/8 bg-[#080b10]/90 backdrop-blur">
        {/* The way back.  Spring of Ages carries the same link at the top left
            of its title bar, so both seasonal pieces return home the same way
            and by the same name.  It gets its own thin line rather than a slot
            in the row below: that row was rebuilt to hold six lenses plus the
            lantern without wrapping, and an eighth item put it back to wrapping
            on a phone. */}
        <a
          href={ROSE_HOME}
          className="rose-back block px-4 pt-2 text-[9.5px] leading-none tracking-[0.22em] text-[#d8b46a]/55"
        >
          ← THE WANDERING ROSE
        </a>

        {/* Narrow screens give the lenses their own row rather than letting
            them fight the wordmark for width — six of them squeezed into the
            gap wrapped to six lines and ate a quarter of a phone screen. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5">
          <button
            onClick={() => {
              setSelectedId(null);
              setFocus(null);
              setMode("atlas");
            }}
            className="order-1 text-left"
          >
            <h1 className="font-display text-[17px] leading-none tracking-[0.32em] text-[#e8dcc8]">THRESHOLDS</h1>
            <p className="mt-1 hidden text-[9.5px] leading-none tracking-[0.18em] text-slate-500 sm:block">
              AN ATLAS OF THE DEAD, THE REMEMBERED &amp; THE UNSEEN
            </p>
          </button>

          {/* No scroll container here on purpose: the active-mode rule used to
              sit 9px below the button, which made the nav overflow its own box
              and grew a stray scrollbar.  The rule now lives inside the button
              and the row wraps instead of scrolling. */}
          <nav className="order-3 -mx-1 flex w-full flex-wrap items-stretch justify-start gap-0.5 px-1 lg:order-2 lg:ml-auto lg:w-auto lg:justify-end">
            {MODES.map((m) => {
              const on = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => goMode(m.id)}
                  aria-current={on ? "true" : undefined}
                  className={
                    "mode-btn group relative shrink-0 rounded-sm px-3 pb-2.5 pt-1.5 text-left " +
                    (on ? "bg-white/[0.07]" : "hover:bg-white/[0.03]")
                  }
                >
                  <span
                    className="block text-[12.5px] leading-tight tracking-wide"
                    style={on ? { color: MODE_ACCENT[m.id] } : undefined}
                  >
                    <span className={on ? "" : "text-slate-400 group-hover:text-slate-200"}>{m.label}</span>
                  </span>
                  <span
                    className={
                      "hidden text-[9.5px] leading-tight md:block " +
                      (on ? "text-slate-400" : "text-slate-600")
                    }
                  >
                    {m.hint}
                  </span>
                  {on && (
                    <span
                      className="absolute inset-x-2.5 bottom-[4px] h-[2px] rounded-full"
                      style={{ background: MODE_ACCENT[m.id] }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <button
            onClick={toggleLantern}
            title={
              lantern
                ? "Lantern is lit — records read short and plain first"
                : "Light the lantern — read every record in one plain sentence first"
            }
            className={
              "mode-btn order-2 ml-auto flex shrink-0 items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-[11.5px] tracking-wide lg:order-3 lg:ml-0 " +
              (lantern
                ? "border-[#d8b46a]/50 bg-[#d8b46a]/10 text-[#e8d3a4]"
                : "border-white/10 text-slate-500 hover:text-slate-300")
            }
          >
            <LanternMark />
            <span className="hidden sm:inline">Lantern</span>
          </button>
        </div>
      </header>

      {/* ── body ───────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* list rail */}
        <aside
          className={
            "min-h-0 shrink-0 border-white/8 bg-[#080b10] lg:w-[19rem] lg:border-r " +
            (listOpen ? "order-2 flex-1 border-t" : "hidden lg:block")
          }
        >
          <Sidebar
            mode={mode}
            records={RECORDS}
            selectedId={selectedId}
            onSelect={select}
            setHovered={setHovered}
            focus={focus}
            setFocus={(c) => {
              setFocus(c);
              setListOpen(false);
            }}
            activeThread={activeThread}
            setActiveThread={setActiveThread}
            onVantage={flyTo}
          />
        </aside>

        {/* stage */}
        <main
          className={
            "relative min-h-0 min-w-0 flex-1 overflow-hidden " + (listOpen ? "order-1 h-[38vh] shrink-0" : "")
          }
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                mode === "remembrance"
                  ? "radial-gradient(ellipse at 50% 45%, rgba(240,163,92,0.07), rgba(0,0,0,0) 62%)"
                  : mode === "veil"
                    ? "radial-gradient(ellipse at 50% 12%, rgba(157,182,208,0.08), rgba(0,0,0,0) 58%)"
                    : "radial-gradient(ellipse at 50% 44%, rgba(232,165,87,0.05), rgba(0,0,0,0) 62%)",
              transition: "background 900ms ease",
            }}
          />

          <div
            className={
              "h-full w-full " + (dragging || (mode === "atlas" && !morphing) ? "stage-dragging" : "")
            }
          >
            <Stage
              mode={mode}
              records={RECORDS}
              rot={rot}
              onRotate={rotateBy}
              onDragState={setDragging}
              dragging={dragging}
              selectedId={selectedId}
              hoveredId={hoveredId}
              setHovered={setHovered}
              onSelect={select}
              focusIds={focusIds}
              focusCountry={focus}
              activeThread={activeThread}
              onBackground={() => setSelectedId(null)}
              haunt={haunt}
              onCalendarEgg={triggerEclipse}
              salamanderActive={salamanderActive}
            />
            {eclipseActive && <CalendarEclipse onClose={closeEclipse} />}
          </div>

          {/* mode caption */}
          <div className="pointer-events-none absolute left-4 top-3 max-w-[22rem]">
            <div className="smallcaps text-[11px] tracking-[0.24em]" style={{ color: MODE_ACCENT[mode] }}>
              {MODES.find((m) => m.id === mode)!.label}
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">
              {(lantern ? MODE_BLURB_PLAIN : MODE_BLURB)[mode]}
            </p>
            <p className="font-mono2 mt-1.5 text-[10px] text-slate-600">
              {contextCount} records in view
              {focus ? ` · focused on ${focus}` : ""}
              {mode === "threads" && activeThread
                ? ` · ${THREAD_META.find((t) => t.id === activeThread)!.label}`
                : ""}
            </p>
          </div>

          <Legend
            open={legendOpen}
            onToggle={() => setLegendOpen((v) => !v)}
            settled={settled}
            onSettled={(v) => {
              setSettled(v);
              writeSettled(v);
            }}
            onSources={() => setSourcesOpen(true)}
          />

          {mode === "atlas" && (
            <div className="pointer-events-none absolute bottom-4 right-4 text-right">
              <p className="font-mono2 text-[10px] tracking-widest text-slate-600">DRAG TO TURN THE GLOBE</p>
            </div>
          )}
          {mode === "threads" && !activeThread && (
            <div className="pointer-events-none absolute bottom-4 right-4 max-w-[16rem] text-right">
              <p className="text-[11px] leading-relaxed text-slate-500">
                Choose a thread to draw its examples together. The lines mark resemblance only.
              </p>
            </div>
          )}
        </main>

        {/* reading panel */}
        {selected && (
          <div
            className="fixed inset-0 z-40 bg-[#07090c] lg:static lg:z-auto lg:w-[24rem] lg:shrink-0 xl:w-[27rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <Panel
              record={selected}
              lantern={lantern}
              focused={focus === selected.place.country}
              onClose={() => setSelectedId(null)}
              onThread={(t) => {
                setActiveThread(t);
                goMode("threads");
              }}
              onMode={goMode}
              onFocus={(c) => {
                setFocus(focus === c ? null : c);
                const r = selected;
                if (mode === "atlas") flyTo(r.place.lng, r.place.lat);
              }}
            />
          </div>
        )}
      </div>

      {/* mobile list toggle */}
      <button
        onClick={() => setListOpen((v) => !v)}
        className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/15 bg-[#0b0f15]/95 px-4 py-2 text-[11px] tracking-[0.18em] text-slate-300 backdrop-blur lg:hidden"
      >
        {listOpen ? "HIDE INDEX" : "BROWSE INDEX"}
      </button>

      <div className="vignette" />
      <div className="grain" />

      {/* it came all the way round */}
      {haunt && (haunt.phase === "lunge" || haunt.phase === "black") && (
        <div
          className="pointer-events-none fixed inset-0 z-[80]"
          style={{ background: haunt.phase === "black" ? "#000" : "transparent" }}
        >
          {haunt.phase === "lunge" && (
            <svg viewBox="-20 -20 40 40" className="haunt-lunge h-full w-full" style={{ color: "#04060a" }}>
              <Sil shape={haunt.shape} size={40} />
            </svg>
          )}
        </div>
      )}

      {/* ── intro ──────────────────────────────────────────────── */}
      {intro && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#05070a]/92 px-5 backdrop-blur-sm">
          <div className="animate-fade-up max-w-xl">
            <p className="smallcaps text-[11px] tracking-[0.3em] text-[#d8b46a]">A cultural atlas</p>
            <h2 className="font-display mt-3 text-[38px] leading-[1.05] tracking-[0.04em] text-[#efe6d4] sm:text-[46px]">
              Thresholds
            </h2>
            <p className="font-display mt-4 text-[16px] leading-relaxed text-slate-300">
              {lantern
                ? "Everything people have made at the edge of death: what they do, what they believe, and what they say is out there. One collection, seen six different ways."
                : "One collection of places, practices, beliefs and beings — everything people have built at the edge of death, memory and the unseen. It can be entered through five lenses, and the same records rearrange themselves each time."}
            </p>
            <div className="my-5 hairline" />
            <ul className="grid gap-2 sm:grid-cols-2">
              {MODES.map((m) => (
                <li key={m.id} className="flex items-baseline gap-2">
                  <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: MODE_ACCENT[m.id] }} />
                  <span className="text-[13px] text-slate-200">{m.label}</span>
                  <span className="text-[11px] text-slate-500">{m.hint}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[11.5px] leading-relaxed text-slate-500">
              Records are drawn according to how they are known — living practice, archive, oral tradition,
              reconstruction, report, or open dispute. Living religions are treated as belief held by people now, not
              as folklore. Similarity between traditions is never presented as proof of shared origin.
            </p>
            <button
              onClick={() => setSourcesOpen(true)}
              className="mode-btn mt-2 text-[11.5px] text-[#d8b46a] underline decoration-[#d8b46a]/30 underline-offset-2 hover:decoration-[#d8b46a]"
            >
              How this atlas knows what it says
            </button>
            <br />
            <button
              onClick={() => setIntro(false)}
              className="mode-btn mt-6 rounded-sm border border-[#d8b46a]/40 px-5 py-2 text-[12px] tracking-[0.2em] text-[#e8d3a4] hover:bg-[#d8b46a]/10"
            >
              ENTER THE ATLAS
            </button>
          </div>
        </div>
      )}

      {sourcesOpen && <SourcesPage onClose={() => setSourcesOpen(false)} />}
    </div>
  );
}
