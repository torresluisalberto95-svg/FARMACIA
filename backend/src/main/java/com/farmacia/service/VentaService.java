package com.farmacia.service;

import com.farmacia.dto.VentaRequest;
import com.farmacia.model.DetalleVenta;
import com.farmacia.model.Producto;
import com.farmacia.model.Venta;
import com.farmacia.repository.DetalleVentaRepository;
import com.farmacia.repository.ProductoRepository;
import com.farmacia.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VentaService {

    private final VentaRepository ventaRepository;
    private final DetalleVentaRepository detalleRepository;
    private final ProductoRepository productoRepository;

    public List<Venta> listar() {
        return ventaRepository.findTop10ByOrderByCreatedAtDesc();
    }

    @Transactional
    public Venta crear(VentaRequest req, UUID vendedorId) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal ivaTotal = BigDecimal.ZERO;

        for (VentaRequest.ItemVenta item : req.getItems()) {
            Producto p = productoRepository.findById(item.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + item.getProductoId()));
            if (p.getStock() < item.getCantidad()) {
                throw new RuntimeException("Stock insuficiente para: " + p.getNombre());
            }
            BigDecimal precio = item.getPrecioUnitario() != null ? item.getPrecioUnitario() : p.getPrecioVenta();
            BigDecimal sub = precio.multiply(BigDecimal.valueOf(item.getCantidad()));
            subtotal = subtotal.add(sub);
            ivaTotal = ivaTotal.add(sub.multiply(p.getIva().divide(BigDecimal.valueOf(100))));
        }

        BigDecimal descuento = req.getDescuento() != null ? req.getDescuento() : BigDecimal.ZERO;
        BigDecimal total = subtotal.add(ivaTotal).subtract(descuento).max(BigDecimal.ZERO);

        Venta venta = new Venta();
        venta.setClienteId(req.getClienteId());
        venta.setVendedorId(vendedorId);
        venta.setSubtotal(subtotal);
        venta.setIva(ivaTotal);
        venta.setDescuento(descuento);
        venta.setTotal(total);
        venta.setMetodoPago(req.getMetodoPago());
        venta = ventaRepository.save(venta);

        for (VentaRequest.ItemVenta item : req.getItems()) {
            Producto p = productoRepository.findById(item.getProductoId()).orElseThrow();
            BigDecimal precio = item.getPrecioUnitario() != null ? item.getPrecioUnitario() : p.getPrecioVenta();

            DetalleVenta det = new DetalleVenta();
            det.setVentaId(venta.getId());
            det.setProductoId(item.getProductoId());
            det.setCantidad(item.getCantidad());
            det.setPrecioUnitario(precio);
            det.setSubtotal(precio.multiply(BigDecimal.valueOf(item.getCantidad())));
            detalleRepository.save(det);

            p.setStock(p.getStock() - item.getCantidad());
            productoRepository.save(p);
        }

        return ventaRepository.findById(venta.getId()).orElse(venta);
    }
}
