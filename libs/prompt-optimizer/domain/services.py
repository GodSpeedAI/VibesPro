"""Domain services for prompt optimization business logic."""

from __future__ import annotations

import re

from .entities import (
    EffectivenessScore,
    OptimizationGoal,
    Prompt,
    PromptFeatures,
)


class PromptFeatureExtractor:
    """Domain service for extracting features from prompts."""

    def extract_features(self, prompt: Prompt) -> PromptFeatures:
        """Extract ML features from prompt content."""
        content = prompt.content

        # Basic structural features
        sentences = self._split_sentences(content)
        sentence_count = len(sentences)
        avg_sentence_length = (
            sum(len(s.split()) for s in sentences) / sentence_count
            if sentence_count > 0 else 0.0
        )

        # Content analysis features
        instruction_clarity = self._measure_instruction_clarity(content)
        context_completeness = self._assess_context_completeness(content)
        task_specificity = self._evaluate_task_specificity(content)

        # Advanced structural features
        role_definition = self._has_role_definition(content)
        example_count = self._count_examples(content)
        constraint_clarity = self._analyze_constraint_clarity(content)

        # Linguistic features
        readability_score = self._calculate_readability(content)
        ambiguity_score = self._detect_ambiguity(content)
        directive_strength = self._measure_directive_strength(content)

        return PromptFeatures(
            token_count=len(content.split()),  # Rough estimate, will be refined
            sentence_count=sentence_count,
            avg_sentence_length=avg_sentence_length,
            instruction_clarity=instruction_clarity,
            context_completeness=context_completeness,
            task_specificity=task_specificity,
            role_definition=role_definition,
            example_count=example_count,
            constraint_clarity=constraint_clarity,
            readability_score=readability_score,
            ambiguity_score=ambiguity_score,
            directive_strength=directive_strength,
        )

    def _split_sentences(self, text: str) -> list[str]:
        """Split text into sentences."""
        # Simple sentence splitting - could be enhanced with NLP library
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]

    def _measure_instruction_clarity(self, content: str) -> float:
        """Measure how clear the instructions are (0.0 to 1.0)."""
        clarity_indicators = [
            'please', 'must', 'should', 'need to', 'required',
            'step by step', 'clearly', 'specifically', 'exactly'
        ]

        content_lower = content.lower()
        indicator_count = sum(1 for indicator in clarity_indicators
                            if indicator in content_lower)

        # Normalize by content length and cap at 1.0
        clarity = min(indicator_count / max(len(content.split()) / 10, 1), 1.0)
        return clarity

    def _assess_context_completeness(self, content: str) -> float:
        """Assess how complete the context is (0.0 to 1.0)."""
        context_indicators = [
            'context', 'background', 'given', 'assuming', 'consider',
            'taking into account', 'based on', 'using'
        ]

        content_lower = content.lower()
        context_count = sum(1 for indicator in context_indicators
                          if indicator in content_lower)

        # Check for examples or specific details
        has_examples = any(marker in content_lower
                          for marker in ['example', 'for instance', 'such as', 'like'])

        completeness = min((context_count + (2 if has_examples else 0)) / 5, 1.0)
        return completeness

    def _evaluate_task_specificity(self, content: str) -> float:
        """Evaluate how specific the task description is (0.0 to 1.0)."""
        # Look for specific action words
        action_words = [
            'generate', 'create', 'write', 'analyze', 'summarize',
            'explain', 'describe', 'list', 'compare', 'evaluate'
        ]

        content_lower = content.lower()
        action_count = sum(1 for action in action_words
                          if action in content_lower)

        # Check for specific constraints or requirements
        constraints = [
            'format', 'length', 'style', 'tone', 'audience',
            'maximum', 'minimum', 'exactly', 'approximately'
        ]

        constraint_count = sum(1 for constraint in constraints
                             if constraint in content_lower)

        specificity = min((action_count + constraint_count) / 4, 1.0)
        return specificity

    def _has_role_definition(self, content: str) -> bool:
        """Check if the prompt defines a role for the AI."""
        role_indicators = [
            'you are', 'act as', 'assume the role', 'pretend to be',
            'imagine you are', 'as a', 'your role is'
        ]

        content_lower = content.lower()
        return any(indicator in content_lower for indicator in role_indicators)

    def _count_examples(self, content: str) -> int:
        """Count the number of examples in the prompt."""
        example_markers = [
            'example:', 'for example', 'for instance', 'such as',
            'e.g.', 'like this:', 'here\'s an example'
        ]

        content_lower = content.lower()
        return sum(content_lower.count(marker) for marker in example_markers)

    def _analyze_constraint_clarity(self, content: str) -> float:
        """Analyze how clearly constraints are specified (0.0 to 1.0)."""
        constraint_markers = [
            'must', 'should', 'cannot', 'don\'t', 'avoid',
            'ensure', 'make sure', 'remember to', 'important'
        ]

        content_lower = content.lower()
        constraint_count = sum(1 for marker in constraint_markers
                             if marker in content_lower)

        clarity = min(constraint_count / max(len(content.split()) / 20, 1), 1.0)
        return clarity

    def _calculate_readability(self, content: str) -> float:
        """Calculate readability score (0.0 to 1.0, higher is more readable)."""
        words = content.split()
        sentences = self._split_sentences(content)

        if not words or not sentences:
            return 0.0

        avg_words_per_sentence = len(words) / len(sentences)
        avg_syllables_per_word = self._estimate_syllables(words)

        # Simplified Flesch Reading Ease formula
        # Original: 206.835 - (1.015 * ASL) - (84.6 * ASW)
        # Normalized to 0-1 range
        flesch_score = max(0, 206.835 - (1.015 * avg_words_per_sentence) -
                          (84.6 * avg_syllables_per_word))

        # Normalize to 0-1 range (assuming max score of ~100)
        return min(flesch_score / 100, 1.0)

    def _estimate_syllables(self, words: list[str]) -> float:
        """Estimate average syllables per word."""
        if not words:
            return 0.0

        total_syllables = 0
        for word in words:
            # Simple syllable estimation
            word = word.lower().strip('.,!?;:"\'')
            vowels = 'aeiouy'
            syllable_count = 0
            prev_char_was_vowel = False

            for char in word:
                if char in vowels and not prev_char_was_vowel:
                    syllable_count += 1
                prev_char_was_vowel = char in vowels

            # Adjust for silent 'e'
            if word.endswith('e') and syllable_count > 1:
                syllable_count -= 1

            # Minimum one syllable per word
            syllable_count = max(1, syllable_count)
            total_syllables += syllable_count

        return total_syllables / len(words)

    def _detect_ambiguity(self, content: str) -> float:
        """Detect ambiguous language (0.0 to 1.0, higher is more ambiguous)."""
        ambiguous_words = [
            'maybe', 'perhaps', 'possibly', 'might', 'could',
            'some', 'several', 'various', 'different', 'appropriate',
            'suitable', 'relevant', 'good', 'better', 'best'
        ]

        content_lower = content.lower()
        words = content_lower.split()

        ambiguous_count = sum(1 for word in words
                            if word.strip('.,!?;:"\'') in ambiguous_words)

        ambiguity = min(ambiguous_count / max(len(words) / 10, 1), 1.0)
        return ambiguity

    def _measure_directive_strength(self, content: str) -> float:
        """Measure strength of directives (0.0 to 1.0)."""
        strong_directives = [
            'must', 'will', 'shall', 'required', 'mandatory',
            'always', 'never', 'exactly', 'precisely'
        ]

        weak_directives = [
            'should', 'could', 'might', 'try', 'consider',
            'perhaps', 'maybe', 'possibly'
        ]

        content_lower = content.lower()
        words = content_lower.split()

        strong_count = sum(1 for word in words
                         if word.strip('.,!?;:"\'') in strong_directives)
        weak_count = sum(1 for word in words
                       if word.strip('.,!?;:"\'') in weak_directives)

        if strong_count + weak_count == 0:
            return 0.5  # Neutral

        strength = strong_count / (strong_count + weak_count)
        return strength


class PromptAnalyzer:
    """Domain service for analyzing prompt effectiveness."""

    def __init__(self, feature_extractor: PromptFeatureExtractor):
        self.feature_extractor = feature_extractor

    def analyze_effectiveness(self, prompt: Prompt) -> EffectivenessScore:
        """Analyze the effectiveness of a prompt."""
        if not prompt.features:
            features = self.feature_extractor.extract_features(prompt)
            prompt.update_features(features)
        else:
            features = prompt.features

        # Calculate individual scores based on features
        clarity_score = self._calculate_clarity_score(features)
        specificity_score = self._calculate_specificity_score(features)
        completeness_score = self._calculate_completeness_score(features)

        # Calculate overall score as weighted average
        overall_score = (
            clarity_score * 0.3 +
            specificity_score * 0.4 +
            completeness_score * 0.3
        )

        return EffectivenessScore(
            overall_score=overall_score,
            clarity_score=clarity_score,
            specificity_score=specificity_score,
            completeness_score=completeness_score
        )

    def _calculate_clarity_score(self, features: PromptFeatures) -> float:
        """Calculate clarity score from features."""
        score = (
            features.instruction_clarity * 40 +
            (1 - features.ambiguity_score) * 30 +
            features.readability_score * 20 +
            features.directive_strength * 10
        )
        return score

    def _calculate_specificity_score(self, features: PromptFeatures) -> float:
        """Calculate specificity score from features."""
        score = (
            features.task_specificity * 50 +
            features.constraint_clarity * 30 +
            min(features.example_count / 3, 1.0) * 20
        )
        return score

    def _calculate_completeness_score(self, features: PromptFeatures) -> float:
        """Calculate completeness score from features."""
        role_bonus = 20.0 if features.role_definition else 0.0

        score = (
            features.context_completeness * 60 +
            role_bonus +
            min(features.sentence_count / 5, 1.0) * 20
        )
        return min(score, 100.0)


class PromptOptimizer:
    """Domain service for optimizing prompts."""

    def __init__(self, analyzer: PromptAnalyzer):
        self.analyzer = analyzer

    def generate_optimization_suggestions(
        self,
        prompt: Prompt,
        goal: OptimizationGoal
    ) -> list[str]:
        """Generate optimization suggestions based on the goal."""
        if not prompt.effectiveness_score:
            effectiveness = self.analyzer.analyze_effectiveness(prompt)
            prompt.update_effectiveness_score(effectiveness)

        suggestions: list[str] = []

        if goal == OptimizationGoal.CLARITY:
            suggestions.extend(self._clarity_suggestions(prompt))
        elif goal == OptimizationGoal.CONCISENESS:
            suggestions.extend(self._conciseness_suggestions(prompt))
        elif goal == OptimizationGoal.EFFECTIVENESS:
            suggestions.extend(self._effectiveness_suggestions(prompt))
        elif goal == OptimizationGoal.TOKEN_EFFICIENCY:
            suggestions.extend(self._token_efficiency_suggestions(prompt))

        return suggestions

    def _clarity_suggestions(self, prompt: Prompt) -> list[str]:
        """Generate clarity-focused suggestions."""
        suggestions: list[str] = []

        if not prompt.features:
            return suggestions

        if prompt.features.ambiguity_score > 0.3:
            suggestions.append(
                "Reduce ambiguous language - replace vague terms with specific ones"
            )

        if prompt.features.instruction_clarity < 0.5:
            suggestions.append(
                "Add clearer instructions using action words like 'generate', 'analyze', or 'create'"
            )

        if prompt.features.readability_score < 0.6:
            suggestions.append(
                "Simplify sentence structure for better readability"
            )

        if not prompt.features.role_definition:
            suggestions.append(
                "Consider defining a role for the AI (e.g., 'Act as a technical writer')"
            )

        return suggestions

    def _conciseness_suggestions(self, prompt: Prompt) -> list[str]:
        """Generate conciseness-focused suggestions."""
        suggestions: list[str] = []

        if not prompt.features:
            return suggestions

        if prompt.features.avg_sentence_length > 20:
            suggestions.append(
                "Break down long sentences into shorter, more focused ones"
            )

        if prompt.features.token_count > 500:
            suggestions.append(
                "Consider removing redundant information to reduce token count"
            )

        if prompt.features.sentence_count > 10:
            suggestions.append(
                "Combine related points to reduce overall length"
            )

        return suggestions

    def _effectiveness_suggestions(self, prompt: Prompt) -> list[str]:
        """Generate effectiveness-focused suggestions."""
        suggestions: list[str] = []

        if not prompt.features:
            return suggestions

        if prompt.features.task_specificity < 0.6:
            suggestions.append(
                "Be more specific about the desired output format and requirements"
            )

        if prompt.features.context_completeness < 0.5:
            suggestions.append(
                "Provide more context or background information"
            )

        if prompt.features.example_count == 0:
            suggestions.append(
                "Consider adding examples to clarify expectations"
            )

        if prompt.features.constraint_clarity < 0.4:
            suggestions.append(
                "Clearly specify constraints and limitations"
            )

        return suggestions

    def _token_efficiency_suggestions(self, prompt: Prompt) -> list[str]:
        """Generate token efficiency suggestions."""
        suggestions: list[str] = []

        if not prompt.features or not prompt.token_count:
            return suggestions

        if prompt.token_count.total_tokens > 1000:
            suggestions.append(
                "Consider splitting into multiple shorter prompts"
            )

        if prompt.features.sentence_count > 8 and prompt.features.avg_sentence_length > 15:
            suggestions.append(
                "Use bullet points or numbered lists instead of long paragraphs"
            )

        suggestions.append(
            "Remove filler words and focus on essential information"
        )

        return suggestions
