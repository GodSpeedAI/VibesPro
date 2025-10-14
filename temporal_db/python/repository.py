# temporal_db/python/repository.py
"""
Python repository interface for the temporal database.

This provides a Python interface to the Rust-based temporal database implementation.
For now, it creates a JSON file-based implementation that mirrors the Rust interface.
In the future, this could be replaced with PyO3 bindings to the Rust implementation.
"""

import json
import sqlite3
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from .types import (
    ArchitecturalPattern,
    ChangeType,
    PatternRecommendation,
    PatternType,
    SpecificationChange,
    SpecificationRecord,
    SpecificationType,
)


class TemporalRepository:
    """Python interface to the temporal database."""

    def __init__(self, db_path: str):
        """Initialize the temporal repository."""
        self.db_path = db_path
        self.db_file = Path(db_path).with_suffix(".sqlite")
        self.connection: sqlite3.Connection | None = None

    async def initialize(self) -> None:
        """Initialize the temporal database."""
        # For now, use SQLite as a simple implementation
        # In the future, this could use PyO3 bindings to the Rust sled implementation
        self.connection = sqlite3.connect(str(self.db_file))
        self.connection.row_factory = sqlite3.Row

        # Create tables
        await self._create_tables()

    async def _create_tables(self) -> None:
        """Create database tables."""
        if not self.connection:
            raise RuntimeError("Database not initialized")

        cursor = self.connection.cursor()

        # Specifications table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS specifications (
                id TEXT PRIMARY KEY,
                spec_type TEXT NOT NULL,
                identifier TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                template_variables TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                version INTEGER NOT NULL,
                author TEXT,
                matrix_ids TEXT NOT NULL,
                metadata TEXT NOT NULL,
                hash TEXT NOT NULL
            )
        """)

        # Changes table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS changes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                spec_id TEXT NOT NULL,
                change_type TEXT NOT NULL,
                field TEXT NOT NULL,
                old_value TEXT,
                new_value TEXT NOT NULL,
                author TEXT NOT NULL,
                context TEXT NOT NULL,
                confidence REAL,
                timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Patterns table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS patterns (
                id TEXT PRIMARY KEY,
                pattern_name TEXT NOT NULL,
                pattern_type TEXT NOT NULL,
                context_similarity REAL NOT NULL,
                usage_frequency INTEGER NOT NULL,
                success_rate REAL,
                last_used TEXT,
                pattern_definition TEXT NOT NULL,
                examples TEXT NOT NULL,
                metadata TEXT NOT NULL,
                timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pattern_recommendations (
                id TEXT PRIMARY KEY,
                pattern_name TEXT NOT NULL,
                decision_point TEXT NOT NULL,
                confidence REAL NOT NULL,
                provenance TEXT NOT NULL,
                rationale TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                metadata TEXT NOT NULL
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS recommendation_feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recommendation_id TEXT NOT NULL,
                action TEXT NOT NULL,
                reason TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Index frequently queried columns for performance as data grows
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_pattern_recommendations_created_at
            ON pattern_recommendations (created_at)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_pattern_recommendations_expires_at
            ON pattern_recommendations (expires_at)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_recommendation_id
            ON recommendation_feedback (recommendation_id)
        """)

        self.connection.commit()

    async def store_specification(self, spec: SpecificationRecord) -> None:
        """Store a specification record."""
        if not self.connection:
            raise RuntimeError("Database not initialized")

        # Validate data before INSERT
        self._validate_specification(spec)

        cursor = self.connection.cursor()

        # Store specification
        cursor.execute(
            """
            INSERT OR REPLACE INTO specifications
            (id, spec_type, identifier, title, content, template_variables,
             timestamp, version, author, matrix_ids, metadata, hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                spec.id,
                spec.spec_type.value,
                spec.identifier,
                spec.title,
                spec.content,
                json.dumps(spec.template_variables),
                spec.timestamp.isoformat(),
                spec.version,
                spec.author,
                json.dumps(spec.matrix_ids),
                json.dumps(spec.metadata),
                spec.hash,
            ),
        )

        # Store change record
        change = SpecificationChange(
            spec_id=spec.identifier,
            change_type=ChangeType.CREATE,
            field="content",
            old_value=None,
            new_value=spec.content,
            author=spec.author or "unknown",
            context=spec.title,
            confidence=None,
        )

        cursor.execute(
            """
            INSERT INTO changes
            (spec_id, change_type, field, old_value, new_value, author, context, confidence)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                change.spec_id,
                change.change_type.value,
                change.field,
                change.old_value,
                change.new_value,
                change.author,
                change.context,
                change.confidence,
            ),
        )

        self.connection.commit()

    async def get_latest_specification(
        self, spec_type: str, identifier: str
    ) -> SpecificationRecord | None:
        """Get the latest version of a specification."""
        if not self.connection:
            raise RuntimeError("Database not initialized")

        cursor = self.connection.cursor()
        cursor.execute(
            """
            SELECT * FROM specifications
            WHERE spec_type = ? AND identifier = ?
            ORDER BY timestamp DESC
            LIMIT 1
        """,
            (spec_type, identifier),
        )

        row = cursor.fetchone()
        if not row:
            return None

        return SpecificationRecord(
            id=row["id"],
            spec_type=SpecificationType(row["spec_type"]),
            identifier=row["identifier"],
            title=row["title"],
            content=row["content"],
            template_variables=json.loads(row["template_variables"]),
            timestamp=datetime.fromisoformat(row["timestamp"]),
            version=row["version"],
            author=row["author"],
            matrix_ids=json.loads(row["matrix_ids"]),
            metadata=json.loads(row["metadata"]),
            hash=row["hash"],
        )

    async def store_architectural_pattern(self, pattern: ArchitecturalPattern) -> None:
        """Store an architectural pattern."""
        if not self.connection:
            raise RuntimeError("Database not initialized")

        cursor = self.connection.cursor()
        cursor.execute(
            """
            INSERT OR REPLACE INTO patterns
            (id, pattern_name, pattern_type, context_similarity, usage_frequency,
             success_rate, last_used, pattern_definition, examples, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                pattern.id,
                pattern.pattern_name,
                pattern.pattern_type.value,
                pattern.context_similarity,
                pattern.usage_frequency,
                pattern.success_rate,
                pattern.last_used.isoformat() if pattern.last_used else None,
                json.dumps(pattern.pattern_definition),
                json.dumps(pattern.examples),
                json.dumps(pattern.metadata),
            ),
        )

        self.connection.commit()

    async def get_similar_patterns(
        self,
        context: str,
        similarity_threshold: float,
        lookback_days: int,
    ) -> list[ArchitecturalPattern]:
        """Get similar architectural patterns."""
        if not self.connection:
            raise RuntimeError("Database not initialized")

        # Simple text-based similarity search
        # In production, this would use vector embeddings
        cursor = self.connection.cursor()

        # If similarity_threshold is very low, just return patterns with name/definition matching
        if similarity_threshold <= 0.1:
            cursor.execute(
                """
                SELECT * FROM patterns
                WHERE LOWER(pattern_name) LIKE LOWER(?)
                   OR LOWER(pattern_definition) LIKE LOWER(?)
                ORDER BY usage_frequency DESC
            """,
                (f"%{context}%", f"%{context}%"),
            )
        else:
            cursor.execute(
                """
                SELECT * FROM patterns
                WHERE context_similarity >= ?
                ORDER BY usage_frequency DESC
            """,
                (similarity_threshold,),
            )

        patterns = []
        for row in cursor.fetchall():
            pattern = ArchitecturalPattern(
                id=row["id"],
                pattern_name=row["pattern_name"],
                pattern_type=PatternType(row["pattern_type"]),
                context_similarity=row["context_similarity"],
                usage_frequency=row["usage_frequency"],
                success_rate=row["success_rate"],
                last_used=datetime.fromisoformat(row["last_used"]) if row["last_used"] else None,
                pattern_definition=json.loads(row["pattern_definition"]),
                examples=json.loads(row["examples"]),
                metadata=json.loads(row["metadata"]),
            )
            patterns.append(pattern)

        return patterns

    async def record_decision(
        self,
        spec_id: str,
        decision_point: str,
        selected_option: str,
        context: str,
        author: str,
        confidence: float | None = None,
    ) -> None:
        """Record a decision."""
        if not self.connection:
            raise RuntimeError("Database not initialized")

        cursor = self.connection.cursor()
        cursor.execute(
            """
            INSERT INTO changes
            (spec_id, change_type, field, new_value, author, context, confidence)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
            (
                spec_id,
                ChangeType.DECISION.value,
                decision_point,
                selected_option,
                author,
                context,
                confidence,
            ),
        )

        self.connection.commit()

    async def store_pattern_recommendation(
        self,
        recommendation: PatternRecommendation,
    ) -> None:
        """Persist a pattern recommendation."""

        if not self.connection:
            raise RuntimeError("Database not initialized")

        # Validate that datetime objects are timezone-aware
        self._validate_datetime_timezone(recommendation.created_at, "created_at")
        self._validate_datetime_timezone(recommendation.expires_at, "expires_at")

        cursor = self.connection.cursor()
        cursor.execute(
            """
            INSERT OR REPLACE INTO pattern_recommendations
            (id, pattern_name, decision_point, confidence, provenance, rationale,
             created_at, expires_at, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                recommendation.id,
                recommendation.pattern_name,
                recommendation.decision_point,
                recommendation.confidence,
                recommendation.provenance,
                recommendation.rationale,
                # created_at (ensure UTC isoformat)
                (
                    recommendation.created_at.astimezone(UTC).isoformat()
                    if recommendation.created_at.tzinfo
                    else recommendation.created_at.replace(tzinfo=UTC).isoformat()
                ),
                # expires_at (ensure UTC isoformat)
                (
                    recommendation.expires_at.astimezone(UTC).isoformat()
                    if recommendation.expires_at.tzinfo
                    else recommendation.expires_at.replace(tzinfo=UTC).isoformat()
                ),
                json.dumps(recommendation.metadata),
            ),
        )

        self.connection.commit()

    async def get_pattern_recommendations(
        self,
        limit: int = 10,
        include_expired: bool = False,
    ) -> list[PatternRecommendation]:
        """Fetch stored pattern recommendations ordered by recency."""

        if not self.connection:
            raise RuntimeError("Database not initialized")

        cursor = self.connection.cursor()
        if include_expired:
            cursor.execute(
                """
                SELECT * FROM pattern_recommendations
                ORDER BY datetime(created_at) DESC
                LIMIT ?
                """,
                (limit,),
            )
        else:
            cursor.execute(
                """
                SELECT * FROM pattern_recommendations
                WHERE datetime(expires_at) > datetime('now')
                ORDER BY datetime(created_at) DESC
                LIMIT ?
                """,
                (limit,),
            )

        recommendations: list[PatternRecommendation] = []
        for row in cursor.fetchall():
            recommendations.append(
                PatternRecommendation.from_dict(
                    {
                        "id": row["id"],
                        "pattern_name": row["pattern_name"],
                        "decision_point": row["decision_point"],
                        "confidence": row["confidence"],
                        "provenance": row["provenance"],
                        "rationale": row["rationale"],
                        "created_at": row["created_at"],
                        "expires_at": row["expires_at"],
                        "metadata": json.loads(row["metadata"]),
                    }
                )
            )

        return recommendations

    async def purge_stale_recommendations(self, retention_days: int) -> int:
        """Remove recommendations older than retention window."""

        if not self.connection:
            raise RuntimeError("Database not initialized")

        if retention_days <= 0:
            return 0

        cursor = self.connection.cursor()
        cutoff = datetime.now(UTC) - timedelta(days=retention_days)
        cursor.execute(
            """
            DELETE FROM pattern_recommendations
            WHERE datetime(created_at) < ?
            """,
            (cutoff.isoformat(),),
        )
        deleted = cursor.rowcount
        self.connection.commit()
        return deleted

    async def record_recommendation_feedback(
        self,
        recommendation_id: str,
        action: str,
        reason: str | None = None,
    ) -> PatternRecommendation | None:
        """Record feedback and adjust recommendation confidence."""

        if not self.connection:
            raise RuntimeError("Database not initialized")

        cursor = self.connection.cursor()
        cursor.execute(
            """
            INSERT INTO recommendation_feedback (recommendation_id, action, reason)
            VALUES (?, ?, ?)
            """,
            (recommendation_id, action, reason),
        )

        # Validate the action before computing confidence delta
        valid_actions = {"accept", "dismiss"}
        if action not in valid_actions:
            raise ValueError(f"Invalid action: {action}. Must be one of {valid_actions}")

        # Since we've validated the action, we can safely use a simple conditional
        delta = 0.1 if action == "accept" else -0.15
        cursor.execute(
            """
            SELECT * FROM pattern_recommendations
            WHERE id = ?
            """,
            (recommendation_id,),
        )
        row = cursor.fetchone()
        if not row:
            self.connection.commit()
            return None

        recommendation = PatternRecommendation.from_dict(
            {
                "id": row["id"],
                "pattern_name": row["pattern_name"],
                "decision_point": row["decision_point"],
                "confidence": row["confidence"],
                "provenance": row["provenance"],
                "rationale": row["rationale"],
                "created_at": row["created_at"],
                "expires_at": row["expires_at"],
                "metadata": json.loads(row["metadata"]),
            }
        )

        updated = recommendation.with_adjusted_confidence(delta)
        cursor.execute(
            """
            UPDATE pattern_recommendations
            SET confidence = ?, metadata = ?
            WHERE id = ?
            """,
            (
                updated.confidence,
                json.dumps(
                    {
                        **updated.metadata,
                        "last_feedback": action,
                        "last_feedback_reason": reason,
                        "last_feedback_at": datetime.now(UTC).isoformat(),
                    }
                ),
                updated.id,
            ),
        )

        self.connection.commit()
        return updated

    async def get_recent_specifications(
        self,
        limit: int = 20,
        spec_type: SpecificationType | None = None,
    ) -> list[SpecificationRecord]:
        """Return the most recent specification entries."""

        if not self.connection:
            raise RuntimeError("Database not initialized")

        cursor = self.connection.cursor()
        if spec_type is None:
            cursor.execute(
                """
                SELECT * FROM specifications
                ORDER BY datetime(timestamp) DESC
                LIMIT ?
                """,
                (limit,),
            )
        else:
            cursor.execute(
                """
                SELECT * FROM specifications
                WHERE spec_type = ?
                ORDER BY datetime(timestamp) DESC
                LIMIT ?
                """,
                (spec_type.value, limit),
            )

        records: list[SpecificationRecord] = []
        for row in cursor.fetchall():
            records.append(
                SpecificationRecord(
                    id=row["id"],
                    spec_type=SpecificationType(row["spec_type"]),
                    identifier=row["identifier"],
                    title=row["title"],
                    content=row["content"],
                    template_variables=json.loads(row["template_variables"]),
                    timestamp=datetime.fromisoformat(row["timestamp"]),
                    version=row["version"],
                    author=row["author"],
                    matrix_ids=json.loads(row["matrix_ids"]),
                    metadata=json.loads(row["metadata"]),
                    hash=row["hash"],
                )
            )

        return records

    async def analyze_decision_patterns(self, lookback_days: int) -> list[dict[str, Any]]:
        """Analyze decision patterns."""
        if not self.connection:
            raise RuntimeError("Database not initialized")

        cursor = self.connection.cursor()
        cursor.execute(
            """
            SELECT field as decision_point,
                   COUNT(*) as total_decisions,
                   SUM(CASE WHEN confidence > 0.7 THEN 1 ELSE 0 END) as selected_count,
                   GROUP_CONCAT(DISTINCT substr(spec_id, 1, 3)) as spec_types,
                   GROUP_CONCAT(context) as contexts
            FROM changes
            WHERE change_type = ?
              AND datetime(timestamp) > datetime('now', '-' || ? || ' days')
            GROUP BY field
        """,
            (ChangeType.DECISION.value, lookback_days),
        )

        patterns = []
        for row in cursor.fetchall():
            pattern = {
                "decision_point": row["decision_point"],
                "spec_type": row["spec_types"].split(",")[0] if row["spec_types"] else "unknown",
                "total_decisions": row["total_decisions"],
                "selected_count": row["selected_count"],
                "contexts": row["contexts"].split(",") if row["contexts"] else [],
            }
            patterns.append(pattern)

        return patterns

    def _validate_datetime_timezone(self, dt: datetime, field_name: str) -> None:
        """Validate that a datetime object is timezone-aware."""
        if dt.tzinfo is None:
            raise ValueError(f"DateTime field '{field_name}' must be timezone-aware")

    def _validate_specification(self, spec: SpecificationRecord) -> None:
        """Validate a specification record before storing."""
        if not spec.id:
            raise ValueError("Specification ID cannot be empty")
        if not spec.identifier:
            raise ValueError("Specification identifier cannot be empty")
        if not spec.title:
            raise ValueError("Specification title cannot be empty")
        if not spec.content:
            raise ValueError("Specification content cannot be empty")
        if spec.version < 1:
            raise ValueError("Specification version must be at least 1")

        # Validate timestamp is timezone-aware
        self._validate_datetime_timezone(spec.timestamp, "timestamp")

    async def close(self) -> None:
        """Close the database connection."""
        if self.connection:
            self.connection.close()
            self.connection = None


# Convenience function for easy initialization
async def initialize_temporal_database(db_path: str) -> TemporalRepository:
    """Initialize a temporal database repository."""
    repo = TemporalRepository(db_path)
    await repo.initialize()
    return repo
