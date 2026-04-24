from __future__ import annotations

from bisect import bisect_right
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any, Sequence
import json


@dataclass
class RawUsage:
    input_tokens: int
    cached_input_tokens: int
    output_tokens: int
    reasoning_output_tokens: int
    total_tokens: int


@dataclass
class SessionEvent:
    timestamp: str | None
    model: str
    is_fallback: bool
    cumulative: RawUsage


@dataclass
class SessionRecord:
    session_id: str
    path: Path
    start_timestamp: str | None
    forked_from_id: str | None
    events: list[SessionEvent]


DEFAULT_CANDIDATE_SESSION_ROOTS = (
    Path.home() / ".codex" / "sessions",
    Path.home() / ".codex-app" / "sessions",
    Path.home() / ".codex-blackbox" / "sessions",
    Path.home() / ".codex-canvas" / "sessions",
    Path.home() / ".codex-harness-alt" / "sessions",
    Path.home() / ".codex-seq" / "sessions",
)


def normalize_raw_usage(value: Any) -> RawUsage | None:
    if not isinstance(value, dict):
        return None
    input_tokens = int(value.get("input_tokens") or 0)
    cached_input_tokens = int(value.get("cached_input_tokens") or value.get("cache_read_input_tokens") or 0)
    output_tokens = int(value.get("output_tokens") or 0)
    reasoning_output_tokens = int(value.get("reasoning_output_tokens") or 0)
    total_tokens = int(value.get("total_tokens") or 0)
    if total_tokens <= 0:
        total_tokens = input_tokens + output_tokens
    return RawUsage(
        input_tokens=input_tokens,
        cached_input_tokens=cached_input_tokens,
        output_tokens=output_tokens,
        reasoning_output_tokens=reasoning_output_tokens,
        total_tokens=total_tokens,
    )


def add_raw_usage(left: RawUsage, right: RawUsage) -> RawUsage:
    return RawUsage(
        input_tokens=left.input_tokens + right.input_tokens,
        cached_input_tokens=left.cached_input_tokens + right.cached_input_tokens,
        output_tokens=left.output_tokens + right.output_tokens,
        reasoning_output_tokens=left.reasoning_output_tokens + right.reasoning_output_tokens,
        total_tokens=left.total_tokens + right.total_tokens,
    )


def subtract_raw_usage(current: RawUsage, previous: RawUsage | None) -> RawUsage:
    prev = previous or RawUsage(0, 0, 0, 0, 0)
    return RawUsage(
        input_tokens=max(current.input_tokens - prev.input_tokens, 0),
        cached_input_tokens=max(current.cached_input_tokens - prev.cached_input_tokens, 0),
        output_tokens=max(current.output_tokens - prev.output_tokens, 0),
        reasoning_output_tokens=max(current.reasoning_output_tokens - prev.reasoning_output_tokens, 0),
        total_tokens=max(current.total_tokens - prev.total_tokens, 0),
    )


def max_raw_usage(left: RawUsage, right: RawUsage) -> RawUsage:
    return RawUsage(
        input_tokens=max(left.input_tokens, right.input_tokens),
        cached_input_tokens=max(left.cached_input_tokens, right.cached_input_tokens),
        output_tokens=max(left.output_tokens, right.output_tokens),
        reasoning_output_tokens=max(left.reasoning_output_tokens, right.reasoning_output_tokens),
        total_tokens=max(left.total_tokens, right.total_tokens),
    )


def convert_delta(raw: RawUsage) -> dict[str, int]:
    total_tokens = raw.total_tokens if raw.total_tokens > 0 else raw.input_tokens + raw.output_tokens
    cached_input_tokens = min(raw.cached_input_tokens, raw.input_tokens)
    return {
        "inputTokens": raw.input_tokens,
        "cachedInputTokens": cached_input_tokens,
        "outputTokens": raw.output_tokens,
        "reasoningOutputTokens": raw.reasoning_output_tokens,
        "totalTokens": total_tokens,
    }


def extract_model(value: Any) -> str | None:
    if not isinstance(value, dict):
        return None
    info = value.get("info")
    if isinstance(info, dict):
        for key in ("model", "model_name"):
            candidate = info.get(key)
            if isinstance(candidate, str) and candidate.strip():
                return candidate.strip()
        metadata = info.get("metadata")
        if isinstance(metadata, dict):
            candidate = metadata.get("model")
            if isinstance(candidate, str) and candidate.strip():
                return candidate.strip()
    candidate = value.get("model")
    if isinstance(candidate, str) and candidate.strip():
        return candidate.strip()
    metadata = value.get("metadata")
    if isinstance(metadata, dict):
        candidate = metadata.get("model")
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()
    return None


def normalize_session_roots(sessions_roots: Path | Sequence[Path]) -> list[Path]:
    if isinstance(sessions_roots, Path):
        candidates = [sessions_roots]
    else:
        candidates = list(sessions_roots)

    roots: list[Path] = []
    seen: set[Path] = set()
    for candidate in candidates:
        if not candidate.exists() or not candidate.is_dir():
            continue
        resolved = candidate.resolve()
        if resolved in seen:
            continue
        seen.add(resolved)
        roots.append(candidate)
    return roots


def discover_session_roots(candidates: Sequence[Path] | None = None) -> list[Path]:
    return normalize_session_roots(list(candidates) if candidates is not None else list(DEFAULT_CANDIDATE_SESSION_ROOTS))


def iter_session_files(sessions_roots: Path | Sequence[Path]) -> list[Path]:
    files: list[Path] = []
    for root in normalize_session_roots(sessions_roots):
        files.extend(sorted(root.rglob("*.jsonl")))
    return sorted(files)


def session_record_sort_key(record: SessionRecord) -> tuple[int, int, str]:
    is_main_root = int(str(record.path).startswith(str(Path.home() / ".codex" / "sessions")))
    return (len(record.events), is_main_root, str(record.path))


def load_sessions(sessions_roots: Path | Sequence[Path]) -> dict[str, SessionRecord]:
    sessions: dict[str, SessionRecord] = {}
    for sessions_root in normalize_session_roots(sessions_roots):
        for file_path in sorted(sessions_root.rglob("*.jsonl")):
            fallback_session_id = file_path.relative_to(sessions_root).as_posix().removesuffix(".jsonl")
            session_id = fallback_session_id
            start_timestamp: str | None = None
            forked_from_id: str | None = None
            current_model: str | None = None
            current_model_is_fallback = False
            previous_cumulative: RawUsage | None = None
            events: list[SessionEvent] = []

            with file_path.open(encoding="utf-8", errors="ignore") as handle:
                for line in handle:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    entry_type = entry.get("type")
                    payload = entry.get("payload")

                    if entry_type == "session_meta" and isinstance(payload, dict):
                        session_id = str(payload.get("id") or session_id)
                        forked_from_id = payload.get("forked_from_id")
                        start_timestamp = payload.get("timestamp") or entry.get("timestamp")
                        continue

                    if entry_type == "turn_context" and isinstance(payload, dict):
                        model = extract_model(payload)
                        if model:
                            current_model = model
                            current_model_is_fallback = False
                        continue

                    if entry_type != "event_msg" or not isinstance(payload, dict) or payload.get("type") != "token_count":
                        continue

                    info = payload.get("info") if isinstance(payload.get("info"), dict) else None
                    total_usage = normalize_raw_usage(info.get("total_token_usage") if info else None)
                    last_usage = normalize_raw_usage(info.get("last_token_usage") if info else None)
                    if total_usage is not None:
                        cumulative = total_usage
                    elif last_usage is not None:
                        cumulative = add_raw_usage(previous_cumulative or RawUsage(0, 0, 0, 0, 0), last_usage)
                    else:
                        continue

                    extracted_model = extract_model({**payload, "info": info} if info else payload)
                    is_fallback = False
                    if extracted_model:
                        current_model = extracted_model
                        current_model_is_fallback = False

                    model = extracted_model or current_model
                    if model is None:
                        model = "gpt-5"
                        current_model = model
                        current_model_is_fallback = True
                        is_fallback = True
                    elif extracted_model is None and current_model_is_fallback:
                        is_fallback = True

                    previous_cumulative = cumulative
                    events.append(
                        SessionEvent(
                            timestamp=entry.get("timestamp"),
                            model=model,
                            is_fallback=is_fallback,
                            cumulative=cumulative,
                        )
                    )

            events.sort(key=lambda item: item.timestamp or "")
            candidate = SessionRecord(
                session_id=session_id,
                path=file_path,
                start_timestamp=start_timestamp,
                forked_from_id=forked_from_id,
                events=events,
            )
            existing = sessions.get(session_id)
            if existing is None or session_record_sort_key(candidate) > session_record_sort_key(existing):
                sessions[session_id] = candidate
    return sessions


def baseline_for_session(session: SessionRecord, sessions: dict[str, SessionRecord]) -> RawUsage:
    zero = RawUsage(0, 0, 0, 0, 0)
    if not session.forked_from_id or not session.start_timestamp:
        return zero
    parent = sessions.get(session.forked_from_id)
    if not parent or not parent.events:
        return zero
    parent_timestamps = [event.timestamp or "" for event in parent.events]
    index = bisect_right(parent_timestamps, session.start_timestamp) - 1
    if index < 0:
        return zero
    return parent.events[index].cumulative


def local_day(timestamp: str, timezone) -> date:
    return datetime.fromisoformat(timestamp.replace("Z", "+00:00")).astimezone(timezone).date()


def build_daily_rows(
    sessions_roots: Path | Sequence[Path],
    *,
    start_date: date,
    timezone,
    price_for_usage,
) -> list[dict[str, Any]]:
    sessions = load_sessions(sessions_roots)
    by_day: dict[date, dict[str, Any]] = {}

    for session in sessions.values():
        previous = baseline_for_session(session, sessions)
        for event in session.events:
            if event.timestamp is None:
                continue
            if session.start_timestamp and event.timestamp < session.start_timestamp:
                continue

            delta_raw = subtract_raw_usage(event.cumulative, previous)
            previous = max_raw_usage(previous, event.cumulative)
            delta = convert_delta(delta_raw)
            if not any(delta[key] for key in ("inputTokens", "cachedInputTokens", "outputTokens", "reasoningOutputTokens")):
                continue

            event_day = local_day(event.timestamp, timezone)
            if event_day < start_date:
                continue

            row = by_day.setdefault(
                event_day,
                {
                    "date": event_day,
                    "inputTokens": 0,
                    "cachedInputTokens": 0,
                    "outputTokens": 0,
                    "reasoningOutputTokens": 0,
                    "totalTokens": 0,
                    "costUSD": 0.0,
                    "models": {},
                },
            )
            for key in ("inputTokens", "cachedInputTokens", "outputTokens", "reasoningOutputTokens", "totalTokens"):
                row[key] += delta[key]
            row["costUSD"] += price_for_usage(delta, event.model)

            model_bucket = row["models"].setdefault(
                event.model,
                {
                    "inputTokens": 0,
                    "cachedInputTokens": 0,
                    "outputTokens": 0,
                    "reasoningOutputTokens": 0,
                    "totalTokens": 0,
                    "isFallback": False,
                },
            )
            for key in ("inputTokens", "cachedInputTokens", "outputTokens", "reasoningOutputTokens", "totalTokens"):
                model_bucket[key] += delta[key]
            model_bucket["isFallback"] = model_bucket["isFallback"] or event.is_fallback

    return [by_day[day] for day in sorted(by_day)]
