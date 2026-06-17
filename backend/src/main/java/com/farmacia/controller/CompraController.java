package com.farmacia.controller;

import com.farmacia.dto.CompraRequest;
import com.farmacia.model.AppUser;
import com.farmacia.model.Compra;
import com.farmacia.repository.AppUserRepository;
import com.farmacia.service.CompraService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/compras")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class CompraController {

    private final CompraService compraService;
    private final AppUserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    public List<Compra> listar() {
        return compraService.listar();
    }

    @DeleteMapping("/todas")
    public ResponseEntity<String> eliminarTodas() {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM compras", Long.class);
        long total = count != null ? count : 0;
        jdbcTemplate.execute("DELETE FROM detalle_compras");
        jdbcTemplate.execute("DELETE FROM compras");
        try {
            jdbcTemplate.execute("ALTER SEQUENCE compras_numero_seq RESTART WITH 1");
        } catch (Exception e) {
            log.warn("No se pudo reiniciar la secuencia de compras: {}", e.getMessage());
        }
        return ResponseEntity.ok("Eliminadas: " + total + " compras. Contador reiniciado.");
    }

    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody CompraRequest request,
                                    @AuthenticationPrincipal String username) {
        try {
            AppUser user = userRepository.findByEmail(username).orElseThrow();
            return ResponseEntity.ok(compraService.crear(request, user.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
