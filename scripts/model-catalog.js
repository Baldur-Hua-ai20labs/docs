(() => {
  const endpoint = "https://api-dashboard.zerogpu.ai/api/models";
  const fallbackEndpoint = "/snippets/model-catalog-fallback.json";
  const statusEl = document.getElementById("model-catalog-status");
  const tableEl = document.getElementById("model-catalog-table");
  const cardsEl = document.getElementById("model-catalog-cards");

  if (!statusEl || !tableEl || !cardsEl) return;

  const fmtMoney = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
    return "$" + value.toFixed(2) + " / 1M";
  };

  const textOrNA = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";
    return String(value);
  };

  const createCell = (row, text, code) => {
    const cell = document.createElement("td");
    if (code) {
      const codeEl = document.createElement("code");
      codeEl.textContent = text;
      cell.appendChild(codeEl);
    } else {
      cell.textContent = text;
    }
    row.appendChild(cell);
  };

  const createDetails = (model) => {
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
    bestFor.innerHTML =
      "<strong>Best for:</strong> " + pricingDescription;
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
  };

  const renderCatalog = (models) => {
    if (!Array.isArray(models) || models.length === 0) {
      statusEl.textContent = "No models available right now.";
      return;
    }

    const visibleModels = models
      .filter((model) => model && model.display === true)
      .sort((a, b) => String(a.modelId).localeCompare(String(b.modelId)));

    if (visibleModels.length === 0) {
      statusEl.textContent = "No models marked for display.";
      return;
    }

    statusEl.textContent =
      "Loaded " +
      visibleModels.length +
      " model" +
      (visibleModels.length === 1 ? "" : "s") +
      ".";

    const table = document.createElement("table");
    table.innerHTML =
      "<thead>" +
      "<tr>" +
      "<th>Model ID</th>" +
      "<th>Task</th>" +
      "<th>Provider</th>" +
      "<th>Version</th>" +
      "<th>Max Tokens</th>" +
      "<th>Type</th>" +
      "<th>Input</th>" +
      "<th>Output</th>" +
      "<th>Total</th>" +
      "</tr>" +
      "</thead>";

    const tbody = document.createElement("tbody");
    visibleModels.forEach((model) => {
      const row = document.createElement("tr");
      createCell(row, textOrNA(model.modelId), true);
      createCell(row, textOrNA(model.taskDisplayName || model.taskType));
      createCell(row, textOrNA(model.cloudProvider));
      createCell(row, textOrNA(model.modelVersion));
      createCell(row, textOrNA(model.maxTokens));
      createCell(row, textOrNA(model.modelType));

      const p = model.pricing || {};
      createCell(row, fmtMoney(p.input_per_1m_tokens));
      createCell(row, fmtMoney(p.output_per_1m_tokens));
      createCell(row, fmtMoney(p.total_per_1m_tokens));
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableEl.appendChild(table);

    visibleModels.forEach((model) => {
      cardsEl.appendChild(createDetails(model));
    });
  };

  const fetchJson = (url) =>
    fetch(url, { method: "GET" }).then((response) => {
      if (!response.ok) {
        throw new Error("Request failed with status " + response.status);
      }
      return response.json();
    });

  const parsePayload = (payload) => {
    if (!payload || payload.success !== true || !Array.isArray(payload.models)) {
      throw new Error("Unexpected API response format");
    }
    return payload.models;
  };

  fetchJson(endpoint)
    .then((response) => {
      const models = parsePayload(response);
      renderCatalog(models);
    })
    .catch(() => {
      // Local dev often hits CORS on this API; use local snapshot as fallback.
      return fetchJson(fallbackEndpoint)
        .then((response) => {
          const models = parsePayload(response);
          renderCatalog(models);
          statusEl.textContent =
            statusEl.textContent + " (using local fallback snapshot)";
        })
        .catch((fallbackError) => {
          statusEl.textContent =
            "Unable to load models right now. " + fallbackError.message;
        });
    });
})();
