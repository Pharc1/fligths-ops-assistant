package com.flightops.backend.kafka;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class KafkaProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public void publishIncidentCreated(String IncidentID, String payload) {
        kafkaTemplate.send("incident.created", IncidentID, payload);
    }
}