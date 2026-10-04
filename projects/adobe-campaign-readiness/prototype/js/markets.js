(function () {
  const { ICONS, flag, thumb, mask, openMenu, openModal, closeModal, openDrawer, closeDrawer, toast } = Nova;
  const CH = NovaData.channels;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Figma screen 02 values */
  const MARKETS = [
    { code: "us", name: "US", full: "United States", total: 288, cells: [[58, "ready"], [59, "ready"], [58, "ready"], [57, "ready"], [56, "ready"]] },
    { code: "uk", name: "UK", full: "United Kingdom", total: 262, cells: [[54, "ready"], [52, "risk"], [52, "ready"], [54, "ready"], [50, "ready"]] },
    { code: "fr", name: "France", full: "France", total: 216, cells: [[48, "risk"], [46, "risk"], [32, "blocked"], [44, "risk"], [44, "risk"]] },
    { code: "de", name: "Germany", full: "Germany", total: 230, cells: [[50, "ready"], [48, "ready"], [42, "risk"], [46, "risk"], [44, "risk"]] },
    { code: "jp", name: "Japan", full: "Japan", total: 248, cells: [[52, "ready"], [48, "ready"], [48, "ready"], [50, "ready"], [50, "ready"]] },
    { code: "au", name: "Australia", full: "Australia", total: 258, cells: [[52, "ready"], [50, "ready"], [52, "ready"], [52, "ready"], [52, "ready"]] },
  ];
  const ORDER = MARKETS.map((m) => m.code);
  const LABEL = { ready: "Ready", risk: "Needs review", blocked: "Blocked" };
  const OWNER = { us: "Maya Chen", uk: "Emma Walsh", fr: "Camille Dubois", de: "Jonas Müller", jp: "Sora Kimura", au: "Olivia Brooks" };

  const RISKS = {
    "fr:TikTok": { exp: 8, impact2: "TikTok activation is paused for France.", root: "Promotional claim requires review.", root2: "Proposed claim: “Save $100”.", owner: "Regional legal", due: "Today · 4:00 PM", urgent: true, why: "Launch-critical, 8 dependent<br>experiences, due today.", fix: 54, short: "Requires regional legal review." },
    "uk:Email": { exp: 2, impact2: "Approved variants can still send.", root: "Approval pending.", root2: "Legal review in progress.", owner: "Maya Chen · Legal", due: "Tomorrow · 12:00 PM", why: "Approval gate on 2 experiences,<br>due tomorrow.", fix: 58 },
    "fr:Web": { exp: 3, impact2: "Hero banners use a fallback image.", root: "Hero image resolution too low.", root2: "Needs 1920 px master from Firefly.", owner: "Creative · Luca Rossi", due: "Sep 30 · 5:00 PM", why: "Visible on the launch landing<br>page for France.", fix: 57 },
    "fr:Email": { exp: 7, impact2: "Send is held for French subscribers.", root: "Unsubscribe link not localized.", root2: "CNIL compliance requirement.", owner: "Regional legal", due: "Tomorrow · 10:00 AM", urgent: true, why: "Compliance risk on 7<br>experiences, due tomorrow.", fix: 58 },
    "fr:Instagram": { exp: 5, impact2: "Captions are truncated in feed.", root: "Caption over character limit.", root2: "French copy exceeds 2,200 characters.", owner: "Localization · Camille Dubois", due: "Oct 1 · 11:00 AM", why: "5 experiences, fix is a<br>copy edit.", fix: 56 },
    "fr:YouTube": { exp: 4, impact2: "Pre-roll runs with English audio.", root: "Voice-over not yet localized.", root2: "French VO due from agency.", owner: "Localization", due: "Oct 1 · 3:00 PM", why: "4 experiences waiting on<br>an external vendor.", fix: 56 },
    "de:TikTok": { exp: 6, impact2: "Spark ads can't be boosted yet.", root: "Music licence pending for DE.", root2: "Track cleared in 5 of 6 markets.", owner: "Brand partnerships", due: "Sep 30 · 2:00 PM", why: "6 experiences depend on<br>one licence approval.", fix: 56 },
    "de:Instagram": { exp: 4, impact2: "Stories fall back to English.", root: "Localized asset missing.", root2: "German copy not yet generated.", owner: "Localization · Jonas Müller", due: "Oct 1 · 9:00 AM", why: "Can be generated with<br>Firefly in minutes.", fix: 58 },
    "de:YouTube": { exp: 2, impact2: "Bumper slot is unaffected.", root: "Pre-roll exceeds 15s limit.", root2: "Current cut runs 17 seconds.", owner: "Creative", due: "Oct 1 · 5:00 PM", why: "2 experiences, needs a<br>shorter edit.", fix: 58 },
  };

  const state = { market: "all", channel: "all", status: "all", q: "", critical: false, sort: "default", sel: "fr:TikTok", updated: Date.now() - 4 * 60000 };

  const mOf = (code) => MARKETS.find((m) => m.code === code);
  const pct = (m) => Math.round((m.total / 300) * 100);
  const cellOf = (key) => { const [c, ch] = key.split(":"); return mOf(c).cells[CH.indexOf(ch)]; };
  const shortName = (m) => (m.code === "uk" || m.code === "us" ? m.name : m.full);
  const riskScore = (m) => m.cells.reduce((s, c) => s + (c[1] === "blocked" ? 100 : c[1] === "risk" ? 10 : 0), 0) + (100 - pct(m)) / 100;
  const allKeys = () => MARKETS.flatMap((m) => CH.map((ch) => `${m.code}:${ch}`));
  const keysWith = (st) => allKeys().filter((k) => cellOf(k)[1] === st);

  function fillBars(root) {
    requestAnimationFrame(() => requestAnimationFrame(() => $$(".rk-bar i[data-w]", root).forEach((i) => (i.style.width = i.dataset.w))));
  }

  /* ---------------- Summary cards ---------------- */
  function renderCards() {
    const withIssues = MARKETS.filter((m) => m.cells.some((c) => c[1] !== "ready"));
    const worst = withIssues.slice().sort((a, b) => a.total - b.total)[0];
    const blocked = keysWith("blocked");
    const risk = keysWith("risk");
    const byMarket = MARKETS.map((m) => [m, m.cells.filter((c) => c[1] === "risk").length]).filter(([, n]) => n);

    let html = "";
    if (worst) {
      const b = worst.cells.filter((c) => c[1] === "blocked").length;
      const r = worst.cells.filter((c) => c[1] === "risk").length;
      const fill = Math.max(4, Math.min(100, ((pct(worst) - 50) / 45) * 100));
      html += `<button class="rk rk-risk${state.market === worst.code ? " is-on" : ""}" data-rk="market" data-code="${worst.code}">
        <span class="rk-ic amber">!</span>${flag(worst.code)}
        <h4>Highest launch risk</h4>
        <div class="big">${shortName(worst)}</div>
        <div class="ln"><b>${pct(worst)}%</b> experience readiness</div>
        <div class="rk-bar"><i data-w="${fill.toFixed(0)}%"></i></div>
        <div class="warn">${[b && `${b} blocked`, r && `${r} at risk`].filter(Boolean).join(" · ")}</div>
      </button>`;
    } else {
      html += `<button class="rk" data-rk="none"><span class="rk-ic green">✓</span><h4>Highest launch risk</h4><div class="big">None</div><div class="ln">Every market is ready.</div></button>`;
    }

    if (blocked.length) {
      const k = blocked[0];
      const [code, ch] = k.split(":");
      html += `<button class="rk" data-rk="blocker" data-key="${k}"><span class="rk-ic red">!</span>
        <h4>Launch blocker</h4><div class="big">${mOf(code).full} · ${ch}</div>
        <div class="ln">${RISKS[k]?.exp ?? 60 - cellOf(k)[0]} experiences affected</div>
        <div class="ln">${RISKS[k]?.short || "Requires review before launch."}</div><span class="chev">›</span></button>`;
    } else {
      html += `<button class="rk" data-rk="none"><span class="rk-ic green">✓</span><h4>Launch blocker</h4><div class="big">No blockers</div><div class="ln">All launch-critical paths cleared.</div><div class="ln">Launch can proceed.</div></button>`;
    }

    html += `<button class="rk${state.status === "risk" ? " is-on" : ""}" data-rk="risk"><span class="rk-ic ${risk.length ? "amber" : "green"}">${risk.length ? "!" : "✓"}</span>
      <h4>At-risk paths</h4><div class="big">${risk.length} <span>market-channel combination${risk.length === 1 ? "" : "s"}</span></div>
      <div class="ln">${byMarket.length ? byMarket.map(([m, n]) => `${shortName(m)} ${n}`).join(" · ") : "Nothing needs review."}</div></button>`;

    const mins = Math.round((Date.now() - state.updated) / 60000);
    html += `<button class="rk" data-rk="refresh"><span class="rk-ic blue">i</span>
      <h4>Data confidence</h4><div class="big">Current</div>
      <div class="ln">Updated ${mins < 1 ? "just now" : `${mins} min ago`}</div>
      <div class="ln">No unknown market-channel states.</div></button>`;

    $("#rk-cards").innerHTML = html;
    fillBars($("#rk-cards"));
  }

  $("#rk-cards").addEventListener("click", (e) => {
    const b = e.target.closest("[data-rk]");
    if (!b) return;
    const k = b.dataset.rk;
    if (k === "market") setFilter("market", state.market === b.dataset.code ? "all" : b.dataset.code);
    if (k === "blocker") select(b.dataset.key, true);
    if (k === "risk") setFilter("status", state.status === "risk" ? "all" : "risk");
    if (k === "refresh") {
      b.querySelector(".ln").textContent = "Refreshing…";
      setTimeout(() => { state.updated = Date.now(); renderCards(); toast("Readiness data refreshed · 360 experiences checked"); }, 700);
    }
  });

  /* ---------------- Matrix ---------------- */
  const HEAD = {
    Web: ["12px", "2.5px", ICONS.web()],
    Email: ["10px", "5.5px", ICONS.email()],
    TikTok: ["13px", "1.5px", ICONS.tiktok()],
    Instagram: ["15px", "5.5px", ICONS.instagram()],
    YouTube: ["14px", "4.5px", ICONS.youtube()],
  };
  function renderHead() {
    const arrow = state.sort === "total-asc" ? "↑" : "↓";
    $("#mx2-head").innerHTML =
      `<th><div class="mx2-head sortable" data-h="market">Market (${MARKETS.length})<span class="cv"><img src="assets/icons/chevron-mx-market.svg" alt=""></span></div></th>` +
      CH.map((c) => `<th data-ch="${c}"><div class="mx2-head" style="padding-left:${HEAD[c][0]};gap:${HEAD[c][1]}">${HEAD[c][2]}<span>${c}</span></div></th>`).join("") +
      `<th><div class="mx2-head sortable" data-h="total">Total ${arrow}</div></th><th></th>`;
  }

  function cellMatches(m, ci) {
    const [, s] = m.cells[ci];
    const ch = CH[ci];
    const q = state.q.toLowerCase();
    if (state.channel !== "all" && state.channel !== ch) return false;
    if (state.status !== "all" && state.status !== s) return false;
    if (state.critical && s !== "blocked") return false;
    if (q && !(m.full.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || ch.toLowerCase().includes(q))) return false;
    return true;
  }

  function visible() {
    let list = MARKETS.slice();
    if (state.market !== "all") list = list.filter((m) => m.code === state.market);
    list = list.filter((m) => m.cells.some((_, i) => cellMatches(m, i)));
    if (state.sort === "risk") list.sort((a, b) => riskScore(b) - riskScore(a));
    if (state.sort === "total-asc") list.sort((a, b) => a.total - b.total);
    if (state.sort === "total-desc") list.sort((a, b) => b.total - a.total);
    if (state.sort === "az") list.sort((a, b) => a.full.localeCompare(b.full));
    if (state.sort === "default") list.sort((a, b) => ORDER.indexOf(a.code) - ORDER.indexOf(b.code));
    return list;
  }

  function renderBody() {
    const list = visible();
    $$("#mx2-head th[data-ch]").forEach((th) => (th.style.opacity = state.channel === "all" || state.channel === th.dataset.ch ? 1 : 0.35));
    $("#mx2-body").innerHTML = list.length
      ? list
          .map((m) => {
            const p = pct(m);
            return `<tr data-m="${m.code}">
              <td><div class="mk">${flag(m.code)}<div><b>${m.name}</b><small>${p}% ready</small></div></div></td>
              ${m.cells
                .map(([n, s], i) => {
                  const key = `${m.code}:${CH[i]}`;
                  const cls = ["c", s === "blocked" ? "blocked" : "", key === state.sel ? "is-sel" : "", cellMatches(m, i) ? "" : "is-dim"].filter(Boolean).join(" ");
                  return `<td class="${cls}" data-key="${key}" tabindex="-1"><div class="c-in"><div class="c-st"><i class="${s}"></i>${LABEL[s]}</div><div class="c-n">${n} / 60</div></div></td>`;
                })
                .join("")}
              <td class="tot"><b>${m.total}<span> / 300</span></b><div class="rk-bar"><i class="${p < 80 ? "" : "green"}" data-w="${((m.total / 300) * 100).toFixed(2)}%"></i></div></td>
              <td class="more"><button data-row="${m.code}" aria-label="Row actions">•••</button></td>
            </tr>`;
          })
          .join("") +
        (state.critical
          ? `<tr class="crit-note"><td colspan="8"><span class="dot red"></span>Showing ${keysWith("blocked").length} launch-critical path${keysWith("blocked").length === 1 ? "" : "s"} · other paths are faded<button data-crit-off>Show all paths</button></td></tr>`
          : "")
      : `<tr><td colspan="8" style="border-right:0"><div class="empty">${state.critical ? "No critical paths. Everything is clear for launch." : "No market-channel paths match these filters."}</div></td></tr>`;
    fillBars($(".mx2"));
  }

  /* ---------------- Selected risk ---------------- */
  function renderPanel() {
    const key = state.sel;
    const [code, ch] = key.split(":");
    const m = mOf(code);
    const [n, s] = cellOf(key);
    const r = RISKS[key];
    const open = s !== "ready" && r;
    const exp = open ? r.exp : 60 - n;
    const rows = open
      ? [
          ["h61", mask("cube"), "Impact", `${exp} experiences affected.`, r.impact2],
          ["h61", mask("doc"), "Root issue", r.root, r.root2],
          ["h43", mask("audience"), "Owner", r.owner],
          ["h43", `<img class="cal" src="assets/icons/calendar.png" alt="">`, "Due", `<span class="due${r.urgent ? "" : " ok"}">${r.due}</span>`],
          ["h61", `<img class="bars" src="assets/icons/bar-chart.png" alt="">`, "Why prioritized", r.why],
        ]
      : [
          ["h61", mask("cube"), "Impact", `${n} of 60 experiences ready.`, `${ch} activation scheduled for Oct 2.`],
          ["h61", mask("doc"), "Root issue", "No open issues.", r ? "Resolved and re-checked today." : "All checks passed."],
          ["h43", mask("audience"), "Owner", `${OWNER[code]} · ${m.full}`],
          ["h43", `<img class="cal" src="assets/icons/calendar.png" alt="">`, "Due", `<span class="due ok">Launch · Oct 2, 9:00 AM</span>`],
          ["h61", `<img class="bars" src="assets/icons/bar-chart.png" alt="">`, "Why prioritized", "Not prioritized. No blockers<br>or open reviews."],
        ];
    $("#sr-body").innerHTML = `<div class="sr-body">
      <div class="sr-top">${flag(code)}<h4>${m.full} · ${ch}</h4><span class="sr-badge ${s}">${LABEL[s]}</span>
        <p>${s === "blocked" ? "This path can prevent launch." : s === "risk" ? "This path needs review before launch." : "This path is ready for launch."}</p></div>
      <div class="sr-rows">${rows
        .map(([h, ic, t, l1, l2]) => `<div class="sr-row ${h}"><span class="sr-ic">${ic}</span><div><b>${t}</b><div class="l1">${l1}</div>${l2 ? `<div class="l2">${l2}</div>` : ""}</div></div>`)
        .join("")}</div></div>`;
    $("#sr-go").textContent = open ? "Investigate →" : "View details →";
  }

  function select(key, scroll) {
    state.sel = key;
    $$("#mx2-body td.c").forEach((td) => td.classList.toggle("is-sel", td.dataset.key === key));
    renderPanel();
    history.replaceState(null, "", `#${key}`);
    const td = $(`#mx2-body td[data-key="${key}"]`);
    if (td && scroll) td.scrollIntoView({ block: "nearest" });
  }

  function renderAll() {
    renderCards();
    renderBody();
    renderPanel();
  }

  /* ---------------- Filters ---------------- */
  const OPTIONS = {
    view: [["mc", "Market × Channel"], ["cm", "Channel × Market"], ["ma", "Market × Audience"]],
    market: [["all", "All markets"], ...MARKETS.map((m) => [m.code, m.full])],
    channel: [["all", "All channels"], ...CH.map((c) => [c, c])],
    status: [["all", "All statuses"], ["ready", "Ready"], ["risk", "Needs review"], ["blocked", "Blocked"]],
    sort: [["risk", "Risk"], ["total-asc", "Readiness (low → high)"], ["total-desc", "Readiness (high → low)"], ["az", "Market (A–Z)"]],
  };
  const SORT_LABEL = { default: "Risk", risk: "Risk", "total-asc": "Readiness ↑", "total-desc": "Readiness ↓", az: "A–Z" };
  function labelFor(key, val) {
    if (key === "sort") return `Sort: ${SORT_LABEL[val]}`;
    return OPTIONS[key].find((o) => o[0] === val)[1];
  }
  function setFilter(key, val) {
    state[key] = val;
    const btn = $(`[data-sel="${key}"]`);
    if (btn) {
      btn.querySelector("[data-label]").textContent = labelFor(key, val);
      btn.classList.toggle("is-set", key !== "sort" && val !== "all");
    }
    if (key === "sort") renderHead();
    renderCards();
    renderBody();
  }
  $$("[data-sel]").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const key = btn.dataset.sel;
      if (key === "view") {
        return openMenu(btn, OPTIONS.view.map(([v, l]) => ({ label: l, selected: v === "mc", onClick: () => v !== "mc" && toast(`${l} view is coming soon`) })));
      }
      openMenu(btn, OPTIONS[key].map(([v, l]) => ({ label: l, selected: state[key] === v || (key === "sort" && state.sort === "default" && v === "risk"), onClick: () => setFilter(key, v) })));
    })
  );
  $("#mx2-q").addEventListener("input", (e) => {
    state.q = e.target.value.trim();
    renderBody();
  });
  function setCritical(on) {
    state.critical = on;
    $("#mx2-crit").classList.toggle("is-on", on);
    $("#mx2-crit").setAttribute("aria-checked", on);
    renderBody();
    if (on && keysWith("blocked").length) select(keysWith("blocked")[0]);
  }
  $("#mx2-crit").addEventListener("click", () => setCritical(!state.critical));

  $("#mx2-head").addEventListener("click", (e) => {
    const h = e.target.closest("[data-h]");
    if (!h) return;
    e.stopPropagation();
    if (h.dataset.h === "total") setFilter("sort", state.sort === "total-asc" ? "total-desc" : "total-asc");
    else openMenu(h, OPTIONS.market.map(([v, l]) => ({ label: l, selected: state.market === v, onClick: () => setFilter("market", v) })));
  });

  /* ---------------- Table interactions ---------------- */
  $("#mx2-body").addEventListener("click", (e) => {
    if (e.target.closest("[data-crit-off]")) return setCritical(false);
    const row = e.target.closest("[data-row]");
    if (row) {
      e.stopPropagation();
      const m = mOf(row.dataset.row);
      return openMenu(row, [
        { label: `View ${m.full} breakdown`, onClick: () => openMarket(m) },
        { label: "Show only this market", onClick: () => setFilter("market", m.code) },
        { label: `Notify ${OWNER[m.code]}`, onClick: () => toast(`${OWNER[m.code]} notified about ${m.full}`) },
      ], { align: "right" });
    }
    const td = e.target.closest("td.c");
    if (td) select(td.dataset.key);
  });
  $("#mx2-body").addEventListener("dblclick", (e) => {
    const td = e.target.closest("td.c");
    if (td) investigate(td.dataset.key);
  });

  document.addEventListener("keydown", (e) => {
    if (e.target.closest?.("input, textarea, [contenteditable]") || document.querySelector(".overlay, .drawer")) return;
    const moves = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
    if (e.key === "Enter") return investigate(state.sel);
    if (!moves[e.key]) return;
    const rows = $$("#mx2-body tr[data-m]").map((tr) => tr.dataset.m);
    const [code, ch] = state.sel.split(":");
    let r = Math.max(0, rows.indexOf(code));
    let c = CH.indexOf(ch);
    r = Math.min(rows.length - 1, Math.max(0, r + moves[e.key][0]));
    c = Math.min(CH.length - 1, Math.max(0, c + moves[e.key][1]));
    if (!rows.length) return;
    e.preventDefault();
    select(`${rows[r]}:${CH[c]}`, true);
  });

  /* ---------------- Panel actions ---------------- */
  $("#sr-more").addEventListener("click", (e) => {
    e.stopPropagation();
    const [code, ch] = state.sel.split(":");
    openMenu(e.currentTarget, [
      { label: "Copy link to this risk", onClick: () => { navigator.clipboard?.writeText(location.href).catch(() => {}); toast("Link copied"); } },
      { label: "Notify owner", onClick: () => toast(`${RISKS[state.sel]?.owner || OWNER[code]} notified · ${mOf(code).full} · ${ch}`) },
      { label: "Snooze for 24 hours", onClick: () => toast("Risk snoozed until tomorrow") },
      "hr",
      { label: "Export risk report", onClick: () => toast("Risk report exported") },
    ], { align: "right" });
  });

  $("#sr-queue").addEventListener("click", () => (location.href = `queue.html#${state.sel}`));
  $("#sr-go").addEventListener("click", () => investigate(state.sel));

  function investigate(key) {
    const [code, ch] = key.split(":");
    const m = mOf(code);
    const [n, s] = cellOf(key);
    const r = RISKS[key];
    const open = s !== "ready" && r;
    const exps = Array.from({ length: open ? Math.min(r.exp, 4) : 3 }, (_, i) =>
      `<div class="exp-row">${thumb(i % 2 ? "mountain" : "headphones", 54, 42)}<p>${["Hero 16:9", "Story 9:16", "Feed 1:1", "Spark ad"][i]}<span>${m.name} · ${ch} · v${3 - (i % 3)}</span></p><span class="badge ${open ? s : "ready"}">${open ? LABEL[s] : "Ready"}</span></div>`
    ).join("");
    openDrawer({
      title: `${m.full} · ${ch}`,
      body: `
        <div class="cell-sum">${flag(code)}<div style="flex:1"><h4>${n} of 60 experiences ready</h4><div class="sub" style="margin-top:4px">${open ? `${r.exp} affected · owner ${r.owner}` : `Owner ${OWNER[code]}`}</div></div><span class="badge ${s}">${LABEL[s]}</span></div>
        ${open ? `<div class="alert" style="height:auto;margin:16px 0"><span class="bang">!</span><span><strong>${r.root}</strong><small style="font-size:11px">${r.root2}</small></span></div>
        <div class="section-title" style="margin-bottom:2px">Resolution steps</div>
        <ul class="inv-steps">
          <li class="done"><span>✓</span><p>Issue detected by readiness check<small>Flagged automatically · 6 min ago</small></p></li>
          <li><span>2</span><p>${r.owner} reviews and updates<small>Due ${r.due}</small></p></li>
          <li><span>3</span><p>Re-run readiness for ${m.name} · ${ch}<small>Unblocks ${r.exp} experiences</small></p></li>
        </ul>` : `<p class="sub" style="margin:14px 0">No open issues on this path. All experiences passed brand, legal and localization checks.</p>`}
        <div class="section-title" style="margin:16px 0 4px">Affected experiences</div>${exps}`,
      foot: open
        ? `<button class="btn" data-assign>Assign to ${r.owner.split(" · ")[0]}</button><button class="btn btn-dark" data-resolve>Mark resolved</button>`
        : `<a class="btn" href="content.html">Open in Content</a><button class="btn btn-dark" data-close>Done</button>`,
      onMount(d) {
        d.querySelector("[data-assign]")?.addEventListener("click", () => { closeDrawer(); toast(`Assigned to ${r.owner}`); });
        d.querySelector("[data-resolve]")?.addEventListener("click", () => resolve(key));
      },
    });
  }

  function resolve(key) {
    const [code, ch] = key.split(":");
    const m = mOf(code);
    const cell = cellOf(key);
    const r = RISKS[key];
    const delta = r.fix - cell[0];
    cell[0] = r.fix;
    cell[1] = "ready";
    m.total += delta;
    closeDrawer();
    renderAll();
    const td = $(`#mx2-body td[data-key="${key}"]`);
    td?.classList.add("is-flash");
    toast(`${m.full} · ${ch} resolved · ${delta} more experiences ready`);
  }

  function openMarket(m) {
    openDrawer({
      title: `${m.full} breakdown`,
      body: `<div class="cell-sum">${flag(m.code)}<div style="flex:1"><h4>${m.total} of 300 experiences ready</h4><div class="sub" style="margin-top:4px">Market owner: ${OWNER[m.code]}</div></div></div>
        ${m.cells.map(([n, s], i) => `<button class="exp-row" style="width:100%;text-align:left" data-pick="${m.code}:${CH[i]}"><span style="width:20px;display:grid;place-items:center">${Nova.channelIcon(CH[i])}</span><p>${CH[i]}<span>${n} / 60 ready</span></p><span class="badge ${s}">${LABEL[s]}</span></button>`).join("")}`,
      onMount(d) {
        $$("[data-pick]", d).forEach((b) => b.addEventListener("click", () => { closeDrawer(); select(b.dataset.pick, true); }));
      },
    });
  }

  /* ---------------- Init ---------------- */
  const fromHash = decodeURIComponent(location.hash.slice(1));
  if (/^[a-z]{2}:(Web|Email|TikTok|Instagram|YouTube)$/.test(fromHash) && mOf(fromHash.split(":")[0])) state.sel = fromHash;
  renderHead();
  renderAll();
  setInterval(renderCards, 60000);
})();
