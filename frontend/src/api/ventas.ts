import { api } from "./client";

export interface ItemVenta {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
}

export interface VentaRequest {
  clienteId?: string | null;
  items: ItemVenta[];
  descuento?: number;
  metodoPago: string;
  tipoVenta: "FACTURADA" | "CONSUMIDOR_FINAL";
}

export interface Venta {
  id: string;
  numero: number;
  clienteId: string | null;
  vendedorId: string;
  subtotal: number;
  iva: number;
  descuento: number;
  total: number;
  metodoPago: string;
  tipoVenta: string;
  numeroFactura: string | null;
  estado: string;
  anuladoPor: string | null;
  anuladoAt: string | null;
  createdAt: string;
}

export interface VentaDetalleItem {
  productoNombre: string;
  productoCodigo: string;
  lote: string | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentaDetalle extends Venta {
  clienteNombre: string | null;
  clienteDocumento: string | null;
  clienteTipoDocumento: string | null;
  items: VentaDetalleItem[];
}

export const ventasApi = {
  listar: () => api.get<Venta[]>("/api/ventas").then(r => r.data),
  obtenerDetalle: (id: string) => api.get<VentaDetalle>(`/api/ventas/${id}`).then(r => r.data),
  crear: (req: VentaRequest) => api.post<Venta>("/api/ventas", req).then(r => r.data),
  anular: (id: string) => api.post<Venta>(`/api/ventas/${id}/anular`).then(r => r.data),
  eliminarTodas: () => api.delete<string>("/api/ventas/todas").then(r => r.data),
};
