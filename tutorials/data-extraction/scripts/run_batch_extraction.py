#!/usr/bin/env python3
"""Run ZeroGPU extraction over tutorial JSONL datasets."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

import requests

API_URL = "https://api.zerogpu.ai/v1/responses"
ROOT = Path(__file__).resolve().parents[1]
DATASET_DIR = ROOT / "dataset"
SCHEMA_DIR = ROOT / "schemas"
OUTPUT_DIR = ROOT / "outputs"

DATASETS = {
    "resumes": {
        "file": "resumes.jsonl",
        "model": "gliner2-base-v1",
        "schema_file": "resume.json",
        "usecase": "json",
    },
    "profiles": {
        "file": "profiles.jsonl",
        "model": "gliner2-base-v1",
        "schema_file": "linkedin-profile.json",
        "usecase": "json",
    },
    "job_posts": {
        "file": "job_posts.jsonl",
        "model": "gliner2-base-v1",
        "usecase": "ner",
        "ner_labels": [
            "programming language",
            "database",
            "cloud platform",
            "certification",
            "framework",
        ],
        "threshold": 0.3,
    },
}


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        print(f"Missing environment variable: {name}", file=sys.stderr)
        sys.exit(1)
    return value


def load_jsonl(path: Path) -> list[dict]:
    rows = []
    with path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def load_schema(filename: str) -> dict:
    with (SCHEMA_DIR / filename).open(encoding="utf-8") as f:
        return json.load(f)


def extract_text_from_response(body: dict) -> str:
    return body["output"][0]["content"][0]["text"]


def call_api(
    *,
    api_key: str,
    project_id: str,
    model: str,
    text: str,
    metadata: dict,
) -> dict:
    headers = {
        "content-type": "application/json",
        "x-api-key": api_key,
        "x-project-id": project_id,
    }
    payload = {
        "model": model,
        "input": text,
        "metadata": metadata,
    }
    response = requests.post(API_URL, headers=headers, json=payload, timeout=120)
    response.raise_for_status()
    return response.json()


def process_record(
    record: dict,
    config: dict,
    api_key: str,
    project_id: str,
) -> dict:
    metadata: dict = {"usecase": config["usecase"]}
    if config["usecase"] == "json":
        metadata["schema"] = load_schema(config["schema_file"])
    else:
        metadata["labels"] = config["ner_labels"]
        metadata["threshold"] = config["threshold"]

    body = call_api(
        api_key=api_key,
        project_id=project_id,
        model=config["model"],
        text=record["text"],
        metadata=metadata,
    )
    raw_text = extract_text_from_response(body)
    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError:
        parsed = {"_raw": raw_text}

    return {
        "id": record["id"],
        "source": record.get("source"),
        "model": config["model"],
        "usecase": config["usecase"],
        "extracted": parsed,
        "usage": body.get("usage"),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dataset",
        choices=sorted(DATASETS.keys()),
        required=True,
        help="Which JSONL file to process",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Max records (0 = all)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.5,
        help="Seconds between requests",
    )
    args = parser.parse_args()

    api_key = require_env("ZEROGPU_API_KEY")
    project_id = require_env("ZEROGPU_PROJECT_ID")

    config = DATASETS[args.dataset]
    path = DATASET_DIR / config["file"]
    records = load_jsonl(path)
    if args.limit > 0:
        records = records[: args.limit]

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_DIR / f"{args.dataset}-results.jsonl"

    print(f"Processing {len(records)} record(s) from {path.name} → {out_path.name}")

    with out_path.open("w", encoding="utf-8") as out:
        for i, record in enumerate(records, start=1):
            print(f"  [{i}/{len(records)}] {record['id']}...", flush=True)
            try:
                result = process_record(record, config, api_key, project_id)
            except requests.HTTPError as exc:
                result = {
                    "id": record["id"],
                    "error": str(exc),
                    "response": getattr(exc.response, "text", None),
                }
            out.write(json.dumps(result, ensure_ascii=False) + "\n")
            if args.delay and i < len(records):
                time.sleep(args.delay)

    print(f"Done. Results: {out_path}")


if __name__ == "__main__":
    main()
