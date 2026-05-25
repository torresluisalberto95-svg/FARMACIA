package com.farmacia.controller;

import com.farmacia.model.AppUser;
import com.farmacia.model.Cliente;
import com.farmacia.repository.AppUserRepository;
import com.farmacia.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteRepository repository;
    private final AppUserRepository userRepository;

    @GetMapping
    public List<Cliente> listar() {
        return repository.findAllByOrderByNombreAsc();
    }

    @PostMapping
    public ResponseEntity<Cliente> crear(@RequestBody Cliente cliente,
                                          @AuthenticationPrincipal UserDetails userDetails) {
        AppUser user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        cliente.setCreatedBy(user.getId());
        return ResponseEntity.ok(repository.save(cliente));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Cliente> actualizar(@PathVariable UUID id, @RequestBody Cliente payload) {
        return repository.findById(id).map(c -> {
            c.setDocumento(payload.getDocumento());
            c.setNombre(payload.getNombre());
            c.setTelefono(payload.getTelefono());
            c.setDireccion(payload.getDireccion());
            return ResponseEntity.ok(repository.save(c));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable UUID id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
