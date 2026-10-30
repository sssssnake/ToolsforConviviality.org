/* A very quiet field of fine wavy lines in the footer, like a sheet of cloth moving in slow air. The pointer
   pushes the lines aside as it passes. Plain canvas, no libraries. Low frame rate, paused when the footer is
   off screen or the tab is hidden, one still frame for people who prefer reduced motion, and skipped during
   prerender and when printing. */
(function () {
  if (navigator.webdriver) return;
  var footer = document.querySelector("footer");
  if (!footer || document.getElementById("foot-waves")) return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var XGAP = 14, YGAP = 14, AMP = 9, FPS = 24, COLOR = "241,242,237", ALPHA = 0.11;

  var cv = document.createElement("canvas");
  cv.id = "foot-waves"; cv.setAttribute("aria-hidden", "true");
  footer.insertBefore(cv, footer.firstChild);
  var c = cv.getContext("2d"); if (!c) return;

  var W = 0, H = 0, dpr = 1, pointer = { x: -9999, y: -9999, vx: 0, vy: 0 }, lastP = null;

  function resize() {
    var r = footer.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    cv.width = W * dpr; cv.height = H * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function hash(x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
  function noise(x, y) {   // smooth 2D value noise, 0..1
    var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    var a = hash(ix, iy), b = hash(ix + 1, iy), d = hash(ix, iy + 1), e = hash(ix + 1, iy + 1);
    return (a * (1 - ux) + b * ux) * (1 - uy) + (d * (1 - ux) + e * ux) * uy;
  }

  function frame(ms) {
    var t = ms / 1000, x, y, px, py, ang, dx, dy, d, f, first;
    c.clearRect(0, 0, W, H);
    c.strokeStyle = "rgba(" + COLOR + "," + ALPHA + ")"; c.lineWidth = 1;
    pointer.vx *= 0.9; pointer.vy *= 0.9;
    for (x = -XGAP; x <= W + XGAP; x += XGAP) {
      c.beginPath(); first = true;
      for (y = -YGAP; y <= H + YGAP; y += YGAP) {
        ang = noise(x * 0.004 + t * 0.12, y * 0.006 - t * 0.07) * Math.PI * 4;
        px = x + Math.cos(ang) * AMP; py = y + Math.sin(ang) * AMP * 0.6;
        if (!reduce) {
          dx = px - pointer.x; dy = py - pointer.y; d = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) { f = (1 - d / 110); f *= f; px += dx / (d || 1) * f * 18 + pointer.vx * f * 0.6; py += dy / (d || 1) * f * 10 + pointer.vy * f * 0.6; }
        }
        if (first) { c.moveTo(px, py); first = false; } else c.lineTo(px, py);
      }
      c.stroke();
    }
  }

  var running = false, onScreen = true, last = 0;
  function loop(now) { if (!running) return; if (now - last >= 1000 / FPS) { last = now; frame(now); } requestAnimationFrame(loop); }
  function start() { if (reduce || running || document.hidden || !onScreen) return; running = true; requestAnimationFrame(loop); }
  function stop() { running = false; }

  resize(); frame(5000);   // one still frame, which is all reduced-motion visitors get
  start();

  if (window.IntersectionObserver) new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; if (onScreen) start(); else stop(); }).observe(footer);
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { resize(); if (!running) frame(5000); }, 150); });
  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });
  if (!reduce) {
    footer.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var r = footer.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (lastP) { pointer.vx = Math.max(-40, Math.min(40, x - lastP.x)); pointer.vy = Math.max(-40, Math.min(40, y - lastP.y)); }
      lastP = { x: x, y: y }; pointer.x = x; pointer.y = y;
    }, { passive: true });
    footer.addEventListener("pointerleave", function () { pointer.x = pointer.y = -9999; lastP = null; });
  }
})();
