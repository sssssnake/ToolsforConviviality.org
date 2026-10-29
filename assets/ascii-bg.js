/* A very quiet ASCII gradient behind the page: a few slow, soft glows drawn in monospace characters,
   which scramble briefly where the pointer passes. It reads the site's own colour variables, so it follows
   the light and dark themes, and it stays out of the way: low opacity, low frame rate, paused when the tab
   is hidden, a single still frame for people who prefer reduced motion, and nothing at all when printing. */
(function () {
  if (navigator.webdriver || document.getElementById("ascii-bg")) return;   // the prerender snapshot stays clean
  if (location.pathname.replace(/index\.html$/, "") !== "/") return;        // home page only
  var doc = document.documentElement;
  var RAMP = " .:-=+*#%@";
  var FONT_PX = 13, LEVELS = 6, FPS = 20;
  var MAX_ALPHA = { dark: 0.15, light: 0.1 };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var style = document.createElement("style");
  // Absolute, not fixed: it covers the first screen only and scrolls away with the page, fading out toward the fold.
  style.textContent = "#ascii-bg{position:absolute;top:0;left:0;width:100%;z-index:-1;pointer-events:none;-webkit-mask-image:linear-gradient(#000 55%,transparent);mask-image:linear-gradient(#000 55%,transparent)}@media print{#ascii-bg{display:none}}";
  document.head.appendChild(style);
  var cv = document.createElement("canvas");
  cv.id = "ascii-bg"; cv.setAttribute("aria-hidden", "true");
  document.body.insertBefore(cv, document.body.firstChild);
  var c = cv.getContext("2d"); if (!c) return;

  var cols = 0, rows = 0, cw = 8, ch = 16, dpr = 1, heat = null, rgb = [179, 197, 255], alpha = MAX_ALPHA.dark;
  var pointer = { x: -9999, y: -9999 };

  function parse(v) {
    v = (v || "").trim();
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v); if (!m) return null;
    var h = m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function readTheme() {
    var cs = getComputedStyle(doc), accent = parse(cs.getPropertyValue("--accent")), bg = parse(cs.getPropertyValue("--bg"));
    if (accent) rgb = accent;
    var lum = bg ? (0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]) / 255 : 0;
    alpha = lum > 0.5 ? MAX_ALPHA.light : MAX_ALPHA.dark;
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth, h = window.innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = h + "px";
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.font = FONT_PX + 'px "IBM Plex Mono", ui-monospace, Menlo, monospace';
    cw = Math.max(6, c.measureText("M").width); ch = Math.round(FONT_PX * 1.25);
    cols = Math.ceil(w / cw) + 1; rows = Math.ceil(h / ch) + 1;
    heat = new Float32Array(cols * rows);
  }

  // Three soft glows on slow, looping paths plus a little drift, as a 0..1 field over the screen.
  function field(nx, ny, t) {
    var v = 0, i, bx, by, dx, dy;
    for (i = 0; i < 3; i++) {
      bx = 0.5 + 0.38 * Math.sin(t * (0.07 + i * 0.023) + i * 2.1);
      by = 0.5 + 0.34 * Math.cos(t * (0.055 + i * 0.019) + i * 1.3);
      dx = nx - bx; dy = (ny - by) * 0.8;
      v += Math.exp(-(dx * dx + dy * dy) / (0.045 + i * 0.012));
    }
    v += 0.12 * Math.sin(nx * 6 + t * 0.2) * Math.sin(ny * 5 - t * 0.15);
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function frame(ms) {
    var t = ms / 1000, w = window.innerWidth, h = window.innerHeight, x, y, k, v, idx, lvl, buckets = [];
    for (k = 0; k < LEVELS; k++) buckets.push([]);
    var pr = 120, pr2 = pr * pr;
    for (y = 0; y < rows; y++) {
      for (x = 0; x < cols; x++) {
        k = y * cols + x;
        v = field((x * cw) / w, (y * ch) / h, t);
        if (!reduce) {
          var dx = x * cw + cw / 2 - pointer.x, dy = y * ch + ch / 2 - pointer.y, d2 = dx * dx + dy * dy;
          if (d2 < pr2) heat[k] = Math.max(heat[k], 1 - d2 / pr2);
          if (heat[k] > 0.04) { v = Math.min(1, v + heat[k] * 0.5); heat[k] *= 0.9; } else heat[k] = 0;
        }
        idx = Math.floor(v * (RAMP.length - 1));
        if (!reduce && heat[k] > 0.04) idx = 1 + Math.floor(Math.random() * (RAMP.length - 1));   // scramble
        if (idx < 1) continue;
        lvl = Math.min(LEVELS - 1, Math.floor((idx / (RAMP.length - 1)) * LEVELS));
        buckets[lvl].push(RAMP.charAt(idx), x * cw, y * ch + ch - 3);
      }
    }
    c.clearRect(0, 0, w, h);
    c.font = FONT_PX + 'px "IBM Plex Mono", ui-monospace, Menlo, monospace';
    c.textBaseline = "alphabetic";
    for (k = 0; k < LEVELS; k++) {
      var b = buckets[k]; if (!b.length) continue;
      c.fillStyle = "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + (alpha * (k + 1) / LEVELS).toFixed(3) + ")";
      for (var j = 0; j < b.length; j += 3) c.fillText(b[j], b[j + 1], b[j + 2]);
    }
  }

  var last = 0, running = false;
  function loop(now) {
    if (!running) return;
    if (now - last >= 1000 / FPS) { last = now; frame(now); }
    requestAnimationFrame(loop);
  }
  var onScreen = true;
  function start() { if (reduce || running || document.hidden || !onScreen) return; running = true; requestAnimationFrame(loop); }
  function stop() { running = false; }

  function init() {
    readTheme(); resize(); frame(2000);   // a still frame first, so reduced-motion users get one
    start();
  }
  var fontsReady = document.fonts && document.fonts.load ? document.fonts.load('13px "IBM Plex Mono"').catch(function () {}) : Promise.resolve();
  fontsReady.then(init);

  if (window.IntersectionObserver) new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; if (onScreen) start(); else stop(); }).observe(cv);   // no drawing once scrolled past
  new MutationObserver(function () { readTheme(); if (!running) frame(2000); }).observe(doc, { attributes: true, attributeFilter: ["data-theme"] });
  var mq = matchMedia("(prefers-color-scheme: light)"), onScheme = function () { readTheme(); if (!running) frame(2000); };
  if (mq.addEventListener) mq.addEventListener("change", onScheme);
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { resize(); if (!running) frame(2000); }, 150); });
  window.addEventListener("pointermove", function (e) { if (e.pointerType !== "touch") { pointer.x = e.clientX; pointer.y = e.clientY; } }, { passive: true });
  window.addEventListener("pointerleave", function () { pointer.x = pointer.y = -9999; });
  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });
})();
