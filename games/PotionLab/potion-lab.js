(function () {
  'use strict';

  var C = window.PotionColor;
  var R = window.PotionRounds;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(id) { return document.getElementById(id); }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function lerp(a, b, amount) { return a + (b - a) * amount; }
  function rgba(rgb, alpha) { return 'rgba(' + Math.round(rgb.r) + ',' + Math.round(rgb.g) + ',' + Math.round(rgb.b) + ',' + alpha + ')'; }
  function formatTime(seconds) {
    seconds = Math.max(0, Math.ceil(seconds));
    return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }

  var els = {
    canvas: $('potion-canvas'), frame: $('playfield-frame'), targetSwatch: $('target-swatch'), targetName: $('target-name'),
    targetDescription: $('target-description'), currentSwatch: $('current-swatch'), currentName: $('current-name'),
    currentDescription: $('current-description'), gradeOrb: $('grade-orb'), gradeLetter: $('grade-letter'), similarityText: $('similarity-text'),
    similarityMeter: $('similarity-meter'), similarityFill: $('similarity-fill'), thresholdMark: $('threshold-mark'), clearRequirement: $('clear-requirement'),
    roundId: $('round-id'), stageMessage: $('stage-message'), statusLamp: $('status-lamp'), queue: $('ingredient-queue'), dropsLeft: $('drops-left'),
    timerLabel: $('timer-label'), timer: $('timer-readout'), undoCount: $('undo-count'), levelLabel: $('level-label'), levelReadout: $('level-readout'),
    undo: $('undo-button'), submit: $('submit-button'), restart: $('restart-button'), sound: $('sound-button'), records: $('records-button'),
    fieldLog: $('field-log'), onboarding: $('onboarding'), onboardingDismiss: $('onboarding-dismiss'), result: $('result-dialog'),
    resultKicker: $('result-kicker'), resultGrade: $('result-grade'), resultTitle: $('result-title'), resultSummary: $('result-summary'),
    resultAccuracy: $('result-accuracy'), resultTime: $('result-time'), resultEfficiency: $('result-efficiency'), resultClose: $('result-close'),
    resultNext: $('result-next'), recordsDialog: $('records-dialog'), recordsClose: $('records-close'), recordsGrid: $('records-grid'),
    salamander: $('salamander-egg'), salamanderCaption: $('salamander-caption')
  };

  var ctx = els.canvas.getContext('2d', { alpha: false });
  var STORAGE_KEY = 'misfire:potion-lab:v1';
  var DEFAULT_STORE = {
    settings: { soundOn: true, onboarded: false, lastMode: 'classic', lastDifficulty: 'easy' },
    stats: { potions: 0, successful: 0, ingredients: 0, wasted: 0, perfect: 0, best: {}, fastest: {}, efficiency: {} },
    ladder: { easy: 1, medium: 1, hard: 1 }
  };

  function loadStore() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {};
      return {
        settings: Object.assign({}, DEFAULT_STORE.settings, parsed.settings || {}),
        stats: Object.assign({}, DEFAULT_STORE.stats, parsed.stats || {}),
        ladder: Object.assign({}, DEFAULT_STORE.ladder, parsed.ladder || {})
      };
    } catch (_) {
      return JSON.parse(JSON.stringify(DEFAULT_STORE));
    }
  }

  var store = loadStore();
  function saveStore() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch (_) { }
  }

  var state = {
    mode: store.settings.lastMode, difficulty: store.settings.lastDifficulty,
    ladderLevel: store.ladder[store.settings.lastDifficulty] || 1, round: null, queueIndex: 0,
    components: [], mixtureRgb: null, displayRgb: { r: 55, g: 48, b: 63 }, similarity: 0,
    bodies: [], particles: [], heldX: 0, dragging: false, resolving: false,
    snapshots: [], undoUsed: 0, mixed: 0, wasted: 0, elapsed: 0,
    running: false, finalized: false, liquidPulse: 0, rimPulse: 0, lastFrame: performance.now(),
    soundOn: store.settings.soundOn, timerStarted: false, roundToken: 0, width: 0, height: 0, dpr: 1, pot: null,
    egg: { progress: 0, lastAngle: null, gestureActive: false, cancelDrop: false, revealed: false, watchDrops: 0, helped: false, visualY: 62 }
  };

  var LOGS = {
    start: ['Vessel rinsed. Expectations lowered.', 'Chromatic liability waiver misplaced. Proceed.', 'The cauldron denies being calibrated.', 'Target issued by a committee with no eyes.'],
    mix: ['Ingredient accepted. The potion has opinions.', 'Successful plop. Legal classification pending.', 'Color incorporated without a permit.', 'The vessel made that noise on purpose.', 'Mixture updated. Nobody alert the guild.'],
    miss: ['Ingredient escaped into the grievance gutter.', 'Rim impact. The pebble has chosen unemployment.', 'A clean miss, according to nobody.', 'Ingredient wasted with impressive physical clarity.', 'The floor is now technically a potion.'],
    empty: ['The empty vessel is not a submission.', 'Please invent at least one color first.', 'Water has retained legal counsel.']
  };

  var VERDICTS = {
    'S+': [
      'The potion council is uncomfortable with your competence.',
      'This color has been promoted above the wizard who requested it.',
      'Perfect. The cauldron would like to list you as a dependent.',
      'A chromatic event of worrying administrative significance.',
      'The guild has sealed your file and opened a smaller, more nervous file.'
    ],
    'S': [
      'Alarmingly exact potion behavior.',
      'The target has filed a resemblance complaint.',
      'Senior wizardry, performed without senior supervision.',
      'The instrument insists this was not an accident.',
      'This hue may now legally testify as the target.'
    ],
    'A+': [
      'Suspiciously legitimate wizardry.',
      'The potion passes every test we remembered to invent.',
      'Excellent color malpractice.',
      'The council nodded once. This is their standing ovation.',
      'A highly employable shade of rule-breaking.'
    ],
    'A': [
      'Accredited enough for government cauldron work.',
      'A strong potion with only trace bureaucracy.',
      'The target squints and recognizes a close relative.',
      'Respectable chromatic misconduct.',
      'Filed under: somehow correct.'
    ],
    'B': [
      'Good potion. Questionable chain of custody.',
      'Close enough to fool a wizard at dusk.',
      'Competent color with exciting legal ambiguity.',
      'The vessel gives this a cautious little bubble.',
      'Approved for non-load-bearing enchantment.'
    ],
    'C': [
      'Technically a color.',
      'The potion has met the target socially.',
      'Chromatically adjacent. Bureaucratically alive.',
      'A defensible liquid under poor lighting.',
      'The hue committee has requested more committee.'
    ],
    'D': [
      'The target denies knowing this potion.',
      'A brave new color with no useful paperwork.',
      'The cauldron has begun distancing itself.',
      'Color occurred. Precision did not.',
      'This could still enchant a very forgiving turnip.'
    ],
    'F': [
      'You have invented municipal sludge.',
      'The potion council has left through a window.',
      'This color is now a controlled drainage event.',
      'The target was elsewhere during the incident.',
      'An ambitious failure with excellent mouthfeel.'
    ]
  };

  var audio = { context: null, master: null };

  function ensureAudio() {
    if (!state.soundOn) return null;
    if (!audio.context) {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      try {
        audio.context = new AudioContext();
        audio.master = audio.context.createGain();
        audio.master.gain.value = .13;
        audio.master.connect(audio.context.destination);
      } catch (_) { return null; }
    }
    if (audio.context.state === 'suspended') audio.context.resume().catch(function () { });
    return audio.context;
  }

  function tone(frequency, duration, type, gain, delay, endFrequency) {
    var context = ensureAudio();
    if (!context || !audio.master) return;
    var start = context.currentTime + (delay || 0);
    var oscillator = context.createOscillator();
    var envelope = context.createGain();
    oscillator.type = type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain || .3, start + .012);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(envelope); envelope.connect(audio.master);
    oscillator.start(start); oscillator.stop(start + duration + .03);
  }

  function sound(kind) {
    if (!state.soundOn) return;
    if (kind === 'drop') tone(280, .07, 'triangle', .18, 0, 210);
    if (kind === 'select') { tone(510, .08, 'triangle', .13, 0, 640); tone(760, .07, 'sine', .08, .045, 825); }
    if (kind === 'plop') { tone(150, .17, 'sine', .5, 0, 72); tone(92, .2, 'triangle', .22, .035, 58); }
    if (kind === 'swish') { tone(190, .34, 'sine', .12, .04, 330); tone(315, .28, 'triangle', .07, .11, 205); }
    if (kind === 'rim') { tone(420, .1, 'square', .17, 0, 235); tone(760, .07, 'triangle', .08, .018, 480); }
    if (kind === 'undo') { tone(260, .12, 'sine', .2, 0, 410); tone(390, .12, 'sine', .16, .08, 620); }
    if (kind === 'sparkle') [660, 825, 990].forEach(function (note, index) { tone(note, .18, 'sine', .16, index * .055, note * 1.03); });
    if (kind === 'success') [392, 523.25, 659.25, 783.99].forEach(function (note, index) { tone(note, .36, 'triangle', .24, index * .075, note * 1.01); });
    if (kind === 'fail') { tone(175, .28, 'sawtooth', .18, 0, 70); tone(110, .34, 'square', .09, .1, 54); }
  }

  function say(group) {
    var lines = LOGS[group] || [group];
    els.fieldLog.textContent = lines[Math.floor(Math.random() * lines.length)];
  }

  function setActiveButtons(containerId, dataKey, value) {
    document.querySelectorAll('#' + containerId + ' [data-' + dataKey + ']').forEach(function (button) {
      var active = button.getAttribute('data-' + dataKey) === value;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function startRound() {
    if (els.result.open) els.result.close();
    state.roundToken += 1;
    if (state.mode === 'ladder') state.ladderLevel = store.ladder[state.difficulty] || 1;
    state.round = R.makeRound({ mode: state.mode, difficulty: state.difficulty, level: state.ladderLevel });
    if (state.width) resizeCanvas();
    state.queueIndex = 0;
    state.components = [];
    state.mixtureRgb = null;
    state.displayRgb = { r: 55, g: 48, b: 63 };
    state.similarity = 0;
    state.bodies = [];
    state.particles = [];
    state.resolving = false;
    state.snapshots = [];
    state.undoUsed = 0;
    state.mixed = 0;
    state.wasted = 0;
    state.elapsed = 0;
    state.timerStarted = false;
    state.running = true;
    state.finalized = false;
    state.liquidPulse = 0;
    state.rimPulse = 0;
    state.heldX = state.width ? state.width / 2 : 300;
    state.egg.progress = 0;
    state.egg.lastAngle = null;
    state.egg.gestureActive = false;
    state.egg.cancelDrop = false;
    state.egg.watchDrops = 0;
    state.egg.helped = false;
    state.egg.visualY = 62;
    els.stageMessage.textContent = 'Choose an ingredient · drag to aim · release to drop';
    syncSalamander();
    store.settings.lastMode = state.mode;
    store.settings.lastDifficulty = state.difficulty;
    saveStore();
    say('start');
    updateHud();
  }

  function resizeCanvas() {
    var rect = els.canvas.getBoundingClientRect();
    var previousWidth = state.width;
    var previousHeight = state.height;
    state.width = Math.max(280, rect.width);
    state.height = Math.max(360, rect.height);
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    els.canvas.width = Math.round(state.width * state.dpr);
    els.canvas.height = Math.round(state.height * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    var inner = clamp(state.width * (state.mode === 'speed' ? .56 : .48), 178, state.mode === 'speed' ? 430 : 390);
    state.pot = { cx: state.width / 2, rimY: state.height * .64, innerWidth: inner, outerWidth: inner + 66, bottomY: state.height * .94 };
    if (previousWidth && previousHeight && (previousWidth !== state.width || previousHeight !== state.height)) {
      var scaleX = state.width / previousWidth;
      var scaleY = state.height / previousHeight;
      state.bodies.forEach(function (body) { body.x *= scaleX; body.y *= scaleY; });
      state.particles.forEach(function (particle) { particle.x *= scaleX; particle.y *= scaleY; });
      state.heldX *= scaleX;
    }
    state.heldX = clamp(state.heldX || state.width / 2, 30, state.width - 30);
    positionSalamander();
  }

  function currentSource() {
    if (!state.round || state.queueIndex >= state.round.queue.length) return null;
    return state.round.sources[state.round.queue[state.queueIndex]];
  }

  function availableChoices() {
    if (!state.round) return [];
    var choices = [];
    var seenSources = {};
    var position;
    for (position = state.queueIndex; position < state.round.queue.length && choices.length < 3; position += 1) {
      var sourceIndex = state.round.queue[position];
      if (!seenSources[sourceIndex]) {
        seenSources[sourceIndex] = true;
        choices.push(position);
      }
    }
    // Near the end of a round fewer than three distinct pigments may remain.
    // Keep every remaining drop reachable without pretending duplicates differ.
    for (position = state.queueIndex; position < state.round.queue.length && choices.length < 3; position += 1) {
      if (choices.indexOf(position) === -1) choices.push(position);
    }
    return choices;
  }

  function selectIngredient(queuePosition) {
    if (!state.running || state.finalized || state.resolving || queuePosition < state.queueIndex || queuePosition >= state.round.queue.length) return;
    var currentPosition = state.queueIndex;
    if (queuePosition !== currentPosition) {
      var selected = state.round.queue[queuePosition];
      state.round.queue[queuePosition] = state.round.queue[currentPosition];
      state.round.queue[currentPosition] = selected;
      sound('select');
    }
    var source = currentSource();
    els.stageMessage.textContent = source.name + ' selected · drag to aim';
    updateQueue();
  }

  function updateQueue() {
    els.queue.textContent = '';
    if (!state.round) return;
    var choices = availableChoices();
    choices.forEach(function (queuePosition) {
      var source = state.round.sources[state.round.queue[queuePosition]];
      var selected = queuePosition === state.queueIndex;
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'queue-item' + (selected ? ' is-current' : '');
      item.dataset.queuePosition = String(queuePosition);
      item.disabled = state.resolving || state.finalized;
      item.setAttribute('aria-pressed', String(selected));
      item.setAttribute('aria-label', (selected ? 'Selected ingredient: ' : 'Choose ingredient: ') + source.name + ', ' + source.description);
      var pebble = document.createElement('span');
      pebble.className = 'queue-pebble';
      pebble.setAttribute('aria-hidden', 'true');
      pebble.style.backgroundColor = source.hex;
      var name = document.createElement('small');
      name.textContent = source.name;
      item.title = source.name + ' · ' + source.description;
      item.appendChild(pebble); item.appendChild(name);
      item.addEventListener('click', function () { selectIngredient(Number(item.dataset.queuePosition)); });
      els.queue.appendChild(item);
    });
  }

  function updateMixture() {
    state.mixtureRgb = C.mixPigments(state.components.map(function (source) { return { color: source.rgb, weight: source.weight || 1 }; }));
    state.similarity = state.mixtureRgb ? C.similarity(state.mixtureRgb, state.round.target.rgb) : 0;
  }

  function updateHud() {
    if (!state.round) return;
    var rules = state.round.rules;
    els.roundId.textContent = state.round.filing;
    els.targetSwatch.style.backgroundColor = state.round.target.hex;
    els.targetSwatch.style.boxShadow = '0 0 0 1px rgba(216,168,75,.34), 0 0 24px ' + rgba(state.round.target.rgb, .28) + ', inset 0 -12px 18px rgba(0,0,0,.25)';
    els.targetName.textContent = state.round.target.name;
    els.targetDescription.textContent = state.round.target.description;
    if (state.mixtureRgb) {
      var desc = C.describe(state.mixtureRgb);
      els.currentSwatch.classList.remove('is-empty');
      els.currentSwatch.style.backgroundColor = C.rgbToHex(state.mixtureRgb);
      els.currentName.textContent = (desc.hsl.s < 22 ? 'Bureaucratic ' : 'Developing ') + desc.hue.charAt(0).toUpperCase() + desc.hue.slice(1);
      els.currentDescription.textContent = desc.text + ' · ' + state.components.length + ' ingredient' + (state.components.length === 1 ? '' : 's');
    } else {
      els.currentSwatch.classList.add('is-empty');
      els.currentSwatch.style.backgroundColor = '';
      els.currentName.textContent = 'Uncommitted Water';
      els.currentDescription.textContent = 'empty vessel · add an ingredient';
    }
    var grade = state.mixtureRgb ? R.gradeFor(state.similarity) : '—';
    els.gradeLetter.textContent = grade;
    els.gradeOrb.setAttribute('aria-label', 'Current grade: ' + (grade === '—' ? 'not graded' : grade));
    els.similarityText.textContent = state.similarity + '% similarity';
    els.similarityFill.style.width = state.similarity + '%';
    els.similarityMeter.setAttribute('aria-valuenow', String(state.similarity));
    els.thresholdMark.style.left = rules.threshold + '%';
    els.clearRequirement.textContent = rules.clearGrade + ' · ' + rules.threshold + '% required';
    els.dropsLeft.textContent = String(state.round.queue.length - state.queueIndex);
    els.undoCount.textContent = rules.undo === Infinity ? '∞' : String(Math.max(0, rules.undo - state.undoUsed));
    els.undo.disabled = !state.snapshots.length || rules.undo === 0 || (rules.undo !== Infinity && state.undoUsed >= rules.undo) || state.resolving;
    els.submit.disabled = !state.components.length || state.resolving || state.finalized;
    els.timerLabel.textContent = state.mode === 'speed' ? 'Remaining' : 'Elapsed';
    els.timer.textContent = formatTime(state.mode === 'speed' ? rules.time - state.elapsed : state.elapsed);
    els.levelLabel.textContent = state.mode === 'ladder' ? 'Rung' : 'Recipe';
    els.levelReadout.textContent = state.mode === 'ladder' ? String(state.ladderLevel).padStart(2, '0') : 'hidden';
    updateQueue();
  }

  function aimAt(clientX, clientY) {
    var rect = els.canvas.getBoundingClientRect();
    state.heldX = clamp(clientX - rect.left, 25, state.width - 25);
    if (clientY != null) {
      state.egg.visualY = clamp(clientY - rect.top, 28, state.height - 22);
      trackEggGesture(state.heldX, state.egg.visualY);
    }
  }

  function positionSalamander() {
    if (!state.pot || !els.salamander) return;
    els.salamander.style.left = (state.pot.cx + state.pot.innerWidth * .34) + 'px';
    els.salamander.style.top = Math.max(92, state.pot.rimY - clamp(state.width * .12, 68, 92)) + 'px';
  }

  function syncSalamander() {
    if (!els.salamander) return;
    els.salamander.classList.toggle('is-awake', state.egg.revealed);
    els.salamander.classList.toggle('is-helping', state.egg.helped);
    els.salamander.setAttribute('aria-hidden', String(!state.egg.revealed));
    els.salamander.style.setProperty('--salamander-heat', String(clamp(state.egg.watchDrops / 3, 0, 1)));
    if (state.egg.revealed) {
      els.salamanderCaption.textContent = state.egg.helped ? 'HELPED.' : (state.egg.watchDrops ? 'OBSERVING MORE INTENSELY.' : 'OBSERVING.');
    }
  }

  function revealSalamander() {
    if (state.egg.revealed) return;
    state.egg.revealed = true;
    state.egg.cancelDrop = true;
    state.egg.progress = 0;
    state.egg.lastAngle = null;
    state.egg.gestureActive = false;
    els.stageMessage.textContent = 'Unscheduled observer detected · ingredient retained';
    els.fieldLog.textContent = 'A small fire-code violation has joined the review panel.';
    emit(state.pot.cx + state.pot.innerWidth * .35, state.pot.rimY - 28, { r: 252, g: 199, b: 50 }, 24, 'sparkle');
    sound('sparkle');
    syncSalamander();
    console.info('[OPENAI GPT-5.6 SOL · CODEX] The salamander has entered the potion audit.');
  }

  function resetEggGesture() {
    state.egg.progress = 0;
    state.egg.lastAngle = null;
    state.egg.gestureActive = false;
    state.egg.visualY = 62;
  }

  function trackEggGesture(x, y) {
    if (!state.dragging || state.resolving || state.egg.revealed || !state.pot) return;
    var dx = x - state.pot.cx;
    var dy = y - state.pot.rimY;
    var radius = Math.hypot(dx, dy);
    var insideStirringBand = radius > state.pot.innerWidth * .31 && radius < state.pot.outerWidth * .78;
    if (!insideStirringBand) {
      state.egg.lastAngle = null;
      state.egg.gestureActive = state.egg.progress > Math.PI * .35;
      return;
    }
    var angle = Math.atan2(dy, dx);
    if (state.egg.lastAngle != null) {
      var delta = angle - state.egg.lastAngle;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      if (delta < 0) state.egg.progress += -delta;
      else state.egg.progress = Math.max(0, state.egg.progress - delta * 1.8);
    }
    state.egg.lastAngle = angle;
    state.egg.gestureActive = state.egg.progress > Math.PI * .35;
    if (state.egg.progress >= Math.PI * 6) revealSalamander();
  }

  function scheduleSpeedQualification() {
    if (state.mode !== 'speed' || state.similarity < state.round.rules.threshold) return;
    var token = state.roundToken;
    window.setTimeout(function () {
      if (token === state.roundToken && state.running && !state.resolving && state.similarity >= state.round.rules.threshold) finalizeRound('qualified');
    }, reduceMotion ? 80 : 520);
  }

  function noteSalamanderInteraction() {
    if (!state.egg.revealed || state.egg.helped) return;
    state.egg.watchDrops += 1;
    syncSalamander();
    if (state.egg.watchDrops < 3) return;
    state.egg.helped = true;
    state.components.push({
      rgb: { r: 255, g: 184, b: 35 }, hex: '#ffb823', weight: .45,
      name: 'Unrequested Salamander Ember', description: 'bright · vivid · amber', magical: true
    });
    updateMixture();
    state.liquidPulse = 1;
    emit(state.pot.cx + state.pot.innerWidth * .34, state.pot.rimY - 22, { r: 255, g: 184, b: 35 }, 16, 'sparkle');
    emit(state.pot.cx, state.pot.rimY, { r: 255, g: 184, b: 35 }, 22, 'splash');
    els.stageMessage.textContent = 'Recipe amended by unauthorized salamander';
    els.fieldLog.textContent = 'The salamander contributed one ember-color dose and has declined to explain itself.';
    sound('sparkle');
    sound('swish');
    syncSalamander();
    scheduleSpeedQualification();
  }

  function snapshot() {
    return {
      queueIndex: state.queueIndex,
      components: state.components.slice(),
      mixtureRgb: state.mixtureRgb ? Object.assign({}, state.mixtureRgb) : null,
      similarity: state.similarity,
      mixed: state.mixed,
      wasted: state.wasted,
      elapsed: state.elapsed,
      queue: state.round.queue.slice(),
      egg: { watchDrops: state.egg.watchDrops, helped: state.egg.helped },
      bodies: state.bodies.filter(function (body) { return body.state === 'waste'; }).map(function (body) { return Object.assign({}, body); })
    };
  }

  function dropIngredient() {
    if (!state.running || state.finalized || state.resolving) return;
    var source = currentSource();
    if (!source) return;
    ensureAudio();
    sound('drop');
    if (!state.timerStarted) {
      state.timerStarted = true;
    }
    state.snapshots.push(snapshot());
    state.resolving = true;
    state.queueIndex += 1;
    state.bodies.push({
      source: source, x: state.heldX, y: 62, vx: (Math.random() - .5) * 18, vy: 34,
      r: clamp(state.width * .025, 13, 18), angle: Math.random() * Math.PI, spin: (Math.random() - .5) * 4,
      bounces: 0, state: 'falling', age: 0, resolveAt: 0
    });
    els.canvas.classList.add('is-dropping');
    els.stageMessage.textContent = 'Ingredient in transit · liability active';
    updateHud();
  }

  function emit(x, y, rgb, count, kind) {
    count = reduceMotion ? Math.min(4, count) : count;
    var cap = reduceMotion ? 14 : ((navigator.hardwareConcurrency || 4) <= 4 ? 42 : 72);
    for (var i = 0; i < count && state.particles.length < cap; i += 1) {
      var angle = kind === 'splash' ? Math.PI + Math.random() * Math.PI : Math.random() * Math.PI * 2;
      var speed = 35 + Math.random() * (kind === 'splash' ? 150 : 85);
      state.particles.push({ x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - (kind === 'splash' ? 35 : 0),
        life: .45 + Math.random() * .45, maxLife: .9, size: 1.5 + Math.random() * 3.5, rgb: rgb, kind: kind });
    }
  }

  function resolveMix(body) {
    if (body.state !== 'falling') return;
    body.state = 'mixed';
    state.components.push(body.source);
    state.mixed += 1;
    updateMixture();
    state.liquidPulse = 1;
    emit(body.x, state.pot.rimY + 4, body.source.rgb, 18, 'splash');
    sound('plop');
    sound('swish');
    if (state.similarity >= 91) {
      emit(state.pot.cx, state.pot.rimY, state.mixtureRgb, state.similarity >= 96 ? 38 : 24, 'sparkle');
      sound('sparkle');
      els.frame.classList.remove('is-perfect');
      void els.frame.offsetWidth;
      els.frame.classList.add('is-perfect');
    }
    state.bodies = state.bodies.filter(function (candidate) { return candidate !== body; });
    state.resolving = false;
    els.canvas.classList.remove('is-dropping');
    els.stageMessage.textContent = 'Mixture accepted · aim next ingredient';
    say('mix');
    noteSalamanderInteraction();
    updateHud();
    scheduleSpeedQualification();
    checkRoundExhausted();
  }

  function resolveWaste(body) {
    if (body.state === 'waste') return;
    body.state = 'waste';
    body.resolveAt = body.age;
    body.vy = 0; body.vx = 0;
    state.wasted += 1;
    state.rimPulse = 1;
    emit(body.x, body.y, body.source.rgb, 8, 'waste');
    state.resolving = false;
    els.canvas.classList.remove('is-dropping');
    els.stageMessage.textContent = 'Ingredient wasted · failure was visible';
    els.statusLamp.classList.remove('is-alert');
    void els.statusLamp.offsetWidth;
    els.statusLamp.classList.add('is-alert');
    say('miss');
    noteSalamanderInteraction();
    updateHud();
    checkRoundExhausted();
  }

  function checkRoundExhausted() {
    if (state.queueIndex >= state.round.queue.length && !state.resolving) {
      var token = state.roundToken;
      window.setTimeout(function () {
        if (token === state.roundToken && state.queueIndex >= state.round.queue.length && !state.resolving) finalizeRound('drops');
      }, reduceMotion ? 80 : 650);
    }
  }

  function updatePhysics(dt) {
    var pot = state.pot;
    state.bodies.forEach(function (body) {
      body.age += dt;
      if (body.state === 'waste') return;
      body.vy += 1120 * dt;
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      body.angle += body.spin * dt;

      var obstruction = state.bodies.find(function (other) {
        if (other === body || other.state !== 'waste') return false;
        var horizontal = Math.abs(body.x - other.x);
        return horizontal < (body.r + other.r) * .82 && body.y + body.r >= other.y - other.r && body.y < other.y && body.vy > 0;
      });
      if (obstruction) {
        body.y = obstruction.y - obstruction.r - body.r;
        body.vy *= -.32;
        body.vx += (body.x <= obstruction.x ? -1 : 1) * (70 + Math.random() * 80);
        body.spin += (Math.random() - .5) * 5;
        body.bounces += 1;
        sound('rim');
      }

      var opening = pot.innerWidth / 2 - body.r * .35;
      var rimDistance = Math.abs(body.x - pot.cx);
      var atRim = body.y + body.r >= pot.rimY - 7 && body.y < pot.rimY + 18 && body.vy > 0;
      if (atRim && Math.abs(body.x - pot.cx) < opening) {
        resolveMix(body);
        return;
      }
      if (atRim && rimDistance < pot.outerWidth / 2 + body.r) {
        body.y = pot.rimY - body.r - 8;
        body.vy *= -.48;
        body.vx += (body.x < pot.cx ? -1 : 1) * (125 + Math.random() * 120);
        body.spin += (Math.random() - .5) * 7;
        body.bounces += 1;
        sound('rim');
        state.rimPulse = 1;
        emit(body.x, body.y + body.r, body.source.rgb, 5, 'waste');
      }
      if (body.x < -body.r * 2 || body.x > state.width + body.r * 2) {
        resolveWaste(body);
        return;
      }
      var floor = state.height - 24;
      if (body.y + body.r >= floor) {
        body.y = floor - body.r;
        if (body.bounces > 0 || Math.abs(body.vy) < 120) resolveWaste(body);
        else { body.vy *= -.25; body.vx *= .72; body.bounces += 1; }
      }
    });
    state.bodies = state.bodies.filter(function (body) { return body.state !== 'waste' || body.age - body.resolveAt < 4.2; });

    state.particles.forEach(function (particle) {
      particle.life -= dt;
      particle.vy += (particle.kind === 'splash' ? 310 : 90) * dt;
      particle.x += particle.vx * dt; particle.y += particle.vy * dt;
      particle.vx *= .985;
    });
    state.particles = state.particles.filter(function (particle) { return particle.life > 0; });
    state.liquidPulse = Math.max(0, state.liquidPulse - dt * 2.3);
    state.rimPulse = Math.max(0, state.rimPulse - dt * 3.2);
    if (state.mixtureRgb) {
      var follow = reduceMotion ? 1 : 1 - Math.pow(.002, dt);
      state.displayRgb.r = lerp(state.displayRgb.r, state.mixtureRgb.r, follow);
      state.displayRgb.g = lerp(state.displayRgb.g, state.mixtureRgb.g, follow);
      state.displayRgb.b = lerp(state.displayRgb.b, state.mixtureRgb.b, follow);
    }
  }

  function roundRect(context, x, y, width, height, radius) {
    radius = Math.min(radius, width / 2, height / 2);
    context.beginPath(); context.moveTo(x + radius, y); context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius); context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius); context.closePath();
  }

  function drawPebble(body, alpha) {
    ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.translate(body.x, body.y); ctx.rotate(body.angle || 0);
    var gradient = ctx.createRadialGradient(-body.r * .35, -body.r * .45, 1, 0, 0, body.r);
    gradient.addColorStop(0, 'rgba(255,255,255,.62)'); gradient.addColorStop(.18, body.source.hex); gradient.addColorStop(1, rgba(body.source.rgb, .48));
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.ellipse(0, 0, body.r, body.r * .9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.23)'; ctx.lineWidth = 1; ctx.stroke();
    if (body.state === 'waste') { ctx.strokeStyle = rgba(body.source.rgb, .45); ctx.lineWidth = 3; ctx.stroke(); }
    ctx.restore();
  }

  function drawScene(now) {
    var w = state.width, h = state.height, pot = state.pot;
    ctx.fillStyle = '#090812'; ctx.fillRect(0, 0, w, h);
    var glow = ctx.createRadialGradient(pot.cx, pot.rimY, 20, pot.cx, pot.rimY, pot.outerWidth * .85);
    glow.addColorStop(0, state.mixtureRgb ? rgba(state.displayRgb, .2 + state.liquidPulse * .15) : 'rgba(168,117,255,.09)');
    glow.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(216,168,75,.09)'; ctx.lineWidth = 1;
    for (var x = 24; x < w; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (var y = 36; y < h; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    ctx.fillStyle = 'rgba(255,82,102,.08)'; ctx.fillRect(0, pot.rimY + 44, Math.max(0, pot.cx - pot.outerWidth / 2 - 18), h);
    ctx.fillRect(pot.cx + pot.outerWidth / 2 + 18, pot.rimY + 44, Math.max(0, w - (pot.cx + pot.outerWidth / 2 + 18)), h);
    ctx.fillStyle = 'rgba(255,82,102,.48)'; ctx.font = '9px Courier New'; ctx.textAlign = 'center';
    if (w > 440) { ctx.fillText('DISCARD GUTTER', 62, h - 10); ctx.fillText('DISCARD GUTTER', w - 62, h - 10); }

    // Cauldron back, liquid, then bodies and the foreground shell.
    ctx.fillStyle = '#24202a'; ctx.beginPath(); ctx.ellipse(pot.cx, pot.rimY + 5, pot.outerWidth / 2, 34, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = state.rimPulse ? 'rgba(255,82,102,.9)' : 'rgba(216,168,75,.58)'; ctx.lineWidth = 4 + state.rimPulse * 3; ctx.stroke();
    var liquidRgb = state.mixtureRgb ? state.displayRgb : { r: 72, g: 57, b: 88 };
    var liquid = ctx.createLinearGradient(0, pot.rimY - 22, 0, pot.rimY + 26);
    liquid.addColorStop(0, rgba(liquidRgb, .98)); liquid.addColorStop(1, rgba(liquidRgb, .63));
    ctx.fillStyle = liquid; ctx.beginPath();
    var wobble = reduceMotion ? 0 : Math.sin(now * .004) * (2 + state.liquidPulse * 4);
    ctx.ellipse(pot.cx, pot.rimY + 3 + wobble * .18, pot.innerWidth / 2, 22 + state.liquidPulse * 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.24)'; ctx.lineWidth = 1.5; ctx.stroke();
    if (state.mixtureRgb) {
      for (var bubbleIndex = 0; bubbleIndex < 5; bubbleIndex += 1) {
        var phase = now * .0012 + bubbleIndex * 1.73;
        var bubbleX = pot.cx + Math.sin(phase * (1.1 + bubbleIndex * .07)) * pot.innerWidth * (.08 + bubbleIndex * .035);
        var bubbleY = pot.rimY + Math.cos(phase * 1.4) * 7;
        ctx.strokeStyle = 'rgba(255,255,255,' + (.11 + state.liquidPulse * .12) + ')';
        ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bubbleX, bubbleY, 2 + (bubbleIndex % 3), 0, Math.PI * 2); ctx.stroke();
      }
    }

    state.bodies.forEach(function (body) { drawPebble(body, body.state === 'waste' ? clamp(1 - (body.age - body.resolveAt) / 4.2, 0, .8) : 1); });

    var shellTop = pot.rimY + 13, shellBottom = pot.bottomY;
    var shellGradient = ctx.createLinearGradient(pot.cx - pot.outerWidth / 2, 0, pot.cx + pot.outerWidth / 2, 0);
    shellGradient.addColorStop(0, '#16131b'); shellGradient.addColorStop(.28, '#332d37'); shellGradient.addColorStop(.53, '#1d1922'); shellGradient.addColorStop(.82, '#3a333d'); shellGradient.addColorStop(1, '#151219');
    ctx.fillStyle = shellGradient; ctx.beginPath();
    ctx.moveTo(pot.cx - pot.outerWidth / 2 + 8, shellTop); ctx.quadraticCurveTo(pot.cx - pot.outerWidth / 2 + 24, shellBottom, pot.cx, shellBottom);
    ctx.quadraticCurveTo(pot.cx + pot.outerWidth / 2 - 24, shellBottom, pot.cx + pot.outerWidth / 2 - 8, shellTop);
    ctx.quadraticCurveTo(pot.cx, shellTop + 42, pot.cx - pot.outerWidth / 2 + 8, shellTop); ctx.fill();
    ctx.strokeStyle = 'rgba(216,168,75,.42)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(216,168,75,.65)'; roundRect(ctx, pot.cx - 29, shellTop + 58, 58, 27, 3); ctx.fill();
    ctx.fillStyle = '#17121e'; ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center'; ctx.fillText('QPL', pot.cx, shellTop + 76);

    if (!state.resolving && currentSource() && state.running && !state.finalized) {
      var source = currentSource();
      var overVessel = Math.abs(state.heldX - pot.cx) < pot.innerWidth / 2;
      if (overVessel) {
        ctx.strokeStyle = 'rgba(88,232,218,' + (.22 + Math.sin(now * .008) * .08) + ')';
        ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(pot.cx, pot.rimY + 3, pot.innerWidth / 2 + 7, 28, 0, 0, Math.PI * 2); ctx.stroke();
      }
      var heldY = state.dragging && state.egg.gestureActive ? state.egg.visualY : 62 + (reduceMotion ? 0 : Math.sin(now * .006) * 3);
      if (state.egg.gestureActive && !state.egg.revealed) {
        var stirringRadius = clamp(Math.hypot(state.heldX - pot.cx, heldY - pot.rimY), pot.innerWidth * .31, pot.outerWidth * .78);
        ctx.save();
        ctx.strokeStyle = 'rgba(252,199,50,.3)'; ctx.lineWidth = 2; ctx.setLineDash([4, 8]);
        ctx.beginPath(); ctx.arc(pot.cx, pot.rimY, stirringRadius, 0, -Math.min(Math.PI * 2, state.egg.progress % (Math.PI * 2)), true); ctx.stroke();
        ctx.restore();
      } else {
        ctx.save(); ctx.setLineDash([3, 6]); ctx.strokeStyle = 'rgba(246,207,114,.22)'; ctx.beginPath(); ctx.moveTo(state.heldX, 22); ctx.lineTo(state.heldX, pot.rimY - 40); ctx.stroke(); ctx.restore();
      }
      drawPebble({ x: state.heldX, y: heldY, r: clamp(w * .027, 14, 19), angle: now * .0004, source: source, state: 'held' });
      ctx.fillStyle = 'rgba(246,207,114,.66)'; ctx.font = '9px Courier New'; ctx.textAlign = 'center'; ctx.fillText(source.name.toUpperCase(), state.heldX, 27);
    }

    state.particles.forEach(function (particle) {
      var alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = rgba(particle.rgb, alpha);
      ctx.shadowColor = rgba(particle.rgb, alpha); ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    });
  }

  function undo() {
    var rules = state.round.rules;
    if (!state.snapshots.length || state.resolving || rules.undo === 0 || (rules.undo !== Infinity && state.undoUsed >= rules.undo)) return;
    var previous = state.snapshots.pop();
    state.queueIndex = previous.queueIndex; state.components = previous.components; state.mixtureRgb = previous.mixtureRgb;
    state.similarity = previous.similarity; state.mixed = previous.mixed; state.wasted = previous.wasted; state.elapsed = previous.elapsed;
    if (previous.queue) state.round.queue = previous.queue.slice();
    state.egg.watchDrops = previous.egg ? previous.egg.watchDrops : state.egg.watchDrops;
    state.egg.helped = previous.egg ? previous.egg.helped : state.egg.helped;
    state.bodies = previous.bodies; state.undoUsed += 1; state.finalized = false; state.running = true;
    if (state.mixtureRgb) state.displayRgb = Object.assign({}, state.mixtureRgb);
    else state.displayRgb = { r: 55, g: 48, b: 63 };
    els.stageMessage.textContent = 'Timeline reversed · ingredient restored';
    els.fieldLog.textContent = 'The undo clerk has altered history and stamped it twice.';
    sound('undo');
    syncSalamander();
    updateHud();
  }

  function finalScore() {
    var accuracy = state.similarity;
    var targetSeconds = state.mode === 'speed' ? state.round.rules.time : 52;
    var timeScore = clamp(100 - Math.max(0, state.elapsed - targetSeconds * .35) / targetSeconds * 72, 35, 100);
    var used = state.mixed + state.wasted;
    var efficiency = used ? clamp(state.round.solution.drops / used * 100, 35, 100) : 0;
    return { accuracy: accuracy, time: timeScore, efficiency: efficiency, total: Math.round(accuracy * .82 + timeScore * .08 + efficiency * .10) };
  }

  function recordResult(score, grade, passed) {
    var key = state.mode + ':' + state.difficulty;
    store.stats.potions += 1;
    store.stats.ingredients += state.mixed + state.wasted;
    store.stats.wasted += state.wasted;
    if (passed) store.stats.successful += 1;
    if (score.accuracy >= 99) store.stats.perfect += 1;
    if (!store.stats.best[key] || score.total > store.stats.best[key].score) store.stats.best[key] = { score: score.total, grade: grade };
    if (passed && (!store.stats.fastest[key] || state.elapsed < store.stats.fastest[key])) store.stats.fastest[key] = Math.round(state.elapsed * 10) / 10;
    if (!store.stats.efficiency[key] || score.efficiency > store.stats.efficiency[key]) store.stats.efficiency[key] = Math.round(score.efficiency);
    saveStore();
  }

  function finalizeRound(reason) {
    if (state.finalized || !state.round || state.resolving) return;
    if (!state.components.length && reason !== 'time' && reason !== 'drops') { say('empty'); return; }
    state.finalized = true; state.running = false;
    var score = finalScore();
    var grade = R.gradeFor(score.total);
    var passed = score.accuracy >= state.round.rules.threshold && score.total >= state.round.rules.threshold;
    els.resultKicker.textContent = passed ? 'POTION ACCEPTED · UNDER PROTEST' : (reason === 'time' ? 'TIME EXPIRED · COLOR REMAINS' : 'POTION QUARANTINED');
    els.resultGrade.textContent = grade;
    var verdicts = VERDICTS[grade] || VERDICTS.F;
    els.resultTitle.textContent = verdicts[Math.floor(Math.random() * verdicts.length)];
    els.resultSummary.textContent = passed ? 'The filing clears ' + state.round.rules.clearGrade + ' requirements. The council is pretending this outcome was expected.' :
      'This filing needed ' + state.round.rules.threshold + ' points. Useful data was produced, chiefly about what not to pour next time.';
    els.resultAccuracy.textContent = score.accuracy + '%';
    els.resultTime.textContent = formatTime(state.elapsed);
    els.resultEfficiency.textContent = Math.round(score.efficiency) + '%';
    els.resultNext.textContent = state.mode === 'ladder' && passed ? 'Next rung' : 'Mix another';
    if (state.mode === 'ladder' && passed) {
      state.ladderLevel += 1;
      store.ladder[state.difficulty] = Math.max(store.ladder[state.difficulty] || 1, state.ladderLevel);
    }
    recordResult(score, grade, passed);
    sound(passed ? 'success' : 'fail');
    if (passed) emit(state.pot.cx, state.pot.rimY, state.mixtureRgb || state.round.target.rgb, grade === 'S+' || grade === 'S' ? 52 : 28, 'sparkle');
    if (typeof els.result.showModal === 'function') els.result.showModal(); else els.result.setAttribute('open', '');
    updateHud();
  }

  function tick(now) {
    var dt = Math.min(.034, Math.max(0, (now - state.lastFrame) / 1000));
    state.lastFrame = now;
    if (state.running && state.timerStarted) {
      // Advance only while the game is actively rendering. Background tabs and
      // sleeping tablets should not quietly consume a timed round.
      state.elapsed += dt;
      if (state.mode === 'speed' && state.elapsed >= state.round.rules.time) finalizeRound('time');
      if (Math.floor((state.elapsed - dt) * 4) !== Math.floor(state.elapsed * 4)) {
        els.timer.textContent = formatTime(state.mode === 'speed' ? state.round.rules.time - state.elapsed : state.elapsed);
      }
    }
    updatePhysics(dt);
    drawScene(now);
    requestAnimationFrame(tick);
  }

  els.canvas.addEventListener('pointerdown', function (event) {
    if (state.resolving) return;
    ensureAudio();
    state.dragging = true; aimAt(event.clientX, event.clientY);
    try { els.canvas.setPointerCapture(event.pointerId); } catch (_) { }
  });
  els.canvas.addEventListener('pointermove', function (event) {
    if (event.pointerType === 'mouse' || state.dragging) aimAt(event.clientX, state.dragging ? event.clientY : null);
  });
  els.canvas.addEventListener('pointerup', function (event) {
    if (!state.dragging) return;
    aimAt(event.clientX, event.clientY);
    state.dragging = false;
    resetEggGesture();
    if (state.egg.cancelDrop) { state.egg.cancelDrop = false; return; }
    dropIngredient();
  });
  els.canvas.addEventListener('pointercancel', function () { state.dragging = false; state.egg.cancelDrop = false; resetEggGesture(); });
  els.canvas.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); state.heldX = clamp(state.heldX + (event.key === 'ArrowLeft' ? -24 : 24), 25, state.width - 25);
    }
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); dropIngredient(); }
  });

  document.querySelectorAll('[data-mode]').forEach(function (button) {
    button.addEventListener('click', function () { ensureAudio(); state.mode = button.getAttribute('data-mode'); setActiveButtons('mode-controls', 'mode', state.mode); startRound(); });
  });
  document.querySelectorAll('[data-difficulty]').forEach(function (button) {
    button.addEventListener('click', function () { ensureAudio(); state.difficulty = button.getAttribute('data-difficulty'); state.ladderLevel = store.ladder[state.difficulty] || 1; setActiveButtons('difficulty-controls', 'difficulty', state.difficulty); startRound(); });
  });
  els.undo.addEventListener('click', undo);
  els.submit.addEventListener('click', function () { finalizeRound('submit'); });
  els.restart.addEventListener('click', startRound);
  els.resultClose.addEventListener('click', function () { els.result.close(); });
  els.resultNext.addEventListener('click', startRound);
  els.sound.addEventListener('click', function () {
    state.soundOn = !state.soundOn; els.sound.textContent = state.soundOn ? '♪' : '×';
    els.sound.setAttribute('aria-pressed', String(state.soundOn)); els.sound.setAttribute('aria-label', state.soundOn ? 'Mute sound' : 'Unmute sound');
    els.sound.title = state.soundOn ? 'Sound on' : 'Sound muted';
    store.settings.soundOn = state.soundOn; saveStore();
    if (state.soundOn) { ensureAudio(); sound('sparkle'); }
  });
  els.records.addEventListener('click', function () {
    var key = state.mode + ':' + state.difficulty;
    var best = store.stats.best[key];
    var fastest = store.stats.fastest[key];
    els.recordsGrid.innerHTML = '<div class="record"><span>Potions adjudicated</span><strong>' + store.stats.potions + '</strong></div>' +
      '<div class="record"><span>Catastrophic waste</span><strong>' + store.stats.wasted + '</strong></div>' +
      '<div class="record"><span>Perfect accidents</span><strong>' + store.stats.perfect + '</strong></div>' +
      '<div class="record"><span>Best here</span><strong>' + (best ? best.grade + ' · ' + best.score : '—') + '</strong></div>' +
      '<div class="record"><span>Fastest clear</span><strong>' + (fastest ? fastest.toFixed(1) + 's' : '—') + '</strong></div>' +
      '<div class="record"><span>Best efficiency</span><strong>' + (store.stats.efficiency[key] ? store.stats.efficiency[key] + '%' : '—') + '</strong></div>' +
      '<div class="record"><span>Successful filings</span><strong>' + store.stats.successful + '</strong></div>' +
      '<div class="record"><span>Ladder clearance</span><strong>' + (store.ladder[state.difficulty] || 1) + '</strong></div>';
    if (typeof els.recordsDialog.showModal === 'function') els.recordsDialog.showModal(); else els.recordsDialog.setAttribute('open', '');
  });
  els.recordsClose.addEventListener('click', function () { els.recordsDialog.close(); });
  els.onboardingDismiss.addEventListener('click', function () { els.onboarding.hidden = true; store.settings.onboarded = true; saveStore(); });
  window.addEventListener('resize', resizeCanvas);
  if ('ResizeObserver' in window) {
    var canvasResizeObserver = new ResizeObserver(function () { resizeCanvas(); });
    canvasResizeObserver.observe(els.canvas);
  }
  document.addEventListener('keydown', function (event) {
    if (event.target.matches('button, canvas')) return;
    if (event.key.toLowerCase() === 'u') undo();
    if (event.key.toLowerCase() === 'r') startRound();
    if (event.key.toLowerCase() === 'm') els.sound.click();
  });

  resizeCanvas();
  setActiveButtons('mode-controls', 'mode', state.mode);
  setActiveButtons('difficulty-controls', 'difficulty', state.difficulty);
  els.onboarding.hidden = !!store.settings.onboarded;
  els.sound.textContent = state.soundOn ? '♪' : '×';
  els.sound.setAttribute('aria-pressed', String(state.soundOn));
  els.sound.setAttribute('aria-label', state.soundOn ? 'Mute sound' : 'Unmute sound');
  els.sound.title = state.soundOn ? 'Sound on' : 'Sound muted';
  startRound();
  requestAnimationFrame(tick);
})();
