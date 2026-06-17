package com.farmacia.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
public class KeepAliveService {

    @Value("${app.self-url:}")
    private String selfUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Auto-ping cada 10 minutos para evitar hibernacion en Render free plan.
     * Solo actua si APP_URL esta configurado (variable de entorno en produccion).
     */
    @Scheduled(fixedDelay = 300_000)
    public void ping() {
        if (selfUrl == null || selfUrl.isBlank()) return;
        try {
            restTemplate.getForObject(selfUrl + "/api/health", String.class);
            log.debug("Keep-alive OK -> {}", selfUrl);
        } catch (Exception e) {
            log.warn("Keep-alive falló: {}", e.getMessage());
        }
    }
}
