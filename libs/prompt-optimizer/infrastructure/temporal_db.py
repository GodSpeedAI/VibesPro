"""Temporal database adapters using sled instead of tsink."""

from __future__ import annotations
import json
from datetime import datetime, timezone, timedelta
from typing import Optional, Any
from uuid import uuid4

from ..application.ports import TemporalDatabasePort, MLModelPort, NotificationPort
from ..domain.entities import (
    Prompt, PromptOptimizationSession, OptimizationGoal, 
    FeedbackRecord, OptimizationResult, ModelType
)


class SledTemporalDatabaseAdapter(TemporalDatabasePort):
    """Sled-based temporal database adapter for storing prompt analysis data."""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._db: Any = None  # Type depends on whether sled is available
        self._initialized = False
    
    async def _ensure_initialized(self) -> None:
        """Ensure the database is initialized."""
        if self._initialized:
            return
        
        try:
            # Import sled bindings (assuming Python bindings exist)
            import sled  # type: ignore
            self._db = sled.open(self.db_path)  # type: ignore
            self._initialized = True
        except ImportError:
            # Fallback to file-based storage if sled bindings not available
            import os
            os.makedirs(self.db_path, exist_ok=True)
            self._db = self.db_path
            self._initialized = True
    
    async def store_prompt_analysis(
        self, 
        prompt: Prompt, 
        timestamp: datetime
    ) -> None:
        """Store prompt analysis results in temporal database."""
        await self._ensure_initialized()
        
        # Create a temporal record
        record: dict[str, Any] = {
            "id": str(prompt.id),
            "content": prompt.content,
            "timestamp": timestamp.isoformat(),
            "features": prompt.features.to_dict() if prompt.features else None,
            "token_count": {
                "total_tokens": prompt.token_count.total_tokens,
                "model": prompt.token_count.model.value,
                "estimated_cost": prompt.token_count.estimated_cost,
                "token_distribution": prompt.token_count.token_distribution
            } if prompt.token_count else None,
            "effectiveness_score": {
                "overall_score": prompt.effectiveness_score.overall_score,
                "clarity_score": prompt.effectiveness_score.clarity_score,
                "specificity_score": prompt.effectiveness_score.specificity_score,
                "completeness_score": prompt.effectiveness_score.completeness_score
            } if prompt.effectiveness_score else None,
            "optimization_suggestions": prompt.optimization_suggestions,
            "metadata": prompt.metadata
        }
        
        # Store with timestamp-based key for temporal ordering
        key = f"prompt_analysis:{timestamp.isoformat()}:{prompt.id}"
        await self._store_record(key, record)
    
    async def store_optimization_session(
        self, 
        session: PromptOptimizationSession
    ) -> None:
        """Store optimization session data."""
        await self._ensure_initialized()
        
        session_record: dict[str, Any] = {
            "id": str(session.id),
            "optimization_goal": session.optimization_goal.value,
            "target_model": session.target_model.value,
            "started_at": session.started_at.isoformat(),
            "completed_at": session.completed_at.isoformat() if session.completed_at else None,
            "prompt_ids": [str(p.id) for p in session.prompts],
            "result_count": len(session.results)
        }
        
        key = f"optimization_session:{session.started_at.isoformat()}:{session.id}"
        await self._store_record(key, session_record)
    
    async def get_similar_prompts(
        self, 
        features: dict[str, Any], 
        similarity_threshold: float = 0.7
    ) -> list[Prompt]:
        """Find similar prompts based on features."""
        await self._ensure_initialized()
        
        # This is a simplified similarity search
        # In a real implementation, you'd use vector similarity
        similar_prompts: list[Prompt] = []
        
        # Get recent prompt analyses
        recent_records = await self._get_recent_records("prompt_analysis", days=90)
        
        for record in recent_records:
            if record.get("features"):
                similarity = self._calculate_feature_similarity(features, record["features"])
                if similarity >= similarity_threshold:
                    prompt = self._deserialize_prompt_from_record(record)
                    if prompt:
                        similar_prompts.append(prompt)
        
        return similar_prompts[:10]  # Limit results
    
    async def get_optimization_patterns(
        self, 
        goal: OptimizationGoal, 
        days_back: int = 90
    ) -> list[dict[str, Any]]:
        """Get optimization patterns from historical data."""
        await self._ensure_initialized()
        
        patterns: list[dict[str, Any]] = []
        
        # Get recent optimization sessions
        sessions = await self._get_recent_records("optimization_session", days=days_back)
        
        # Group by optimization goal
        goal_sessions = [s for s in sessions if s.get("optimization_goal") == goal.value]
        
        if goal_sessions:
            # Analyze patterns (simplified)
            patterns.append({
                "goal": goal.value,
                "session_count": len(goal_sessions),
                "avg_prompts_per_session": sum(s.get("result_count", 0) for s in goal_sessions) / len(goal_sessions),
                "most_common_model": self._get_most_common_model(goal_sessions),
                "success_rate": 0.8,  # Would calculate from actual feedback
                "common_improvements": [
                    "Reduced token count",
                    "Improved clarity",
                    "Better structure"
                ]
            })
        
        return patterns
    
    async def _store_record(self, key: str, record: dict[str, Any]) -> None:
        """Store a record in the database."""
        if isinstance(self._db, str):
            # File-based fallback
            import os
            file_path = os.path.join(self._db, f"{key.replace(':', '_')}.json")
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(record, f, indent=2, ensure_ascii=False)
        else:
            # Sled database
            record_bytes = json.dumps(record).encode('utf-8')
            self._db.insert(key.encode('utf-8'), record_bytes)  # type: ignore
    
    async def _get_recent_records(self, prefix: str, days: int) -> list[dict[str, Any]]:
        """Get recent records with the given prefix."""
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        records: list[dict[str, Any]] = []
        
        if isinstance(self._db, str):
            # File-based fallback
            import os
            import glob
            
            pattern = os.path.join(self._db, f"{prefix}_*.json")
            files = glob.glob(pattern)
            
            for file_path in files:
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        record = json.load(f)
                    
                    # Check if record is recent enough
                    record_time = datetime.fromisoformat(record.get("timestamp", record.get("started_at", "")))
                    if record_time >= cutoff_date:
                        records.append(record)
                        
                except (json.JSONDecodeError, ValueError, KeyError):
                    continue
        else:
            # Sled database
            prefix_bytes = prefix.encode('utf-8')
            for item in self._db.scan_prefix(prefix_bytes):  # type: ignore
                try:
                    key_bytes, value_bytes = item  # type: ignore
                    record = json.loads(value_bytes.decode('utf-8'))  # type: ignore
                    
                    # Check if record is recent enough
                    record_time = datetime.fromisoformat(record.get("timestamp", record.get("started_at", "")))
                    if record_time >= cutoff_date:
                        records.append(record)
                        
                except (json.JSONDecodeError, ValueError, KeyError):
                    continue
        
        # Sort by timestamp, most recent first
        records.sort(
            key=lambda r: datetime.fromisoformat(r.get("timestamp", r.get("started_at", ""))),
            reverse=True
        )
        
        return records
    
    def _calculate_feature_similarity(self, features1: dict[str, Any], features2: dict[str, Any]) -> float:
        """Calculate similarity between two feature sets."""
        # Simple cosine similarity calculation
        common_keys = set(features1.keys()) & set(features2.keys())
        if not common_keys:
            return 0.0
        
        dot_product = 0.0
        norm1 = 0.0
        norm2 = 0.0
        
        for key in common_keys:
            v1 = float(features1.get(key, 0))
            v2 = float(features2.get(key, 0))
            
            dot_product += v1 * v2
            norm1 += v1 * v1
            norm2 += v2 * v2
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 ** 0.5 * norm2 ** 0.5)
    
    def _deserialize_prompt_from_record(self, record: dict[str, Any]) -> Optional[Prompt]:
        """Deserialize a prompt from a database record."""
        from ..domain.entities import (
            PromptId, PromptFeatures, TokenCount, EffectivenessScore, ModelType
        )
        from uuid import UUID
        
        try:
            prompt_id = PromptId(UUID(record["id"]))
            created_at = datetime.fromisoformat(record["timestamp"])
            
            prompt = Prompt(
                id=prompt_id,
                content=record["content"],
                created_at=created_at,
                optimization_suggestions=record.get("optimization_suggestions", []),
                metadata=record.get("metadata", {})
            )
            
            # Restore features if present
            if record.get("features"):
                features_data = record["features"]
                features = PromptFeatures(**features_data)
                prompt.update_features(features)
            
            # Restore token count if present
            if record.get("token_count"):
                tc_data = record["token_count"]
                token_count = TokenCount(
                    total_tokens=tc_data["total_tokens"],
                    model=ModelType(tc_data["model"]),
                    estimated_cost=tc_data["estimated_cost"],
                    token_distribution=tc_data["token_distribution"]
                )
                prompt.update_token_count(token_count)
            
            # Restore effectiveness score if present
            if record.get("effectiveness_score"):
                es_data = record["effectiveness_score"]
                effectiveness = EffectivenessScore(
                    overall_score=es_data["overall_score"],
                    clarity_score=es_data["clarity_score"],
                    specificity_score=es_data["specificity_score"],
                    completeness_score=es_data["completeness_score"]
                )
                prompt.update_effectiveness_score(effectiveness)
            
            return prompt
            
        except (KeyError, ValueError, TypeError):
            return None
    
    def _get_most_common_model(self, sessions: list[dict[str, Any]]) -> str:
        """Get the most commonly used model from sessions."""
        model_counts: dict[str, int] = {}
        
        for session in sessions:
            model = session.get("target_model", "unknown")
            model_counts[model] = model_counts.get(model, 0) + 1
        
        if not model_counts:
            return "unknown"
        
        return max(model_counts.items(), key=lambda x: x[1])[0]


class SimpleMLModelAdapter(MLModelPort):
    """Simple ML model adapter for development and testing."""
    
    def __init__(self):
        self.feedback_data: list[FeedbackRecord] = []
    
    async def predict_effectiveness(self, features: dict[str, Any]) -> float:
        """Predict prompt effectiveness using simple heuristics."""
        # Simple rule-based effectiveness prediction
        score = 50.0  # Base score
        
        # Adjust based on features
        if features.get("instruction_clarity", 0) > 0.7:
            score += 15.0
        
        if features.get("task_specificity", 0) > 0.6:
            score += 10.0
        
        if features.get("context_completeness", 0) > 0.5:
            score += 10.0
        
        if features.get("ambiguity_score", 1.0) < 0.3:
            score += 10.0
        
        if features.get("role_definition", False):
            score += 5.0
        
        # Normalize to 0-100 range
        return max(0.0, min(100.0, score))
    
    async def generate_optimization_suggestions(
        self, 
        prompt_content: str, 
        goal: OptimizationGoal
    ) -> list[str]:
        """Generate optimization suggestions using simple rules."""
        suggestions: list[str] = []
        content_lower = prompt_content.lower()
        
        if goal == OptimizationGoal.CLARITY:
            if "please" not in content_lower:
                suggestions.append("Add polite language like 'please' for clearer communication")
            
            if len(prompt_content.split(".")) < 3:
                suggestions.append("Break down the prompt into clearer steps")
        
        elif goal == OptimizationGoal.CONCISENESS:
            if len(prompt_content.split()) > 100:
                suggestions.append("Consider reducing word count for better token efficiency")
            
            if "very" in content_lower or "really" in content_lower:
                suggestions.append("Remove unnecessary adverbs for conciseness")
        
        elif goal == OptimizationGoal.EFFECTIVENESS:
            if "example" not in content_lower:
                suggestions.append("Add specific examples to improve effectiveness")
            
            if not any(action in content_lower for action in ["generate", "create", "write", "analyze"]):
                suggestions.append("Use clear action verbs to specify the desired task")
        
        elif goal == OptimizationGoal.TOKEN_EFFICIENCY:
            suggestions.append("Replace verbose phrases with concise alternatives")
            suggestions.append("Use bullet points instead of long sentences")
        
        return suggestions
    
    async def learn_from_feedback(self, feedback: FeedbackRecord) -> None:
        """Store feedback for future model improvement."""
        self.feedback_data.append(feedback)
        
        # In a real implementation, this would retrain or update the model
        # For now, just store the feedback


class SimpleNotificationAdapter(NotificationPort):
    """Simple notification adapter for development."""
    
    async def notify_optimization_complete(
        self, 
        result: OptimizationResult
    ) -> None:
        """Log optimization completion."""
        print(f"✅ Optimization complete for prompt: {result.original_prompt.id}")
        print(f"   Goal: {result.optimization_goal}")
        print(f"   Token savings: {result.token_savings}")
        print(f"   Effectiveness improvement: {result.effectiveness_improvement:.1f}")
    
    async def notify_model_updated(self, model_version: str) -> None:
        """Log model update."""
        print(f"🔄 ML model updated to version: {model_version}")