package com.farmacia.repository;

import com.farmacia.model.Caja;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CajaRepository extends JpaRepository<Caja, UUID> {
    Optional<Caja> findByUsuarioIdAndEstado(UUID usuarioId, String estado);
    List<Caja> findTop10ByUsuarioIdOrderByAbiertaAtDesc(UUID usuarioId);
    List<Caja> findTop10ByOrderByAbiertaAtDesc();
}
