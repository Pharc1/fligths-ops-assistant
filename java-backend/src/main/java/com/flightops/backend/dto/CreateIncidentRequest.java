package com.flightops.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreateIncidentRequest {

    @NotBlank
    private String flightId;

    @NotBlank
    private String aircraft;

    @NotBlank
    private String pilotId;

    @Pattern(regexp = "LOW|MEDIUM|HIGH|CRITICAL")
    private String severity;

    @NotBlank
    private String description;
}