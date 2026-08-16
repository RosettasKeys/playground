import { CONTINENT_COLOR, CONTINENT_ORDER, SOURCE_META } from "../data";
import type { SourceKind } from "../data/types";
import { SourceChip } from "./Panel";

const ORDER: SourceKind[] = ["living", "historical", "folklore", "reconstructed", "report", "contested"];

export default function Legend({
  open,
  onToggle,
  settled,
  onSettled,
  onSources,
}: {
  open: boolean;
  onToggle: () => void;
  settled: boolean;
  onSettled: (v: boolean) => void;
  onSources: () => void;
}) {
  return (
    <div
      className="pointer-events-auto absolute bottom-3 left-3 z-20 max-w-[19rem]"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onToggle}
        className="mode-btn flex w-full items-center gap-2 rounded-sm border border-white/10 bg-[#0a0d12]/85 px-3 py-2 text-left backdrop-blur hover:border-[#d8b46a]/35"
      >
        <span className="text-[#d8b46a]">
          <SourceChip source="living" size={16} />
        </span>
        <span className="smallcaps flex-1 text-[10.5px] text-slate-300">Reading the marks</span>
        <span className="font-mono2 text-[10px] text-slate-500">{open ? "–" : "+"}</span>
      </button>

      {open && (
        <div className="animate-fade-up mt-1.5 rounded-sm border border-white/10 bg-[#0a0d12]/94 p-3 backdrop-blur">
          <p className="mb-3 text-[11px] leading-relaxed text-slate-400">
            Every record is drawn according to the kind of knowledge it is. Nothing here is labelled true or false —
            the marks describe how we know, not whether to believe.
          </p>
          <ul className="space-y-2">
            {ORDER.map((s) => (
              <li key={s} className="flex items-start gap-2.5">
                <span className="mt-[1px] text-[#d5c9ae]">
                  <SourceChip source={s} size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11.5px] leading-tight text-slate-200">{SOURCE_META[s].label}</span>
                  <span className="block text-[10.5px] leading-snug text-slate-500">{SOURCE_META[s].blurb}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="my-3 hairline" />
          <div className="mb-1.5 smallcaps text-[10px] text-slate-500">Colour holds geography</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {CONTINENT_ORDER.map((c) => (
              <span key={c} className="flex items-center gap-1.5 text-[10.5px] text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: CONTINENT_COLOR[c] }} />
                {c}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[10.5px] leading-relaxed text-slate-600 italic">
            Living religions are described as belief, not catalogued as creatures. Where a tradition is restricted or
            contested, the entry says so instead of guessing.
          </p>

          <button
            onClick={onSources}
            className="mode-btn mt-2.5 text-left text-[10.5px] text-[#d8b46a] underline decoration-[#d8b46a]/30 underline-offset-2 hover:decoration-[#d8b46a]"
          >
            How this atlas knows what it says
          </button>

          <div className="my-3 hairline" />
          <button
            onClick={() => onSettled(!settled)}
            className="mode-btn flex w-full items-start gap-2 rounded-sm px-1 py-1 text-left hover:bg-white/[0.04]"
          >
            <span
              className={
                "mt-[2px] h-2.5 w-2.5 shrink-0 rounded-full border " +
                (settled ? "border-[#d8b46a]/70 bg-[#d8b46a]/70" : "border-slate-600")
              }
            />
            <span>
              <span className="block text-[11px] leading-tight text-slate-300">Settle the house</span>
              <span className="block text-[10.5px] leading-snug text-slate-500">
                {settled
                  ? "Nothing will move on the far side of the globe."
                  : "Something occasionally does. Switch this on and it won't."}
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
