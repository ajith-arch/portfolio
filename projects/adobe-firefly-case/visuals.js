(function () {
  var ASSET = "./assets/";

  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function findByText(selector, needle) {
    var nodes = document.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) {
      if ((nodes[i].textContent || "").replace(/\s+/g, " ").trim().indexOf(needle) !== -1) {
        return nodes[i];
      }
    }
    return null;
  }

  function insertAfter(ref, node) {
    if (!ref || !node) return;
    if (ref.parentNode) ref.parentNode.insertBefore(node, ref.nextSibling);
  }

  function insertBefore(ref, node) {
    if (!ref || !node) return;
    if (ref.parentNode) ref.parentNode.insertBefore(node, ref);
  }

  function figure(src, alt, cap) {
    return (
      '<figure class="ff-vis__block">' +
      '<div class="ff-vis__frame"><img src="' + ASSET + src + '" alt="' + alt + '" loading="lazy" decoding="async"></div>' +
      (cap ? '<figcaption class="ff-vis__cap">' + cap + "</figcaption>" : "") +
      "</figure>"
    );
  }

  function injectWorkLink() {
    if (document.querySelector(".ff-work-link")) return;
    var header = document.querySelector("header");
    if (!header) return;
    var link = el('<a class="ff-work-link" href="../../index.html#work">← Work</a>');
    header.insertBefore(link, header.firstChild);
  }

  function injectKeepChange() {
    if (document.getElementById("ff-vis-keep")) return;
    var anchor = findByText("h3, h2, p", "I just don't like that part");
    if (!anchor) anchor = findByText("h2, h3", "Problem");
    var block = el(
      '<div id="ff-vis-keep" class="ff-vis">' +
        '<p class="ff-vis__label">Product principle</p>' +
        figure(
          "01-keep-change.webp",
          "Annotated Firefly edit: keep most of the composition, change only the intended region",
          "Keep ~90% · change ~10% — the design principle behind intent-first refinement"
        ) +
      "</div>"
    );
    if (anchor) {
      var section = anchor.closest("section") || anchor.parentElement;
      section.appendChild(block);
    }
  }

  function injectEditFlow() {
    if (document.getElementById("ff-vis-flow")) return;
    var heading = findByText("h3, h2", "Contextual editing flow");
    if (!heading) heading = findByText("h3, h2", "Tell Firefly what to change");
    var steps = [
      ["02-edit-start.webp", "Start with a generation worth keeping", "Subjects, composition, lighting already work."],
      ["03-edit-select.webp", "Point at the part that doesn't", "Region / brush / object marks the target."],
      ["04-edit-prompt.webp", "Attach the instruction to the selection", "Language bound to the marked region."],
      ["05-edit-result.webp", "Review a local change, not a new image", "Composition holds; only the target updates."]
    ];
    var grid = steps
      .map(function (s, i) {
        return (
          '<figure class="ff-vis__step">' +
          '<div class="ff-vis__frame"><img src="' + ASSET + s[0] + '" alt="Step ' + (i + 1) + ": " + s[1] + '" loading="lazy" decoding="async"></div>' +
          "<strong>0" + (i + 1) + " · " + s[1] + "</strong>" +
          "<span>" + s[2] + "</span>" +
          "</figure>"
        );
      })
      .join("");

    var block = el(
      '<div id="ff-vis-flow" class="ff-vis">' +
        '<p class="ff-vis__label">Contextual editing · worked example</p>' +
        '<div class="ff-vis__grid ff-vis__grid--4">' + grid + "</div>" +
        '<p class="ff-vis__cap" style="margin-top:1.25rem">Example: replace the glass and books with a vintage wooden chess clock — surrounding composition stays stable.</p>' +
      "</div>"
    );

    if (heading) {
      var host = heading.closest("div") || heading.parentElement;
      insertAfter(host, block);
    } else {
      var sol = findByText("h2, h3", "The Solution") || findByText("h2, h3", "Solution");
      if (sol) insertAfter(sol.closest("section") || sol, block);
    }
  }

  function injectVariationsHistory() {
    if (document.getElementById("ff-vis-iter")) return;
    var heading = findByText("h3, h2", "Iteration without starting over");
    var block = el(
      '<div id="ff-vis-iter" class="ff-vis">' +
        '<p class="ff-vis__label">Alternatives &amp; history</p>' +
        '<div class="ff-vis__grid ff-vis__grid--2">' +
          '<figure class="ff-vis__block" style="margin:0">' +
            '<div class="ff-vis__frame"><img src="' + ASSET + '06-variations.webp" alt="Localized variation options A B and C for the chess-clock edit" loading="lazy"></div>' +
            '<figcaption class="ff-vis__cap">Inspectable alternatives — decisions, not replacements</figcaption>' +
          "</figure>" +
          '<figure class="ff-vis__block" style="margin:0">' +
            '<div class="ff-vis__frame"><img src="' + ASSET + '07-generation-history.webp" alt="Generation history with instructions attached to each edit step" loading="lazy"></div>' +
            '<figcaption class="ff-vis__cap">Readable history with the instruction on each step</figcaption>' +
          "</figure>" +
        "</div>" +
      "</div>"
    );
    if (heading) {
      var col = heading.closest("div") || heading.parentElement;
      insertAfter(col.parentElement || col, block);
    }
  }

  function injectShipped() {
    if (document.getElementById("ff-vis-shipped")) return;
    var heading = findByText("h3, h2", "The product moved from generation toward control");
    if (!heading) heading = findByText("h2, h3", "Looking back");
    var block = el(
      '<div id="ff-vis-shipped" class="ff-vis">' +
        '<p class="ff-vis__label">Looking back · product direction</p>' +
        '<div class="ff-vis__grid ff-vis__grid--3">' +
          figure("08-current-editor.webp", "Firefly current editor surface", "Editor") +
          figure("09-edit-controls.webp", "Firefly localized edit controls", "Edit controls") +
          figure("10-handoff.webp", "Firefly handoff into broader creative workflow", "Handoff") +
        "</div>" +
        '<p class="ff-vis__cap">Not claiming these shipped because of this exploration — the direction argued here, control after generation, is the direction the product took.</p>' +
      "</div>"
    );
    // unwrap nested figures from figure() helper for grid - simplify
    block = el(
      '<div id="ff-vis-shipped" class="ff-vis">' +
        '<p class="ff-vis__label">Looking back · product direction</p>' +
        '<div class="ff-vis__grid ff-vis__grid--3">' +
          '<figure class="ff-vis__step"><div class="ff-vis__frame"><img src="' + ASSET + '08-current-editor.webp" alt="Firefly current editor" loading="lazy"></div><strong>Editor</strong></figure>' +
          '<figure class="ff-vis__step"><div class="ff-vis__frame"><img src="' + ASSET + '09-edit-controls.webp" alt="Firefly edit controls" loading="lazy"></div><strong>Edit controls</strong></figure>' +
          '<figure class="ff-vis__step"><div class="ff-vis__frame"><img src="' + ASSET + '10-handoff.webp" alt="Firefly creative handoff" loading="lazy"></div><strong>Handoff</strong></figure>' +
        "</div>" +
        '<p class="ff-vis__cap">Directional product movement — control after generation — not a causal claim about shipping.</p>' +
      "</div>"
    );
    if (heading) {
      var section = heading.closest("section") || heading.parentElement;
      section.appendChild(block);
    }
  }

  function injectContactLinks() {
    if (document.querySelector(".ff-contact-row")) return;
    var footer = document.getElementById("contact");
    if (!footer) return;
    var row = el(
      '<div class="ff-contact-row">' +
        '<a class="ff-contact-row__primary" href="mailto:ajithalphonse300@gmail.com">Email</a>' +
        '<a href="https://www.linkedin.com/in/ajith-alphonse/" target="_blank" rel="noopener noreferrer">LinkedIn</a>' +
        '<a href="../../index.html#work">← Work</a>' +
      "</div>"
    );
    var cta = footer.querySelector("a[href^='mailto']");
    if (cta && cta.parentElement) insertAfter(cta.parentElement, row);
    else footer.appendChild(row);
  }

  function run() {
    injectWorkLink();
    injectKeepChange();
    injectEditFlow();
    injectVariationsHistory();
    injectShipped();
    injectContactLinks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(run, 200);
      setTimeout(run, 800);
      setTimeout(run, 1600);
    });
  } else {
    setTimeout(run, 200);
    setTimeout(run, 800);
    setTimeout(run, 1600);
  }

  var obs = new MutationObserver(function () {
    injectWorkLink();
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();
