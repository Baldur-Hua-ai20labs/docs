/**
 * Mintlify loads every .js file in the repo globally.
 * Mintlify often renders `input` as a single-line <input> despite format: textarea.
 * This script replaces it with a tall <textarea> (like the metadata JSON editor area).
 */
(function () {
  var STYLE_ID = "zgpu-playground-input-css";
  var STYLE_HREF = "/style.css";
  var LONG_TEXT_PARAMS = { input: true, content: true };

  function injectStylesheet() {
    if (document.getElementById(STYLE_ID)) return;
    var link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = STYLE_HREF;
    document.head.appendChild(link);
  }

  function isParamLabel(el) {
    if (!el || el.children.length > 0) return false;
    var t = (el.textContent || "").trim().toLowerCase();
    return t === "input" || t === "content";
  }

  function findParamNameFromLabelWalk(start) {
    var node = start;
    for (var depth = 0; depth < 16 && node; depth += 1, node = node.parentElement) {
      var labels = node.querySelectorAll("label, span, p, h4, h5, div");
      for (var i = 0; i < labels.length; i += 1) {
        if (!isParamLabel(labels[i])) continue;
        return labels[i].textContent.trim().toLowerCase();
      }
    }
    return null;
  }

  function findFieldContainer(control) {
    var node = control.parentElement;
    for (var depth = 0; depth < 12 && node; depth += 1, node = node.parentElement) {
      if (node.querySelector("input, textarea, [contenteditable='true']") === control) {
        return node;
      }
    }
    return control.parentElement;
  }

  function syncHiddenInput(hidden, visible) {
    hidden.value = visible.value;
    hidden.dispatchEvent(new Event("input", { bubbles: true }));
    hidden.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function attachMirror(hidden, visible) {
    visible.addEventListener("input", function () {
      syncHiddenInput(hidden, visible);
    });

    var last = visible.value;
    setInterval(function () {
      if (hidden.value !== last) {
        last = hidden.value;
        visible.value = hidden.value;
      }
    }, 400);
  }

  function replaceTextInputWithTextarea(input) {
    if (input.getAttribute("data-zgpu-replaced") === "1") return;

    var param = findParamNameFromLabelWalk(input);
    if (!param || !LONG_TEXT_PARAMS[param]) return;

    var container = findFieldContainer(input);
    var wrap = document.createElement("div");
    wrap.className = "zgpu-longtext-field";

    var ta = document.createElement("textarea");
    ta.className = "zgpu-longtext-editor";
    ta.setAttribute("data-zgpu-playground-longtext", "1");
    ta.setAttribute("data-zgpu-enhanced", "1");
    ta.setAttribute("aria-label", param);
    ta.value = input.value || "";
    ta.rows = 16;
    ta.wrap = "soft";
    ta.spellcheck = false;

    input.setAttribute("data-zgpu-replaced", "1");
    input.setAttribute("data-zgpu-hidden-input", "1");
    input.style.position = "absolute";
    input.style.width = "1px";
    input.style.height = "1px";
    input.style.opacity = "0";
    input.style.pointerEvents = "none";
    input.tabIndex = -1;

    wrap.appendChild(ta);
    container.appendChild(wrap);
    attachMirror(input, ta);
  }

  function replaceContentEditableWithTextarea(editable) {
    if (editable.getAttribute("data-zgpu-replaced") === "1") return;

    var param = findParamNameFromLabelWalk(editable);
    if (!param || !LONG_TEXT_PARAMS[param]) return;

    var container = findFieldContainer(editable);
    var wrap = document.createElement("div");
    wrap.className = "zgpu-longtext-field";

    var ta = document.createElement("textarea");
    ta.className = "zgpu-longtext-editor";
    ta.setAttribute("data-zgpu-playground-longtext", "1");
    ta.setAttribute("data-zgpu-enhanced", "1");
    ta.setAttribute("aria-label", param);
    ta.value = (editable.textContent || "").trim();
    ta.rows = 16;
    ta.wrap = "soft";
    ta.spellcheck = false;

    editable.setAttribute("data-zgpu-replaced", "1");
    editable.style.display = "none";

    wrap.appendChild(ta);
    container.appendChild(wrap);

    function pushToEditable() {
      editable.textContent = ta.value;
      editable.dispatchEvent(new Event("input", { bubbles: true }));
      editable.dispatchEvent(new Event("change", { bubbles: true }));
    }

    ta.addEventListener("input", pushToEditable);

    var last = ta.value;
    setInterval(function () {
      var next = (editable.textContent || "").trim();
      if (next !== last) {
        last = next;
        ta.value = next;
      }
    }, 400);
  }

  function enhanceTextarea(ta) {
    if (ta.getAttribute("data-zgpu-enhanced") === "1") return;
    if (ta.getAttribute("data-zgpu-hidden-input") === "1") return;

    var param = findParamNameFromLabelWalk(ta);
    if (!param || !LONG_TEXT_PARAMS[param]) return;

    var container = findFieldContainer(ta);
    container.classList.add("zgpu-longtext-field-host");

    ta.setAttribute("data-zgpu-enhanced", "1");
    ta.setAttribute("data-zgpu-playground-longtext", "1");
    ta.classList.add("zgpu-longtext-editor");
    ta.rows = Math.max(ta.rows || 0, 16);
    ta.wrap = "soft";
    ta.style.minHeight = "320px";
    ta.style.resize = "vertical";
    ta.style.width = "100%";
  }

  function scan(root) {
    root = root || document;

    var inputs = root.querySelectorAll('input[type="text"]');
    for (var i = 0; i < inputs.length; i += 1) {
      replaceTextInputWithTextarea(inputs[i]);
    }

    var areas = root.querySelectorAll("textarea");
    for (var j = 0; j < areas.length; j += 1) {
      enhanceTextarea(areas[j]);
    }

    var editables = root.querySelectorAll("[contenteditable='true']");
    for (var k = 0; k < editables.length; k += 1) {
      replaceContentEditableWithTextarea(editables[k]);
    }
  }

  function init() {
    injectStylesheet();
    scan(document);
    var observer = new MutationObserver(function () {
      scan(document);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
