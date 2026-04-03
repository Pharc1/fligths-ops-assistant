package com.flightops.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class IncidentResponse {

    private String id;
    private String flightId;
    private String aircraft;
    private String pilotId;
    private String severity;
    private String description;
    private String status;
    private String analysis;
    private Instant createdAt;
    private Instant processedAt;
}