package com.farmacia.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String codigo;

    @Column(name = "codigo_barras")
    private String codigoBarras;

    @Column(nullable = false)
    private String nombre;

    private String descripcion;

    @Column(name = "categoria_id")
    private UUID categoriaId;

    private String laboratorio;

    private String marca;

    @Column(name = "tipo_medicamento", nullable = false)
    private String tipoMedicamento = "comercial";

    @Column(name = "precio_compra", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioCompra = BigDecimal.ZERO;

    @Column(name = "precio_venta", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioVenta = BigDecimal.ZERO;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal iva = BigDecimal.ZERO;

    @Column(nullable = false)
    private int stock = 0;

    @Column(name = "stock_minimo", nullable = false)
    private int stockMinimo = 5;

    private String lote;

    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento;

    @Column(name = "registro_invima")
    private String registroInvima;

    @Column(nullable = false)
    private boolean activo = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
