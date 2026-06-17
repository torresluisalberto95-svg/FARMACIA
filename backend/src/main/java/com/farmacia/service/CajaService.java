package com.farmacia.service;

import com.farmacia.model.Caja;
import com.farmacia.repository.CajaRepository;
import com.farmacia.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CajaService {

    private final CajaRepository cajaRepository;
    private final VentaRepository ventaRepository;

    public Map<String, Object> estado(UUID usuarioId) {
        Optional<Caja> abierta = cajaRepository.findByUsuarioIdAndEstado(usuarioId, "abierta");
        List<Caja> historial = cajaRepository.findTop10ByUsuarioIdOrderByAbiertaAtDesc(usuarioId);
        BigDecimal ventas = BigDecimal.ZERO;
        if (abierta.isPresent()) {
            ventas = ventaRepository.sumTotalAfter(abierta.get().getAbiertaAt());
            if (ventas == null) ventas = BigDecimal.ZERO;
        }
        Map<String, Object> result = new HashMap<>();
        result.put("actual", abierta.orElse(null));
        result.put("historial", historial);
        result.put("ventasEnCaja", ventas);
        return result;
    }

    public Caja abrir(UUID usuarioId, BigDecimal montoApertura) {
        cajaRepository.findByUsuarioIdAndEstado(usuarioId, "abierta")
                .ifPresent(c -> { throw new RuntimeException("Ya tienes una caja abierta"); });
        Caja caja = new Caja();
        caja.setUsuarioId(usuarioId);
        caja.setMontoApertura(montoApertura);
        caja.setAbiertaAt(OffsetDateTime.now());
        return cajaRepository.save(caja);
    }

    public Caja cerrar(UUID cajaId, BigDecimal montoCierre, String observaciones) {
        Caja caja = cajaRepository.findById(cajaId)
                .orElseThrow(() -> new RuntimeException("Caja no encontrada"));
        caja.setMontoCierre(montoCierre);
        caja.setObservaciones(observaciones);
        caja.setEstado("cerrada");
        caja.setCerradaAt(OffsetDateTime.now());
        return cajaRepository.save(caja);
    }
}
