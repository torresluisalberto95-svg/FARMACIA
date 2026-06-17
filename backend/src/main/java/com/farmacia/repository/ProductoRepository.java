package com.farmacia.repository;

import com.farmacia.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductoRepository extends JpaRepository<Producto, UUID> {
    List<Producto> findAllByOrderByNombreAsc();
    List<Producto> findByActivoTrueAndStockGreaterThanOrderByNombreAsc(int stock);
    Optional<Producto> findByCodigo(String codigo);
    boolean existsByCodigo(String codigo);
    List<Producto> findByStockLessThanEqualOrderByNombreAsc(int stockMinimo);

    @Query("SELECT COALESCE(SUM(p.stock * p.precioVenta), 0) FROM Producto p WHERE p.activo = true")
    BigDecimal valorTotalInventario();

    @Query("SELECT p FROM Producto p WHERE p.activo = true AND p.stock <= p.stockMinimo ORDER BY p.stock ASC")
    List<Producto> findBajoStock();

    @Query("SELECT p FROM Producto p WHERE p.activo = true AND p.fechaVencimiento IS NOT NULL AND p.fechaVencimiento <= :hasta ORDER BY p.fechaVencimiento ASC")
    List<Producto> findProximosAVencer(@org.springframework.data.repository.query.Param("hasta") java.time.LocalDate hasta);
}
