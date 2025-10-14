#!/usr/bin/env python3
"""
Enhanced token counter CLI with ML-powered prompt optimization.
Integrates with the VibePro prompt optimization system.
"""

import argparse
import asyncio
import importlib.util
import json
import sys
from pathlib import Path
from typing import Any

# Add the prompt optimizer to the path
LIBS_ROOT = Path(__file__).parent.parent / "libs"
sys.path.append(str(LIBS_ROOT))

# Prefer a PEP8-friendly module directory name; fall back to the
# generated hyphenated layout for backwards compatibility.
PROMPT_OPTIMIZER_ROOT = LIBS_ROOT / "prompt_optimizer"
if not PROMPT_OPTIMIZER_ROOT.exists():
    PROMPT_OPTIMIZER_ROOT = LIBS_ROOT / "prompt-optimizer"

if PROMPT_OPTIMIZER_ROOT.exists():
    spec = importlib.util.spec_from_file_location(
        "prompt_optimizer",
        PROMPT_OPTIMIZER_ROOT / "__init__.py",
        submodule_search_locations=[str(PROMPT_OPTIMIZER_ROOT)],
    )
    if spec and spec.loader:
        module = importlib.util.module_from_spec(spec)
        sys.modules["prompt_optimizer"] = module
        spec.loader.exec_module(module)

from prompt_optimizer.application.use_cases import (  # noqa: E402
    AnalyzePromptCommand,
    AnalyzePromptUseCase,
    OptimizePromptCommand,
    OptimizePromptUseCase,
)
from prompt_optimizer.domain.entities import ModelType, OptimizationGoal  # noqa: E402
from prompt_optimizer.domain.services import (  # noqa: E402
    PromptAnalyzer,
    PromptFeatureExtractor,
    PromptOptimizer,
)
from prompt_optimizer.infrastructure.adapters import (  # noqa: E402
    InMemoryPromptRepository,
    TiktokenAdapter,
)
from prompt_optimizer.infrastructure.temporal_db import (  # noqa: E402
    SimpleMLModelAdapter,
    SimpleNotificationAdapter,
    SledTemporalDatabaseAdapter,
)


class PromptOptimizerCLI:
    """CLI interface for the prompt optimization system."""

    def __init__(self) -> None:
        self.token_counter = TiktokenAdapter()
        self.prompt_repository = InMemoryPromptRepository()
        self.temporal_db = SledTemporalDatabaseAdapter("./data/prompt_optimizer.sled")
        self.ml_model = SimpleMLModelAdapter()
        self.notification = SimpleNotificationAdapter()

        # Domain services
        self.feature_extractor = PromptFeatureExtractor()
        self.analyzer = PromptAnalyzer(self.feature_extractor)
        self.optimizer = PromptOptimizer(self.analyzer)

        # Use cases
        self.analyze_use_case = AnalyzePromptUseCase(
            self.token_counter,
            self.prompt_repository,
            self.temporal_db,
            self.feature_extractor,
            self.analyzer,
        )

        self.optimize_use_case = OptimizePromptUseCase(
            self.analyze_use_case,
            self.ml_model,
            self.temporal_db,
            self.notification,
            self.optimizer,
        )

    async def analyze_prompt_file(self, file_path: str, model: str = "gpt-4") -> dict[str, Any]:
        """Analyze a prompt file and return detailed results."""
        try:
            with open(file_path, encoding="utf-8") as f:
                content = f.read()
        except FileNotFoundError:
            return {"error": f"File '{file_path}' not found"}
        except Exception as e:
            return {"error": f"Error reading file: {e}"}

        try:
            model_type = ModelType(model)
        except ValueError:
            model_type = ModelType.GPT_4

        command = AnalyzePromptCommand(content=content, model=model_type, store_result=True)

        try:
            prompt = await self.analyze_use_case.execute(command)

            return {
                "file": file_path,
                "analysis": {
                    "token_count": {
                        "total": prompt.token_count.total_tokens if prompt.token_count else 0,
                        "model": prompt.token_count.model.value if prompt.token_count else model,
                        "estimated_cost": prompt.token_count.estimated_cost
                        if prompt.token_count
                        else 0.0,
                        "distribution": prompt.token_count.token_distribution
                        if prompt.token_count
                        else {},
                    },
                    "effectiveness": {
                        "overall": prompt.effectiveness_score.overall_score
                        if prompt.effectiveness_score
                        else 0,
                        "clarity": prompt.effectiveness_score.clarity_score
                        if prompt.effectiveness_score
                        else 0,
                        "specificity": prompt.effectiveness_score.specificity_score
                        if prompt.effectiveness_score
                        else 0,
                        "completeness": prompt.effectiveness_score.completeness_score
                        if prompt.effectiveness_score
                        else 0,
                    },
                    "features": prompt.features.to_dict() if prompt.features else {},
                    "suggestions": prompt.optimization_suggestions,
                },
            }
        except Exception as e:
            return {"error": f"Analysis failed: {e}"}

    async def optimize_prompt_file(
        self, file_path: str, goal: str = "effectiveness", model: str = "gpt-4"
    ) -> dict[str, Any]:
        """Optimize a prompt file and return the results."""
        try:
            with open(file_path, encoding="utf-8") as f:
                content = f.read()
        except FileNotFoundError:
            return {"error": f"File '{file_path}' not found"}
        except Exception as e:
            return {"error": f"Error reading file: {e}"}

        try:
            optimization_goal = OptimizationGoal(goal)
        except ValueError:
            optimization_goal = OptimizationGoal.EFFECTIVENESS

        try:
            model_type = ModelType(model)
        except ValueError:
            model_type = ModelType.GPT_4

        command = OptimizePromptCommand(
            content=content, goal=optimization_goal, model=model_type, use_ml_suggestions=True
        )

        try:
            result = await self.optimize_use_case.execute(command)

            return {
                "file": file_path,
                "optimization": {
                    "goal": result.optimization_goal.value,
                    "original_content": result.original_prompt.content,
                    "optimized_content": result.optimized_content,
                    "improvements": result.improvements,
                    "token_savings": result.token_savings,
                    "effectiveness_improvement": result.effectiveness_improvement,
                    "confidence": result.confidence_score,
                    "alternatives": result.alternative_versions,
                },
            }
        except Exception as e:
            return {"error": f"Optimization failed: {e}"}


def format_output(data: dict[str, Any], format_type: str = "human") -> str:
    """Format output based on the requested format."""
    if format_type == "json":
        return json.dumps(data, indent=2, ensure_ascii=False)

    if "error" in data:
        return f"❌ Error: {data['error']}"

    if "analysis" in data:
        analysis = data["analysis"]
        token_info = analysis["token_count"]
        effectiveness = analysis["effectiveness"]

        output: list[str] = [
            f"📄 File: {data['file']}",
            "",
            "🔢 Token Analysis:",
            f"  • Total tokens: {token_info['total']:,}",
            f"  • Model: {token_info['model']}",
            f"  • Estimated cost: ${token_info['estimated_cost']:.4f}",
            f"  • Token distribution: {token_info['distribution']}",
            "",
            "📊 Effectiveness Scores:",
            f"  • Overall: {effectiveness['overall']:.1f}/100",
            f"  • Clarity: {effectiveness['clarity']:.1f}/100",
            f"  • Specificity: {effectiveness['specificity']:.1f}/100",
            f"  • Completeness: {effectiveness['completeness']:.1f}/100",
        ]

        if analysis.get("suggestions"):
            output.extend(
                [
                    "",
                    "💡 Optimization Suggestions:",
                ]
            )
            for suggestion in analysis["suggestions"]:
                output.append(f"  • {suggestion}")

        return "\n".join(output)

    if "optimization" in data:
        opt = data["optimization"]

        output = [
            f"📄 File: {data['file']}",
            f"🎯 Goal: {opt['goal']}",
            "",
            "📈 Results:",
            f"  • Token savings: {opt['token_savings']:,}",
            f"  • Effectiveness improvement: {opt['effectiveness_improvement']:+.1f}",
            f"  • Confidence: {opt['confidence']:.0%}",
            "",
            "✨ Optimized Content:",
            "─" * 50,
            opt["optimized_content"],
            "─" * 50,
        ]

        if opt.get("improvements"):
            output.extend(
                [
                    "",
                    "🔧 Applied Improvements:",
                ]
            )
            for improvement in opt["improvements"]:
                output.append(f"  • {improvement}")

        return "\n".join(output)

    return str(data)


async def main() -> None:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Enhanced token counter with ML-powered prompt optimization",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Analyze a prompt file
  python measure_tokens_enhanced.py analyze prompt.txt

  # Optimize for clarity
  python measure_tokens_enhanced.py optimize prompt.txt --goal clarity

  # Get JSON output
  python measure_tokens_enhanced.py analyze prompt.txt --format json

  # Use different model
  python measure_tokens_enhanced.py analyze prompt.txt --model gpt-4-turbo
""",
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Analyze command
    analyze_parser = subparsers.add_parser("analyze", help="Analyze prompt effectiveness")
    analyze_parser.add_argument("file", help="Prompt file to analyze")
    analyze_parser.add_argument(
        "--model",
        default="gpt-4",
        choices=["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo", "claude-3-opus", "claude-3-sonnet"],
        help="Model to use for token counting",
    )
    analyze_parser.add_argument(
        "--format", default="human", choices=["human", "json"], help="Output format"
    )

    # Optimize command
    optimize_parser = subparsers.add_parser("optimize", help="Optimize prompt for specific goal")
    optimize_parser.add_argument("file", help="Prompt file to optimize")
    optimize_parser.add_argument(
        "--goal",
        default="effectiveness",
        choices=["clarity", "conciseness", "effectiveness", "token_efficiency"],
        help="Optimization goal",
    )
    optimize_parser.add_argument(
        "--model",
        default="gpt-4",
        choices=["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo", "claude-3-opus", "claude-3-sonnet"],
        help="Model to use for token counting",
    )
    optimize_parser.add_argument(
        "--format", default="human", choices=["human", "json"], help="Output format"
    )

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    cli = PromptOptimizerCLI()

    try:
        if args.command == "analyze":
            result = await cli.analyze_prompt_file(args.file, args.model)
        elif args.command == "optimize":
            result = await cli.optimize_prompt_file(args.file, args.goal, args.model)
        else:
            print("Unknown command")
            return

        output = format_output(result, args.format)
        print(output)

    except KeyboardInterrupt:
        print("\n❌ Operation cancelled")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
