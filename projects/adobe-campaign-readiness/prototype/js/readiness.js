(function () {
  const { ICONS, flag, thumb, openMenu, openDrawer, openModal, toast, animateBars } = Nova;
  const D = NovaData;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const state = { market: "all", channel: "all", status: "all", q: "", sort: "none", view: "list" };

  /* ---------- Hero KPIs ---------- */
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      $("#ring").style.setProperty("--p", 78);
      $$("#stack i").forEach((i) => i.classList.add("go"));
    })
  );
  animateBars();
  $("[data-dl-icon]").outerHTML = ICONS.download();
  $$("[data-thumb]").forEach((el) => (el.outerHTML = thumb(el.dataset.thumb, 68, 53)));

  /* ---------- Matrix ---------- */
  const total = (m) => m.cells.reduce((s, c) => s + c[0], 0);
  const headIcons = {
    Web: `${ICONS.web()}<span>Web</span>`,
    Email: `${ICONS.email()}<span>Email</span>`,
    TikTok: `${ICONS.tiktok()}<span>TikTok</span>`,
    Instagram: `${ICONS.instagram()}<span>Instagram</span>`,
    YouTube: `${ICONS.youtube()}<span>YouTube</span>`,
  };

  function renderHead() {
    $("#mx-head").innerHTML =
      `<th class="sortable" data-sort="market"><span class="th">Market (6)<img class="tbl-caret" src="assets/icons/chevron-down-table.svg" alt="" style="width:23px;height:8px;margin-left:16px"></span></th>` +
      D.channels.map((c) => `<th data-ch="${c}"><span class="th">${headIcons[c]}</span></th>`).join("") +
      `<th class="sortable" data-sort="total"><span class="th">Total <span data-arrow>${state.sort === "asc" ? "↑" : "↓"}</span></span></th><th></th>`;
  }

  function cellHTML(m, ci) {
    const [n, s] = m.cells[ci];
    const inner = `<div class="cnt"><span class="dot ${D.statusDot[s]}"></span>${n} / 60</div><div class="st ${s === "ready" ? "" : s}">${D.statusLabel[s]}</div>`;
    return s === "blocked"
      ? `<td class="cell is-blocked" data-cell="${m.code}:${D.channels[ci]}"><div class="blk">${inner}</div></td>`
      : `<td class="cell" data-cell="${m.code}:${D.channels[ci]}">${inner}</td>`;
  }

  function visibleMarkets() {
    let list = D.markets.slice();
    if (state.market !== "all") list = list.filter((m) => m.code === state.market);
    if (state.status !== "all") list = list.filter((m) => m.cells.some((c, i) => c[1] === state.status && (state.channel === "all" || D.channels[i] === state.channel)));
    if (state.q) {
      const q = state.q.toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q) || m.full.toLowerCase().includes(q) || D.channels.some((c) => c.toLowerCase().includes(q)));
    }
    if (state.sort === "desc") list.sort((a, b) => total(b) - total(a));
    if (state.sort === "asc") list.sort((a, b) => total(a) - total(b));
    if (state.sort === "market") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }

  function renderBody() {
    const list = visibleMarkets();
    const q = state.q.toLowerCase();
    const chFilter = (c) => (state.channel === "all" || state.channel === c) && (!q || !D.channels.some((x) => x.toLowerCase().includes(q)) || c.toLowerCase().includes(q));
    $$("#mx th[data-ch]").forEach((th) => (th.style.opacity = chFilter(th.dataset.ch) ? 1 : 0.35));

    $("#mx-body").innerHTML = list.length
      ? list
          .map((m) => {
            const t = total(m);
            const pct = (t / 300) * 100;
            return `<tr data-market="${m.code}">
              <td><div class="market">${flag(m.code)}${m.name}</div></td>
              ${m.cells.map((_, i) => cellHTML(m, i)).join("")}
              <td class="total"><b>${t} / 300</b><div class="bar"><i class="${pct < 80 ? "amber" : "green"}" data-w="${pct.toFixed(2)}%"></i></div></td>
              <td class="more"><button data-row-menu="${m.code}" aria-label="Row actions">•••</button></td>
            </tr>`;
          })
          .join("")
      : `<tr><td colspan="8"><div class="empty">No markets match these filters.</div></td></tr>`;

    $$("#mx-body td.cell").forEach((td) => {
      const ch = td.dataset.cell.split(":")[1];
      td.style.opacity = chFilter(ch) ? 1 : 0.3;
    });

    $("#mx-cards").innerHTML = list
      .map((m) => {
        const t = total(m);
        return `<div class="mx-card"><header>${flag(m.code)}${m.full}<span class="pct">${t} / 300</span></header>
          <div class="bar"><i class="${t / 3 < 80 ? "amber" : "green"}" data-w="${(t / 3).toFixed(2)}%"></i></div>
          <div class="chs">${m.cells.map(([n, s], i) => `<div class="${s}" data-cell="${m.code}:${D.channels[i]}" style="cursor:pointer">${Nova.channelIcon(D.channels[i])}<b>${n}</b></div>`).join("")}</div></div>`;
      })
      .join("");
    animateBars($("#mx"));
  }

  renderHead();
  renderBody();

  /* Filters */
  const OPTIONS = {
    market: [["all", "All markets"], ...D.markets.map((m) => [m.code, m.full])],
    channel: [["all", "All channels"], ...D.channels.map((c) => [c, c])],
    status: [["all", "All statuses"], ["ready", "Ready"], ["risk", "At risk"], ["blocked", "Blocked"]],
    view: [["mc", "Market × Channel"], ["cm", "Channel × Market"], ["aud", "Market × Audience"]],
  };
  function setFilter(key, val) {
    state[key] = val;
    const btn = $(`[data-select="${key}"]`);
    if (btn) btn.querySelector("[data-label]").textContent = OPTIONS[key].find((o) => o[0] === val)[1];
    btn && btn.style.setProperty("border-color", val === "all" ? "" : "#121419");
    renderBody();
  }
  $$("[data-select]").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const key = btn.dataset.select;
      if (key === "view") {
        return openMenu(btn, OPTIONS.view.map(([v, l]) => ({ label: l, selected: btn.querySelector("[data-label]").textContent === l, onClick: () => { btn.querySelector("[data-label]").textContent = l; if (v !== "mc") toast(`${l} view applied`); } })));
      }
      openMenu(btn, OPTIONS[key].map(([v, l]) => ({ label: l, selected: state[key] === v, onClick: () => setFilter(key, v) })));
    })
  );
  $("#mx-search").addEventListener("input", (e) => {
    state.q = e.target.value.trim();
    renderBody();
  });
  $$("[data-filter-status]").forEach((b) => b.addEventListener("click", () => setFilter("status", b.dataset.filterStatus)));

  /* Sort */
  $("#mx-head").addEventListener("click", (e) => {
    const th = e.target.closest("[data-sort]");
    if (!th) return;
    if (th.dataset.sort === "total") state.sort = state.sort === "desc" ? "asc" : "desc";
    else state.sort = state.sort === "market" ? "none" : "market";
    renderHead();
    renderBody();
  });

  /* View toggle */
  $$("[data-view]").forEach((b) =>
    b.addEventListener("click", () => {
      $$("[data-view]").forEach((x) => x.classList.toggle("is-active", x === b));
      $("#mx").classList.toggle("is-grid", b.dataset.view === "grid");
      animateBars($("#mx"));
    })
  );

  /* Download */
  $("#download").addEventListener("click", (e) => {
    e.stopPropagation();
    openMenu(e.currentTarget, [
      { label: "Download as CSV", onClick: downloadCSV },
      { label: "Download as PDF report", onClick: () => toast("Readiness report (PDF) is being prepared") },
      { label: "Send to Slack #nova-launch", onClick: () => toast("Snapshot sent to #nova-launch") },
    ], { align: "right" });
  });
  function downloadCSV() {
    const rows = [["Market", ...D.channels, "Total"], ...D.markets.map((m) => [m.full, ...m.cells.map((c) => `${c[0]}/60 ${D.statusLabel[c[1]]}`), `${total(m)}/300`])];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "project-nova-readiness.csv" });
    a.click();
    toast("project-nova-readiness.csv downloaded");
  }

  /* Row menu */
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-row-menu]");
    if (!b) return;
    e.stopPropagation();
    const m = D.markets.find((x) => x.code === b.dataset.rowMenu);
    openMenu(b, [
      { label: `View ${m.full} details`, onClick: () => openMarket(m) },
      { label: "Notify market owner", onClick: () => toast(`${m.full} owner notified`) },
      { label: "Export row", onClick: () => toast(`${m.full} readiness exported`) },
    ], { align: "right" });
  });

  /* Cell drawer */
  const ISSUES = {
    "fr:TikTok": ["Promotional claim requires review", "“Save $100” not allowed in France"],
    "de:Instagram": ["Localized asset missing", "German copy not yet generated"],
    "uk:Email": ["Approval pending", "Legal review in progress"],
  };
  const FORMATS = ["Hero 16:9", "Story 9:16", "Feed 1:1", "Banner 728×90", "Pre-roll 15s", "Carousel 4:5"];

  function openCell(key) {
    const [code, ch] = key.split(":");
    const m = D.markets.find((x) => x.code === code);
    const ci = D.channels.indexOf(ch);
    const [n, s] = m.cells[ci];
    const issue = ISSUES[key];
    const exps = FORMATS.map((f, i) => {
      const st = i === 0 && s !== "ready" ? s : i === 1 && s === "blocked" ? "risk" : "ready";
      return `<div class="exp-row">${thumb(i % 2 ? "mountain" : "headphones", 54, 42)}<p>${f}<span>${m.name} · ${ch} · v${3 - (i % 3)}</span></p><span class="badge ${st}">${D.statusLabel[st]}</span></div>`;
    }).join("");
    openDrawer({
      title: `${m.full} · ${ch}`,
      body: `
        <div class="cell-sum">${flag(code)}<div style="flex:1"><h4>${n} of 60 experiences ready</h4><div class="sub" style="margin-top:4px">${60 - n} need attention</div></div><span class="badge ${s}">${D.statusLabel[s]}</span></div>
        <div class="bar" style="margin:16px 0 18px;height:8px"><i class="${s === "ready" ? "green" : s === "risk" ? "amber" : "red"}" data-w="${(n / 60) * 100}%"></i></div>
        ${issue ? `<div class="alert" style="height:auto;margin:0 0 16px"><span class="bang">!</span><span><strong>${issue[0]}</strong><small style="font-size:11px">${issue[1]}</small></span></div>` : ""}
        <div class="section-title" style="margin-bottom:4px">Experiences</div>${exps}`,
      foot: `<a class="btn" href="content.html">Open in Content</a><button class="btn btn-dark" data-req>Request review</button>`,
      onMount(d) {
        animateBars(d);
        d.querySelector("[data-req]").onclick = () => {
          Nova.closeDrawer();
          toast(`Review requested for ${m.name} · ${ch}`);
        };
      },
    });
  }
  function openMarket(m) {
    openDrawer({
      title: `${m.full} readiness`,
      body: `<div class="cell-sum">${flag(m.code)}<div style="flex:1"><h4>${total(m)} of 300 experiences ready</h4><div class="sub" style="margin-top:4px">Owner: ${D.people.find((p) => p.markets.includes(m.full) || p.markets.includes(m.name))?.name || "Ajith Alphonse"}</div></div></div>
        ${m.cells.map(([n, s], i) => `<button class="exp-row" style="width:100%;text-align:left" data-cell="${m.code}:${D.channels[i]}"><span style="width:20px;display:grid;place-items:center">${Nova.channelIcon(D.channels[i])}</span><p>${D.channels[i]}<span>${n} / 60 ready</span></p><span class="badge ${s}">${D.statusLabel[s]}</span></button>`).join("")}`,
    });
  }
  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-cell]");
    if (c) openCell(c.dataset.cell);
  });

  /* Insights tabs */
  function showIns(id) {
    $$("[data-ins]").forEach((b) => b.classList.toggle("is-active", b.dataset.ins === id));
    $$("[data-panel]").forEach((p) => p.classList.toggle("is-active", p.dataset.panel === id));
  }
  $$("[data-ins]").forEach((b) => b.addEventListener("click", () => showIns(b.dataset.ins)));
  $$("[data-goto]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); showIns(b.dataset.goto); }));

  /* Next steps */
  $$("[data-step]").forEach((b) =>
    b.addEventListener("click", () => {
      const s = b.dataset.step;
      if (s === "blockers") { showIns("blockers"); setFilter("status", "blocked"); b.classList.add("is-done"); }
      if (s === "risk") { showIns("risk"); setFilter("status", "risk"); b.classList.add("is-done"); }
      if (s === "recheck") {
        const num = b.querySelector(".num");
        num.textContent = "…";
        $("#ring").style.setProperty("--p", 0);
        setTimeout(() => {
          $("#ring").style.setProperty("--p", 78);
          num.textContent = "4";
          b.classList.add("is-done");
          setFilter("status", "all");
          toast("Readiness rechecked · 281 of 360 experiences ready");
        }, 900);
      }
    })
  );

  /* Launch plan */
  $("#plan").addEventListener("click", () =>
    openModal({
      title: "Launch plan · Project Nova",
      body: `<p style="margin-bottom:18px">Global launch on <b style="color:#121419">Oct 2, 2026</b> across 6 markets and 5 channels.</p>
        <ul class="plan-tl">
          <li class="done"><strong>Creative brief approved</strong><p>Aug 18 · Brand Marketing</p></li>
          <li class="done"><strong>Master assets produced</strong><p>Sep 6 · 300 assets generated with Firefly</p></li>
          <li class="done"><strong>Localization complete (4 of 6 markets)</strong><p>Sep 22 · DE and FR in progress</p></li>
          <li class="now"><strong>Legal & compliance review</strong><p>Now · 43 approvals pending, 3 blockers</p></li>
          <li><strong>Activation scheduled</strong><p>Sep 30 · Journey Optimizer & paid social</p></li>
          <li><strong>Global launch</strong><p>Oct 2, 2026 · 09:00 local time</p></li>
        </ul>`,
      foot: `<button class="btn" data-close>Close</button><a class="btn btn-dark" href="overview.html">Open campaign overview</a>`,
    })
  );
})();
