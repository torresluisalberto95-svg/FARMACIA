package com.farmacia.repository;

import com.farmacia.model.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProveedorRepository extends JpaRepository<Proveedor, UUID> {
    List<Proveedor> findAllByOrderByNombreAsc();
}
