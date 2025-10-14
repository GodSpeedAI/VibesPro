"""CLI helper to generate architectural pattern recommendations as JSON."""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path
from typing import Any

from .patterns import ArchitecturalPatternRecognizer
from .repository import initialize_temporal_database


async def _run_async(args: argparse.Namespace) -> dict[str, Any]:
    repository = await initialize_temporal_database(args.db)
    try:
        recognizer = ArchitecturalPatternRecognizer(
            repository,
            retention_days=args.retention,
            minimum_confidence=args.min_confidence,
            max_recommendations=args.limit,
        )

        feedback_result: dict[str, str] | None = None
        if args.feedback_action and args.feedback_id:
            updated = await repository.record_recommendation_feedback(
                args.feedback_id,
                args.feedback_action,
                args.feedback_reason,
            )
            if updated:
                feedback_result = {
                    "id": updated.id,
                    "action": args.feedback_action,
                }

        result = await recognizer.generate_recommendations(
            lookback_days=args.lookback,
            dry_run=args.dry_run,
        )
        existing = await recognizer.hydrate_existing(limit=args.limit)

        return {
            "generated": [recommendation.to_dict() for recommendation in result.recommendations],
            "existing": [recommendation.to_dict() for recommendation in existing],
            "retention_deleted": result.retention_deleted,
            "feedback": feedback_result,
        }
    finally:
        await repository.close()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Export pattern recommendations")
    parser.add_argument("--db", required=True, help="Path to the temporal database base filename")
    parser.add_argument("--lookback", type=int, default=45, help="Number of days to analyse")
    parser.add_argument("--limit", type=int, default=10, help="Maximum recommendations to return")
    parser.add_argument(
        "--retention", type=int, default=90, help="Retention window for recommendations (days)"
    )
    parser.add_argument(
        "--min-confidence", type=float, default=0.55, help="Minimum confidence threshold"
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Skip persistence while generating recommendations"
    )
    parser.add_argument(
        "--feedback-action",
        choices=["accept", "dismiss"],
        help="Optional feedback action to record",
    )
    parser.add_argument("--feedback-id", help="Recommendation identifier for feedback")
    parser.add_argument("--feedback-reason", help="Optional feedback rationale")
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    args.db = str(Path(args.db))

    try:
        payload = asyncio.run(_run_async(args))
        json.dump(payload, sys.stdout)
        sys.stdout.write("\n")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()


if __name__ == "__main__":
    main()
    main()
    main()
