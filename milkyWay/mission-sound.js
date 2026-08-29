/* ═══════════════════════════════════════════════════════════════════════
   mission-sound.js — the instrument panel's four noises
   ───────────────────────────────────────────────────────────────────────
   Oscillators only. No files, no fetches, nothing to host — the page still
   opens straight off disk.

   The context is built on the click that launches a mission, because that
   is a real user gesture and browsers will not let audio start without
   one. Outside a mission the atlas stays silent; sound here is part of the
   instrument, not an ambient layer laid over the whole map.

   Everything goes through one master gain, so muting is instantaneous and
   never leaves a tail ringing.
   ═══════════════════════════════════════════════════════════════════════ */

window.MissionSound = (function () {
  'use strict';

  var ctx = null, master = null, muted = false;

  function arm() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.12;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; return false; }
    return true;
  }

  /* One note. `type` shapes it, `t0` is an offset in seconds from now. */
  function note(freq, dur, t0, type, peak) {
    if (!ctx || muted) return;
    var t = ctx.currentTime + (t0 || 0);
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = type || 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    /* Short attack, exponential tail — a plain gate clicks audibly. */
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak || 0.9, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  return {
    arm: arm,
    ready: function () { return !!ctx; },

    setMuted: function (m) {
      muted = !!m;
      if (master) master.gain.value = muted ? 0 : 0.12;
    },
    isMuted: function () { return muted; },

    /* The proximity tick. Pitch rises with signal so the ear can hear
       "warmer" even before the meter is looked at. */
    tick: function (signal) {
      var s = Math.max(0, Math.min(1, signal || 0));
      note(320 + s * 620, 0.05, 0, 'square', 0.16 + s * 0.30);
    },

    /* An objective logged: three notes up. */
    logged: function () {
      note(523.25, 0.16, 0);
      note(659.25, 0.16, 0.085);
      note(783.99, 0.42, 0.17);
    },

    /* A marker opened that wasn't the target. Deliberately neutral —
       there are no fail states here, so this acknowledges, never scolds. */
    pip: function () {
      note(392, 0.07, 0, 'sine', 0.35);
    },

    /* Mission complete: the same figure carried further, with a fifth
       held over the top of it. */
    complete: function () {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) {
        note(f, 0.3, i * 0.115);
      });
      note(1567.98, 1.5, 0.6, 'sine', 0.22);
    }
  };
})();
