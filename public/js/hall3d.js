/* 2026-11-08: WebGL Hall of Legends aisle.
   Matches the in-game hall (gallery hall-aisle.jpg / hall-interior.jpg):
   stone-brick nave, red carpet, red-nether pillars, hanging lanterns,
   soul-lantern cyan, 3-block stone pedestals, gold hologram titles,
   Citizens-style 3D skins facing the aisle.
   24 real boards. Three.js from the import map. CSS ring is the fallback. */
import * as THREE from "three";

const SKIN = (typeof window !== "undefined" && window.NR && window.NR.skin) || "https://mc-heads.net/skin";
const PX = 1 / 16;
const PED_H = 0.92;
const HALL_HALF = 8.4;
const Z_MIN = -27;
const Z_MAX = 24;
const SPACING = 3.55;

function pixelTex(a, b, n, seed, repeatX, repeatY) {
  const c = document.createElement("canvas");
  c.width = c.height = n;
  const g = c.getContext("2d");
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const data = g.createImageData(n, n);
  for (let i = 0; i < n * n; i++) {
    const t = rnd();
    const j = i * 4;
    data.data[j] = pa[0] + (pb[0] - pa[0]) * t;
    data.data[j + 1] = pa[1] + (pb[1] - pa[1]) * t;
    data.data[j + 2] = pa[2] + (pb[2] - pa[2]) * t;
    data.data[j + 3] = 255;
  }
  g.putImageData(data, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function lambert(map, color) {
  return new THREE.MeshLambertMaterial({ map: map || null, color: color || 0xffffff });
}

function boxUV(w, h, d, faces) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const uv = geo.attributes.uv;
  for (let f = 0; f < 6; f++) {
    const [x, y, fw, fh] = faces[f];
    const u0 = x / 64;
    const u1 = (x + fw) / 64;
    const v1 = 1 - y / 64;
    const v0 = 1 - (y + fh) / 64;
    const i = f * 4;
    uv.setXY(i, u0, v1);
    uv.setXY(i + 1, u1, v1);
    uv.setXY(i + 2, u0, v0);
    uv.setXY(i + 3, u1, v0);
  }
  uv.needsUpdate = true;
  return geo;
}

function playerGeos() {
  // px nx py ny pz nz — Minecraft 64×64 Steve layout.
  const head = boxUV(8 * PX, 8 * PX, 8 * PX, [
    [16, 8, 8, 8],
    [0, 8, 8, 8],
    [8, 0, 8, 8],
    [16, 0, 8, 8],
    [8, 8, 8, 8],
    [24, 8, 8, 8]
  ]);
  const hat = boxUV(8.5 * PX, 8.5 * PX, 8.5 * PX, [
    [48, 8, 8, 8],
    [32, 8, 8, 8],
    [40, 0, 8, 8],
    [48, 0, 8, 8],
    [40, 8, 8, 8],
    [56, 8, 8, 8]
  ]);
  const body = boxUV(8 * PX, 12 * PX, 4 * PX, [
    [28, 20, 4, 12],
    [16, 20, 4, 12],
    [20, 16, 8, 4],
    [28, 16, 8, 4],
    [20, 20, 8, 12],
    [32, 20, 8, 12]
  ]);
  const rArm = boxUV(4 * PX, 12 * PX, 4 * PX, [
    [48, 20, 4, 12],
    [40, 20, 4, 12],
    [44, 16, 4, 4],
    [48, 16, 4, 4],
    [44, 20, 4, 12],
    [52, 20, 4, 12]
  ]);
  const lArm = boxUV(4 * PX, 12 * PX, 4 * PX, [
    [40, 52, 4, 12],
    [32, 52, 4, 12],
    [36, 48, 4, 4],
    [40, 48, 4, 4],
    [36, 52, 4, 12],
    [44, 52, 4, 12]
  ]);
  const rLeg = boxUV(4 * PX, 12 * PX, 4 * PX, [
    [8, 20, 4, 12],
    [0, 20, 4, 12],
    [4, 16, 4, 4],
    [8, 16, 4, 4],
    [4, 20, 4, 12],
    [12, 20, 4, 12]
  ]);
  const lLeg = boxUV(4 * PX, 12 * PX, 4 * PX, [
    [24, 52, 4, 12],
    [16, 52, 4, 12],
    [20, 48, 4, 4],
    [24, 48, 4, 4],
    [20, 52, 4, 12],
    [28, 52, 4, 12]
  ]);
  return { head, hat, body, rArm, lArm, rLeg, lLeg };
}

function addPart(group, geo, mat, x, y, z) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  group.add(m);
  return m;
}

function makePlayer(tex, geos) {
  const mat = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.08 });
  const hatMat = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.45 });
  const g = new THREE.Group();
  addPart(g, geos.head, mat, 0, 28 * PX, 0);
  addPart(g, geos.hat, hatMat, 0, 28 * PX, 0);
  addPart(g, geos.body, mat, 0, 18 * PX, 0);
  addPart(g, geos.rArm, mat, 6 * PX, 18 * PX, 0);
  addPart(g, geos.lArm, mat, -6 * PX, 18 * PX, 0);
  addPart(g, geos.rLeg, mat, 2 * PX, 6 * PX, 0);
  addPart(g, geos.lLeg, mat, -2 * PX, 6 * PX, 0);
  g.userData.disposeMats = [mat, hatMat];
  return g;
}

function loadSkin(name) {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      SKIN + "/" + encodeURIComponent(name),
      (tex) => {
        tex.magFilter = tex.minFilter = THREE.NearestFilter;
        tex.colorSpace = THREE.SRGBColorSpace;
        resolve(tex);
      },
      undefined,
      reject
    );
  });
}

function hologram(title, name, stat) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const g = c.getContext("2d");
  g.clearRect(0, 0, 512, 128);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = "rgba(0,0,0,0.85)";
  g.shadowBlur = 10;
  g.font = "700 34px Outfit, sans-serif";
  g.fillStyle = "#ffba08";
  g.fillText((title || "").toUpperCase(), 256, 32);
  g.font = "500 26px Outfit, sans-serif";
  g.fillStyle = name ? "#efe6d8" : "#9c9184";
  g.fillText(name || "unclaimed — be the first", 256, 68);
  if (stat) {
    g.font = "400 20px Outfit, sans-serif";
    g.fillStyle = "#c4b8a8";
    g.fillText(stat, 256, 100);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  sprite.scale.set(2.6, 0.65, 1);
  sprite.position.set(0, PED_H + 2.42, 0);
  sprite.userData.disposeMats = [sprite.material];
  sprite.userData.disposeTex = [tex];
  return sprite;
}

function makePedestal(stoneMat, chiselMat, soulMat, soulGlow, ironMat, chestMat, side) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, PED_H, 2.2), stoneMat);
  base.position.y = PED_H / 2;
  g.add(base);
  // In-game podiums are chiseled stone, not nether — keep the top gray.
  const cap = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.1, 2.28), chiselMat);
  cap.position.y = PED_H + 0.02;
  g.add(cap);
  const inward = -side;
  const cage = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.22), ironMat);
  cage.position.set(inward * 0.82, PED_H + 0.22, 0.82);
  g.add(cage);
  const glow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.12), soulGlow);
  glow.position.copy(cage.position);
  g.add(glow);
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 0.42), chestMat);
  chest.position.set(inward * -0.72, 0.24, 0.82);
  g.add(chest);
  return g;
}

export function mount(opts) {
  const view = opts.view;
  const order = opts.order || [];
  const cats = opts.cats || {};
  const onSelect = typeof opts.onSelect === "function" ? opts.onSelect : () => {};
  const formatStat = opts.formatStat || window.nrFormatStat || ((_, v) => String(v));

  const worldEl = document.getElementById("hall-world");
  if (worldEl) worldEl.hidden = true;

  // Build the renderer before the lighting overlay. A failed WebGL context
  // used to leave "Lighting the hall…" covering the CSS ring fallback.
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
      failIfMajorPerformanceCaveat: false
    });
    if (!renderer.getContext()) throw new Error("no webgl");
  } catch (err) {
    if (worldEl) worldEl.hidden = false;
    throw err;
  }

  view.classList.add("is-gl");
  const loadEl = document.createElement("p");
  loadEl.className = "hall-load";
  loadEl.textContent = "Lighting the hall…";
  view.appendChild(loadEl);
  view.appendChild(canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x0c0a08, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0a08);
  scene.fog = new THREE.Fog(0x16110e, 14, 52);

  const camera = new THREE.PerspectiveCamera(72, 1, 0.08, 80);
  camera.position.set(0, 1.55, -25.2);
  let yaw = 0;
  let pitch = -0.12;

  const stoneMap = pixelTex("#6a6560", "#4a4640", 16, 11, 18, 56);
  const wallMap = pixelTex("#5a5550", "#3a3632", 16, 23, 8, 6);
  const chiselMap = pixelTex("#5c5852", "#3e3a36", 16, 29, 2, 2);
  const netherMap = pixelTex("#6a1c1c", "#3a1010", 16, 41, 1, 8);
  const carpetMap = pixelTex("#b41e1e", "#7a1212", 16, 7, 1.2, 40);
  const woodMap = pixelTex("#5a3a22", "#3d2716", 8, 17, 1, 1);

  const unit = new THREE.BoxGeometry(1, 1, 1);
  const stoneMat = lambert(stoneMap);
  const wallMat = lambert(wallMap);
  const chiselMat = lambert(chiselMap);
  const netherMat = lambert(netherMap);
  const carpetMat = lambert(carpetMap);
  const woodMat = lambert(woodMap);
  const ironMat = new THREE.MeshLambertMaterial({ color: 0x2a2420 });
  const lanternMat = new THREE.MeshLambertMaterial({
    color: 0xffe0a0,
    emissive: 0xffb040,
    emissiveIntensity: 2.2
  });
  const soulMat = new THREE.MeshLambertMaterial({
    color: 0x1a4a4e,
    emissive: 0x1a6a70,
    emissiveIntensity: 0.6
  });
  const soulGlow = new THREE.MeshBasicMaterial({ color: 0x5ef0f4 });
  const bannerMat = new THREE.MeshLambertMaterial({ color: 0x8b1515, side: THREE.DoubleSide });
  const chainMat = new THREE.MeshLambertMaterial({ color: 0x1a1816 });

  function slab(w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(unit, mat);
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    scene.add(m);
    return m;
  }

  const hallLen = 56;
  slab(18, 0.2, hallLen, stoneMat, 0, -0.1, -2);
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(1.55, hallLen), carpetMat);
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.012, -2);
  scene.add(carpet);

  slab(0.55, 6.6, hallLen, wallMat, -HALL_HALF, 3.3, -2);
  slab(0.55, 6.6, hallLen, wallMat, HALL_HALF, 3.3, -2);
  slab(18, 6.6, 0.55, wallMat, 0, 3.3, -29.4);
  slab(18, 6.6, 0.55, wallMat, 0, 3.3, 25.4);
  slab(18.4, 0.4, hallLen, wallMat, 0, 6.55, -2);

  const geos = playerGeos();
  const groups = [];
  const rayHits = [];
  const lights = [];

  // Pillars sit against the walls BETWEEN pedestals, like the in-game nave.
  for (let k = -3; k <= 3; k++) {
    const z = -16.2 + k * 7.1;
    [-1, 1].forEach((side) => {
      const x = side * 7.25;
      slab(0.9, 6.4, 0.9, netherMat, x, 3.2, z);
      const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.3), bannerMat);
      banner.position.set(x - side * 0.48, 3.55, z);
      banner.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      scene.add(banner);
    });
  }

  for (let i = 0; i < 7; i++) {
    const z = -23 + i * 7.2;
    slab(0.06, 0.9, 0.06, chainMat, 0, 5.85, z);
    const cage = new THREE.Mesh(unit, ironMat);
    cage.scale.set(0.42, 0.42, 0.42);
    cage.position.set(0, 5.2, z);
    scene.add(cage);
    const glow = new THREE.Mesh(unit, lanternMat);
    glow.scale.set(0.26, 0.26, 0.26);
    glow.position.set(0, 5.2, z);
    scene.add(glow);
    if (i % 2 === 0) {
      const pl = new THREE.PointLight(0xffc078, 7.2, 18, 2);
      pl.position.set(0, 5.05, z);
      pl.userData.base = 7.2;
      scene.add(pl);
      lights.push(pl);
    }
  }

  scene.add(new THREE.AmbientLight(0xffe0c0, 0.32));
  const hemi = new THREE.HemisphereLight(0xffd0b0, 0x1a0808, 0.42);
  scene.add(hemi);
  const fill = new THREE.DirectionalLight(0xffd0b0, 0.28);
  fill.position.set(2, 8, 3);
  scene.add(fill);
  const soulA = new THREE.PointLight(0x3ee8e8, 2.4, 11, 2);
  soulA.position.set(-2.2, 1.4, -6);
  soulA.userData.base = 2.4;
  scene.add(soulA);
  lights.push(soulA);
  const soulB = new THREE.PointLight(0x3ee8e8, 2.4, 11, 2);
  soulB.position.set(2.2, 1.4, 8);
  soulB.userData.base = 2.4;
  scene.add(soulB);
  lights.push(soulB);

  const titleCanvas = hologram("Hall of Legends", "each statue is the #1 player", "");
  titleCanvas.position.set(0, 4.55, -7);
  titleCanvas.scale.set(3.5, 0.88, 1);
  scene.add(titleCanvas);

  const ringGeo = new THREE.RingGeometry(1.15, 1.32, 28);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffba08,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
  });

  order.forEach((key, i) => {
    const cat = cats[key] || {};
    const top = (cat.entries || [])[0];
    // Pair across the carpet like the in-game aisle (kills|deaths first).
    const side = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2);
    const z = -18 + row * SPACING;
    const x = side * 4.2;
    const group = makePedestal(stoneMat, chiselMat, soulMat, soulGlow, ironMat, woodMat, side);
    group.position.set(x, 0, z);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    ring.visible = false;
    group.add(ring);
    const stat = top ? formatStat(cat.format, top.value, cat.unit) : "";
    group.add(hologram(cat.title || key, top ? top.name : "", stat));
    group.userData.index = i;
    group.userData.ring = ring;
    group.userData.side = side;
    scene.add(group);
    groups.push(group);
    rayHits.push(group);

    if (top && top.name) {
      loadSkin(top.name)
        .then((tex) => {
          const player = makePlayer(tex, geos);
          player.position.y = PED_H;
          // Face the red carpet: west looks +X, east looks -X.
          player.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2;
          group.add(player);
          group.userData.player = player;
          group.userData.skinTex = tex;
        })
        .catch(() => {});
    }
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let selected = 0;
  let dragging = false;
  let moved = false;
  let lastX = 0;
  let lastY = 0;
  let follow = null;
  const keys = Object.create(null);
  const clock = new THREE.Clock();
  let raf = 0;
  let disposed = false;

  function applyLook() {
    const cy = Math.cos(pitch);
    camera.lookAt(
      camera.position.x + Math.sin(yaw) * cy,
      camera.position.y + Math.sin(pitch),
      camera.position.z + Math.cos(yaw) * cy
    );
  }
  applyLook();

  function resize() {
    const w = Math.max(1, view.clientWidth);
    const h = Math.max(1, view.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(view);

  function highlight(i) {
    selected = i;
    groups.forEach((g, j) => {
      if (g.userData.ring) g.userData.ring.visible = j === i;
    });
  }

  function select(i, walk) {
    if (i < 0 || i >= groups.length) return;
    highlight(i);
    const g = groups[i];
    if (walk) {
      const z = THREE.MathUtils.clamp(g.position.z - 3.35, Z_MIN, Z_MAX);
      follow = {
        x: 0,
        y: 1.62,
        z,
        yaw: Math.atan2(g.position.x * 0.55, g.position.z - z),
        pitch: -0.1
      };
    }
    onSelect(i);
  }

  function pick(ev) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(rayHits, true);
    if (!hits.length) return;
    let obj = hits[0].object;
    while (obj && obj.userData.index == null) obj = obj.parent;
    if (obj && obj.userData.index != null) select(obj.userData.index, true);
  }

  function onDown(e) {
    dragging = true;
    moved = false;
    follow = null;
    lastX = e.clientX;
    lastY = e.clientY;
    view.classList.add("is-drag");
    view.focus();
    try {
      view.setPointerCapture(e.pointerId);
    } catch (_) {}
  }
  function onMove(e) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    yaw -= dx * 0.0055;
    pitch = THREE.MathUtils.clamp(pitch - dy * 0.0042, -0.7, 0.55);
    lastX = e.clientX;
    lastY = e.clientY;
  }
  function onUp(e) {
    dragging = false;
    view.classList.remove("is-drag");
    try {
      view.releasePointerCapture(e.pointerId);
    } catch (_) {}
    if (!moved) pick(e);
  }
  function onWheel(e) {
    e.preventDefault();
    follow = null;
    const step = e.deltaY * 0.012;
    camera.position.z = THREE.MathUtils.clamp(camera.position.z + step, Z_MIN, Z_MAX);
  }
  function onKey(e, down) {
    const k = e.key.toLowerCase();
    if ("wasd".includes(k) || k === "arrowup" || k === "arrowdown" || k === "arrowleft" || k === "arrowright" || k === "shift") {
      keys[k] = down;
      if (k !== "shift") follow = null;
      e.preventDefault();
    }
  }

  view.addEventListener("pointerdown", onDown);
  view.addEventListener("pointermove", onMove);
  view.addEventListener("pointerup", onUp);
  view.addEventListener("pointercancel", onUp);
  view.addEventListener("wheel", onWheel, { passive: false });
  view.addEventListener("keydown", (e) => onKey(e, true));
  view.addEventListener("keyup", (e) => onKey(e, false));

  function tick() {
    if (disposed) return;
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    lights.forEach((l, i) => {
      l.intensity = l.userData.base * (1 + 0.07 * Math.sin(t * 3.1 + i * 1.7));
    });
    if (follow) {
      camera.position.x += (follow.x - camera.position.x) * 0.08;
      camera.position.y += (follow.y - camera.position.y) * 0.08;
      camera.position.z += (follow.z - camera.position.z) * 0.08;
      let dyaw = follow.yaw - yaw;
      while (dyaw > Math.PI) dyaw -= Math.PI * 2;
      while (dyaw < -Math.PI) dyaw += Math.PI * 2;
      yaw += dyaw * 0.08;
      pitch += (follow.pitch - pitch) * 0.08;
      if (Math.abs(follow.z - camera.position.z) < 0.04 && Math.abs(dyaw) < 0.02) follow = null;
    } else {
      const speed = (keys.shift ? 8 : 4.2) * dt;
      const cy = Math.cos(pitch);
      const fx = Math.sin(yaw) * cy;
      const fz = Math.cos(yaw) * cy;
      const rx = Math.cos(yaw);
      const rz = -Math.sin(yaw);
      let mx = 0;
      let mz = 0;
      if (keys.w || keys.arrowup) {
        mx += fx;
        mz += fz;
      }
      if (keys.s || keys.arrowdown) {
        mx -= fx;
        mz -= fz;
      }
      if (keys.a || keys.arrowleft) {
        mx -= rx;
        mz -= rz;
      }
      if (keys.d || keys.arrowright) {
        mx += rx;
        mz += rz;
      }
      if (mx || mz) {
        const len = Math.hypot(mx, mz) || 1;
        camera.position.x += (mx / len) * speed;
        camera.position.z += (mz / len) * speed;
      }
    }
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -5.4, 5.4);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, Z_MIN, Z_MAX);
    camera.position.y = 1.62;
    applyLook();
    renderer.render(scene, camera);
    // Drop the overlay on the first painted frame, not a sibling rAF —
    // background-tab / headless Chrome can skip that extra callback.
    if (loadEl.parentNode) {
      loadEl.remove();
      view.classList.add("is-ready");
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  function dispose() {
    disposed = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    view.removeEventListener("pointerdown", onDown);
    view.removeEventListener("pointermove", onMove);
    view.removeEventListener("pointerup", onUp);
    view.removeEventListener("pointercancel", onUp);
    view.removeEventListener("wheel", onWheel);
    renderer.dispose();
    canvas.remove();
    loadEl.remove();
    view.classList.remove("is-gl", "is-ready", "is-drag");
  }

  return { select, dispose, get selected() { return selected; } };
}
