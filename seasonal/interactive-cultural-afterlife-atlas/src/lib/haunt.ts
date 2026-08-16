/**
 * Something on the far side of the globe.
 *
 * The atlas is otherwise an honest instrument, which is exactly why this
 * works: the creepiest thing a scholarly map can do is misbehave.  A
 * silhouette drawn from the collection's own field-guide shapes wanders the
 * hidden hemisphere, showing only as a dark mass under the coastline.  Chase
 * it by dragging and it runs; leave it alone and, once in a while, it comes
 * all the way round to stand directly behind you.
 *
 * Discoverable, never blocking — it cannot fire while you are reading a
 * record, and "settle the house" in the legend turns it off for good.
 * Also disabled outright under prefers-reduced-motion.
 *
 * ── signature ────────────────────────────────────────────────────────────
 * Built by claude-opus-5 (Claude Opus 5) via Claude Code.
 * The atlas itself came out of an arena.ai battle-mode bake-off and won on
 * the first run through claude-opus-5-max; credit where it is due.
 */
import { useEffect, useRef, useState } from "react";
import type { Silhouette } from "../data/types";
import type { Rot } from "./projection";

export const SETTLE_KEY = "thresholds:settle";

export type HauntPhase = "prowl" | "eyes" | "lunge" | "black";

export interface Haunt {
  shape: Silhouette["shape"];
  lng: number;
  lat: number;
  phase: HauntPhase;
}

/** shapes that read as a body moving under the map, not as a diagram */
const PROWLERS: Silhouette["shape"][] = [
  "shade",
  "humanoid",
  "quadruped",
  "winged",
  "serpent",
  "composite",
  "aquatic",
];

const FIRST_DELAY = 45_000;
const BETWEEN = 90_000;
const JITTER = 40_000;
/** how often a prowl is one that comes all the way round */
const LUNGE_CHANCE = 0.28;
const MAX_PROWL = 26_000;

const D2R = Math.PI / 180;

if (typeof console !== "undefined") {
  console.log(
    "%cThresholds%c — an atlas of the dead, the remembered & the unseen.\n" +
      "Something is on the far side of the globe. Leave it alone long enough and it comes round.\n" +
      "Turn it off in the legend: “settle the house”.\n" +
      "Haunt by claude-opus-5 (Claude Opus 5), via Claude Code.\n" +
      "Atlas built in an arena.ai battle-mode bake-off — first run, claude-opus-5-max.",
    "color:#d8b46a;letter-spacing:0.3em",
    "color:#8b98a8",
  );
}

function cosc(lng: number, lat: number, rot: Rot) {
  const p = lat * D2R;
  const l = (lng - rot.lng) * D2R;
  const p0 = rot.lat * D2R;
  return Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
}

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

export function readSettled() {
  try {
    return localStorage.getItem(SETTLE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeSettled(v: boolean) {
  try {
    localStorage.setItem(SETTLE_KEY, v ? "1" : "0");
  } catch {
    /* private mode — the house just doesn't stay settled between visits */
  }
}

interface Prowl {
  shape: Silhouette["shape"];
  lng: number;
  lat: number;
  speed: number;
  willLunge: boolean;
  bornAt: number;
  phase: HauntPhase;
}

/**
 * @param active whether a prowl may start — atlas mode, nothing being read,
 *               intro dismissed, scares not switched off
 */
export function useHaunt(active: boolean, rot: Rot, dragging: boolean): Haunt | null {
  const [haunt, setHaunt] = useState<Haunt | null>(null);

  const rotRef = useRef(rot);
  rotRef.current = rot;
  const dragRef = useRef(dragging);
  dragRef.current = dragging;
  const activeRef = useRef(active);
  activeRef.current = active;

  const prowl = useRef<Prowl | null>(null);
  const nextAt = useRef(0);

  useEffect(() => {
    nextAt.current = performance.now() + FIRST_DELAY;
    let raf = 0;
    const timers: number[] = [];

    const rest = (now: number) => {
      prowl.current = null;
      setHaunt(null);
      nextAt.current = now + BETWEEN + Math.random() * JITTER;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const p = prowl.current;
      const r = rotRef.current;

      if (!p) {
        if (!activeRef.current || dragRef.current || now < nextAt.current) return;
        // It travels in longitude only, so it has to start near the latitude
        // of the point directly opposite the reader — any further off and it
        // can never actually come round behind them.  Then start it well
        // round the back, closing the longitude gap until it really is over
        // the horizon rather than spawning something in plain view.
        const dir = Math.random() < 0.5 ? 1 : -1;
        const lat = Math.max(-78, Math.min(78, -r.lat + (Math.random() * 10 - 5)));
        let off = 62;
        while (off > 8 && cosc(r.lng + 180 - dir * off, lat, r) > -0.25) off *= 0.6;
        prowl.current = {
          shape: PROWLERS[(Math.random() * PROWLERS.length) | 0],
          lng: r.lng + 180 - dir * off,
          lat,
          speed: dir * 0.16,
          willLunge: Math.random() < LUNGE_CHANCE,
          bornAt: now,
          phase: "prowl",
        };
        return;
      }

      if (p.phase !== "prowl") return;

      // once it has been looked for, it will not be caught
      if (dragRef.current) {
        p.willLunge = false;
        p.speed = Math.sign(p.speed) * Math.min(1.4, Math.abs(p.speed) * 1.045);
      }
      p.lng += p.speed;

      const c = cosc(p.lng, p.lat, r);

      if (p.willLunge && c < -0.99) {
        p.phase = "eyes";
        setHaunt({ shape: p.shape, lng: p.lng, lat: p.lat, phase: "eyes" });
        timers.push(
          window.setTimeout(() => {
            setHaunt((h) => (h ? { ...h, phase: "lunge" } : h));
            timers.push(
              window.setTimeout(() => {
                setHaunt((h) => (h ? { ...h, phase: "black" } : h));
                timers.push(
                  window.setTimeout(() => rest(performance.now()), 180),
                );
              }, 260),
            );
          }, 420),
        );
        return;
      }

      // slipped back over the horizon, or simply gave up
      if (c > -0.05 || now - p.bornAt > MAX_PROWL || !activeRef.current) {
        rest(now);
        return;
      }

      setHaunt({ shape: p.shape, lng: p.lng, lat: p.lat, phase: "prowl" });
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, []);

  return haunt;
}

