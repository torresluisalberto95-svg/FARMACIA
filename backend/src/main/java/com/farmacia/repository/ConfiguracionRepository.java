package com.farmacia.repository;

import com.farmacia.model.Configuracion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ConfiguracionRepository extends JpaRepository<Configuracion, UUID> {
    Optional<Configuracion> findBySingletonTrue();
}
