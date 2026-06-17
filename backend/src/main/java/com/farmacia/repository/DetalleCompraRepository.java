package com.farmacia.repository;

import com.farmacia.model.DetalleCompra;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DetalleCompraRepository extends JpaRepository<DetalleCompra, UUID> {
    List<DetalleCompra> findByCompraId(UUID compraId);
    boolean existsByProductoId(UUID productoId);
}
