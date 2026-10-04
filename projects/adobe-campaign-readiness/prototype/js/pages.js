(function () {
  const { ICONS, flag, thumb, THUMB_MIX, channelIcon, openMenu, openModal, closeModal, openDrawer, closeDrawer, toast, animateBars, PAGE } = Nova;
  const D = NovaData;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const MK = Object.fromEntries(D.markets.map((m) => [m.code, m]));
  const STATUS = { ready: "Ready", risk: "At risk", blocked: "Blocked", review: "In review", draft: "Draft" };
  const BADGE = { ready: "ready", risk: "risk", blocked: "blocked", review: "info", draft: "neutral" };

  function selectMenu(btn, options, current, onPick) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openMenu(btn, options.map(([v, l]) => ({ label: l, selected: current() === v, onClick: () => { btn.querySelector("[data-label]").textContent = l; onPick(v); } })));
    });
  }

  /* ---------------- Overview ---------------- */
  function overview() {
    $("#ov-flags").innerHTML = D.markets.map((m) => flag(m.code)).join("");
    $("#ov-channels").innerHTML = D.channels.map((c) => `<span class="ch">${channelIcon(c)}${c}</span>`).join("");

    const target = new Date("2026-10-02T09:00:00").getTime();
    const start = Date.now();
    const base = 3 * 864e5;
    const tick = () => {
      const left = Math.max(0, base - (Date.now() - start));
      const d = Math.floor(left / 864e5), h = Math.floor((left % 864e5) / 36e5), m = Math.floor((left % 36e5) / 6e4), s = Math.floor((left % 6e4) / 1e3);
      $("#countdown").textContent = `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    };
    void target;
    tick();
    setInterval(tick, 1000);

    const MIX = {
      exp: { label: "experiences", data: [["Web", 72, "#075aff"], ["Email", 72, "#121419"], ["TikTok", 72, "#ff3345"], ["Instagram", 72, "#8531ff"], ["YouTube", 72, "#ffba00"]] },
      budget: { label: "budget ($K)", data: [["Web", 520, "#075aff"], ["Email", 180, "#121419"], ["TikTok", 640, "#ff3345"], ["Instagram", 590, "#8531ff"], ["YouTube", 470, "#ffba00"]] },
      reach: { label: "reach (M)", data: [["Web", 9.8, "#075aff"], ["Email", 4.1, "#121419"], ["TikTok", 14.6, "#ff3345"], ["Instagram", 11.2, "#8531ff"], ["YouTube", 8.5, "#ffba00"]] },
    };
    let metric = "exp";
    const C = 2 * Math.PI * 54;
    function drawDonut() {
      const { label, data } = MIX[metric];
      const sum = data.reduce((s, d) => s + d[1], 0);
      let off = 0;
      $("#donut").innerHTML = `<circle cx="66" cy="66" r="54" stroke="#eef0f2"></circle>` + data.map(([n, v, c], i) => {
        const len = (v / sum) * C;
        const el = `<circle data-i="${i}" cx="66" cy="66" r="54" stroke="${c}" stroke-dasharray="0 ${C}" stroke-dashoffset="${-off}" data-len="${len - 2}"></circle>`;
        off += len;
        return el;
      }).join("");
      $("#donut-total").textContent = metric === "exp" ? sum : metric === "budget" ? "$" + (sum / 1000).toFixed(1) + "M" : sum.toFixed(1) + "M";
      $("#donut-label").textContent = label;
      $("#donut-legend").innerHTML = data.map(([n, v, c], i) => `<button data-i="${i}"><span class="dot" style="background:${c}"></span>${n}<b>${metric === "exp" ? v : metric === "budget" ? "$" + v + "K" : v + "M"}</b><span class="muted" style="width:38px;text-align:right">${Math.round((v / sum) * 100)}%</span></button>`).join("");
      requestAnimationFrame(() => requestAnimationFrame(() => $$("#donut circle[data-len]").forEach((c) => c.setAttribute("stroke-dasharray", `${c.dataset.len} ${C}`))));
    }
    drawDonut();
    $("#donut-legend").addEventListener("mouseover", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      $("#donut-legend").classList.add("has-focus");
      $$("#donut-legend button").forEach((x) => x.classList.toggle("is-focus", x === b));
      $$("#donut circle[data-i]").forEach((c) => (c.style.opacity = c.dataset.i === b.dataset.i ? 1 : 0.25));
    });
    $("#donut-legend").addEventListener("mouseleave", () => {
      $("#donut-legend").classList.remove("has-focus");
      $$("#donut circle[data-i]").forEach((c) => (c.style.opacity = 1));
    });
    selectMenu($("#mix-metric"), [["exp", "Experiences"], ["budget", "Budget"], ["reach", "Reach"]], () => metric, (v) => { metric = v; drawDonut(); });

    /* Daily readiness, Sep 3 → Oct 2 (launch day) */
    const TREND = [22, 24, 25, 27, 30, 31, 33, 36, 38, 41, 43, 44, 46, 45, 50, 53, 55, 57, 58, 61, 63, 64, 66, 68, 70, 71, 74, 76, 77, 78];
    const TARGET = 90;
    function drawTrend(n) {
      const vals = TREND.slice(-n);
      const days = vals.map((_, i) => new Date(2026, 9, 2 - (vals.length - 1 - i)));
      const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const showLabel = (d, i) => n === 7 || (n === 14 ? i % 2 === (vals.length - 1) % 2 : (vals.length - 1 - i) % 7 === 0);
      $("#perf").className = `perf r${n}`;
      $("#perf").innerHTML = `<span class="target" style="bottom:calc(${TARGET}% - 18px)"><em>Target ${TARGET}%</em></span>` + vals.map((v, i) => {
        const d = days[i];
        const mStart = i > 0 && d.getDate() === 1;
        return `<div class="col${i === vals.length - 1 ? " is-now" : ""}${mStart ? " m-start" : ""}">${mStart || (i === 0 && n === 30) ? `<span class="mtag">${d.toLocaleDateString("en-US", { month: "long" })}</span>` : ""}<span class="tip">${fmt(d)} · <b>${v}%</b></span><i data-h="${v}%"></i></div>`;
      }).join("");
      $("#perf-x").className = `perf-x r${n}`;
      $("#perf-x").innerHTML = days.map((d, i) => `<span>${showLabel(d, i) ? (i === vals.length - 1 ? "Today" : fmt(d)) : ""}</span>`).join("");
      const delta = vals[vals.length - 1] - vals[0];
      $("#trend-sum").innerHTML = `<b>${vals[vals.length - 1]}%</b> now <span class="up">▲ ${delta} pts</span> in ${n} days · ${TARGET - vals[vals.length - 1]} pts to target`;
      requestAnimationFrame(() => requestAnimationFrame(() => $$("#perf i").forEach((i) => (i.style.height = `calc(${i.dataset.h} - 18px)`))));
    }
    drawTrend(14);
    $$("#trend-range .chip").forEach((c) => c.addEventListener("click", () => {
      $$("#trend-range .chip").forEach((x) => x.classList.toggle("is-active", x === c));
      drawTrend(+c.dataset.r);
    }));

    $("#ov-team-count").textContent = `${D.people.length} people`;
    $("#ov-team").innerHTML = D.people.slice(0, 3).map((p) => `<div class="team-row"><span class="avatar presence ${p.online ? "on" : ""}" style="background:${p.c}">${p.i}</span><span><b style="font-size:13px">${p.name}</b><br><span class="muted" style="font-size:12px;margin:0">${p.role}</span></span><span class="muted">${p.markets}</span></div>`).join("");
  }

  /* ---------------- Content ---------------- */
  const FORMATS = { Web: ["Hero 16:9", "Banner 728×90", "Product tile"], Email: ["Header 600×300", "Promo block"], TikTok: ["Video 9:16", "Spark ad"], Instagram: ["Feed 1:1", "Story 9:16", "Carousel 4:5"], YouTube: ["Pre-roll 15s", "Bumper 6s"] };
  const AUD = ["Audiophiles", "Commuters", "Remote workers", "Gen Z creators"];
  function pickThumb(out, k, ch) {
    const near = new Set([1, 4, 5, 6, 9, 10, 11].map((d) => out[k - d]?.img));
    const last = (t) => { for (let j = k - 1; j >= 0; j--) if (out[j].img === t) return j; return -1; };
    const pool = THUMB_MIX.filter((t) => !near.has(t) && (t !== "youtube" || ch === "YouTube"));
    return pool.sort((a, b) => last(a) - last(b))[0];
  }
  function buildContent() {
    const out = [];
    let k = 0;
    D.markets.forEach((m) =>
      D.channels.forEach((ch, ci) => {
        const st = m.cells[ci][1];
        const fmts = FORMATS[ch];
        const f = fmts[k % fmts.length];
        out.push({
          id: k, market: m.code, ch, fmt: f,
          title: `Nova ${["launch", "hero", "lifestyle", "pre-order", "feature"][k % 5]} — ${AUD[k % 4]}`,
          status: st === "ready" ? (k % 7 === 3 ? "review" : "ready") : st,
          img: pickThumb(out, k, ch),
          updated: ["4 min ago", "22 min ago", "1 hr ago", "3 hr ago", "Yesterday", "2 days ago"][k % 6],
          variants: 4 + (k % 9),
        });
        k++;
      })
    );
    return out;
  }
  function content() {
    const items = buildContent();
    const st = { ch: "all", market: "all", status: "all", q: "" };
    const chips = [["all", "All", ""], ...D.channels.map((c) => [c, c, channelIcon(c)])];
    $("#ct-channels").innerHTML = chips.map(([v, l, ic]) => `<button class="chip${v === "all" ? " is-active" : ""}" data-ch="${v}">${ic}${l}<span class="count">${v === "all" ? items.length : items.filter((i) => i.ch === v).length}</span></button>`).join("");
    $$("#ct-channels .chip").forEach((c) => c.addEventListener("click", () => {
      $$("#ct-channels .chip").forEach((x) => x.classList.toggle("is-active", x === c));
      st.ch = c.dataset.ch;
      render();
    }));
    selectMenu($('[data-ct="market"]'), [["all", "All markets"], ...D.markets.map((m) => [m.code, m.full])], () => st.market, (v) => { st.market = v; render(); });
    selectMenu($('[data-ct="status"]'), [["all", "All statuses"], ["ready", "Ready"], ["review", "In review"], ["risk", "At risk"], ["blocked", "Blocked"]], () => st.status, (v) => { st.status = v; render(); });
    $("#ct-search").addEventListener("input", (e) => { st.q = e.target.value.toLowerCase(); render(); });
    $$("[data-ctv]").forEach((b) => b.addEventListener("click", () => {
      $$("[data-ctv]").forEach((x) => x.classList.toggle("is-active", x === b));
      $("#ct-wrap").classList.toggle("is-list", b.dataset.ctv === "list");
    }));

    function list() {
      return items.filter((i) => (st.ch === "all" || i.ch === st.ch) && (st.market === "all" || i.market === st.market) && (st.status === "all" || i.status === st.status) && (!st.q || (i.title + i.ch + MK[i.market].full + i.fmt).toLowerCase().includes(st.q)));
    }
    function render() {
      const l = list();
      $("#ct-count").textContent = `${l.length} experience groups · ${l.reduce((s, i) => s + i.variants, 0)} variants`;
      $("#ct-grid").innerHTML = l.length ? l.map((i) => `
        <button class="card ct-card fade-in" data-id="${i.id}">
          <span class="media">${thumb(i.img, 10, 10)}<span class="over"><span class="ch-pill">${channelIcon(i.ch)}${i.ch}</span></span><span class="fmt">${i.fmt}</span></span>
          <span class="meta"><b>${i.title}</b><span class="line">${flag(i.market)}${MK[i.market].full} · ${i.variants} variants</span>
          <span class="foot"><span class="badge ${BADGE[i.status]}">${STATUS[i.status]}</span><span class="sub" style="font-size:11px">${i.updated}</span></span></span>
        </button>`).join("") : `<div class="empty" style="grid-column:1/-1">No experiences match these filters.</div>`;
      $("#ct-rows").innerHTML = l.map((i) => `<tr class="is-click" data-id="${i.id}"><td><div class="cell-flex">${thumb(i.img, 48, 36)}<p><b>${i.title}</b><span>${i.variants} variants</span></p></div></td><td><div class="cell-flex">${channelIcon(i.ch)}${i.ch}</div></td><td><div class="cell-flex">${flag(i.market, "sm")}${MK[i.market].full}</div></td><td>${i.fmt}</td><td class="muted">${i.updated}</td><td><span class="badge ${BADGE[i.status]}">${STATUS[i.status]}</span></td></tr>`).join("");
    }
    render();

    document.addEventListener("click", (e) => {
      const el = e.target.closest("[data-id]");
      if (!el || !$("#page").contains(el)) return;
      const i = items[+el.dataset.id];
      openDrawer({
        title: i.title,
        body: `${thumb(i.img, 376, 210, "display:block;width:100%;border-radius:8px")}
          <div style="display:flex;gap:8px;margin:14px 0 4px;flex-wrap:wrap"><span class="badge ${BADGE[i.status]}">${STATUS[i.status]}</span><span class="badge neutral">${i.fmt}</span><span class="badge neutral">${AUD[i.id % 4]}</span></div>
          <div class="exp-row" style="display:flex;gap:10px;padding:12px 0;border-bottom:1px solid #f2f3f5">${flag(i.market)}<p style="font-size:13px">${MK[i.market].full}<span class="muted" style="display:block;font-size:12px">Market</span></p></div>
          <div class="exp-row" style="display:flex;gap:10px;padding:12px 0;border-bottom:1px solid #f2f3f5;align-items:center"><span style="width:29px;display:grid;place-items:center">${channelIcon(i.ch)}</span><p style="font-size:13px">${i.ch}<span class="muted" style="display:block;font-size:12px">Channel</span></p></div>
          <div class="field" style="margin-top:16px"><label>Headline</label><input class="input" value="Next-gen audio. A more human sound."></div>
          <div class="field"><label>Call to action</label><input class="input" value="${i.market === "fr" ? "Précommander" : i.market === "de" ? "Jetzt vorbestellen" : i.market === "jp" ? "今すぐ予約" : "Pre-order now"}"></div>
          <div class="section-title" style="margin:6px 0 10px">Variants (${i.variants})</div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">${Array.from({ length: Math.min(i.variants, 8) }, (_, n) => thumb(THUMB_MIX[(i.id * 7 + n * 3) % THUMB_MIX.length], 86, 64)).join("")}</div>`,
        foot: `<button class="btn" data-x="regen">Regenerate</button><button class="btn btn-dark" data-x="review">Send for review</button>`,
        onMount(d) {
          d.querySelector('[data-x="regen"]').onclick = () => toast("Generating 4 new variants with Firefly…");
          d.querySelector('[data-x="review"]').onclick = () => { i.status = "review"; render(); closeDrawer(); toast("Sent for review"); };
        },
      });
    });

    $("#ct-generate").addEventListener("click", () => openModal({
      title: "Generate variants",
      body: `<div class="field"><label>Base experience</label><button class="select" style="height:36px;width:100%" type="button"><span>Nova hero — Commuters</span><span class="caret"></span></button></div>
        <div class="field"><label>Prompt</label><textarea class="textarea">Matte black Nova headphones on a commuter at golden hour, cinematic, brand-safe.</textarea></div>
        <div class="field"><label>Channels</label><div class="chips">${D.channels.map((c, n) => `<button type="button" class="chip${n < 3 ? " is-active" : ""}" data-toggle>${channelIcon(c)}${c}</button>`).join("")}</div></div>
        <div class="field"><label>Variants per channel</label><input class="input" type="number" value="4" min="1" max="12" style="width:100px"></div>`,
      foot: `<button class="btn" data-close>Cancel</button><button class="btn btn-dark" id="gen-go">Generate</button>`,
      onMount(m) {
        m.querySelectorAll("[data-toggle]").forEach((c) => (c.onclick = () => c.classList.toggle("is-active")));
        m.querySelector("#gen-go").onclick = () => {
          const b = m.querySelector("#gen-go");
          b.textContent = "Generating…";
          b.disabled = true;
          setTimeout(() => {
            closeModal();
            items.unshift({ market: "us", ch: "Instagram", fmt: "Feed 1:1", title: "Nova golden hour — Commuters", status: "draft", img: "mountain", updated: "Just now", variants: 12 });
            items.forEach((it, idx) => (it.id = idx));
            render();
            toast("12 new variants generated");
          }, 1400);
        };
      },
    }));
  }

  /* ---------------- Activity ---------------- */
  const P = Object.fromEntries(D.people.map((p) => [p.i, p]));
  const EVENTS = [
    { day: "Today", who: "MC", type: "approvals", t: "approved <b>12 experiences</b> for UK · Email", time: "9:42 AM", thumbs: ["headphones", "hero"] },
    { day: "Today", who: "sys-red", type: "system", t: "<b>Legal check failed</b> on FR · TikTok — “Save $100” claim not allowed in France", time: "9:18 AM" },
    { day: "Today", who: "LR", type: "comments", t: "commented on <b>Nova hero — Commuters</b>", quote: "Can we try a warmer grade on the DE variants? The current one feels too cold for the autumn launch.", time: "8:55 AM" },
    { day: "Today", who: "SK", type: "assets", t: "uploaded <b>14 localized assets</b> for Japan", time: "8:20 AM", thumbs: ["mountain", "headphones", "hero"] },
    { day: "Yesterday", who: "sys-green", type: "system", t: "Readiness increased to <b>78%</b> · up 12% from last week", time: "6:02 PM" },
    { day: "Yesterday", who: "EW", type: "assets", t: "generated <b>48 variants</b> with Firefly for Instagram", time: "4:37 PM", thumbs: ["hero", "mountain"] },
    { day: "Yesterday", who: "JM", type: "comments", t: "requested changes on <b>DE · Instagram</b>", quote: "German copy is still missing on 4 experiences — flagging as at risk.", time: "2:11 PM" },
    { day: "Yesterday", who: "CD", type: "approvals", t: "approved <b>France Web hero</b> after legal review", time: "11:03 AM" },
    { day: "Sep 27", who: "AA", type: "system", t: "moved launch to <b>Oct 2, 2026</b>", time: "5:45 PM" },
  ];
  function activity() {
    const F = [["all", "All"], ["approvals", "Approvals"], ["comments", "Comments"], ["assets", "Assets"], ["system", "System"]];
    let f = "all";
    $("#act-filters").innerHTML = F.map(([v, l]) => `<button class="chip${v === "all" ? " is-active" : ""}" data-f="${v}">${l}</button>`).join("");
    $$("#act-filters .chip").forEach((c) => c.addEventListener("click", () => {
      $$("#act-filters .chip").forEach((x) => x.classList.toggle("is-active", x === c));
      f = c.dataset.f;
      render();
    }));
    function who(e) {
      if (e.who.startsWith("sys")) {
        const c = e.who === "sys-red" ? "#ff3043" : "#0bb34d";
        return `<span class="sys" style="background:${c}">${e.who === "sys-red" ? "!" : "✓"}</span>`;
      }
      const p = P[e.who];
      return `<span class="avatar" style="background:${p.c}">${p.i}</span>`;
    }
    function render(newFirst) {
      const l = EVENTS.filter((e) => f === "all" || e.type === f);
      let day = "";
      $("#act-feed").innerHTML = l.map((e, idx) => {
        const head = e.day !== day ? `<div class="day">${(day = e.day)}</div>` : "";
        const name = e.who.startsWith("sys") ? "" : `<b>${P[e.who].name}</b> `;
        return `${head}<div class="ev${newFirst && idx === 0 ? " is-new" : ""}">${who(e)}<div class="txt">${name}${e.t}
          ${e.quote ? `<div class="quote">${e.quote}</div>` : ""}
          ${e.thumbs ? `<div class="attach">${e.thumbs.map((t) => thumb(t, 64, 48)).join("")}</div>` : ""}
          <div class="acts"><button data-like>♡ Like</button><button data-reply>Reply</button></div></div><span class="time">${e.time}</span></div>`;
      }).join("") || `<div class="empty">Nothing here yet.</div>`;
    }
    render();
    $("#act-feed").addEventListener("click", (e) => {
      const like = e.target.closest("[data-like]");
      if (like) { const on = like.classList.toggle("on"); like.textContent = on ? "♥ Liked" : "♡ Like"; like.style.color = on ? "#ff3345" : ""; }
      if (e.target.closest("[data-reply]")) { $("#act-input").focus(); $("#act-input").value = "@"; }
    });
    const post = () => {
      const v = $("#act-input").value.trim();
      if (!v) return;
      EVENTS.unshift({ day: "Today", who: "AA", type: "comments", t: "posted an update", quote: v.replace(/</g, "&lt;"), time: "Just now" });
      $("#act-input").value = "";
      f = "all";
      $$("#act-filters .chip").forEach((x) => x.classList.toggle("is-active", x.dataset.f === "all"));
      render(true);
      toast("Update posted to the campaign");
    };
    $("#act-post").addEventListener("click", post);
    $("#act-input").addEventListener("keydown", (e) => e.key === "Enter" && post());

    $("#spark").innerHTML = [12, 18, 9, 22, 27, 16, 31, 24, 29, 35, 26, 38, 42, 47].map((v) => `<i style="height:${(v / 47) * 100}%"></i>`).join("");
    $("#contributors").innerHTML = [["MC", 63, "approvals"], ["EW", 48, "variants"], ["SK", 31, "assets"], ["LR", 22, "comments"]].map(([i, n, w]) => `<div class="team-row"><span class="avatar" style="background:${P[i].c}">${i}</span><span><b>${P[i].name}</b><br><span class="muted" style="margin:0;font-size:12px">${n} ${w}</span></span><span class="muted"><span class="bar" style="width:70px;display:inline-block;vertical-align:middle"><i class="blue" data-w="${(n / 63) * 100}%"></i></span></span></div>`).join("");
  }

  /* ---------------- Assets ---------------- */
  function assets() {
    const A = [
      ["Nova hero — master", "Image", "headphones", "ready", "4.2 MB"],
      ["Golden hour alpine", "Image", "mountain", "ready", "6.8 MB"],
      ["Nova key visual", "Image", "hero", "ready", "3.1 MB"],
      ["Product hero — 4K", "Image", "headphones", "pending", "12.4 MB"],
      ["Launch film 30s", "Video", "hero", "ready", "84 MB"],
      ["Commuter story 9:16", "Video", "mountain", "ready", "22 MB"],
      ["Headline copy — EN", "Copy", "#121419", "ready", "12 KB"],
      ["Headline copy — FR", "Copy", "#003da5", "ready", "11 KB"],
      ["Headline copy — DE", "Copy", "#fa0019", "missing", "—"],
      ["Headline copy — JP", "Copy", "#ff3345", "ready", "14 KB"],
      ["Lifestyle — commuters", "Image", "mountain", "ready", "5.5 MB"],
      ["Matte black detail", "Image", "headphones", "ready", "2.9 MB"],
      ["Bumper 6s", "Video", "headphones", "ready", "9 MB"],
      ["Nova logo lockup", "Image", "hero", "ready", "640 KB"],
      ["Body copy — EN", "Copy", "#596174", "ready", "18 KB"],
      ["Body copy — DE", "Copy", "#ffa000", "missing", "—"],
      ["Alpine banner 728×90", "Image", "mountain", "ready", "380 KB"],
      ["Unboxing reel", "Video", "hero", "ready", "41 MB"],
    ].map(([name, type, img, status, size], id) => ({ id, name, type, img, status, size }));
    const sel = new Set();
    let type = "all", q = "";
    const types = ["all", "Image", "Video", "Copy"];
    $("#as-types").innerHTML = types.map((t) => `<button class="chip${t === "all" ? " is-active" : ""}" data-t="${t}">${t === "all" ? "All assets" : t}<span class="count">${t === "all" ? A.length : A.filter((a) => a.type === t).length}</span></button>`).join("");
    $$("#as-types .chip").forEach((c) => c.addEventListener("click", () => { $$("#as-types .chip").forEach((x) => x.classList.toggle("is-active", x === c)); type = c.dataset.t; render(); }));
    $("#as-search").addEventListener("input", (e) => { q = e.target.value.toLowerCase(); render(); });

    const media = (a) => a.img.startsWith("#")
      ? `<span class="swatch" style="background:${a.img}"><span style="font-size:22px">Aa</span></span>`
      : thumb(a.img, 10, 10) + (a.type === "Video" ? `<span style="position:absolute;inset:0;display:grid;place-items:center"><span style="width:34px;height:34px;border-radius:50%;background:rgba(9,10,10,.6);display:grid;place-items:center;color:#fff;font-size:12px;padding-left:2px">▶</span></span>` : "");
    const stBadge = (s) => s === "ready" ? `<span class="badge ready" style="height:18px;font-size:10px">Approved</span>` : s === "pending" ? `<span class="badge risk" style="height:18px;font-size:10px">Pending</span>` : `<span class="badge blocked" style="height:18px;font-size:10px">Missing</span>`;

    function render() {
      const l = A.filter((a) => (type === "all" || a.type === type) && (!q || a.name.toLowerCase().includes(q)));
      $("#as-grid").classList.toggle("selecting", sel.size > 0);
      $("#as-grid").innerHTML = l.map((a) => `<div class="card as-card${sel.has(a.id) ? " is-selected" : ""}" data-a="${a.id}" role="button" tabindex="0">
        <span class="media">${media(a)}<span class="check${sel.has(a.id) ? " is-on" : ""}" data-sel></span><span class="type">${a.type}</span></span>
        <span class="meta"><b>${a.name}</b><span class="line">${a.size}${stBadge(a.status)}</span></span></div>`).join("") || `<div class="empty" style="grid-column:1/-1">No assets found.</div>`;
      $("#as-bulk").innerHTML = sel.size ? `<div class="bulk"><b>${sel.size} selected</b><button class="btn" data-b="dl"><span class="ci-dlic"></span>Download</button><button class="btn" data-b="approve">Approve</button><button class="btn" data-b="clear">Clear</button></div>` : "";
      const pend = A.filter((a) => a.status !== "ready").length;
      $("#as-pending").textContent = `${pend} asset${pend === 1 ? "" : "s"} pending`;
    }
    render();

    $("#page").addEventListener("click", (e) => {
      const b = e.target.closest("[data-b]");
      if (b) {
        if (b.dataset.b === "dl") toast(`${sel.size} assets downloading as ZIP`);
        if (b.dataset.b === "approve") { sel.forEach((id) => A[id].status !== "missing" && (A[id].status = "ready")); toast(`${sel.size} assets approved`); }
        sel.clear();
        return render();
      }
      const card = e.target.closest("[data-a]");
      if (!card) return;
      const a = A[+card.dataset.a];
      if (e.target.closest("[data-sel]") || e.metaKey || e.shiftKey) {
        sel.has(a.id) ? sel.delete(a.id) : sel.add(a.id);
        return render();
      }
      openModal({
        title: a.name,
        wide: true,
        body: `<div style="display:grid;grid-template-columns:1.4fr 1fr;gap:20px">
          <div style="position:relative;height:300px;border-radius:8px;overflow:hidden;background:#f3f4f6">${a.img.startsWith("#") ? `<div class="swatch" style="position:absolute;inset:0;background:${a.img};font-size:15px;padding:30px;text-align:left;line-height:1.5">${a.name.includes("JP") ? "次世代のオーディオ。<br>より人間らしいサウンド。" : a.name.includes("FR") ? "L’audio nouvelle génération.<br>Un son plus humain." : a.name.includes("DE") ? "Übersetzung ausstehend…" : "Next-gen audio.<br>A more human sound."}</div>` : thumb(a.img, 420, 300, "position:absolute;inset:0;width:100%;height:100%")}</div>
          <div><div style="display:flex;gap:8px;margin-bottom:14px">${stBadge(a.status)}<span class="badge neutral" style="height:18px;font-size:10px">${a.type}</span></div>
            <dl style="display:grid;grid-template-columns:90px 1fr;row-gap:10px;margin:0;font-size:12px"><dt class="muted">Size</dt><dd style="margin:0;color:#121419">${a.size}</dd><dt class="muted">Source</dt><dd style="margin:0;color:#121419">${a.type === "Copy" ? "GenStudio copy" : "Adobe Firefly"}</dd><dt class="muted">Used in</dt><dd style="margin:0;color:#121419">${12 + a.id * 3} experiences</dd><dt class="muted">Uploaded</dt><dd style="margin:0;color:#121419">Sep ${10 + (a.id % 18)}, 2026</dd><dt class="muted">Rights</dt><dd style="margin:0;color:#121419">Global · until Dec 2027</dd></dl></div></div>`,
        foot: `<button class="btn" data-close>Close</button><button class="btn" id="m-dl"><span class="ci-dlic"></span>Download</button>${a.status !== "ready" ? `<button class="btn btn-dark" id="m-ap">${a.status === "missing" ? "Generate with Firefly" : "Approve asset"}</button>` : ""}`,
        onMount(m) {
          m.querySelector("#m-dl").onclick = () => toast(`${a.name} downloaded`);
          const ap = m.querySelector("#m-ap");
          ap && (ap.onclick = () => { a.status = "ready"; if (a.size === "—") a.size = "12 KB"; closeModal(); render(); toast(`${a.name} ${ap.textContent.startsWith("Gen") ? "generated" : "approved"}`); });
        },
      });
    });

    $("#as-upload").addEventListener("click", () => openModal({
      title: "Upload assets",
      body: `<div class="drop" id="drop"><div style="font-size:26px">⇪</div><p style="margin-top:8px;color:#121419;font-weight:500">Drag files here or <button class="link" id="pick" type="button">browse</button></p><p class="muted" style="font-size:12px;margin-top:4px">PNG, JPG, MP4, DOCX · up to 2 GB</p></div><div id="ups"></div><input type="file" id="file" multiple hidden>`,
      foot: `<button class="btn" data-close>Done</button>`,
      onMount(m) {
        const drop = m.querySelector("#drop");
        const start = (names) => names.forEach((n) => {
          const row = document.createElement("div");
          row.className = "up-row";
          row.innerHTML = `<span style="width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#121419">${n}</span><div class="bar"><i class="blue" style="transition:width .2s"></i></div><span class="muted" style="width:34px">0%</span>`;
          m.querySelector("#ups").appendChild(row);
          let p = 0;
          const t = setInterval(() => {
            p = Math.min(100, p + 8 + Math.random() * 14);
            row.querySelector("i").style.width = p + "%";
            row.querySelector(".muted").textContent = Math.round(p) + "%";
            if (p >= 100) { clearInterval(t); row.querySelector("i").className = "green"; row.querySelector(".muted").textContent = "✓"; A.unshift({ id: A.length, name: n.replace(/\.[^.]+$/, ""), type: /mp4|mov/i.test(n) ? "Video" : "Image", img: "headphones", status: "pending", size: "2.4 MB" }); A.forEach((x, i) => (x.id = i)); render(); }
          }, 160);
        });
        m.querySelector("#pick").onclick = () => m.querySelector("#file").click();
        m.querySelector("#file").onchange = (e) => start([...e.target.files].map((f) => f.name));
        drop.ondragover = (e) => { e.preventDefault(); drop.classList.add("is-over"); };
        drop.ondragleave = () => drop.classList.remove("is-over");
        drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove("is-over"); start([...e.dataTransfer.files].map((f) => f.name)); };
        drop.addEventListener("click", (e) => { if (!e.target.closest("#pick")) start(["nova-lifestyle-commute.jpg", "nova-teaser-15s.mp4"]); });
      },
    }));
  }

  /* ---------------- Approvals ---------------- */
  function approvals() {
    const names = ["Nova hero — Commuters", "Pre-order banner", "Launch film cutdown", "Feature carousel", "Holiday teaser", "Unboxing story", "Spec sheet email", "Golden hour feed"];
    const rows = [];
    let n = 0;
    const reviewers = ["MC", "CD", "LR", "JM"];
    D.markets.forEach((m) => D.channels.forEach((ch, ci) => {
      if (rows.length >= 18) return;
      if ((n += 1) % 2 && m.cells[ci][1] === "ready") return;
      const st = m.cells[ci][1];
      rows.push({ id: rows.length, name: names[rows.length % names.length], market: m.code, ch, reviewer: reviewers[rows.length % 4], due: ["Today", "Today", "Tomorrow", "Sep 30", "Overdue"][rows.length % 5], state: st === "blocked" ? "changes" : "pending", img: ["headphones", "mountain", "hero"][rows.length % 3], note: st === "blocked" ? "Claim “Save $100” not allowed" : st === "risk" ? "Localization check" : "Brand review" });
    }));
    const extraApproved = Array.from({ length: 6 }, (_, i) => ({ id: rows.length + i, name: names[(i + 3) % names.length], market: ["us", "uk", "jp", "au", "us", "uk"][i], ch: D.channels[i % 5], reviewer: reviewers[i % 4], due: "Done", state: "approved", img: ["hero", "headphones", "mountain"][i % 3], note: "Approved" }));
    rows.push(...extraApproved);

    const counts = { pending: 43, changes: 6, approved: 246, today: 17 };
    let tab = "pending", reviewer = "all", q = "";
    function sync() {
      const pct = Math.round((counts.approved / 289) * 100);
      $("#ap-pct").textContent = pct + "%";
      $("#ap-bar").style.width = pct + "%";
      $("#ap-approved").textContent = counts.approved;
      $("#ap-pending").textContent = counts.pending;
      $("#ap-changes").textContent = counts.changes;
      $("#ap-today").textContent = counts.today;
      $$("[data-c]").forEach((b) => (b.textContent = counts[b.dataset.c]));
    }
    function visible() {
      return rows.filter((r) => r.state === tab && (reviewer === "all" || r.reviewer === reviewer) && (!q || (r.name + MK[r.market].full + r.ch).toLowerCase().includes(q)));
    }
    function render() {
      const l = visible();
      $("#ap-rows").innerHTML = l.map((r) => `<tr data-r="${r.id}">
        <td><div class="cell-flex">${thumb(r.img, 48, 36)}<p><b>${r.name}</b><span>${r.note}</span></p></div></td>
        <td><div class="cell-flex">${flag(r.market, "sm")}<span>${MK[r.market].name}</span><span class="muted">·</span>${channelIcon(r.ch)}<span>${r.ch}</span></div></td>
        <td><div class="cell-flex"><span class="avatar" style="background:${P[r.reviewer].c};width:24px;height:24px;font-size:10px">${r.reviewer}</span>${P[r.reviewer].name}</div></td>
        <td><span class="due${r.due === "Overdue" ? " late" : ""}">${r.due}</span></td>
        <td><span class="badge ${r.state === "approved" ? "ready" : r.state === "changes" ? "blocked" : "risk"}">${r.state === "approved" ? "Approved" : r.state === "changes" ? "Changes requested" : "Pending"}</span></td>
        <td><div class="ap-actions">${r.state === "approved" ? `<button class="btn" data-do="undo">Undo</button>` : `<button class="btn" data-do="changes">Request changes</button><button class="btn btn-approve" data-do="approve">✓ Approve</button>`}</div></td></tr>`).join("") || `<tr><td colspan="6"><div class="empty">All caught up 🎉</div></td></tr>`;
    }
    sync();
    render();
    function move(r, to) {
      const from = r.state;
      counts[from] = Math.max(0, counts[from] - 1);
      counts[to] += 1;
      if (to === "approved") counts.today += 1;
      if (from === "approved") counts.today = Math.max(0, counts.today - 1);
      r.state = to;
      sync();
    }
    $("#ap-rows").addEventListener("click", (e) => {
      const b = e.target.closest("[data-do]");
      if (!b) return;
      const tr = b.closest("tr");
      const r = rows[+tr.dataset.r];
      const go = (to, msg) => { tr.classList.add("is-leaving"); setTimeout(() => { move(r, to); render(); toast(msg); }, 280); };
      if (b.dataset.do === "approve") go("approved", `${r.name} · ${MK[r.market].name} ${r.ch} approved`);
      if (b.dataset.do === "undo") go("pending", "Moved back to pending");
      if (b.dataset.do === "changes") openModal({
        title: "Request changes",
        body: `<p style="margin-bottom:14px">${r.name} · ${MK[r.market].full} · ${r.ch}</p><div class="field"><label>What needs to change?</label><textarea class="textarea" id="why">${r.note === "Brand review" ? "" : r.note + ". "}</textarea></div>`,
        foot: `<button class="btn" data-close>Cancel</button><button class="btn btn-dark" id="send">Send request</button>`,
        onMount(m) { m.querySelector("#send").onclick = () => { closeModal(); go("changes", "Change request sent"); }; },
      });
    });
    $$("#ap-tabs button").forEach((b) => b.addEventListener("click", () => { $$("#ap-tabs button").forEach((x) => x.classList.toggle("is-active", x === b)); tab = b.dataset.t; render(); }));
    selectMenu($("#ap-reviewer"), [["all", "All reviewers"], ...reviewers.map((r) => [r, P[r].name])], () => reviewer, (v) => { reviewer = v; render(); });
    $("#ap-search").addEventListener("input", (e) => { q = e.target.value.toLowerCase(); render(); });
    $("#ap-bulk").addEventListener("click", () => {
      const l = visible().filter((r) => r.state !== "approved");
      if (!l.length) return toast("Nothing to approve here");
      l.forEach((r) => move(r, "approved"));
      render();
      toast(`${l.length} items approved`);
    });
  }

  /* ---------------- People ---------------- */
  function people() {
    const ROLES = ["Campaign lead", "Approver", "Reviewer", "Editor", "Viewer"];
    let role = "all", q = "";
    const list = D.people.slice();
    function render() {
      const l = list.filter((p) => (role === "all" || p.role === role) && (!q || (p.name + p.email + p.team).toLowerCase().includes(q)));
      $("#pp-count").textContent = list.length;
      $("#pp-rows").innerHTML = l.map((p) => `<tr data-p="${p.email}">
        <td><div class="cell-flex"><span class="avatar lg presence ${p.online ? "on" : ""}" style="background:${p.c}">${p.i}</span><p><b>${p.name}</b>${p.owner ? ` <span class="badge neutral" style="height:18px;font-size:10px">Owner</span>` : ""}<span>${p.email}</span></p></div></td>
        <td>${p.owner ? `<span style="font-size:12px;padding-left:10px">${p.role}</span>` : `<button class="role-btn" data-role>${p.role}<span class="caret"></span></button>`}</td>
        <td>${p.team}</td><td class="muted">${p.markets}</td>
        <td>${p.pending ? `<span class="badge risk">Invited</span>` : p.online ? `<span class="badge ready"><span class="dot green sm"></span>Online</span>` : `<span class="muted" style="font-size:12px">Away</span>`}</td>
        <td style="text-align:right">${p.owner ? "" : `<button class="btn icon-only" style="height:30px;width:34px;border-color:transparent" data-pmenu>•••</button>`}</td></tr>`).join("") || `<tr><td colspan="6"><div class="empty">No people found.</div></td></tr>`;
      const cov = D.markets.map((m) => [m, list.filter((p) => p.markets.includes(m.full) || p.markets.includes(m.name) || p.markets === "All markets").length]);
      $("#pp-coverage").innerHTML = cov.map(([m, n]) => `<div class="cv">${flag(m.code, "sm")}<span style="width:92px">${m.full}</span><div class="bar"><i class="${n < 2 ? "amber" : "blue"}" data-w="${Math.min(100, n * 25)}%"></i></div><b>${n}</b></div>`).join("");
      animateBars($("#pp-coverage"));
    }
    render();
    $("#pp-rows").addEventListener("click", (e) => {
      const tr = e.target.closest("tr[data-p]");
      if (!tr) return;
      const p = list.find((x) => x.email === tr.dataset.p);
      const rb = e.target.closest("[data-role]");
      if (rb) {
        e.stopPropagation();
        return openMenu(rb, ROLES.slice(1).map((r) => ({ label: r, selected: p.role === r, onClick: () => { p.role = r; render(); toast(`${p.name} is now ${/^[AEIOU]/.test(r) ? "an" : "a"} ${r}`); } })));
      }
      const mb = e.target.closest("[data-pmenu]");
      if (mb) {
        e.stopPropagation();
        openMenu(mb, [
          { label: "Send message", onClick: () => toast(`Message sent to ${p.name}`) },
          { label: "Assign markets", onClick: () => toast("Market assignment opened") },
          "hr",
          { label: "Remove from campaign", danger: true, onClick: () => { list.splice(list.indexOf(p), 1); render(); toast(`${p.name} removed`); } },
        ], { align: "right" });
      }
    });
    selectMenu($("#pp-role"), [["all", "All roles"], ...ROLES.map((r) => [r, r])], () => role, (v) => { role = v; render(); });
    $("#pp-search").addEventListener("input", (e) => { q = e.target.value.toLowerCase(); render(); });
    $("#pp-invite").addEventListener("click", () => openModal({
      title: "Invite people to Project Nova",
      body: `<div class="field"><label>Email addresses</label><input class="input" id="inv-email" placeholder="name@adobe.com"></div>
        <div class="two"><div class="field"><label>Role</label><button type="button" class="select" id="inv-role" style="height:36px;width:100%"><span data-label>Editor</span><span class="caret"></span></button></div>
        <div class="field"><label>Markets</label><button type="button" class="select" id="inv-mk" style="height:36px;width:100%"><span data-label>All markets</span><span class="caret"></span></button></div></div>
        <div class="field"><label>Message (optional)</label><textarea class="textarea" placeholder="Join us for the Nova launch…"></textarea></div>`,
      foot: `<button class="btn" data-close>Cancel</button><button class="btn btn-dark" id="inv-send">Send invite</button>`,
      onMount(m) {
        let r = "Editor", mk = "All markets";
        selectMenu(m.querySelector("#inv-role"), ROLES.slice(1).map((x) => [x, x]), () => r, (v) => (r = v));
        selectMenu(m.querySelector("#inv-mk"), [["All markets", "All markets"], ...D.markets.map((x) => [x.full, x.full])], () => mk, (v) => (mk = v));
        m.querySelector("#inv-send").onclick = () => {
          const email = m.querySelector("#inv-email").value.trim() || "new.teammate@adobe.com";
          const name = email.split("@")[0].split(/[._]/).map((s) => s[0].toUpperCase() + s.slice(1)).join(" ");
          list.push({ i: name.split(" ").map((s) => s[0]).join("").slice(0, 2), name, email, role: r, team: "Invited", markets: mk, c: "#08b850", online: false, pending: true });
          closeModal();
          render();
          toast(`Invite sent to ${email}`);
        };
      },
    }));
  }

  /* ---------------- Settings ---------------- */
  function settings() {
    let dirty = false;
    const mark = () => { dirty = true; $("#st-note").textContent = "Unsaved changes"; $("#st-note").classList.add("dirty"); };
    const clean = (msg) => { dirty = false; $("#st-note").textContent = msg; $("#st-note").classList.remove("dirty"); };
    $("#st-form").addEventListener("input", mark);

    selectMenu($('[data-st="type"]'), [["g", "Global Campaign"], ["r", "Regional Campaign"], ["a", "Always-on"]], () => "", mark);
    selectMenu($('[data-st="tz"]'), [["l", "Local time per market"], ["u", "UTC"], ["p", "Pacific Time (PT)"]], () => "", mark);

    const mkOn = new Set(D.markets.map((m) => m.code));
    $("#st-markets").innerHTML = D.markets.map((m) => `<button type="button" class="mk is-on" data-mk="${m.code}">${flag(m.code, "sm")}${m.full}<span class="check is-on"></span></button>`).join("") +
      [["Canada", "ca"], ["Brazil", "br"], ["India", "in"]].map(([n, c]) => `<button type="button" class="mk" data-mk="${n}">${flag(c, "sm")}${n}<span class="check"></span></button>`).join("");
    $("#st-channels").innerHTML = D.channels.map((c) => `<button type="button" class="mk is-on">${channelIcon(c)}${c}<span class="check is-on"></span></button>`).join("") + `<button type="button" class="mk"><span style="width:16px;text-align:center">◎</span>Display ads<span class="check"></span></button>`;
    $$(".mk").forEach((b) => b.addEventListener("click", () => {
      b.classList.toggle("is-on");
      b.querySelector(".check").classList.toggle("is-on");
      mark();
      void mkOn;
    }));

    const NOTIF = [["Launch blockers", "Instant alert when a blocker is found", true], ["Approval requests", "When someone needs your sign-off", true], ["Daily readiness digest", "Summary every morning at 8:00", true], ["Comments & mentions", "When you are @mentioned", true], ["Asset uploads", "Every new asset added to the campaign", false], ["Weekly performance report", "Mondays, sent to all stakeholders", false]];
    $("#st-notifs").innerHTML = NOTIF.map(([t, s, on]) => `<div class="opt-row"><p>${t}<span>${s}</span></p><button type="button" class="switch${on ? " is-on" : ""}" aria-label="${t}"></button></div>`).join("");
    $$(".switch").forEach((s) => s.addEventListener("click", () => { s.classList.toggle("is-on"); mark(); }));

    const INTEG = [["Fi", "#ff3345", "Adobe Firefly", "Generative images and variants", true], ["AEM", "#eb1000", "Adobe Experience Manager Assets", "Source of truth for approved assets", true], ["AJO", "#075aff", "Adobe Journey Optimizer", "Email and web activation", true], ["Sl", "#4a154b", "Slack", "Post readiness updates to #nova-launch", false], ["Wf", "#8531ff", "Workfront", "Sync approvals and tasks", false]];
    $("#st-integ").innerHTML = INTEG.map(([l, c, n, s, on]) => `<div class="integ"><span class="logo" style="background:${c}">${l}</span><p>${n}<span>${s}</span></p>${on ? `<span class="badge ready">Connected</span><button type="button" class="btn sm" data-int="manage">Manage</button>` : `<button type="button" class="btn sm btn-dark" data-int="connect">Connect</button>`}</div>`).join("");
    $("#st-integ").addEventListener("click", (e) => {
      const b = e.target.closest("[data-int]");
      if (!b) return;
      const row = b.closest(".integ");
      const name = row.querySelector("p").firstChild.textContent;
      if (b.dataset.int === "connect") {
        b.textContent = "Connecting…";
        setTimeout(() => { b.outerHTML = `<span class="badge ready">Connected</span><button type="button" class="btn sm" data-int="manage">Manage</button>`; toast(`${name} connected`); }, 900);
      } else toast(`${name} settings opened`);
    });

    $$("[data-danger]").forEach((b) => b.addEventListener("click", () => {
      const archive = b.dataset.danger === "archive";
      openModal({
        title: archive ? "Archive Project Nova?" : "Pause Project Nova?",
        body: `<p>${archive ? "The campaign and its 360 experiences will move to the archive. The owner must approve this request." : "All scheduled activations will be held until you resume the campaign."}</p>`,
        foot: `<button class="btn" data-close>Cancel</button><button class="btn ${archive ? "btn-danger" : "btn-dark"}" id="cf">${archive ? "Request archive" : "Pause campaign"}</button>`,
        onMount(m) { m.querySelector("#cf").onclick = () => { closeModal(); toast(archive ? "Archive request sent to owner" : "Campaign paused"); }; },
      });
    }));

    $("#st-save").addEventListener("click", () => {
      const b = $("#st-save");
      b.textContent = "Saving…";
      setTimeout(() => {
        b.textContent = "Save changes";
        const name = $("#f-name").value.trim() || "Project Nova";
        $(".hero-title h1").textContent = name;
        $(".crumbs strong").textContent = name;
        $(".hero-sub").textContent = $("#f-tag").value;
        clean("All changes saved · just now");
        toast("Campaign settings saved");
      }, 700);
    });
    $("#st-reset").addEventListener("click", () => { if (!dirty) return; location.reload(); });

    const main = $(".main");
    const secs = $$(".st-sec");
    $$("#st-nav button").forEach((b) => b.addEventListener("click", () => {
      const s = document.getElementById(b.dataset.sec);
      main.scrollTo({ top: s.offsetTop + $("#page").offsetTop - 12, behavior: "smooth" });
    }));
    main.addEventListener("scroll", () => {
      let cur = secs[0].id;
      secs.forEach((s) => { if (s.getBoundingClientRect().top < 260) cur = s.id; });
      $$("#st-nav button").forEach((b) => b.classList.toggle("is-active", b.dataset.sec === cur));
    });
    if (location.hash) setTimeout(() => $(`#st-nav [data-sec="${location.hash.slice(1)}"]`)?.click(), 50);
  }

  ({ overview, content, activity, assets, approvals, people, settings }[PAGE] || (() => {}))();
  animateBars();
})();
