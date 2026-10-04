(function () {
  const { flag, mask, thumb, channelIcon, openMenu, openModal, closeModal, openDrawer, closeDrawer, toast } = Nova;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const MK = { fr: "France", de: "Germany", uk: "UK", jp: "Japan", us: "US", au: "Australia" };
  const CHANNELS = ["TikTok", "Instagram", "Email", "YouTube", "Web"];
  const STATUS = {
    blocked: ["Blocked", "Needs review"], review: ["Needs review", "Needs review"], safe: ["Safe to update", "Safe to update"],
    override: ["Local override", "Local override"], unknown: ["Unknown", "Unknown"], updated: ["Updated", "Updated"], approval: ["In approval", "In approval"],
  };
  const IMPACT = { high: "High", medium: "Medium", low: "Low", unknown: "Unknown" };

  /* Figma screen 05 rows first, then the rest of the 48 affected experiences */
  const FIGMA = [
    ["Summer Sale - Hero Banner", "EXP-001", "fr", "TikTok", "high", "blocked", "Regional Legal", "Review"],
    ["Product Page - Headline", "EXP-014", "de", "Instagram", "medium", "review", "Creative Ops", "Open"],
    ["Email - Launch", "EXP-028", "uk", "Email", "low", "safe", "Auto", "Update"],
    ["YouTube Pre-roll", "EXP-045", "fr", "YouTube", "medium", "review", "Marketing", "Review"],
    ["Instagram Story", "EXP-052", "jp", "Instagram", "low", "safe", "Auto", "Update"],
    ["Localized Landing Page", "EXP-061", "de", "Web", "high", "override", "Localization", "View details"],
  ];
  const BASES = [
    ["Spark Ad - 9:16", "TikTok"], ["Feed Post - Carousel", "Instagram"], ["Newsletter - Hero", "Email"], ["Bumper Ad 6s", "YouTube"],
    ["Homepage Takeover", "Web"], ["Creator Collab Reel", "TikTok"], ["Story - Countdown", "Instagram"], ["Pre-order Email", "Email"],
    ["Shorts - Unboxing", "YouTube"], ["Product Detail - Specs", "Web"], ["Launch Teaser", "TikTok"], ["Reel - Sound Test", "Instagram"],
    ["Cart Reminder Email", "Email"], ["Display - Retargeting", "Web"],
  ];
  const ORDER = ["us", "fr", "de", "uk", "jp", "au"];
  const REST = [].concat(Array(16).fill("safe"), Array(17).fill("review"), Array(5).fill("override"), Array(4).fill("unknown"))
    .map((s, i) => [s, (i * 29 + 7) % 42]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
  const OVR = ["fr", "jp", "de", "fr", "jp"];
  let ovr = 0;
  const reviewer = (m, ch) => (m === "fr" || m === "de" ? (ch === "Email" ? "Legal Review" : "Regional Legal") : ch === "Web" ? "Creative Ops" : ch === "Email" ? "Legal Review" : "Marketing");

  const EXPS = FIGMA.map(([name, id, m, ch, imp, st, appr, act]) => ({ name, id, m, ch, imp, st, appr, act }));
  REST.forEach((st, i) => {
    const [base, ch] = BASES[i % BASES.length];
    const m = st === "override" ? OVR[ovr++] : ORDER[(i + Math.floor(i / BASES.length)) % ORDER.length];
    const imp = st === "safe" ? "low" : st === "override" ? "high" : st === "unknown" ? "unknown" : i % 3 === 0 ? "high" : "medium";
    const appr = st === "safe" ? "Auto" : st === "override" ? "Localization" : st === "unknown" ? "Manual check" : reviewer(m, ch);
    const act = { safe: "Update", review: i % 4 === 1 ? "Open" : "Review", override: "View details", unknown: "Inspect" }[st];
    EXPS.push({ name: base, id: `EXP-${String(62 + i * 3).padStart(3, "0")}`, m, ch, imp, st, appr, act });
  });
  EXPS.forEach((e, i) => {
    e.cat = e.st === "blocked" ? "review" : e.st;
    e.i = i;
    const mix = Nova.THUMB_MIX.filter((k) => k !== "youtube");
    e.thumb = e.ch === "YouTube" && i % 2 ? "youtube" : mix[(i * 7 + 3) % mix.length];
  });

  const claim = { cur: "“Save $100”", new: "“Save 25%”" };
  const state = { tab: "all", market: "all", channel: "all", status: "all", q: "", view: "list", page: 1, checked: new Set(), submitted: false, draft: false };
  const PER = { list: 6, grid: 8 };

  const byId = (id) => EXPS.find((e) => e.id === id);
  const label = (e) => `${MK[e.m]} · ${e.ch}`;
  const count = (fn) => EXPS.filter(fn).length;
  const openOf = (cat) => count((e) => e.cat === cat && e.st !== "updated");

  function matches(e) {
    if (state.tab === "approval" && !(e.cat === "review" || e.cat === "override")) return false;
    if (state.tab === "override" && e.cat !== "override") return false;
    if (state.tab === "unknown" && e.cat !== "unknown") return false;
    if (state.market !== "all" && e.m !== state.market) return false;
    if (state.channel !== "all" && e.ch !== state.channel) return false;
    if (state.status !== "all" && !(state.status === e.cat || state.status === e.st)) return false;
    const q = state.q.toLowerCase();
    if (q && !`${e.name} ${e.id} ${MK[e.m]} ${e.ch} ${e.appr}`.toLowerCase().includes(q)) return false;
    return true;
  }
  const list = () => EXPS.filter(matches);

  /* ---------------- Claims + metric cards ---------------- */
  function renderClaims() {
    $$('[data-claim="cur"]').forEach((n) => (n.textContent = claim.cur));
    $$('[data-claim="new"]').forEach((n) => (n.textContent = claim.new));
    $$("[data-used]").forEach((n) => (n.textContent = `Used in ${EXPS.length} experiences`));
    $$("[data-exp]").forEach((n) => (n.textContent = `${EXPS.length} experiences`));
  }
  const GL = (cat, sm) => `<span class="ci-gl ${cat}${sm ? " sm" : ""}">${cat === "safe" ? "✓" : cat === "review" ? "!" : cat === "override" ? mask("globe") : ""}</span>`;
  function renderMetrics() {
    const done = count((e) => e.st === "updated");
    const appr = count((e) => e.st === "approval");
    const cards = [
      ["safe", openOf("safe"), "Safe to update", done ? `${done} updated · ${openOf("safe")} left` : "Update automatically"],
      ["review", openOf("review"), "Needs review", appr ? `${appr} in approval` : "Requires review"],
      ["override", openOf("override"), "Local override", "Market-specific handling"],
      ["unknown", openOf("unknown"), "Unknown", "Needs manual check"],
    ];
    $("#ci-metrics").innerHTML = cards.map(([k, n, l, s]) =>
      `<button class="ci-m${state.status === k ? " is-on" : ""}" data-m="${k}">${GL(k)}<div><b>${n}</b><span class="l">${l}</span><small>${s}</small></div></button>`).join("");
  }
  $("#ci-metrics").addEventListener("click", (e) => {
    const k = e.target.closest("[data-m]")?.dataset.m;
    if (k) setFilter("status", state.status === k ? "all" : k, true);
  });

  /* ---------------- Tabs ---------------- */
  function renderTabs() {
    const tabs = [
      ["all", `Affected experiences (${EXPS.length})`], ["mx", "Markets × Channels"],
      ["approval", `Approval required (${count((e) => e.cat === "review" || e.cat === "override")})`],
      ["override", `Local overrides (${count((e) => e.cat === "override")})`], ["unknown", `Unknown (${count((e) => e.cat === "unknown")})`],
    ];
    $("#ci-tabs").innerHTML = tabs.map(([k, l]) => `<button data-tab="${k}" class="${state.tab === k ? "is-active" : ""}">${l}</button>`).join("");
  }
  $("#ci-tabs").addEventListener("click", (e) => {
    const k = e.target.closest("[data-tab]")?.dataset.tab;
    if (!k) return;
    state.tab = k; state.page = 1;
    renderTabs(); renderBody();
  });

  /* ---------------- Table / grid / matrix ---------------- */
  function pill(e) {
    if (e.st === "approval") return `<span class="ci-pill approval"><i></i>${e.cat === "override" ? "Local review" : e.appr === "Regional Legal" ? "In legal review" : "In approval"}</span>`;
    return `<span class="ci-pill ${e.st}"><i></i>${STATUS[e.st][0]}</span>`;
  }
  function actionBtn(e) {
    if (e.st === "updated") return `<button class="ci-act" data-act="${e.id}" disabled>Updated ✓</button>`;
    if (e.st === "approval") return `<button class="ci-act" data-act="${e.id}">Track</button>`;
    return `<button class="ci-act" data-act="${e.id}">${e.act}</button>`;
  }
  function rowHtml(e) {
    const ck = state.checked.has(e.id);
    return `<tr data-id="${e.id}" class="${ck ? "is-checked" : ""}${e.st === "blocked" ? " is-blocked" : ""}">
      <td><input type="checkbox" class="ci-cb" data-ck="${e.id}" ${ck ? "checked" : ""} aria-label="Select ${e.name}"></td>
      <td><div class="ci-exp">${thumb(e.thumb, 29, 30)}<p><b>${e.name}</b><small>${e.id}</small></p></div></td>
      <td><div class="ci-mk">${flag(e.m)}${MK[e.m]}</div></td>
      <td><div class="ci-ch"><span class="ico">${channelIcon(e.ch)}</span>${e.ch}</div></td>
      <td><div class="ci-claimtx">${e.st === "updated" ? claim.new : claim.cur}</div></td>
      <td><div class="ci-claimtx new">${claim.new}</div></td>
      <td><div class="ci-imp ${e.imp}">${mask("bars")}${IMPACT[e.imp]}</div></td>
      <td>${pill(e)}</td>
      <td>${e.appr}</td>
      <td>${actionBtn(e)}</td>
      <td><button class="ci-dots" data-dots="${e.id}" aria-label="More actions">···</button></td>
    </tr>`;
  }
  function renderBody() {
    const body = $("#ci-body");
    $("#ci-bar").style.visibility = state.tab === "mx" ? "hidden" : "";
    if (state.tab === "mx") return renderMatrix();
    const l = list();
    const per = PER[state.view];
    const pages = Math.max(1, Math.ceil(l.length / per));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * per;
    const rows = l.slice(start, start + per);
    if (!rows.length) {
      body.innerHTML = `<div class="ci-empty">No experiences match these filters.</div>`;
    } else if (state.view === "grid") {
      body.innerHTML = `<div class="ci-grid">${rows.map((e) => `<div class="ci-gc" data-id="${e.id}">${thumb(e.thumb, 100, 64)}<b>${e.name}</b>
        <div class="row"><span style="display:flex;align-items:center;gap:6px">${flag(e.m)}${MK[e.m]} · ${e.ch}</span><span>${e.id}</span></div>
        <div class="row">${pill(e)}<span class="ci-imp ${e.imp}">${IMPACT[e.imp]}</span></div></div>`).join("")}</div>`;
    } else {
      const pageIds = rows.map((r) => r.id);
      const nCk = pageIds.filter((id) => state.checked.has(id)).length;
      body.innerHTML = `<table class="ci-table">
        <colgroup><col style="width:32px"><col><col style="width:88px"><col style="width:96px"><col style="width:86px"><col style="width:78px"><col style="width:80px"><col style="width:112px"><col style="width:94px"><col style="width:106px"><col style="width:30px"></colgroup>
        <thead><tr><th><input type="checkbox" class="ci-cb" id="ci-all" aria-label="Select page" ${nCk === pageIds.length ? "checked" : ""}></th><th>Experience</th><th>Market</th><th>Channel</th><th>Current claim</th><th>New claim</th><th>Impact</th><th>Status</th><th>Approval</th><th>Action</th><th></th></tr></thead>
        <tbody>${rows.map(rowHtml).join("")}</tbody></table>`;
      const all = $("#ci-all");
      all.indeterminate = nCk > 0 && nCk < pageIds.length;
    }
    renderFoot(l.length, start, rows.length, pages);
  }

  function renderFoot(total, start, n, pages) {
    const sel = state.checked.size;
    $("#ci-count").innerHTML = sel
      ? `<span class="ci-bulk">${sel} selected<button class="dark" data-bulk="update">Update selected</button><button data-bulk="clear">Clear</button></span>`
      : total ? `Showing ${start + 1}–${start + n} of ${total} experiences` : "Showing 0 experiences";
    const p = state.page;
    const nums = pages <= 6 ? Array.from({ length: pages }, (_, i) => i + 1)
      : p <= 3 ? [1, 2, 3, "…", pages] : p >= pages - 2 ? [1, "…", pages - 2, pages - 1, pages] : [1, "…", p, "…", pages];
    $("#ci-pager").innerHTML = `<button class="pg-nav pg-prev" data-pg="${p - 1}" ${p <= 1 ? "disabled" : ""}>‹<span>Previous</span></button>
      ${nums.map((x) => (x === "…" ? `<span class="gap">...</span>` : `<button data-pg="${x}" class="${x === p ? "is-on" : ""}">${x}</button>`)).join("")}
      <button class="pg-nav pg-next" data-pg="${p + 1}" ${p >= pages ? "disabled" : ""}><span>Next</span>›</button>`;
  }

  function renderMatrix() {
    const mkts = ["fr", "de", "uk", "jp", "us", "au"];
    const RANK = ["blocked", "override", "review", "unknown", "approval", "safe", "updated"];
    const cell = (m, ch) => {
      const es = EXPS.filter((e) => e.m === m && e.ch === ch);
      if (!es.length) return `<span class="ci-mxc none"><b>—</b><span>Not affected</span></span>`;
      const worst = RANK.find((r) => es.some((e) => e.st === r));
      const cls = worst === "approval" ? "review" : worst;
      const sub = worst === "blocked" ? "Blocked" : worst === "override" ? "Local override" : worst === "review" ? `${es.filter((e) => e.st === "review").length} need review` : worst === "unknown" ? "Unknown impact" : worst === "approval" ? "In approval" : worst === "updated" ? "Updated" : "Safe";
      return `<button class="ci-mxc ${cls}" data-mx="${m}|${ch}"><b>${es.length}</b><span>${sub}</span></button>`;
    };
    $("#ci-body").innerHTML = `<table class="ci-mx"><colgroup><col style="width:150px"></colgroup>
      <thead><tr><th>Market</th>${CHANNELS.map((c) => `<th><div class="ci-ch"><span class="ico">${channelIcon(c)}</span>${c}</div></th>`).join("")}</tr></thead>
      <tbody>${mkts.map((m) => `<tr><td class="mk"><div>${flag(m)}${MK[m]}</div></td>${CHANNELS.map((c) => `<td>${cell(m, c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    $("#ci-count").textContent = `${EXPS.length} experiences across ${mkts.length} markets and ${CHANNELS.length} channels`;
    $("#ci-pager").innerHTML = "";
  }

  $("#ci-body").addEventListener("click", (ev) => {
    const mx = ev.target.closest("[data-mx]");
    if (mx) {
      const [m, ch] = mx.dataset.mx.split("|");
      Object.assign(state, { tab: "all", market: m, channel: ch, status: "all", page: 1 });
      syncControls(); renderTabs(); renderMetrics(); renderBody();
      return;
    }
    const ck = ev.target.closest("[data-ck]");
    if (ck) { ck.checked ? state.checked.add(ck.dataset.ck) : state.checked.delete(ck.dataset.ck); return renderBody(); }
    if (ev.target.id === "ci-all") {
      const ids = $$("[data-ck]").map((c) => c.dataset.ck);
      ids.forEach((id) => (ev.target.checked ? state.checked.add(id) : state.checked.delete(id)));
      return renderBody();
    }
    const act = ev.target.closest("[data-act]");
    if (act) { ev.stopPropagation(); return runAction(byId(act.dataset.act), act); }
    const dots = ev.target.closest("[data-dots]");
    if (dots) { ev.stopPropagation(); return rowMenu(byId(dots.dataset.dots), dots); }
    const row = ev.target.closest("[data-id]");
    if (row) details(byId(row.dataset.id));
  });

  $(".ci-foot").addEventListener("click", (ev) => {
    const pg = ev.target.closest("[data-pg]");
    if (pg && !pg.disabled) { state.page = +pg.dataset.pg; return renderBody(); }
    const b = ev.target.closest("[data-bulk]")?.dataset.bulk;
    if (b === "clear") { state.checked.clear(); renderBody(); }
    if (b === "update") bulkUpdate();
  });

  /* ---------------- Filters ---------------- */
  const OPTIONS = {
    market: [["all", "All markets"], ...Object.entries(MK)],
    channel: [["all", "All channels"], ...CHANNELS.map((c) => [c, c])],
    status: [["all", "All statuses"], ["blocked", "Blocked"], ["review", "Needs review"], ["safe", "Safe to update"], ["override", "Local override"], ["unknown", "Unknown"], ["updated", "Updated"], ["approval", "In approval"]],
  };
  function syncControls() {
    Object.keys(OPTIONS).forEach((k) => {
      const b = $(`[data-sel="${k}"]`);
      b.querySelector("[data-label]").textContent = OPTIONS[k].find((o) => o[0] === state[k])[1];
      b.classList.toggle("is-set", state[k] !== "all");
    });
    $("#ci-q").value = state.q;
    $$("[data-view]").forEach((b) => b.classList.toggle("is-on", b.dataset.view === state.view));
    $$(".ci-chg").forEach((b) => b.classList.toggle("is-on", b.dataset.chg === state.status));
  }
  function setFilter(k, v, toAll) {
    state[k] = v;
    state.page = 1;
    if (toAll && state.tab !== "all") state.tab = "all";
    syncControls(); renderTabs(); renderMetrics(); renderBody();
  }
  $$("[data-sel]").forEach((b) => b.addEventListener("click", (e) => {
    e.stopPropagation();
    const k = b.dataset.sel;
    openMenu(b, OPTIONS[k].map(([v, l]) => ({ label: l, selected: state[k] === v, onClick: () => setFilter(k, v) })));
  }));
  $("#ci-q").addEventListener("input", (e) => { state.q = e.target.value.trim(); state.page = 1; renderBody(); });
  $$("[data-view]").forEach((b) => b.addEventListener("click", () => { state.view = b.dataset.view; state.page = 1; syncControls(); renderBody(); }));

  $("#ci-dl").addEventListener("click", () => {
    const l = state.tab === "mx" ? EXPS : list();
    const csv = [["Experience", "ID", "Market", "Channel", "Current claim", "New claim", "Impact", "Status", "Approval"].join(",")]
      .concat(l.map((e) => [e.name, e.id, MK[e.m], e.ch, e.st === "updated" ? claim.new : claim.cur, claim.new, IMPACT[e.imp], STATUS[e.st][0], e.appr].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "project-nova-change-impact.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(`Impact report downloaded · ${l.length} experiences`);
  });

  /* ---------------- Row actions ---------------- */
  function runAction(e, anchor) {
    if (e.st === "updated") return;
    if (e.st === "approval") return track(e);
    if (e.act === "Update") return update([e]);
    if (e.act === "Review" || e.act === "Open") return review(e);
    if (e.act === "View details") return details(e);
    if (e.act === "Inspect") return inspect(e, anchor);
  }

  function update(es) {
    es.forEach((e) => { e.st = "updated"; state.checked.delete(e.id); });
    renderAll();
    toast(es.length === 1 ? `${es[0].name} · ${label(es[0])} updated to ${claim.new}` : `${es.length} experiences updated to ${claim.new}`);
  }
  function bulkUpdate() {
    const sel = [...state.checked].map(byId);
    const safe = sel.filter((e) => e.st === "safe");
    const rest = sel.length - safe.length;
    if (!safe.length) { toast("Only safe-to-update experiences can be updated in bulk"); return; }
    update(safe);
    if (rest) setTimeout(() => toast(`${rest} selected experience${rest === 1 ? " needs" : "s need"} review before updating`), 1200);
  }

  function previewHtml(e) {
    return `<div class="ci-preview">${thumb(e.thumb, 64, 64)}<p><b>${e.name}</b><small>${e.id} · ${label(e)}</small><small>Approver · ${e.appr}</small></p></div>`;
  }
  function review(e) {
    const legal = e.appr === "Regional Legal" || e.appr === "Legal Review";
    openModal({
      title: `${e.act === "Open" ? "Open" : "Review"} · ${e.name}`,
      body: `<div class="ci-diff"><div>Current claim<b>${claim.cur}</b></div><span>→</span><div class="new">Proposed claim<b>${claim.new}</b></div></div>${previewHtml(e)}
        ${e.st === "blocked" ? `<div class="alert" style="height:auto;margin-top:14px"><span class="bang">!</span><span><strong>Promotional claim requires regional legal review</strong><small style="font-size:11px">${label(e)} stays paused until ${e.appr} approves the new claim · 8 dependent experiences.</small></span></div>` : ""}`,
      foot: `<button class="btn" data-close>Cancel</button><button class="btn btn-dark" data-ok>${legal ? `Send to ${e.appr}` : "Approve change"}</button>`,
      onMount(d) {
        d.querySelector("[data-ok]").addEventListener("click", () => {
          closeModal();
          if (legal) { e.st = "approval"; renderAll(); toast(`${e.name} sent to ${e.appr} for approval`); }
          else update([e]);
        });
      },
    });
  }
  function track(e) {
    openModal({
      title: `Approval · ${e.name}`,
      body: `${previewHtml(e)}<ul class="inv-steps" style="margin-top:10px">
        <li class="done"><span>✓</span><p>Change submitted<small>${claim.cur} → ${claim.new}</small></p></li>
        <li><span>2</span><p>${e.appr} reviews the new claim<small>Usually within 4 hours</small></p></li>
        <li><span>3</span><p>Experience updates automatically<small>${label(e)}</small></p></li></ul>`,
      foot: `<button class="btn" data-ping>Nudge ${e.appr}</button><button class="btn btn-dark" data-ok>Mark approved</button>`,
      onMount(d) {
        d.querySelector("[data-ping]").addEventListener("click", () => { closeModal(); toast(`${e.appr} nudged`); });
        d.querySelector("[data-ok]").addEventListener("click", () => { closeModal(); update([e]); });
      },
    });
  }
  function details(e) {
    const ovr = e.cat === "override";
    openDrawer({
      title: e.name,
      body: `<div class="cell-sum">${thumb(e.thumb, 54, 54)}<div style="flex:1"><h4>${e.name}</h4><div class="sub" style="margin-top:4px">${e.id} · ${label(e)}</div></div>${pill(e)}</div>
        <div class="ci-diff" style="margin-top:16px"><div>Current claim<b>${e.st === "updated" ? claim.new : claim.cur}</b></div><span>→</span><div class="new">New claim<b>${claim.new}</b></div></div>
        ${ovr ? `<div class="alert" style="height:auto;margin-bottom:14px;background:#f6edff;border-color:#e3c8ff"><span class="bang" style="background:#9800ff">!</span><span><strong>${MK[e.m]} uses a local override</strong><small style="font-size:11px">Market copy reads “${e.m === "jp" ? "25%オフ" : e.m === "de" ? "25 % sparen" : "Économisez 25 %"}” — keep it or apply the global claim.</small></span></div>` : ""}
        <div class="section-title" style="margin-bottom:2px">Change details</div>
        <ul class="inv-steps">
          <li><span><i class="mask m-bars" style="width:12px;height:12px"></i></span><p>Impact · ${IMPACT[e.imp]}<small>${e.imp === "high" ? "Claim appears in headline and CTA" : e.imp === "medium" ? "Claim appears in body copy" : e.imp === "low" ? "Claim appears in legal footer only" : "Claim usage could not be detected"}</small></p></li>
          <li><span><i class="mask m-person" style="width:11px;height:12px"></i></span><p>Approval · ${e.appr}<small>${e.appr === "Auto" ? "No approval needed" : "Required before publishing"}</small></p></li>
          <li><span><i class="mask m-cube" style="width:12px;height:12px"></i></span><p>Variants · ${2 + (e.i % 4)}<small>Updated together with this experience</small></p></li>
        </ul>`,
      foot: ovr && e.st === "override"
        ? `<button class="btn" data-keep>Keep local override</button><button class="btn btn-dark" data-apply>Apply global claim</button>`
        : `<button class="btn" data-close-d>Close</button>${e.st === "updated" ? "" : `<button class="btn btn-dark" data-go>${e.st === "approval" ? "Track approval" : e.act === "Inspect" ? "Run claim check" : e.act === "Update" ? "Update now" : "Review change"}</button>`}`,
      onMount(d) {
        d.querySelector("[data-close-d]")?.addEventListener("click", closeDrawer);
        d.querySelector("[data-go]")?.addEventListener("click", () => { closeDrawer(); e.act === "Inspect" ? inspect(e) : runAction(e); });
        d.querySelector("[data-keep]")?.addEventListener("click", () => { closeDrawer(); e.st = "approval"; renderAll(); toast(`${MK[e.m]} override kept · sent to Localization`); });
        d.querySelector("[data-apply]")?.addEventListener("click", () => { closeDrawer(); update([e]); });
      },
    });
  }
  function inspect(e) {
    toast(`Checking ${e.name} for claim usage…`);
    setTimeout(() => {
      e.cat = e.i % 2 ? "safe" : "review";
      e.st = e.cat;
      e.imp = e.cat === "safe" ? "low" : "medium";
      e.appr = e.cat === "safe" ? "Auto" : reviewer(e.m, e.ch);
      e.act = e.cat === "safe" ? "Update" : "Review";
      renderAll();
      toast(`${e.name} · ${e.cat === "safe" ? "safe to update" : "needs review by " + e.appr}`);
    }, 900);
  }
  function rowMenu(e, anchor) {
    openMenu(anchor, [
      { label: "Open details", onClick: () => details(e) },
      { label: "Preview in channel", onClick: () => toast(`Opening ${e.ch} preview for ${e.name}`) },
      { label: `Copy ID (${e.id})`, onClick: () => { navigator.clipboard?.writeText(e.id).catch(() => {}); toast(`${e.id} copied`); } },
      "hr",
      { label: "Exclude from this change", onClick: () => { EXPS.splice(EXPS.indexOf(e), 1); state.checked.delete(e.id); renderAll(); toast(`${e.name} excluded · keeps ${claim.cur}`); } },
    ], { align: "right" });
  }

  /* ---------------- Change summary panel ---------------- */
  function renderPanel() {
    const s = openOf("safe"), r = openOf("review"), o = openOf("override"), u = openOf("unknown");
    $("#ci-changes").innerHTML = [
      ["safe", `${s} experience${s === 1 ? "" : "s"} can be updated automatically.`],
      ["review", `${r} experience${r === 1 ? "" : "s"} require${r === 1 ? "s" : ""} review.`],
      ["override", `${o} experience${o === 1 ? " has a local override" : "s have local overrides"}.`],
      ["unknown", `${u} experience${u === 1 ? " has" : "s have"} unknown impact.`],
    ].map(([k, t]) => `<button class="ci-chg${state.status === k ? " is-on" : ""}" data-chg="${k}">${GL(k, true)}${t}</button>`).join("");
    const fr = byId("EXP-001");
    const frTxt = !fr ? "Excluded from this change" : fr.st === "updated" ? "Approved · claim updated" : fr.st === "approval" ? "Sent to Regional Legal" : "Blocked until legal review";
    const ovMk = Object.keys(MK).filter((m) => EXPS.some((e) => e.cat === "override" && e.m === m)).map((m) => MK[m]);
    $("#ci-impacts").innerHTML = `
      <button class="ci-ki" data-ki="fr"><span class="ic">${flag("fr")}</span><p>France · TikTok<span>${frTxt}</span></p></button>
      <button class="ci-ki" data-ki="dep"><span class="ic">${mask("cube")}</span><p>8 dependent experiences<span>Will be updated after approval</span></p></button>
      <button class="ci-ki" data-ki="ovr"><span class="ic"><span class="mask m-globe purple"></span></span><p>${ovMk.length} market${ovMk.length === 1 ? " has" : "s have"} local overrides<span>${ovMk.join(", ") || "None"}</span></p></button>`;
    const sub = $("#ci-submit");
    sub.classList.toggle("is-done", state.submitted);
    sub.innerHTML = state.submitted ? "Submitted ✓" : `Submit for review<span class="arr">→</span>`;
    $("#ci-draft").textContent = state.draft ? "Draft saved" : "Save as draft";
  }
  $("#ci-changes").addEventListener("click", (e) => {
    const k = e.target.closest("[data-chg]")?.dataset.chg;
    if (k) setFilter("status", state.status === k ? "all" : k, true);
  });
  $("#ci-impacts").addEventListener("click", (e) => {
    const k = e.target.closest("[data-ki]")?.dataset.ki;
    if (k === "fr") { const fr = byId("EXP-001"); fr ? focusRow(fr) : toast("France · TikTok was excluded from this change"); }
    if (k === "dep") {
      openModal({
        title: "8 dependent experiences",
        body: `<p class="sub" style="margin-bottom:8px">These France · TikTok variants inherit the claim from Summer Sale - Hero Banner and update after Regional Legal approves.</p>` +
          ["Hero 9:16", "Spark ad", "Story 9:16", "Feed 1:1", "Creator cut", "Countdown", "Retarget 6s", "Pinned post"].map((n, i) =>
            `<div class="q-row">${thumb(Nova.THUMB_MIX.filter((k) => k !== "youtube")[i % 10], 40, 40)}<p><b>${n}</b><span>France · TikTok · EXP-001.${i + 1}</span></p><span class="ci-pill ${state.submitted ? "approval" : "blocked"}"><i></i>${state.submitted ? "In legal review" : "Waiting"}</span></div>`).join(""),
        foot: `<button class="btn btn-dark" data-close>Done</button>`,
      });
    }
    if (k === "ovr") setFilter("status", "override", true);
  });

  function focusRow(e) {
    Object.assign(state, { tab: "all", market: "all", channel: "all", status: "all", q: "", view: "list" });
    const idx = list().indexOf(e);
    state.page = Math.floor(idx / PER.list) + 1;
    syncControls(); renderTabs(); renderMetrics(); renderBody();
    const tr = $(`tr[data-id="${e.id}"]`);
    if (tr) { tr.classList.remove("is-flash"); void tr.offsetWidth; tr.classList.add("is-flash"); }
  }

  $("#ci-more").addEventListener("click", (e) => {
    e.stopPropagation();
    openMenu(e.currentTarget, [
      { label: "Copy change summary", onClick: () => { navigator.clipboard?.writeText(`${claim.cur} → ${claim.new}: ${openOf("safe")} safe, ${openOf("review")} review, ${openOf("override")} overrides, ${openOf("unknown")} unknown`).catch(() => {}); toast("Change summary copied"); } },
      { label: "Edit proposed claim", onClick: editClaim },
      { label: "Back to blocker queue", onClick: () => (location.href = "queue.html#fr:TikTok") },
      "hr",
      { label: "Discard this change", onClick: () => { claim.new = claim.cur; renderAll(); toast("Change discarded · claim stays " + claim.cur); } },
    ], { align: "right" });
  });

  $("#ci-draft").addEventListener("click", () => {
    state.draft = true;
    renderPanel();
    const t = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    toast(`Draft saved · ${t}`);
  });
  $("#ci-submit").addEventListener("click", submit);

  function submit() {
    sessionStorage.setItem("nova.claim", claim.new);
    location.href = "handoff.html#fr:TikTok";
  }

  /* ---------------- Claim editing + policy ---------------- */
  function editClaim() {
    const presets = ["“Save 25%”", "“25% off launch price”", "“Save up to 25%”", "“Now 25% off”"];
    openModal({
      title: "Edit proposed claim",
      body: `<div class="field"><label>Proposed claim</label><input class="input" data-inp value="${claim.new.replace(/[“”]/g, "")}" maxlength="40"></div>
        <div class="ci-presets">${presets.map((p) => `<button data-pre="${p}" class="${p === claim.new ? "is-on" : ""}">${p}</button>`).join("")}</div>
        <p class="sub" style="margin-top:12px;font-size:12px">Changing the claim re-runs impact analysis across ${EXPS.length} experiences.</p>`,
      foot: `<button class="btn" data-close>Cancel</button><button class="btn btn-dark" data-ok>Recalculate impact</button>`,
      onMount(d) {
        const inp = d.querySelector("[data-inp]");
        inp.focus(); inp.select();
        $$("[data-pre]", d).forEach((b) => b.addEventListener("click", () => { inp.value = b.dataset.pre.replace(/[“”]/g, ""); $$("[data-pre]", d).forEach((x) => x.classList.toggle("is-on", x === b)); }));
        d.querySelector("[data-ok]").addEventListener("click", () => {
          const v = inp.value.trim();
          if (!v) return;
          claim.new = `“${v}”`;
          closeModal();
          renderAll();
          toast(`Impact recalculated for ${claim.new}`);
        });
      },
    });
  }
  $("#ci-new").addEventListener("click", editClaim);
  $("#ci-cur").addEventListener("click", () => toast(`${claim.cur} is live in ${EXPS.length} experiences`));
  $("#ci-policy").addEventListener("click", () => {
    openModal({
      title: "Promotional claim policy",
      body: `<div class="ci-policy"><ul>
        <li><span class="ci-gl sm safe">✓</span><p><b>Footer and legal-line claims</b><span class="t">Update automatically when the claim value changes.</span></p></li>
        <li><span class="ci-gl sm review">!</span><p><b>Headline, CTA or price claims</b><span class="t">Need channel owner review before publishing.</span></p></li>
        <li><span class="ci-gl sm review">!</span><p><b>France and Germany</b><span class="t">Percentage claims require Regional Legal approval.</span></p></li>
        <li><span class="ci-gl sm override">${mask("globe")}</span><p><b>Localized copy</b><span class="t">Local overrides are kept unless Localization applies the global claim.</span></p></li>
      </ul></div>`,
      foot: `<button class="btn btn-dark" data-close>Got it</button>`,
    });
  });

  /* ---------------- Next steps ---------------- */
  $$(".ci-steps .q3-step").forEach((b) => b.addEventListener("click", () => {
    const s = b.dataset.step;
    if (s === "1") { state.tab = "approval"; state.status = "all"; state.page = 1; syncControls(); renderTabs(); renderMetrics(); renderBody(); }
    if (s === "2") submit();
    if (s === "3") { state.tab = "override"; state.page = 1; syncControls(); renderTabs(); renderBody(); }
    if (s === "4") {
      const left = EXPS.filter((e) => e.st !== "updated" && e.st !== "safe").length;
      if (!state.submitted) return toast("Submit the change for review before publishing");
      toast(left ? `${left} experiences are still waiting on approval` : "All approvals complete · publishing");
    }
  }));

  function renderAll() { renderClaims(); renderMetrics(); renderTabs(); renderBody(); renderPanel(); syncControls(); }

  renderAll();
  const h = decodeURIComponent(location.hash.slice(1));
  if (h) {
    const [m, ch] = h.split(":");
    const target = EXPS.find((e) => e.m === m && e.ch === ch && e.cat === "review") || EXPS.find((e) => e.m === m && e.ch === ch);
    if (target) setTimeout(() => focusRow(target), 250);
  }
})();
