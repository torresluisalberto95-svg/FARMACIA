import { api } from "./client";

export interface Configuracion {
  id: string;
  brandName: string;
  logoUrl: string | null;
}

export const configuracionApi = {
  get: () => api.get<Configuracion>("/api/configuracion").then(r => r.data),
  update: (data: Partial<Configuracion>) => api.put<Configuracion>("/api/configuracion", data).then(r => r.data),
};
