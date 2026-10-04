/* Sample campaign data shared by all screens (matches the Figma readiness frame) */
window.NovaData = {
  channels: ["Web", "Email", "TikTok", "Instagram", "YouTube"],
  markets: [
    { code: "us", name: "US", full: "United States", cells: [[58, "ready"], [59, "ready"], [58, "ready"], [57, "ready"], [56, "ready"]] },
    { code: "uk", name: "UK", full: "United Kingdom", cells: [[54, "ready"], [52, "risk"], [50, "ready"], [54, "ready"], [52, "ready"]] },
    { code: "fr", name: "France", full: "France", cells: [[48, "risk"], [46, "risk"], [32, "blocked"], [44, "risk"], [44, "risk"]] },
    { code: "de", name: "Germany", full: "Germany", cells: [[50, "ready"], [48, "ready"], [42, "risk"], [46, "risk"], [44, "risk"]] },
    { code: "jp", name: "Japan", full: "Japan", cells: [[52, "ready"], [50, "ready"], [48, "ready"], [50, "ready"], [48, "ready"]] },
    { code: "au", name: "Australia", full: "Australia", cells: [[54, "ready"], [52, "ready"], [50, "ready"], [50, "ready"], [52, "ready"]] },
  ],
  statusLabel: { ready: "Ready", risk: "At risk", blocked: "Blocked" },
  statusDot: { ready: "green", risk: "amber", blocked: "red" },

  people: [
    { i: "AA", name: "Ajith Alphonse", email: "ajith@adobe.com", role: "Campaign lead", team: "Brand Marketing", markets: "All markets", c: "#121419", online: true, owner: true },
    { i: "MC", name: "Maya Chen", email: "maya.chen@adobe.com", role: "Approver", team: "Legal & Compliance", markets: "US, UK", c: "#075aff", online: true },
    { i: "LR", name: "Luca Rossi", email: "luca.rossi@adobe.com", role: "Reviewer", team: "Creative", markets: "France, Germany", c: "#8531ff", online: false },
    { i: "SK", name: "Sora Kimura", email: "sora.k@adobe.com", role: "Editor", team: "Localization", markets: "Japan", c: "#ff3345", online: true },
    { i: "EW", name: "Emma Walsh", email: "emma.walsh@adobe.com", role: "Editor", team: "Content Production", markets: "UK, Australia", c: "#08b850", online: false },
    { i: "JM", name: "Jonas Müller", email: "jonas.m@adobe.com", role: "Reviewer", team: "Localization", markets: "Germany", c: "#ffa000", online: true },
    { i: "CD", name: "Camille Dubois", email: "camille.d@adobe.com", role: "Approver", team: "Regional Marketing", markets: "France", c: "#004eff", online: false },
    { i: "OB", name: "Olivia Brooks", email: "olivia.b@adobe.com", role: "Viewer", team: "Media Planning", markets: "Australia", c: "#596174", online: false },
  ],
};
