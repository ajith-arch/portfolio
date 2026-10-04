(function () {
  const { flag, mask, thumb, channelIcon, openMenu, openModal, closeModal, openDrawer, closeDrawer, toast } = Nova;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const MK = { fr: "France", de: "Germany", uk: "UK", jp: "Japan", us: "US", au: "Australia" };
  const DEST = {
    "Adobe Review": "assets/icons/dest-adobe-review.svg",
    Workfront: "assets/icons/dest-workfront.svg",
    "AEM Assets": "assets/icons/dest-aem.svg",
  };
  const STATUS = { required: "Required", notstarted: "Not started", awaiting: "Awaiting review", inreview: "In review", approved: "Approved", changes: "Changes requested" };
  const ACTION = { required: "Open review", notstarted: "Open review", changes: "Open review", awaiting: "Send", inreview: "View", approved: "View" };
  const TYPE = {
    "Regional legal": ["Regional Legal", "Adobe Review"],
    "Localization review": ["Localization Ops", "Workfront"],
    "Policy check": ["Legal Review", "Adobe Review"],
    "Local override": ["Creative Ops", "AEM Assets"],
    "Brand review": ["Creative Ops", "Adobe Review"],
  };
  const THUMBS = Nova.THUMB_MIX.filter((k) => k !== "youtube");

  /* Figma screen 06 rows first; 20 review requirements across 6 markets */
  const RAW = [
    ["Summer Sale - Hero Banner", "EXP-001", "fr", "TikTok", "Regional legal", "Promotional claim changed", "required", 8, "Today · 4:00 PM"],
    ["Product Page - Headline", "EXP-014", "de", "Instagram", "Localization review", "Translated copy required", "awaiting", 4, "Today · 5:00 PM"],
    ["Email - Launch", "EXP-028", "uk", "Email", "Policy check", "Claim compliance verification", "inreview", 2, "Tomorrow · 2:00 PM"],
    ["YouTube Pre-roll", "EXP-045", "jp", "YouTube", "Local override", "Market-specific messaging", "approved", 3, "Tomorrow · 5:00 PM"],
    ["Instagram Story", "EXP-052", "de", "Instagram", "Localization review", "German copy required", "awaiting", 2, "Oct 1 · 10:00 AM"],
    ["Localized Landing Page", "EXP-061", "fr", "Web", "Regional legal", "Localized claim review", "notstarted", 5, "Oct 1 · 1:00 PM"],
    ["Spark Ad - 9:16", "EXP-064", "us", "TikTok", "Brand review", "Claim appears in headline", "inreview", 3, "Oct 1 · 3:00 PM"],
    ["Feed Post - Carousel", "EXP-067", "fr", "Instagram", "Regional legal", "Percentage claim in France", "required", 4, "Today · 6:00 PM"],
    ["Newsletter - Hero", "EXP-070", "au", "Email", "Policy check", "Claim compliance verification", "awaiting", 1, "Oct 1 · 11:00 AM"],
    ["Bumper Ad 6s", "EXP-073", "jp", "YouTube", "Localization review", "Japanese copy required", "notstarted", 2, "Oct 2 · 9:00 AM"],
    ["Homepage Takeover", "EXP-076", "us", "Web", "Brand review", "Claim appears in hero banner", "approved", 6, "Tomorrow · 11:00 AM"],
    ["Creator Collab Reel", "EXP-079", "de", "TikTok", "Regional legal", "Percentage claim in Germany", "required", 3, "Today · 5:30 PM"],
    ["Story - Countdown", "EXP-082", "uk", "Instagram", "Brand review", "Claim appears in sticker", "awaiting", 1, "Oct 1 · 2:00 PM"],
    ["Pre-order Email", "EXP-085", "de", "Email", "Localization review", "German subject line", "inreview", 2, "Tomorrow · 4:00 PM"],
    ["Shorts - Unboxing", "EXP-088", "au", "YouTube", "Brand review", "Claim in end card", "notstarted", 1, "Oct 2 · 10:00 AM"],
    ["Product Detail - Specs", "EXP-091", "jp", "Web", "Local override", "Market-specific messaging", "awaiting", 2, "Oct 1 · 4:00 PM"],
    ["Launch Teaser", "EXP-094", "fr", "TikTok", "Localization review", "French copy required", "awaiting", 3, "Oct 1 · 9:00 AM"],
    ["Reel - Sound Test", "EXP-097", "us", "Instagram", "Policy check", "Claim compliance verification", "approved", 1, "Tomorrow · 1:00 PM"],
    ["Cart Reminder Email", "EXP-100", "uk", "Email", "Policy check", "Discount wording check", "inreview", 2, "Tomorrow · 3:00 PM"],
    ["Display - Retargeting", "EXP-103", "de", "Web", "Local override", "Market-specific messaging", "required", 2, "Today · 6:30 PM"],
  ];
  const REVIEWS = RAW.map(([name, id, m, ch, type, why, st, dep, due], i) => ({ name, id, m, ch, type, why, st, dep, due, owner: TYPE[type][0], dest: TYPE[type][1], thumb: ch === "YouTube" && i % 2 ? "youtube" : THUMBS[(i * 7 + 3) % THUMBS.length], i }));

  const OVERRIDES = [
    ["Localized Landing Page", "EXP-061", "fr", "Web", "Économisez 25 % dès maintenant", "pending"],
    ["Display - Retargeting", "EXP-103", "de", "Web", "Jetzt 25 % sparen", "pending"],
    ["YouTube Pre-roll", "EXP-045", "jp", "YouTube", "今なら25%オフ", "kept"],
    ["Product Detail - Specs", "EXP-091", "jp", "Web", "25%オフ・期間限定", "pending"],
    ["Feed Post - Carousel", "EXP-067", "fr", "Instagram", "−25 % sur Nova", "pending"],
    ["Pre-order Email", "EXP-085", "de", "Email", "25 % Rabatt bei Vorbestellung", "applied"],
  ].map(([name, id, m, ch, local, dec], i) => ({ name, id, m, ch, local, dec, owner: "Localization Ops", dest: "AEM Assets", thumb: THUMBS[(i * 3 + 5) % THUMBS.length] }));
  const DEC = { pending: ["Decision needed", "awaiting"], kept: ["Kept local", "changes"], applied: ["Global applied", "approved"] };

  const INIT_DONE = REVIEWS.filter((r) => r.st === "approved").length;
  const BASE = { fr: 62, de: 71, uk: 86, jp: 80, us: 92, au: 89 };
  const claim = { cur: "“Save $100”", new: sessionStorage.getItem("nova.claim") || "“Save 25%”" };
  const state = { tab: "reviews", market: "all", dest: "all", status: "all", q: "", view: "list", page: 1, sel: "EXP-001", draft: false };
  const PER = { list: 6, grid: 8 };

  const byId = (id) => REVIEWS.find((r) => r.id === id);
  const label = (r) => `${MK[r.m]} · ${r.ch}`;
  const pending = (r) => ["required", "notstarted", "awaiting", "changes"].includes(r.st);
  const pill = (st, txt) => `<span class="rh-pill ${st}"><i></i>${txt || STATUS[st]}</span>`;

  function matches(r) {
    if (state.market !== "all" && r.m !== state.market) return false;
    if (state.dest !== "all" && r.dest !== state.dest) return false;
    if (state.status !== "all" && r.st !== state.status) return false;
    const q = state.q.toLowerCase();
    if (q && !`${r.name} ${r.id} ${MK[r.m]} ${r.ch} ${r.owner} ${r.type} ${r.dest}`.toLowerCase().includes(q)) return false;
    return true;
  }

  /* ---------------- Metric cards ---------------- */
  function renderMetrics() {
    const done = REVIEWS.filter((r) => r.st === "approved").length;
    const decisions = OVERRIDES.filter((o) => o.dec === "pending").length;
    const all = done === REVIEWS.length;
    const markets = new Set(REVIEWS.map((r) => r.m)).size;
    $("#rh-metrics").innerHTML = `
      <button class="rh-m${state.tab === "reviews" && state.status === "all" ? "" : ""}" data-m="reviews"><span class="ic">${mask("doc")}</span><div><b>${REVIEWS.length}</b><span class="l">Reviews required</span><small>${done > INIT_DONE ? `${done} approved · across ${markets} markets` : `Across ${markets} markets`}</small></div></button>
      <button class="rh-m" data-m="overrides"><span class="ic">${mask("globe")}</span><div><b>${OVERRIDES.length}</b><span class="l">Local overrides</span><small>${decisions ? "Require market-specific copy" : "All decisions made"}</small></div></button>
      <button class="rh-m" data-m="dest"><span class="ic"><i class="dia"></i></span><div><b>${Object.keys(DEST).length}</b><span class="l">Destinations</span><small>Adobe Review, Workfront, AEM</small></div></button>
      <button class="rh-m" data-m="ready"><span class="ic"><i class="dot${all ? " green" : ""}"></i></span><div><b class="t">${all ? "Ready to recheck" : "Awaiting review"}</b><small style="margin-top:3px">Readiness will recalculate</small><small>${all ? "all reviews approved" : "after required reviews"}</small></div></button>`;
  }
  $("#rh-metrics").addEventListener("click", (e) => {
    const k = e.target.closest("[data-m]")?.dataset.m;
    if (k === "reviews") setTab("reviews");
    if (k === "overrides") setTab("overrides");
    if (k === "ready") setTab("readiness");
    if (k === "dest") destinations();
  });

  /* ---------------- Tabs ---------------- */
  function renderTabs() {
    const tabs = [["reviews", `Review requirements (${REVIEWS.length})`], ["overrides", `Local overrides (${OVERRIDES.length})`], ["workfront", "Workfront handoff"], ["readiness", "Readiness update"]];
    $("#rh-tabs").innerHTML = tabs.map(([k, l]) => `<button data-tab="${k}" class="${state.tab === k ? "is-active" : ""}">${l}</button>`).join("");
    $("#rh-bar").style.visibility = state.tab === "reviews" || state.tab === "overrides" ? "" : "hidden";
  }
  function setTab(k) { state.tab = k; state.page = 1; renderTabs(); renderBody(); }
  $("#rh-tabs").addEventListener("click", (e) => { const k = e.target.closest("[data-tab]")?.dataset.tab; if (k) setTab(k); });

  /* ---------------- Body ---------------- */
  function renderBody() {
    if (state.tab === "workfront") return renderWorkfront();
    if (state.tab === "readiness") return renderReadiness();
    if (state.tab === "overrides") return renderOverrides();
    const l = REVIEWS.filter(matches);
    const per = PER[state.view];
    const pages = Math.max(1, Math.ceil(l.length / per));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * per;
    const rows = l.slice(start, start + per);
    const body = $("#rh-body");
    if (!rows.length) body.innerHTML = `<div class="ci-empty">No review requirements match these filters.</div>`;
    else if (state.view === "grid") {
      body.innerHTML = `<div class="ci-grid" style="grid-auto-rows:146px">${rows.map((r) => `<div class="ci-gc${r.id === state.sel ? " is-on" : ""}" data-id="${r.id}" style="${r.id === state.sel ? "border-color:#121419" : ""}">${thumb(r.thumb, 100, 58)}<b>${r.name}</b>
        <div class="row"><span style="display:flex;align-items:center;gap:6px">${flag(r.m)}${label(r)}</span></div>
        <div class="row">${pill(r.st)}<span>${r.dest}</span></div></div>`).join("")}</div>`;
    } else {
      body.innerHTML = `<table class="ci-table rh-table">
        <colgroup><col style="width:26px"><col><col style="width:80px"><col style="width:86px"><col style="width:80px"><col style="width:92px"><col style="width:84px"><col style="width:90px"><col style="width:112px"><col style="width:80px"><col style="width:92px"><col style="width:26px"></colgroup>
        <thead><tr><th><input type="checkbox" class="ci-cb" disabled aria-label="Select all"></th><th>Experience</th><th>Market</th><th>Channel</th><th>Change</th><th>Review required</th><th>Why</th><th>Owner</th><th>Status</th><th>Destination</th><th>Action</th><th></th></tr></thead>
        <tbody>${rows.map((r) => `<tr data-id="${r.id}" class="${r.id === state.sel ? "is-sel" : ""} ${r.st}">
          <td><input type="checkbox" class="ci-cb" data-ck="${r.id}" ${r.id === state.sel ? "checked" : ""} aria-label="Select ${r.name}"></td>
          <td><div class="ci-exp">${thumb(r.thumb, 24, 26)}<p><b>${r.name}</b><small>${r.id}</small></p></div></td>
          <td><div class="ci-mk">${flag(r.m)}${MK[r.m]}</div></td>
          <td><div class="ci-ch"><span class="ico">${channelIcon(r.ch)}</span>${r.ch}</div></td>
          <td><div class="rh-chg">${claim.cur} →<br>${claim.new}</div></td>
          <td>${r.type}</td>
          <td><div class="rh-why">${r.why}</div></td>
          <td><div class="rh-own">${mask("person")}<span>${r.owner}</span></div></td>
          <td>${pill(r.st)}</td>
          <td><span class="rh-dest">${r.dest}</span></td>
          <td><button class="rh-act${r.id === state.sel && pending(r) ? " dark" : ""}" data-act="${r.id}">${ACTION[r.st]}</button></td>
          <td><button class="ci-dots" data-dots="${r.id}" aria-label="More actions">···</button></td></tr>`).join("")}</tbody></table>`;
    }
    foot(l.length, start, rows.length, pages, "experiences");
  }

  function foot(total, start, n, pages, noun) {
    $("#rh-count").textContent = total ? `Showing ${start + 1}–${start + n} of ${total} ${noun}` : `Showing 0 ${noun}`;
    const p = state.page;
    $("#rh-pager").innerHTML = pages <= 1 ? "" : `<button class="pg-nav pg-prev" data-pg="${p - 1}" ${p <= 1 ? "disabled" : ""}>‹<span>Previous</span></button>
      ${Array.from({ length: pages }, (_, i) => `<button data-pg="${i + 1}" class="${i + 1 === p ? "is-on" : ""}">${i + 1}</button>`).join("")}
      <button class="pg-nav pg-next" data-pg="${p + 1}" ${p >= pages ? "disabled" : ""}><span>Next</span>›</button>`;
  }

  function renderOverrides() {
    const l = OVERRIDES.filter((o) => (state.market === "all" || o.m === state.market) && (!state.q || `${o.name} ${o.id} ${MK[o.m]} ${o.ch} ${o.local}`.toLowerCase().includes(state.q.toLowerCase())));
    $("#rh-body").innerHTML = l.length ? `<table class="ci-table rh-table">
      <colgroup><col><col style="width:88px"><col style="width:92px"><col style="width:180px"><col style="width:96px"><col style="width:120px"><col style="width:120px"><col style="width:112px"></colgroup>
      <thead><tr><th>Experience</th><th>Market</th><th>Channel</th><th>Local copy</th><th>Global claim</th><th>Owner</th><th>Decision</th><th>Action</th></tr></thead>
      <tbody>${l.map((o) => `<tr data-ov="${o.id}">
        <td><div class="ci-exp">${thumb(o.thumb, 24, 26)}<p><b>${o.name}</b><small>${o.id}</small></p></div></td>
        <td><div class="ci-mk">${flag(o.m)}${MK[o.m]}</div></td>
        <td><div class="ci-ch"><span class="ico">${channelIcon(o.ch)}</span>${o.ch}</div></td>
        <td><div class="rh-why" style="color:#10131b">“${o.local}”</div></td>
        <td><span class="rh-chg">${claim.new}</span></td>
        <td><div class="rh-own">${mask("person")}<span>${o.owner}</span></div></td>
        <td>${pill(DEC[o.dec][1], DEC[o.dec][0])}</td>
        <td><button class="rh-act${o.dec === "pending" ? " dark" : ""}" data-ovact="${o.id}">${o.dec === "pending" ? "Decide" : "View"}</button></td></tr>`).join("")}</tbody></table>` : `<div class="ci-empty">No local overrides match these filters.</div>`;
    foot(l.length, 0, l.length, 1, "local overrides");
  }

  function wfTasks() {
    const groups = {};
    REVIEWS.forEach((r) => ((groups[r.owner] = groups[r.owner] || []).push(r)));
    return Object.entries(groups).map(([owner, items], i) => {
      const sent = items.filter((r) => !pending(r)).length;
      const done = items.filter((r) => r.st === "approved").length;
      return { id: `WF-${2041 + i}`, owner, items, sent, done, st: done === items.length ? "approved" : sent === items.length ? "inreview" : sent ? "awaiting" : "notstarted" };
    });
  }
  function renderWorkfront() {
    const tasks = wfTasks();
    $("#rh-body").innerHTML = `<table class="rh-sub">
      <colgroup><col style="width:250px"><col style="width:160px"><col style="width:120px"><col><col style="width:140px"><col style="width:130px"></colgroup>
      <thead><tr><th>Workfront task</th><th>Assigned team</th><th>Experiences</th><th>Progress</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>${tasks.map((t) => `<tr>
        <td><div class="wf"><img src="${DEST.Workfront}" alt=""><span>Review claim change · ${t.owner}<small>${t.id} · Project Nova</small></span></div></td>
        <td><div class="rh-own">${mask("person")}<span>${t.owner}</span></div></td>
        <td>${t.items.length} item${t.items.length === 1 ? "" : "s"}<small>${t.items.reduce((n, r) => n + r.dep, 0)} dependent</small></td>
        <td><div class="rh-pct"><b>${Math.round((t.done / t.items.length) * 100)}%</b><div class="rh-bar2"><i style="width:${(t.sent / t.items.length) * 100}%;opacity:.35;background:#0a64ff"></i><i style="width:${(t.done / t.items.length) * 100}%;background:var(--green-ok)"></i></div></div></td>
        <td>${pill(t.st, { approved: "Complete", inreview: "In review", awaiting: "Partially sent", notstarted: "Not sent" }[t.st])}</td>
        <td><button class="rh-act${t.st === "notstarted" || t.st === "awaiting" ? " dark" : ""}" data-wf="${t.owner}" style="width:104px">${t.st === "notstarted" || t.st === "awaiting" ? "Send task" : "Open task"}</button></td></tr>`).join("")}</tbody></table>`;
    foot(tasks.length, 0, tasks.length, 1, "Workfront tasks");
  }

  function renderReadiness() {
    const rows = Object.keys(MK).map((m) => {
      const items = REVIEWS.filter((r) => r.m === m);
      const done = items.filter((r) => r.st === "approved").length;
      const now = Math.min(100, BASE[m] + done * 3);
      const after = Math.min(100, BASE[m] + items.length * 3);
      const blocked = items.some((r) => r.st === "required" && r.type === "Regional legal");
      const before = blocked ? ["blocked", "Blocked"] : now >= 90 ? ["ready", "Ready"] : ["awaiting", "At risk"];
      const next = done === items.length ? ["ready", "Ready"] : items.some((r) => pending(r)) ? ["awaiting", "Awaiting review"] : ["inreview", "In review"];
      return { m, items, done, now, after, before, next };
    });
    $("#rh-body").innerHTML = `<table class="rh-sub">
      <colgroup><col style="width:160px"><col style="width:120px"><col><col style="width:250px"><col style="width:120px"></colgroup>
      <thead><tr><th>Market</th><th>Reviews</th><th>Readiness now → after reviews</th><th>Status change</th><th>Action</th></tr></thead>
      <tbody>${rows.map((x) => `<tr>
        <td><div class="ci-mk">${flag(x.m)}${MK[x.m]}</div></td>
        <td>${x.done} of ${x.items.length} approved<small>${x.items.length - x.done} open</small></td>
        <td><div class="rh-pct"><b>${x.now}%</b><div class="rh-bar2"><i class="after" style="width:${x.after}%"></i><i style="width:${x.now}%;background:${x.now >= 90 ? "var(--green-ok)" : "#ffb400"}"></i></div><b style="width:auto;color:#00996b">${x.after}%</b></div></td>
        <td><div class="rh-ru" style="padding:0"><span class="p ${x.before[0]}"><i></i>${x.before[1]}</span><span class="arr">→</span><span class="p ${x.next[0]}"><i></i>${x.next[1]}</span></div></td>
        <td><button class="rh-act" data-rm="${x.m}" style="width:96px">View items</button></td></tr>`).join("")}</tbody></table>`;
    foot(rows.length, 0, rows.length, 1, "markets");
  }

  $("#rh-body").addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]");
    if (act) { e.stopPropagation(); select(act.dataset.act); return runAction(byId(act.dataset.act)); }
    const dots = e.target.closest("[data-dots]");
    if (dots) { e.stopPropagation(); return rowMenu(byId(dots.dataset.dots), dots); }
    const ov = e.target.closest("[data-ovact]");
    if (ov) return overrideDecision(OVERRIDES.find((o) => o.id === ov.dataset.ovact));
    const wf = e.target.closest("[data-wf]");
    if (wf) return wfAction(wf.dataset.wf);
    const rm = e.target.closest("[data-rm]");
    if (rm) { Object.assign(state, { tab: "reviews", market: rm.dataset.rm, dest: "all", status: "all", page: 1 }); syncControls(); renderTabs(); return renderBody(); }
    const ovr = e.target.closest("tr[data-ov]");
    if (ovr) return overrideDecision(OVERRIDES.find((o) => o.id === ovr.dataset.ov));
    const row = e.target.closest("[data-id]");
    if (row) select(row.dataset.id);
  });
  $(".rh-foot").addEventListener("click", (e) => {
    const pg = e.target.closest("[data-pg]");
    if (pg && !pg.disabled) { state.page = +pg.dataset.pg; renderBody(); }
  });

  /* ---------------- Filters ---------------- */
  const OPTIONS = {
    market: [["all", "All markets"], ...Object.entries(MK)],
    dest: [["all", "All destinations"], ...Object.keys(DEST).map((d) => [d, d])],
    status: [["all", "All review statuses"], ...Object.entries(STATUS)],
  };
  function syncControls() {
    Object.keys(OPTIONS).forEach((k) => {
      const b = $(`[data-sel="${k}"]`);
      b.querySelector("[data-label]").textContent = OPTIONS[k].find((o) => o[0] === state[k])[1];
      b.classList.toggle("is-set", state[k] !== "all");
    });
    $("#rh-q").value = state.q;
    $$("[data-view]").forEach((b) => b.classList.toggle("is-on", b.dataset.view === state.view));
  }
  function setFilter(k, v) { state[k] = v; state.page = 1; if (state.tab !== "reviews" && state.tab !== "overrides") state.tab = "reviews"; syncControls(); renderTabs(); renderBody(); }
  $$("[data-sel]").forEach((b) => b.addEventListener("click", (e) => {
    e.stopPropagation();
    const k = b.dataset.sel;
    openMenu(b, OPTIONS[k].map(([v, l]) => ({ label: l, selected: state[k] === v, onClick: () => setFilter(k, v) })));
  }));
  $("#rh-q").addEventListener("input", (e) => { state.q = e.target.value.trim(); state.page = 1; renderBody(); });
  $$("[data-view]").forEach((b) => b.addEventListener("click", () => { state.view = b.dataset.view; state.page = 1; if (state.tab !== "reviews") state.tab = "reviews"; syncControls(); renderTabs(); renderBody(); }));

  $("#rh-dl").addEventListener("click", () => {
    const ov = state.tab === "overrides";
    const head = ov ? ["Experience", "ID", "Market", "Channel", "Local copy", "Global claim", "Decision"] : ["Experience", "ID", "Market", "Channel", "Current claim", "New claim", "Review required", "Why", "Owner", "Status", "Destination"];
    const rows = ov ? OVERRIDES.map((o) => [o.name, o.id, MK[o.m], o.ch, o.local, claim.new, DEC[o.dec][0]]) : REVIEWS.filter(matches).map((r) => [r.name, r.id, MK[r.m], r.ch, claim.cur, claim.new, r.type, r.why, r.owner, STATUS[r.st], r.dest]);
    const csv = [head, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = ov ? "project-nova-local-overrides.csv" : "project-nova-review-requirements.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(`${ov ? "Local overrides" : "Review requirements"} downloaded · ${rows.length} rows`);
  });

  /* ---------------- Review handoff panel ---------------- */
  function renderPanel() {
    const r = byId(state.sel);
    const legal = r.type === "Regional legal" || r.type === "Policy check";
    const before = r.st === "required" && r.type === "Regional legal" ? ["blocked", "Blocked"] : r.st === "approved" ? ["ready", "Ready"] : ["awaiting", "At risk"];
    const after = r.st === "approved" ? ["ready", "Ready to publish"] : r.st === "inreview" ? ["inreview", "In review"] : ["awaiting", "Awaiting review"];
    const policy = r.m === "fr" || r.m === "de" ? `${MK[r.m]} has market-specific policy` : r.type === "Local override" ? `${MK[r.m]} uses localized copy` : "Global claim policy applies";
    $("#rh-detail").innerHTML = `<div class="rh-dt">
      <h4>Context preserved</h4>
      <div class="rh-ctx">
        <span class="ic">${mask("rocket")}</span><span class="k">Campaign</span><span class="v">Project Nova</span>
        <span class="ic">${mask("globe")}</span><span class="k">Market</span><span class="v">${MK[r.m]}</span>
        <span class="ic">${channelIcon(r.ch)}</span><span class="k">Channel</span><span class="v">${r.ch}</span>
        <span class="ic">${mask("person")}</span><span class="k">Owner</span><span class="v">${r.owner}</span>
        <span class="ic">${mask("cal")}</span><span class="k">Due</span><span class="v ${r.due.startsWith("Today") && r.st !== "approved" ? "red" : ""}">${r.st === "approved" ? "Approved" : r.due}</span>
      </div>
      <h4>Destination</h4>
      <div class="rh-dests">${Object.entries(DEST).map(([d, src]) => `<button class="rh-dst${d === r.dest ? " is-target" : ""}" data-dst="${d}"><span class="lg"><img src="${src}" alt=""></span>${d}<em>${d === r.dest ? "Routing here" : "Connected"}</em></button>`).join("")}</div>
      <h4>Why this is routed</h4>
      <div class="rh-why2">
        <div>${mask("doc")}${legal ? "Promotional claim changed" : r.why}</div>
        <div>${mask("cube")}${r.dep} dependent experience${r.dep === 1 ? "" : "s"}</div>
        <div>${mask("globe")}${policy}</div>
      </div>
      <h4>Readiness update</h4>
      <div class="rh-ru"><span class="p ${before[0]}"><i></i>${before[1]}</span><span class="arr">→</span><span class="p ${after[0]}"><i></i>${after[1]}</span></div>
    </div>`;
    const send = $("#rh-send");
    send.classList.toggle("is-done", !pending(r));
    send.innerHTML = pending(r) ? `Send for review<span class="arr">→</span>` : r.st === "approved" ? "Approved ✓" : `Sent to ${r.dest === "Adobe Review" ? "Review" : r.dest === "AEM Assets" ? "AEM" : r.dest} ✓`;
    $("#rh-draft").textContent = state.draft ? "Draft saved" : "Save as draft";
  }
  $("#rh-detail").addEventListener("click", (e) => {
    const d = e.target.closest("[data-dst]")?.dataset.dst;
    if (d) setFilter("dest", state.dest === d ? "all" : d);
  });

  function select(id) {
    state.sel = id;
    $$("#rh-body tr[data-id]").forEach((tr) => {
      const r = byId(tr.dataset.id);
      const on = tr.dataset.id === id;
      tr.classList.toggle("is-sel", on);
      tr.querySelector("[data-ck]").checked = on;
      tr.querySelector("[data-act]").classList.toggle("dark", on && pending(r));
    });
    $$("#rh-body .ci-gc").forEach((c) => (c.style.borderColor = c.dataset.id === id ? "#121419" : ""));
    renderPanel();
    history.replaceState(null, "", `#${id}`);
  }

  function renderAll() {
    $$('[data-claim="cur"]').forEach((n) => (n.textContent = claim.cur));
    $$('[data-claim="new"]').forEach((n) => (n.textContent = claim.new));
    renderMetrics(); renderTabs(); renderBody(); renderPanel(); syncControls();
  }

  /* ---------------- Actions ---------------- */
  function send(list, quiet) {
    list.forEach((r) => (r.st = "inreview"));
    renderAll();
    if (quiet) return;
    const r = list[0];
    toast(list.length === 1 ? `${r.name} sent to ${r.dest} · ${r.owner} notified` : `${list.length} experiences sent for review`);
  }
  function runAction(r) {
    if (r.st === "awaiting") return send([r]);
    if (r.st === "inreview" || r.st === "approved") return view(r);
    return openReview(r);
  }
  function previewHtml(r) {
    return `<div class="ci-preview">${thumb(r.thumb, 64, 64)}<p><b>${r.name}</b><small>${r.id} · ${label(r)}</small><small>${r.type} · ${r.owner}</small></p></div>`;
  }
  function openReview(r) {
    openModal({
      title: `Open review · ${r.name}`,
      body: `<div class="ci-diff"><div>Current claim<b>${claim.cur}</b></div><span>→</span><div class="new">Proposed claim<b>${claim.new}</b></div></div>${previewHtml(r)}
        ${r.st === "required" && r.type === "Regional legal" ? `<div class="alert" style="height:auto;margin-top:14px"><span class="bang">!</span><span><strong>${r.why}</strong><small style="font-size:11px">${label(r)} stays blocked until ${r.owner} approves · ${r.dep} dependent experiences.</small></span></div>` : ""}
        <div class="field" style="margin-top:14px"><label>Note for ${r.owner}</label><textarea class="input" rows="2" style="height:auto;padding:10px;resize:none" data-note>Please review the new claim ${claim.new} for ${label(r)}.</textarea></div>`,
      foot: `<button class="btn" data-close>Cancel</button><button class="btn btn-dark" data-ok>Send to ${r.dest}</button>`,
      onMount(d) {
        d.querySelector("[data-ok]").addEventListener("click", () => { closeModal(); send([r]); });
      },
    });
  }
  function view(r) {
    const approved = r.st === "approved";
    openDrawer({
      title: r.name,
      body: `<div class="cell-sum">${thumb(r.thumb, 54, 54)}<div style="flex:1"><h4>${r.name}</h4><div class="sub" style="margin-top:4px">${r.id} · ${label(r)}</div></div>${pill(r.st)}</div>
        <div class="ci-diff" style="margin-top:16px"><div>Current claim<b>${claim.cur}</b></div><span>→</span><div class="new">New claim<b>${claim.new}</b></div></div>
        <div class="section-title" style="margin-bottom:2px">Review timeline · ${r.dest}</div>
        <ul class="inv-steps">
          <li class="done"><span>✓</span><p>Routed from Change Impact<small>${r.type} · ${r.why}</small></p></li>
          <li class="done"><span>✓</span><p>Sent to ${r.owner}<small>${r.dest} · context preserved</small></p></li>
          <li class="${approved ? "done" : ""}"><span>${approved ? "✓" : "3"}</span><p>${approved ? `Approved by ${r.owner}` : `${r.owner} is reviewing`}<small>${approved ? "Claim cleared for publishing" : `Due ${r.due}`}</small></p></li>
          <li class="${approved ? "done" : ""}"><span>${approved ? "✓" : "4"}</span><p>Readiness recalculates<small>${r.dep} dependent experience${r.dep === 1 ? "" : "s"} update</small></p></li>
        </ul>`,
      foot: approved ? `<button class="btn btn-dark" data-close-d>Done</button>` : `<button class="btn" data-nudge>Nudge ${r.owner}</button><button class="btn btn-dark" data-approve>Mark approved</button>`,
      onMount(d) {
        d.querySelector("[data-close-d]")?.addEventListener("click", closeDrawer);
        d.querySelector("[data-nudge]")?.addEventListener("click", () => { closeDrawer(); toast(`${r.owner} nudged in ${r.dest}`); });
        d.querySelector("[data-approve]")?.addEventListener("click", () => { closeDrawer(); r.st = "approved"; renderAll(); toast(`${r.name} approved by ${r.owner}`); });
      },
    });
  }
  function rowMenu(r, anchor) {
    openMenu(anchor, [
      { label: `Open in ${r.dest}`, onClick: () => toast(`Opening ${r.id} in ${r.dest}`) },
      { label: "Change reviewer", onClick: () => reassign(r, anchor) },
      { label: `Copy ID (${r.id})`, onClick: () => { navigator.clipboard?.writeText(r.id).catch(() => {}); toast(`${r.id} copied`); } },
      "hr",
      { label: "Back to Change Impact", onClick: () => (location.href = `impact.html#${r.m}:${r.ch}`) },
    ], { align: "right" });
  }
  function reassign(r, anchor) {
    const owners = [...new Set(Object.values(TYPE).map((t) => t[0]))];
    openMenu(anchor, owners.map((o) => ({ label: o, selected: r.owner === o, onClick: () => { r.owner = o; renderAll(); toast(`${r.name} reassigned to ${o}`); } })), { align: "right" });
  }
  function overrideDecision(o) {
    openModal({
      title: `Local override · ${MK[o.m]} · ${o.ch}`,
      body: `<div class="ci-diff"><div>Local copy<b style="font-size:14px">“${o.local}”</b></div><span>vs</span><div class="new">Global claim<b>${claim.new}</b></div></div>
        <div class="ci-preview">${thumb(o.thumb, 64, 64)}<p><b>${o.name}</b><small>${o.id} · ${MK[o.m]} · ${o.ch}</small><small>Decision · ${DEC[o.dec][0]}</small></p></div>`,
      foot: `<button class="btn" data-keep>Keep local copy</button><button class="btn btn-dark" data-apply>Apply global claim</button>`,
      onMount(d) {
        d.querySelector("[data-keep]").addEventListener("click", () => { o.dec = "kept"; closeModal(); renderAll(); toast(`${MK[o.m]} keeps “${o.local}” · sent to Localization Ops`); });
        d.querySelector("[data-apply]").addEventListener("click", () => { o.dec = "applied"; closeModal(); renderAll(); toast(`${o.name} now uses ${claim.new}`); });
      },
    });
  }
  function wfAction(owner) {
    const items = REVIEWS.filter((r) => r.owner === owner);
    const open = items.filter(pending);
    if (open.length) { send(open, true); return toast(`Workfront task sent to ${owner} · ${open.length} experience${open.length === 1 ? "" : "s"}`); }
    toast(`Opening ${owner} task in Workfront`);
  }
  function destinations() {
    openModal({
      title: "Review destinations",
      body: Object.entries(DEST).map(([d, src]) => {
        const items = REVIEWS.filter((r) => r.dest === d);
        return `<button class="q-row" data-d="${d}"><span style="width:28px;display:grid;place-items:center"><img src="${src}" alt="" style="max-width:22px;max-height:20px"></span><p><b>${d}</b><span>${items.length} review${items.length === 1 ? "" : "s"} · ${items.filter((r) => !pending(r)).length} sent</span></p><span class="rh-pill approved"><i></i>Connected</span></button>`;
      }).join(""),
      foot: `<button class="btn btn-dark" data-close>Done</button>`,
      onMount(d) { $$("[data-d]", d).forEach((b) => b.addEventListener("click", () => { closeModal(); setFilter("dest", b.dataset.d); })); },
    });
  }
  function sendAll() {
    const open = REVIEWS.filter(pending);
    if (!open.length) return toast("Every review has already been sent");
    const groups = Object.entries(open.reduce((m, r) => ((m[r.dest] = (m[r.dest] || 0) + 1), m), {}));
    openModal({
      title: `Send ${open.length} reviews`,
      body: `<p class="sub" style="margin-bottom:6px">Context, claim change and dependent experiences travel with every request.</p>
        <ul class="inv-steps ci-route">${groups.map(([d, n]) => `<li><span class="n">${n}</span><p>${d}<small>${[...new Set(open.filter((r) => r.dest === d).map((r) => r.owner))].join(", ")}</small></p></li>`).join("")}</ul>`,
      foot: `<button class="btn" data-close>Cancel</button><button class="btn btn-dark" data-ok>Send all</button>`,
      onMount(d) {
        d.querySelector("[data-ok]").addEventListener("click", () => {
          closeModal();
          send(open, true);
          $('.rh-steps [data-step="1"]').classList.add("done");
          $('.rh-steps [data-step="2"]').classList.add("done");
          toast(`${open.length} reviews sent to ${groups.length} destinations`);
        });
      },
    });
  }

  $("#rh-send").addEventListener("click", () => {
    const r = byId(state.sel);
    if (pending(r)) return r.st === "awaiting" ? send([r]) : openReview(r);
    view(r);
  });
  $("#rh-draft").addEventListener("click", () => {
    state.draft = true;
    renderPanel();
    toast(`Handoff draft saved · ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);
  });
  $("#rh-more").addEventListener("click", (e) => {
    e.stopPropagation();
    const r = byId(state.sel);
    openMenu(e.currentTarget, [
      { label: "Send all pending reviews", onClick: sendAll },
      { label: "Change reviewer", onClick: () => reassign(r, $("#rh-more")) },
      { label: "Copy handoff link", onClick: () => { navigator.clipboard?.writeText(location.href).catch(() => {}); toast("Handoff link copied"); } },
      "hr",
      { label: "Back to Change Impact", onClick: () => (location.href = "impact.html") },
    ], { align: "right" });
  });
  $("#rh-policy").addEventListener("click", () => {
    openModal({
      title: "Promotional claim policy",
      body: `<div class="ci-policy"><ul>
        <li><span class="ci-gl sm safe">✓</span><p><b>Copy-only changes</b><span class="t">Images, layout and CTA stay unchanged, so only copy reviewers are involved.</span></p></li>
        <li><span class="ci-gl sm review">!</span><p><b>France and Germany</b><span class="t">Percentage claims require Regional Legal approval in Adobe Review.</span></p></li>
        <li><span class="ci-gl sm review">!</span><p><b>Translated copy</b><span class="t">Localization Ops reviews market copy through Workfront.</span></p></li>
        <li><span class="ci-gl sm override">${mask("globe")}</span><p><b>Local overrides</b><span class="t">Market-specific copy is kept in AEM Assets unless the global claim is applied.</span></p></li>
      </ul></div>`,
      foot: `<button class="btn btn-dark" data-close>Got it</button>`,
    });
  });

  /* ---------------- Next steps ---------------- */
  $$(".rh-steps .q3-step").forEach((b) => b.addEventListener("click", () => {
    const s = b.dataset.step;
    if (s === "1") { Object.assign(state, { tab: "reviews", status: "required", page: 1 }); syncControls(); renderTabs(); renderBody(); b.classList.add("done"); }
    if (s === "2") sendAll();
    if (s === "3") {
      Object.assign(state, { tab: "reviews", status: "inreview", page: 1 }); syncControls(); renderTabs(); renderBody();
      const live = REVIEWS.filter((r) => r.st === "inreview").slice(0, 2);
      if (!live.length) return toast("No reviews in progress right now");
      setTimeout(() => { live.forEach((r) => (r.st = "approved")); renderAll(); b.classList.add("done"); toast(`${live.map((r) => r.owner).join(" and ")} approved ${live.length} review${live.length === 1 ? "" : "s"}`); }, 1100);
    }
    if (s === "4") {
      setTab("readiness");
      const t = b.querySelector("small");
      t.textContent = "Recalculating readiness…";
      setTimeout(() => { t.textContent = "Checked just now"; b.classList.add("done"); toast(`Readiness rechecked · ${REVIEWS.filter((r) => r.st === "approved").length} of ${REVIEWS.length} reviews approved`); }, 900);
    }
  }));

  /* ---------------- Init ---------------- */
  const h = decodeURIComponent(location.hash.slice(1));
  const fromHash = byId(h) || REVIEWS.find((r) => `${r.m}:${r.ch}` === h);
  if (fromHash) state.sel = fromHash.id;
  renderAll();
})();
