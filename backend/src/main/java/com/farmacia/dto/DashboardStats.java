package com.farmacia.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardStats {
    // Contadores básicos
    private long ventasHoy;
    private BigDecimal totalHoy;
    private long ventasMes;
    private BigDecimal totalMes;
    private long totalProductos;
    private long bajoStock;
    private long porVencer;
    private BigDecimal valorInventario;

    // Listas para tablas
    private List<Map<String, Object>> proximosVencer;
    private List<Map<String, Object>> ventasRecientes;
    private List<Map<String, Object>> bajoStockLista;
    private List<Map<String, Object>> topProductos;

    // Series para gráficas
    private List<Map<String, Object>> ventasPorDia;
    private List<Map<String, Object>> ventasPorMetodo;
}
