/* Slow, drifting threads across the footer: thin lines that wave like loose strings, bend toward the pointer,
   and fade out at the edges. Plain canvas, no libraries. It runs at a modest frame rate, pauses when the footer
   is off screen or the tab is hidden, shows one still frame for people who prefer reduced motion, and is
   skipped during prerender and when printing. */
(function () {
  if (navigator.webdriver) return;
  var footer = document.querySelector("footer");
  if (!footer || document.getElementById("foot-threads")) return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var LINES = 16, STEP = 8, FPS = 30, COLOR = "241,242,237";

  var cv = document.createElement("canvas");
  cv.id = "foot-threads"; cv.setAttribute("aria-hidden", "true");
  footer.insertBefore(cv, footer.firstChild);
  var c = cv.getContext("2d"); if (!c) return;

  var W = 0, H = 0, dpr = 1, pointer = { x: -9999, y: -9999, s: 0 };

  function resize() {
    var r = footer.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    cv.width = W * dpr; cv.height = H * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function hash(n) { var x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }
  function noise(x) {   // smooth 1D value noise, 0..1
    var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return hash(i) * (1 - u) + hash(i + 1) * u;
  }

  function frame(ms) {
    var t = ms / 1000, i, x, y, base, amp, env, n, d, k, a;
    c.clearRect(0, 0, W, H);
    pointer.s += ((pointer.x > -999 ? 1 : 0) - pointer.s) * 0.08;   // ease the pointer's pull in and out
    c.lineWidth = 1.2; c.lineJoin = "round";
    for (i = 0; i < LINES; i++) {
      base = H * (0.12 + 0.76 * (i / (LINES - 1)));
      amp = H * (0.10 + 0.16 * hash(i + 3));
      a = 0.10 + 0.16 * hash(i + 11);
      c.strokeStyle = "rgba(" + COLOR + "," + a.toFixed(2) + ")";
      c.beginPath();
      for (x = 0; x <= W + STEP; x += STEP) {
        env = Math.pow(Math.sin(Math.min(1, x / W) * Math.PI), 0.7);
        n = noise(x * 0.0055 + i * 0.42 + t * 0.16) + 0.5 * noise(x * 0.012 - i * 0.9 - t * 0.1) - 0.75;
        y = base + n * 2 * amp * env;
        if (pointer.s > 0.01) { d = Math.abs(x - pointer.x) / 190; if (d < 1) { k = (1 - d) * (1 - d) * pointer.s; y += (pointer.y - y) * 0.32 * k; } }
        if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.stroke();
    }
  }

  var running = false, onScreen = true, last = 0;
  function loop(now) { if (!running) return; if (now - last >= 1000 / FPS) { last = now; frame(now); } requestAnimationFrame(loop); }
  function start() { if (reduce || running || document.hidden || !onScreen) return; running = true; requestAnimationFrame(loop); }
  function stop() { running = false; }

  resize(); frame(4000);   // one still frame, which is all reduced-motion visitors get
  start();

  if (window.IntersectionObserver) new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; if (onScreen) start(); else stop(); }).observe(footer);
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { resize(); if (!running) frame(4000); }, 150); });
  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });
  if (!reduce) {
    footer.addEventListener("pointermove", function (e) { if (e.pointerType === "touch") return; var r = footer.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; }, { passive: true });
    footer.addEventListener("pointerleave", function () { pointer.x = pointer.y = -9999; });
  }
})();
