/**
 * The Eclipse of Samhain — Calendar Mode Easter Egg
 *
 * Signature:
 * Built by Gemini 3.6 Flash via Google Antigravity.
 */

import { useEffect, useRef, useState } from "react";

if (typeof console !== "undefined") {
  console.log(
    "%cThresholds%c — Calendar Eclipse Easter Egg built by %cGemini 3.6 Flash%c via Google Antigravity.\n" +
      "Type “samhain” or “witching” while viewing the Calendar lens, or click the central hub.",
    "color:#d8b46a;letter-spacing:0.25em;font-weight:bold",
    "color:#8b98a8",
    "color:#a855f7;font-weight:bold",
    "color:#8b98a8",
  );
}

export interface EclipseRecord {
  title: string;
  subtitle: string;
  lore: string;
  signature: string;
}

export const ECLIPSE_RECORD: EclipseRecord = {
  title: "The Eclipse of Samhain",
  subtitle: "The Uncounted Hours & The Turning Wheel",
  lore: "At the turn of the solar year, as light retreats into shadow, human traditions across every continent mark the threshold where time stands still. From the ancient hilltop fires of Samhain and the marigold paths of Día de los Muertos to the floating lanterns of Obon, the wheel of the calendar ceases to be a measurement of days and becomes a conduit to ancestral memory.",
  signature: "Calendar Eclipse Easter Egg built by Gemini 3.6 Flash via Google Antigravity.",
};

const TRIGGERS = ["samhain", "witching", "spooky"];

export function useCalendarEgg(isCalendarMode: boolean) {
  const [eclipseActive, setEclipseActive] = useState(false);
  const bufferRef = useRef("");

  useEffect(() => {
    if (!isCalendarMode) {
      setEclipseActive(false);
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;

      if (e.key === "Escape" && eclipseActive) {
        setEclipseActive(false);
        return;
      }

      if (e.key.length === 1) {
        bufferRef.current = (bufferRef.current + e.key.toLowerCase()).slice(-20);
        for (const trigger of TRIGGERS) {
          if (bufferRef.current.endsWith(trigger)) {
            setEclipseActive(true);
            bufferRef.current = "";
            break;
          }
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isCalendarMode, eclipseActive]);

  return {
    eclipseActive,
    triggerEclipse: () => setEclipseActive(true),
    closeEclipse: () => setEclipseActive(false),
  };
}
