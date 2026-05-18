# Social promotion — data extraction tutorial

Link hub: **https://docs.zerogpu.ai/cookbook/data-extraction-tutorial**  
Recipe: **https://docs.zerogpu.ai/cookbook/data-extraction**  
Dataset: **https://github.com/zerogpu/docs/tree/main/tutorials/data-extraction/dataset**

---

## Launch post (X / Twitter)

**Main**

> New tutorial: turn résumés and LinkedIn-style text into structured JSON with ZeroGPU.
>
> - Schema-driven fields (name, role, skills)
> - Synthetic dataset + batch script
> - Text only — no OCR
>
> Cookbook + video walkthrough ↓
> https://docs.zerogpu.ai/cookbook/data-extraction-tutorial

**Thread (optional)**

1. Problem: ATS paste and scraper exports are text, your DB wants columns. Regex does not scale.
2. Solution: `gliner2-base-v1` + `metadata.usecase: json` + a schema you define.
3. Example schemas for `candidate` (résumé) and `profile` (LinkedIn text) in the repo.
4. Bonus: `ner` for skills on job posts; `gliner-multi-pii-v1` for PII spans.
5. Run six synthetic résumés locally: `run_batch_extraction.py` — keys from dashboard.
6. Full recipe: https://docs.zerogpu.ai/cookbook/data-extraction

**Hashtags (pick 2–3)**  
`#DataExtraction` `#NLU` `#RecruitingTech` `#APIDesign` `#ZeroGPU`

---

## LinkedIn

**Post**

We published a hands-on data extraction tutorial for ZeroGPU—focused on workflows teams actually run:

→ Parsing plain-text résumés into candidate records  
→ Structuring LinkedIn-style profile text from scrapers  
→ Tagging skills in job posts with NER  

What we deliberately excluded: OCR and image pipelines. If you already have text, you can ship in an afternoon.

Includes:
• Step-by-step docs tutorial  
• Blog walkthrough  
• Video script / demo flow  
• Synthetic dataset (JSONL) + Python batch runner  

Start here: https://docs.zerogpu.ai/cookbook/data-extraction-tutorial

If you are building recruiting, RevOps, or enrichment tools, I would love to hear which fields you put in your schema first.

---

## Discord announcement (#announcements or #cookbook)

**Title:** Tutorial: Text → JSON extraction (résumés & profiles)

We added a recipe-style tutorial for data extraction:

- Docs walkthrough: `/cookbook/data-extraction-tutorial`
- Original recipe: `/cookbook/data-extraction`
- Example dataset + batch script in `github.com/zerogpu/docs` → `tutorials/data-extraction/`

Use cases: résumé parsing, LinkedIn text, job-post NER. Text only—no OCR in v1.

Video coming to YouTube—script is in the repo if you want to preview the flow.

---

## YouTube description (paste under video)

Learn how to extract structured JSON from résumés and LinkedIn-style profile text using the ZeroGPU API—no OCR required.

🔗 Tutorial: https://docs.zerogpu.ai/cookbook/data-extraction-tutorial  
🔗 Cookbook: https://docs.zerogpu.ai/cookbook/data-extraction  
🔗 Dataset: https://github.com/zerogpu/docs/tree/main/tutorials/data-extraction/dataset  
🔗 Dashboard: https://zerogpu.ai  

Model: `gliner2-base-v1` (schema + NER)  
PII: `gliner-multi-pii-v1`  

Timestamps:
0:00 Intro  
0:35 Setup  
1:00 Résumé extraction  
2:45 Profile text  
4:00 Job post NER  
4:45 Batch dataset  
5:30 Wrap-up  

---

## Email / newsletter blurb (short)

**Subject:** New tutorial — résumé & profile text → JSON

We released a text-only extraction tutorial: define a schema, send plain text to the ZeroGPU API, get JSON back. Includes a synthetic dataset and batch script. [Read the tutorial →](https://docs.zerogpu.ai/cookbook/data-extraction-tutorial)
