from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "scripts"))

from live_usage_tracker import LiveUsageTracker  # noqa: E402


class LiveUsageTrackerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        self.site_root = self.root / "site"
        self.codex_root = self.root / "codex"
        self.claude_root = self.root / "claude"
        (self.site_root / "usage-data").mkdir(parents=True)
        self.codex_root.mkdir(parents=True)
        self.claude_root.mkdir(parents=True)
        self.state_path = self.root / "state.json"

        self.codex_usage_path = self.site_root / "usage-data" / "codex-usage.json"
        self.claude_usage_path = self.site_root / "usage-data" / "claude-usage.json"
        self.codex_usage_path.write_text(json.dumps({"daily": [], "totals": {"totalTokens": 100, "costUSD": 1.5}}))
        self.claude_usage_path.write_text(json.dumps({"daily": [], "totals": {"totalTokens": 50, "totalCost": 2.0}}))

        self.cutoff_epoch = 1_700_000_000
        os.utime(self.codex_usage_path, (self.cutoff_epoch, self.cutoff_epoch))
        os.utime(self.claude_usage_path, (self.cutoff_epoch, self.cutoff_epoch))

        self.now_value = self.cutoff_epoch + 60
        self.codex_pricing = {
            "gpt-5.4": {
                "input_cost_per_token": 0.000001,
                "cache_read_input_token_cost": 0.0000001,
                "output_cost_per_token": 0.000002,
            },
            "gpt-5": {
                "input_cost_per_token": 0.000001,
                "cache_read_input_token_cost": 0.0000001,
                "output_cost_per_token": 0.000002,
            },
        }
        self.claude_pricing = {
            "claude-opus-4-6": {
                "input_cost_per_token": 0.000001,
                "output_cost_per_token": 0.000002,
                "cache_creation_input_token_cost": 0.0000005,
                "cache_read_input_token_cost": 0.0000001,
                "provider_specific_entry": {},
            }
        }

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _tracker(self) -> LiveUsageTracker:
        return LiveUsageTracker(
            site_root=self.site_root,
            codex_root=self.codex_root,
            claude_root=self.claude_root,
            state_path=self.state_path,
            now_fn=lambda: self.now_value,
            codex_pricing=self.codex_pricing,
            claude_pricing=self.claude_pricing,
        )

    def test_codex_bootstrap_counts_only_entries_after_cutoff(self) -> None:
        day_dir = self.codex_root / "2026" / "04" / "07"
        day_dir.mkdir(parents=True)
        file_path = day_dir / "session.jsonl"
        file_path.write_text(
            "\n".join(
                [
                    json.dumps({"timestamp": "2023-11-14T22:13:19Z", "type": "turn_context", "payload": {"model": "gpt-5.4"}}),
                    json.dumps({
                        "timestamp": "2023-11-14T22:13:19Z",
                        "type": "event_msg",
                        "payload": {
                            "type": "token_count",
                            "info": {"last_token_usage": {"input_tokens": 10, "cached_input_tokens": 2, "output_tokens": 3, "reasoning_output_tokens": 1, "total_tokens": 13}},
                        },
                    }),
                    json.dumps({
                        "timestamp": "2023-11-14T22:13:25Z",
                        "type": "event_msg",
                        "payload": {
                            "type": "token_count",
                            "info": {"last_token_usage": {"input_tokens": 20, "cached_input_tokens": 5, "output_tokens": 4, "reasoning_output_tokens": 0, "total_tokens": 24}},
                        },
                    }),
                    "",
                ]
            )
        )
        # File is newer than the snapshot cutoff.
        os.utime(file_path, (self.cutoff_epoch + 10, self.cutoff_epoch + 10))

        tracker = self._tracker()
        tracker.bootstrap()
        summary = tracker.summary()

        self.assertEqual(summary["codex"]["liveTokens"], 24)
        self.assertEqual(summary["combined"]["tokens"], 100 + 50 + 24)
        self.assertGreater(summary["codex"]["liveCost"], 0)

    def test_codex_incremental_append_uses_total_usage_delta_after_baseline(self) -> None:
        day_dir = self.codex_root / "2026" / "04" / "07"
        day_dir.mkdir(parents=True)
        file_path = day_dir / "session.jsonl"
        file_path.write_text(
            "\n".join(
                [
                    json.dumps({"timestamp": "2023-11-14T22:13:24Z", "type": "turn_context", "payload": {"model": "gpt-5.4"}}),
                    json.dumps({
                        "timestamp": "2023-11-14T22:13:24Z",
                        "type": "event_msg",
                        "payload": {
                            "type": "token_count",
                            "info": {"total_token_usage": {"input_tokens": 20, "cached_input_tokens": 2, "output_tokens": 5, "reasoning_output_tokens": 1, "total_tokens": 25}},
                        },
                    }),
                    "",
                ]
            )
        )
        os.utime(file_path, (self.cutoff_epoch + 10, self.cutoff_epoch + 10))

        tracker = self._tracker()
        tracker.bootstrap()
        self.assertEqual(tracker.summary()["codex"]["liveTokens"], 0)

        with file_path.open("a") as handle:
            handle.write(
                json.dumps({
                    "timestamp": "2023-11-14T22:13:30Z",
                    "type": "event_msg",
                    "payload": {
                        "type": "token_count",
                        "info": {"total_token_usage": {"input_tokens": 35, "cached_input_tokens": 5, "output_tokens": 9, "reasoning_output_tokens": 2, "total_tokens": 44}},
                    },
                })
            )
            handle.write("\n")
        os.utime(file_path, (self.cutoff_epoch + 20, self.cutoff_epoch + 20))

        tracker.tick()
        self.assertEqual(tracker.summary()["codex"]["liveTokens"], 19)

    def test_claude_bootstrap_and_incremental_append(self) -> None:
        project_dir = self.claude_root / "project"
        project_dir.mkdir(parents=True)
        file_path = project_dir / "claude.jsonl"
        file_path.write_text(
            "\n".join(
                [
                    json.dumps({
                        "timestamp": "2023-11-14T22:13:25Z",
                        "message": {
                            "model": "claude-opus-4-6",
                            "usage": {
                                "input_tokens": 11,
                                "output_tokens": 7,
                                "cache_creation_input_tokens": 3,
                                "cache_read_input_tokens": 2,
                                "speed": "standard",
                            },
                        },
                    }),
                    "",
                ]
            )
        )
        os.utime(file_path, (self.cutoff_epoch + 15, self.cutoff_epoch + 15))

        tracker = self._tracker()
        tracker.bootstrap()
        self.assertEqual(tracker.summary()["claude"]["liveTokens"], 23)

        with file_path.open("a") as handle:
            handle.write(
                json.dumps({
                    "timestamp": "2023-11-14T22:13:35Z",
                    "message": {
                        "model": "claude-opus-4-6",
                        "usage": {
                            "input_tokens": 5,
                            "output_tokens": 4,
                            "cache_creation_input_tokens": 0,
                            "cache_read_input_tokens": 1,
                            "speed": "standard",
                        },
                    },
                })
            )
            handle.write("\n")
        os.utime(file_path, (self.cutoff_epoch + 25, self.cutoff_epoch + 25))

        tracker.tick()
        self.assertEqual(tracker.summary()["claude"]["liveTokens"], 33)
        self.assertGreater(tracker.summary()["claude"]["liveCost"], 0)

    def test_new_files_are_discovered_on_tick(self) -> None:
        tracker = self._tracker()
        tracker.bootstrap()

        self.now_value += 20
        day_dir = self.codex_root / "2026" / "04" / "07"
        day_dir.mkdir(parents=True, exist_ok=True)
        file_path = day_dir / "new-session.jsonl"
        file_path.write_text(
            json.dumps({
                "timestamp": "2023-11-14T22:13:40Z",
                "type": "event_msg",
                "payload": {
                    "type": "token_count",
                    "info": {"last_token_usage": {"input_tokens": 9, "cached_input_tokens": 0, "output_tokens": 1, "reasoning_output_tokens": 0, "total_tokens": 10}},
                },
            })
            + "\n"
        )
        os.utime(file_path, (self.cutoff_epoch + 40, self.cutoff_epoch + 40))

        tracker.tick()
        self.assertEqual(tracker.summary()["codex"]["liveTokens"], 10)


if __name__ == "__main__":
    unittest.main()
