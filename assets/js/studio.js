/* =====================================================================
   BE YOU — Monogram Studio
   A live preview of a logo hot-stamped (foil), debossed or embossed into
   leather. WebGL 1, no libraries: the piece, stitching, hardware and the
   mark are drawn with Canvas 2D, blurred on the CPU into height maps,
   packed into two RGBA textures and lit per pixel by a moving light.
   ===================================================================== */
window.BYStudio = (() => {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lin = c => Math.pow(c / 255, 2.2);
  const lin3 = rgb => rgb.map(lin);
  const lerp = (a, b, t) => a + (b - a) * t;

  const LEATHERS = {
    espresso: { name: 'Espresso', rgb: [70, 46, 32] },
    noir:     { name: 'Noir',     rgb: [30, 27, 26] },
    cognac:   { name: 'Cognac',   rgb: [146, 80, 40] },
    tan:      { name: 'Tan',      rgb: [184, 130, 76] },
    oxblood:  { name: 'Oxblood',  rgb: [92, 30, 32] },
    navy:     { name: 'Navy',     rgb: [32, 44, 62] },
    olive:    { name: 'Olive',    rgb: [66, 68, 40] },
  };
  const FINISHES = {
    gold:   { name: 'Gold foil',    foil: [236, 196, 116], metal: 1, depth: -0.62 },
    silver: { name: 'Silver foil',  foil: [222, 224, 228], metal: 1, depth: -0.62 },
    rose:   { name: 'Rose gold',    foil: [238, 170, 146], metal: 1, depth: -0.62 },
    blind:  { name: 'Blind deboss', foil: [120, 100, 80],  metal: 0, depth: -1.0 },
    emboss: { name: 'Embossed',     foil: [120, 100, 80],  metal: 0, depth: 0.85 },
  };
  const OBJECTS = { folio: 'Document folio', wallet: 'Wallet', passport: 'Passport cover', tag: 'Luggage tag', sleeve: 'Laptop sleeve' };
  const FONTS = {
    classic: { family: 'Bodoni Moda', weight: 600, spacing: 0.14, upper: true, size: 1 },
    didone:  { family: 'Bodoni Moda', weight: 500, italic: true, spacing: 0.01, size: 1.05 },
    modern:  { family: 'Jost', weight: 500, spacing: 0.24, upper: true, size: 0.92 },
    script:  { family: 'Pinyon Script', weight: 400, spacing: 0, size: 1.35 },
  };

  /* ---------------- CPU image helpers ---------------- */
  function boxH(src, dst, w, h, r) {
    const k = 1 / (2 * r + 1);
    for (let y = 0; y < h; y++) {
      const o = y * w;
      let acc = (r + 1) * src[o];
      for (let i = 1; i <= r; i++) acc += src[o + Math.min(i, w - 1)];
      for (let x = 0; x < w; x++) {
        dst[o + x] = acc * k;
        acc += src[o + Math.min(x + r + 1, w - 1)] - src[o + Math.max(x - r, 0)];
      }
    }
  }
  function boxV(src, dst, w, h, r) {
    const k = 1 / (2 * r + 1);
    for (let x = 0; x < w; x++) {
      let acc = (r + 1) * src[x];
      for (let i = 1; i <= r; i++) acc += src[Math.min(i, h - 1) * w + x];
      for (let y = 0; y < h; y++) {
        dst[y * w + x] = acc * k;
        acc += src[Math.min(y + r + 1, h - 1) * w + x] - src[Math.max(y - r, 0) * w + x];
      }
    }
  }
  /* repeated box blur ≈ gaussian; returns a new array */
  function blur(src, w, h, r, passes = 3) {
    r = Math.max(0, Math.round(r));
    const a = new Float32Array(src), b = new Float32Array(w * h);
    if (!r) return a;
    for (let p = 0; p < passes; p++) { boxH(a, b, w, h, r); boxV(b, a, w, h, r); }
    return a;
  }
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }
  function mulberry(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  /* Tileable pebble-grain leather texture: R = height, G = mottling, B = fine noise */
  function makeGrain(N = 512) {
    const rnd = mulberry(7), cells = 44, cs = N / cells;
    const jx = new Float32Array(cells * cells), jy = new Float32Array(cells * cells);
    for (let i = 0; i < cells * cells; i++) { jx[i] = 0.15 + rnd() * 0.7; jy[i] = 0.15 + rnd() * 0.7; }
    const G = 8, lv = new Float32Array(G * G);
    for (let i = 0; i < G * G; i++) lv[i] = rnd();
    const smooth = t => t * t * (3 - 2 * t);
    const mott = (x, y) => {
      const fx = x / N * G, fy = y / N * G, ix = Math.floor(fx), iy = Math.floor(fy);
      const tx = smooth(fx - ix), ty = smooth(fy - iy);
      const v = (a, b) => lv[((b + G) % G) * G + ((a + G) % G)];
      return lerp(lerp(v(ix, iy), v(ix + 1, iy), tx), lerp(v(ix, iy + 1), v(ix + 1, iy + 1), tx), ty);
    };
    const out = new Uint8Array(N * N * 4);
    for (let y = 0; y < N; y++) {
      const cy = Math.floor(y / cs);
      for (let x = 0; x < N; x++) {
        const cx = Math.floor(x / cs);
        let f1 = 1e9, f2 = 1e9;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const gx = cx + dx, gy = cy + dy;
          const id = ((gy + cells) % cells) * cells + ((gx + cells) % cells);
          const px = (gx + jx[id]) * cs, py = (gy + jy[id]) * cs;
          const d = Math.hypot(px - x, py - y);
          if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
        }
        const ridge = (f2 - f1) / cs;
        const peb = smooth(clamp(ridge / 0.34, 0, 1));
        const dome = 1 - Math.min(1, (f1 / cs) * (f1 / cs) * 0.9);
        const h = peb * (0.7 + 0.3 * dome);
        const i = (y * N + x) * 4;
        out[i] = clamp(h * 255, 0, 255);
        out[i + 1] = clamp((0.25 * mott(x, y) + 0.75 * mott(x * 3 % N, y * 3 % N) * 0.6 + 0.2) * 255, 0, 255);
        out[i + 2] = rnd() * 255;
        out[i + 3] = 255;
      }
    }
    return out;
  }

  /* ---------------- shaders ---------------- */
  const VS = 'attribute vec2 p; varying vec2 vUv; void main(){ vUv = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }';
  const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uT0; uniform sampler2D uT1; uniform sampler2D uGrain;
uniform vec2 uTexel; uniform float uAspect; uniform vec3 uLight;
uniform vec3 uLeather; uniform vec3 uFoil; uniform vec3 uThread; uniform vec3 uHardware;
uniform float uMetal; uniform float uDepth; uniform float uPress; uniform float uGrainScale; uniform float uTime;

float hgt(vec2 uv){
  vec4 a = texture2D(uT0, uv);
  vec4 b = texture2D(uT1, uv);
  float g = texture2D(uGrain, uv * vec2(uAspect, 1.0) * uGrainScale).r;
  float press = b.g * uPress;
  float flatten = 1.0 - 0.85 * press;
  float h = smoothstep(0.0, 1.0, a.g) * 0.55;
  h += ((g - 0.5) * 0.042 * flatten + a.b * 0.16 + (a.a - 0.5) * 0.55 + press * uDepth * 0.14 + b.b * 0.07) * a.r;
  return h;
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 uv = vUv;
  vec4 a = texture2D(uT0, uv);
  vec4 b = texture2D(uT1, uv);
  vec3 gr = texture2D(uGrain, uv * vec2(uAspect, 1.0) * uGrainScale).rgb;
  vec2 e = uTexel * 1.2;
  float h0 = hgt(uv);
  float hx = hgt(uv + vec2(e.x, 0.0)) - hgt(uv - vec2(e.x, 0.0));
  float hy = hgt(uv + vec2(0.0, e.y)) - hgt(uv - vec2(0.0, e.y));
  vec3 N = normalize(vec3(-hx * 10.0, -hy * 10.0, 1.0));
  vec3 P = vec3(uv.x * uAspect, uv.y, h0 * 0.05);
  vec3 Lv = uLight - P;
  float dist = length(Lv.xy);
  vec3 L = normalize(Lv);
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 Hh = normalize(L + V);
  float ndl = max(dot(N, L), 0.0);
  float ndh = max(dot(N, Hh), 0.0);
  float att = 1.55 / (1.0 + dist * dist * 1.5);

  float obj = a.r;
  float edge = clamp(1.0 - abs(a.g - 0.3) / 0.24, 0.0, 1.0);
  float stitch = smoothstep(0.32, 0.78, a.b);
  float press = b.g * uPress;
  float mark = smoothstep(0.3, 0.7, b.r);
  float foil = mark * uMetal * smoothstep(0.15, 0.85, uPress);
  float hw = smoothstep(0.3, 0.75, b.b);

  vec3 base = uLeather * (0.82 + 0.36 * gr.g) * mix(0.76, 1.07, gr.r);
  base *= mix(1.0, 0.62, press * (1.0 - uMetal) * step(uDepth, 0.0));
  base = mix(base, base * 0.45, edge * 0.85);
  base = mix(base, uThread, stitch);

  float spec = pow(ndh, 30.0) * (0.12 + 0.22 * edge + 0.34 * press * (1.0 - uMetal)) + pow(ndh, 6.0) * 0.035;
  spec += stitch * pow(ndh, 16.0) * 0.22;
  vec3 col = base * (0.13 + ndl * att * vec3(1.0, 0.96, 0.9)) + vec3(1.0, 0.93, 0.82) * spec * att;

  vec3 Nf = normalize(N + vec3(gr.b - 0.5, fract(gr.b * 7.31) - 0.5, 0.0) * 0.16);
  float ndhf = max(dot(Nf, Hh), 0.0);
  vec3 R = reflect(-V, Nf);
  float env = 0.3 + 0.7 * smoothstep(-0.3, 0.9, dot(R, normalize(vec3(uLight.xy - P.xy, 0.55))));
  vec3 foilCol = uFoil * (0.08 + 0.5 * ndl * att + env * 0.3) + mix(uFoil, vec3(1.0), 0.3) * (pow(ndhf, 64.0) * 2.6 + pow(ndhf, 10.0) * 0.5) * att;
  col = mix(col, foilCol, foil);
  vec3 hwCol = uHardware * (0.1 + 0.5 * ndl * att + env * 0.35) + mix(uHardware, vec3(1.0), 0.4) * (pow(ndh, 56.0) * 2.6 + pow(ndh, 9.0) * 0.45) * att;
  col = mix(col, hwCol, hw);

  vec2 toL = uv * vec2(uAspect, 1.0) - uLight.xy;
  vec2 off = normalize(toL + 1e-4) * (0.022 + 0.03 * length(toL));
  float sh = texture2D(uT1, uv - vec2(off.x / uAspect, off.y)).a;
  float pool = exp(-dot(toL, toL) * 2.8);
  vec3 bg = mix(vec3(0.014, 0.011, 0.009), vec3(0.125, 0.09, 0.06), pool);
  bg *= 1.0 - 0.78 * sh;
  col = mix(bg, col, obj);

  vec2 q = uv - 0.5;
  col *= 1.0 - dot(q, q) * 1.05;
  col = vec3(1.0) - exp(-col * 1.3);
  col = pow(col, vec3(1.0 / 2.2));
  col += (hash(gl_FragCoord.xy + uTime) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}`;

  /* ---------------- logo upload → alpha mask ---------------- */
  function logoToMask(img) {
    const max = 1100, s = Math.min(1, max / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    const w = Math.max(1, Math.round((img.naturalWidth || img.width) * s)), h = Math.max(1, Math.round((img.naturalHeight || img.height) * s));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h), p = d.data;
    let transparent = 0;
    for (let i = 3; i < p.length; i += 4) if (p[i] < 240) transparent++;
    const useAlpha = transparent > (w * h) * 0.02;
    let bg = [0, 0, 0];
    if (!useAlpha) {
      const pts = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1], [w >> 1, 0], [0, h >> 1]];
      pts.forEach(([px, py]) => { const i = (py * w + px) * 4; bg[0] += p[i]; bg[1] += p[i + 1]; bg[2] += p[i + 2]; });
      bg = bg.map(v => v / pts.length);
    }
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
      const i = (y * w + xx) * 4;
      let al;
      if (useAlpha) al = p[i + 3] / 255;
      else {
        const dd = Math.hypot(p[i] - bg[0], p[i + 1] - bg[1], p[i + 2] - bg[2]) / 441;
        al = clamp((dd - 0.08) / 0.22, 0, 1);
      }
      p[i] = p[i + 1] = p[i + 2] = 255; p[i + 3] = al * 255;
      if (al > 0.1) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    x.putImageData(d, 0, 0);
    if (x1 <= x0 || y1 <= y0) return null;
    const t = document.createElement('canvas'); t.width = x1 - x0 + 1; t.height = y1 - y0 + 1;
    t.getContext('2d').drawImage(c, x0, y0, t.width, t.height, 0, 0, t.width, t.height);
    return t;
  }

  /* ---------------- the studio instance ---------------- */
  function create({ canvas, stage, onState }) {
    const state = { text: 'YOUR BRAND', line: '', font: 'classic', finish: 'gold', leather: 'espresso', object: 'folio', logo: null, logoName: '' };
    const dpr = () => Math.min(window.devicePixelRatio || 1, 1.75);
    let TW = 0, TH = 0, aspect = 4 / 3;
    let gl = null, prog = null, U = {}, texT0 = null, texT1 = null, texGrain = null;
    let objCache = null, markCache = null;
    const mcv = document.createElement('canvas');
    const mctx = mcv.getContext('2d', { willReadFrequently: true });

    /* animated look parameters */
    const look = { leather: lin3(LEATHERS.espresso.rgb), foil: lin3(FINISHES.gold.foil), metal: 1, depth: FINISHES.gold.depth, press: 0 };
    const target = { leather: look.leather.slice(), foil: look.foil.slice(), metal: 1, depth: look.depth };
    const light = { x: 0.62, y: 0.32, tx: 0.62, ty: 0.32, hover: false, t: 0 };
    let visible = false, raf = 0, lastT = 0, pressAnim = null, ready = false;

    /* ---------- WebGL setup ---------- */
    function initGL() {
      try {
        gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true, premultipliedAlpha: false })
          || canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });
      } catch (e) { gl = null; }
      if (!gl) return false;
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
      const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
      if (!vs || !fs) { gl = null; return false; }
      prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(prog)); gl = null; return false; }
      gl.useProgram(prog);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      ['uT0', 'uT1', 'uGrain', 'uTexel', 'uAspect', 'uLight', 'uLeather', 'uFoil', 'uThread', 'uHardware', 'uMetal', 'uDepth', 'uPress', 'uGrainScale', 'uTime']
        .forEach(n => U[n] = gl.getUniformLocation(prog, n));
      const mk = (unit, wrap) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap); return t; };
      texT0 = mk(0, gl.CLAMP_TO_EDGE); texT1 = mk(1, gl.CLAMP_TO_EDGE); texGrain = mk(2, gl.REPEAT);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.activeTexture(gl.TEXTURE2);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, makeGrain(512));
      gl.uniform1i(U.uT0, 0); gl.uniform1i(U.uT1, 1); gl.uniform1i(U.uGrain, 2);
      return true;
    }

    /* ---------- mask drawing ---------- */
    function layer(draw, base = '#000') {
      mctx.setTransform(1, 0, 0, 1, 0, 0);
      mctx.globalCompositeOperation = 'source-over';
      mctx.fillStyle = base; mctx.fillRect(0, 0, TW, TH);
      mctx.fillStyle = mctx.strokeStyle = '#fff';
      mctx.setLineDash([]); mctx.lineCap = 'round'; mctx.lineJoin = 'round';
      draw(mctx);
      const d = mctx.getImageData(0, 0, TW, TH).data, out = new Float32Array(TW * TH);
      for (let i = 0, j = 0; j < out.length; i += 4, j++) out[j] = d[i] / 255;
      return out;
    }

    /* geometry for each piece, in pixels */
    function geometry(kind) {
      const u = TH, cx = TW / 2, cy = TH / 2, g = { kind };
      if (kind === 'folio') {
        const w = 0.58 * u, h = 0.8 * u;
        g.body = [cx - w / 2 - 0.03 * u, cy - h / 2, w, h, 0.022 * u];
        const bx1 = g.body[0] + w, sy = cy + 0.04 * u;
        g.strap = [bx1 - 0.15 * u, sy - 0.055 * u, 0.185 * u, 0.11 * u, 0.03 * u];
        g.snap = [bx1 - 0.105 * u, sy, 0.027 * u];
        g.crease = [g.body[0] + 0.06 * u, g.body[1] + 0.02 * u, g.body[1] + h - 0.02 * u];
        g.mark = { cx: g.body[0] + w / 2 + 0.01 * u, cy: cy - 0.08 * u, w: 0.4 * u, h: 0.24 * u };
      } else if (kind === 'wallet') {
        const w = Math.min(0.84 * u, TW * 0.78), h = 0.56 * u;
        g.body = [cx - w / 2, cy - h / 2, w, h, 0.045 * u];
        g.fold = true;
        g.mark = { cx: cx + 0.02 * u, cy, w: w * 0.62, h: 0.22 * u };
      } else if (kind === 'passport') {
        const w = 0.5 * u, h = 0.72 * u;
        g.body = [cx - w / 2, cy - h / 2, w, h, 0.03 * u];
        g.mark = { cx, cy: cy - 0.07 * u, w: 0.36 * u, h: 0.22 * u };
        g.rule = true;
      } else if (kind === 'tag') {
        const w = 0.42 * u, h = 0.66 * u, top = cy - h / 2 + 0.08 * u;
        g.tag = { x: cx - w / 2, y: top, w, h, ch: 0.13 * u, r: 0.03 * u };
        g.hole = [cx, top + 0.085 * u, 0.03 * u];
        g.strapV = [cx - 0.038 * u, -0.02 * u, 0.076 * u, top + 0.085 * u + 0.02 * u];
        g.mark = { cx, cy: top + h * 0.6, w: 0.32 * u, h: 0.24 * u };
      } else {
        const w = Math.min(1.02 * u, TW * 0.86), h = 0.64 * u;
        g.body = [cx - w / 2, cy - h / 2, w, h, 0.05 * u];
        g.zip = [g.body[0] + 0.07 * u, g.body[1] + 0.055 * u, w - 0.14 * u];
        g.mark = { cx, cy: cy + 0.06 * u, w: w * 0.62, h: 0.24 * u };
      }
      return g;
    }

    function tagPath(c, t) {
      const { x, y, w, h, ch, r } = t;
      c.beginPath();
      c.moveTo(x, y + ch); c.lineTo(x + ch * 0.8, y); c.lineTo(x + w - ch * 0.8, y); c.lineTo(x + w, y + ch);
      c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.closePath();
    }
    function insetTagPath(c, t, d) {
      tagPath(c, { x: t.x + d, y: t.y + d * 1.1, w: t.w - 2 * d, h: t.h - 2 * d - d * 0.1, ch: t.ch - d * 0.4, r: Math.max(2, t.r - d * 0.6) });
    }

    function buildObject(kind) {
      const g = geometry(kind), u = TH;
      const stitchW = Math.max(1.6, 0.0042 * u), dash = [0.017 * u, 0.0105 * u];
      const M = layer(c => {
        if (g.body) { rr(c, ...g.body); c.fill(); }
        if (g.strap) { rr(c, ...g.strap); c.fill(); }
        if (g.tag) { tagPath(c, g.tag); c.fill(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(g.hole[0], g.hole[1], g.hole[2], 0, 7); c.fill(); c.globalCompositeOperation = 'source-over'; }
        if (g.strapV) { rr(c, ...g.strapV, 0.012 * u); c.fill(); }
      });
      const S = layer(c => {
        c.lineWidth = stitchW; c.setLineDash(dash);
        const ins = 0.024 * u;
        if (g.body) { const [x, y, w, h, r] = g.body; rr(c, x + ins, y + ins, w - 2 * ins, h - 2 * ins, Math.max(2, r - ins * 0.6)); c.stroke(); }
        if (g.strap) { const [x, y, w, h, r] = g.strap; const s = 0.016 * u; rr(c, x + s, y + s, w - 2 * s, h - 2 * s, Math.max(2, r - s)); c.stroke(); }
        if (g.tag) { insetTagPath(c, g.tag, ins * 0.9); c.stroke(); }
        if (g.strapV) { const [x, y, w, h] = g.strapV; const s = 0.013 * u; c.beginPath(); c.moveTo(x + s, y); c.lineTo(x + s, y + h - s * 2); c.moveTo(x + w - s, y); c.lineTo(x + w - s, y + h - s * 2); c.stroke(); }
      });
      const D = layer(c => {
        if (g.crease) { c.strokeStyle = '#555'; c.lineWidth = 0.006 * u; c.beginPath(); c.moveTo(g.crease[0], g.crease[1]); c.lineTo(g.crease[0], g.crease[2]); c.stroke(); }
        if (g.strap) { c.fillStyle = '#c4c4c4'; rr(c, ...g.strap); c.fill(); }
        if (g.fold) { const [x, y, w, h] = g.body; const grd = c.createLinearGradient(x, 0, x + 0.07 * u, 0); grd.addColorStop(0, '#9a9a9a'); grd.addColorStop(1, '#808080'); c.fillStyle = grd; c.fillRect(x, y, 0.07 * u, h); }
        if (g.rule) { const [x, y, w, h] = g.body; c.strokeStyle = '#6a6a6a'; c.lineWidth = 0.0035 * u; rr(c, x + 0.06 * u, y + 0.06 * u, w - 0.12 * u, h - 0.12 * u, 0.01 * u); c.stroke(); }
        if (g.strapV) { c.fillStyle = '#c8c8c8'; rr(c, ...g.strapV, 0.012 * u); c.fill(); }
        if (g.zip) { const [x, y, w] = g.zip; c.fillStyle = '#5a5a5a'; rr(c, x - 0.01 * u, y - 0.016 * u, w + 0.02 * u, 0.032 * u, 0.012 * u); c.fill(); }
      }, '#808080');
      const metal = layer(c => {
        if (g.snap) { c.beginPath(); c.arc(g.snap[0], g.snap[1], g.snap[2], 0, 7); c.fill(); }
        if (g.hole) { c.lineWidth = 0.016 * u; c.beginPath(); c.arc(g.hole[0], g.hole[1], g.hole[2] + 0.008 * u, 0, 7); c.stroke(); }
        if (g.zip) {
          const [x, y, w] = g.zip, tw = 0.0075 * u, gap = 0.0125 * u;
          for (let t = 0, k = 0; t < w; t += gap, k++) c.fillRect(x + t, y - (k % 2 ? 0.012 * u : 0.002 * u), tw, 0.014 * u);
          rr(c, x + w - 0.02 * u, y - 0.01 * u, 0.05 * u, 0.02 * u, 0.008 * u); c.fill();
          rr(c, x + w + 0.024 * u, y - 0.006 * u, 0.06 * u, 0.016 * u, 0.008 * u); c.fill();
        }
      });
      const bevelR = 0.016 * u;
      objCache = { g, M, Mb: blur(M, TW, TH, bevelR / 1.7), Ms: blur(M, TW, TH, 0.032 * u / 1.7), S: blur(S, TW, TH, 1, 1), D: blur(D, TW, TH, 0.0035 * u / 1.7), metal: blur(metal, TW, TH, 1, 1) };
    }

    function fontCss(f, size) { return `${f.italic ? 'italic ' : ''}${f.weight} ${size}px "${f.family}"`; }
    function drawSpaced(c, text, x, y, spacing) {
      if (!spacing) { c.textAlign = 'center'; c.fillText(text, x, y); return; }
      const chars = [...text], widths = chars.map(ch => c.measureText(ch).width);
      const total = widths.reduce((s, w) => s + w, 0) + spacing * (chars.length - 1);
      let px = x - total / 2; c.textAlign = 'left';
      chars.forEach((ch, i) => { c.fillText(ch, px, y); px += widths[i] + spacing; });
    }
    function measureSpaced(c, text, spacing) {
      const chars = [...text];
      return chars.reduce((s, ch) => s + c.measureText(ch).width, 0) + spacing * Math.max(0, chars.length - 1);
    }

    function buildMark() {
      if (!objCache) return;
      const box = objCache.g.mark;
      const L = layer(c => {
        c.save();
        if (state.logo) {
          const lw = state.logo.width, lh = state.logo.height;
          const s = Math.min(box.w / lw, (box.h * (state.line ? 0.72 : 1)) / lh);
          const w = lw * s, h = lh * s, y = box.cy - (state.line ? box.h * 0.12 : 0) - h / 2;
          c.drawImage(state.logo, box.cx - w / 2, y, w, h);
          if (state.line) drawLine2(c, box, y + h + box.h * 0.12);
        } else {
          const f = FONTS[state.font] || FONTS.classic;
          let text = (state.text || '').trim() || 'YOUR BRAND';
          if (f.upper) text = text.toUpperCase();
          let size = box.h * (state.line ? 0.5 : 0.62) * f.size;
          c.font = fontCss(f, size);
          let width = measureSpaced(c, text, f.spacing * size);
          if (width > box.w) { size *= box.w / width; c.font = fontCss(f, size); width = measureSpaced(c, text, f.spacing * size); }
          const m = c.measureText(text);
          const asc = m.actualBoundingBoxAscent || size * 0.7, desc = m.actualBoundingBoxDescent || size * 0.2;
          const l2 = state.line ? box.h * 0.13 : 0, gap = state.line ? box.h * 0.17 : 0;
          const total = asc + desc + gap + l2;
          const base = box.cy - total / 2 + asc;
          c.textBaseline = 'alphabetic';
          drawSpaced(c, text, box.cx, base, f.spacing * size);
          if (state.line) {
            const ry = base + desc + gap * 0.48;
            c.lineWidth = Math.max(1.2, box.h * 0.008);
            const half = Math.min(width * 0.38, box.w * 0.3);
            c.beginPath(); c.moveTo(box.cx - half, ry); c.lineTo(box.cx - box.h * 0.035, ry); c.moveTo(box.cx + box.h * 0.035, ry); c.lineTo(box.cx + half, ry); c.stroke();
            const dd = box.h * 0.02; c.beginPath(); c.moveTo(box.cx, ry - dd); c.lineTo(box.cx + dd, ry); c.lineTo(box.cx, ry + dd); c.lineTo(box.cx - dd, ry); c.closePath(); c.fill();
            drawLine2(c, box, base + desc + gap + l2 * 0.82);
          }
        }
        c.restore();
      });
      // keep the mark on the leather
      const M = objCache.M;
      for (let i = 0; i < L.length; i++) L[i] *= M[i] > 0.5 ? 1 : 0;
      markCache = { L, Lb: blur(L, TW, TH, Math.max(1.5, 0.0042 * TH) / 1.7) };
    }
    function drawLine2(c, box, y) {
      const size = Math.max(10, box.h * 0.12);
      c.font = `500 ${size}px "Jost"`;
      c.textBaseline = 'alphabetic';
      let t = state.line.toUpperCase();
      let sp = size * 0.3, w = measureSpaced(c, t, sp);
      if (w > box.w) { const k = box.w / w; c.font = `500 ${size * k}px "Jost"`; sp *= k; }
      drawSpaced(c, t, box.cx, y, sp);
    }

    function upload() {
      if (!gl || !objCache || !markCache) return;
      const n = TW * TH, t0 = new Uint8Array(n * 4), t1 = new Uint8Array(n * 4);
      const { M, Mb, S, D, metal, Ms } = objCache, { L, Lb } = markCache;
      for (let i = 0, j = 0; i < n; i++, j += 4) {
        t0[j] = M[i] * 255; t0[j + 1] = Mb[i] * 255; t0[j + 2] = S[i] * 255; t0[j + 3] = D[i] * 255;
        t1[j] = L[i] * 255; t1[j + 1] = Lb[i] * 255; t1[j + 2] = metal[i] * 255; t1[j + 3] = Ms[i] * 255;
      }
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texT0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, TW, TH, 0, gl.RGBA, gl.UNSIGNED_BYTE, t0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texT1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, TW, TH, 0, gl.RGBA, gl.UNSIGNED_BYTE, t1);
    }

    /* ---------- sizing ---------- */
    function sizeCanvas() {
      const r = stage.getBoundingClientRect();
      const w = Math.max(2, Math.round(r.width * dpr())), h = Math.max(2, Math.round(r.height * dpr()));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      const a = r.width / Math.max(1, r.height);
      const nTH = r.width < 560 ? 820 : 960;
      const nTW = Math.round(nTH * a);
      if (nTW !== TW || nTH !== TH) {
        TW = nTW; TH = nTH; aspect = TW / TH; mcv.width = TW; mcv.height = TH;
        return true;
      }
      return false;
    }

    /* ---------- render ---------- */
    function thread() {
      const l = look.leather;
      return l.map(v => clamp(v * 2.4 + 0.05, 0, 1)).map((v, i) => lerp(v, [0.62, 0.55, 0.42][i], 0.35));
    }
    function hardware() { return look.metal > 0.5 ? look.foil : lin3([212, 172, 102]); }

    function draw(t) {
      if (!gl || !ready) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.uTexel, 1 / TW, 1 / TH);
      gl.uniform1f(U.uAspect, aspect);
      gl.uniform3f(U.uLight, light.x * aspect, light.y, 0.55);
      gl.uniform3fv(U.uLeather, look.leather);
      gl.uniform3fv(U.uFoil, look.foil);
      gl.uniform3fv(U.uThread, thread());
      gl.uniform3fv(U.uHardware, hardware());
      gl.uniform1f(U.uMetal, look.metal);
      gl.uniform1f(U.uDepth, look.depth);
      gl.uniform1f(U.uPress, look.press);
      gl.uniform1f(U.uGrainScale, 3.3);
      gl.uniform1f(U.uTime, (t || 0) % 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function tick(t) {
      raf = 0;
      const dt = Math.min(0.05, ((t - lastT) || 16) / 1000); lastT = t;
      light.t += dt;
      if (!light.hover) {
        const a = light.t * 0.42;
        light.tx = 0.5 + Math.cos(a) * 0.3; light.ty = 0.42 + Math.sin(a * 1.3) * 0.26;
      }
      const k = 1 - Math.exp(-dt * (light.hover ? 9 : 2.4));
      light.x += (light.tx - light.x) * k; light.y += (light.ty - light.y) * k;
      const kl = 1 - Math.exp(-dt * 6);
      for (let i = 0; i < 3; i++) { look.leather[i] += (target.leather[i] - look.leather[i]) * kl; look.foil[i] += (target.foil[i] - look.foil[i]) * kl; }
      look.metal += (target.metal - look.metal) * kl;
      look.depth += (target.depth - look.depth) * kl;
      if (pressAnim) {
        const p = clamp((t - pressAnim.start) / pressAnim.dur, 0, 1);
        const e = 1 - Math.pow(1 - p, 3);
        look.press = lerp(pressAnim.from, 1, e) + Math.sin(p * Math.PI) * 0.12;
        if (p >= 1) { look.press = 1; pressAnim = null; }
      }
      draw(t);
      if (visible) raf = requestAnimationFrame(tick);
    }
    function wake() { if (!raf && visible) { lastT = performance.now(); raf = requestAnimationFrame(tick); } }

    function press(from = 0) {
      pressAnim = { start: performance.now(), dur: 950, from };
      look.press = from;
      wake();
    }

    /* ---------- public setters ---------- */
    let markTimer = 0;
    function rebuildMark(animate) {
      buildMark(); upload();
      if (animate) press(0.55); else wake();
      emit();
    }
    function emit() { onState && onState(snapshotState()); }
    function snapshotState() {
      return { ...state, leatherName: LEATHERS[state.leather].name, finishName: FINISHES[state.finish].name, objectName: OBJECTS[state.object] };
    }

    function set(key, value, opts = {}) {
      if (key === 'text' || key === 'line') {
        state[key] = String(value || '').slice(0, key === 'text' ? 22 : 30);
        clearTimeout(markTimer);
        markTimer = setTimeout(() => ensureFonts().then(() => rebuildMark(false)), 90);
        return;
      }
      if (key === 'font') { state.font = FONTS[value] ? value : 'classic'; ensureFonts().then(() => rebuildMark(true)); return; }
      if (key === 'leather' && LEATHERS[value]) { state.leather = value; target.leather = lin3(LEATHERS[value].rgb); wake(); emit(); return; }
      if (key === 'finish' && FINISHES[value]) {
        state.finish = value; const f = FINISHES[value];
        target.foil = lin3(f.foil); target.metal = f.metal; target.depth = f.depth;
        if (!opts.silent) press(0.2); emit(); return;
      }
      if (key === 'object' && OBJECTS[value]) {
        if (state.object === value) return;
        state.object = value; swapObject(); return;
      }
    }

    /* crossfade between pieces: snapshot → rebuild → fade the snapshot out */
    let ghost = null;
    function swapObject() {
      if (!gl) { state.object && fallbackDraw(); emit(); return; }
      if (!ghost) {
        ghost = document.createElement('canvas');
        ghost.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;transition:opacity .7s cubic-bezier(.16,1,.3,1)';
        stage.appendChild(ghost);
      }
      ghost.width = canvas.width; ghost.height = canvas.height;
      try { draw(performance.now()); ghost.getContext('2d').drawImage(canvas, 0, 0); } catch (e) {}
      ghost.style.transition = 'none'; ghost.style.opacity = '1';
      requestAnimationFrame(() => {
        buildObject(state.object); buildMark(); upload(); press(0.35);
        requestAnimationFrame(() => { ghost.style.transition = 'opacity .8s cubic-bezier(.16,1,.3,1)'; ghost.style.opacity = '0'; });
        emit();
      });
    }

    function setLogo(img, name) {
      state.logo = img ? logoToMask(img) : null;
      state.logoName = state.logo ? (name || 'logo') : '';
      rebuildMark(true);
      return !!state.logo || !img;
    }

    /* ---------- fonts ---------- */
    function ensureFonts() {
      if (!document.fonts || !document.fonts.load) return Promise.resolve();
      const f = FONTS[state.font] || FONTS.classic;
      return Promise.all([
        document.fonts.load(fontCss(f, 64), state.text || 'BE YOU'),
        document.fonts.load('500 32px "Jost"', 'ABC'),
      ]).catch(() => {});
    }

    /* ---------- fallback (no WebGL) ---------- */
    function fallbackDraw() {
      const c = canvas.getContext('2d'); if (!c) return;
      const r = stage.getBoundingClientRect(); canvas.width = r.width * dpr(); canvas.height = r.height * dpr();
      const W = canvas.width, Hh = canvas.height, u = Hh;
      c.fillStyle = '#120e0b'; c.fillRect(0, 0, W, Hh);
      const lc = LEATHERS[state.leather].rgb, fc = FINISHES[state.finish];
      const w = 0.58 * u, h = 0.8 * u, x = W / 2 - w / 2, y = Hh / 2 - h / 2;
      c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 40; c.shadowOffsetY = 20;
      c.fillStyle = `rgb(${lc})`; rr(c, x, y, w, h, 0.02 * u); c.fill(); c.shadowColor = 'transparent';
      c.strokeStyle = 'rgba(255,240,220,.35)'; c.setLineDash([0.017 * u, 0.01 * u]); c.lineWidth = 2; rr(c, x + 0.024 * u, y + 0.024 * u, w - 0.048 * u, h - 0.048 * u, 0.01 * u); c.stroke(); c.setLineDash([]);
      const f = FONTS[state.font] || FONTS.classic, text = (f.upper ? state.text.toUpperCase() : state.text) || 'YOUR BRAND';
      let size = 0.1 * u; c.font = fontCss(f, size); const tw = c.measureText(text).width; if (tw > w * 0.75) { size *= w * 0.75 / tw; c.font = fontCss(f, size); }
      c.textAlign = 'center'; c.textBaseline = 'middle';
      if (fc.metal) { const gr = c.createLinearGradient(W / 2 - w / 3, 0, W / 2 + w / 3, 0); gr.addColorStop(0, `rgb(${fc.foil.map(v => v * .7 | 0)})`); gr.addColorStop(.5, `rgb(${fc.foil})`); gr.addColorStop(1, `rgb(${fc.foil.map(v => v * .75 | 0)})`); c.fillStyle = gr; }
      else { c.fillStyle = 'rgba(0,0,0,.35)'; c.shadowColor = 'rgba(255,255,255,.18)'; c.shadowOffsetY = 1.5; c.shadowBlur = 0; }
      c.fillText(text, W / 2, Hh / 2 - 0.06 * u); c.shadowColor = 'transparent';
    }

    /* ---------- export ---------- */
    function frameCanvas() { if (gl) draw(performance.now()); return canvas; }
    function thumb(w = 360) {
      const src = frameCanvas(), h = Math.round(w * src.height / src.width);
      const t = document.createElement('canvas'); t.width = w; t.height = h;
      t.getContext('2d').drawImage(src, 0, 0, w, h);
      return t;
    }
    function exportCard() {
      const src = frameCanvas(), W = 1600, H = Math.round(W * src.height / src.width), band = 150;
      const out = document.createElement('canvas'); out.width = W; out.height = H + band;
      const c = out.getContext('2d');
      c.fillStyle = '#100D0A'; c.fillRect(0, 0, W, H + band);
      c.drawImage(src, 0, 0, W, H);
      c.fillStyle = 'rgba(176,138,82,.4)'; c.fillRect(0, H, W, 1);
      const path = document.getElementById('byPath');
      if (path && window.Path2D) {
        c.save(); c.translate(56, H + 34); c.scale(0.33, 0.33); c.translate(-30, -24);
        c.fillStyle = '#B08A52'; c.fill(new Path2D(path.getAttribute('d'))); c.restore();
      }
      c.fillStyle = '#F1EADA'; c.font = '500 30px "Bodoni Moda"'; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
      c.fillText('B E   Y O U', 150, H + 70);
      c.fillStyle = 'rgba(241,234,218,.6)'; c.font = '400 20px "Jost"';
      const s = snapshotState();
      c.fillText(`PERSONALISATION PREVIEW  ·  ${s.finishName.toUpperCase()}  ·  ${s.leatherName.toUpperCase()} LEATHER  ·  ${s.objectName.toUpperCase()}`, 150, H + 106);
      c.textAlign = 'right'; c.fillStyle = 'rgba(241,234,218,.4)'; c.font = '400 18px "Jost"';
      c.fillText('Digital preview · final finish confirmed at sampling · www.beyou.in', W - 56, H + 106);
      return out;
    }

    /* ---------- pointer light ---------- */
    function pointer(e) {
      const r = stage.getBoundingClientRect();
      light.tx = clamp((e.clientX - r.left) / r.width, -0.1, 1.1);
      light.ty = clamp((e.clientY - r.top) / r.height, -0.1, 1.1);
      light.hover = true; wake();
    }
    stage.addEventListener('pointermove', pointer);
    stage.addEventListener('pointerdown', pointer);
    stage.addEventListener('pointerleave', () => { light.hover = false; light.t = Math.atan2(light.y - 0.42, light.x - 0.5) / 0.42; });

    /* ---------- boot ---------- */
    const ok = initGL();
    sizeCanvas();
    if (!ok) {
      const fb = stage.querySelector('.stage-fallback'); if (fb) fb.style.display = 'grid';
      ensureFonts().then(fallbackDraw);
    }
    const boot = ensureFonts().then(() => {
      if (!gl) return;
      buildObject(state.object); buildMark(); upload(); ready = true; draw(0); emit();
    });

    const ro = new ResizeObserver(() => {
      if (!gl) { fallbackDraw(); return; }
      const rebuilt = sizeCanvas();
      if (rebuilt && ready) { buildObject(state.object); buildMark(); upload(); }
      draw(performance.now());
    });
    ro.observe(stage);
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) wake(); }, { rootMargin: '120px' }).observe(stage);
    document.addEventListener('visibilitychange', () => { visible = !document.hidden && visible; if (!document.hidden) wake(); });
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); ready = false; });
    canvas.addEventListener('webglcontextrestored', () => { initGL(); buildObject(state.object); buildMark(); upload(); ready = true; wake(); });

    return {
      set, setLogo, press, thumb, exportCard, boot,
      get state() { return snapshotState(); },
      apply(params) {
        if (params.leather) set('leather', params.leather);
        if (params.finish) set('finish', params.finish, { silent: true });
        if (params.font && FONTS[params.font]) state.font = params.font;
        if (params.object && OBJECTS[params.object]) state.object = params.object;
        if (params.text != null) state.text = String(params.text).slice(0, 22);
        if (params.line != null) state.line = String(params.line).slice(0, 30);
        return boot.then(ensureFonts).then(() => { if (gl) { buildObject(state.object); buildMark(); upload(); } else fallbackDraw(); emit(); });
      },
      hasGL: () => !!gl,
    };
  }

  return { create, LEATHERS, FINISHES, OBJECTS, FONTS };
})();
