package com.farmacia.repository;

import com.farmacia.model.DetalleVenta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DetalleVentaRepository extends JpaRepository<DetalleVenta, UUID> {
    List<DetalleVenta> findByVentaId(UUID ventaId);
    boolean existsByProductoId(UUID productoId);

    @org.springframework.data.jpa.repository.Query(value =
        "SELECT p.nombre, SUM(d.cantidad) AS total_cantidad, SUM(d.subtotal) AS total_valor " +
        "FROM detalle_ventas d JOIN productos p ON p.id = d.producto_id " +
        "GROUP BY p.nombre ORDER BY total_cantidad DESC LIMIT 20",
        nativeQuery = true)
    java.util.List<Object[]> findTop20Productos();
}
