package com.farmacia.controller;

import com.farmacia.dto.CompraRequest;
import com.farmacia.model.AppUser;
import com.farmacia.model.Compra;
import com.farmacia.repository.AppUserRepository;
import com.farmacia.service.CompraService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/compras")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class CompraController {

    private final CompraService compraService;
    private final AppUserRepository userRepository;

    @GetMapping
    public List<Compra> listar() {
        return compraService.listar();
    }

    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody CompraRequest request,
                                    @AuthenticationPrincipal UserDetails userDetails) {
        try {
            AppUser user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            return ResponseEntity.ok(compraService.crear(request, user.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
