package com.flightops.backend.service;

import com.flightops.backend.domain.Incident;
import com.flightops.backend.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentRepository repository;


    public Incident createIncident(String flightId, String aircraft, String pilotId, String severity, String description, String status, String analysis) {
        Incident incident = Incident.builder()
                .id(UUID.randomUUID().toString())
                .flightId(flightId)
                .aircraft(aircraft)
                .pilotId(pilotId)
                .severity(severity)
                .description(description)
                .status("PENDING")
                .analysis(analysis)
                .createdAt(Instant.now())
                .build();
        return repository.save(incident);
    }


    public List<Incident> findAll() {
        return repository.findAll();
    }

    public Incident findById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found: " + id));
    }


    public Incident updateStatus(String id, String status, String analysis) {
        Incident incident = findById(id);
        incident.setStatus(status);
        incident.setAnalysis(analysis);
        incident.setProcessedAt(Instant.now());
        return repository.save(incident);
    }

}