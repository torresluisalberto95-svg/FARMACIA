package com.farmacia.controller;

import com.farmacia.dto.DashboardStats;
import com.farmacia.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReporteController {

    private final DashboardService dashboardService;

    @GetMapping
    public DashboardStats resumen() {
        return dashboardService.stats();
    }
}
