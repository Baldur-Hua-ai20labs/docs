// Global custom script (Mintlify injects every .js in the content dir on every
// page as a <script> tag). It fetches the ZeroGPU model catalog ONCE on app
// load and caches it on `window.__zgpuModels`.
//
// Caching behavior this gives us for free:
// - Runs once per full page load (hard load / refresh).
// - Does NOT re-run on client-side (SPA) navigation, so every page reuses the
//   same cached data with no refetch.
// - A hard refresh reloads the document and re-runs this script -> one fresh
//   fetch. That is the intended "refetch on refresh, reuse on navigation".
//
// Shape of the cache:
//   window.__zgpuModels = { data: <models[]|null>, promise: <Promise> }
// Consumers (see docs/model-catalog.mdx) read `.data` immediately if present,
// otherwise await `.promise`, otherwise listen for the "zgpu:models-loaded"
// event in case they mounted before this script created the store.

(function () {
  if (typeof window === "undefined") return;

  var ZGPU_MODELS_URL = "https://api-dashboard.zerogpu.ai/api/models";

  var store = window.__zgpuModels || (window.__zgpuModels = {});

  // Already fetched (or fetching) this page load -> nothing to do.
  if (store.data || store.promise) return;

  // Build the "model library by task" grouping: models grouped by task, plus a
  // curated "Ad Tech" group, ordered to match the docs Models nav. Returns an
  // ordered array of { task, models } so consumers just map over it.
  function buildByTask(models) {
    var AD_TECH_MODELS = [
      "zlm-v1-iab-classify-edge",
      "zlm-v1-iab-classify-edge-enriched",
    ];
    var TASK_ORDER = [
      "Ad Tech",
      "Text Classification",
      "Text Generation",
      "PII",
      "Summarization",
    ];
    var order = [];
    var byTask = {};
    models.forEach(function (m) {
      if (!byTask[m.taskDisplayName]) {
        byTask[m.taskDisplayName] = [];
        order.push(m.taskDisplayName);
      }
      byTask[m.taskDisplayName].push(m);
    });
    var adTech = AD_TECH_MODELS.map(function (id) {
      return models.find(function (m) {
        return m.modelId === id;
      });
    }).filter(Boolean);
    if (adTech.length) {
      byTask["Ad Tech"] = adTech;
      order.push("Ad Tech");
    }
    order.sort(function (a, b) {
      var ia = TASK_ORDER.indexOf(a);
      var ib = TASK_ORDER.indexOf(b);
      return (
        (ia === -1 ? TASK_ORDER.length : ia) -
        (ib === -1 ? TASK_ORDER.length : ib)
      );
    });
    return order.map(function (t) {
      return { task: t, models: byTask[t] };
    });
  }

  store.promise = fetch(ZGPU_MODELS_URL)
    .then(function (r) {
      return r.json();
    })
    .then(function (d) {
      var models = d && d.models && d.models.length ? d.models : null;
      // Sort by display priority (desc) here so every consumer gets the data
      // already ordered and doesn't need to re-sort.
      store.data = models
        ? models.slice().sort(function (a, b) {
            return (b.displayPriority || 0) - (a.displayPriority || 0);
          })
        : null;
      // Prebuild the "library by task" grouping so pages don't have to.
      store.byTask = store.data ? buildByTask(store.data) : null;
      // Notify any component that mounted before the fetch resolved.
      window.dispatchEvent(new CustomEvent("zgpu:models-loaded"));
      return store.data;
    })
    .catch(function () {
      // Leave store.data null so consumers fall back to their seed snapshot,
      // and clear the promise so a later mount can retry.
      store.promise = null;
      return null;
    });
})();
