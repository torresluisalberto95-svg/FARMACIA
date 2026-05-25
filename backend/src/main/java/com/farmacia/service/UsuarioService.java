package com.farmacia.service;

import com.farmacia.model.AppUser;
import com.farmacia.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<AppUser> listar() {
        return userRepository.findAll();
    }

    public AppUser crear(String email, String password, String fullName, String role) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("El correo ya está registrado");
        }
        AppUser user = new AppUser();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFullName(fullName);
        user.setRole(role != null ? role : "empleado");
        return userRepository.save(user);
    }

    public AppUser actualizarRol(UUID id, String role) {
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        user.setRole(role);
        return userRepository.save(user);
    }

    public AppUser actualizar(UUID id, String fullName, String newPassword) {
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (fullName != null && !fullName.isBlank()) user.setFullName(fullName);
        if (newPassword != null && !newPassword.isBlank()) user.setPasswordHash(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }

    public void eliminar(UUID id) {
        userRepository.deleteById(id);
    }
}
