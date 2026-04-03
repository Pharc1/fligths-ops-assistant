package com.flightops.backend.controller;

import com.flightops.backend.domain.Incident;
import com.flightops.backend.dto.CreateIncidentRequest;
import com.flightops.backend.dto.IncidentResponse;
import com.flightops.backend.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService service;

    private IncidentResponse toResponse(Incident incident) {
    return IncidentResponse.builder()
            .id(incident.getId())
            .flightId(incident.getFlightId())
            .aircraft(incident.getAircraft())
            .pilotId(incident.getPilotId())
            .severity(incident.getSeverity())
            .description(incident.getDescription())
            .status(incident.getStatus())
            .analysis(incident.getAnalysis())
            .createdAt(incident.getCreatedAt())
            .processedAt(incident.getProcessedAt())
            .build();
    }


    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IncidentResponse create(@Valid @RequestBody CreateIncidentRequest request) {
        Incident incident = service.createIncident(
                request.getFlightId(),
                request.getAircraft(),
                request.getPilotId(),
                request.getSeverity(),
                request.getDescription()
        );
        return toResponse(incident);
    }


    @GetMapping
    public List<IncidentResponse> findAll() {
        return service.findAll().stream()
                .map(this::toResponse)
                .toList();
    }


    @GetMapping("/{id}")
    public IncidentResponse findById(@PathVariable String id) {
        return toResponse(service.findById(id));
    }

}


