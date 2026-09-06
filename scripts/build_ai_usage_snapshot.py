from __future__ import annotations

import argparse
import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the static 365-day AI usage snapshot.")
    parser.add_argument("endpoint_snapshot", type=Path, help="Combined Codex endpoint JSON")
    return parser.parse_args()


def load(path: Path) -> dict:
    return json.loads(path.read_text())


def codex_date(value: str) -> date:
    return datetime.strptime(value, "%b %d, %Y").date()


def empty_tokens() -> dict[str, int]:
    return {
        "cached_input": 0,
        "uncached_input": 0,
        "output": 0,
        "total": 0,
    }


def add_tokens(target: dict[str, int], *, cached: int, uncached: int, output: int, total: int) -> None:
    target["cached_input"] += cached
    target["uncached_input"] += uncached
    target["output"] += output
    target["total"] += total


def main() -> int:
    args = parse_args()
    endpoint = load(args.endpoint_snapshot)
    local_codex = load(ROOT / "usage-data" / "codex-usage.json")
    claude = load(ROOT / "usage-data" / "claude-usage.json")

    start = date.fromisoformat(endpoint["date_range"]["start"])
    end = date.fromisoformat(endpoint["date_range"]["end"])
    endpoint_start = date.fromisoformat(endpoint["coverage"]["first_day_with_reported_tokens"])

    calendar: dict[date, int] = {}
    cursor = start
    while cursor <= end:
        calendar[cursor] = 0
        cursor += timedelta(days=1)

    sources = {"codex": empty_tokens(), "claude_code": empty_tokens()}

    for row in endpoint["calendar"]:
        day = date.fromisoformat(row["date"])
        usage = row["combined"].get("token_activity") or {}
        cached = int(usage.get("cached_text_input_tokens", 0))
        uncached = int(usage.get("uncached_text_input_tokens", 0))
        output = int(usage.get("text_output_tokens", 0))
        total = int(usage.get("text_total_tokens", 0))
        calendar[day] += total
        add_tokens(sources["codex"], cached=cached, uncached=uncached, output=output, total=total)

    for row in local_codex["daily"]:
        day = codex_date(row["date"])
        if day not in calendar or day >= endpoint_start:
            continue
        cached = int(row["cachedInputTokens"])
        input_tokens = int(row["inputTokens"])
        output = int(row["outputTokens"])
        total = int(row["totalTokens"])
        calendar[day] += total
        add_tokens(
            sources["codex"],
            cached=cached,
            uncached=max(input_tokens - cached, 0),
            output=output,
            total=total,
        )

    for row in claude["daily"]:
        day = date.fromisoformat(row["date"])
        if day not in calendar:
            continue
        cached = int(row["cacheCreationTokens"]) + int(row["cacheReadTokens"])
        uncached = int(row["inputTokens"])
        output = int(row["outputTokens"])
        total = int(row["totalTokens"])
        calendar[day] += total
        add_tokens(sources["claude_code"], cached=cached, uncached=uncached, output=output, total=total)

    combined = empty_tokens()
    for source in sources.values():
        for key in combined:
            combined[key] += source[key]

    days = [{"date": day.isoformat(), "tokens": tokens} for day, tokens in sorted(calendar.items())]
    active_days = sum(row["tokens"] > 0 for row in days)
    peak = max(days, key=lambda row: row["tokens"])

    payload = {
        "schema_version": 1,
        "generated_at_utc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "date_range": {"start": start.isoformat(), "end": end.isoformat(), "days": len(days)},
        "totals": {"combined": combined, "sources": sources},
        "active_days": active_days,
        "peak_day": peak,
        "calendar": days,
    }

    json_text = json.dumps(payload, indent=2) + "\n"
    (ROOT / "usage" / "data.json").write_text(json_text)
    (ROOT / "usage" / "data.js").write_text("window.usageSnapshot = " + json_text.rstrip() + ";\n")
    print(json.dumps({"total": combined["total"], "active_days": active_days, "peak_day": peak}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
