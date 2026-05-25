package com.farmacia.repository;

import com.farmacia.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface VentaRepository extends JpaRepository<Venta, UUID> {

    List<Venta> findTop10ByOrderByCreatedAtDesc();
    List<Venta> findTop200ByOrderByCreatedAtDesc();

    List<Venta> findByCreatedAtAfterOrderByCreatedAtDesc(OffsetDateTime from);

    @Query("SELECT COALESCE(SUM(v.total), 0) FROM Venta v WHERE v.createdAt >= :from")
    BigDecimal sumTotalAfter(@Param("from") OffsetDateTime from);

    long countByCreatedAtAfter(OffsetDateTime from);
}
