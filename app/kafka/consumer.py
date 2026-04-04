import json
import threading

from kafka import KafkaConsumer as KafkaClient

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)


class IncidentKafkaConsumer:
    def __init__(self, agent_service, kafka_producer):
        self._agent_service = agent_service
        self._kafka_producer = kafka_producer
        self._consumer = KafkaClient(
            settings.KAFKA_TOPIC_INCIDENT_CREATED,
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            group_id=settings.KAFKA_CONSUMER_GROUP_ID,
            auto_offset_reset=settings.KAFKA_AUTO_OFFSET_RESET,
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        )

    def start(self) -> None:
        """Lance le consumer dans un thread background — non bloquant."""
        thread = threading.Thread(target=self._consume_loop, daemon=True)
        thread.start()
        logger.info("Kafka consumer started on topic=%s", settings.KAFKA_TOPIC_INCIDENT_CREATED)

    def _consume_loop(self) -> None:
        for message in self._consumer:
            try:
                self._handle(message.value)
            except Exception as exc:
                logger.error("Failed to handle Kafka message: %s", exc)

    def _handle(self, payload: dict) -> None:
        incident_id = payload.get("id")
        description = payload.get("description")
        flight_id = payload.get("flightId")
        aircraft = payload.get("aircraft")
        severity = payload.get("severity")

        if not incident_id or not description:
            logger.warning("Incomplete payload received: %s", payload)
            return

        logger.info("Processing incident_id=%s", incident_id)

        from app.core.prompts import build_incident_input
        import asyncio

        query = build_incident_input(
            flight_id=flight_id or "unknown",
            aircraft=aircraft or "unknown",
            severity=severity or "MEDIUM",
            description=description,
        )

        result = asyncio.run(self._agent_service.run(query))

        self._kafka_producer.publish_incident_processed(
            incident_id=incident_id,
            diagnosis=result,
        )
        logger.info("incident.processed published for incident_id=%s", incident_id)
