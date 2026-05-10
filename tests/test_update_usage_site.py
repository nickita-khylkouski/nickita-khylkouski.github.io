from __future__ import annotations

import sys
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "scripts"))

import update_usage_site  # noqa: E402


class UpdateUsageSiteTests(unittest.TestCase):
    def test_codex_cost_prices_gpt_5_5_with_cached_tokens(self) -> None:
        pricing = {
            "gpt-5.5": {
                "input_cost_per_token": 0.000005,
                "cache_read_input_token_cost": 0.0000005,
                "output_cost_per_token": 0.00003,
            }
        }
        usage = {
            "inputTokens": 1_000_000,
            "cachedInputTokens": 900_000,
            "outputTokens": 10_000,
            "reasoningOutputTokens": 0,
            "totalTokens": 1_010_000,
        }

        cost = update_usage_site.codex_cost_usd(usage, "gpt-5.5", pricing)

        self.assertAlmostEqual(cost, 1.25)

    def test_codex_pricing_coverage_rejects_nonzero_unknown_model(self) -> None:
        rows = [
            {
                "date": "May 10, 2026",
                "models": {
                    "gpt-future": {
                        "inputTokens": 100,
                        "cachedInputTokens": 0,
                        "outputTokens": 10,
                    }
                },
            }
        ]

        with self.assertRaisesRegex(RuntimeError, "gpt-future"):
            update_usage_site.validate_codex_pricing_coverage(rows, {})

    def test_codex_spark_alias_uses_codex_pricing(self) -> None:
        pricing = {
            "gpt-5.3-codex": {
                "input_cost_per_token": 0.00000175,
                "cache_read_input_token_cost": 0.000000175,
                "output_cost_per_token": 0.000014,
            }
        }

        price = update_usage_site.codex_price_for_model("gpt-5.3-codex-spark", pricing)

        self.assertEqual(price["input"], 0.00000175)
        self.assertEqual(price["cached"], 0.000000175)
        self.assertEqual(price["output"], 0.000014)


if __name__ == "__main__":
    unittest.main()
