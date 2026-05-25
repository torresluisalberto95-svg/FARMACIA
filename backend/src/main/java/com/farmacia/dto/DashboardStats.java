package com.farmacia.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardStats {
    private long ventasHoy;
    private BigDecimal totalHoy;
    private long totalProductos;
    private long bajoStock;
    private long porVencer;
    private List<Map<String, Object>> proximosVencer;
    private List<Map<String, Object>> ventasRecientes;
}
