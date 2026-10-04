/* Guided tour: points visitors through the five case-study screens. */
(function () {
  "use strict";

  var KEY_OFF = "nova.tour.off";
  var KEY_LAST = "nova.tour.last";
  var KEY_DONE = "nova.tour.done";

  var STEPS = [
    { page: "readiness", target: ".mc-open", msg: "Launch readiness is 78% and France · TikTok is blocked. Click <b>Open full view</b> on Markets × Channels to see where." },
    { page: "markets", target: "#sr-queue", msg: "France · TikTok is the blocked cell, selected on the right. Click <b>Open blocker queue</b>." },
    { page: "queue", target: "#q3-go", msg: "The queue ranks blockers by launch risk. Click <b>Investigate</b> on France · TikTok." },
    { page: "queue", target: "[data-impact]", msg: "The cause, impact, and owner are in one place. Click <b>Review change impact</b>.", sub: true },
    { page: "impact", target: "#ci-submit", msg: "“Save $100” becomes “Save 25%”. Every affected experience is classified first. Click <b>Submit for review</b>." },
    { page: "handoff", target: "#rh-send", msg: "Reviews route to Adobe Review, Workfront, and AEM with context attached. Click <b>Send for review</b>." },
    { page: "handoff", target: "[data-ok]", msg: "The note, claim change, and campaign context go with the request. Click <b>Send</b> to finish.", sub: true },
  ];
  var TOTAL = 5;

  var page = (location.pathname.split("/").pop() || "readiness.html").replace(".html", "") || "readiness";
  var params = new URLSearchParams(location.search);

  function get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function del(k) { try { sessionStorage.removeItem(k); } catch (e) {} }

  if (params.get("tour") === "1") { del(KEY_OFF); del(KEY_DONE); }

  var ring = null;
  var bar = null;
  var resume = null;
  var raf = 0;

  function stepNumber(step) {
    return ["readiness", "markets", "queue", "impact", "handoff"].indexOf(step.page) + 1;
  }

  function currentStep() {
    var onPage = STEPS.filter(function (s) { return s.page === page; });
    if (!onPage.length) return null;
    for (var i = onPage.length - 1; i >= 0; i--) {
      if (onPage[i].sub && document.querySelector(onPage[i].target)) return onPage[i];
    }
    return onPage[0];
  }

  function dots(n) {
    var html = "";
    for (var i = 1; i <= TOTAL; i++) {
      html += '<i class="' + (i < n ? "is-done" : i === n ? "is-now" : "") + '"></i>';
    }
    return '<span class="ng-bar__dots" aria-hidden="true">' + html + "</span>";
  }

  function clearUi() {
    cancelAnimationFrame(raf);
    [ring, bar, resume].forEach(function (el) { if (el) el.remove(); });
    ring = bar = resume = null;
  }

  function showResume() {
    clearUi();
    resume = document.createElement("div");
    resume.className = "ng-resume";
    resume.innerHTML = '<button type="button" class="ng-btn">Guided tour</button>';
    resume.querySelector("button").addEventListener("click", function () {
      del(KEY_OFF);
      render();
    });
    document.body.appendChild(resume);
  }

  function makeBar(html, actions) {
    bar = document.createElement("div");
    bar.className = "ng-bar";
    bar.setAttribute("role", "status");
    bar.innerHTML = '<div class="ng-bar__text">' + html + '</div><div class="ng-bar__actions">' + actions + "</div>";
    document.body.appendChild(bar);
    var skip = bar.querySelector("[data-ng-skip]");
    if (skip) skip.addEventListener("click", function () { set(KEY_OFF, "1"); showResume(); });
    var restart = bar.querySelector("[data-ng-restart]");
    if (restart) restart.addEventListener("click", function () { del(KEY_DONE); del(KEY_OFF); location.href = "readiness.html"; });
  }

  function track(selector) {
    ring = document.createElement("div");
    ring.className = "ng-ring";
    ring.style.display = "none";
    document.body.appendChild(ring);
    var scrolled = false;
    (function loop() {
      var el = document.querySelector(selector);
      if (el && el.getClientRects().length) {
        if (!scrolled) {
          el.scrollIntoView({ block: "nearest", inline: "nearest" });
          scrolled = true;
        }
        var r = el.getBoundingClientRect();
        ring.style.display = "block";
        ring.style.top = r.top - 4 + "px";
        ring.style.left = r.left - 4 + "px";
        ring.style.width = r.width + 8 + "px";
        ring.style.height = r.height + 8 + "px";
      } else {
        ring.style.display = "none";
      }
      raf = requestAnimationFrame(loop);
    })();
  }

  function render() {
    clearUi();
    if (get(KEY_OFF)) return showResume();

    if (page === "handoff" && get(KEY_DONE)) {
      makeBar(
        '<span class="ng-bar__step">Tour complete' + dots(TOTAL + 1) + '</span><span class="ng-bar__msg">The blocker is routed with its context, and readiness will recalculate when reviews come back. Explore any screen freely.</span>',
        '<button type="button" class="ng-btn" data-ng-restart>Restart</button><button type="button" class="ng-btn ng-btn--primary" data-ng-skip>Explore</button>'
      );
      return;
    }

    var step = currentStep();
    if (!step) {
      var last = get(KEY_LAST) || "readiness";
      makeBar(
        '<span class="ng-bar__step">Exploring freely</span><span class="ng-bar__msg">This screen is outside the five-step flow.</span>',
        '<a class="ng-btn ng-btn--primary" href="' + last + '.html">Back to the tour</a><button type="button" class="ng-btn" data-ng-skip>Hide</button>'
      );
      return;
    }

    set(KEY_LAST, step.page);
    var n = stepNumber(step);
    makeBar(
      '<span class="ng-bar__step">Step ' + n + " of " + TOTAL + dots(n) + '</span><span class="ng-bar__msg">' + step.msg + "</span>",
      '<button type="button" class="ng-btn" data-ng-skip>Explore freely</button>'
    );
    track(step.target);
  }

  document.addEventListener("click", function (e) {
    if (page === "handoff" && e.target.closest("[data-ok]")) {
      set(KEY_DONE, "1");
      setTimeout(render, 50);
    }
  }, true);

  var lastSub = null;
  new MutationObserver(function () {
    if (get(KEY_OFF) || (page !== "queue" && page !== "handoff")) return;
    if (page === "handoff" && get(KEY_DONE)) return;
    var step = currentStep();
    if (step && step.target !== lastSub) {
      lastSub = step.target;
      render();
    }
  }).observe(document.body, { childList: true, subtree: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
