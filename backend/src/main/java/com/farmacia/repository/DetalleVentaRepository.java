package com.farmacia.repository;

import com.farmacia.model.DetalleVenta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DetalleVentaRepository extends JpaRepository<DetalleVenta, UUID> {
    List<DetalleVenta> findByVentaId(UUID ventaId);
}
