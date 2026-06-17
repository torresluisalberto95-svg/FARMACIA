import { api } from "./client";

export interface Producto {
  id: string;
  codigo: string;
  codigoBarras: string | null;
  nombre: string;
  descripcion: string | null;
  categoriaId: string | null;
  laboratorio: string | null;
  marca: string | null;
  tipoMedicamento: string;
  precioCompra: number;
  precioVenta: number;
  iva: number;
  stock: number;
  stockMinimo: number;
  lote: string | null;
  fechaVencimiento: string | null;
  registroInvima: string | null;
  activo: boolean;
}

export const productosApi = {
  listar: () => api.get<Producto[]>("/api/productos").then(r => r.data),
  disponibles: () => api.get<Producto[]>("/api/productos/disponibles").then(r => r.data),
  crear: (p: Partial<Producto>) => api.post<Producto>("/api/productos", p).then(r => r.data),
  actualizar: (id: string, p: Partial<Producto>) => api.put<Producto>(`/api/productos/${id}`, p).then(r => r.data),
  eliminar: (id: string) => api.delete(`/api/productos/${id}`),
  eliminarTodos: () => api.delete<string>("/api/productos/todos").then(r => r.data),
  importar: (productos: Partial<Producto>[]) => api.post("/api/productos/importar", productos).then(r => r.data),
};
