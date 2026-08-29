/* ═══════════════════════════════════════════════════════════════════════
   render-scene.js — the Three.js world
   ───────────────────────────────────────────────────────────────────────
   Reads sim state, never writes it. Everything visible here is a readout:
   the funnel silhouette comes from the vortex's own pressure field, trees
   bend along the local wind vector, debris is drawn where the sim put it,
   and the scour ribbon traces where damaging wind actually went.

   Coordinates: the sim is a plan view in (x, y) with +y north. Three is
   y-up, so we map sim(x, y) → three(x, 0, -y).
   ═══════════════════════════════════════════════════════════════════════ */

window.TS = window.TS || {};

(function (TS) {
  'use strict';

  const clamp = TS.clamp, lerp = TS.lerp;
  const R = {};                       // the module's public surface
  TS.scene3d = R;

  let renderer, scene, camera, canvas;
  let ground, outland, groundTex, scour, funnel, funnelMat, debrisPts, debrisMat;
  let cloudBase, wallCloud, precipMesh, sunLight, hemi, skirt, skirtMat, skyMat;
  let structGroups = {}, treeGroups = {};
  let world = null, simRef = null;
  let clockT = 0;

  const V = new THREE.Vector3();
  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const E = new THREE.Euler();
  const S = new THREE.Vector3();
  const C = new THREE.Color();
  const HORIZON = new THREE.Color();


  /* ═══════════════════════════════════════════════════════════════════
     SETUP
     ═══════════════════════════════════════════════════════════════════ */

  R.init = function (cv) {
    canvas = cv;
    renderer = new THREE.WebGLRenderer({
      canvas: cv, antialias: true, alpha: false, powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x0a0e16, 1);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x6b7488, 0.00019);

    camera = new THREE.PerspectiveCamera(52, 1, 2, 140000);

    // Storm light: dim, cool, and slightly green-tinted under the base —
    // the colour everyone recognises from under a severe storm.
    hemi = new THREE.HemisphereLight(0x8fa4bd, 0x4a5138, 1.5);
    scene.add(hemi);

    sunLight = new THREE.DirectionalLight(0xffe8c8, 1.05);
    sunLight.position.set(-2400, 1600, 2200);
    scene.add(sunLight);

    buildSky();
    buildFunnel();
    buildSkirt();
    buildDebris();
    buildStorm();

    R.resize();
    window.addEventListener('resize', R.resize);
    installCameraControls();
    return R;
  };

  R.resize = function () {
    if (!renderer) return;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  };


  /* ── Sky ─────────────────────────────────────────────────────────── */

  function buildSky() {
    const g = new THREE.SphereGeometry(120000, 32, 20);
    const m = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        uTop: { value: new THREE.Color(0x1b2436) },
        uMid: { value: new THREE.Color(0x53607d) },
        uHaze: { value: new THREE.Color(0x7c8598) }
      },
      vertexShader: `
        varying float vH;
        void main(){
          vec4 wp = modelMatrix * vec4(position,1.0);
          vH = normalize(wp.xyz).y;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `
        uniform vec3 uTop, uMid, uHaze;
        varying float vH;
        void main(){
          float h = clamp(vH, -1.0, 1.0);
          vec3 c = mix(uHaze, uMid, smoothstep(0.04, 0.62, h));
          c = mix(c, uTop, smoothstep(0.52, 1.00, h));
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`
    });
    skyMat = m;
    scene.add(new THREE.Mesh(g, m));
  }


  /* ═══════════════════════════════════════════════════════════════════
     THE WORLD

     Rebuilt whenever the landscape changes. Structures and trees are
     instanced — a dense city is several thousand boxes, and drawing them
     individually would end the frame budget before the funnel got a turn.
     ═══════════════════════════════════════════════════════════════════ */

  R.buildWorld = function (w) {
    world = w;
    disposeWorld();
    buildGround(w);
    buildStructures(w);
    buildTrees(w);
    buildScour();
  };

  function disposeWorld() {
    for (const k in structGroups) {
      const g = structGroups[k];
      if (g.body) { scene.remove(g.body); g.body.geometry.dispose(); g.body.material.dispose(); }
      if (g.roof) { scene.remove(g.roof); g.roof.geometry.dispose(); g.roof.material.dispose(); }
    }
    structGroups = {};
    for (const k in treeGroups) {
      const g = treeGroups[k];
      scene.remove(g.mesh); g.mesh.geometry.dispose(); g.mesh.material.dispose();
      if (g.trunk) { scene.remove(g.trunk); g.trunk.geometry.dispose(); g.trunk.material.dispose(); }
    }
    treeGroups = {};
    if (ground) { scene.remove(ground); ground.geometry.dispose(); ground.material.dispose(); ground = null; }
    if (outland) { scene.remove(outland); outland.geometry.dispose(); outland.material.dispose(); outland = null; }
    if (groundTex) { groundTex.dispose(); groundTex = null; }
    if (scour) { scene.remove(scour); scour.geometry.dispose(); scour.material.dispose(); scour = null; }
  }


  /* Ground: land use is painted once into a canvas texture. Fields, roads
     and the town grid all live here rather than as geometry — it is one
     draw call instead of thousands, and it reads better besides. */

  const CROP_TINT = {
    wheat: [138, 118, 66], corn: [74, 96, 48], soy: [86, 104, 56],
    fallow: [104, 88, 66], pasture: [72, 92, 58]
  };

  function buildGround(w) {
    const SZ = 2048;
    const cv = document.createElement('canvas');
    cv.width = cv.height = SZ;
    const g = cv.getContext('2d');
    const ex = w.extent;
    const toPx = (v) => ((v + ex) / (ex * 2)) * SZ;
    // North has to end up at the TOP of the canvas, because the plane's
    // v=1 edge maps to sim +y. Flipping here rather than mirroring the
    // geometry matters: scaling a mesh by -1 on an axis inverts its face
    // normal, which lights the ground from underneath and turns the whole
    // world black.
    const toPy = (v) => SZ - ((v + ex) / (ex * 2)) * SZ;
    const scale = SZ / (ex * 2);

    g.fillStyle = '#3d4432';
    g.fillRect(0, 0, SZ, SZ);

    for (const f of w.fields) {
      const t = CROP_TINT[f.crop] || CROP_TINT.fallow;
      const j = (f.tone - 0.5) * 26;
      g.fillStyle = `rgb(${t[0] + j | 0},${t[1] + j | 0},${t[2] + j | 0})`;
      g.fillRect(toPx(f.x - f.w / 2), toPy(f.y + f.h / 2), f.w * scale, f.h * scale);
      // A faint plough direction so the eye can read scale on bare ground.
      g.strokeStyle = 'rgba(0,0,0,0.13)';
      g.lineWidth = 1;
      const step = 7;
      g.beginPath();
      for (let px = toPx(f.x - f.w / 2); px < toPx(f.x + f.w / 2); px += step) {
        g.moveTo(px, toPy(f.y + f.h / 2)); g.lineTo(px, toPy(f.y - f.h / 2));
      }
      g.stroke();
    }

    for (const rd of w.roads) {
      g.strokeStyle = rd.kind === 'street' ? '#4a4a4e' : '#55555a';
      g.lineWidth = Math.max(1.2, rd.width * scale);
      g.lineJoin = g.lineCap = 'round';
      g.beginPath();
      rd.pts.forEach((p, i) => i ? g.lineTo(toPx(p[0]), toPy(p[1])) : g.moveTo(toPx(p[0]), toPy(p[1])));
      g.stroke();
    }

    groundTex = new THREE.CanvasTexture(cv);
    groundTex.colorSpace = THREE.SRGBColorSpace;
    groundTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const geo = new THREE.PlaneGeometry(ex * 2, ex * 2, 1, 1);
    geo.rotateX(-Math.PI / 2);
    ground = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: groundTex }));
    ground.renderOrder = -2;
    scene.add(ground);

    // The mapped world is only 6.4 km across, but the camera can see much
    // further. Without something out there the terrain simply stops in
    // mid-air at a hard edge. This carries the eye to the fog instead.
    const outGeo = new THREE.PlaneGeometry(46000, 46000, 1, 1);
    outGeo.rotateX(-Math.PI / 2);
    outland = new THREE.Mesh(outGeo, new THREE.MeshLambertMaterial({ color: 0x53593f }));
    outland.position.y = -1.2;
    outland.renderOrder = -3;
    scene.add(outland);
  }


  /* Structures. Two instanced meshes per type where a separable roof makes
     sense — losing the roof before the walls is the single most legible
     damage step there is, and it happens to be a real DOD on most of the
     indicator ladders. */

  const ROOFED = { FR12: 1, MHSF: 1, MHDF: 1, SBO: 1, ESFR: 1, SM: 1, CHBS: 1 };
  const BASE_COLOR = {
    FR12: 0xa8a094, MHSF: 0xb9b6ad, MHDF: 0xb4b0a6, SBO: 0x8a6a52, SILO: 0xa8adb2,
    ESFR: 0x9a9689, SM: 0x8f8b84, MBS: 0x94897c, CHBS: 0xa39c8e, LRB: 0x8c9099,
    MRB: 0x7e848f, HRB: 0x767d8a, TWR: 0x9aa0a8, TP: 0x6b5a44
  };

  function buildStructures(w) {
    const byType = {};
    for (const s of w.structures) (byType[s.di] || (byType[s.di] = [])).push(s);

    for (const di in byType) {
      const list = byType[di];
      const n = list.length;
      const col = new THREE.Color(BASE_COLOR[di] || 0x999999);

      const bodyGeo = new THREE.BoxGeometry(1, 1, 1);
      bodyGeo.translate(0, 0.5, 0);              // sit on the ground
      const body = new THREE.InstancedMesh(bodyGeo,
        new THREE.MeshLambertMaterial({ color: 0xffffff }), n);
      body.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      body.frustumCulled = false;
      scene.add(body);

      let roof = null;
      if (ROOFED[di]) {
        const rg = new THREE.ConeGeometry(0.72, 1, 4, 1);
        rg.rotateY(Math.PI / 4);
        rg.translate(0, 0.5, 0);
        roof = new THREE.InstancedMesh(rg,
          new THREE.MeshLambertMaterial({ color: 0xffffff }), n);
        roof.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        roof.frustumCulled = false;
        scene.add(roof);
      }

      structGroups[di] = { body, roof, list, col, lastDod: new Int8Array(n).fill(-1) };
      for (let i = 0; i < n; i++) setStructureInstance(di, i, true);
      body.instanceMatrix.needsUpdate = true;
      if (roof) roof.instanceMatrix.needsUpdate = true;
    }
  }

  /* One structure's visual state, derived from its degree of damage.
     The thresholds are proportional to the length of each type's own
     ladder, so a barn (7 rungs) and a house (10) both lose their roof
     around the same place in their own story. */

  function setStructureInstance(di, i, initial) {
    const grp = structGroups[di];
    const s = grp.list[i];
    const spec = TS.DI_SPECS[di];
    const maxDod = spec.ms.length;
    const f = s.dod / maxDod;

    const roofGone = f >= 0.40;
    const collapsing = f >= 0.62;
    const flattened = f >= 0.86;
    const swept = s.dod >= maxDod;

    let h = s.h;
    let tiltA = 0;
    if (flattened) h *= 0.22;
    else if (collapsing) { h *= 0.62; tiltA = 0.10; }
    if (swept) h *= 0.5;

    // Poles fall along the wind rather than crumpling.
    if (di === 'TP' && s.dod >= 2) { tiltA = 1.28; h = s.h; }

    E.set(tiltA, s.rot, tiltA * 0.4);
    Q.setFromEuler(E);
    S.set(s.w, h, s.d);
    V.set(s.x, 0, -s.y);
    M.compose(V, Q, S);
    grp.body.setMatrixAt(i, M);

    // Colour: darken and desaturate toward rubble.
    C.copy(grp.col);
    if (s.dod > 0) {
      const d = clamp(f * 1.15, 0, 1);
      C.lerp(new THREE.Color(0x4a4238), d * 0.8);
    }
    grp.body.setColorAt(i, C);

    if (grp.roof) {
      const rh = roofGone ? 0.0001 : s.h * 0.42;
      const rw = roofGone ? 0.0001 : Math.max(s.w, s.d) * 0.98;
      E.set(0, s.rot, 0); Q.setFromEuler(E);
      S.set(rw, rh, rw);
      V.set(s.x, roofGone ? 0 : h, -s.y);
      M.compose(V, Q, S);
      grp.roof.setMatrixAt(i, M);
      C.copy(grp.col).multiplyScalar(0.72);
      grp.roof.setColorAt(i, C);
    }

    if (!initial) {
      grp.body.instanceMatrix.needsUpdate = true;
      if (grp.body.instanceColor) grp.body.instanceColor.needsUpdate = true;
      if (grp.roof) {
        grp.roof.instanceMatrix.needsUpdate = true;
        if (grp.roof.instanceColor) grp.roof.instanceColor.needsUpdate = true;
      }
    }
  }


  /* Trees. Bend is applied per instance from the local wind vector the sim
     computed, so vegetation response is a readout of the field rather than
     an animation running on its own clock. */

  function buildTrees(w) {
    const byKind = { hardwood: [], softwood: [] };
    for (const t of w.trees) byKind[t.kind].push(t);

    for (const kind in byKind) {
      const list = byKind[kind];
      if (!list.length) continue;
      const n = list.length;

      const geo = kind === 'softwood'
        ? new THREE.ConeGeometry(1, 1, 6, 1)
        : new THREE.SphereGeometry(1, 7, 5);
      geo.translate(0, kind === 'softwood' ? 0.5 : 0.62, 0);

      const mesh = new THREE.InstancedMesh(geo,
        new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), n);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      scene.add(mesh);

      treeGroups[kind] = { mesh, list, lastKey: new Float32Array(n).fill(-1) };
      for (let i = 0; i < n; i++) setTreeInstance(kind, i);
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  const TREE_GREEN = { hardwood: 0x466b34, softwood: 0x2f5238 };

  function setTreeInstance(kind, i) {
    const grp = treeGroups[kind];
    const t = grp.list[i];

    const uprooted = t.dod >= 3;
    const snapped = t.dod >= 4;
    const debarked = t.dod >= 5;

    let h = t.h, r = t.r;
    let bend = t.bend;
    if (snapped) { h *= 0.34; r *= 0.42; bend *= 0.3; }
    else if (uprooted) { bend = 1.45; }
    if (debarked) { h *= 0.7; r *= 0.24; }

    // Lean away from the wind, about the horizontal axis perpendicular
    // to it. bendX/bendY is the unit wind direction the sim recorded.
    const ang = clamp(bend, 0, 1.5) * 0.62;
    if (ang > 0.001) {
      V.set(-t.bendY, 0, -t.bendX).normalize();
      Q.setFromAxisAngle(V, ang);
    } else {
      Q.identity();
    }
    S.set(r, h, r);
    V.set(t.x, 0, -t.y);
    M.compose(V, Q, S);
    grp.mesh.setMatrixAt(i, M);

    C.setHex(TREE_GREEN[kind]);
    if (t.dod > 0) C.lerp(new THREE.Color(0x6b5a3c), clamp(t.dod / 5, 0, 1) * 0.85);
    grp.mesh.setColorAt(i, C);
  }


  /* ── Scour ribbon ────────────────────────────────────────────────────
     The damage swath, built as a triangle strip that grows along the
     path. A ribbon is both cheaper than repainting a ground texture and
     more honest: its half-width is the radius at which wind is still
     doing damage, so the mark on the ground is the footprint of the
     wind field rather than a decal sized by eye. */

  const SCOUR_MAX = 2400;             // ribbon vertices (2 per path sample)
  let scourCount = 0;

  function buildScour() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(SCOUR_MAX * 3);
    const col = new Float32Array(SCOUR_MAX * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setDrawRange(0, 0);
    scour = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.62,
      side: THREE.DoubleSide, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4
    }));
    scour.position.y = 0.45;
    scour.renderOrder = -1;
    scourCount = 0;
    scene.add(scour);
  }

  function pushScour(sim) {
    if (!scour || scourCount >= SCOUR_MAX - 2) return;
    const geo = scour.geometry;
    const pos = geo.attributes.position.array;
    const col = geo.attributes.color.array;

    // Half-width: where ground-relative wind still reaches the weakest
    // damage threshold. Widened on the right, where translation adds.
    const w = sim.rmax * 1.55;
    const nx = -sim.dir.y, ny = sim.dir.x;      // left-hand normal
    const bias = clamp(sim.params.forwardSpeed / Math.max(sim.vmax, 1), 0, 0.5);
    const wl = w * (1 - bias), wr = w * (1 + bias);

    const i = scourCount * 3;
    pos[i] = sim.center.x - nx * wr; pos[i + 1] = 0; pos[i + 2] = -(sim.center.y - ny * wr);
    pos[i + 3] = sim.center.x + nx * wl; pos[i + 4] = 0; pos[i + 5] = -(sim.center.y + ny * wl);

    const inten = clamp(sim.vmax / 90, 0, 1);
    const r = 0.14 + inten * 0.30, g = 0.10 + inten * 0.16, b = 0.07 + inten * 0.09;
    col[i] = r; col[i + 1] = g; col[i + 2] = b;
    col[i + 3] = r; col[i + 4] = g; col[i + 5] = b;

    scourCount += 2;
    geo.setDrawRange(0, scourCount);
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  }


  /* ═══════════════════════════════════════════════════════════════════
     THE FUNNEL

     Not a cone. A lathe whose radius at every height is asked of the sim,
     which derives it from the pressure deficit the vortex can actually
     produce against the height of the cloud base. Width, taper, tilt,
     and how far down condensation reaches all move independently, and
     all of them come from physics rather than from keyframes.
     ═══════════════════════════════════════════════════════════════════ */

  const FH = 64, FR = 44;             // height rings, radial segments

  function buildFunnel() {
    const geo = new THREE.BufferGeometry();
    const verts = FH * FR;
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts * 3), 3)
      .setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(verts * 2), 2));
    geo.setAttribute('aFade', new THREE.BufferAttribute(new Float32Array(verts), 1)
      .setUsage(THREE.DynamicDrawUsage));

    const idx = [];
    for (let h = 0; h < FH - 1; h++) {
      for (let s = 0; s < FR; s++) {
        const s2 = (s + 1) % FR;
        const a = h * FR + s, b = h * FR + s2;
        const c = (h + 1) * FR + s, d = (h + 1) * FR + s2;
        idx.push(a, c, b, b, c, d);
      }
    }
    geo.setIndex(idx);

    const uv = geo.attributes.uv.array;
    for (let h = 0; h < FH; h++) {
      for (let s = 0; s < FR; s++) {
        const i = (h * FR + s) * 2;
        uv[i] = s / FR;
        uv[i + 1] = h / (FH - 1);
      }
    }

    funnelMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uSpin: { value: 0 },
        uDust: { value: new THREE.Color(0x6d6152) },
        uCloud: { value: new THREE.Color(0xbcc4d2) },
        uOpacity: { value: 0.9 },
        uGrit: { value: 0.0 },
        uAxis: { value: new THREE.Vector2() },   // vortex centre, world xz
        uTopDown: { value: 0.0 },                // 1 when looking down the axis
        uAsym: { value: 0.0 }                    // which flank is loaded
      },
      vertexShader: `
        attribute float aFade;
        uniform vec2 uAxis;
        varying vec2 vUv; varying float vFade; varying vec3 vN; varying vec3 vV;
        void main(){
          vUv = uv; vFade = aFade;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          /* The lathe carries no normal attribute, and for a surface of
             revolution the outward normal is simply the radial direction
             from the axis - which is cheaper than storing one and stays
             correct as the geometry is rewritten every frame. */
          vec2 radial = wp.xz - uAxis;
          float rl = max(length(radial), 0.0001);
          vN = vec3(radial.x / rl, 0.0, radial.y / rl);
          vV = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `
        precision highp float;
        uniform float uTime, uSpin, uOpacity, uGrit, uTopDown, uAsym;
        uniform vec3 uDust, uCloud;
        varying vec2 vUv; varying float vFade; varying vec3 vN; varying vec3 vV;

        const float TAU = 6.28318530718;

        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vnoise(vec2 p){
          vec2 i = floor(p), f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
                     mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
        }
        float fbm(vec2 p){
          float v = 0.0, a = 0.5;
          for(int i = 0; i < 5; i++){ v += a * vnoise(p); p *= 2.03; a *= 0.5; }
          return v;
        }

        /* One helical sheet. "bands" sets how many wraps appear around the
           circumference, "pitch" how steeply they climb, "sharp" how tight
           the filament is.

           "spin" is an ANGLE in radians and is applied inside the band
           multiplier, so the whole sheet is rotated bodily about the axis
           and every sheet turns at the same angular rate whatever its
           wrap count. Adding a phase OUTSIDE the multiplier instead — as
           this did — divides the rotation by the number of bands, which
           is how a vortex ended up taking eight minutes to turn once.

           The sign is (ang + spin), not minus: the lathe maps sim(x, y)
           to three(x, -y), so increasing the shader's angle travels
           CLOCKWISE over the ground. The vortex turns counter-clockwise. */
        float helix(float ang, float z, float bands, float pitch, float spin, float sharp){
          float h = sin(bands * (ang + spin) - z * pitch);
          return pow(max(h, 0.0), sharp);
        }

        void main(){
          float ang = vUv.x * TAU;
          float z = vUv.y;

          /* Rotation you can actually see. A tornado is not a cylinder of
             fog: it is a small number of coherent filaments wound around
             the axis, climbing as they turn, brightening and thinning as
             they go. Three coarse sheets carry the motion; two finer ones
             break them up so they never read as painted stripes. */
          /* Differential rotation: air nearer the core comes round faster,
             and the funnel is wider aloft, so the top lags the bottom.
             That lag is what makes the sheets read as a corkscrew rather
             than as stripes painted on a spinning cylinder. */
          float lag = 1.0 - 0.22 * z;

          /* Pitch is deliberately steep. Rotating an inclined helix makes
             it APPEAR to climb — the barber-pole illusion — at a rate of
             bands * omega / pitch, while the horizontal rate is just
             omega. A shallow pitch therefore reads as a column of rising
             smoke no matter how fast it is actually turning. Keeping
             pitch well above bands * cloudBase / Rmax puts the apparent
             motion where the real motion is: around the axis. Real funnel
             striations are near-horizontal for the same reason. */
          /* Few bands, steep pitch. Fewer wraps around the circumference
             keeps each sheet a coherent filament rather than fine texture,
             and it lowers the apparent climb as well, since that scales
             with the band count too. */
          float f1 = helix(ang, z,  2.0, 22.0, uSpin * lag,               2.0);
          float f2 = helix(ang, z,  3.0, 30.0, uSpin * lag * 1.14 + 0.7,  2.6);
          float f3 = helix(ang, z,  2.0, 15.0, uSpin * lag * 0.86 + 2.1,  1.5);
          float fine = helix(ang, z, 6.0, 44.0, uSpin * lag * 1.31 + 0.4, 3.4);

          float strands = f1 * 0.55 + f2 * 0.34 + f3 * 0.42 + fine * 0.20;

          // Filaments should not all be equally bright at once.
          float breathe = 0.62 + 0.38 * sin(uTime * 0.55 + z * 3.1);
          strands *= breathe;

          /* Asymmetry. Real funnels are lopsided - one flank carries more
             condensate than the other, and it drifts round slowly. */
          float lop = 0.72 + 0.52 * cos(ang + uAsym);
          strands *= lop;

          /* Turbulence carried around by the flow. Sampled on a circle in
             noise space so it wraps seamlessly at the uv seam, rotated
             with the filaments, and with only a slight upward drift left
             in — air does rise, but a vertical scroll fast enough to be
             the dominant motion is what made this look like smoke going
             up a chimney rather than a vortex turning. */
          float a2 = ang + uSpin;
          vec2 p = vec2(cos(a2), sin(a2)) * 2.4 + vec2(0.0, z * 3.4 - uTime * 0.05);
          float n = fbm(p * 1.6);
          float n2 = fbm(p * 4.1 + 11.3);

          vec3 c = mix(uDust, uCloud, smoothstep(0.02, 0.62, z));
          c *= 0.66 + 0.62 * n + 0.22 * strands;
          c = mix(c, c * 0.55, uGrit * (1.0 - z));

          float a = vFade * uOpacity;
          // Filaments carry most of the opacity; the veil between them is
          // thin, which is what stops it reading as a solid shell.
          a *= clamp(0.52 + 1.05 * strands, 0.0, 1.7);
          a *= clamp(1.30 * n - 0.16, 0.0, 1.0);
          a *= 0.72 + 0.52 * n2;

          /* Soften the silhouette. On a surface of revolution the rim is
             where the normal turns perpendicular to the view, and leaving
             it at full strength is exactly what made this read as a glass
             lampshade with a machined edge. */
          float facing = abs(dot(normalize(vN), normalize(vV)));
          a *= mix(0.52, 1.0, pow(facing, 0.55));

          /* Looking down the axis, every wall is edge-on at once and the
             funnel becomes an opaque disc covering the map. Step aside. */
          a *= 1.0 - 0.58 * uTopDown;

          if (a < 0.012) discard;
          gl_FragColor = vec4(c, clamp(a, 0.0, 1.0));
          #include <colorspace_fragment>
        }`
    });

    funnel = new THREE.Mesh(geo, funnelMat);
    funnel.frustumCulled = false;
    funnel.renderOrder = 6;
    scene.add(funnel);
  }

  /* ── The dust skirt ──────────────────────────────────────────────────
     The debris cloud at the base, and the single most under-drawn part of
     a tornado. It is wider than the condensation funnel, it is present
     whenever the surface wind is strong enough to lift material, and it
     does not care in the least whether the funnel has condensed. A rope
     tornado under a high cloud base can be almost invisible aloft while
     this is churning at the ground — which is precisely the thing the
     whole console is trying to teach. */

  function buildSkirt() {
    const geo = new THREE.CylinderGeometry(1, 0.62, 1, 40, 6, true);
    geo.translate(0, 0.5, 0);
    skirtMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 }, uSpin: { value: 0 },
        uOpacity: { value: 0 },
        uColor: { value: new THREE.Color(0x6b5c47) },
        uAxis: { value: new THREE.Vector2() },
        uTopDown: { value: 0.0 }
      },
      vertexShader: `
        uniform vec2 uAxis;
        varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main(){
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vec2 radial = wp.xz - uAxis;
          float rl = max(length(radial), 0.0001);
          vN = vec3(radial.x / rl, 0.0, radial.y / rl);
          vV = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `
        precision highp float;
        uniform float uTime, uSpin, uOpacity, uTopDown; uniform vec3 uColor;
        varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float vnoise(vec2 p){
          vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
                     mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
        }
        float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<4;i++){ v+=a*vnoise(p); p*=2.07; a*=0.5; } return v; }
        void main(){
          float a2 = vUv.x * 6.28318530718 + uSpin;
          vec2 p = vec2(cos(a2), sin(a2)) * 2.2 + vec2(0.0, vUv.y * 2.2 - uTime * 0.04);
          float n = fbm(p * 2.0);
          // Densest at the ground, thinning upward: material is being
          // lifted, so there is always less of it higher up.
          float a = uOpacity * (1.0 - smoothstep(0.0, 0.78, vUv.y));
          a *= clamp(1.85 * n - 0.42, 0.0, 1.0);
          // Same treatment as the funnel: soften the silhouette, and get
          // out of the way when the camera looks down the axis.
          float facing = abs(dot(normalize(vN), normalize(vV)));
          a *= mix(0.28, 1.0, pow(facing, 0.6));
          a *= 1.0 - 0.72 * uTopDown;
          if (a < 0.012) discard;
          gl_FragColor = vec4(uColor * (0.68 + 0.5 * n), clamp(a, 0.0, 0.85));
          #include <colorspace_fragment>
        }`
    });
    skirt = new THREE.Mesh(geo, skirtMat);
    skirt.frustumCulled = false;
    skirt.renderOrder = 5;
    scene.add(skirt);
  }

  function updateSkirt(sim, dt) {
    // Lifting begins around 30 m/s over erodible ground; below that the
    // surface simply is not being scoured and there is nothing to show.
    const lift = clamp((sim.vmax - 26) / 30, 0, 1);
    const load = 0.28 + sim.params.debrisLoading * 0.9;
    skirtMat.uniforms.uOpacity.value = lift * load * 0.80;
    skirtMat.uniforms.uTime.value = clockT;
    // Same true angular rate as the funnel: the dust is in the same flow.
    skirtMat.uniforms.uSpin.value += (sim.vmax / Math.max(sim.rmax, 1)) * dt;
    skirtMat.uniforms.uAxis.value.set(sim.center.x, -sim.center.y);
    skirtMat.uniforms.uTopDown.value = topDownFactor();

    // Pulled in: at 1.9x Rmax on a wedge this was a 1.6 km shell standing
    // between the camera and the tornado.
    const r = sim.rmax * (1.10 + lift * 0.34);
    const h = clamp(sim.rmax * 1.1 + sim.vmax * 1.5, 40, 460);
    skirt.position.set(sim.center.x, 0, -sim.center.y);
    skirt.scale.set(r, h, r);
  }

  function updateFunnel(sim, dt) {
    const geo = funnel.geometry;
    const pos = geo.attributes.position.array;
    const fade = geo.attributes.aFade.array;
    const d = sim.derived;
    const top = d.cloudBase;
    const cx = sim.center.x, cz = -sim.center.y;

    // Spin the texture at the actual tangential rate at Rmax, so the
    // apparent rotation is the vortex's rather than a chosen constant.
    const omega = sim.vmax / Math.max(sim.rmax, 1);
    clockT += dt;
    funnelMat.uniforms.uTime.value = clockT;
    /* The genuine angular rate of the air at Rmax, with no fudge factor.
       A 160 m cone at 58 m/s comes round in about 17 s; a 750 m wedge
       takes nearer a minute, which is exactly why wedges look majestic
       and ropes look frantic. */
    funnelMat.uniforms.uSpin.value += omega * dt;
    funnelMat.uniforms.uGrit.value = clamp(sim.debrisLoad * 1.4, 0, 1);
    funnelMat.uniforms.uAxis.value.set(cx, cz);
    funnelMat.uniforms.uTopDown.value = topDownFactor();
    // The loaded flank drifts round slowly rather than sitting still.
    funnelMat.uniforms.uAsym.value = clockT * 0.21 + sim.heading * 0.017;

    // Fade the whole thing out as the vortex dies rather than popping it.
    funnelMat.uniforms.uOpacity.value = clamp(sim.vmax / 26, 0, 1) * 0.80;

    for (let h = 0; h < FH; h++) {
      const t = h / (FH - 1);
      const z = t * top;
      let r = sim.funnelRadiusAt(z);

      // Below the condensation floor there is no funnel — but there IS a
      // debris cloud, and it is wider than the funnel ever is. Showing
      // the gap is the point, so we do not quietly fill it in.
      let vis;
      if (z < sim.funnelBase) {
        vis = 0;
        r = Math.max(r, sim.rmax * 0.35);
      } else {
        vis = clamp((z - sim.funnelBase) / Math.max(top * 0.06, 30), 0, 1);
      }
      // Soften the very top where it merges into the wall cloud.
      // All the way to zero: leaving 25% here left a hard circular rim at
      // cloud base, which was half of the "glass lampshade" look.
      vis *= 1 - smoothstepf(0.72, 1.0, t);

      // Downshear tilt, plus a sinuous wander that grows as it ropes out.
      const leanX = sim.tilt.x * t, leanY = sim.tilt.y * t;
      const wob = Math.sin(t * 5.2 + clockT * 0.7) * sim.rmax * 0.22 * t;

      for (let s = 0; s < FR; s++) {
        const a = (s / FR) * Math.PI * 2;
        const i = (h * FR + s) * 3;
        pos[i] = cx + leanX + wob + Math.cos(a) * r;
        pos[i + 1] = z;
        pos[i + 2] = cz - leanY + Math.sin(a) * r;
        fade[h * FR + s] = vis;
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aFade.needsUpdate = true;
    geo.computeBoundingSphere();
  }

  /* How nearly the camera is looking straight down the vortex axis. Every
     wall of a surface of revolution turns edge-on at once from up there,
     so the funnel stacks into an opaque disc that covers the landscape it
     is supposed to be crossing. */
  function topDownFactor() {
    return clamp((cam.el - 0.45) / 0.75, 0, 1);
  }

  function smoothstepf(a, b, x) {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }


  /* ── Debris ──────────────────────────────────────────────────────── */

  const DEB_MAX = 2600;

  function buildDebris() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DEB_MAX * 3), 3)
      .setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(DEB_MAX), 1)
      .setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aTint', new THREE.BufferAttribute(new Float32Array(DEB_MAX), 1)
      .setUsage(THREE.DynamicDrawUsage));
    geo.setDrawRange(0, 0);

    debrisMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uScale: { value: 600 } },
      vertexShader: `
        attribute float aSize; attribute float aTint;
        uniform float uScale;
        varying float vTint; varying float vDepth;
        void main(){
          vTint = aTint;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vDepth = -mv.z;
          gl_PointSize = max(1.5, aSize * uScale / max(vDepth, 1.0));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying float vTint; varying float vDepth;
        void main(){
          vec2 d = gl_PointCoord - 0.5;
          float r = dot(d, d);
          if (r > 0.25) discard;
          float a = (1.0 - r * 4.0);
          // 0 = soil dust, 0.5 = vegetation, 1 = structural debris
          vec3 dust = vec3(0.45, 0.38, 0.29);
          vec3 veg  = vec3(0.28, 0.36, 0.21);
          vec3 str  = vec3(0.55, 0.51, 0.47);
          vec3 c = vTint < 0.5 ? mix(dust, veg, vTint * 2.0)
                               : mix(veg, str, (vTint - 0.5) * 2.0);
          gl_FragColor = vec4(c, a * 0.72);
          #include <colorspace_fragment>
        }`
    });
    debrisPts = new THREE.Points(geo, debrisMat);
    debrisPts.frustumCulled = false;
    debrisPts.renderOrder = 7;
    scene.add(debrisPts);
  }

  const TINT = { dust: 0.0, vegetation: 0.5, structure: 1.0 };

  function updateDebris(sim) {
    const list = sim.debris || [];
    const geo = debrisPts.geometry;
    const pos = geo.attributes.position.array;
    const sz = geo.attributes.aSize.array;
    const tn = geo.attributes.aTint.array;
    const n = Math.min(list.length, DEB_MAX);
    for (let i = 0; i < n; i++) {
      const p = list[i];
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.z; pos[i * 3 + 2] = -p.y;
      sz[i] = p.size * (p.settled ? 0.5 : 1);
      tn[i] = TINT[p.kind] || 0;
    }
    geo.setDrawRange(0, n);
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aSize.needsUpdate = true;
    geo.attributes.aTint.needsUpdate = true;
  }


  /* ── The parent storm ────────────────────────────────────────────────
     A rotating base, a wall cloud lowered beneath the mesocyclone, and a
     precipitation curtain whose opacity comes straight from the precip
     parameter. At high values the curtain genuinely hides the tornado,
     which is what "rain-wrapped" means and why it is dangerous. */

  function buildStorm() {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 512;
    const g = cv.getContext('2d');
    const img = g.createImageData(512, 512);
    // Value-noise cloud base, generated once.
    const rng = TS.makeRNG(4242);
    const grid = 64, cells = [];
    for (let i = 0; i < (grid + 1) * (grid + 1); i++) cells.push(rng());
    const sample = (x, y) => {
      const gx = x * grid, gy = y * grid;
      const ix = Math.floor(gx), iy = Math.floor(gy);
      const fx = gx - ix, fy = gy - iy;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const at = (a, b) => cells[(Math.min(b, grid)) * (grid + 1) + Math.min(a, grid)];
      return lerp(lerp(at(ix, iy), at(ix + 1, iy), sx),
        lerp(at(ix, iy + 1), at(ix + 1, iy + 1), sx), sy);
    };
    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        let v = 0, a = 0.5, f = 1;
        for (let o = 0; o < 4; o++) { v += a * sample((x / 512) * f % 1, (y / 512) * f % 1); a *= 0.5; f *= 2; }
        const i = (y * 512 + x) * 4;
        const c = 44 + v * 74;
        img.data[i] = c * 0.94; img.data[i + 1] = c * 0.97; img.data[i + 2] = c * 1.10;
        img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(20, 20);

    const baseGeo = new THREE.CircleGeometry(64000, 64);
    baseGeo.rotateX(Math.PI / 2);
    cloudBase = new THREE.Mesh(baseGeo, new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0.97, side: THREE.DoubleSide, fog: true
    }));
    cloudBase.renderOrder = 2;
    scene.add(cloudBase);

    /* The wall cloud: a lowered mass of cloud beneath the mesocyclone,
       and the feature a chaser actually watches for. As a bare cylinder
       it read as a hard-edged polygon slab, so it is a soft blob instead
       - a flattened sphere whose alpha falls away at the silhouette, so
       it has no outline of its own at any angle. */
    const wallGeo = new THREE.SphereGeometry(1, 32, 20);
    const wallMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.FrontSide,
      uniforms: {
        uTime: { value: 0 }, uSpin: { value: 0 },
        uColor: { value: new THREE.Color(0x59616f) },
        uOpacity: { value: 0.85 }
      },
      vertexShader: `
        varying vec3 vN; varying vec3 vV; varying vec2 vUv;
        void main(){
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vN = normalize(mat3(modelMatrix) * normal);
          vV = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `
        precision highp float;
        uniform float uTime, uSpin, uOpacity; uniform vec3 uColor;
        varying vec3 vN; varying vec3 vV; varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float vnoise(vec2 p){
          vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
                     mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
        }
        float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*vnoise(p); p*=2.05; a*=0.5; } return v; }
        void main(){
          float n = fbm(vec2(vUv.x * 8.0 + uSpin, vUv.y * 4.0 - uTime * 0.05) * 1.4);
          // Fade toward the silhouette so the sphere never shows an edge.
          float facing = pow(clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 0.75);
          // Heavier and darker underneath, which is what a lowering looks like.
          float under = mix(1.0, 0.45, smoothstep(0.35, 0.95, vUv.y));
          float a = uOpacity * facing * under * clamp(1.5 * n - 0.16, 0.0, 1.0);
          if (a < 0.012) discard;
          gl_FragColor = vec4(uColor * (0.66 + 0.62 * n), clamp(a, 0.0, 0.94));
          #include <colorspace_fragment>
        }`
    });
    wallCloud = new THREE.Mesh(wallGeo, wallMat);
    wallCloud.frustumCulled = false;
    wallCloud.renderOrder = 3;
    scene.add(wallCloud);

    /* The rain curtain. It was previously a bare double-sided cylinder
       excluded from fog, which drew a hard unfogged band right across the
       horizon. A curtain needs soft top and bottom edges, needs to be
       fogged like everything else, and only wants one face - drawing both
       doubles the blend and stops it reading as rain. */
    const pcv = document.createElement('canvas');
    pcv.width = 256; pcv.height = 256;
    const pg = pcv.getContext('2d');
    const prng = TS.makeRNG(9182);
    pg.clearRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) {
      const x = prng() * 256, y = prng() * 256;
      const len = prng.range(10, 46);
      pg.strokeStyle = 'rgba(190,205,225,' + prng.range(0.05, 0.30).toFixed(3) + ')';
      pg.lineWidth = prng.range(0.6, 2.1);
      pg.beginPath(); pg.moveTo(x, y); pg.lineTo(x + prng.range(-3, 3), y + len); pg.stroke();
    }
    // Fade the ends so the curtain has no visible rim.
    const grad = pg.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.18, 'rgba(0,0,0,0)');
    grad.addColorStop(0.82, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,1)');
    pg.globalCompositeOperation = 'destination-out';
    pg.fillStyle = grad; pg.fillRect(0, 0, 256, 256);

    const ptex = new THREE.CanvasTexture(pcv);
    ptex.colorSpace = THREE.SRGBColorSpace;
    ptex.wrapS = ptex.wrapT = THREE.RepeatWrapping;
    ptex.repeat.set(14, 2);

    const pGeo = new THREE.CylinderGeometry(1, 1.12, 1, 40, 1, true);
    precipMesh = new THREE.Mesh(pGeo, new THREE.MeshBasicMaterial({
      map: ptex, transparent: true, opacity: 0.2, color: 0xaebccd,
      side: THREE.BackSide, depthWrite: false, fog: true
    }));
    precipMesh.renderOrder = 4;
    scene.add(precipMesh);
  }

  function updateStorm(sim, dt) {
    const d = sim.derived;
    const base = d.cloudBase;

    cloudBase.position.set(sim.center.x * 0.25, base + 40, -sim.center.y * 0.25);
    cloudBase.rotation.y += dt * 0.006;

    // The wall cloud sits under the mesocyclone, just upshear of the
    // tornado, and lowers as the cloud base does.
    wallCloud.position.set(
      sim.center.x - sim.dir.x * sim.rmax * 0.8,
      base - 90,
      -(sim.center.y - sim.dir.y * sim.rmax * 0.8));
    wallCloud.rotation.y -= dt * 0.13;
    wallCloud.material.uniforms.uTime.value = clockT;
    wallCloud.material.uniforms.uSpin.value += dt * 0.16;
    const wr = clamp(sim.rmax * 3.0, 480, 1900);
    wallCloud.scale.set(wr, clamp(base * 0.22, 90, 420), wr);

    // Precipitation wraps around from the storm-relative upwind side.
    const wrap = d.storm ? d.storm.wrap : 0.4;
    precipMesh.material.opacity = 0.10 + wrap * 0.85;
    // Wrapped AROUND the circulation rather than parked on the horizon:
    // that is what makes a tornado rain-wrapped instead of merely rainy.
    const off = lerp(1500, 260, wrap);
    precipMesh.position.set(
      sim.center.x + sim.dir.y * off - sim.dir.x * off * 0.4,
      base * 0.46,
      -(sim.center.y - sim.dir.x * off - sim.dir.y * off * 0.4));
    const pr = lerp(2400, 1050, wrap);
    precipMesh.scale.set(pr, base * 1.05, pr);
    precipMesh.rotation.y += dt * 0.05;

    // Under a low, wet base the world goes dim and green.
    const gloom = clamp(wrap * 0.85 + (1 - clamp(base / 1600, 0, 1)) * 0.35, 0, 1);
    hemi.intensity = lerp(1.65, 0.78, gloom);
    sunLight.intensity = lerp(1.15, 0.28, gloom);
    hemi.color.setHex(0x8fa4bd).lerp(new THREE.Color(0x8a9166), gloom * 0.55);
    scene.fog.density = lerp(0.00011, 0.00046, gloom);

    /* One horizon colour, shared. The ground fades into fog, the cloud
       deck fades into fog, and the sky fades to its haze tone - if those
       are three separately-chosen colours, every place they meet shows a
       seam. Driving the fog and the sky's haze from the same value means
       there is nothing for a seam to form between. */
    HORIZON.setHex(0x7c8598).lerp(new THREE.Color(0x5d6459), gloom * 0.72);
    scene.fog.color.copy(HORIZON);
    if (skyMat) skyMat.uniforms.uHaze.value.copy(HORIZON);
  }


  /* ═══════════════════════════════════════════════════════════════════
     CAMERA DIRECTOR

     Five named vantages plus free orbit. Each is a spherical offset from
     the tornado, so they track it without the user having to chase.
     Stock OrbitControls does not exist in the classic build, and would
     not have suited this anyway — the presets are the point.
     ═══════════════════════════════════════════════════════════════════ */

  const cam = {
    view: 'chase',
    az: 2.3, el: 0.16, dist: 1500, height: 90,
    tAz: 2.3, tEl: 0.16, tDist: 1500, tHeight: 90,
    target: new THREE.Vector3(),
    lookHeight: 260,
    tLookHeight: 260,
    dragging: false, px: 0, py: 0, userAz: null
  };
  R.cam = cam;

  const VIEWS = {
    chase:  { dist: 1700, el: 0.13, height: 60,   look: 320, relAz: 2.35 },
    ground: { dist: 340,  el: 0.05, height: 2,    look: 420, relAz: 2.1 },
    aerial: { dist: 1150, el: 0.86, height: 1250, look: 120, relAz: 2.6 },
    orbit:  { dist: 1300, el: 0.30, height: 220,  look: 300, relAz: null },
    plan:   { dist: 60,   el: 1.50, height: 3000, look: 0,   relAz: 2.0 }
  };

  R.setView = function (name) {
    if (!VIEWS[name]) return;
    cam.view = name;
    const v = VIEWS[name];
    cam.tDist = v.dist; cam.tEl = v.el; cam.tHeight = v.height; cam.tLookHeight = v.look;
    if (v.relAz !== null) cam.userAz = null;
    else if (cam.userAz === null) cam.userAz = cam.az;
  };

  function installCameraControls() {
    const el = canvas;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', (e) => {
      cam.dragging = true; cam.px = e.clientX; cam.py = e.clientY;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!cam.dragging) return;
      const dx = e.clientX - cam.px, dy = e.clientY - cam.py;
      cam.px = e.clientX; cam.py = e.clientY;
      if (cam.userAz === null) cam.userAz = cam.az;
      cam.userAz -= dx * 0.005;
      cam.tEl = clamp(cam.tEl + dy * 0.004, 0.012, 1.5);
      cam.view = 'orbit';
      if (R.onViewChange) R.onViewChange('orbit');
    });
    const stop = (e) => { cam.dragging = false; try { el.releasePointerCapture(e.pointerId); } catch (_) {} };
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      cam.tDist = clamp(cam.tDist * (1 + Math.sign(e.deltaY) * 0.12), 90, 9000);
    }, { passive: false });
  }

  function updateCamera(sim, dt) {
    const v = VIEWS[cam.view] || VIEWS.chase;
    const base = sim.derived.cloudBase;
    // Named views sit at a fixed bearing relative to the direction of
    // travel, so the tornado crosses the frame instead of fleeing it.
    const heading = Math.atan2(sim.dir.x, sim.dir.y);
    const wantAz = cam.userAz !== null ? cam.userAz : heading + (v.relAz || 0);

    const k = 1 - Math.pow(0.0016, dt);       // frame-rate independent ease
    cam.az += shortestAngle(cam.az, wantAz) * k;
    cam.el += (cam.tEl - cam.el) * k;
    // Stand off in proportion to the thing being looked at, so a wedge is
    // framed instead of swallowing the camera.
    const sizeScale = cam.view === 'plan' ? 1 : clamp(0.62 + sim.rmax / 250, 0.62, 3.4);
    cam.dist += (cam.tDist * sizeScale - cam.dist) * k;
    // The aerial vantage is meant to be under the storm looking down, not
    // above it looking at the top of a cloud deck. Cloud base moves with
    // the moisture, so the ceiling has to move with it.
    const wantH = cam.view === 'plan' ? cam.tHeight
      : Math.min(cam.tHeight, base * 0.72);
    cam.height += (wantH - cam.height) * k;
    cam.lookHeight += (cam.tLookHeight - cam.lookHeight) * k;

    const tx = sim.center.x, tz = -sim.center.y;
    cam.target.set(tx, cam.lookHeight, tz);

    const hor = Math.cos(cam.el) * cam.dist;
    let py = cam.height + Math.sin(cam.el) * cam.dist;

    /* Keep the camera underneath the cloud deck. Clamping the height
       OFFSET alone is not enough: elevation multiplied by stand-off
       distance adds on top of it, and under a low base that lifted the
       chase camera through the deck - at which point the whole storm was
       hidden and the shot became an empty sky. Only the plan view is
       meant to be above it. */
    if (cam.view !== 'plan') py = Math.min(py, Math.max(14, base - 70));
    if (py < 2) py = 2;                 // and never below the ground

    camera.position.set(tx + Math.sin(cam.az) * hor, py, tz + Math.cos(cam.az) * hor);
    camera.lookAt(cam.target);

    // Above the deck there is nothing to see but the back of it, so the
    // storm layers step aside and let the plan view work.
    const above = camera.position.y > base - 40;
    if (cloudBase) cloudBase.visible = !above;
    if (wallCloud) wallCloud.visible = !above;
    if (precipMesh) precipMesh.visible = !above;
  }

  function shortestAngle(from, to) {
    let d = (to - from) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
  }


  /* ═══════════════════════════════════════════════════════════════════
     FRAME
     ═══════════════════════════════════════════════════════════════════ */

  let scourAccum = 0;

  R.sync = function (sim, dt, opts) {
    simRef = sim;
    opts = opts || {};
    if (!world) return;

    updateFunnel(sim, dt);
    updateSkirt(sim, dt);
    updateDebris(sim);
    updateStorm(sim, dt);
    updateCamera(sim, dt);

    // Only structures whose damage actually changed need new instance
    // data; the rest are static after the first write.
    for (const di in structGroups) {
      const grp = structGroups[di];
      const list = grp.list;
      let dirty = false;
      for (let i = 0; i < list.length; i++) {
        if (grp.lastDod[i] !== list[i].dod) {
          grp.lastDod[i] = list[i].dod;
          setStructureInstance(di, i, true);
          dirty = true;
        }
      }
      if (dirty) {
        grp.body.instanceMatrix.needsUpdate = true;
        if (grp.body.instanceColor) grp.body.instanceColor.needsUpdate = true;
        if (grp.roof) {
          grp.roof.instanceMatrix.needsUpdate = true;
          if (grp.roof.instanceColor) grp.roof.instanceColor.needsUpdate = true;
        }
      }
    }

    // Trees change every frame while they are in the wind, so the cheap
    // test is on the bend value itself rather than on distance.
    for (const kind in treeGroups) {
      const grp = treeGroups[kind];
      const list = grp.list;
      let dirty = false;
      for (let i = 0; i < list.length; i++) {
        const t = list[i];
        const key = t.bend + t.dod * 10;
        if (Math.abs(grp.lastKey[i] - key) > 0.012) {
          grp.lastKey[i] = key;
          setTreeInstance(kind, i);
          dirty = true;
        }
      }
      if (dirty) {
        grp.mesh.instanceMatrix.needsUpdate = true;
        if (grp.mesh.instanceColor) grp.mesh.instanceColor.needsUpdate = true;
      }
    }

    if (opts.running && sim.vmax > 18) {
      scourAccum += dt;
      if (scourAccum > 0.5) { scourAccum = 0; pushScour(sim); }
    }
  };

  R.render = function () { if (renderer) renderer.render(scene, camera); };

  /* Rebuild the ribbon from the recorded centreline up to the sim's
     current time. Scrubbing backward has to erase the swath as well as
     the damage, or the ground keeps a memory of a future that has been
     rewound away. */
  R.rebuildScour = function (sim) {
    if (!scour) return;
    scourCount = 0;
    scour.geometry.setDrawRange(0, 0);
    const saveC = { x: sim.center.x, y: sim.center.y };
    const saveR = sim.rmax, saveV = sim.vmax;
    for (const p of sim.path) {
      if (p.t > sim.t) break;
      sim.center.x = p.x; sim.center.y = p.y;
      sim.rmax = p.rmax; sim.vmax = p.vmax;
      if (p.vmax > 18) pushScour(sim);
    }
    sim.center.x = saveC.x; sim.center.y = saveC.y;
    sim.rmax = saveR; sim.vmax = saveV;
  };

  R.setSwathVisible = function (v) { if (scour) scour.visible = v; };

  R.resetScour = function () {
    if (!scour) return;
    scourCount = 0;
    scour.geometry.setDrawRange(0, 0);
  };

  /* Screen projection, so the 2D overlay canvas can draw field data in
     the right place without duplicating the camera maths. */
  R.project = function (x, y, z, out) {
    V.set(x, z || 0, -y).project(camera);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    out = out || {};
    out.x = (V.x * 0.5 + 0.5) * w;
    out.y = (-V.y * 0.5 + 0.5) * h;
    out.visible = V.z < 1;
    return out;
  };

  /* Ray-pick a structure, for the click-to-inspect panel. */
  const _ray = new THREE.Raycaster();
  const _ndc = new THREE.Vector2();

  R.pick = function (clientX, clientY) {
    if (!world) return null;
    const rect = canvas.getBoundingClientRect();
    _ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    _ray.setFromCamera(_ndc, camera);

    let best = null, bestD = Infinity;
    for (const di in structGroups) {
      const grp = structGroups[di];
      const hits = _ray.intersectObject(grp.body, false);
      if (hits.length && hits[0].distance < bestD) {
        bestD = hits[0].distance;
        best = grp.list[hits[0].instanceId];
      }
    }
    for (const kind in treeGroups) {
      const grp = treeGroups[kind];
      const hits = _ray.intersectObject(grp.mesh, false);
      if (hits.length && hits[0].distance < bestD) {
        bestD = hits[0].distance;
        best = grp.list[hits[0].instanceId];
      }
    }
    return best;
  };

  R.scene = () => scene;
  R.camera = () => camera;
  R.renderer = () => renderer;

})(window.TS);
