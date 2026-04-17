/**
 * Mintlify loads every .js file in the content repo globally — not via <script> in MDX.
 * See: https://www.mintlify.com/docs/customize/custom-scripts
 */
(function () {
  const endpoint = "https://api-dashboard.zerogpu.ai/api/models";
  const fallbackEndpoint = "/snippets/model-catalog-fallback.json";

  function fmtMoney(value) {
    if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
    return "$" + value.toFixed(2) + " / 1M";
  }

  function textOrNA(value) {
    if (value === null || value === undefined || value === "") return "N/A";
    return String(value);
  }

  function createCell(row, text, code) {
    const cell = document.createElement("td");
    if (code) {
      const codeEl = document.createElement("code");
      codeEl.textContent = text;
      cell.appendChild(codeEl);
    } else {
      cell.textContent = text;
    }
    row.appendChild(cell);
  }

  function createDetails(model) {
    const wrapper = document.createElement("div");
    const heading = document.createElement("h3");
    heading.id = textOrNA(model.modelId)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

    const idCode = document.createElement("code");
    idCode.textContent = textOrNA(model.modelId);
    heading.appendChild(idCode);
    wrapper.appendChild(heading);

    const task = document.createElement("p");
    task.innerHTML =
      "<strong>Task:</strong> " +
      textOrNA(model.taskDisplayName || model.taskType) +
      "  ";
    wrapper.appendChild(task);

    const provider = document.createElement("p");
    provider.innerHTML =
      "<strong>Provider:</strong> " + textOrNA(model.cloudProvider) + "  ";
    wrapper.appendChild(provider);

    const pricing = model.pricing || {};
    const pricingDescription = textOrNA(pricing.description);
    const useCases = Array.isArray(pricing.use_cases)
      ? pricing.use_cases.filter(Boolean)
      : [];

    const bestFor = document.createElement("p");
    bestFor.innerHTML = "<strong>Best for:</strong> " + pricingDescription;
    wrapper.appendChild(bestFor);

    const specs = document.createElement("p");
    specs.innerHTML =
      "<strong>Specs:</strong> " +
      "<code>Version: " +
      textOrNA(model.modelVersion) +
      "</code> · " +
      "<code>Max tokens: " +
      textOrNA(model.maxTokens) +
      "</code> · " +
      "<code>Type: " +
      textOrNA(model.modelType) +
      "</code>";
    wrapper.appendChild(specs);

    const prices = document.createElement("p");
    prices.innerHTML =
      "<strong>Pricing:</strong> " +
      "<code>" +
      fmtMoney(pricing.input_per_1m_tokens) +
      " input</code> · " +
      "<code>" +
      fmtMoney(pricing.output_per_1m_tokens) +
      " output</code> · " +
      "<code>" +
      fmtMoney(pricing.total_per_1m_tokens) +
      " total</code>";
    wrapper.appendChild(prices);

    if (useCases.length > 0) {
      const useCasesP = document.createElement("p");
      useCasesP.innerHTML =
        "<strong>Use cases:</strong> " + useCases.join(", ");
      wrapper.appendChild(useCasesP);
    }

    return wrapper;
  }

  function fetchJson(url) {
    return fetch(url, { method: "GET" }).then(function (response) {
      if (!response.ok) {
        throw new Error("Request failed with status " + response.status);
      }
      return response.json();
    });
  }

  function parsePayload(payload) {
    if (
      !payload ||
      payload.success !== true ||
      !Array.isArray(payload.models)
    ) {
      throw new Error("Unexpected API response format");
    }
    return payload.models;
  }

  function tryInitModelCatalog() {
    var statusEl = document.getElementById("model-catalog-status");
    if (!statusEl || statusEl.getAttribute("data-zerogpu-catalog-init") === "1") {
      return;
    }
    var tableEl = document.getElementById("model-catalog-table");
    var cardsEl = document.getElementById("model-catalog-cards");
    if (!tableEl || !cardsEl) return;

    statusEl.setAttribute("data-zerogpu-catalog-init", "1");

    function renderCatalog(models) {
      tableEl.innerHTML = "";
      cardsEl.innerHTML = "";

      if (!Array.isArray(models) || models.length === 0) {
        statusEl.textContent = "No models available right now.";
        return;
      }

      var visibleModels = models
        .filter(function (model) {
          // The API may omit `display`; default to visible unless explicitly false.
          return model && model.display !== false;
        })
        .sort(function (a, b) {
          var aPriority =
            typeof a.displayPriority === "number" ? a.displayPriority : -Infinity;
          var bPriority =
            typeof b.displayPriority === "number" ? b.displayPriority : -Infinity;
          if (aPriority !== bPriority) {
            // Higher priority appears first.
            return bPriority - aPriority;
          }
          return String(a.modelId).localeCompare(String(b.modelId));
        });

      if (visibleModels.length === 0) {
        statusEl.textContent = "No models available right now.";
        return;
      }

      statusEl.textContent =
        "Loaded " +
        visibleModels.length +
        " model" +
        (visibleModels.length === 1 ? "" : "s") +
        ".";

      var table = document.createElement("table");
      table.innerHTML =
        "<thead>" +
        "<tr>" +
        "<th>Model ID</th>" +
        "<th>Task</th>" +
        "<th>Version</th>" +
        "<th>Max Tokens</th>" +
        "<th>Type</th>" +
        "<th>Input</th>" +
        "<th>Output</th>" +
        "</tr>" +
        "</thead>";

      var tbody = document.createElement("tbody");
      visibleModels.forEach(function (model) {
        var row = document.createElement("tr");
        createCell(row, textOrNA(model.modelId), true);
        createCell(row, textOrNA(model.taskDisplayName || model.taskType));
        createCell(row, textOrNA(model.modelVersion));
        createCell(row, textOrNA(model.maxTokens));
        createCell(row, textOrNA(model.modelType));

        var p = model.pricing || {};
        createCell(row, fmtMoney(p.input_per_1m_tokens));
        createCell(row, fmtMoney(p.output_per_1m_tokens));
        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      tableEl.appendChild(table);

      visibleModels.forEach(function (model) {
        cardsEl.appendChild(createDetails(model));
      });
    }

    fetchJson(endpoint)
      .then(function (payload) {
        renderCatalog(parsePayload(payload));
      })
      .catch(function () {
        return fetchJson(fallbackEndpoint)
          .then(function (payload) {
            renderCatalog(parsePayload(payload));
            statusEl.textContent =
              statusEl.textContent + " (using local fallback snapshot)";
          })
          .catch(function (fallbackError) {
            statusEl.textContent =
              "Unable to load models right now. " + fallbackError.message;
          });
      });
  }

  function schedule() {
    tryInitModelCatalog();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule);
  } else {
    schedule();
  }

  var observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
