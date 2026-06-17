package com.farmacia.init;

import com.farmacia.model.AppUser;
import com.farmacia.model.Configuracion;
import com.farmacia.repository.AppUserRepository;
import com.farmacia.repository.ConfiguracionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final AppUserRepository userRepository;
    private final ConfiguracionRepository configuracionRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.admin.fullname}")
    private String adminFullName;

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            AppUser admin = new AppUser();
            admin.setEmail(adminEmail);
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
            admin.setFullName(adminFullName);
            admin.setRole("admin");
            admin.setActivo(true);
            userRepository.save(admin);
            log.info("Admin creado: {}", adminEmail);
        }

        if (configuracionRepository.findBySingletonTrue().isEmpty()) {
            Configuracion config = new Configuracion();
            config.setBrandName("MD FarmaSalud");
            config.setSingleton(true);
            configuracionRepository.save(config);
        }
    }
}
