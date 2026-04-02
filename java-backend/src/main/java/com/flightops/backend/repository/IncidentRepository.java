package com.flightops.backend.repository;

import com.flightops.backend.domain.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface IncidentRepository extends JpaRepository<Incident, String> {

}