(function () {
  function injectWorkLink() {
    if (document.querySelector(".fk-work-link")) return;
    var a = document.createElement("a");
    a.className = "fk-work-link";
    a.href = "../../index.html#work";
    a.textContent = "← Work";
    document.body.appendChild(a);
  }

  function replaceMethodUi() {
    var ui = document.querySelector(".method-artifact .method-ui");
    if (!ui) return;

    var existing = ui.querySelector(".method-payment-shot");
    var nextSrc = "./assets/payment.png";
    if (existing && existing.getAttribute("src") === nextSrc) return;

    ui.dataset.fkPaymentImg = "1";
    ui.classList.add("method-ui--photo");
    ui.innerHTML = "";

    var img = document.createElement("img");
    img.src = nextSrc;
    img.alt =
      "Payment selection concept — UPI recently used and saved Visa previously successful, with full method list below";
    img.className = "method-payment-shot";
    img.loading = "lazy";
    img.decoding = "async";
    ui.appendChild(img);

    var toggle = document.querySelector(
      '.method-artifact [data-testid="button-toggle-methods"]'
    );
    if (toggle) toggle.style.display = "none";
  }

  function ensureCaption(host, label, text, note) {
    if (!host || host.querySelector(".fk-visual-caption")) return;
    var cap = document.createElement("div");
    cap.className = "fk-visual-caption";
    var tag = document.createElement("span");
    tag.className = "fk-visual-caption__label";
    tag.textContent = label;
    var body = document.createElement("p");
    body.className = "fk-visual-caption__text";
    body.textContent = text;
    cap.appendChild(tag);
    cap.appendChild(body);
    if (note) {
      var small = document.createElement("p");
      small.className = "fk-visual-caption__note";
      small.textContent = note;
      cap.appendChild(small);
    }
    host.appendChild(cap);
  }

  function captionOwnershipVisual() {
    var shot = document.querySelector(".visual-proof-ownership .ownership-decision-shot");
    if (!shot) return;
    ensureCaption(
      shot.parentElement,
      "My decision note",
      "One rule for all three states: what the customer is allowed to do comes from the verified payment state, not from the error message."
    );
  }

  function captionBaselineVisual() {
    var shot = document.querySelector(".visual-proof-baseline .baseline-states-shot");
    if (!shot) return;
    ensureCaption(
      shot.parentElement,
      "Where it started",
      "Left: a slow payment leaves the customer waiting with no clear next step. Right: after a bank decline, “Try again” is still the main action — before anyone knows a retry is safe."
    );
  }

  function replaceOwnershipVisual() {
    var section = document.querySelector(".visual-proof-ownership");
    if (!section) return;

    var slot =
      section.querySelector(".visual-proof-slot") ||
      section.querySelector(".visual-proof-empty")?.parentElement;
    var empty = section.querySelector(".visual-proof-empty");
    if (!slot && !empty) return;

    var existing = section.querySelector(".ownership-decision-shot");
    var nextSrc = "./assets/decision-note-2400.png?v=1";
    if (existing && existing.getAttribute("src") === nextSrc) return;

    var host = empty || slot;
    if (!host) return;

    host.classList.remove("visual-proof-empty");
    host.classList.add("visual-proof-filled", "ownership-decision-host");
    host.removeAttribute("role");
    host.removeAttribute("aria-label");
    host.innerHTML = "";

    var img = document.createElement("img");
    img.src = nextSrc;
    img.srcset =
      "./assets/decision-note-1200.png?v=1 1200w, ./assets/decision-note-2400.png?v=1 2400w, ./assets/decision-note-3600.png?v=1 3600w";
    img.sizes = "(max-width: 900px) 96vw, min(1200px, 94vw)";
    img.alt =
      "Decision note v3 — processing, uncertain, and confirmed failure payment screens with annotations, a note that permission to recover comes from the state, and the state progression from attempt to payment confirmed";
    img.className = "ownership-decision-shot";
    img.loading = "eager";
    img.decoding = "async";
    img.width = 2400;
    img.height = 1537;
    host.appendChild(img);
    attachZoom(img, img, "./assets/decision-note-zoom.png?v=1");
  }

  function replaceBaselineVisual() {
    var section = document.querySelector(".visual-proof-baseline");
    if (!section) return;

    var grid = section.querySelector(".visual-proof-grid");
    var nextSrc = "./assets/starting-states-v2-2400.png?v=2";
    var existing = grid && grid.querySelector(".baseline-states-shot");
    if (!grid || (existing && existing.getAttribute("src") === nextSrc)) return;

    grid.classList.add("baseline-states-host");
    grid.innerHTML = "";

    var img = document.createElement("img");
    img.src = nextSrc;
    img.srcset =
      "./assets/starting-states-v2-1200.png?v=2 1200w, ./assets/starting-states-v2-2400.png?v=2 2400w, ./assets/starting-states-v2-3600.png?v=2 3600w";
    img.sizes = "(max-width: 900px) 96vw, min(1200px, 94vw)";
    img.alt =
      "Starting experience — left: payment taking longer than expected with a disabled Checking status button; right: payment could not be completed with Try again and Choose another payment method";
    img.className = "baseline-states-shot";
    img.loading = "lazy";
    img.decoding = "async";
    img.width = 2400;
    img.height = 1146;
    grid.appendChild(img);
    attachZoom(img, img, "./assets/starting-states-v2-zoom.png?v=1");
  }

  function replaceStatesVisual() {
    var section = document.querySelector(".visual-proof-states");
    if (!section) return;

    var grid = section.querySelector(".visual-proof-grid");
    var nextSrc = "./assets/three-states-v5-2400.png?v=1";
    var existing = grid && grid.querySelector(".states-frames-shot");
    if (!grid || (existing && existing.getAttribute("src") === nextSrc)) return;

    grid.classList.add("states-frames-host");
    grid.innerHTML = "";

    var img = document.createElement("img");
    img.src = nextSrc;
    img.srcset =
      "./assets/three-states-v5-1200.png?v=1 1200w, ./assets/three-states-v5-2400.png?v=1 2400w, ./assets/three-states-v5-3600.png?v=1 3600w";
    img.sizes = "(max-width: 900px) 96vw, min(1200px, 94vw)";
    img.alt =
      "Three payment states on the same screen — processing with other methods unavailable, uncertain with Pay disabled and Check payment status, and confirmed failure with an explicit reason, Try another payment method, and Review payment details";
    img.className = "states-frames-shot";
    img.loading = "lazy";
    img.decoding = "async";
    img.width = 2400;
    img.height = 1210;
    grid.appendChild(img);
    attachZoom(img, img, "./assets/three-states-v5-zoom.png?v=1");
  }

  function captionStatesVisual() {
    var shot = document.querySelector(".visual-proof-states .states-frames-shot");
    if (!shot) return;
    ensureCaption(
      shot.parentElement,
      "The three states",
      "Same payment screen, three levels of confidence. Processing keeps the payment visible and other methods locked. Uncertain disables Pay and offers only a status check. Confirmed failure explains why, then unlocks another payment method.",
      "How to read it: left to right, confidence grows. The layout never changes — only the message, the main action, and whether a new payment is allowed. Callouts mark each of those shifts."
    );
  }

  function replaceJourneyVisual() {
    var section = document.querySelector(".visual-proof-journey");
    if (!section) return;

    var grid = section.querySelector(".visual-proof-grid");
    var nextSrc = "./assets/recovery-journey-v3-2400.png?v=1";
    var existing = grid && grid.querySelector(".journey-frames-shot");
    if (!grid || (existing && existing.getAttribute("src") === nextSrc)) return;

    grid.classList.add("journey-frames-host");
    grid.innerHTML = "";

    var img = document.createElement("img");
    img.src = nextSrc;
    img.srcset =
      "./assets/recovery-journey-v3-1200.png?v=1 1200w, ./assets/recovery-journey-v3-2400.png?v=1 2400w, ./assets/recovery-journey-v3-3600.png?v=1 3600w";
    img.sizes = "(max-width: 900px) 96vw, min(1200px, 94vw)";
    img.alt =
      "Recovery journey in three steps — outcome unknown with the order visible and all payment methods locked while status is checked, a payment status page with the order and a progress timeline, and a confirmed failure with the bank's reason, Try another payment method, and Review payment details";
    img.className = "journey-frames-shot";
    img.loading = "lazy";
    img.decoding = "async";
    img.width = 2400;
    img.height = 975;
    grid.appendChild(img);
    attachZoom(img, img, "./assets/recovery-journey-v3-zoom.png?v=1");
  }

  function captionJourneyVisual() {
    var shot = document.querySelector(".visual-proof-journey .journey-frames-shot");
    if (!shot) return;
    ensureCaption(
      shot.parentElement,
      "One journey, end to end",
      "From “we don’t know yet” to a safe next step. Step 1 blocks a second payment while status is unresolved. Step 2 gives the customer a status page with the order, amount, and a clear timeline. Step 3 only unlocks another payment method once the bank confirms the failure.",
      "How to read it: the same order stays visible in every frame, and each screen has just one main action. A new payment is never offered until failure is confirmed."
    );
  }

  function replaceTradeoffVisual() {
    var section = document.querySelector(".visual-proof-iteration");
    if (!section) return;

    var grid = section.querySelector(".visual-proof-grid");
    var nextSrc = "./assets/tradeoff-compare-2400.png?v=1";
    var existing = grid && grid.querySelector(".tradeoff-compare-shot");
    if (!grid || (existing && existing.getAttribute("src") === nextSrc)) return;

    grid.classList.add("tradeoff-compare-host");
    grid.innerHTML = "";

    var img = document.createElement("img");
    img.src = nextSrc;
    img.srcset =
      "./assets/tradeoff-compare-1200.png?v=1 1200w, ./assets/tradeoff-compare-2400.png?v=1 2400w, ./assets/tradeoff-compare-3600.png?v=1 3600w";
    img.sizes = "(max-width: 900px) 96vw, min(1200px, 94vw)";
    img.alt =
      "Comparison — A: a generic Payment failed message with a prominent Retry payment button and all methods open, without order details; B: order details stay visible, the screen explains the payment is being confirmed, Check payment status is the main action, and other payment methods stay unavailable until the outcome is known";
    img.className = "tradeoff-compare-shot";
    img.loading = "lazy";
    img.decoding = "async";
    img.width = 2400;
    img.height = 1439;
    grid.appendChild(img);
    attachZoom(img, img, "./assets/tradeoff-compare-zoom.png?v=1");
  }

  function captionTradeoffVisual() {
    var shot = document.querySelector(".visual-proof-iteration .tradeoff-compare-shot");
    if (!shot) return;
    ensureCaption(
      shot.parentElement,
      "The trade-off",
      "A is the faster path: call it failed and push Retry. It feels helpful, but when the first payment is still unresolved, it invites a second charge. B gives up that speed: keep the order visible, say what we know, make Check payment status the only action, and lock other methods until the outcome is confirmed.",
      "How to read it: same moment, same order. Red callouts mark what puts the customer at risk in A; blue and yellow callouts mark what B changes to keep them safe."
    );
  }

  function openZoomViewer(src, alt) {
    if (document.querySelector(".fk-zoom-viewer")) return;

    var viewer = document.createElement("div");
    viewer.className = "fk-zoom-viewer";
    viewer.setAttribute("role", "dialog");
    viewer.setAttribute("aria-modal", "true");
    viewer.setAttribute("aria-label", "Full-size image");

    var stage = document.createElement("div");
    stage.className = "fk-zoom-viewer__stage";

    var big = document.createElement("img");
    big.className = "fk-zoom-viewer__img";
    big.src = src;
    big.alt = alt;
    big.decoding = "async";
    stage.appendChild(big);

    var close = document.createElement("button");
    close.type = "button";
    close.className = "fk-zoom-viewer__close";
    close.setAttribute("aria-label", "Close full-size image");
    close.textContent = "×";

    var hint = document.createElement("p");
    hint.className = "fk-zoom-viewer__hint";
    var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    hint.textContent = finePointer
      ? "Move to pan · Click or Esc to close"
      : "Drag to explore · Tap × to close";

    viewer.appendChild(stage);
    viewer.appendChild(close);
    viewer.appendChild(hint);
    document.body.appendChild(viewer);

    var prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    function pan(e) {
      var maxX = stage.scrollWidth - stage.clientWidth;
      var maxY = stage.scrollHeight - stage.clientHeight;
      stage.scrollLeft = (e.clientX / stage.clientWidth) * maxX;
      stage.scrollTop = (e.clientY / stage.clientHeight) * maxY;
    }

    function shut() {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prevOverflow;
      viewer.remove();
    }

    function onKey(e) {
      if (e.key === "Escape") shut();
    }

    if (finePointer) {
      stage.addEventListener("mousemove", pan);
      stage.addEventListener("click", shut);
      big.addEventListener("load", function () {
        big.style.width = Math.max(big.naturalWidth / 2, stage.clientWidth) + "px";
        stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2;
        stage.scrollTop = (stage.scrollHeight - stage.clientHeight) / 2;
      });
    }
    close.addEventListener("click", shut);
    document.addEventListener("keydown", onKey);
    close.focus();
  }

  function attachZoom(frame, img, hiSrc) {
    frame.classList.add("fk-zoomable");
    if (frame === img) {
      img.setAttribute("tabindex", "0");
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", "Open full size: " + img.alt);
    }

    if (!frame.nextElementSibling || !frame.nextElementSibling.classList.contains("fk-tap-hint")) {
      var tapHint = document.createElement("span");
      tapHint.className = "fk-tap-hint";
      tapHint.setAttribute("aria-hidden", "true");
      tapHint.innerHTML =
        '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5 9 7M2.5 13.5 7 9"/></svg>Tap to enlarge';
      frame.insertAdjacentElement("afterend", tapHint);
    }

    frame.addEventListener("click", function () {
      openZoomViewer(hiSrc, img.alt);
    });
    frame.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openZoomViewer(hiSrc, img.alt);
      }
    });
  }

  function replaceEvaluationVisual() {
    var section = document.querySelector(".visual-proof-evaluation");
    if (!section) return;

    var grid = section.querySelector(".visual-proof-grid");
    var nextSrc = "./assets/evaluation-framework-3200.png?v=2";
    var existing = grid && grid.querySelector(".evaluation-framework-shot");
    if (!grid || (existing && existing.getAttribute("src") === nextSrc)) return;

    grid.classList.add("evaluation-framework-host");
    grid.innerHTML = "";

    var link = document.createElement("div");
    link.className = "evaluation-framework-link fk-zoom-frame";
    link.setAttribute("role", "button");
    link.setAttribute("tabindex", "0");
    link.setAttribute("aria-label", "Open the evaluation framework at full size");

    var img = document.createElement("img");
    img.src = nextSrc;
    img.srcset =
      "./assets/evaluation-framework-1600.png?v=2 1600w, ./assets/evaluation-framework-2400.png?v=2 2400w, ./assets/evaluation-framework-3200.png?v=2 3200w, ./assets/evaluation-framework-4800.png?v=2 4800w";
    img.sizes = "(max-width: 900px) 96vw, min(1600px, 94vw)";
    img.alt =
      "Reconstructed validation and measurement framework — the three payment states beside a test objective, comprehension prompts, a state-to-event mapping, primary metrics, safety guardrails, and success criteria";
    img.className = "evaluation-framework-shot";
    img.loading = "lazy";
    img.decoding = "async";
    img.width = 3200;
    img.height = 1583;
    link.appendChild(img);
    grid.appendChild(link);
    attachZoom(link, img, "./assets/evaluation-framework-6400.png?v=2");
  }

  function captionEvaluationVisual() {
    var shot = document.querySelector(".visual-proof-evaluation .evaluation-framework-shot");
    if (!shot) return;
    ensureCaption(
      shot.parentElement.parentElement,
      "How I would test it",
      "A reconstructed evaluation plan, not shipped results. Comprehension prompts check whether people can tell pending from failed. Each screen maps to an event so behaviour can be measured. Recovery metrics only count alongside safety guardrails: duplicate charges, support contacts, and incorrect status messages.",
      "How to read it: the screens on the left are what gets tested; the panels on the right define what success means and what must not get worse. Click the image to open it full screen."
    );
  }

  function boot() {
    injectWorkLink();
    replaceMethodUi();
    replaceOwnershipVisual();
    replaceBaselineVisual();
    replaceStatesVisual();
    replaceJourneyVisual();
    replaceTradeoffVisual();
    replaceEvaluationVisual();
    captionOwnershipVisual();
    captionBaselineVisual();
    captionStatesVisual();
    captionJourneyVisual();
    captionTradeoffVisual();
    captionEvaluationVisual();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(boot, 100);
      setTimeout(boot, 600);
      setTimeout(boot, 1200);
    });
  } else {
    setTimeout(boot, 100);
    setTimeout(boot, 600);
  }

  var mobileQuery = window.matchMedia("(max-width: 767px)");
  var lastActiveNav = null;
  var navTicking = false;

  function followActiveNav() {
    navTicking = false;
    if (!mobileQuery.matches) return;
    var nav = document.querySelector(".editorial-nav .nav-inner");
    var active = nav && nav.querySelector("button.active");
    if (!active || active === lastActiveNav) return;
    lastActiveNav = active;
    nav.scrollTo({ left: Math.max(0, active.offsetLeft - 20), behavior: "smooth" });
  }

  window.addEventListener(
    "scroll",
    function () {
      if (navTicking) return;
      navTicking = true;
      window.requestAnimationFrame(followActiveNav);
    },
    { passive: true }
  );

  var observer = new MutationObserver(function () {
    replaceMethodUi();
    replaceOwnershipVisual();
    replaceBaselineVisual();
    replaceStatesVisual();
    replaceJourneyVisual();
    replaceTradeoffVisual();
    replaceEvaluationVisual();
    captionOwnershipVisual();
    captionBaselineVisual();
    captionStatesVisual();
    captionJourneyVisual();
    captionTradeoffVisual();
    captionEvaluationVisual();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
