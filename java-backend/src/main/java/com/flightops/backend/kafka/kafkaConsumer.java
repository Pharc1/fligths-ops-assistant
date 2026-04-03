package com.flightops.backend.kafka;


import com.flightops.backend.service.IncidentService;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
@RequiredArgsConstructor
public class KafkaConsumer {

    private final IncidentService incidentService;

    @KafkaListener(topics = "incident.processed", groupId = "flight-ops-backend-group")
    public void handleIncidentProcessed(String message) {
        try { 
            JsonNode json = new ObjectMapper().readTree(message);
        
        String incidentId = json.get("incident_id").asText();
        String analysis = json.get("diagnosis").asText();
        
        incidentService.updateStatus(incidentId, "COMPLETED", analysis);
    } catch (Exception e) {
        System.err.println("Failed to process Kafka message: " + e.getMessage());
    }

    }

}
