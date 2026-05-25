package com.farmacia.controller;

import com.farmacia.model.Producto;
import com.farmacia.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoRepository repository;

    @GetMapping
    public List<Producto> listar() {
        return repository.findAllByOrderByNombreAsc();
    }

    @GetMapping("/disponibles")
    public List<Producto> disponibles() {
        return repository.findByActivoTrueAndStockGreaterThanOrderByNombreAsc(0);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Producto> crear(@RequestBody Producto producto) {
        if (repository.existsByCodigo(producto.getCodigo())) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(repository.save(producto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Producto> actualizar(@PathVariable UUID id, @RequestBody Producto payload) {
        return repository.findById(id).map(p -> {
            p.setCodigo(payload.getCodigo());
            p.setCodigoBarras(payload.getCodigoBarras());
            p.setNombre(payload.getNombre());
            p.setDescripcion(payload.getDescripcion());
            p.setLaboratorio(payload.getLaboratorio());
            p.setMarca(payload.getMarca());
            p.setTipoMedicamento(payload.getTipoMedicamento());
            p.setPrecioCompra(payload.getPrecioCompra());
            p.setPrecioVenta(payload.getPrecioVenta());
            p.setIva(payload.getIva());
            p.setStock(payload.getStock());
            p.setStockMinimo(payload.getStockMinimo());
            p.setLote(payload.getLote());
            p.setFechaVencimiento(payload.getFechaVencimiento());
            p.setRegistroInvima(payload.getRegistroInvima());
            p.setActivo(payload.isActivo());
            p.setCategoriaId(payload.getCategoriaId());
            return ResponseEntity.ok(repository.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable UUID id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/importar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> importar(@RequestBody List<Producto> productos) {
        for (Producto p : productos) {
            repository.findByCodigo(p.getCodigo()).ifPresentOrElse(
                    existing -> {
                        existing.setNombre(p.getNombre());
                        existing.setDescripcion(p.getDescripcion());
                        existing.setMarca(p.getMarca());
                        existing.setLaboratorio(p.getLaboratorio());
                        existing.setTipoMedicamento(p.getTipoMedicamento());
                        existing.setPrecioCompra(p.getPrecioCompra());
                        existing.setPrecioVenta(p.getPrecioVenta());
                        existing.setIva(p.getIva());
                        existing.setStock(p.getStock());
                        existing.setStockMinimo(p.getStockMinimo());
                        existing.setLote(p.getLote());
                        existing.setFechaVencimiento(p.getFechaVencimiento());
                        existing.setRegistroInvima(p.getRegistroInvima());
                        existing.setActivo(p.isActivo());
                        repository.save(existing);
                    },
                    () -> repository.save(p)
            );
        }
        return ResponseEntity.ok("Importados: " + productos.size());
    }
}
