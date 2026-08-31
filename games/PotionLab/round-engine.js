(function (global) {
  'use strict';

  var C = global.PotionColor;
  var DIFFICULTIES = {
    easy:   { candidates: 4, recipeColors: 2, recipeDrops: 3, drops: 7, threshold: 74, clearGrade: 'B', undo: Infinity, time: 35, minTargetSat: 38 },
    medium: { candidates: 5, recipeColors: 3, recipeDrops: 4, drops: 8, threshold: 83, clearGrade: 'A', undo: 3, time: 28, minTargetSat: 25 },
    hard:   { candidates: 6, recipeColors: 3, recipeDrops: 5, drops: 8, threshold: 88, clearGrade: 'A+', undo: 0, time: 22, minTargetSat: 15 }
  };

  var SOURCE_MODIFIERS = ['Ground', 'Powdered', 'Borrowed', 'Moonlit', 'Condensed', 'Fermented', 'Union', 'Unlabeled', 'Reactive', 'Pocket'];
  var SOURCE_NOUNS = {
    scarlet: ['Cinnabar', 'Dragon Pepper', 'Redcap Dust'], vermilion: ['Ember Salt', 'Foxfire Clay', 'Copper Bloom'],
    amber: ['Sun Resin', 'Amber Spores', 'Toast Essence'], yellow: ['Saffron Static', 'Gold Mote', 'Lemon Quartz'],
    chartreuse: ['Lichen Flake', 'Goblin Zest', 'Bog Citrus'], green: ['Moss Pearl', 'Fern Ink', 'Basilisk Mint'],
    mint: ['Spectral Mint', 'Glass Algae', 'Frostleaf'], teal: ['Tide Glass', 'Teal Spores', 'Lagoon Salt'],
    cyan: ['Sky Solvent', 'Cyan Vapor', 'Cloud Brine'], cerulean: ['Blue Hour', 'Cerulean Clay', 'Storm Bead'],
    violet: ['Violet Static', 'Nightshade Chalk', 'Astral Plum'], purple: ['Royal Sediment', 'Purple Echo', 'Wizard Bruise'],
    magenta: ['Fuchsia Hex', 'Magenta Pollen', 'Drama Crystal'], rose: ['Rose Oxide', 'Blush Ash', 'Pink Liability'],
    neutral: ['Moon Dust', 'Grey Matter', 'Clerk Chalk']
  };
  var TARGET_PREFIXES = ['Suspiciously', 'Unlicensed', 'Forbidden', 'Department-Issue', 'Probably', 'Industrial', 'Ceremonial', 'Regulation-Adjacent', 'Unsupervised', 'Mildly Haunted', 'Budget', 'Union-Mandated', 'Non-Euclidean', 'Contraband', 'Peer-Reviewed'];
  var TARGET_SUFFIXES = ['', '', '', ' No. 7', ' After Hours', ' for Internal Use', ' of Dubious Origin', ' with Intent', ' (Provisional)', ' under Protest', ' by Committee'];
  var HUES = [2, 20, 38, 54, 76, 102, 132, 158, 184, 204, 224, 246, 268, 292, 316, 340];

  function hashSeed(value) {
    var seed = 2166136261;
    String(value).split('').forEach(function (char) { seed ^= char.charCodeAt(0); seed = Math.imul(seed, 16777619); });
    return seed >>> 0;
  }

  function rngFrom(seedValue) {
    var state = hashSeed(seedValue) || 0x91e10da5;
    return function () {
      state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
      return (state >>> 0) / 4294967296;
    };
  }

  function pick(rng, list) { return list[Math.floor(rng() * list.length)]; }
  function integer(rng, min, max) { return Math.floor(rng() * (max - min + 1)) + min; }
  function shuffle(rng, list) {
    for (var i = list.length - 1; i > 0; i -= 1) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = list[i]; list[i] = list[j]; list[j] = tmp;
    }
    return list;
  }

  function circularGap(a, b) { var d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); }

  function gradeFor(score) {
    if (score >= 96) return 'S+';
    if (score >= 91) return 'S';
    if (score >= 88) return 'A+';
    if (score >= 83) return 'A';
    if (score >= 74) return 'B';
    if (score >= 64) return 'C';
    if (score >= 52) return 'D';
    return 'F';
  }

  function adjustedRules(mode, difficulty, level) {
    var base = DIFFICULTIES[difficulty] || DIFFICULTIES.easy;
    var rules = Object.assign({}, base);
    if (mode === 'speed') {
      rules.drops += 1;
    }
    if (mode === 'ladder') {
      var rung = Math.max(1, level || 1);
      var pressure = Math.min(5, Math.floor((rung - 1) / 2));
      rules.candidates = Math.min(7, base.candidates + Math.floor(pressure / 2));
      rules.recipeDrops = Math.min(7, base.recipeDrops + Math.floor(pressure / 2));
      rules.recipeColors = Math.min(4, base.recipeColors + (rung >= 6 ? 1 : 0));
      rules.drops = Math.max(rules.recipeDrops + 2, base.drops - Math.floor(pressure / 2));
      rules.threshold = Math.min(94, base.threshold + pressure * 2);
      rules.minTargetSat = Math.max(12, base.minTargetSat - pressure * 3);
    }
    rules.clearGrade = gradeFor(rules.threshold);
    return rules;
  }

  function makeSource(rng, hue, index) {
    var saturation = integer(rng, 68, 90);
    var lightness = integer(rng, 45, 62);
    var rgb = C.hslToRgb(hue + integer(rng, -5, 5), saturation, lightness);
    var descriptor = C.describe(rgb);
    var nouns = SOURCE_NOUNS[descriptor.hue] || SOURCE_NOUNS.neutral;
    return {
      id: 'source-' + index,
      rgb: rgb,
      hex: C.rgbToHex(rgb),
      name: pick(rng, SOURCE_MODIFIERS) + ' ' + pick(rng, nouns),
      description: descriptor.text
    };
  }

  function distributeRecipe(rng, colorCount, dropCount) {
    var counts = Array(colorCount).fill(1);
    for (var i = colorCount; i < dropCount; i += 1) counts[Math.floor(rng() * colorCount)] += 1;
    return counts;
  }

  function makeRound(options) {
    options = options || {};
    var mode = options.mode || 'classic';
    var difficulty = options.difficulty || 'easy';
    var level = options.level || 1;
    var seed = options.seed || (Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));
    var rng = rngFrom(seed);
    var rules = adjustedRules(mode, difficulty, level);
    var round = null;

    for (var attempt = 0; attempt < 90; attempt += 1) {
      var hues = shuffle(rng, HUES.slice());
      var chosen = [];
      for (var h = 0; h < hues.length && chosen.length < rules.candidates; h += 1) {
        if (!chosen.length || chosen.every(function (existing) { return circularGap(existing, hues[h]) >= 24; })) chosen.push(hues[h]);
      }
      while (chosen.length < rules.candidates) chosen.push((pick(rng, HUES) + integer(rng, -7, 7) + 360) % 360);
      var sources = chosen.map(function (hue, index) { return makeSource(rng, hue, index); });
      var solutionIndices = shuffle(rng, sources.map(function (_, index) { return index; })).slice(0, rules.recipeColors);
      var counts = distributeRecipe(rng, solutionIndices.length, rules.recipeDrops);
      var recipe = [];
      solutionIndices.forEach(function (sourceIndex, index) {
        for (var count = 0; count < counts[index]; count += 1) recipe.push(sourceIndex);
      });
      var targetRgb = C.mixPigments(recipe.map(function (sourceIndex) { return { color: sources[sourceIndex].rgb }; }));
      var targetDesc = C.describe(targetRgb);
      var closestSource = Math.min.apply(null, sources.map(function (source) { return C.distance(targetRgb, source.rgb); }));
      var bestSingleSimilarity = Math.round(C.clamp(100 - closestSource * 190, 0, 100));
      if (targetDesc.hsl.s < rules.minTargetSat || targetDesc.hsl.l < 24 || targetDesc.hsl.l > 78 || bestSingleSimilarity >= rules.threshold - 2) continue;

      var distractorIndices = sources.map(function (_, index) { return index; }).filter(function (index) { return solutionIndices.indexOf(index) === -1; });
      var queue = recipe.slice();
      while (queue.length < rules.drops) queue.push(pick(rng, distractorIndices.length ? distractorIndices : sources.map(function (_, index) { return index; })));
      shuffle(rng, queue);
      // Avoid opening with a wall of intentional misses on teaching rounds.
      if (queue.slice(0, 2).every(function (index) { return solutionIndices.indexOf(index) === -1; })) {
        var usefulAt = queue.findIndex(function (index) { return solutionIndices.indexOf(index) !== -1; });
        var swap = queue[0]; queue[0] = queue[usefulAt]; queue[usefulAt] = swap;
      }
      var hueWord = targetDesc.hue.charAt(0).toUpperCase() + targetDesc.hue.slice(1);
      round = {
        seed: seed,
        filing: 'QPL-' + hashSeed(seed).toString(16).slice(-4).toUpperCase().padStart(4, '0'),
        mode: mode,
        difficulty: difficulty,
        level: level,
        rules: rules,
        sources: sources,
        queue: queue,
        target: {
          rgb: targetRgb,
          hex: C.rgbToHex(targetRgb),
          name: pick(rng, TARGET_PREFIXES) + ' ' + hueWord + pick(rng, TARGET_SUFFIXES),
          description: targetDesc.text
        },
        solution: { sourceIndices: solutionIndices, counts: counts, drops: recipe.length },
        verified: C.similarity(targetRgb, C.mixPigments(recipe.map(function (index) { return { color: sources[index].rgb }; }))) === 100
      };
      break;
    }

    if (!round) return makeRound(Object.assign({}, options, { seed: seed + '-fallback' }));
    return round;
  }

  global.PotionRounds = {
    DIFFICULTIES: DIFFICULTIES,
    adjustedRules: adjustedRules,
    gradeFor: gradeFor,
    makeRound: makeRound,
    rngFrom: rngFrom
  };
})(window);
