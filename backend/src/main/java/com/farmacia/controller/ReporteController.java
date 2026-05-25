package com.farmacia.controller;

import com.farmacia.model.Producto;
import com.farmacia.repository.DetalleVentaRepository;
import com.farmacia.repository.ProductoRepository;
import com.farmacia.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReporteController {

    private final VentaRepository ventaRepository;
    private final ProductoRepository productoRepository;

    @GetMapping
    public Map<String, Object> resumen() {
        OffsetDateTime inicioHoy = LocalDate.now().atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime inicioMes = LocalDate.now().withDayOfMonth(1).atStartOfDay().atOffset(ZoneOffset.UTC);

        long ventasHoy = ventaRepository.countByCreatedAtAfter(inicioHoy);
        long ventasMes = ventaRepository.countByCreatedAtAfter(inicioMes);
        BigDecimal totalHoy = ventaRepository.sumTotalAfter(inicioHoy);
        BigDecimal totalMes = ventaRepository.sumTotalAfter(inicioMes);

        List<Producto> todos = productoRepository.findAll();
        List<Map<String, Object>> agotados = todos.stream()
                .filter(p -> p.getStock() <= 0)
                .map(p -> Map.<String, Object>of("nombre", p.getNombre(), "stock", p.getStock()))
                .collect(Collectors.toList());

        List<Map<String, Object>> vencidos = todos.stream()
                .filter(p -> p.getFechaVencimiento() != null && p.getFechaVencimiento().isBefore(LocalDate.now()))
                .map(p -> Map.<String, Object>of(
                        "nombre", p.getNombre(),
                        "lote", p.getLote() != null ? p.getLote() : "",
                        "fechaVencimiento", p.getFechaVencimiento().toString()))
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("ventasHoy", ventasHoy);
        result.put("ventasMes", ventasMes);
        result.put("totalHoy", totalHoy != null ? totalHoy : BigDecimal.ZERO);
        result.put("totalMes", totalMes != null ? totalMes : BigDecimal.ZERO);
        result.put("agotados", agotados);
        result.put("vencidos", vencidos);
        return result;
    }
}
