package com.farmacia.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class CompraRequest {
    private UUID proveedorId;
    @NotEmpty
    private List<ItemCompra> items;

    @Data
    public static class ItemCompra {
        private UUID productoId;
        private int cantidad;
        private BigDecimal precioUnitario;
    }
}
