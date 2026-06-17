package com.farmacia.controller;

import com.farmacia.model.Proveedor;
import com.farmacia.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/proveedores")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ProveedorController {

    private final ProveedorRepository repository;

    @GetMapping
    public List<Proveedor> listar() {
        return repository.findAllByOrderByNombreAsc();
    }

    @PostMapping
    public ResponseEntity<Proveedor> crear(@RequestBody Proveedor proveedor) {
        return ResponseEntity.ok(repository.save(proveedor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Proveedor> actualizar(@PathVariable UUID id, @RequestBody Proveedor payload) {
        return repository.findById(id).map(p -> {
            p.setNit(payload.getNit());
            p.setNombre(payload.getNombre());
            p.setTelefono(payload.getTelefono());
            p.setDireccion(payload.getDireccion());
            p.setCorreo(payload.getCorreo());
            return ResponseEntity.ok(repository.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable UUID id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
