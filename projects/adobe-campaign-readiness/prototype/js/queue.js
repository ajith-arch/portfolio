(function () {
  const { flag, mask, thumb, openMenu, openModal, closeModal, openDrawer, closeDrawer, toast } = Nova;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const MK = { fr: "France", de: "Germany", uk: "UK", us: "US", jp: "Japan", au: "Australia" };
  const PRIORITY = { urgent: ["Urgent", "red", 0], high: ["High", "red", 1], medium: ["Medium", "amber", 2], low: ["Low", "blue", 3] };
  const STATUS = { blocked: "Blocked", risk: "At risk", ready: "Resolved" };

  /* Figma screen 03 values · rows 7–9 are page 2 */
  const ITEMS = [
    { key: "fr:TikTok", pr: "urgent", issue: "Promotional claim requires regional legal review", short: "Promotional claim requires regional legal review", sub: "Current claim: “Save $100”.", exp: 8, impact2: "TikTok activation is paused for France.", owner: "Regional Legal", day: 0, time: "4:00 PM", status: "blocked", action: "Investigate", type: "legal", ext: true, claim: "“Save $100”", why: ["Launch-critical", "8 dependent experiences", "Due today"] },
    { key: "de:Instagram", pr: "high", issue: "Localized asset missing", sub: "German Story copy not yet generated.", exp: 4, impact2: "Stories fall back to English in Germany.", owner: "Localization Ops", day: 0, time: "5:00 PM", status: "risk", action: "Open task", type: "localization", why: ["4 dependent experiences", "Can be generated with Firefly", "Due today"] },
    { key: "uk:Email", pr: "high", issue: "Approval pending", sub: "Legal sign-off on subject lines.", exp: 2, impact2: "Approved variants can still send.", owner: "Legal Review", day: 1, time: "2:00 PM", status: "risk", action: "Follow up", type: "legal", ext: true, why: ["Approval gate", "2 dependent experiences", "Due tomorrow"] },
    { key: "de:YouTube", pr: "medium", issue: "Localized asset missing", sub: "German end card not delivered.", exp: 3, impact2: "Pre-roll runs with English end card.", owner: "Creative Ops", day: 1, time: "5:00 PM", status: "risk", action: "View details", type: "localization", why: ["3 dependent experiences", "Fallback asset available", "Due tomorrow"] },
    { key: "fr:Email", pr: "medium", issue: "Copy review pending", sub: "Subject line tone check for France.", exp: 2, impact2: "Send is scheduled but held for review.", owner: "Regional Marketing", day: "Oct 1", time: "10:00 AM", status: "risk", action: "Review", type: "review", ext: true, why: ["2 dependent experiences", "Copy edit only", "Due Oct 1"] },
    { key: "uk:TikTok", pr: "medium", issue: "Asset delivery pending", sub: "Final 9:16 cut due from agency.", exp: 1, impact2: "Spark ad uses the previous cut.", owner: "Creative Services", day: "Oct 1", time: "1:00 PM", status: "risk", action: "Track", type: "asset", ext: true, why: ["1 dependent experience", "Waiting on agency delivery", "Due Oct 1"] },
    { key: "fr:Instagram", pr: "low", issue: "Caption over character limit", sub: "French copy exceeds 2,200 characters.", exp: 5, impact2: "Captions are truncated in feed.", owner: "Localization Ops", day: "Oct 1", time: "3:00 PM", status: "risk", action: "Edit copy", type: "localization", why: ["5 dependent experiences", "Copy edit only", "Due Oct 1"] },
    { key: "de:TikTok", pr: "low", issue: "Music licence pending", sub: "Track cleared in 5 of 6 markets.", exp: 6, impact2: "Spark ads can't be boosted yet.", owner: "Brand Partnerships", day: "Oct 2", time: "9:00 AM", status: "risk", action: "Follow up", type: "legal", why: ["6 dependent experiences", "Single licence approval", "Due at launch"] },
    { key: "fr:YouTube", pr: "low", issue: "Voice-over not localized", sub: "French VO due from agency.", exp: 4, impact2: "Pre-roll runs with English audio.", owner: "Creative Services", day: "Oct 2", time: "11:00 AM", status: "risk", action: "Track", type: "asset", why: ["4 dependent experiences", "External vendor", "Due at launch"] },
  ];
  ITEMS.forEach((it, i) => (it.order = i));
  const OWNERS = [...new Set(ITEMS.map((i) => i.owner))].sort();
  const PER_PAGE = 6;

  const state = { view: "priority", owner: "all", status: "all", due: "all", q: "", critical: false, sort: "priority", page: 1, sel: "fr:TikTok" };

  const open = () => ITEMS.filter((i) => i.status !== "ready");
  const byKey = (k) => ITEMS.find((i) => i.key === k);
  const mcLabel = (it) => { const [c, ch] = it.key.split(":"); return `${MK[c]} · ${ch}`; };
  const dayLabel = (it) => (it.day === 0 ? "Today" : it.day === 1 ? "Tomorrow" : it.day);
  const dayRank = (it) => (typeof it.day === "number" ? it.day : it.day === "Oct 1" ? 2 : 3);
  const timeRank = (it) => { const [h, m] = it.time.split(/[: ]/); return ((+h % 12) + (it.time.endsWith("PM") ? 12 : 0)) * 60 + +m; };

  function matches(it) {
    const q = state.q.toLowerCase();
    if (state.owner !== "all" && it.owner !== state.owner) return false;
    if (state.status !== "all" && it.status !== state.status) return false;
    if (state.due === "today" && it.day !== 0) return false;
    if (state.due === "tomorrow" && it.day !== 1) return false;
    if (state.due === "week" && dayRank(it) > 3) return false;
    if (state.critical && !(it.status === "blocked" || it.pr === "urgent" || it.pr === "high")) return false;
    if (q && !`${it.issue} ${it.owner} ${mcLabel(it)} ${it.sub}`.toLowerCase().includes(q)) return false;
    return true;
  }
  function list() {
    const l = ITEMS.filter((it) => (state.status === "ready" ? it.status === "ready" : state.status === "all" ? it.status !== "ready" : true) && matches(it));
    const cmp = {
      priority: (a, b) => PRIORITY[a.pr][2] - PRIORITY[b.pr][2] || dayRank(a) - dayRank(b) || timeRank(a) - timeRank(b),
      due: (a, b) => dayRank(a) - dayRank(b) || timeRank(a) - timeRank(b),
      impact: (a, b) => b.exp - a.exp || PRIORITY[a.pr][2] - PRIORITY[b.pr][2],
      owner: (a, b) => a.owner.localeCompare(b.owner) || PRIORITY[a.pr][2] - PRIORITY[b.pr][2],
    }[state.view === "owner" ? "owner" : state.view === "due" && state.sort === "priority" ? "due" : state.sort];
    return l.sort(cmp);
  }

  /* ---------------- Summary cards ---------------- */
  function renderCards() {
    const o = open();
    const top = o.slice().sort((a, b) => PRIORITY[a.pr][2] - PRIORITY[b.pr][2] || dayRank(a) - dayRank(b))[0];
    const blockers = o.filter((i) => i.status === "blocked").length;
    const risk = o.filter((i) => i.status === "risk").length;
    const today = o.filter((i) => i.day === 0);
    const types = Object.entries(today.reduce((m, i) => ((m[i.type] = (m[i.type] || 0) + 1), m), {}));
    const ext = o.filter((i) => i.ext).length;
    let html = "";
    if (top) {
      const [c] = top.key.split(":");
      html += `<button class="q3-k q3-k1" data-k="top"><div class="q3-kh"><span class="q3-ki bang">!</span>Highest priority</div>
        ${flag(c)}<span class="q3-pill ${top.status}"><i></i>${STATUS[top.status]}</span>
        <div class="q3-kb"><div class="name">${mcLabel(top)}</div><div class="l">${top.exp} experience${top.exp === 1 ? "" : "s"} affected</div><div class="l ${top.day === 0 ? "red" : ""}">Due ${dayLabel(top).toLowerCase() === "today" ? "today" : dayLabel(top)} · ${top.owner}</div></div></button>`;
    } else {
      html += `<button class="q3-k q3-k1" data-k="none"><div class="q3-kh"><span class="q3-ki bang" style="background:var(--green-ok)">✓</span>Highest priority</div><div class="q3-kb" style="padding-left:44px"><div class="name">Queue clear</div><div class="l">No launch-critical issues.</div><div class="l">Launch can proceed.</div></div></button>`;
    }
    html += `<button class="q3-k${state.status === "blocked" ? " is-on" : ""}" data-k="comp"><div class="q3-kh"><span class="q3-ki"><span class="pie"></span></span>Queue composition</div>
      <div class="q3-kb"><div class="q3-big"><b>${blockers}</b><span>blocker${blockers === 1 ? "" : "s"}</span><i class="sep"></i><b class="amber">${risk}</b><span>at risk</span></div><div class="l">${o.length} item${o.length === 1 ? "" : "s"} require${o.length === 1 ? "s" : ""} action</div></div></button>`;
    html += `<button class="q3-k${state.due === "today" ? " is-on" : ""}" data-k="today"><div class="q3-kh"><span class="q3-ki">${mask("cal")}</span>Due today</div>
      <div class="q3-kb"><div class="q3-big"><b>${today.length}</b></div><div class="l">${types.length ? types.map(([t, n]) => `${n} ${t}`).join(" ・ ") : "Nothing due today"}</div></div></button>`;
    html += `<button class="q3-k" data-k="ext"><div class="q3-kh"><span class="q3-ki">${mask("audience")}</span>External dependencies</div>
      <div class="q3-kb"><div class="q3-big"><b>${ext}</b><span class="items">item${ext === 1 ? "" : "s"}</span></div><div class="l">Waiting on review or asset delivery</div></div></button>`;
    $("#q3-cards").innerHTML = html;
  }
  $("#q3-cards").addEventListener("click", (e) => {
    const k = e.target.closest("[data-k]")?.dataset.k;
    if (k === "top") { const top = open().sort((a, b) => PRIORITY[a.pr][2] - PRIORITY[b.pr][2])[0]; if (top) select(top.key, true); }
    if (k === "comp") setFilter("status", state.status === "blocked" ? "all" : "blocked");
    if (k === "today") setFilter("due", state.due === "today" ? "all" : "today");
    if (k === "ext") {
      const ext = open().filter((i) => i.ext);
      openModal({
        title: `External dependencies · ${ext.length}`,
        body: ext.map((it) => `<button class="q-row" data-q="${it.key}">${flag(it.key.split(":")[0], "sm")}<p><b>${it.issue}</b><span>${mcLabel(it)} · ${it.owner} · due ${dayLabel(it)} ${it.time}</span></p><span class="q3-pill ${it.status}"><i></i>${STATUS[it.status]}</span></button>`).join("") || `<div class="empty">Nothing is waiting on an external team.</div>`,
        foot: `<button class="btn" data-close>Close</button><button class="btn btn-dark" data-nudge>Nudge all owners</button>`,
        onMount(d) {
          $$("[data-q]", d).forEach((b) => b.addEventListener("click", () => { closeModal(); select(b.dataset.q, true); }));
          d.querySelector("[data-nudge]")?.addEventListener("click", () => { closeModal(); toast(`${ext.length} owners nudged for an update`); });
        },
      });
    }
  });

  /* ---------------- Table ---------------- */
  function rowHtml(it) {
    const [c] = it.key.split(":");
    const [pl, pc] = PRIORITY[it.pr];
    const done = it.status === "ready";
    return `<tr class="${it.status === "blocked" ? "blocked" : ""}${it.key === state.sel ? " is-sel" : ""}" data-key="${it.key}">
      <td><div class="q3-pr ${done ? "" : pc}" ${done ? 'style="color:var(--green-ok)"' : ""}><i ${done ? 'style="background:var(--green-ok);font-size:11px"' : ""}>${done ? "✓" : "!"}</i>${done ? "Done" : pl}</div></td>
      <td><div class="q3-issue">${it.issue}</div></td>
      <td><div class="q3-mc">${flag(c)}${mcLabel(it)}</div></td>
      <td><div class="q3-imp"><b>${it.exp}</b><span>experience${it.exp === 1 ? "" : "s"}</span></div></td>
      <td><div class="q3-own">${mask("person")}<span>${it.owner}</span></div></td>
      <td><div class="q3-due${it.day === 0 && !done ? " today" : ""}">${mask("cal")}<span>${dayLabel(it)}<small>${it.time}</small></span></div></td>
      <td><span class="q3-pill ${it.status}"><i></i>${STATUS[it.status]}</span></td>
      <td><button class="q3-btn${it.status === "blocked" ? " dark" : ""}" data-act="${it.key}">${done ? "View log" : it.action}${it.status === "blocked" ? '<span class="arr">→</span>' : ""}</button></td>
    </tr>`;
  }
  function renderTable() {
    const l = list();
    const pages = Math.max(1, Math.ceil(l.length / PER_PAGE));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * PER_PAGE;
    const rows = l.slice(start, start + PER_PAGE);
    $("#q3-body").innerHTML = rows.length
      ? rows.map(rowHtml).join("")
      : `<tr class="q3-empty"><td colspan="8" style="height:120px;text-align:center;color:#738099;cursor:default">${open().length ? "No items match these filters." : "The queue is clear. Every launch blocker has been resolved."}</td></tr>`;
    $("#q3-count").textContent = l.length ? `Showing ${start + 1}–${start + rows.length} of ${l.length} item${l.length === 1 ? "" : "s"}` : "Showing 0 items";
    $("#q3-page").textContent = `${state.page} of ${pages}`;
    $("#q3-prev").disabled = state.page <= 1;
    $("#q3-next").disabled = state.page >= pages;
  }

  /* ---------------- Selected item ---------------- */
  function renderPanel() {
    const it = byKey(state.sel);
    const [c] = it.key.split(":");
    const done = it.status === "ready";
    const rows = [
      [mask("doc"), "Issue", it.issue, it.sub],
      [mask("cube"), "Impact", `${it.exp} experience${it.exp === 1 ? "" : "s"} ${done ? "unblocked" : "affected"}`, done ? "Activation resumed." : it.impact2],
      [mask("audience"), "Owner", it.owner],
      [mask("cal"), "Due", `<span class="v ${it.day === 0 && !done ? "red" : ""}" style="margin:0">${done ? "Resolved today" : `${dayLabel(it)} · ${it.time}`}</span>`],
      [mask("bars"), "Why prioritized", `<ul>${(done ? ["Resolved and re-checked", "Removed from the queue"] : it.why).map((w) => `<li>${w}</li>`).join("")}</ul>`],
    ];
    $("#q3-detail").innerHTML = `<div class="q3-dt">
      <div class="q3-top">${flag(c)}<div><h4>${mcLabel(it)}</h4><p>${done ? "Resolved · no longer blocking." : it.pr === "urgent" ? "Highest launch priority." : `${PRIORITY[it.pr][0]} priority.`}</p></div><span class="q3-pill ${it.status}"><i></i>${STATUS[it.status]}</span></div>
      <div class="q3-rows">${rows.map(([ic, t, v, s], i) => `<div class="q3-row"><span class="ic">${ic}</span><div><b>${t}</b>${i === 3 || i === 4 ? v : `<div class="v">${v}</div>`}${s ? `<div class="s">${s}</div>` : ""}</div></div>`).join("")}</div></div>`;
    $("#q3-go").innerHTML = done ? "View log" : `${it.status === "blocked" ? "Investigate" : it.action}<span class="arr">→</span>`;
    $("#q3-assign").disabled = done;
    $("#q3-assign").style.opacity = done ? 0.5 : 1;
  }

  function select(key, reveal) {
    state.sel = key;
    if (reveal) {
      const l = list();
      const idx = l.findIndex((i) => i.key === key);
      if (idx < 0) { Object.assign(state, { owner: "all", status: "all", due: "all", q: "", critical: false }); syncControls(); }
      const i2 = list().findIndex((i) => i.key === key);
      if (i2 >= 0) state.page = Math.floor(i2 / PER_PAGE) + 1;
      renderTable();
    } else {
      $$("#q3-body tr[data-key]").forEach((tr) => tr.classList.toggle("is-sel", tr.dataset.key === key));
    }
    renderPanel();
    history.replaceState(null, "", `#${key}`);
  }

  function renderAll() { renderCards(); renderTable(); renderPanel(); }

  /* ---------------- Filters ---------------- */
  const OPTIONS = {
    view: [["priority", "Priority queue"], ["due", "Due date"], ["owner", "By owner"]],
    owner: [["all", "All owners"], ...OWNERS.map((o) => [o, o])],
    status: [["all", "All statuses"], ["blocked", "Blocked"], ["risk", "At risk"], ["ready", "Resolved"]],
    due: [["all", "All due dates"], ["today", "Due today"], ["tomorrow", "Due tomorrow"], ["week", "Before launch"]],
    sort: [["priority", "Priority"], ["due", "Due date"], ["impact", "Impact"]],
  };
  const labelFor = (k, v) => {
    const l = OPTIONS[k].find((o) => o[0] === v)[1];
    return k === "view" ? `View: ${l}` : k === "sort" ? `Sort: ${l}` : l;
  };
  function syncControls() {
    Object.keys(OPTIONS).forEach((k) => {
      const b = $(`[data-sel="${k}"]`);
      b.querySelector("[data-label]").textContent = labelFor(k, state[k]);
      b.classList.toggle("is-set", !["view", "sort"].includes(k) && state[k] !== "all");
    });
    $("#q3-q").value = state.q;
    $("#q3-crit").classList.toggle("is-on", state.critical);
    $("#q3-crit").setAttribute("aria-checked", state.critical);
  }
  function setFilter(k, v) {
    state[k] = v;
    state.page = 1;
    syncControls();
    renderCards();
    renderTable();
  }
  $$("[data-sel]").forEach((b) => b.addEventListener("click", (e) => {
    e.stopPropagation();
    const k = b.dataset.sel;
    openMenu(b, OPTIONS[k].map(([v, l]) => ({ label: l, selected: state[k] === v, onClick: () => setFilter(k, v) })));
  }));
  $("#q3-q").addEventListener("input", (e) => { state.q = e.target.value.trim(); state.page = 1; renderTable(); });
  $("#q3-crit").addEventListener("click", () => {
    setFilter("critical", !state.critical);
    const first = list()[0];
    if (state.critical && first) select(first.key);
  });
  $("#q3-prev").addEventListener("click", () => { state.page--; renderTable(); });
  $("#q3-next").addEventListener("click", () => { state.page++; renderTable(); });

  /* ---------------- Actions ---------------- */
  $("#q3-body").addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]");
    if (act) { e.stopPropagation(); select(act.dataset.act); return runAction(byKey(act.dataset.act)); }
    const tr = e.target.closest("tr[data-key]");
    if (tr) select(tr.dataset.key);
  });
  $("#q3-body").addEventListener("dblclick", (e) => {
    const tr = e.target.closest("tr[data-key]");
    if (tr && !e.target.closest("[data-act]")) investigate(byKey(tr.dataset.key));
  });
  document.addEventListener("keydown", (e) => {
    if (e.target.closest?.("input, textarea, [contenteditable]") || document.querySelector(".overlay, .drawer")) return;
    const keys = $$("#q3-body tr[data-key]").map((tr) => tr.dataset.key);
    if (!keys.length) return;
    const i = keys.indexOf(state.sel);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      select(keys[Math.max(0, Math.min(keys.length - 1, (i < 0 ? -1 : i) + (e.key === "ArrowDown" ? 1 : -1)))]);
    }
    if (e.key === "Enter") runAction(byKey(state.sel));
  });

  function runAction(it) {
    if (it.status === "ready") return activityLog(it);
    if (it.status === "blocked" || it.action === "View details" || it.action === "Open task") return investigate(it);
    if (it.action === "Follow up") return assign(it, $(`[data-act="${it.key}"]`) || $("#q3-assign"));
    if (it.action === "Review" || it.action === "Edit copy") return review(it);
    if (it.action === "Track") return track(it);
  }

  function investigate(it) {
    const [c, ch] = it.key.split(":");
    const exps = Array.from({ length: Math.min(it.exp, 4) }, (_, i) =>
      `<div class="exp-row">${thumb(Nova.THUMB_MIX[(it.order * 3 + i) % Nova.THUMB_MIX.length], 54, 42)}<p>${["Hero 16:9", "Story 9:16", "Feed 1:1", "Spark ad"][i]}<span>${MK[c]} · ${ch} · v${3 - (i % 3)}</span></p><span class="q3-pill ${it.status}"><i></i>${STATUS[it.status]}</span></div>`).join("");
    if (it.claim && it.status !== "ready") return investigateClaim(it, exps);
    openDrawer({
      title: mcLabel(it),
      body: `<div class="cell-sum">${flag(c)}<div style="flex:1"><h4>${it.issue}</h4><div class="sub" style="margin-top:4px">${it.exp} experience${it.exp === 1 ? "" : "s"} affected · owner ${it.owner}</div></div><span class="q3-pill ${it.status}"><i></i>${STATUS[it.status]}</span></div>
        <div class="alert" style="height:auto;margin:16px 0"><span class="bang">!</span><span><strong>${it.impact2}</strong><small style="font-size:11px">${it.sub}</small></span></div>
        <div class="section-title" style="margin-bottom:2px">Resolution steps</div>
        <ul class="inv-steps">
          <li class="done"><span>✓</span><p>Issue detected by readiness check<small>Flagged automatically · 6 min ago</small></p></li>
          <li><span>2</span><p>${it.owner} reviews and updates<small>Due ${dayLabel(it)} · ${it.time}</small></p></li>
          <li><span>3</span><p>Re-run readiness for ${MK[c]} · ${ch}<small>Unblocks ${it.exp} experience${it.exp === 1 ? "" : "s"}</small></p></li>
        </ul>
        <div class="section-title" style="margin:16px 0 4px">Affected experiences</div>${exps}`,
      foot: `<button class="btn" data-assign>Assign / follow up</button><button class="btn btn-dark" data-resolve>Mark resolved</button>`,
      onMount(d) {
        d.querySelector("[data-assign]").addEventListener("click", (e) => assign(it, e.currentTarget));
        d.querySelector("[data-resolve]").addEventListener("click", () => resolve(it));
      },
    });
  }

  function investigateClaim(it, exps) {
    const [c, ch] = it.key.split(":");
    const facts = [
      ["Root cause", it.issue],
      ["Current claim", it.claim],
      ["Affected", `${MK[c]} · ${ch}`],
      ["Dependent experiences", `${it.exp} paused until approval`],
      ["Owner", it.owner],
    ];
    openDrawer({
      title: mcLabel(it),
      body: `<div class="cell-sum">${flag(c)}<div style="flex:1"><h4>${it.issue}</h4><div class="sub" style="margin-top:4px">${it.exp} experiences affected · owner ${it.owner}</div></div><span class="q3-pill ${it.status}"><i></i>${STATUS[it.status]}</span></div>
        <div class="alert" style="height:auto;margin:16px 0"><span class="bang">!</span><span><strong>${it.impact2}</strong><small style="font-size:11px">The promotional claim ${it.claim} can't run in ${MK[c]} without regional legal review.</small></span></div>
        <div class="section-title" style="margin-bottom:6px">What we found</div>
        <dl class="q3-facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
        <div class="q3-next"><b>Next: understand the proposed change</b><span>The team proposes replacing ${it.claim} with a new claim. Review which experiences change and who needs to approve before submitting.</span></div>
        <div class="section-title" style="margin:16px 0 4px">Affected experiences</div>${exps}`,
      foot: `<button class="btn" data-assign>Assign / follow up</button><a class="btn btn-dark" href="impact.html#${it.key}" data-impact>Review change impact<span style="margin-left:10px">→</span></a>`,
      onMount(d) {
        d.querySelector("[data-assign]").addEventListener("click", (e) => assign(it, e.currentTarget));
      },
    });
  }

  function review(it) {
    const [c, ch] = it.key.split(":");
    const copy = it.action === "Edit copy" ? "Découvrez Nova : un son plus humain, pensé pour chaque instant. Précommandez dès aujourd’hui." : "Nova est là. Un son plus humain.";
    openModal({
      title: `${it.action === "Edit copy" ? "Edit copy" : "Review copy"} · ${MK[c]} · ${ch}`,
      body: `<p class="sub" style="margin-bottom:12px">${it.sub}</p><div class="field"><label>${ch === "Email" ? "Subject line" : "Caption"}</label><textarea class="input" rows="3" style="height:auto;padding:10px;resize:none" data-copy>${copy}</textarea></div><p class="sub" data-chars style="font-size:12px"></p>`,
      foot: `<button class="btn" data-close>Cancel</button><button class="btn btn-dark" data-ok>Approve & resolve</button>`,
      onMount(d) {
        const ta = d.querySelector("[data-copy]");
        const upd = () => (d.querySelector("[data-chars]").textContent = `${ta.value.length} characters`);
        ta.addEventListener("input", upd); upd();
        d.querySelector("[data-ok]").addEventListener("click", () => { closeModal(); resolve(it); });
      },
    });
  }

  function track(it) {
    const [c, ch] = it.key.split(":");
    openModal({
      title: `Tracking · ${MK[c]} · ${ch}`,
      body: `<p class="sub" style="margin-bottom:6px">${it.sub}</p><ul class="inv-steps">
        <li class="done"><span>✓</span><p>Request sent to ${it.owner}<small>Sep 28 · 10:12 AM</small></p></li>
        <li class="done"><span>✓</span><p>Vendor confirmed delivery date<small>Sep 29 · 4:40 PM</small></p></li>
        <li><span>3</span><p>Asset delivered and checked<small>Expected ${dayLabel(it)} · ${it.time}</small></p></li></ul>`,
      foot: `<button class="btn" data-ping>Ping ${it.owner}</button><button class="btn btn-dark" data-ok>Mark delivered</button>`,
      onMount(d) {
        d.querySelector("[data-ping]").addEventListener("click", () => { closeModal(); toast(`${it.owner} pinged for a delivery update`); });
        d.querySelector("[data-ok]").addEventListener("click", () => { closeModal(); resolve(it); });
      },
    });
  }

  function activityLog(it) {
    openModal({
      title: `Resolution log · ${mcLabel(it)}`,
      body: `<ul class="inv-steps"><li class="done"><span>✓</span><p>Issue detected<small>${it.issue}</small></p></li><li class="done"><span>✓</span><p>Resolved by ${it.owner}<small>Just now</small></p></li><li class="done"><span>✓</span><p>Readiness re-checked<small>${it.exp} experience${it.exp === 1 ? "" : "s"} unblocked</small></p></li></ul>`,
      foot: `<button class="btn btn-dark" data-close>Done</button>`,
    });
  }

  function assign(it, anchor) {
    if (it.status === "ready") return;
    openMenu(anchor, [
      ...OWNERS.map((o) => ({ label: o, selected: it.owner === o, onClick: () => { it.owner = o; renderAll(); toast(`${mcLabel(it)} assigned to ${o}`); } })),
      "hr",
      { label: `Send follow-up to ${it.owner}`, onClick: () => toast(`Follow-up sent to ${it.owner}`) },
    ], { align: "right" });
  }

  function resolve(it) {
    it.status = "ready";
    closeDrawer();
    const next = list().find((i) => i.status !== "ready");
    renderCards();
    renderTable();
    renderPanel();
    toast(`${mcLabel(it)} resolved · ${it.exp} experience${it.exp === 1 ? "" : "s"} unblocked`);
    if (next) setTimeout(() => select(next.key, true), 900);
  }

  $("#q3-go").addEventListener("click", () => runAction(byKey(state.sel)));
  $("#q3-assign").addEventListener("click", (e) => assign(byKey(state.sel), e.currentTarget));
  $("#q3-more").addEventListener("click", (e) => {
    e.stopPropagation();
    const it = byKey(state.sel);
    openMenu(e.currentTarget, [
      { label: "Copy link to this item", onClick: () => { navigator.clipboard?.writeText(location.href).catch(() => {}); toast("Link copied"); } },
      { label: "Open in Markets × Channels", onClick: () => (location.href = `markets.html#${it.key}`) },
      { label: "Snooze for 24 hours", onClick: () => toast("Item snoozed until tomorrow") },
      "hr",
      { label: "Export queue report", onClick: () => toast("Blocker queue report exported") },
    ], { align: "right" });
  });

  /* ---------------- Next steps ---------------- */
  $$(".q3-step").forEach((b) => b.addEventListener("click", () => {
    const s = b.dataset.step;
    if (s === "1") { setFilter("critical", true); const f = list()[0]; if (f) select(f.key); }
    if (s === "2") assign(byKey(state.sel), b);
    if (s === "3") location.href = "activity.html";
    if (s === "4") {
      const t = b.querySelector("small");
      t.textContent = "Rechecking 360 experiences…";
      setTimeout(() => { t.textContent = `${open().length} open · checked just now`; b.classList.add("done"); toast(`Readiness rechecked · ${open().length} item${open().length === 1 ? "" : "s"} still open`); }, 900);
    }
  }));

  /* ---------------- Init ---------------- */
  const fromHash = decodeURIComponent(location.hash.slice(1));
  if (byKey(fromHash)) state.sel = fromHash;
  syncControls();
  renderCards();
  select(state.sel, true);
})();
