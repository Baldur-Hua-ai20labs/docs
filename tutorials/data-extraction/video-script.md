# Video script: Data extraction tutorial (~6 minutes)

**Title (YouTube / Loom):** Extract structured data from résumés and LinkedIn text | ZeroGPU tutorial  
**Thumbnail text:** Text → JSON (no OCR)  
**CTA end card:** docs.zerogpu.ai/cookbook/data-extraction-tutorial  

---

## Pre-production

| Item | Notes |
| --- | --- |
| Accounts | ZeroGPU dashboard with API key + project ID |
| Files open | `resumes.jsonl` line 1, `run_batch_extraction.py`, docs recipe |
| Terminal | `ZEROGPU_API_KEY` and `ZEROGPU_PROJECT_ID` exported |
| Browser tabs | Docs tutorial, model playground (`gliner2-base-v1`), dashboard Logs |
| Disclaimer (on-screen, 3s) | Synthetic fictional data only. Text-based extraction—no OCR in this demo. |

---

## Scene 1 — Hook (0:00–0:35)

**Visual:** Split screen—messy résumé text left, clean JSON right.

**VO:**

> If you work with recruiting, sales ops, or data enrichment, you have seen this problem: the information is already in text form, but your database wants columns. Regex breaks every time the layout changes. Today I will show you how to extract structured fields from résumés and LinkedIn-style profile text using ZeroGPU—text only, no OCR.

**On-screen:** Title card + link `docs.zerogpu.ai/cookbook/data-extraction`

---

## Scene 2 — What you need (0:35–1:00)

**Visual:** Dashboard → API keys → project ID.

**VO:**

> You need an API key and project ID from zerogpu.ai, and the model `gliner2-base-v1` for schema extraction. Everything goes through one endpoint: POST `/v1/responses`.

**On-screen bullets:**

- API key + project ID  
- Model: `gliner2-base-v1`  
- Input: plain text string  

---

## Scene 3 — Résumé extraction live (1:00–2:45)

**Visual:** Docs playground OR terminal with curl from cookbook.

**VO:**

> First use case: résumé parsing. We define a schema—each field is `name::type::description`. For example, full name, email, current title, skills. Set `metadata.usecase` to `json` and pass the résumé as `input`.

**Action:** Paste synthetic résumé `resume-001` (Alex Rivera) from dataset.

**VO (while request runs):**

> The model returns JSON inside the standard response envelope. We parse `output[0].content[0].text`—that is our candidate object ready for an ATS or warehouse.

**On-screen:** Highlight parsed JSON fields matching schema.

---

## Scene 4 — LinkedIn-style profile text (2:45–4:00)

**Visual:** Switch schema to `profile` fields; paste `profile-001` text.

**VO:**

> Scrapers do not give you nice tables—they give you headlines, About sections, and experience blocks run together. Same API, different schema: name, headline, location, current role, company. This is the workflow teams use after a compliant text export—still no images, still no OCR.

**On-screen:** Side-by-side raw scrape vs extracted `profile` JSON.

---

## Scene 5 — Skills from job posts (NER) (4:00–4:45)

**Visual:** Terminal or code—`usecase: ner` with labels.

**VO:**

> When you do not want fixed columns, use named-entity mode: pass labels like programming language, database, cloud platform. Helpful for tagging job posts before search or matching.

**Action:** Quick call with `job-001` text; show spans/labels in response.

---

## Scene 6 — Batch dataset + PII note (4:45–5:30)

**Visual:** Run `python run_batch_extraction.py --dataset resumes --limit 3`

**VO:**

> We published a synthetic dataset and a batch script in the docs repo—six résumés, six profiles, four job posts—all fictional, safe to demo. For user-submitted content, use `gliner-multi-pii-v1` with extract-pii or redact—linked in the cookbook.

**On-screen:** GitHub path `zerogpu/docs/tutorials/data-extraction`

---

## Scene 7 — Close (5:30–6:00)

**Visual:** Docs tutorial page + Discord/X.

**VO:**

> Full recipe, schemas, and social-ready examples are on the ZeroGPU docs site. Link in the description. If you build something with this, tag us—we would love to see your schemas.

**End card:**

- Tutorial: docs.zerogpu.ai/cookbook/data-extraction-tutorial  
- Recipe: docs.zerogpu.ai/cookbook/data-extraction  
- Dataset: github.com/zerogpu/docs/tree/main/tutorials/data-extraction/dataset  

---

## B-roll checklist (optional)

- Dashboard usage graph ticking after batch run  
- Logs page showing successful requests  
- Code editor scrolling `schemas/resume.json`  

## Shorts / clips (30–45s each)

1. **Résumé → JSON in 40 seconds** — hook + one API call + result  
2. **LinkedIn text is not a spreadsheet** — scraper text → profile schema  
3. **No OCR** — explicit text-only boundary for comments/questions  
