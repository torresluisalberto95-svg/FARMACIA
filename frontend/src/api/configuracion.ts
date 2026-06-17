import { api } from "./client";

export interface Configuracion {
  id: string;
  brandName: string;
  logoUrl: string | null;
  nit: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  regInvima: string | null;
  qfResponsable: string | null;
  resolucionDian: string | null;
  habilitacionPos: string | null;
  personaNaturalNombre: string | null;
  personaNaturalCC: string | null;
  personaNaturalCelular: string | null;
  personaNaturalDir: string | null;
}

export const configuracionApi = {
  get: () => api.get<Configuracion>("/api/configuracion").then(r => r.data),
  update: (data: Partial<Configuracion>) => api.put<Configuracion>("/api/configuracion", data).then(r => r.data),
};
