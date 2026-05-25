import { api } from "./client";

export interface Proveedor {
  id: string;
  nit: string | null;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  correo: string | null;
}

export const proveedoresApi = {
  listar: () => api.get<Proveedor[]>("/api/proveedores").then(r => r.data),
  crear: (p: Partial<Proveedor>) => api.post<Proveedor>("/api/proveedores", p).then(r => r.data),
  actualizar: (id: string, p: Partial<Proveedor>) => api.put<Proveedor>(`/api/proveedores/${id}`, p).then(r => r.data),
  eliminar: (id: string) => api.delete(`/api/proveedores/${id}`),
};
