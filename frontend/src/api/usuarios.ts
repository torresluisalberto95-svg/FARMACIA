import { api } from "./client";

export interface Usuario {
  id: string;
  email: string;
  fullName: string;
  role: string;
  activo: boolean;
  createdAt: string;
}

export const usuariosApi = {
  listar: () => api.get<Usuario[]>("/api/usuarios").then(r => r.data),
  crear: (data: { email: string; password: string; fullName: string; role: string }) =>
    api.post<Usuario>("/api/usuarios", data).then(r => r.data),
  actualizar: (id: string, data: { fullName?: string; password?: string }) =>
    api.put<Usuario>(`/api/usuarios/${id}`, data).then(r => r.data),
  cambiarRol: (id: string, role: string) =>
    api.patch<Usuario>(`/api/usuarios/${id}/role`, { role }).then(r => r.data),
  eliminar: (id: string) => api.delete(`/api/usuarios/${id}`),
};
