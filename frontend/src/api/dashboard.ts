import { api } from "./client";

export interface DashboardStats {
  ventasHoy: number;
  totalHoy: number;
  totalProductos: number;
  bajoStock: number;
  porVencer: number;
  proximosVencer: { nombre: string; lote: string; fechaVencimiento: string; stock: number }[];
  ventasRecientes: { numero: number; total: number; metodoPago: string; createdAt: string }[];
}

export const dashboardApi = {
  stats: () => api.get<DashboardStats>("/api/dashboard").then(r => r.data),
};
