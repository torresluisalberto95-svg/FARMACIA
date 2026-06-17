package com.farmacia.service;

import com.farmacia.dto.VentaDetalleDTO;
import com.farmacia.dto.VentaRequest;
import com.farmacia.model.AppUser;
import com.farmacia.model.DetalleVenta;
import com.farmacia.model.Producto;
import com.farmacia.model.Venta;
import com.farmacia.repository.AppUserRepository;
import com.farmacia.repository.ClienteRepository;
import com.farmacia.repository.DetalleVentaRepository;
import com.farmacia.repository.ProductoRepository;
import com.farmacia.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VentaService {

    private final VentaRepository ventaRepository;
    private final DetalleVentaRepository detalleRepository;
    private final ProductoRepository productoRepository;
    private final ClienteRepository clienteRepository;
    private final AppUserRepository appUserRepository;

    public List<Venta> listar() {
        List<Venta> ventas = ventaRepository.findTop200ByOrderByCreatedAtDesc();
        Set<UUID> ids = ventas.stream().map(Venta::getVendedorId).collect(Collectors.toSet());
        Map<UUID, String> nombres = appUserRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(AppUser::getId, AppUser::getFullName));
        ventas.forEach(v -> v.setVendedorNombre(nombres.get(v.getVendedorId())));
        return ventas;
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
        // saveAndFlush garantiza que el INSERT llega a la BD y el SERIAL genera el numero
        venta = ventaRepository.saveAndFlush(venta);

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

        // Consulta nativa para obtener el numero real generado por el SERIAL de BD
        // (findById usa la cache de JPA y devuelve null para columnas con insertable=false)
        Integer numeroReal = ventaRepository.findNumeroByVentaId(venta.getId());

        Venta ventaFinal = ventaRepository.findById(venta.getId()).orElse(venta);
        ventaFinal.setNumero(numeroReal);

        if ("FACTURADA".equals(ventaFinal.getTipoVenta()) && numeroReal != null) {
            String year = String.valueOf(java.time.Year.now().getValue());
            ventaFinal.setNumeroFactura("FAC-" + year + "-" + String.format("%06d", numeroReal));
            ventaFinal = ventaRepository.save(ventaFinal);
            ventaFinal.setNumero(numeroReal);
        }

        appUserRepository.findById(vendedorId).ifPresent(u -> ventaFinal.setVendedorNombre(u.getFullName()));
        return ventaFinal;
    }

    @Transactional
    public Venta anular(UUID ventaId, UUID adminId) {
        Venta venta = ventaRepository.findById(ventaId)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));

        if ("anulada".equals(venta.getEstado())) {
            throw new RuntimeException("Esta venta ya fue anulada anteriormente");
        }

        // Restaurar stock de cada producto involucrado en la venta
        List<DetalleVenta> detalles = detalleRepository.findByVentaId(ventaId);
        for (DetalleVenta det : detalles) {
            productoRepository.findById(det.getProductoId()).ifPresent(p -> {
                p.setStock(p.getStock() + det.getCantidad());
                productoRepository.save(p);
            });
        }

        venta.setEstado("anulada");
        venta.setAnuladoPor(adminId);
        venta.setAnuladoAt(OffsetDateTime.now());
        return ventaRepository.save(venta);
    }
}
