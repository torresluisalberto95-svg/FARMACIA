package com.farmacia.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "cajas")
public class Caja {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    @Column(name = "monto_apertura", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoApertura = BigDecimal.ZERO;

    @Column(name = "monto_cierre", precision = 12, scale = 2)
    private BigDecimal montoCierre;

    @Column(name = "abierta_at", nullable = false)
    private OffsetDateTime abiertaAt;

    @Column(name = "cerrada_at")
    private OffsetDateTime cerradaAt;

    @Column(nullable = false)
    private String estado = "abierta";

    private String observaciones;
}
