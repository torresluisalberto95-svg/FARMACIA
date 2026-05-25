package com.farmacia.repository;

import com.farmacia.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductoRepository extends JpaRepository<Producto, UUID> {
    List<Producto> findAllByOrderByNombreAsc();
    List<Producto> findByActivoTrueAndStockGreaterThanOrderByNombreAsc(int stock);
    Optional<Producto> findByCodigo(String codigo);
    boolean existsByCodigo(String codigo);
    List<Producto> findByStockLessThanEqualOrderByNombreAsc(int stockMinimo);
}
