/* ═══════════════════════════════════════════════════════════════════════
   missions.js — the mission controller
   ───────────────────────────────────────────────────────────────────────
   Still entirely decoupled from atlas.js. It drives the map through
   window.AtlasBridge and listens for two events the atlas fires:

     atlas:select   any point of interest opened, from anywhere
     atlas:signal   how close the view is to the current objective

   atlas.js has no idea a mission exists. It is told what to aim at and
   what has been logged, and draws accordingly.

   No fail state anywhere. Opening the wrong marker just opens that
   marker's entry, exactly as it would outside a mission; the objective
   only advances on a correct match; "Show me" is available immediately,
   every objective. Nobody gets stuck, and nothing is ever lost by
   guessing wrong.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var MISS = (typeof MISSIONS !== 'undefined') ? MISSIONS : [];
  var SND = window.MissionSound;
  var $ = function (id) { return document.getElementById(id); };

  var hud = $('mission-hud');
  var board = $('mission-board');
  if (!hud || !board || !MISS.length) return;

  var elNum = $('m-num'), elN = $('m-n'), elTotal = $('m-total');
  var elBrief = $('m-brief'), elDots = $('m-dots');
  var sigFill = $('sig-fill'), sigWord = $('sig-word');
  var btnHint = $('m-hint'), btnNext = $('m-next'), btnMute = $('m-mute');
  var boardCards = $('board-cards'), boardLog = $('board-log');

  var KEY = 'longfield.missions.v1';
  var store = { logged: {}, complete: [], muted: false };

  var active = null;    // the mission being flown
  var idx = 0;          // objective within it
  var awaiting = false; // objective logged, waiting to be sent on
  var tickTimer = null;
  var signal = 0, sameScene = true;

  /* ═══════════════════════════════════════════════════════════
     STORAGE — progress survives a reload, because a ten-year-old
     does not finish nine objectives in one sitting. Every access
     is guarded: a browser with site data blocked must still play.
  ═══════════════════════════════════════════════════════════ */

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var d = JSON.parse(raw);
        store.logged = d.logged || {};
        store.complete = d.complete || [];
        store.muted = !!d.muted;
      }
    } catch (e) { /* private window, or storage disabled — carry on */ }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { }
  }

  function loggedIn(mission) { return store.logged[mission.id] || []; }

  function isLogged(mission, obj) {
    return loggedIn(mission).indexOf(obj.scene + '|' + obj.id) >= 0;
  }

  /* Every key logged across every mission — what the map stamps. */
  function allLoggedKeys() {
    var out = [];
    Object.keys(store.logged).forEach(function (mid) {
      store.logged[mid].forEach(function (k) { if (out.indexOf(k) < 0) out.push(k); });
    });
    return out;
  }

  function pushStamps() {
    if (window.AtlasBridge) window.AtlasBridge.setLogged(allLoggedKeys());
  }

  /* ═══════════════════════════════════════════════════════════
     THE BOARD
  ═══════════════════════════════════════════════════════════ */

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* One dot per objective, filled in the colour of whatever was found
     there. The row of colours is the progress bar. */
  function dotRow(mission, upTo) {
    var out = '';
    mission.objectives.forEach(function (o, i) {
      var done = isLogged(mission, o);
      var col = '';
      if (done && window.AtlasBridge) {
        var info = window.AtlasBridge.lookup(o.scene, o.id);
        if (info) col = info.color;
      }
      out += '<span class="dot' + (done ? ' on' : '') +
        (upTo === i ? ' now' : '') + '"' +
        (col ? ' style="--dc:' + esc(col) + '"' : '') + '></span>';
    });
    return out;
  }

  function buildBoard() {
    boardCards.innerHTML = '';
    MISS.forEach(function (m) {
      var done = store.complete.indexOf(m.id) >= 0;
      var got = loggedIn(m).length;
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'mission-card' + (done ? ' done' : '');
      card.innerHTML =
        '<span class="mc-top">' +
        '<span class="mc-num">Mission ' + pad2(m.n) + '</span>' +
        '<span class="mc-level">' + esc(m.level) + '</span>' +
        '</span>' +
        '<span class="mc-title">' + esc(m.title) + '</span>' +
        '<span class="mc-blurb">' + esc(m.blurb) + '</span>' +
        '<span class="mc-foot">' +
        '<span class="mc-dots">' + dotRow(m, -1) + '</span>' +
        '<span class="mc-count">' + (done ? 'complete' :
          got ? got + ' of ' + m.objectives.length : m.objectives.length + ' objectives') +
        '</span></span>';
      card.addEventListener('click', function () { launch(m); });
      boardCards.appendChild(card);
    });
  }

  function openBoard(logHTML) {
    boardLog.innerHTML = logHTML || '';
    boardLog.classList.toggle('hidden', !logHTML);
    buildBoard();
    board.classList.remove('hidden');
  }

  function closeBoard() { board.classList.add('hidden'); }

  /* ═══════════════════════════════════════════════════════════
     FLYING A MISSION
  ═══════════════════════════════════════════════════════════ */

  function launch(mission) {
    closeBoard();
    active = mission;

    /* Resume where they left off: first objective not yet logged. */
    idx = 0;
    while (idx < mission.objectives.length && isLogged(mission, mission.objectives[idx])) idx++;
    if (idx >= mission.objectives.length) idx = 0;   // replaying a finished one

    /* The launch click is the user gesture the audio context needs. */
    if (SND) { SND.arm(); SND.setMuted(store.muted); }
    syncMute();

    hud.classList.remove('hidden');
    document.body.classList.add('on-mission');
    render();
    scheduleTick();
  }

  function standDown() {
    active = null;
    awaiting = false;
    hud.classList.remove('caught');
    hud.classList.add('hidden');
    document.body.classList.remove('on-mission');
    if (window.AtlasBridge) window.AtlasBridge.setObjective(null);
    clearTimeout(tickTimer);
    tickTimer = null;
  }

  function current() { return active ? active.objectives[idx] : null; }

  function render() {
    var o = current();
    if (!o) return;
    awaiting = false;
    hud.classList.remove('caught');
    elNum.textContent = pad2(active.n);
    elN.textContent = String(idx + 1);
    elTotal.textContent = String(active.objectives.length);
    elBrief.textContent = o.brief;
    elDots.innerHTML = dotRow(active, idx);
    btnHint.classList.remove('hidden');
    btnNext.classList.add('hidden');

    /* An objective with no marker gets no meter — it gets a nudge. */
    hud.classList.toggle('no-signal', !!o.noSignal);
    if (o.noSignal) sigWord.textContent = o.noSignal;

    if (window.AtlasBridge) window.AtlasBridge.setObjective(o.noSignal ? null : o.scene, o.id);
    measure();
  }

  /* On a phone the HUD sits where the masthead title is. Publish its real
     height so the masthead can step down out from under it rather than
     being covered — that title is itself an objective on one mission. */
  function measure() {
    document.documentElement.style.setProperty('--hud-h', hud.offsetHeight + 'px');
  }
  window.addEventListener('resize', function () { if (active) measure(); });

  function advance() {
    idx++;
    if (idx >= active.objectives.length) { finish(); return; }
    render();
    scheduleTick();
  }

  function logObjective(o) {
    var key = o.scene + '|' + o.id;
    if (!store.logged[active.id]) store.logged[active.id] = [];
    if (store.logged[active.id].indexOf(key) < 0) store.logged[active.id].push(key);
    save();
    pushStamps();

    if (window.AtlasBridge) {
      window.AtlasBridge.setObjective(null);
      window.AtlasBridge.celebrate(o.scene, o.id);
    }
    if (SND) SND.logged();

    /* No timer here. The confirmation stays up until it is read and
       dismissed — a line that vanishes on a countdown is a line that
       gets missed by anyone who reads at their own pace. */
    awaiting = true;
    elBrief.textContent = o.logged;
    elDots.innerHTML = dotRow(active, -1);
    btnHint.classList.add('hidden');
    btnNext.textContent = (idx + 1 >= active.objectives.length)
      ? 'See the mission log →' : 'Next objective →';
    btnNext.classList.remove('hidden');
    hud.classList.add('caught');
    clearTimeout(tickTimer);
    measure();
  }

  /* ═══════════════════════════════════════════════════════════
     MISSION LOG — what was found, in the order it was found
  ═══════════════════════════════════════════════════════════ */

  function finish() {
    if (store.complete.indexOf(active.id) < 0) store.complete.push(active.id);
    save();
    if (SND) SND.complete();

    var rows = active.objectives.map(function (o) {
      var info = window.AtlasBridge ? window.AtlasBridge.lookup(o.scene, o.id) : null;
      return '<li><span class="lg-dot" style="--dc:' + esc(info ? info.color : '#9fd4ff') + '"></span>' +
        '<b>' + esc(info ? info.name : o.id) + '</b>' +
        '<span class="lg-note">' + esc(o.logged.replace(/^Logged — /, '')) + '</span></li>';
    }).join('');

    var doneAll = store.complete.length >= MISS.length;
    var html =
      '<p class="lg-eyebrow">Mission ' + pad2(active.n) + ' complete</p>' +
      '<h3 class="lg-head">' + esc(active.title) + ' — the log</h3>' +
      '<ol class="lg-list">' + rows + '</ol>' +
      '<p class="lg-tail">' + (doneAll
        ? 'All three flown. Nothing left to find here but whatever you want to look at next — and something has been added to Sources &amp; method.'
        : 'Everything above stays marked on the map. Pick another, or go and look at whatever you noticed on the way.') +
      '</p>';

    standDown();
    if (doneAll) signAtlas();
    openBoard(html);
  }

  /* ═══════════════════════════════════════════════════════════
     PROVENANCE

     This atlas cites every claim it makes. Fly all three missions and
     it cites one more thing: itself. Formatted exactly like the real
     entries, because that is the joke.
  ═══════════════════════════════════════════════════════════ */

  function signAtlas() {
    /* Appended to the overlay itself, not to #src-groups — atlas.js
       rewrites that block wholesale when it builds the source list. */
    var host = document.getElementById('sources-inner');
    if (!host || document.getElementById('provenance')) return;
    var wrap = document.createElement('div');
    wrap.id = 'provenance';
    wrap.innerHTML =
      '<h3>Provenance (1)</h3><ul class="src-list"><li>' +
      '<span class="kind-tag archive">archive</span>' +
      'The Long Field — an atlas of the Milky Way, drawn from the sources above' +
      '<span class="c-meta">Claude Opus 5, in Claude Code · for Rosetta’s Garden of Keys · August 2026</span>' +
      '</li></ul>';
    host.appendChild(wrap);
    console.log(
      '%cThe Long Field%c\nAll three missions flown. Every briefing traced to a real, cited point of interest — same standard as the rest of the atlas.\nDrawn with Claude Opus 5, in Claude Code.',
      'color:#d4af37;font-weight:bold', 'color:inherit'
    );
  }

  /* ═══════════════════════════════════════════════════════════
     SIGNAL — the meter, and the tick that goes with it
  ═══════════════════════════════════════════════════════════ */

  var BANDS = [
    [0.88, 'locked'], [0.66, 'strong'], [0.42, 'steady'],
    [0.18, 'weak'], [0, 'faint']
  ];

  function bandFor(s) {
    for (var i = 0; i < BANDS.length; i++) if (s >= BANDS[i][0]) return BANDS[i][1];
    return 'faint';
  }

  document.addEventListener('atlas:signal', function (ev) {
    if (!active) return;
    var o = current();
    if (!o || o.noSignal) return;

    signal = ev.detail.signal;
    sameScene = ev.detail.sameScene;

    sigFill.style.width = (sameScene ? signal * 100 : 0).toFixed(1) + '%';
    sigFill.style.setProperty('--warm', signal.toFixed(3));
    sigWord.textContent = sameScene ? bandFor(signal)
      : (o.scene === 'galaxy' ? 'nothing here — back out to the galaxy'
        : 'nothing here — it is further in');
  });

  /* The tick reschedules itself, so its rate can follow the signal
     continuously instead of stepping between fixed intervals. */
  function scheduleTick() {
    clearTimeout(tickTimer);
    if (!active) return;
    var o = current();
    var quiet = !o || o.noSignal || !sameScene || signal < 0.06 ||
      !SND || SND.isMuted() || !SND.ready();
    if (!quiet) SND.tick(signal);
    /* 900 ms when cold, 90 ms when locked on. */
    var wait = quiet ? 400 : 900 - signal * 810;
    tickTimer = setTimeout(scheduleTick, wait);
  }

  /* ═══════════════════════════════════════════════════════════
     WIRING
  ═══════════════════════════════════════════════════════════ */

  document.addEventListener('atlas:select', function (ev) {
    if (!active) return;
    var o = current();
    var d = ev.detail;
    if (!o || !d || !d.poi) return;

    /* Already logged and waiting to be sent on — looking at other things
       in the meantime is fine, and must not re-log or advance anything. */
    if (awaiting) return;

    if (d.scene === o.scene && d.poi.id === o.id) logObjective(o);
    else if (SND) SND.pip();          // acknowledged, never a buzzer
  });

  btnNext.addEventListener('click', function () {
    if (active && awaiting) advance();
  });

  function syncMute() {
    var m = store.muted;
    btnMute.setAttribute('aria-pressed', String(!m));
    btnMute.textContent = m ? '♪' : '🔊';
    btnMute.setAttribute('aria-label', m ? 'Turn mission sound on' : 'Mute mission sound');
  }

  btnMute.addEventListener('click', function () {
    store.muted = !store.muted;
    save();
    if (SND) { SND.arm(); SND.setMuted(store.muted); }
    syncMute();
  });

  /* "Show me" gives it away, always, including for the objectives with no
     marker of their own — the map can still fly to those and open them,
     and an escape hatch that leaves someone hunting for a control is not
     an escape hatch. */
  btnHint.addEventListener('click', function () {
    var o = current();
    if (o && window.AtlasBridge) window.AtlasBridge.goTo(o.scene, o.id);
  });

  $('m-board').addEventListener('click', function () { openBoard(''); });
  $('mission-close').addEventListener('click', standDown);
  $('board-close').addEventListener('click', closeBoard);
  $('btn-missions').addEventListener('click', function () {
    if (active) standDown(); else openBoard('');
  });

  /* The first-run card offers the missions as the way in; the quiet
     button beside it still just opens the field. */
  var introMission = $('intro-mission');
  if (introMission) introMission.addEventListener('click', function () {
    $('intro').classList.add('hidden');
    openBoard('');
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    if (!board.classList.contains('hidden')) closeBoard();
  });

  /* ═══════════════════════════════════════════════════════════
     BOOT
  ═══════════════════════════════════════════════════════════ */

  load();
  syncMute();
  if (SND) SND.setMuted(store.muted);
  pushStamps();
  if (store.complete.length >= MISS.length) signAtlas();
})();
