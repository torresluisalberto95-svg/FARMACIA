package com.farmacia.service;

import com.farmacia.dto.VentaDetalleDTO;
import com.farmacia.dto.VentaRequest;
import com.farmacia.model.DetalleVenta;
import com.farmacia.model.Producto;
import com.farmacia.model.Venta;
import com.farmacia.repository.ClienteRepository;
import com.farmacia.repository.DetalleVentaRepository;
import com.farmacia.repository.ProductoRepository;
import com.farmacia.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VentaService {

    private final VentaRepository ventaRepository;
    private final DetalleVentaRepository detalleRepository;
    private final ProductoRepository productoRepository;
    private final ClienteRepository clienteRepository;

    public List<Venta> listar() {
        return ventaRepository.findTop200ByOrderByCreatedAtDesc();
    }

    public VentaDetalleDTO obtenerConDetalle(UUID id) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));
        List<DetalleVenta> detalles = detalleRepository.findByVentaId(id);

        VentaDetalleDTO dto = new VentaDetalleDTO();
        dto.setId(venta.getId());
        dto.setNumero(venta.getNumero());
        dto.setTipoVenta(venta.getTipoVenta());
        dto.setNumeroFactura(venta.getNumeroFactura());
        dto.setMetodoPago(venta.getMetodoPago());
        dto.setEstado(venta.getEstado());
        dto.setSubtotal(venta.getSubtotal());
        dto.setIva(venta.getIva());
        dto.setDescuento(venta.getDescuento());
        dto.setTotal(venta.getTotal());
        dto.setCreatedAt(venta.getCreatedAt());

        if (venta.getClienteId() != null) {
            clienteRepository.findById(venta.getClienteId()).ifPresent(c -> {
                dto.setClienteNombre(c.getNombre());
                dto.setClienteDocumento(c.getDocumento());
                dto.setClienteTipoDocumento(c.getTipoDocumento());
            });
        }

        List<VentaDetalleDTO.ItemDTO> items = detalles.stream().map(d -> {
            VentaDetalleDTO.ItemDTO item = new VentaDetalleDTO.ItemDTO();
            productoRepository.findById(d.getProductoId()).ifPresent(p -> {
                item.setProductoNombre(p.getNombre());
                item.setProductoCodigo(p.getCodigo());
                item.setLote(p.getLote());
            });
            item.setCantidad(d.getCantidad());
            item.setPrecioUnitario(d.getPrecioUnitario());
            item.setSubtotal(d.getSubtotal());
            return item;
        }).collect(Collectors.toList());
        dto.setItems(items);

        return dto;
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
        venta.setTipoVenta(req.getTipoVenta() != null ? req.getTipoVenta() : "CONSUMIDOR_FINAL");
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

        Venta ventaFinal = ventaRepository.findById(venta.getId()).orElse(venta);
        if ("FACTURADA".equals(ventaFinal.getTipoVenta()) && ventaFinal.getNumero() != null) {
            String year = String.valueOf(java.time.Year.now().getValue());
            ventaFinal.setNumeroFactura("FAC-" + year + "-" + String.format("%06d", ventaFinal.getNumero()));
            ventaFinal = ventaRepository.save(ventaFinal);
        }
        return ventaFinal;
    }
}
