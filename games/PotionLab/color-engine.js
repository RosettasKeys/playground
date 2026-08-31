(function (global) {
  'use strict';

  var clamp = function (value, min, max) { return Math.min(max, Math.max(min, value)); };

  function hexToRgb(hex) {
    var clean = String(hex).replace('#', '');
    if (clean.length === 3) clean = clean.replace(/(.)/g, '$1$1');
    var value = parseInt(clean, 16);
    return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
  }

  function rgbToHex(rgb) {
    function part(value) { return Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0'); }
    return '#' + part(rgb.r) + part(rgb.g) + part(rgb.b);
  }

  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = clamp(s / 100, 0, 1);
    l = clamp(l / 100, 0, 1);
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs((h / 60) % 2 - 1));
    var m = l - c / 2;
    var base = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return { r: (base[0] + m) * 255, g: (base[1] + m) * 255, b: (base[2] + m) * 255 };
  }

  function rgbToHsl(rgb) {
    var r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var d = max - min, h = 0;
    var l = (max + min) / 2;
    if (d) {
      if (max === r) h = 60 * (((g - b) / d) % 6);
      else if (max === g) h = 60 * ((b - r) / d + 2);
      else h = 60 * ((r - g) / d + 4);
    }
    if (h < 0) h += 360;
    var s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
    return { h: h, s: s * 100, l: l * 100 };
  }

  // Gossett/Chen-style RYB conversion. Averaging in this artist wheel makes
  // yellow + blue trend green and red + blue trend violet, unlike RGB light.
  function rgbToRyb(rgb) {
    var r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    var white = Math.min(r, g, b);
    r -= white; g -= white; b -= white;
    var maxGreen = Math.max(r, g, b);
    var yellow = Math.min(r, g);
    r -= yellow; g -= yellow;
    if (b > 0 && g > 0) { b /= 2; g /= 2; }
    yellow += g; b += g;
    var maxYellow = Math.max(r, yellow, b);
    if (maxYellow > 0) {
      var normal = maxGreen / maxYellow;
      r *= normal; yellow *= normal; b *= normal;
    }
    return { r: r + white, y: yellow + white, b: b + white };
  }

  function rybToRgb(ryb) {
    var r = ryb.r, y = ryb.y, b = ryb.b;
    var white = Math.min(r, y, b);
    r -= white; y -= white; b -= white;
    var maxYellow = Math.max(r, y, b);
    var green = Math.min(y, b);
    y -= green; b -= green;
    if (b > 0 && green > 0) { b *= 2; green *= 2; }
    r += y; green += y;
    var maxGreen = Math.max(r, green, b);
    if (maxGreen > 0) {
      var normal = maxYellow / maxGreen;
      r *= normal; green *= normal; b *= normal;
    }
    return { r: (r + white) * 255, g: (green + white) * 255, b: (b + white) * 255 };
  }

  function mixPigments(ingredients) {
    if (!ingredients || !ingredients.length) return null;
    var sum = { r: 0, y: 0, b: 0 }, total = 0;
    ingredients.forEach(function (ingredient) {
      var weight = ingredient.weight == null ? 1 : Math.max(0, ingredient.weight);
      var rgb = typeof ingredient.color === 'string' ? hexToRgb(ingredient.color) : ingredient.color;
      var ryb = rgbToRyb(rgb);
      // Pigment mass combines in RYB. A slight root curve preserves useful
      // chroma after several drops without turning mixtures neon.
      sum.r += Math.pow(ryb.r, 1.08) * weight;
      sum.y += Math.pow(ryb.y, 1.08) * weight;
      sum.b += Math.pow(ryb.b, 1.08) * weight;
      total += weight;
    });
    if (!total) return null;
    var mixed = rybToRgb({
      r: Math.pow(sum.r / total, 1 / 1.08),
      y: Math.pow(sum.y / total, 1 / 1.08),
      b: Math.pow(sum.b / total, 1 / 1.08)
    });
    // Real paint usually loses a little light as more pigments join it.
    var density = Math.min(.07, Math.max(0, ingredients.length - 1) * .012);
    mixed.r *= 1 - density; mixed.g *= 1 - density; mixed.b *= 1 - density;
    return { r: clamp(mixed.r, 0, 255), g: clamp(mixed.g, 0, 255), b: clamp(mixed.b, 0, 255) };
  }

  function rgbToOklab(rgb) {
    function linear(channel) {
      channel /= 255;
      return channel <= .04045 ? channel / 12.92 : Math.pow((channel + .055) / 1.055, 2.4);
    }
    var r = linear(rgb.r), g = linear(rgb.g), b = linear(rgb.b);
    var l = .4122214708 * r + .5363325363 * g + .0514459929 * b;
    var m = .2119034982 * r + .6806995451 * g + .1073969566 * b;
    var s = .0883024619 * r + .2817188376 * g + .6299787005 * b;
    var l3 = Math.cbrt(l), m3 = Math.cbrt(m), s3 = Math.cbrt(s);
    return {
      L: .2104542553 * l3 + .793617785 * m3 - .0040720468 * s3,
      a: 1.9779984951 * l3 - 2.428592205 * m3 + .4505937099 * s3,
      b: .0259040371 * l3 + .7827717662 * m3 - .808675766 * s3
    };
  }

  function distance(a, b) {
    var aa = rgbToOklab(a), bb = rgbToOklab(b);
    return Math.hypot(aa.L - bb.L, aa.a - bb.a, aa.b - bb.b);
  }

  function similarity(a, b) {
    return Math.round(clamp(100 - distance(a, b) * 190, 0, 100));
  }

  var HUE_NAMES = [
    [12, 'scarlet'], [30, 'vermilion'], [48, 'amber'], [66, 'yellow'],
    [92, 'chartreuse'], [132, 'green'], [164, 'mint'], [190, 'teal'],
    [212, 'cyan'], [238, 'cerulean'], [266, 'violet'], [310, 'purple'],
    [338, 'magenta'], [354, 'rose'], [372, 'scarlet']
  ];

  function hueName(hue) {
    var h = ((hue % 360) + 360) % 360;
    for (var i = 0; i < HUE_NAMES.length; i += 1) if (h < HUE_NAMES[i][0]) return HUE_NAMES[i][1];
    return 'scarlet';
  }

  function describe(rgb) {
    var hsl = rgbToHsl(rgb);
    var light = hsl.l < 28 ? 'deep' : hsl.l < 43 ? 'dark' : hsl.l > 76 ? 'pale' : hsl.l > 62 ? 'light' : 'mid';
    var saturation = hsl.s < 18 ? 'near-neutral' : hsl.s < 42 ? 'muted' : hsl.s > 78 ? 'vivid' : 'clear';
    return {
      hsl: hsl,
      hue: hsl.s < 12 ? 'neutral' : hueName(hsl.h),
      text: light + ' · ' + saturation + ' · ' + (hsl.s < 12 ? 'neutral' : hueName(hsl.h))
    };
  }

  global.PotionColor = {
    clamp: clamp,
    hexToRgb: hexToRgb,
    rgbToHex: rgbToHex,
    hslToRgb: hslToRgb,
    rgbToHsl: rgbToHsl,
    rgbToOklab: rgbToOklab,
    mixPigments: mixPigments,
    distance: distance,
    similarity: similarity,
    describe: describe,
    hueName: hueName
  };
})(window);
