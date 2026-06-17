package com.farmacia.controller;

import com.farmacia.dto.VentaRequest;
import com.farmacia.model.AppUser;
import com.farmacia.model.Venta;
import com.farmacia.repository.AppUserRepository;
import com.farmacia.service.VentaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/ventas")
@RequiredArgsConstructor
public class VentaController {

    private final VentaService ventaService;
    private final AppUserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    public List<Venta> listar() {
        return ventaService.listar();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerDetalle(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(ventaService.obtenerConDetalle(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/todas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> eliminarTodas() {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ventas", Long.class);
        long total = count != null ? count : 0;
        jdbcTemplate.execute("DELETE FROM detalle_ventas");
        jdbcTemplate.execute("DELETE FROM ventas");
        try {
            jdbcTemplate.execute("ALTER SEQUENCE ventas_numero_seq RESTART WITH 1");
        } catch (Exception e) {
            log.warn("No se pudo reiniciar la secuencia de ventas: {}", e.getMessage());
        }
        return ResponseEntity.ok("Eliminadas: " + total + " ventas. Contador reiniciado.");
    }

    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody VentaRequest request,
                                    @AuthenticationPrincipal String username) {
        try {
            AppUser user = userRepository.findByEmail(username).orElseThrow();
            Venta venta = ventaService.crear(request, user.getId());
            return ResponseEntity.ok(venta);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
