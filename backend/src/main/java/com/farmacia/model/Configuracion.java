package com.farmacia.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "configuracion")
public class Configuracion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "brand_name", nullable = false)
    private String brandName = "MD FarmaSalud";

    @Column(name = "logo_url")
    private String logoUrl;

    @Column
    private String nit;

    @Column
    private String direccion;

    @Column
    private String telefono;

    @Column
    private String email;

    @Column(name = "reg_invima")
    private String regInvima;

    @Column(name = "qf_responsable")
    private String qfResponsable;

    @Column(name = "resolucion_dian")
    private String resolucionDian;

    @Column(name = "habilitacion_pos")
    private String habilitacionPos;

    @Column(name = "persona_natural_nombre")
    private String personaNaturalNombre;

    @Column(name = "persona_natural_cc")
    private String personaNaturalCC;

    @Column(name = "persona_natural_celular")
    private String personaNaturalCelular;

    @Column(name = "persona_natural_dir")
    private String personaNaturalDir;

    @Column(nullable = false, unique = true)
    private boolean singleton = true;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
