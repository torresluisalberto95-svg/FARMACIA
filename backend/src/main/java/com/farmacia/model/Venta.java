package com.farmacia.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "ventas")
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(insertable = false, updatable = false)
    private Integer numero;

    @Column(name = "cliente_id")
    private UUID clienteId;

    @Column(name = "vendedor_id", nullable = false)
    private UUID vendedorId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal iva = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal descuento = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    @Column(name = "metodo_pago", nullable = false)
    private String metodoPago = "efectivo";

    @Column(name = "tipo_venta", nullable = false)
    private String tipoVenta = "CONSUMIDOR_FINAL";

    @Column(name = "numero_factura")
    private String numeroFactura;

    @Column(nullable = false)
    private String estado = "completada";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
