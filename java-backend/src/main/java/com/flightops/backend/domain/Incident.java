package com.flightops.backend.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;


@Entity
@Table(name= "incidents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Incident {
    @Id
    private String id;
    @Column(nullable = false)
    private String flightId;
    @Column(nullable = false)
    private String aircraft;
    @Column(nullable = false)
    private String pilotId;
    @Column(nullable = false)
    private String severity;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(nullable = false)
    private String status;
    @Column(columnDefinition = "TEXT")
    private String analysis;
    @Column(nullable = false)
    private Instant createdAt;
    private Instant processedAt;
}