/* Shared app shell + UI utilities for every screen */
(function () {
  const A = "assets/";

  const TABS = [
    ["overview", "Overview"],
    ["readiness", "Readiness"],
    ["content", "Content"],
    ["activity", "Activity"],
    ["assets", "Assets"],
    ["approvals", "Approvals"],
    ["people", "People"],
    ["settings", "Settings"],
  ];

  /* Cropped bitmap icon: Figma exports icons on a padded canvas, so each one keeps its crop */
  function crop(src, w, h, c) {
    return `<span class="crop" style="width:${w}px;height:${h}px"><img src="${A}${src}" alt="" style="width:${c[0]}%;height:${c[1]}%;left:${c[2]}%;top:${c[3]}%"></span>`;
  }
  function mask(name, w, h, color) {
    return `<span class="mask m-${name}" style="width:${w}px;height:${h}px${color ? ";color:" + color : ""}"></span>`;
  }

  const ICONS = {
    bell: () => crop("icons/bell.png", 18, 23, [193.44, 154.75, -46.72, -29.84]),
    grid: () => crop("icons/grid.png", 20, 20, [239.77, 238.86, -69.79, -73.71]),
    campaigns: () => crop("icons/nav-campaigns.png", 20, 19, [172.49, 173.93, -36.45, -36.62]),
    activate: () => crop("icons/nav-activate.png", 20, 21, [154.37, 150.61, -27.5, -25]),
    insights: () => crop("icons/nav-insights.png", 20, 17, [170.15, 197.4, -36.19, -53.25]),
    brands: () => crop("icons/nav-brands.png", 20, 21, [169.69, 158.33, -34.51, -34.22]),
    personas: () => crop("icons/nav-personas.png", 20, 19, [144.48, 142.54, -22.41, -23.5]),
    products: () => crop("icons/nav-products.png", 18, 17, [162.23, 171.78, -31.18, -43.15]),
    channels: () => crop("icons/channels.png", 17, 17, [168.1, 163.92, -33.65, -32.68]),
    youtube: (s = 1) => crop("icons/youtube.png", 19 * s, 13 * s, [129.63, 183.18, -14.95, -41.5]),
    download: () => `<span class="ci-dlic"></span>`,
    tiktok: (s = 14) => `<img src="${A}icons/tiktok.png" alt="" style="width:${s}px;height:${s}px;object-fit:cover">`,
    instagram: (s = 17) => `<img src="${A}icons/instagram.png" alt="" style="width:${s}px;height:${s}px;object-fit:cover">`,
    web: (c = "#07070b") => mask("monitor", 14, 14, c),
    email: (c = "#121419") => mask("email", 16.37, 11.95, c),
  };

  const THUMBS = {
    headphones: `<img src="${A}images/headphones-bg.png" alt=""><img src="${A}images/headphones.png" alt="">`,
    mountain: `<img src="${A}images/mountain-bg.png" alt=""><img src="${A}images/mountain.png" alt="">`,
    hero: `<img src="${A}images/nova-hero.png" alt="">`,
  };
  ["poster", "waves", "youtube", "hear", "silk", "commute", "creator", "pedestal"].forEach((k) => (THUMBS[k] = `<img src="${A}images/thumbs/${k}.jpg" alt="" loading="lazy">`));
  const THUMB_MIX = ["headphones", "hear", "mountain", "creator", "hero", "silk", "poster", "commute", "waves", "pedestal", "youtube"];
  function thumb(kind, w, h, extra = "") {
    return `<span class="thumb" style="width:${w}px;height:${h}px;${extra}">${THUMBS[kind]}</span>`;
  }

  function flag(code, cls = "") {
    const img = { us: "flag-us.png", uk: "flag-uk.png", au: "flag-au.png" }[code];
    return `<span class="flag ${code} ${cls}">${img ? `<img src="${A}images/${img}" alt="">` : ""}</span>`;
  }

  function channelIcon(ch) {
    return {
      Web: ICONS.web(),
      Email: ICONS.email(),
      TikTok: ICONS.tiktok(),
      Instagram: ICONS.instagram(15),
      YouTube: ICONS.youtube(),
    }[ch] || "";
  }

  /* ---------------- Shell markup ---------------- */
  function headerHTML() {
    return `
    <header class="topbar">
      <a class="brand" href="readiness.html" aria-label="Adobe GenStudio home">
        <span class="brand-logo"><img src="${A}icons/adobe-logo.png" alt=""></span>
        <span class="brand-name">Adobe GenStudio</span>
      </a>
      <div class="top-actions">
        <button class="top-btn grid" data-action="apps" aria-label="Apps">${ICONS.grid()}</button>
        <button class="top-btn help" data-action="help" aria-label="Help"><span class="help-dot">${mask("help", 21, 19.17)}</span></button>
        <button class="top-btn bell" data-action="notifications" aria-label="Notifications">${ICONS.bell()}<span class="bell-badge"></span></button>
        <button class="top-btn user" data-action="profile" aria-label="Account">
          <span class="avatar-adobe">
            <img src="${A}images/user-bg.png" alt="" style="inset:0;width:100%;height:100%">
            <img src="${A}images/user-avatar.png" alt="" style="width:174.94%;height:137.83%;left:-39.24%;top:-20.8%">
          </span>
        </button>
      </div>
    </header>`;
  }

  function sidebarHTML() {
    return `
    <aside class="sidebar">
      <a class="nav-item is-active" href="readiness.html"><span class="nav-ic" style="width:18px">${ICONS.campaigns()}</span><span class="nav-label">Campaigns</span></a>
      <button class="nav-item" data-soon="Content library" style="width:100%"><span class="nav-ic" style="width:20px"><span class="content-ic"><span></span><span></span><span></span></span></span><span class="nav-label" style="margin-left:16px">Content</span></button>
      <button class="nav-item" data-soon="Create" style="width:100%"><span class="nav-ic">${mask("create", 20, 19.3, "#d9d9d9")}</span><span class="nav-label">Create</span></button>
      <button class="nav-item" data-soon="Activate" style="width:100%"><span class="nav-ic">${ICONS.activate()}</span><span class="nav-label">Activate</span></button>
      <button class="nav-item" data-soon="Insights" style="width:100%"><span class="nav-ic">${ICONS.insights()}</span><span class="nav-label">Insights</span></button>

      <div class="nav-group-bottom">
        <button class="nav-item shared" data-action="toggle-shared" style="width:100%"><span class="nav-ic" style="width:17px"><img src="${A}icons/chevron-down-white.svg" alt="" style="width:17px;height:8px" class="shared-caret"></span><span class="nav-label">Shared</span></button>
        <div class="shared-items">
          <button class="nav-item" data-soon="Brands" style="width:100%"><span class="nav-ic">${ICONS.brands()}</span><span class="nav-label">Brands</span></button>
          <button class="nav-item" data-soon="Personas" style="width:100%"><span class="nav-ic">${ICONS.personas()}</span><span class="nav-label">Personas</span></button>
          <button class="nav-item" data-soon="Products" style="width:100%"><span class="nav-ic">${ICONS.products()}</span><span class="nav-label">Products</span></button>
        </div>
      </div>
      <button class="sidebar-collapse" data-action="collapse" aria-label="Collapse navigation"><img src="${A}icons/collapse.svg" alt=""></button>
    </aside>`;
  }

  function heroHTML() {
    return `
    <nav class="crumbs"><a href="readiness.html">Campaigns　›</a><strong>Project Nova</strong></nav>
    <section class="hero">
      <div class="hero-media">
        <img class="bg" src="${A}images/nova-hero-bg.png" alt="">
        <img class="fg" src="${A}images/nova-hero.png" alt="Nova headphones — A more human sound.">
      </div>
      <div class="hero-body">
        <span class="tag">Global Campaign</span>
        <div class="hero-title"><h1>Project Nova</h1><span class="badge-progress">In progress</span></div>
        <p class="hero-sub">Next-gen audio. A more human sound.</p>
        <div class="hero-meta">
          <span class="meta-item launch">▣　Launch: Oct 2, 2026<span class="late">(in 3 days)</span></span>
          <span class="meta-item markets">${mask("globe", 15, 15)}6 markets</span>
          <span class="meta-item channels">${ICONS.channels()}5 channels</span>
          <span class="meta-item audiences">${mask("audience", 20.41, 14.48)}4 audiences</span>
          <span class="meta-item experiences">${mask("cube", 15.21, 17.05)}360 experiences</span>
        </div>
      </div>
      <div class="hero-actions">
        <span class="updated"><span class="dot green pulse"></span><span data-updated>Last updated 4 min ago</span></span>
        <button class="btn icon-only" data-action="more" aria-label="More actions">•••</button>
        <button class="btn" data-action="share" style="width:63px;padding:0">Share</button>
        <span class="btn btn-dark btn-split">
          <button class="main-part" data-action="edit">Edit campaign</button>
          <span class="divider"></span>
          <button class="caret" data-action="edit-menu" aria-label="Campaign options"><img src="${A}icons/chevron-down-btn.svg" alt=""></button>
        </span>
      </div>
    </section>
    <nav class="tabs" role="tablist">
      ${TABS.map(([id, label]) => `<a class="tab${id === PAGE ? " is-active" : ""}" href="${id}.html" role="tab">${label}</a>`).join("")}
    </nav>`;
  }

  const PAGE = document.body.dataset.page || "readiness";

  function mount() {
    const page = document.getElementById("page");
    const app = document.createElement("div");
    app.className = "app";
    app.innerHTML = headerHTML() + sidebarHTML() + `<main class="main"><div class="main-inner">${heroHTML()}</div></main>`;
    document.body.prepend(app);
    page.classList.add("page");
    app.querySelector(".main-inner").appendChild(page);
    if (localStorage.getItem("nova-nav-collapsed") === "1") document.body.classList.add("nav-collapsed");
    wire(app);
    requestAnimationFrame(() => document.body.classList.add("is-ready"));
  }

  /* ---------------- Utilities ---------------- */
  let openMenuEl = null;
  function closeMenu() {
    if (openMenuEl) {
      openMenuEl._anchor && openMenuEl._anchor.classList.remove("is-open");
      openMenuEl.remove();
      openMenuEl = null;
    }
  }
  function openMenu(anchor, items, opts = {}) {
    if (openMenuEl && openMenuEl._anchor === anchor) return closeMenu();
    closeMenu();
    const m = document.createElement("div");
    m.className = "menu " + (opts.className || "");
    if (typeof items === "string") m.innerHTML = items;
    else
      items.forEach((it) => {
        if (it === "hr") return m.appendChild(document.createElement("hr"));
        const b = document.createElement("button");
        b.innerHTML = it.label;
        if (it.selected) b.classList.add("is-selected");
        if (it.danger) b.classList.add("danger");
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          closeMenu();
          it.onClick && it.onClick();
        });
        m.appendChild(b);
      });
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect();
    const w = m.offsetWidth;
    let left = opts.align === "right" ? r.right - w : r.left;
    left = Math.max(8, Math.min(left, innerWidth - w - 8));
    let top = r.bottom + 6;
    if (top + m.offsetHeight > innerHeight - 8) top = r.top - m.offsetHeight - 6;
    m.style.left = left + "px";
    m.style.top = top + "px";
    m._anchor = anchor;
    anchor.classList.add("is-open");
    openMenuEl = m;
    m.addEventListener("click", (e) => e.stopPropagation());
    return m;
  }
  document.addEventListener("click", closeMenu);
  window.addEventListener("resize", closeMenu);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMenu();
      closeModal();
      closeDrawer();
    }
  });

  let overlayEl = null;
  function openModal({ title, body, foot, wide, onMount }) {
    closeModal();
    overlayEl = document.createElement("div");
    overlayEl.className = "overlay";
    overlayEl.innerHTML = `<div class="modal${wide ? " wide" : ""}" role="dialog" aria-modal="true">
      <div class="modal-head"><h3>${title}</h3><button class="close-x" data-close aria-label="Close">×</button></div>
      <div class="modal-body">${body}</div>
      ${foot ? `<div class="modal-foot">${foot}</div>` : ""}
    </div>`;
    overlayEl.addEventListener("click", (e) => {
      if (e.target === overlayEl || e.target.closest("[data-close]")) closeModal();
    });
    document.body.appendChild(overlayEl);
    onMount && onMount(overlayEl.querySelector(".modal"));
    return overlayEl.querySelector(".modal");
  }
  function closeModal() {
    if (overlayEl) {
      overlayEl.remove();
      overlayEl = null;
    }
  }

  let drawerEls = null;
  function openDrawer({ title, body, foot, onMount }) {
    closeDrawer();
    const ov = document.createElement("div");
    ov.className = "drawer-overlay";
    const d = document.createElement("aside");
    d.className = "drawer";
    d.innerHTML = `<div class="modal-head"><h3>${title}</h3><button class="close-x" data-close aria-label="Close">×</button></div>
      <div class="drawer-body">${body}</div>${foot ? `<div class="modal-foot" style="border-radius:0">${foot}</div>` : ""}`;
    ov.addEventListener("click", closeDrawer);
    d.addEventListener("click", (e) => e.target.closest("[data-close]") && closeDrawer());
    document.body.append(ov, d);
    drawerEls = [ov, d];
    onMount && onMount(d);
    return d;
  }
  function closeDrawer() {
    if (drawerEls) {
      drawerEls.forEach((el) => el.remove());
      drawerEls = null;
    }
  }

  function toast(msg) {
    let wrap = document.querySelector(".toasts");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "toasts";
      document.body.appendChild(wrap);
    }
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `<span class="ok">✓</span><span>${msg}</span>`;
    wrap.appendChild(t);
    setTimeout(() => {
      t.classList.add("out");
      setTimeout(() => t.remove(), 260);
    }, 2600);
  }

  function animateBars(root = document) {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        root.querySelectorAll(".bar > i[data-w]").forEach((i) => (i.style.width = i.dataset.w));
      })
    );
  }

  /* ---------------- Shell interactions ---------------- */
  const NOTIFS = [
    { c: "red", t: "<b>Legal</b> flagged “Save $100” claim for France TikTok", time: "6 min ago" },
    { c: "amber", t: "<b>German copy</b> for Instagram is still missing", time: "22 min ago" },
    { c: "blue", t: "<b>Maya Chen</b> approved 12 UK Email experiences", time: "1 hr ago" },
    { c: "green", t: "Readiness increased to <b>78%</b> (+12% this week)", time: "3 hr ago" },
  ];

  function wire(app) {
    app.addEventListener("click", (e) => {
      const el = e.target.closest("[data-action], [data-soon]");
      if (!el) return;
      e.stopPropagation();
      if (el.dataset.soon) return toast(`${el.dataset.soon} is outside this campaign demo`);
      const a = el.dataset.action;
      if (a === "collapse") {
        document.body.classList.toggle("nav-collapsed");
        localStorage.setItem("nova-nav-collapsed", document.body.classList.contains("nav-collapsed") ? "1" : "0");
      } else if (a === "toggle-shared") {
        const items = app.querySelector(".shared-items");
        const hidden = items.style.display === "none";
        items.style.display = hidden ? "" : "none";
        app.querySelector(".shared-caret").style.transform = hidden ? "" : "rotate(-90deg)";
        app.querySelector(".nav-group-bottom").style.bottom = hidden ? "88px" : "220px";
      } else if (a === "notifications") {
        const m = openMenu(
          el,
          `<div class="notif-head"><strong>Notifications</strong><button data-mark>Mark all as read</button></div>
           ${NOTIFS.map((n) => `<button class="notif-item"><span class="dot ${n.c} sm"></span><span><p>${n.t}</p><small>${n.time}</small></span></button>`).join("")}`,
          { align: "right", className: "notif-menu" }
        );
        m && m.querySelector("[data-mark]").addEventListener("click", () => {
          m.querySelectorAll(".notif-item").forEach((i) => i.classList.add("is-read"));
          app.querySelector(".bell-badge").style.display = "none";
        });
      } else if (a === "apps") {
        openMenu(el, [
          { label: "Adobe Express", onClick: () => toast("Opening Adobe Express…") },
          { label: "Adobe Firefly", onClick: () => toast("Opening Adobe Firefly…") },
          { label: "Adobe Experience Manager", onClick: () => toast("Opening AEM Assets…") },
          { label: "Adobe Journey Optimizer", onClick: () => toast("Opening Journey Optimizer…") },
        ], { align: "right" });
      } else if (a === "help") {
        openMenu(el, [
          { label: "What’s new in GenStudio" },
          { label: "Readiness scoring guide" },
          { label: "Keyboard shortcuts" },
          "hr",
          { label: "Contact support", onClick: () => toast("Support request started") },
        ], { align: "right" });
      } else if (a === "profile") {
        openMenu(el, `<div style="padding:10px 10px 8px"><strong style="font-size:13px">Ajith Alphonse</strong><div class="muted" style="font-size:12px;margin-top:2px">Campaign Lead · Adobe</div></div><hr>
          <button>Profile & preferences</button><button>Switch organization</button><hr><button class="danger">Sign out</button>`, { align: "right" });
      } else if (a === "more") {
        openMenu(el, [
          { label: "Duplicate campaign", onClick: () => toast("Project Nova duplicated as a draft") },
          { label: "Export readiness report", onClick: () => toast("Readiness report exported (PDF)") },
          { label: "Copy campaign link", onClick: () => toast("Campaign link copied") },
          "hr",
          { label: "Archive campaign", danger: true, onClick: () => toast("Archive requires owner approval") },
        ], { align: "right" });
      } else if (a === "share") {
        openShare();
      } else if (a === "edit") {
        location.href = "settings.html";
      } else if (a === "edit-menu") {
        openMenu(el.closest(".btn-split"), [
          { label: "Edit details", onClick: () => (location.href = "settings.html") },
          { label: "Manage markets & channels", onClick: () => (location.href = "settings.html#markets") },
          { label: "Change launch date", onClick: () => (location.href = "settings.html") },
          "hr",
          { label: "Pause campaign", onClick: () => toast("Campaign paused — activations on hold") },
        ], { align: "right" });
      }
    });

    let mins = 4;
    setInterval(() => {
      mins++;
      const u = app.querySelector("[data-updated]");
      if (u) u.textContent = `Last updated ${mins} min ago`;
    }, 60000);
  }

  function openShare() {
    openModal({
      title: "Share Project Nova",
      body: `
        <div class="field"><label>Invite people</label>
          <div style="display:flex;gap:8px"><input class="input" placeholder="Name or email" id="share-email"><button class="btn btn-dark" id="share-add" style="height:36px">Invite</button></div>
        </div>
        <div id="share-list" style="display:flex;flex-direction:column;gap:12px;margin-top:4px">
          ${[["AA", "Ajith Alphonse", "Owner", "#121419"], ["MC", "Maya Chen", "Can edit", "#075aff"], ["LR", "Luca Rossi", "Can review", "#8531ff"]]
            .map(([i, n, r, c]) => `<div style="display:flex;align-items:center;gap:12px"><span class="avatar" style="background:${c}">${i}</span><span style="flex:1;color:#121419">${n}</span><span class="muted" style="font-size:12px">${r}</span></div>`)
            .join("")}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding:12px;border:1px solid #eef0f2;border-radius:6px">
          <span><strong style="color:#121419;font-size:13px">Anyone at Adobe with the link</strong><br><span class="muted" style="font-size:12px">Can view readiness</span></span>
          <button class="btn sm" id="copy-link">Copy link</button>
        </div>`,
      onMount(m) {
        m.querySelector("#copy-link").onclick = () => toast("Link copied to clipboard");
        m.querySelector("#share-add").onclick = () => {
          const v = m.querySelector("#share-email").value.trim();
          if (!v) return;
          const ini = v.split(/[ @.]/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("");
          m.querySelector("#share-list").insertAdjacentHTML("beforeend", `<div style="display:flex;align-items:center;gap:12px" class="fade-in"><span class="avatar" style="background:#08b850">${ini}</span><span style="flex:1;color:#121419">${v}</span><span class="muted" style="font-size:12px">Invited</span></div>`);
          m.querySelector("#share-email").value = "";
          toast(`Invite sent to ${v}`);
        };
      },
    });
  }

  window.Nova = { ICONS, crop, mask, thumb, THUMB_MIX, flag, channelIcon, openMenu, closeMenu, openModal, closeModal, openDrawer, closeDrawer, toast, animateBars, PAGE };

  if (document.getElementById("page")) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
