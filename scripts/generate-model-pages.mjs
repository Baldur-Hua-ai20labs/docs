#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const MODELS_ENDPOINT = "https://api-dashboard.zerogpu.ai/api/models";
const projectRoot = process.cwd();
const docsRoot = path.join(projectRoot);
const modelsDir = path.join(docsRoot, "models");
const fallbackPath = path.join(docsRoot, "snippets", "model-catalog-fallback.json");

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function textOrNA(value) {
  if (value === null || value === undefined || value === "") return "N/A";
  return String(value);
}

function fmtMoney(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return `$${value.toFixed(2)} / 1M`;
}

function escapeMdxInline(value) {
  return textOrNA(value).replace(/\|/g, "\\|");
}

function buildMdx(model) {
  const pricing = model.pricing || {};
  const modelId = textOrNA(model.modelId);
  const title = textOrNA(model.modelDisplayName || modelId);
  const description = textOrNA(pricing.description);
  const task = textOrNA(model.taskDisplayName || model.taskType);
  const modelType = textOrNA(model.modelType);
  const parameters = textOrNA(model.parameters);
  const version = textOrNA(model.modelVersion);
  const maxTokens = textOrNA(model.maxTokens);
  const provider = textOrNA(model.cloudProvider || "N/A");
  const inputPrice = fmtMoney(pricing.input_per_1m_tokens);
  const outputPrice = fmtMoney(pricing.output_per_1m_tokens);
  const sampleFromUseCases =
    model.modelUsecases && typeof model.modelUsecases === "object"
      ? Object.values(model.modelUsecases)
          .map((entry) => entry && entry.sample_responses_body)
          .find(Boolean)
      : null;
  const defaultSample = {
    text: { format: { type: "text" } },
    input: [{ role: "user", content: "Your input text here..." }],
    model: modelId,
  };
  const sampleRequestBody =
    pricing.sample_responses_body || sampleFromUseCases || defaultSample;
  const normalizedSampleBody =
    sampleRequestBody && typeof sampleRequestBody === "object"
      ? { ...sampleRequestBody, model: modelId }
      : defaultSample;
  const sampleJson = JSON.stringify(normalizedSampleBody, null, 2);
  const curlDataJson = sampleJson.replace(/'/g, "'\"'\"'");

  const references = [];
  if (pricing.model_doc_url) references.push(`[Model docs](${pricing.model_doc_url})`);
  if (pricing.terms_url) references.push(`[Terms](${pricing.terms_url})`);
  if (pricing.privacy_service) references.push(`[Privacy](${pricing.privacy_service})`);
  const referencesLine = references.length > 0 ? references.join(" • ") : "N/A";

  return `---
title: "${title.replace(/"/g, '\\"')}"
description: "Model details for ${modelId.replace(/"/g, '\\"')}."
---

> ${escapeMdxInline(description)}

**References:** ${referencesLine}

## Specifications

| Property | Value |
| --- | --- |
| Model ID | \`${escapeMdxInline(modelId)}\` |
| Task | ${escapeMdxInline(task)} |
| Type | \`${escapeMdxInline(modelType)}\` |
| Parameters | ${escapeMdxInline(parameters)} |
| Version | ${escapeMdxInline(version)} |
| Max Tokens | ${escapeMdxInline(maxTokens)} |
| Provider | ${escapeMdxInline(provider)} |
| Input Price | ${escapeMdxInline(inputPrice)} |
| Output Price | ${escapeMdxInline(outputPrice)} |

## Quick Start

Use this model with the ZeroGPU Responses API endpoint:

### Request Body (JSON)

\`\`\`json
${sampleJson}
\`\`\`

### Code Snippet

\`\`\`bash
curl --location 'https://api.zerogpu.ai/v1/responses' \\
  --header 'content-type: application/json' \\
  --header 'x-api-key: YOUR_API_KEY' \\
  --header 'x-project-id: YOUR_PROJECT_ID' \\
  --data '${curlDataJson}'
\`\`\`
`;
}

async function fetchModels() {
  try {
    const response = await fetch(MODELS_ENDPOINT, {
      headers: { accept: "application/json", "user-agent": "zerogpu-docs-generator" },
    });
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const payload = await response.json();
    if (!payload || payload.success !== true || !Array.isArray(payload.models)) {
      throw new Error("Unexpected API response shape");
    }
    return payload.models;
  } catch (error) {
    const fallbackRaw = await readFile(fallbackPath, "utf8");
    const fallbackPayload = JSON.parse(fallbackRaw);
    if (
      !fallbackPayload ||
      fallbackPayload.success !== true ||
      !Array.isArray(fallbackPayload.models)
    ) {
      throw new Error(
        `Could not fetch API or parse fallback payload: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    return fallbackPayload.models;
  }
}

async function main() {
  await mkdir(modelsDir, { recursive: true });
  const models = await fetchModels();
  const visibleModels = models.filter((model) => model && model.display !== false);

  let written = 0;
  for (const model of visibleModels) {
    const fileName = `${slugify(model.modelId)}.mdx`;
    const targetPath = path.join(modelsDir, fileName);
    const content = buildMdx(model);
    await writeFile(targetPath, content, "utf8");
    written += 1;
  }

  process.stdout.write(`Generated ${written} model page(s) in docs/models.\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
