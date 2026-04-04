import json

from kafka import KafkaProducer as KafkaClient

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)


class IncidentKafkaProducer:
    def __init__(self):
        self._producer = KafkaClient(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )

    def publish_incident_processed(self, incident_id: str, diagnosis: str) -> None:
        payload = {
            "incident_id": incident_id,
            "diagnosis": diagnosis,
        }
        self._producer.send(settings.KAFKA_TOPIC_INCIDENT_PROCESSED, value=payload)
        self._producer.flush()
        logger.info("Published incident.processed for incident_id=%s", incident_id)
