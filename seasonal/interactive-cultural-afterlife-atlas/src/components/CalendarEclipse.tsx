import { ECLIPSE_RECORD } from "../lib/calendarEgg";
import { STAGE } from "../lib/layouts";

const RUNES = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ", "ᛇ", "ᛈ", "ᛉ", "ᛊ", "ᛏ", "ᛒ", "ᛖ", "ᛗ", "ᛚ", "ᛝ", "ᛟ", "ᛞ"];

interface Props {
  onClose: () => void;
}

export default function CalendarEclipse({ onClose }: Props) {
  return (
    <div
      className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-[#040508]/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      {/* ── Spectral Blood Moon & Rune Wheel Layer ──────────────── */}
      <svg
        viewBox={`0 0 ${STAGE.w} ${STAGE.h}`}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-90"
      >
        <defs>
          <radialGradient id="bloodmoon" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#9333ea" stopOpacity="0.4" />
            <stop offset="80%" stopColor="#3b0764" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <filter id="eclipseGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* Central Blood Moon Glow */}
        <circle cx={STAGE.cx} cy={STAGE.cy} r={140} fill="url(#bloodmoon)" filter="url(#eclipseGlow)" />
        <circle cx={STAGE.cx} cy={STAGE.cy} r={80} fill="#18051b" stroke="#dc2626" strokeWidth={1.5} opacity={0.6} />
        
        {/* Pulsing Core */}
        <circle cx={STAGE.cx} cy={STAGE.cy} r={42} fill="#ef4444" opacity={0.25} className="animate-ping" style={{ animationDuration: "3s" }} />
        <circle cx={STAGE.cx} cy={STAGE.cy} r={18} fill="#f87171" opacity={0.8} />

        {/* Concentric Rotating Rune Ring */}
        <g className="animate-spin" style={{ transformOrigin: `${STAGE.cx}px ${STAGE.cy}px`, animationDuration: "45s" }}>
          <circle cx={STAGE.cx} cy={STAGE.cy} r={316} fill="none" stroke="#a855f7" strokeWidth={0.8} strokeDasharray="4 8" opacity={0.4} />
          {RUNES.map((rune, i) => {
            const angle = (i / RUNES.length) * Math.PI * 2;
            const rx = STAGE.cx + Math.cos(angle) * 316;
            const ry = STAGE.cy + Math.sin(angle) * 316;
            return (
              <text
                key={i}
                x={rx}
                y={ry}
                fill="#e9d5ff"
                fontSize={13}
                textAnchor="middle"
                dominantBaseline="middle"
                opacity={0.7}
                style={{ fontFamily: "serif" }}
              >
                {rune}
              </text>
            );
          })}
        </g>

        {/* Radial Ethereal Tendrils linking to seasonal death observances */}
        {[0.82, 1.45, 2.1, 2.75, 4.1, 5.2].map((angleRad, idx) => {
          const tx = STAGE.cx + Math.cos(angleRad) * 260;
          const ty = STAGE.cy + Math.sin(angleRad) * 260;
          return (
            <g key={idx}>
              <line
                x1={STAGE.cx}
                y1={STAGE.cy}
                x2={tx}
                y2={ty}
                stroke="#c084fc"
                strokeWidth={0.7}
                strokeDasharray="3 5"
                opacity={0.5}
              />
              <circle cx={tx} cy={ty} r={4} fill="#f43f5e" opacity={0.7} />
            </g>
          );
        })}
      </svg>

      {/* ── Foreground Séance Card Modal ─────────────────────────── */}
      <div
        className="relative z-10 max-w-lg rounded-md border border-[#c084fc]/30 bg-[#0d0914]/94 p-6 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#c084fc]/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="smallcaps text-[10.5px] tracking-[0.24em] text-purple-400">
              UNCOUNTED HOUR · RECORD #000-CAL
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm font-mono transition-colors"
            title="Close Eclipse"
          >
            ✕
          </button>
        </div>

        <h2 className="font-display mt-4 text-2xl text-[#f3e8ff] tracking-wide">
          {ECLIPSE_RECORD.title}
        </h2>
        <p className="font-mono2 mt-1 text-[11px] text-purple-300/80 tracking-wider">
          {ECLIPSE_RECORD.subtitle}
        </p>

        <div className="my-4 h-[1px] bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0" />

        <p className="font-display text-[14.5px] leading-relaxed text-slate-300">
          {ECLIPSE_RECORD.lore}
        </p>

        {/* Model Identity Signature */}
        <div className="mt-5 rounded border border-purple-500/20 bg-purple-950/30 p-3">
          <p className="font-mono2 text-[10.5px] leading-snug text-purple-300">
            🔮 <span className="font-semibold text-purple-200">{ECLIPSE_RECORD.signature}</span>
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between text-[10px] text-slate-500">
          <span className="tracking-widest font-mono">OCTOBER 31 · MIDNIGHT WATCH</span>
          <span>Press ESC or click anywhere to exit</span>
        </div>
      </div>
    </div>
  );
}
