package com.farmacia.controller;

import com.farmacia.model.AppUser;
import com.farmacia.model.Caja;
import com.farmacia.repository.AppUserRepository;
import com.farmacia.service.CajaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/caja")
@RequiredArgsConstructor
public class CajaController {

    private final CajaService cajaService;
    private final AppUserRepository userRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> estado(@AuthenticationPrincipal UserDetails userDetails) {
        AppUser user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        return ResponseEntity.ok(cajaService.estado(user.getId()));
    }

    @PostMapping("/abrir")
    public ResponseEntity<Caja> abrir(@RequestBody Map<String, Object> body,
                                       @AuthenticationPrincipal UserDetails userDetails) {
        AppUser user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        BigDecimal monto = new BigDecimal(body.getOrDefault("montoApertura", "0").toString());
        return ResponseEntity.ok(cajaService.abrir(user.getId(), monto));
    }

    @PostMapping("/{id}/cerrar")
    public ResponseEntity<?> cerrar(@PathVariable UUID id,
                                     @RequestBody Map<String, Object> body) {
        try {
            BigDecimal montoCierre = new BigDecimal(body.getOrDefault("montoCierre", "0").toString());
            String obs = (String) body.getOrDefault("observaciones", "");
            return ResponseEntity.ok(cajaService.cerrar(id, montoCierre, obs));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
