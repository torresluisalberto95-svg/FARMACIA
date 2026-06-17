import { api } from "./client";

export interface ItemCompra {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
}

export interface CompraRequest {
  proveedorId?: string | null;
  items: ItemCompra[];
}

export interface Compra {
  id: string;
  numero: number;
  proveedorId: string | null;
  usuarioId: string;
  total: number;
  estado: string;
  createdAt: string;
}

export const comprasApi = {
  listar: () => api.get<Compra[]>("/api/compras").then(r => r.data),
  crear: (req: CompraRequest) => api.post<Compra>("/api/compras", req).then(r => r.data),
  eliminarTodas: () => api.delete<string>("/api/compras/todas").then(r => r.data),
};
