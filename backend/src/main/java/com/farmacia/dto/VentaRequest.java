package com.farmacia.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class VentaRequest {
    private UUID clienteId;
    @NotEmpty
    private List<ItemVenta> items;
    private BigDecimal descuento = BigDecimal.ZERO;
    private String metodoPago = "efectivo";

    @Data
    public static class ItemVenta {
        private UUID productoId;
        private int cantidad;
        private BigDecimal precioUnitario;
    }
}
