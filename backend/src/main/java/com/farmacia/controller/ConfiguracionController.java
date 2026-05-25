package com.farmacia.controller;

import com.farmacia.model.Configuracion;
import com.farmacia.repository.ConfiguracionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/configuracion")
@RequiredArgsConstructor
public class ConfiguracionController {

    private final ConfiguracionRepository repository;

    @GetMapping
    public ResponseEntity<Configuracion> get() {
        return repository.findBySingletonTrue()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Configuracion> update(@RequestBody Map<String, String> body) {
        Configuracion config = repository.findBySingletonTrue().orElseGet(() -> {
            Configuracion c = new Configuracion();
            return c;
        });
        if (body.containsKey("brandName")) config.setBrandName(body.get("brandName"));
        if (body.containsKey("logoUrl")) config.setLogoUrl(body.get("logoUrl"));
        config.setUpdatedAt(OffsetDateTime.now());
        return ResponseEntity.ok(repository.save(config));
    }
}
