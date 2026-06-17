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
        if (body.containsKey("brandName"))      config.setBrandName(body.get("brandName"));
        if (body.containsKey("logoUrl"))         config.setLogoUrl(body.get("logoUrl"));
        if (body.containsKey("nit"))             config.setNit(body.get("nit"));
        if (body.containsKey("direccion"))       config.setDireccion(body.get("direccion"));
        if (body.containsKey("telefono"))        config.setTelefono(body.get("telefono"));
        if (body.containsKey("email"))           config.setEmail(body.get("email"));
        if (body.containsKey("regInvima"))       config.setRegInvima(body.get("regInvima"));
        if (body.containsKey("qfResponsable"))   config.setQfResponsable(body.get("qfResponsable"));
        if (body.containsKey("resolucionDian"))  config.setResolucionDian(body.get("resolucionDian"));
        if (body.containsKey("habilitacionPos"))         config.setHabilitacionPos(body.get("habilitacionPos"));
        if (body.containsKey("personaNaturalNombre"))    config.setPersonaNaturalNombre(body.get("personaNaturalNombre"));
        if (body.containsKey("personaNaturalCC"))        config.setPersonaNaturalCC(body.get("personaNaturalCC"));
        if (body.containsKey("personaNaturalCelular"))   config.setPersonaNaturalCelular(body.get("personaNaturalCelular"));
        if (body.containsKey("personaNaturalDir"))       config.setPersonaNaturalDir(body.get("personaNaturalDir"));
        config.setUpdatedAt(OffsetDateTime.now());
        return ResponseEntity.ok(repository.save(config));
    }
}
