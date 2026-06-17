import { api } from "./client";

export interface TopProducto  { nombre: string; cantidad: number; total: number }
export interface VentaDia      { fecha: string; cantidad: number; total: number }
export interface VentaMetodo   { metodo: string; cantidad: number; total: number }
export interface BajoStockItem { nombre: string; stock: number; stockMinimo: number; laboratorio: string }
export interface ProximoVencer { nombre: string; lote: string; fechaVencimiento: string; stock: number }
export interface VentaReciente { numero: number; total: number; metodoPago: string; createdAt: string }

export interface DashboardStats {
  ventasHoy:       number;
  totalHoy:        number;
  ventasMes:       number;
  totalMes:        number;
  totalProductos:  number;
  bajoStock:       number;
  porVencer:       number;
  valorInventario: number;
  proximosVencer:  ProximoVencer[];
  ventasRecientes: VentaReciente[];
  bajoStockLista:  BajoStockItem[];
  topProductos:    TopProducto[];
  ventasPorDia:    VentaDia[];
  ventasPorMetodo: VentaMetodo[];
}

export const dashboardApi = {
  stats:    () => api.get<DashboardStats>("/api/dashboard").then(r => r.data),
  reportes: () => api.get<DashboardStats>("/api/reportes").then(r => r.data),
};
