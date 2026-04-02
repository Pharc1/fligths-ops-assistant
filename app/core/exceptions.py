"""
Domain exceptions for Flight Ops AI.

Hierarchy:
    FlightOpsError (base)
    ├── AgentError
    │   ├── AgentTimeoutError
    │   └── AgentMaxIterationsError
    ├── RagError
    │   └── RagNotInitializedError
    ├── SkillError
    │   └── SkillNotFoundError
    ├── KafkaError
    │   ├── KafkaProducerError
    │   └── KafkaConsumerError
    └── IncidentError
        └── IncidentNotFoundError
"""


class FlightOpsError(Exception):
    """Base exception for all Flight Ops AI errors."""

    def __init__(self, message: str, details: dict | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details or {}

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(message={self.message!r}, details={self.details})"


# ── Agent ─────────────────────────────────────────────────────────────────────

class AgentError(FlightOpsError):
    """Raised when the LangChain agent encounters an unrecoverable error."""


class AgentTimeoutError(AgentError):
    """Raised when the agent exceeds the allowed execution time."""


class AgentMaxIterationsError(AgentError):
    """Raised when the agent exceeds the maximum number of tool call iterations."""


# ── RAG ───────────────────────────────────────────────────────────────────────

class RagError(FlightOpsError):
    """Raised when a RAG operation fails."""


class RagNotInitializedError(RagError):
    """Raised when the vector store has not been populated yet."""


# ── Skills ────────────────────────────────────────────────────────────────────

class SkillError(FlightOpsError):
    """Raised for skill system errors."""


class SkillNotFoundError(SkillError):
    """Raised when a requested skill does not exist in the registry."""


# ── Kafka ─────────────────────────────────────────────────────────────────────

class KafkaError(FlightOpsError):
    """Raised for Kafka connectivity or serialization errors."""


class KafkaProducerError(KafkaError):
    """Raised when publishing to a Kafka topic fails."""


class KafkaConsumerError(KafkaError):
    """Raised when consuming from a Kafka topic fails."""


# ── Incidents ─────────────────────────────────────────────────────────────────

class IncidentError(FlightOpsError):
    """Raised for incident business logic errors."""


class IncidentNotFoundError(IncidentError):
    """Raised when an incident ID does not exist."""
