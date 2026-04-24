from __future__ import annotations

import json
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import update_usage_site as usage_snapshot


TIMEZONE = usage_snapshot.TIMEZONE
STATE_DIR = Path.home() / "Library" / "Caches" / "nickita-ai-usage-live"
STATE_PATH = STATE_DIR / "state.json"


def _format_compact_tokens(value: int) -> str:
    abs_value = abs(value)
    if abs_value >= 1_000_000_000:
        return f"{value / 1_000_000_000:.2f}B"
    if abs_value >= 1_000_000:
        return f"{value / 1_000_000:.1f}M"
    if abs_value >= 1_000:
        return f"{value / 1_000:.1f}K"
    return str(value)


def _format_money(value: float) -> str:
    return f"${value:,.2f}"


def _parse_timestamp(value: str | None) -> datetime | None:
    if not isinstance(value, str):
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(TIMEZONE)


def _empty_codex_totals() -> dict[str, Any]:
    return {
        "inputTokens": 0,
        "cachedInputTokens": 0,
        "outputTokens": 0,
        "reasoningOutputTokens": 0,
        "totalTokens": 0,
        "costUSD": 0.0,
    }


def _empty_claude_totals() -> dict[str, Any]:
    return {
        "inputTokens": 0,
        "outputTokens": 0,
        "cacheCreationTokens": 0,
        "cacheReadTokens": 0,
        "totalTokens": 0,
        "totalCost": 0.0,
    }


def _copy_totals(values: dict[str, Any]) -> dict[str, Any]:
    return json.loads(json.dumps(values))


def _add_totals(target: dict[str, Any], delta: dict[str, Any], keys: list[str]) -> None:
    for key in keys:
        target[key] = target.get(key, 0) + delta.get(key, 0)


@dataclass
class TrackedFile:
    path: Path
    offset: int = 0
    buffer: str = ""
    current_model: str | None = None
    current_model_is_fallback: bool = False
    session_start_timestamp: str | None = None
    previous_codex_total: dict[str, int] | None = None
    last_stat_mtime: float = 0.0


class LiveUsageTracker:
    def __init__(
        self,
        site_root: Path,
        codex_root: Path | None = None,
        claude_root: Path | None = None,
        state_path: Path = STATE_PATH,
        now_fn=time.time,
        codex_pricing: dict[str, Any] | None = None,
        claude_pricing: dict[str, Any] | None = None,
    ) -> None:
        self.site_root = Path(site_root)
        self.codex_root = Path(codex_root or (Path.home() / ".codex" / "sessions"))
        self.claude_root = Path(claude_root or (Path.home() / ".claude" / "projects"))
        self.state_path = Path(state_path)
        self.now_fn = now_fn

        self.codex_usage_path = self.site_root / "usage-data" / "codex-usage.json"
        self.claude_usage_path = self.site_root / "usage-data" / "claude-usage.json"

        self.codex_snapshot = usage_snapshot.load_json(self.codex_usage_path)
        self.claude_snapshot = usage_snapshot.load_json(self.claude_usage_path)
        self.codex_cutoff_epoch = self.codex_usage_path.stat().st_mtime
        self.claude_cutoff_epoch = self.claude_usage_path.stat().st_mtime
        self.codex_cutoff_dt = datetime.fromtimestamp(self.codex_cutoff_epoch, tz=TIMEZONE)
        self.claude_cutoff_dt = datetime.fromtimestamp(self.claude_cutoff_epoch, tz=TIMEZONE)

        self.codex_pricing = codex_pricing or usage_snapshot.load_js_prefetched_constant(
            usage_snapshot.find_latest_npx_entry("@ccusage/codex/dist/index.js"),
            "PREFETCHED_CODEX_PRICING",
        )
        self.claude_pricing = claude_pricing or usage_snapshot.load_claude_pricing()

        self.codex_live = _empty_codex_totals()
        self.claude_live = _empty_claude_totals()
        self.codex_files: dict[Path, TrackedFile] = {}
        self.claude_files: dict[Path, TrackedFile] = {}
        self.last_codex_discovery = 0.0
        self.last_claude_discovery = 0.0

    def bootstrap(self) -> None:
        self._discover_codex(force=True)
        self._discover_claude(force=True)
        self.write_state()

    def tick(self) -> None:
        self._discover_codex()
        self._discover_claude()
        self._poll_source(self.codex_files, self._process_codex_chunk)
        self._poll_source(self.claude_files, self._process_claude_chunk)
        self.write_state()

    def summary(self) -> dict[str, Any]:
        codex_base = self.codex_snapshot.get("totals", {})
        claude_base = self.claude_snapshot.get("totals", {})

        codex_tokens = int(codex_base.get("totalTokens", 0)) + int(self.codex_live["totalTokens"])
        claude_tokens = int(claude_base.get("totalTokens", 0)) + int(self.claude_live["totalTokens"])
        codex_cost = float(codex_base.get("costUSD", 0.0)) + float(self.codex_live["costUSD"])
        claude_cost = float(claude_base.get("totalCost", 0.0)) + float(self.claude_live["totalCost"])
        combined_tokens = codex_tokens + claude_tokens
        combined_cost = codex_cost + claude_cost

        return {
            "menuBarText": f"AI {_format_compact_tokens(combined_tokens)}",
            "combined": {"tokens": combined_tokens, "cost": combined_cost},
            "codex": {
                "baseTokens": int(codex_base.get("totalTokens", 0)),
                "baseCost": float(codex_base.get("costUSD", 0.0)),
                "liveTokens": int(self.codex_live["totalTokens"]),
                "liveCost": float(self.codex_live["costUSD"]),
                "tokens": codex_tokens,
                "cost": codex_cost,
            },
            "claude": {
                "baseTokens": int(claude_base.get("totalTokens", 0)),
                "baseCost": float(claude_base.get("totalCost", 0.0)),
                "liveTokens": int(self.claude_live["totalTokens"]),
                "liveCost": float(self.claude_live["totalCost"]),
                "tokens": claude_tokens,
                "cost": claude_cost,
            },
            "snapshot": {
                "codexCutoffISO": self.codex_cutoff_dt.isoformat(),
                "claudeCutoffISO": self.claude_cutoff_dt.isoformat(),
            },
            "watchedFiles": {
                "codex": len(self.codex_files),
                "claude": len(self.claude_files),
            },
            "formatted": {
                "combinedTokens": _format_compact_tokens(combined_tokens),
                "combinedCost": _format_money(combined_cost),
                "codexTokens": _format_compact_tokens(codex_tokens),
                "codexCost": _format_money(codex_cost),
                "claudeTokens": _format_compact_tokens(claude_tokens),
                "claudeCost": _format_money(claude_cost),
                "codexLiveTokens": _format_compact_tokens(int(self.codex_live["totalTokens"])),
                "claudeLiveTokens": _format_compact_tokens(int(self.claude_live["totalTokens"])),
                "codexLiveCost": _format_money(float(self.codex_live["costUSD"])),
                "claudeLiveCost": _format_money(float(self.claude_live["totalCost"])),
            },
            "updatedAtISO": datetime.now(TIMEZONE).isoformat(),
        }

    def write_state(self) -> None:
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        self.state_path.write_text(json.dumps(self.summary(), indent=2) + "\n")

    def _discover_codex(self, force: bool = False) -> None:
        now = self.now_fn()
        if not force and now - self.last_codex_discovery < 2.0:
            return
        self.last_codex_discovery = now

        candidates = []
        cutoff = self.codex_cutoff_epoch - 2.0
        for path in self.codex_root.rglob("*.jsonl"):
            try:
                stat = path.stat()
            except FileNotFoundError:
                continue
            if stat.st_mtime >= cutoff:
                candidates.append((stat.st_mtime, path, stat.st_size))
        candidates.sort(reverse=True)

        for mtime, path, size in candidates[:24]:
            if path in self.codex_files:
                continue
            tracked = TrackedFile(path=path, last_stat_mtime=mtime)
            self.codex_files[path] = tracked
            self._scan_full_file(tracked, size, self._process_codex_chunk)

    def _discover_claude(self, force: bool = False) -> None:
        now = self.now_fn()
        if not force and now - self.last_claude_discovery < 10.0:
            return
        self.last_claude_discovery = now

        candidates = []
        cutoff = self.claude_cutoff_epoch - 2.0
        for path in self.claude_root.rglob("*.jsonl"):
            try:
                stat = path.stat()
            except FileNotFoundError:
                continue
            if stat.st_mtime >= cutoff:
                candidates.append((stat.st_mtime, path, stat.st_size))
        candidates.sort(reverse=True)

        for mtime, path, size in candidates[:32]:
            if path in self.claude_files:
                continue
            tracked = TrackedFile(path=path, last_stat_mtime=mtime)
            self.claude_files[path] = tracked
            self._scan_full_file(tracked, size, self._process_claude_chunk)

    def _scan_full_file(self, tracked: TrackedFile, size: int, processor) -> None:
        if size <= 0:
            tracked.offset = 0
            tracked.buffer = ""
            return
        data = tracked.path.read_text(encoding="utf-8", errors="ignore")
        processor(tracked, data)
        tracked.offset = size

    def _poll_source(self, tracked_files: dict[Path, TrackedFile], processor) -> None:
        for path, tracked in list(tracked_files.items()):
            try:
                stat = path.stat()
            except FileNotFoundError:
                tracked_files.pop(path, None)
                continue

            if stat.st_size < tracked.offset:
                tracked.offset = 0
                tracked.buffer = ""
                tracked.current_model = None
                tracked.current_model_is_fallback = False
                tracked.previous_codex_total = None
                self._scan_full_file(tracked, stat.st_size, processor)
                continue

            if stat.st_size == tracked.offset:
                continue

            with path.open("rb") as handle:
                handle.seek(tracked.offset)
                data = handle.read()
            tracked.offset = stat.st_size
            tracked.last_stat_mtime = stat.st_mtime
            processor(tracked, data.decode("utf-8", errors="ignore"))

    def _iter_complete_lines(self, tracked: TrackedFile, chunk: str) -> list[str]:
        combined = tracked.buffer + chunk
        if not combined:
            return []
        lines = combined.split("\n")
        if combined.endswith("\n"):
            tracked.buffer = ""
            return [line for line in lines if line]
        tracked.buffer = lines.pop()
        return [line for line in lines if line]

    def _process_codex_chunk(self, tracked: TrackedFile, chunk: str) -> None:
        for line in self._iter_complete_lines(tracked, chunk):
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue

            payload = entry.get("payload")
            if entry.get("type") == "session_meta" and isinstance(payload, dict):
                tracked.session_start_timestamp = payload.get("timestamp") or entry.get("timestamp")
                continue
            if entry.get("type") == "turn_context" and isinstance(payload, dict):
                model = usage_snapshot.codex_extract_model(payload)
                if model:
                    tracked.current_model = model
                    tracked.current_model_is_fallback = False
                continue

            if entry.get("type") != "event_msg" or not isinstance(payload, dict) or payload.get("type") != "token_count":
                continue

            info = payload.get("info")
            last_usage = usage_snapshot.codex_normalize_raw_usage(info.get("last_token_usage") if isinstance(info, dict) else None)
            total_usage = usage_snapshot.codex_normalize_raw_usage(info.get("total_token_usage") if isinstance(info, dict) else None)
            raw = last_usage
            if raw is None and total_usage is not None and tracked.previous_codex_total is not None:
                raw = usage_snapshot.codex_subtract_raw_usage(total_usage, tracked.previous_codex_total)
            if total_usage is not None:
                tracked.previous_codex_total = total_usage

            extracted_model = usage_snapshot.codex_extract_model({**payload, "info": info} if isinstance(info, dict) else payload)
            if extracted_model:
                tracked.current_model = extracted_model
                tracked.current_model_is_fallback = False

            model = extracted_model or tracked.current_model
            if model is None:
                model = "gpt-5"
                tracked.current_model = model
                tracked.current_model_is_fallback = True

            timestamp = _parse_timestamp(entry.get("timestamp"))
            if timestamp is None or timestamp <= self.codex_cutoff_dt:
                continue
            if tracked.session_start_timestamp:
                session_start = _parse_timestamp(tracked.session_start_timestamp)
                if session_start is not None and timestamp < session_start:
                    continue
            if raw is None:
                continue
            delta = usage_snapshot.codex_convert_delta(raw)
            if not any(delta[key] for key in ("inputTokens", "cachedInputTokens", "outputTokens", "reasoningOutputTokens")):
                continue

            _add_totals(
                self.codex_live,
                delta,
                ["inputTokens", "cachedInputTokens", "outputTokens", "reasoningOutputTokens", "totalTokens"],
            )
            self.codex_live["costUSD"] += usage_snapshot.codex_cost_usd(delta, model, self.codex_pricing)

    def _process_claude_chunk(self, tracked: TrackedFile, chunk: str) -> None:
        for line in self._iter_complete_lines(tracked, chunk):
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue

            message = entry.get("message")
            usage = message.get("usage") if isinstance(message, dict) else None
            if not isinstance(usage, dict):
                continue

            timestamp = _parse_timestamp(entry.get("timestamp"))
            if timestamp is None or timestamp <= self.claude_cutoff_dt:
                continue

            delta = {
                "inputTokens": int(usage.get("input_tokens") or 0),
                "outputTokens": int(usage.get("output_tokens") or 0),
                "cacheCreationTokens": int(usage.get("cache_creation_input_tokens") or 0),
                "cacheReadTokens": int(usage.get("cache_read_input_tokens") or 0),
            }
            delta["totalTokens"] = (
                delta["inputTokens"]
                + delta["outputTokens"]
                + delta["cacheCreationTokens"]
                + delta["cacheReadTokens"]
            )
            model = str(message.get("model") or "unknown")
            speed = usage.get("speed") if isinstance(usage.get("speed"), str) else None
            delta["totalCost"] = usage_snapshot.claude_cost_usd(delta, model, speed, self.claude_pricing)

            _add_totals(
                self.claude_live,
                delta,
                ["inputTokens", "outputTokens", "cacheCreationTokens", "cacheReadTokens", "totalTokens"],
            )
            self.claude_live["totalCost"] += delta["totalCost"]
