package com.farmacia.controller;

import com.farmacia.dto.VentaRequest;
import com.farmacia.model.AppUser;
import com.farmacia.model.Venta;
import com.farmacia.repository.AppUserRepository;
import com.farmacia.service.VentaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ventas")
@RequiredArgsConstructor
public class VentaController {

    private final VentaService ventaService;
    private final AppUserRepository userRepository;

    @GetMapping
    public List<Venta> listar() {
        return ventaService.listar();
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
