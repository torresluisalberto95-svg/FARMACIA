package com.farmacia.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class VentaDetalleDTO {
    private UUID id;
    private Integer numero;
    private String tipoVenta;
    private String numeroFactura;
    private String metodoPago;
    private String estado;
    private BigDecimal subtotal;
    private BigDecimal iva;
    private BigDecimal descuento;
    private BigDecimal total;
    private OffsetDateTime createdAt;
    private String clienteNombre;
    private String clienteDocumento;
    private String clienteTipoDocumento;
    private List<ItemDTO> items;

    @Data
    public static class ItemDTO {
        private String productoNombre;
        private String productoCodigo;
        private String lote;
        private int cantidad;
        private BigDecimal precioUnitario;
        private BigDecimal subtotal;
    }
}
