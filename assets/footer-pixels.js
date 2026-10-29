/* A quiet field of dithered pixels in the footer: soft clouds that drift and shimmer, light up under the
   pointer, and send a ripple out where you click. Plain canvas, no libraries. It runs at a low frame rate,
   pauses when the footer is off screen or the tab is hidden, shows one still frame for people who prefer
   reduced motion, and is skipped during prerender and when printing. */
(function () {
  if (navigator.webdriver) return;
  var footer = document.querySelector("footer");
  if (!footer || document.getElementById("foot-pixels")) return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CELL = 6, FPS = 20, BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var BASE = "179,197,255", HI = "241,242,237";

  var cv = document.createElement("canvas");
  cv.id = "foot-pixels"; cv.setAttribute("aria-hidden", "true");
  footer.insertBefore(cv, footer.firstChild);
  var c = cv.getContext("2d"); if (!c) return;

  var W = 0, H = 0, cols = 0, rows = 0, dpr = 1, heat = null;
  var pointer = { x: -9999, y: -9999 }, ripples = [];

  function resize() {
    var r = footer.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    cv.width = W * dpr; cv.height = H * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / CELL); rows = Math.ceil(H / CELL);
    heat = new Float32Array(cols * rows);
  }
  function hash(x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }

  function frame(ms) {
    var t = ms / 1000, x, y, k, v, th, a, hi, d, dx, dy, i;
    var lo = [], mid = [], top = [];
    c.clearRect(0, 0, W, H);
    for (i = ripples.length - 1; i >= 0; i--) { ripples[i].r = (t - ripples[i].t0) * 420; if (ripples[i].r > 700) ripples.splice(i, 1); }
    for (y = 0; y < rows; y++) {
      for (x = 0; x < cols; x++) {
        k = y * cols + x;
        // drifting cloud: a few sines, denser toward the bottom edge, thresholded against a Bayer matrix
        v = 0.5 + 0.2 * Math.sin(x * 0.045 + t * 0.35) + 0.16 * Math.sin(y * 0.16 - t * 0.28 + x * 0.02) + 0.12 * Math.sin((x + y) * 0.03 + t * 0.2);
        v += (y / rows - 0.35) * 0.55 - 0.42;
        th = (BAYER[(x & 3) + ((y & 3) << 2)] + 0.5) / 16;
        a = v > th ? 0.05 + 0.06 * hash(x, y + Math.floor(t * 1.5)) : 0;   // a little shimmer
        hi = 0;
        if (!reduce) {
          dx = x * CELL + CELL / 2 - pointer.x; dy = y * CELL + CELL / 2 - pointer.y; d = dx * dx + dy * dy;
          if (d < 8100) heat[k] = Math.max(heat[k], 1 - d / 8100);
          if (heat[k] > 0.03) { hi = heat[k]; heat[k] *= 0.9; } else heat[k] = 0;
          for (i = 0; i < ripples.length; i++) {
            dx = x * CELL + CELL / 2 - ripples[i].x; dy = y * CELL + CELL / 2 - ripples[i].y;
            d = Math.abs(Math.sqrt(dx * dx + dy * dy) - ripples[i].r);
            if (d < 14) hi = Math.max(hi, (1 - d / 14) * (1 - ripples[i].r / 700));
          }
        }
        if (hi > 0.05) { a = Math.max(a, 0.08) + hi * 0.22; top.push(x * CELL, y * CELL, a > 0.3 ? 0.3 : a); }
        else if (a > 0) (a > 0.09 ? mid : lo).push(x * CELL, y * CELL);
      }
    }
    c.fillStyle = "rgba(" + BASE + ",0.05)"; for (i = 0; i < lo.length; i += 2) c.fillRect(lo[i], lo[i + 1], CELL - 1, CELL - 1);
    c.fillStyle = "rgba(" + BASE + ",0.09)"; for (i = 0; i < mid.length; i += 2) c.fillRect(mid[i], mid[i + 1], CELL - 1, CELL - 1);
    for (i = 0; i < top.length; i += 3) { c.fillStyle = "rgba(" + HI + "," + top[i + 2].toFixed(2) + ")"; c.fillRect(top[i], top[i + 1], CELL - 1, CELL - 1); }
  }

  var running = false, onScreen = true, last = 0;
  function loop(now) { if (!running) return; if (now - last >= 1000 / FPS) { last = now; frame(now); } requestAnimationFrame(loop); }
  function start() { if (reduce || running || document.hidden || !onScreen) return; running = true; requestAnimationFrame(loop); }
  function stop() { running = false; }

  resize(); frame(3000);   // one still frame, which is all reduced-motion visitors get
  start();

  if (window.IntersectionObserver) new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; if (onScreen) start(); else stop(); }).observe(footer);
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { resize(); if (!running) frame(3000); }, 150); });
  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });
  if (!reduce) {
    footer.addEventListener("pointermove", function (e) { if (e.pointerType === "touch") return; var r = footer.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; }, { passive: true });
    footer.addEventListener("pointerleave", function () { pointer.x = pointer.y = -9999; });
    footer.addEventListener("pointerdown", function (e) { var r = footer.getBoundingClientRect(); ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, t0: performance.now() / 1000, r: 0 }); if (ripples.length > 4) ripples.shift(); }, { passive: true });
  }
})();
