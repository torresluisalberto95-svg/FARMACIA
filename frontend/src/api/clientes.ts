import { api } from "./client";

export interface Cliente {
  id: string;
  tipoDocumento: string;
  documento: string | null;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  createdAt: string;
}

export const clientesApi = {
  listar: () => api.get<Cliente[]>("/api/clientes").then(r => r.data),
  crear: (c: Partial<Cliente>) => api.post<Cliente>("/api/clientes", c).then(r => r.data),
  actualizar: (id: string, c: Partial<Cliente>) => api.put<Cliente>(`/api/clientes/${id}`, c).then(r => r.data),
  eliminar: (id: string) => api.delete(`/api/clientes/${id}`),
};
