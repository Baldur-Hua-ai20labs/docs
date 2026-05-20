/**
 * Mintlify loads every .js file in the repo globally.
 * Enlarges API playground textareas for `input` and chat `content` fields.
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

  function normalizeParamName(text) {
    if (!text) return null;
    var t = String(text).trim().toLowerCase();
    if (t === "input" || t === "content") return t;
    var match = t.match(/^(input|content)\b/);
    return match ? match[1] : null;
  }

  function findParamName(textarea) {
    var el = textarea.parentElement;
    for (var depth = 0; depth < 14 && el; depth += 1, el = el.parentElement) {
      var candidates = el.querySelectorAll(
        "label, span, p, h3, h4, h5, [data-param-name], [data-property-name]"
      );
      for (var i = 0; i < candidates.length; i += 1) {
        var node = candidates[i];
        var attr =
          node.getAttribute("data-param-name") || node.getAttribute("data-property-name");
        if (attr && LONG_TEXT_PARAMS[attr.toLowerCase()]) return attr.toLowerCase();

        var name = normalizeParamName(node.textContent);
        if (name) return name;
      }
    }
    return null;
  }

  function enhanceTextarea(textarea) {
    if (textarea.getAttribute("data-zgpu-enhanced") === "1") return;
    var param = findParamName(textarea);
    if (!param || !LONG_TEXT_PARAMS[param]) return;

    textarea.setAttribute("data-zgpu-enhanced", "1");
    textarea.setAttribute("data-zgpu-playground-longtext", "1");
    textarea.rows = 14;
    textarea.wrap = "soft";
    textarea.style.minHeight = "280px";
    textarea.style.resize = "vertical";
  }

  function scan(root) {
    root = root || document;
    var areas = root.querySelectorAll("textarea");
    for (var i = 0; i < areas.length; i += 1) enhanceTextarea(areas[i]);
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
