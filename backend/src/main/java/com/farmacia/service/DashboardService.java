package com.farmacia.service;

import com.farmacia.dto.DashboardStats;
import com.farmacia.model.Producto;
import com.farmacia.model.Venta;
import com.farmacia.repository.DetalleVentaRepository;
import com.farmacia.repository.ProductoRepository;
import com.farmacia.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final VentaRepository ventaRepository;
    private final ProductoRepository productoRepository;
    private final DetalleVentaRepository detalleVentaRepository;

    public DashboardStats stats() {
        OffsetDateTime inicioHoy = LocalDate.now().atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime inicioMes = LocalDate.now().withDayOfMonth(1).atStartOfDay().atOffset(ZoneOffset.UTC);

        // ── Ventas hoy / mes ──────────────────────────────────────────────
        long ventasHoy  = ventaRepository.countByCreatedAtAfter(inicioHoy);
        long ventasMes  = ventaRepository.countByCreatedAtAfter(inicioMes);
        BigDecimal totalHoy = orZero(ventaRepository.sumTotalAfter(inicioHoy));
        BigDecimal totalMes = orZero(ventaRepository.sumTotalAfter(inicioMes));

        // ── Inventario ────────────────────────────────────────────────────
        List<Producto> todos = productoRepository.findAll();
        long totalProductos  = todos.stream().filter(Producto::isActivo).count();
        BigDecimal valorInventario = orZero(productoRepository.valorTotalInventario());

        // ── Bajo stock ────────────────────────────────────────────────────
        List<Producto> bajoStockProds = productoRepository.findBajoStock();
        long bajoStockCount = bajoStockProds.size();
        List<Map<String, Object>> bajoStockLista = bajoStockProds.stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("nombre",     p.getNombre());
            m.put("stock",      p.getStock());
            m.put("stockMinimo",p.getStockMinimo());
            m.put("laboratorio",p.getLaboratorio() != null ? p.getLaboratorio() : "");
            return m;
        }).collect(Collectors.toList());

        // ── Próximos a vencer (60 días) ───────────────────────────────────
        LocalDate en60 = LocalDate.now().plusDays(60);
        List<Producto> proxVencer = productoRepository.findProximosAVencer(en60);
        long porVencerCount = proxVencer.size();
        List<Map<String, Object>> proximosVencer = proxVencer.stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("nombre",          p.getNombre());
            m.put("lote",            p.getLote() != null ? p.getLote() : "");
            m.put("fechaVencimiento",p.getFechaVencimiento().toString());
            m.put("stock",           p.getStock());
            return m;
        }).collect(Collectors.toList());

        // ── Ventas recientes ──────────────────────────────────────────────
        List<Map<String, Object>> ventasRecientes = ventaRepository
                .findTop10ByOrderByCreatedAtDesc().stream()
                .limit(10)
                .map(v -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("numero",    v.getNumero() != null ? v.getNumero() : 0);
                    m.put("total",     v.getTotal());
                    m.put("metodoPago",v.getMetodoPago());
                    m.put("createdAt", v.getCreatedAt().toString());
                    return m;
                }).collect(Collectors.toList());

        // ── Top 20 productos vendidos ──────────────────────────────────────
        List<Map<String, Object>> topProductos = new ArrayList<>();
        try {
            for (Object[] row : detalleVentaRepository.findTop20Productos()) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("nombre",    row[0]);
                m.put("cantidad",  row[1] instanceof Number ? ((Number) row[1]).longValue() : 0);
                m.put("total",     row[2] instanceof Number ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO);
                topProductos.add(m);
            }
        } catch (Exception ignored) {}

        // ── Ventas por día (últimos 30 días) ──────────────────────────────
        List<Map<String, Object>> ventasPorDia = new ArrayList<>();
        try {
            for (Object[] row : ventaRepository.ventasPorDia()) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("fecha",    row[0]);
                m.put("cantidad", row[1] instanceof Number ? ((Number) row[1]).longValue() : 0);
                m.put("total",    row[2] instanceof Number ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO);
                ventasPorDia.add(m);
            }
        } catch (Exception ignored) {}

        // ── Ventas por método de pago ─────────────────────────────────────
        List<Map<String, Object>> ventasPorMetodo = new ArrayList<>();
        try {
            for (Object[] row : ventaRepository.ventasPorMetodoPago()) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("metodo",   row[0]);
                m.put("cantidad", row[1] instanceof Number ? ((Number) row[1]).longValue() : 0);
                m.put("total",    row[2] instanceof Number ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO);
                ventasPorMetodo.add(m);
            }
        } catch (Exception ignored) {}

        return DashboardStats.builder()
                .ventasHoy(ventasHoy)
                .totalHoy(totalHoy)
                .ventasMes(ventasMes)
                .totalMes(totalMes)
                .totalProductos(totalProductos)
                .valorInventario(valorInventario)
                .bajoStock(bajoStockCount)
                .porVencer(porVencerCount)
                .proximosVencer(proximosVencer)
                .ventasRecientes(ventasRecientes)
                .bajoStockLista(bajoStockLista)
                .topProductos(topProductos)
                .ventasPorDia(ventasPorDia)
                .ventasPorMetodo(ventasPorMetodo)
                .build();
    }

    private BigDecimal orZero(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
