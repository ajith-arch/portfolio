(function () {
  var data = window.FK_RESULTS;
  if (!data) return;

  var draft = /[?&]draft=1\b/.test(window.location.search);
  var illustrative = !data.verified && data.illustrative === true;
  if (!data.verified && !illustrative && !draft) return;

  var MINUS = "\u2212";

  var METRICS = [
    {
      key: "recovered",
      group: "North star",
      label: "Intended orders recovered",
      get: function (d) { return d.outcomes.recovered; },
      unit: "pct",
      better: "up",
      definition: "Delayed attempts that ended in a completed order in the same cart within 24 hours."
    },
    {
      key: "rebuilt",
      group: "Recovery",
      label: "Cart rebuilds",
      get: function (d) { return d.outcomes.rebuilt; },
      unit: "pct",
      better: "down",
      definition: "Delayed attempts where the customer left and rebuilt the same cart."
    },
    {
      key: "duplicateDebits",
      group: "Safety",
      label: "Duplicate debits",
      get: function (d) { return d.safety.duplicateDebits; },
      unit: "per1k",
      better: "down",
      definition: "A second debit for one intended order, per 1,000 delayed attempts."
    },
    {
      key: "immediateRetries",
      group: "Safety",
      label: "Retries within 30 seconds",
      get: function (d) { return d.safety.immediateRetries; },
      unit: "pct",
      better: "down",
      definition: "Delayed attempts followed by a second payment attempt within 30 seconds, through any channel."
    },
    {
      key: "supportContacts",
      group: "Trust",
      label: "“Money debited / order unconfirmed” tickets",
      get: function (d) { return d.safety.supportContacts; },
      unit: "per1k",
      better: "down",
      definition: "Support tickets in that category, per 1,000 delayed attempts."
    },
    {
      key: "statusMismatch",
      group: "Accuracy",
      label: "Status mismatches",
      get: function (d) { return d.safety.statusMismatch; },
      unit: "pct",
      better: "down",
      definition: "Delayed attempts where the screen contradicted the final ledger state."
    },
    {
      key: "minutesToFinal",
      group: "Accepted cost",
      label: "Median time to a final state",
      get: function (d) { return d.cost.minutesToFinal; },
      unit: "min",
      better: "down",
      accepted: true,
      definition: "Minutes from attempt to a final state on screen. Expected to rise: the design waits for certainty."
    }
  ];

  var HEADLINE = ["recovered", "duplicateDebits", "supportContacts", "statusMismatch"];

  function isNum(v) {
    return typeof v === "number" && isFinite(v);
  }

  function fmt(v, unit) {
    if (!isNum(v)) return "—";
    if (unit === "pct") return v.toFixed(1) + "%";
    if (unit === "per1k") return v.toFixed(1);
    if (unit === "min") return v.toFixed(1) + " min";
    return String(v);
  }

  function unitSuffix(unit) {
    if (unit === "per1k") return " per 1,000";
    return "";
  }

  function signed(n, digits) {
    var s = Math.abs(n).toFixed(digits);
    if (Number(s) === 0) return s;
    return (n > 0 ? "+" : MINUS) + s;
  }

  function delta(pair, metric) {
    if (!pair || !isNum(pair.pre) || !isNum(pair.post)) return null;
    var abs = pair.post - pair.pre;
    var rel = pair.pre !== 0 ? (abs / pair.pre) * 100 : null;
    var improved = metric.better === "up" ? abs > 0 : abs < 0;
    var absText =
      metric.unit === "pct"
        ? signed(abs, 1) + " pts"
        : metric.unit === "min"
          ? signed(abs, 1) + " min"
          : signed(abs, 1);
    return {
      abs: abs,
      text: absText + (rel === null ? "" : " (" + signed(rel, 1) + "%)"),
      tone: abs === 0 ? "flat" : metric.accepted ? "cost" : improved ? "good" : "bad"
    };
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function metricByKey(key) {
    for (var i = 0; i < METRICS.length; i++) if (METRICS[i].key === key) return METRICS[i];
    return null;
  }

  function outcomeIssues() {
    var issues = [];
    ["pre", "post"].forEach(function (w) {
      var o = data.outcomes;
      var vals = [o.recovered[w], o.rebuilt[w], o.abandoned[w]];
      if (!vals.every(isNum)) return;
      var sum = vals[0] + vals[1] + vals[2];
      if (Math.abs(sum - 100) > 0.5) {
        issues.push(
          (w === "pre" ? "Before" : "After") +
            ": recovered + rebuilt + abandoned = " +
            sum.toFixed(1) +
            "%, must equal 100%."
        );
      }
    });
    return issues;
  }

  function pendingCount() {
    var n = 0;
    METRICS.forEach(function (m) {
      var p = m.get(data);
      if (!isNum(p.pre)) n++;
      if (!isNum(p.post)) n++;
    });
    if (!isNum(data.outcomes.abandoned.pre)) n++;
    if (!isNum(data.outcomes.abandoned.post)) n++;
    if (!isNum(data.attempts.pre)) n++;
    if (!isNum(data.attempts.post)) n++;
    if (data.normalized === null) n++;
    if (!data.attribution) n++;
    return n;
  }

  function draftBanner() {
    if (data.verified || illustrative) return null;
    var box = el("div", "fk-draft");
    var issues = outcomeIssues();
    var missing = pendingCount();
    box.appendChild(el("strong", null, "Draft · hidden on the live site"));
    box.appendChild(
      el(
        "span",
        null,
        missing
          ? missing + " values still need verified team data in results-data.js."
          : "All values entered. Set verified: true to publish."
      )
    );
    issues.forEach(function (msg) {
      box.appendChild(el("span", "fk-draft__issue", msg));
    });
    return box;
  }

  function disclosureText() {
    var parts = [];
    parts.push(data.window.pre + " vs " + data.window.post + ".");
    if (isNum(data.attempts.pre) && isNum(data.attempts.post)) {
      parts.push(
        "Delayed-status attempts: " +
          data.attempts.pre.toLocaleString("en-US") +
          " before, " +
          data.attempts.post.toLocaleString("en-US") +
          " after."
      );
    }
    if (data.normalized === true) {
      parts.push("Figures are scaled for confidentiality; direction and relative size are kept.");
    } else if (data.normalized === false) {
      parts.push("Figures are unscaled internal numbers shared with permission.");
    }
    parts.push("Source: " + data.source + ".");
    return parts.join(" ");
  }

  /* ---------- Impact strip near the top ---------- */
  function buildImpact() {
    var wrap = el("section", "fk-impact");
    wrap.id = "fk-impact";
    wrap.setAttribute("aria-label", "Outcome after rollout");
    var inner = el("div", "fk-impact__inner");
    var banner = draftBanner();
    if (banner) inner.appendChild(banner);

    var head = el("div", "fk-impact__head");
    head.appendChild(el("span", "fk-impact__kicker", "Outcome after rollout"));
    head.appendChild(el("span", "fk-impact__window", data.window.pre + " vs " + data.window.post));
    inner.appendChild(head);

    var grid = el("div", "fk-impact__grid");
    HEADLINE.forEach(function (key) {
      var m = metricByKey(key);
      var pair = m.get(data);
      var d = delta(pair, m);
      var tile = el("div", "fk-impact__tile");
      tile.appendChild(el("span", "fk-impact__group", m.group));
      var value = el("strong", "fk-impact__value" + (isNum(pair.post) ? "" : " is-pending"), fmt(pair.post, m.unit));
      if (m.unit === "per1k" && isNum(pair.post)) value.appendChild(el("small", null, " / 1,000"));
      tile.appendChild(value);
      tile.appendChild(el("span", "fk-impact__label", m.label));
      tile.appendChild(
        el(
          "span",
          "fk-impact__delta" + (d ? " tone-" + d.tone : " is-pending"),
          d ? d.text + " vs before (" + fmt(pair.pre, m.unit) + unitSuffix(m.unit) + ")" : "Awaiting team data"
        )
      );
      grid.appendChild(tile);
    });
    inner.appendChild(grid);

    var foot = el("div", "fk-impact__foot");
    var link = el("a", "fk-impact__link", "How this was measured");
    link.href = "#fk-results";
    link.addEventListener("click", function (e) {
      var target = document.getElementById("fk-results");
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    foot.appendChild(link);
    if (!illustrative && data.normalized === true) foot.appendChild(el("span", null, "Figures scaled for confidentiality"));
    inner.appendChild(foot);

    wrap.appendChild(inner);
    return wrap;
  }

  /* ---------- Outcome split: every delayed attempt in one bucket ---------- */
  function buildOutcomeSplit() {
    var box = el("div", "fk-split");
    box.appendChild(el("span", "fk-results__label", "Where every delayed payment ended up"));
    var buckets = [
      ["recovered", "Recovered in the same cart"],
      ["rebuilt", "Left and rebuilt the cart"],
      ["abandoned", "No order within 24 hours"]
    ];
    [["pre", "Before"], ["post", "After"]].forEach(function (w) {
      var row = el("div", "fk-split__row");
      row.appendChild(el("span", "fk-split__name", w[1]));
      var bar = el("div", "fk-split__bar");
      var complete = buckets.every(function (b) { return isNum(data.outcomes[b[0]][w[0]]); });
      if (!complete) bar.classList.add("is-pending");
      buckets.forEach(function (b) {
        var v = data.outcomes[b[0]][w[0]];
        var seg = el("span", "fk-split__seg seg-" + b[0]);
        seg.style.flexGrow = complete ? String(v) : "1";
        if (complete && v >= 7) seg.textContent = v.toFixed(1) + "%";
        seg.title = b[1] + ": " + fmt(v, "pct");
        bar.appendChild(seg);
      });
      row.appendChild(bar);
      box.appendChild(row);
    });
    var legend = el("div", "fk-split__legend");
    buckets.forEach(function (b) {
      var item = el("span", "seg-" + b[0]);
      item.appendChild(el("i"));
      item.appendChild(document.createTextNode(b[1]));
      legend.appendChild(item);
    });
    box.appendChild(legend);
    return box;
  }

  function buildTable() {
    var table = el("div", "fk-table");
    table.setAttribute("role", "table");
    table.setAttribute("aria-label", "Before and after metrics");
    var head = el("div", "fk-table__row fk-table__head");
    head.setAttribute("role", "row");
    ["Metric", "Before", "After", "Change", "Definition"].forEach(function (h) {
      var c = el("span", null, h);
      c.setAttribute("role", "columnheader");
      head.appendChild(c);
    });
    table.appendChild(head);

    METRICS.forEach(function (m) {
      var pair = m.get(data);
      var d = delta(pair, m);
      var row = el("div", "fk-table__row" + (m.accepted ? " is-cost" : ""));
      row.setAttribute("role", "row");
      var name = el("div", "fk-table__metric");
      name.appendChild(el("span", "fk-table__group", m.group));
      name.appendChild(el("strong", null, m.label));
      var cells = [
        name,
        el("span", "fk-table__num" + (isNum(pair.pre) ? "" : " is-pending"), fmt(pair.pre, m.unit) + (isNum(pair.pre) ? unitSuffix(m.unit) : "")),
        el("span", "fk-table__num" + (isNum(pair.post) ? "" : " is-pending"), fmt(pair.post, m.unit) + (isNum(pair.post) ? unitSuffix(m.unit) : "")),
        el("span", "fk-table__delta" + (d ? " tone-" + d.tone : " is-pending"), d ? d.text : "—"),
        el("p", "fk-table__def", m.definition)
      ];
      var heads = ["Metric", "Before", "After", "Change", "Definition"];
      cells.forEach(function (c, i) {
        c.setAttribute("role", "cell");
        c.setAttribute("data-head", heads[i]);
        row.appendChild(c);
      });
      table.appendChild(row);
    });
    return table;
  }

  function buildMethod() {
    var grid = el("div", "fk-method");
    var items = [
      ["Window", data.window.pre + " vs " + data.window.post + ", same cohort definition in both."],
      [
        "Denominator",
        "Payment attempts whose status was delayed (bank timeout or late PSP callback)" +
          (isNum(data.attempts.pre) && isNum(data.attempts.post)
            ? ": " + data.attempts.pre.toLocaleString("en-US") + " before, " + data.attempts.post.toLocaleString("en-US") + " after."
            : ".")
      ],
      ["Attribution", data.attribution || "Awaiting the team’s description of the controls used."]
    ];
    items.forEach(function (it) {
      var cell = el("div", "fk-method__item");
      cell.appendChild(el("span", "fk-results__label", it[0]));
      cell.appendChild(el("p", it[0] === "Attribution" && !data.attribution ? "is-pending" : null, it[1]));
      grid.appendChild(cell);
    });
    return grid;
  }

  function buildResearch() {
    var r = data.research;
    var box = el("div", "fk-research");
    var intro = el("div", "fk-research__intro");
    intro.appendChild(el("span", "fk-results__label", "Usability check · 5 participants"));
    var split =
      isNum(r.moderated) && isNum(r.unmoderated)
        ? r.moderated + " moderated, " + r.unmoderated + " unmoderated, simulated UPI delay."
        : "Moderated / unmoderated split awaiting team data.";
    intro.appendChild(el("p", "fk-research__task", "“" + r.task + "”"));
    intro.appendChild(el("p", "fk-research__meta" + (isNum(r.moderated) ? "" : " is-pending"), split));
    box.appendChild(intro);

    var list = el("div", "fk-research__list");
    r.findings.forEach(function (f) {
      var row = el("div", "fk-research__row");
      var dots = el("span", "fk-dots");
      dots.setAttribute("aria-hidden", "true");
      for (var i = 0; i < 5; i++) {
        dots.appendChild(el("i", isNum(f.count) && i < f.count ? (f.better === "down" ? "is-on is-risk" : "is-on") : null));
      }
      row.appendChild(dots);
      row.appendChild(el("strong", "fk-research__count" + (isNum(f.count) ? "" : " is-pending"), isNum(f.count) ? f.count + "/5" : "—/5"));
      row.appendChild(el("span", "fk-research__text", f.text));
      list.appendChild(row);
    });
    box.appendChild(list);
    if (r.notes && r.notes.length) {
      var notes = el("div", "fk-research__notes");
      notes.appendChild(el("span", "fk-results__label", "Session notes"));
      r.notes.forEach(function (n) {
        var item = el("p", "fk-research__note");
        item.appendChild(el("strong", null, n.who + " "));
        item.appendChild(document.createTextNode(n.text));
        notes.appendChild(item);
      });
      box.appendChild(notes);
    }
    box.appendChild(el("p", "fk-results__fine", "Five people show whether the states are understood, not how often. Read alongside the rollout data above."));
    return box;
  }

  function buildQuotes() {
    var shown = data.quotes.filter(function (q) {
      return q.text && (illustrative || (q.verbatim && q.approved));
    });
    if (!shown.length && (data.verified || illustrative)) return null;
    var box = el("div", "fk-quotes");
    box.appendChild(el("span", "fk-results__label", "From the team"));
    if (!shown.length) {
      box.appendChild(el("p", "is-pending", "Only verbatim, approved quotes appear here. None added yet."));
      return box;
    }
    var grid = el("div", "fk-quotes__grid");
    shown.forEach(function (q) {
      var fig = el("figure", "fk-quote");
      fig.appendChild(el("blockquote", null, "“" + q.text + "”"));
      fig.appendChild(el("figcaption", null, q.role));
      grid.appendChild(fig);
    });
    box.appendChild(grid);
    return box;
  }

  function buildEvents() {
    var ev = data.events;
    if (!ev.confirmed && (data.verified || illustrative)) return null;
    var box = el("div", "fk-events");
    box.appendChild(el("span", "fk-results__label", "How each state was instrumented"));
    if (!ev.confirmed) box.appendChild(el("p", "is-pending fk-events__note", "Event names awaiting engineering confirmation."));
    var grid = el("div", "fk-events__grid");
    ev.states.forEach(function (s, i) {
      var card = el("div", "fk-event");
      card.appendChild(el("span", "fk-event__index", "0" + (i + 1) + " / " + s.name));
      var dl = el("dl");
      [["System trigger", s.trigger], ["UI event", s.uiEvent], ["Allowed", s.allowed], ["Blocked", s.blocked]].forEach(function (pair) {
        dl.appendChild(el("dt", null, pair[0]));
        var dd = el("dd", /trigger|UI event/i.test(pair[0]) ? "is-code" : null, pair[1] || "—");
        if (!pair[1]) dd.classList.add("is-pending");
        dl.appendChild(dd);
      });
      card.appendChild(dl);
      grid.appendChild(card);
    });
    box.appendChild(grid);
    return box;
  }

  function buildResults() {
    var wrap = el("div", "fk-results");
    wrap.id = "fk-results";
    var banner = draftBanner();
    if (banner) wrap.appendChild(banner);

    var head = el("div", "fk-results__head");
    head.appendChild(el("span", "fk-results__kicker", "What happened after rollout"));
    head.appendChild(el("h3", null, "The readout, measured the way I planned it."));
    head.appendChild(
      el(
        "p",
        null,
        "Recovery only counts next to safety. Every metric below uses the same denominator, and the cost I accepted is reported, not hidden."
      )
    );
    wrap.appendChild(head);

    wrap.appendChild(buildOutcomeSplit());
    wrap.appendChild(buildTable());
    wrap.appendChild(buildMethod());
    wrap.appendChild(buildResearch());
    var quotes = buildQuotes();
    if (quotes) wrap.appendChild(quotes);
    var events = buildEvents();
    if (events) wrap.appendChild(events);
    wrap.appendChild(el("p", "fk-results__disclosure", disclosureText()));
    return wrap;
  }

  /* ---------- Evidence cards inside each chapter ---------- */
  function pair(key) {
    return metricByKey(key).get(data);
  }

  function stat(key, mode) {
    var m = metricByKey(key);
    var p = m.get(data);
    var d = delta(p, m);
    var unit = m.unit === "per1k" ? " per 1,000" : "";
    return {
      value: mode === "pre" ? fmt(p.pre, m.unit) : fmt(p.pre, m.unit) + " → " + fmt(p.post, m.unit),
      unit: unit,
      delta: mode === "pre" ? null : d,
      label: mode === "pre" ? m.label + ", before the change" : m.label
    };
  }

  function researchStat(index) {
    var f = data.research.findings[index];
    if (!f || !isNum(f.count)) return null;
    return { value: f.count + "/5", unit: "", delta: null, label: f.text };
  }

  function evidenceCards() {
    var o = data.outcomes;
    return [
      {
        section: "evidence",
        kicker: "What it cost before",
        stats: [stat("rebuilt", "pre"), stat("supportContacts", "pre")],
        text: "One generic error screen made four different problems look the same. Customers paid for it in rebuilt carts and support calls."
      },
      {
        section: "system",
        kicker: "The gap in numbers",
        stats: [stat("statusMismatch", "pre")],
        text: "Before the change, the screen often showed a state the ledger later contradicted. That gap is why confidence, not the error code, had to drive the UI."
      },
      {
        section: "prioritize",
        kicker: "Protecting P0 first",
        stats: [stat("duplicateDebits")],
        text: "Starting with the transaction-unknown case removed most duplicate debits: the single most expensive failure for the customer."
      },
      {
        section: "states",
        kicker: "What the gates changed",
        stats: [stat("immediateRetries"), researchStat(2)].filter(Boolean),
        text: "Locking retry until the state is known replaced panic retries with a status check people could find on their own."
      },
      {
        section: "decision",
        kicker: "Permission follows confidence",
        stats: [stat("statusMismatch")],
        text: "Tying every action to verified confidence meant the screen stopped claiming more than the ledger knew."
      },
      {
        section: "artifacts",
        kicker: "Order kept in place",
        stats: [stat("rebuilt"), stat("recovered")],
        text: "Keeping the order on screen through every state meant fewer people rebuilt their cart, and more orders completed where they started."
      },
      {
        section: "tradeoffs",
        kicker: "The price of refusing",
        stats: [stat("minutesToFinal"), stat("recovered")],
        text:
          "Waiting for certainty cost about " +
          (pair("minutesToFinal").post - pair("minutesToFinal").pre).toFixed(1) +
          " minutes per delayed payment. It bought more recovered orders, with abandonment flat (" +
          fmt(o.abandoned.pre, "pct") +
          " → " +
          fmt(o.abandoned.post, "pct") +
          ")."
      }
    ];
  }

  function buildEvidence(card) {
    var box = el("aside", "fk-evidence");
    box.setAttribute("data-fk-evidence", card.section);
    var head = el("div", "fk-evidence__head");
    head.appendChild(el("span", "fk-results__label", card.kicker));
    box.appendChild(head);
    var stats = el("div", "fk-evidence__stats");
    card.stats.forEach(function (s) {
      var item = el("div", "fk-evidence__stat");
      var v = el("strong", "fk-evidence__value", s.value);
      if (s.unit) v.appendChild(el("small", null, s.unit));
      item.appendChild(v);
      item.appendChild(el("span", "fk-evidence__label", s.label));
      if (s.delta) item.appendChild(el("span", "fk-evidence__delta tone-" + s.delta.tone, s.delta.text));
      stats.appendChild(item);
    });
    box.appendChild(stats);
    box.appendChild(el("p", "fk-evidence__text", card.text));
    return box;
  }

  function mountEvidence() {
    evidenceCards().forEach(function (card) {
      var section = document.getElementById(card.section);
      if (!section || section.querySelector('[data-fk-evidence="' + card.section + '"]')) return;
      var ready = card.stats.every(function (s) { return s && s.value.indexOf("—") === -1; });
      if (!ready) return;
      var visual = section.querySelector(":scope > .visual-proof");
      var node = buildEvidence(card);
      if (visual) section.insertBefore(node, visual);
      else section.appendChild(node);
    });
  }

  function alignReadingNote() {
    if (!illustrative) return;
    var nodes = document.querySelectorAll("#evidence p, #evidence span");
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.dataset.fkNote || n.children.length) continue;
      if (n.textContent.indexOf("I am not inventing research quotes") === -1) continue;
      n.dataset.fkNote = "1";
      n.textContent = "Firsthand on role and direction.";
    }
  }

  function mount() {
    alignReadingNote();
    mountEvidence();
    var scope = document.getElementById("scope");
    if (scope && !document.getElementById("fk-impact")) {
      scope.parentNode.insertBefore(buildImpact(), scope);
    }

    var measure = document.getElementById("measure");
    var plan = measure && measure.querySelector(".measurement-plan");
    if (plan && !document.getElementById("fk-results")) {
      plan.parentNode.insertBefore(buildResults(), plan.nextSibling);
    }

    if (data.verified || illustrative) {
      var disclaimer = document.querySelector("#measure .plan-disclaimer");
      if (disclaimer && !disclaimer.dataset.fkResults) {
        disclaimer.dataset.fkResults = "1";
        disclaimer.textContent = "Planned before build; results below are from the rollout.";
      }
    }
  }

  function boot() {
    mount();
    var tries = 0;
    var timer = setInterval(function () {
      mount();
      if (++tries > 20) clearInterval(timer);
    }, 300);
    new MutationObserver(mount).observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
