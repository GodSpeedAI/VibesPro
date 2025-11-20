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
from datetime import datetime
from pathlib import Path
from typing import TypedDict, cast

from prompt_optimizer.application.ports import (
    MLFeatures,
    OptimizationPattern,
    TemporalDatabasePort,
)
from prompt_optimizer.domain.entities import Prompt, PromptOptimizationSession

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

from prompt_optimizer.application.use_cases import (  # type: ignore[import-untyped] # noqa: E402
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
)


class MockTemporalDatabase(TemporalDatabasePort):
    async def store_prompt_analysis(self, prompt: Prompt, timestamp: datetime) -> None:
        pass

    async def get_similar_prompts(
        self, features: MLFeatures, similarity_threshold: float = 0.7
    ) -> list[Prompt]:
        return []

    async def get_optimization_patterns(
        self, goal: OptimizationGoal, days_back: int = 90
    ) -> list[OptimizationPattern]:
        return []

    async def store_optimization_session(self, session: PromptOptimizationSession) -> None:
        pass


class TokenCountDict(TypedDict):
    total: int
    model: str
    estimated_cost: float
    distribution: dict[str, int]


class EffectivenessDict(TypedDict):
    overall: float
    clarity: float
    specificity: float
    completeness: float


class FeaturesDict(TypedDict):
    token_count: int
    sentence_count: int
    avg_sentence_length: float
    instruction_clarity: float
    context_completeness: float
    task_specificity: float
    role_definition: bool
    example_count: int
    constraint_clarity: float
    readability_score: float
    ambiguity_score: float
    directive_strength: float


class AnalysisDict(TypedDict):
    token_count: TokenCountDict
    effectiveness: EffectivenessDict
    features: FeaturesDict
    suggestions: list[str]


class AnalysisResultDict(TypedDict):
    file: str
    analysis: AnalysisDict


class ErrorDict(TypedDict):
    error: str


class OptimizationDict(TypedDict):
    goal: str
    original_content: str
    optimized_content: str
    improvements: list[str]
    token_savings: int
    effectiveness_improvement: float
    confidence: float
    alternatives: list[str]


class OptimizationResultDict(TypedDict):
    file: str
    optimization: OptimizationDict


class PromptOptimizerCLI:
    """CLI interface for the prompt optimization system."""

    def __init__(self) -> None:
        self.token_counter = TiktokenAdapter()
        self.prompt_repository = InMemoryPromptRepository()
        self.ml_model = SimpleMLModelAdapter()
        self.notification = SimpleNotificationAdapter()
        self.temporal_db = MockTemporalDatabase()

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

    async def analyze_prompt_file(
        self, file_path: str, model: str = "gpt-4"
    ) -> AnalysisResultDict | ErrorDict:
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
                        "estimated_cost": (
                            prompt.token_count.estimated_cost if prompt.token_count else 0.0
                        ),
                        "distribution": (
                            prompt.token_count.token_distribution if prompt.token_count else {}
                        ),
                    },
                    "effectiveness": {
                        "overall": (
                            prompt.effectiveness_score.overall_score
                            if prompt.effectiveness_score
                            else 0.0
                        ),
                        "clarity": (
                            prompt.effectiveness_score.clarity_score
                            if prompt.effectiveness_score
                            else 0.0
                        ),
                        "specificity": (
                            prompt.effectiveness_score.specificity_score
                            if prompt.effectiveness_score
                            else 0.0
                        ),
                        "completeness": (
                            prompt.effectiveness_score.completeness_score
                            if prompt.effectiveness_score
                            else 0.0
                        ),
                    },
                    "features": cast(FeaturesDict, prompt.features.to_dict())
                    if prompt.features
                    else {
                        "token_count": 0,
                        "sentence_count": 0,
                        "avg_sentence_length": 0.0,
                        "instruction_clarity": 0.0,
                        "context_completeness": 0.0,
                        "task_specificity": 0.0,
                        "role_definition": False,
                        "example_count": 0,
                        "constraint_clarity": 0.0,
                        "readability_score": 0.0,
                        "ambiguity_score": 0.0,
                        "directive_strength": 0.0,
                    },
                    "suggestions": prompt.optimization_suggestions,
                },
            }
        except Exception as e:
            return {"error": f"Analysis failed: {e}"}

    async def optimize_prompt_file(
        self, file_path: str, goal: str = "effectiveness", model: str = "gpt-4"
    ) -> OptimizationResultDict | ErrorDict:
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

            optimization_data: OptimizationDict = {
                "goal": result.optimization_goal.value,
                "original_content": result.original_prompt.content,
                "optimized_content": result.optimized_content,
                "improvements": result.improvements,
                "token_savings": result.token_savings,
                "effectiveness_improvement": result.effectiveness_improvement,
                "confidence": result.confidence_score,
                "alternatives": result.alternative_versions,
            }
            return {"file": file_path, "optimization": optimization_data}
        except Exception as e:
            return {"error": f"Optimization failed: {e}"}


def format_output(
    data: AnalysisResultDict | OptimizationResultDict | ErrorDict,
    format_type: str = "human",
) -> str:
    """Format output based on the requested format."""
    if format_type == "json":
        return json.dumps(data, indent=2, ensure_ascii=False)

    if "error" in data:
        error_data = cast(ErrorDict, data)
        return f"❌ Error: {error_data['error']}"
    elif "analysis" in data:
        analysis_data = cast(AnalysisResultDict, data)
        analysis = analysis_data["analysis"]
        token_info = analysis["token_count"]
        effectiveness = analysis["effectiveness"]

        output: list[str] = [
            f"📄 File: {analysis_data['file']}",
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
    elif "optimization" in data:
        optimization_data = cast(OptimizationResultDict, data)
        opt = optimization_data["optimization"]

        output = [
            f"📄 File: {optimization_data['file']}",
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
    else:
        return ""


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
    result: AnalysisResultDict | OptimizationResultDict | ErrorDict

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
