package com.farmacia.service;

import com.farmacia.dto.CompraRequest;
import com.farmacia.model.Compra;
import com.farmacia.model.DetalleCompra;
import com.farmacia.model.Producto;
import com.farmacia.repository.CompraRepository;
import com.farmacia.repository.DetalleCompraRepository;
import com.farmacia.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompraService {

    private final CompraRepository compraRepository;
    private final DetalleCompraRepository detalleRepository;
    private final ProductoRepository productoRepository;

    public List<Compra> listar() {
        return compraRepository.findTop10ByOrderByCreatedAtDesc();
    }

    @Transactional
    public Compra crear(CompraRequest req, UUID usuarioId) {
        BigDecimal total = req.getItems().stream()
                .map(i -> i.getPrecioUnitario().multiply(BigDecimal.valueOf(i.getCantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Compra compra = new Compra();
        compra.setProveedorId(req.getProveedorId());
        compra.setUsuarioId(usuarioId);
        compra.setTotal(total);
        compra = compraRepository.save(compra);

        for (CompraRequest.ItemCompra item : req.getItems()) {
            DetalleCompra det = new DetalleCompra();
            det.setCompraId(compra.getId());
            det.setProductoId(item.getProductoId());
            det.setCantidad(item.getCantidad());
            det.setPrecioUnitario(item.getPrecioUnitario());
            det.setSubtotal(item.getPrecioUnitario().multiply(BigDecimal.valueOf(item.getCantidad())));
            detalleRepository.save(det);

            Producto p = productoRepository.findById(item.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
            p.setStock(p.getStock() + item.getCantidad());
            productoRepository.save(p);
        }

        return compraRepository.findById(compra.getId()).orElse(compra);
    }
}
