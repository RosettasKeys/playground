(() => {
  const canvas = document.querySelector(".fluid-canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const soundToggle = document.querySelector(".sound-toggle");
  const statusText = document.querySelector(".toy-status p");

  const colors = ["#ff7700", "#ff00c8", "#91ff00", "#f6ff00", "#a600ff"];
  const anomalyColors = ["#36f7ff", "#ff2bbd", "#f6ff00", "#91ff00", "#ffffff"];
  const signature = "Codex/GPT5.5";
  const signatureCodes = Array.from(signature, (char) => char.charCodeAt(0));
  const splashes = [];
  const pointers = new Map();
  const keyPositions = new Map();
  const motion = {
    angle: null,
    direction: 0,
    charge: 0,
    centerX: 0,
    centerY: 0,
    lastAt: 0,
  };
  const anomaly = {
    active: false,
    centerX: 0,
    centerY: 0,
    startedAt: 0,
    cooldownUntil: 0,
    spin: 1,
    duration: 30000,
  };
  let width = 0;
  let height = 0;
  let dpr = 1;
  let hueIndex = 2;
  let audio = null;
  let soundEnabled = false;
  let lastHaptic = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintBase();
  }

  function paintBase() {
    const gradient = ctx.createLinearGradient(2, 2, width, height);
    gradient.addColorStop(0, "#7c6f1eff");
    gradient.addColorStop(0.48, "#551ea1ff");
    gradient.addColorStop(1, "#085578ff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function makeAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    const context = new AudioContext();
    const gain = context.createGain();
    const delay = context.createDelay(0.45);
    const feedback = context.createGain();
    const filter = context.createBiquadFilter();

    gain.gain.value = 0.72;
    delay.delayTime.value = 0.18;
    feedback.gain.value = 0.28;
    filter.type = "lowpass";
    filter.frequency.value = 1200;

    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(filter);
    filter.connect(context.destination);
    gain.connect(delay);
    gain.connect(context.destination);

    return { context, gain };
  }

  function wrapAngle(angle) {
    let wrapped = angle;
    while (wrapped > Math.PI) wrapped -= Math.PI * 2;
    while (wrapped < -Math.PI) wrapped += Math.PI * 2;
    return wrapped;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  async function toggleSound() {
    if (!audio) audio = makeAudio();
    if (!audio) {
      statusText.textContent = "This browser does not support Web Audio.";
      return;
    }

    if (audio.context.state === "suspended") await audio.context.resume();
    soundEnabled = !soundEnabled;
    soundToggle.setAttribute("aria-pressed", String(soundEnabled));
    soundToggle.textContent = soundEnabled ? "♫" : "♪";
    statusText.textContent = soundEnabled
      ? "Sound is on. Drag faster for brighter tones."
      : "Sound is off. The glow still responds to touch, mouse, and keys.";
  }

  function playTone(x, y, force) {
    if (!soundEnabled || !audio) return;

    const now = audio.context.currentTime;
    const osc = audio.context.createOscillator();
    const gain = audio.context.createGain();
    const pan = audio.context.createStereoPanner ? audio.context.createStereoPanner() : null;
    const note = 120 + (x / Math.max(width, 1)) * 520 + Math.sin(y * 0.012) * 40;

    osc.type = "sine";
    osc.frequency.setValueAtTime(note, now);
    osc.frequency.exponentialRampToValueAtTime(note * 1.8, now + 0.18);
    gain.gain.setValueAtTime(0.6001, now);
    gain.gain.exponentialRampToValueAtTime(Math.min(0.09, 0.018 + force * 0.045), now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.6001, now + 0.34);

    if (pan) {
      pan.pan.value = (x / Math.max(width, 1)) * 2 - 1;
      osc.connect(gain);
      gain.connect(pan);
      pan.connect(audio.gain);
    } else {
      osc.connect(gain);
      gain.connect(audio.gain);
    }

    osc.start(now);
    osc.stop(now + 0.36);
  }

  function playAnomalyTone() {
    if (!soundEnabled || !audio) return;

    const now = audio.context.currentTime;
    [0, 7, 12, 19].forEach((offset, index) => {
      const osc = audio.context.createOscillator();
      const gain = audio.context.createGain();
      const pan = audio.context.createStereoPanner ? audio.context.createStereoPanner() : null;
      const base = 164.81 * 2 ** (offset / 12);

      osc.type = index % 2 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(base, now);
      osc.frequency.exponentialRampToValueAtTime(base * 2.01, now + 0.72);
      gain.gain.setValueAtTime(0.0001, now + index * 0.025);
      gain.gain.exponentialRampToValueAtTime(0.028, now + 0.08 + index * 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      if (pan) {
        pan.pan.value = -0.7 + index * 0.46;
        osc.connect(gain);
        gain.connect(pan);
        pan.connect(audio.gain);
      } else {
        osc.connect(gain);
        gain.connect(audio.gain);
      }

      osc.start(now);
      osc.stop(now + 1.24);
    });
  }

  function vibrate(force) {
    const now = performance.now();
    if (!navigator.vibrate || now - lastHaptic < 90) return;
    lastHaptic = now;
    navigator.vibrate(Math.round(8 + force * 18));
  }

  function addSplash(x, y, force = 0.5, angle = Math.random() * Math.PI * 2, reactive = true) {
    const count = Math.round(5 + force * 12);
    const baseColor = colors[hueIndex % colors.length];
    hueIndex += 1;

    for (let i = 0; i < count; i += 1) {
      const spread = angle + (Math.random() - 0.5) * Math.PI * 5.4;
      const speed = 3.8 + Math.random() * 5.4 + force * 3.2;
      splashes.push({
        x,
        y,
        vx: Math.cos(spread) * speed,
        vy: Math.sin(spread) * speed,
        life: 1,
        decay: 0.008 + Math.random() * 0.018,
        size: 22 + Math.random() * 12 + force * 8,
        color: Math.random() > 0.35 ? baseColor : colors[Math.floor(Math.random() * colors.length)],
      });
    }

    if (reactive) {
      playTone(x, y, force);
      vibrate(force);
    }
  }

  function startAnomaly(x, y, spin) {
    const now = performance.now();
    anomaly.active = true;
    anomaly.centerX = x;
    anomaly.centerY = y;
    anomaly.startedAt = now;
    anomaly.cooldownUntil = now + anomaly.duration + 12000;
    anomaly.spin = spin || 1;
    motion.charge = 0;
    statusText.textContent = "Laminar flow lost. The colors sorted themselves. Codex/GPT5.5 left a trace.";
    playAnomalyTone();

    for (let i = 0; i < 42; i += 1) {
      const angle = (i / 42) * Math.PI * 2;
      const radius = 28 + (i % 7) * 18;
      addSplash(
        x + Math.cos(angle) * radius,
        y + Math.sin(angle) * radius,
        0.62,
        angle + Math.PI / 2,
        false
      );
    }
  }

  function trackAnomaly(point, previous, distance, angle) {
    const now = performance.now();
    if (motion.lastAt) {
      const idleDecay = Math.max(0, now - motion.lastAt - 160) / 720;
      motion.charge = Math.max(0, motion.charge - idleDecay);
    }

    if (anomaly.active || now < anomaly.cooldownUntil) {
      motion.charge = Math.max(0, motion.charge - 0.012);
      motion.angle = angle;
      motion.lastAt = now;
      return;
    }

    const previousAt = previous.t || now - 16;
    const dt = Math.max(12, now - previousAt);
    const speed = distance / dt;
    const turn = motion.angle === null ? 0 : wrapAngle(angle - motion.angle);
    const direction = Math.sign(turn);
    const consistentTurn = direction && (motion.direction === 0 || direction === motion.direction);
    const tightCurve = Math.abs(turn) > 0.16 && Math.abs(turn) < 2.45;
    const fastEnough = speed > 0.72 && distance > 7;

    motion.centerX = motion.centerX ? motion.centerX * 0.82 + point.x * 0.18 : point.x;
    motion.centerY = motion.centerY ? motion.centerY * 0.82 + point.y * 0.18 : point.y;

    if (fastEnough && tightCurve && consistentTurn) {
      motion.charge = Math.min(1, motion.charge + Math.abs(turn) * Math.min(speed, 2.2) * 0.115);
      motion.direction = direction;
    } else {
      motion.charge = Math.max(0, motion.charge - (fastEnough ? 0.035 : 0.075));
      if (motion.charge < 0.18 && direction) motion.direction = direction;
    }

    motion.angle = angle;
    motion.lastAt = now;

    if (motion.charge >= 1) {
      startAnomaly(motion.centerX, motion.centerY, motion.direction || direction || 1);
    }
  }

  function getPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function handlePointerDown(event) {
    canvas.setPointerCapture(event.pointerId);
    const point = getPoint(event);
    const now = performance.now();
    if (motion.lastAt) {
      const idleDecay = Math.max(0, now - motion.lastAt - 160) / 720;
      motion.charge = Math.max(0, motion.charge - idleDecay);
    }
    point.t = now;
    pointers.set(event.pointerId, point);
    motion.angle = null;
    motion.direction = 0;
    motion.centerX = point.x;
    motion.centerY = point.y;
    motion.lastAt = now;
    addSplash(point.x, point.y, 0.9);
  }

  function handlePointerMove(event) {
    const point = getPoint(event);
    const previous = pointers.get(event.pointerId) || point;
    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    const distance = Math.hypot(dx, dy);

    point.t = performance.now();
    pointers.set(event.pointerId, point);
    if (distance > 2) {
      const angle = Math.atan2(dy, dx);
      trackAnomaly(point, previous, distance, angle);
      addSplash(point.x, point.y, Math.min(distance / 55, 1), angle);
    }
  }

  function handlePointerUp(event) {
    const point = getPoint(event);
    pointers.delete(event.pointerId);
    addSplash(point.x, point.y, 0.55);
  }

  function handleKeyDown(event) {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key.toLowerCase() === "m") {
      toggleSound();
      return;
    }

    const code = event.code || event.key;
    const existing = keyPositions.get(code);
    const point =
      existing ||
      {
        x: width * (0.18 + Math.random() * 0.64),
        y: height * (0.2 + Math.random() * 0.58),
      };

    keyPositions.set(code, point);
    addSplash(point.x, point.y, 0.85 + Math.random() * 0.15);
  }

  function handleKeyUp(event) {
    keyPositions.delete(event.code || event.key);
  }

  function drawAnomalySignature(age, pulse) {
    const fadeIn = clamp(age / 3600, 0, 1);
    const fadeOut = clamp((anomaly.duration - age) / 4200, 0, 1);
    const alpha = Math.sin(fadeIn * Math.PI * 0.5) * Math.sin(fadeOut * Math.PI * 0.5);
    const smallestSide = Math.min(width, height);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    signatureCodes.forEach((code, index) => {
      const ringIndex = code % 4;
      const radius = smallestSide * (0.135 + ringIndex * 0.045) + (code % 7) * 2.4;
      const angle =
        anomaly.spin * (pulse * (0.42 + ringIndex * 0.08) + index * 0.53 + code * 0.017);
      const x = anomaly.centerX + Math.cos(angle) * radius;
      const y = anomaly.centerY + Math.sin(angle) * radius;
      const tick = 5 + (code % 5) * 1.5;
      const hue = anomalyColors[(index + ringIndex) % anomalyColors.length];

      ctx.strokeStyle = `${hue}${Math.round((86 + alpha * 116)).toString(16).padStart(2, "0")}`;
      ctx.lineWidth = 1 + (code % 3) * 0.45;
      ctx.beginPath();
      ctx.moveTo(x - Math.sin(angle) * tick, y + Math.cos(angle) * tick);
      ctx.lineTo(x + Math.sin(angle) * tick, y - Math.cos(angle) * tick);
      ctx.stroke();

      if (code % 2 === 0) {
        ctx.fillStyle = `${hue}${Math.round((52 + alpha * 128)).toString(16).padStart(2, "0")}`;
        ctx.beginPath();
        ctx.arc(x, y, 1.6 + (code % 4) * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.globalCompositeOperation = "source-over";
    ctx.textAlign = "center";
    ctx.letterSpacing = "0px";

    if (age < 6200) {
      const lostAlpha = Math.sin(clamp(age / 2100, 0, 1) * Math.PI) * clamp((6200 - age) / 2600, 0, 1);
      ctx.font = "600 12px system-ui, sans-serif";
      ctx.fillStyle = `rgba(246, 247, 251, ${lostAlpha * 0.72})`;
      ctx.fillText("LAMINAR FLOW LOST", anomaly.centerX, Math.max(42, anomaly.centerY - 76));
    }

    const signatureAlpha = clamp((age - 2400) / 3600, 0, 1) * alpha;
    if (signatureAlpha > 0) {
      const y = Math.max(48, Math.min(height - 58, anomaly.centerY - 78));
      ctx.font = "600 13px system-ui, sans-serif";
      ctx.fillStyle = `rgba(246, 247, 251, ${signatureAlpha * 0.8})`;
      ctx.fillText(signature, anomaly.centerX, y);
      ctx.font = "500 10px system-ui, sans-serif";
      ctx.fillStyle = `rgba(54, 247, 255, ${signatureAlpha * 0.42})`;
      ctx.fillText("checksum accepted", anomaly.centerX, y + 16);
    }

    ctx.restore();
  }

  function render() {
    const now = performance.now();
    if (anomaly.active && now - anomaly.startedAt > anomaly.duration) {
      anomaly.active = false;
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = anomaly.active ? "rgba(2, 3, 8, 0.105)" : "rgba(3, 4, 7, 0.16)";
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "lighter";
    for (let i = splashes.length - 1; i >= 0; i -= 1) {
      const drop = splashes[i];
      const anomalyAge = anomaly.active ? (now - anomaly.startedAt) / anomaly.duration : 0;
      const anomalyFade = anomaly.active ? Math.sin(Math.min(1, anomalyAge) * Math.PI) : 0;

      if (anomaly.active) {
        const dx = drop.x - anomaly.centerX;
        const dy = drop.y - anomaly.centerY;
        const distance = Math.max(24, Math.hypot(dx, dy));
        const pull = Math.min(0.38, 80 / distance) * anomalyFade;
        const orbit = Math.min(0.54, 125 / distance) * anomalyFade * anomaly.spin;
        drop.vx += (-dx / distance) * pull + (-dy / distance) * orbit;
        drop.vy += (-dy / distance) * pull + (dx / distance) * orbit;
      }

      drop.x += drop.vx;
      drop.y += drop.vy;
      drop.vx *= anomaly.active ? 0.988 : 0.982;
      drop.vy *= anomaly.active ? 0.988 : 0.982;
      drop.vy += Math.sin((drop.x + drop.y) * 0.006) * 0.012;
      drop.life -= drop.decay;

      if (drop.life <= 0) {
        splashes.splice(i, 1);
        continue;
      }

      const radius = drop.size * drop.life;
      const color = anomaly.active
        ? anomalyColors[
            Math.abs(
              Math.floor(
                (Math.atan2(drop.y - anomaly.centerY, drop.x - anomaly.centerX) / (Math.PI * 2)) *
                  anomalyColors.length *
                  4
              )
            ) % anomalyColors.length
          ]
        : drop.color;
      const glow = ctx.createRadialGradient(drop.x, drop.y, 0, drop.x, drop.y, radius);
      glow.addColorStop(0, color);
      glow.addColorStop(0.32, `${color}69`);
      glow.addColorStop(1, `${color}00`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (anomaly.active) {
      const age = now - anomaly.startedAt;
      const pulse = age * 0.0022;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 5; i += 1) {
        const ring = ((pulse + i * 0.19) % 1) * Math.min(width, height) * 0.62;
        ctx.strokeStyle = `rgba(${70 + i * 32}, ${247 - i * 24}, 255, ${0.2 - i * 0.022})`;
        ctx.beginPath();
        ctx.arc(anomaly.centerX, anomaly.centerY, ring, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
      drawAnomalySignature(age, pulse);
    }

    requestAnimationFrame(render);
  }

  soundToggle.addEventListener("click", toggleSound);
  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerUp);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("resize", resize);

  resize();
  for (let i = 0; i < 18; i += 1) {
    addSplash(width * Math.random(), height * Math.random(), Math.random() * 0.7, undefined, false);
  }
  render();
})();
