import { api } from "./client";

export interface Caja {
  id: string;
  usuarioId: string;
  montoApertura: number;
  montoCierre: number | null;
  abiertaAt: string;
  cerradaAt: string | null;
  estado: string;
  observaciones: string | null;
}

export const cajaApi = {
  estado: () => api.get<{ actual: Caja | null; historial: Caja[]; ventasEnCaja: number }>("/api/caja").then(r => r.data),
  abrir: (montoApertura: number) => api.post<Caja>("/api/caja/abrir", { montoApertura }).then(r => r.data),
  cerrar: (id: string, montoCierre: number, observaciones: string) =>
    api.post<Caja>(`/api/caja/${id}/cerrar`, { montoCierre, observaciones }).then(r => r.data),
};
