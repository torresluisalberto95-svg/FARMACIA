package com.farmacia.service;

import com.farmacia.dto.DashboardStats;
import com.farmacia.model.Producto;
import com.farmacia.model.Venta;
import com.farmacia.repository.ProductoRepository;
import com.farmacia.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final VentaRepository ventaRepository;
    private final ProductoRepository productoRepository;

    public DashboardStats stats() {
        OffsetDateTime inicioHoy = LocalDate.now().atStartOfDay().atOffset(ZoneOffset.UTC);

        long ventasHoy = ventaRepository.countByCreatedAtAfter(inicioHoy);
        BigDecimal totalHoy = ventaRepository.sumTotalAfter(inicioHoy);

        List<Producto> todos = productoRepository.findAll();
        long totalProductos = todos.size();
        long bajoStock = todos.stream().filter(p -> p.getStock() <= p.getStockMinimo()).count();

        LocalDate en30 = LocalDate.now().plusDays(30);
        List<Producto> proxVencer = todos.stream()
                .filter(p -> p.getFechaVencimiento() != null && !p.getFechaVencimiento().isAfter(en30))
                .sorted((a, b) -> a.getFechaVencimiento().compareTo(b.getFechaVencimiento()))
                .limit(5)
                .collect(Collectors.toList());

        List<Map<String, Object>> proximosVencer = proxVencer.stream().map(p -> Map.<String, Object>of(
                "nombre", p.getNombre(),
                "lote", p.getLote() != null ? p.getLote() : "",
                "fechaVencimiento", p.getFechaVencimiento().toString(),
                "stock", p.getStock()
        )).collect(Collectors.toList());

        List<Venta> recientes = ventaRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .limit(5).collect(Collectors.toList());

        List<Map<String, Object>> ventasRecientes = recientes.stream().map(v -> Map.<String, Object>of(
                "numero", v.getNumero() != null ? v.getNumero() : 0,
                "total", v.getTotal(),
                "metodoPago", v.getMetodoPago(),
                "createdAt", v.getCreatedAt().toString()
        )).collect(Collectors.toList());

        return DashboardStats.builder()
                .ventasHoy(ventasHoy)
                .totalHoy(totalHoy != null ? totalHoy : BigDecimal.ZERO)
                .totalProductos(totalProductos)
                .bajoStock(bajoStock)
                .porVencer(proxVencer.size())
                .proximosVencer(proximosVencer)
                .ventasRecientes(ventasRecientes)
                .build();
    }
}
