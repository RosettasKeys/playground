(() => {
  const canvas = document.querySelector(".fluid-canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const soundToggle = document.querySelector(".sound-toggle");
  const statusText = document.querySelector(".toy-status p");

  const colors = ["#36f7ff", "#ff4fd8", "#b8ff5d", "#ffd166", "#8f7bff"];
  const splashes = [];
  const pointers = new Map();
  const keyPositions = new Map();
  let width = 0;
  let height = 0;
  let dpr = 1;
  let hueIndex = 0;
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
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#030407");
    gradient.addColorStop(0.48, "#11071f");
    gradient.addColorStop(1, "#04131a");
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
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.min(0.09, 0.018 + force * 0.045), now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

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
      const spread = angle + (Math.random() - 0.5) * Math.PI * 1.4;
      const speed = 0.8 + Math.random() * 5.4 + force * 3.2;
      splashes.push({
        x,
        y,
        vx: Math.cos(spread) * speed,
        vy: Math.sin(spread) * speed,
        life: 1,
        decay: 0.008 + Math.random() * 0.018,
        size: 12 + Math.random() * 42 + force * 28,
        color: Math.random() > 0.35 ? baseColor : colors[Math.floor(Math.random() * colors.length)],
      });
    }

    if (reactive) {
      playTone(x, y, force);
      vibrate(force);
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
    pointers.set(event.pointerId, point);
    addSplash(point.x, point.y, 0.9);
  }

  function handlePointerMove(event) {
    const point = getPoint(event);
    const previous = pointers.get(event.pointerId) || point;
    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    const distance = Math.hypot(dx, dy);

    pointers.set(event.pointerId, point);
    if (distance > 2) {
      addSplash(point.x, point.y, Math.min(distance / 55, 1), Math.atan2(dy, dx));
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

  function render() {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(3, 4, 7, 0.16)";
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "lighter";
    for (let i = splashes.length - 1; i >= 0; i -= 1) {
      const drop = splashes[i];
      drop.x += drop.vx;
      drop.y += drop.vy;
      drop.vx *= 0.982;
      drop.vy *= 0.982;
      drop.vy += Math.sin((drop.x + drop.y) * 0.006) * 0.012;
      drop.life -= drop.decay;

      if (drop.life <= 0) {
        splashes.splice(i, 1);
        continue;
      }

      const radius = drop.size * drop.life;
      const glow = ctx.createRadialGradient(drop.x, drop.y, 0, drop.x, drop.y, radius);
      glow.addColorStop(0, drop.color);
      glow.addColorStop(0.32, `${drop.color}99`);
      glow.addColorStop(1, `${drop.color}00`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, radius, 0, Math.PI * 2);
      ctx.fill();
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
