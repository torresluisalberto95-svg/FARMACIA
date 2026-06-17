import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { dashboardApi, type DashboardStats } from "@/api/dashboard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/page-header";
import { useAuth } from "@/hooks/use-auth";
import { DollarSign, Package, AlertTriangle, ShoppingCart, TrendingUp, Boxes } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar,
  PieChart, Pie, Cell,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

const PIE_COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#db2777"];
const money = (n: number) => `$${Number(n ?? 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ className?: string }>; accent?: string;
}) {
  return (
    <Card className="p-3 sm:p-5">
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground leading-tight">{label}</p>
          <p className="text-sm sm:text-2xl font-bold mt-0.5 sm:mt-1 leading-tight">{value}</p>
          {sub && <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">{sub}</p>}
        </div>
        <div className={`h-7 w-7 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center shrink-0 ${accent ?? "bg-primary/10 text-primary"}`}>
          <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
        </div>
      </div>
    </Card>
  );
}

function Dashboard() {
  const { role, fullName } = useAuth();
  const isAdmin = role === "admin";
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    dashboardApi.stats()
      .then(setStats)
      .catch(() => setError(true));
  }, []);

  if (error) return <div className="p-6 text-destructive">Error al cargar el dashboard.</div>;
  if (!stats) return <div className="p-6 text-muted-foreground">Cargando…</div>;

  // Arrays seguros — si el backend no los retorna aún, usamos []
  const ventasPorDia    = Array.isArray(stats.ventasPorDia)    ? stats.ventasPorDia    : [];
  const topProductos    = Array.isArray(stats.topProductos)    ? stats.topProductos    : [];
  const ventasPorMetodo = Array.isArray(stats.ventasPorMetodo) ? stats.ventasPorMetodo : [];
  const proximosVencer  = Array.isArray(stats.proximosVencer)  ? stats.proximosVencer  : [];
  const ventasRecientes = Array.isArray(stats.ventasRecientes) ? stats.ventasRecientes : [];

  const top5Bar = topProductos.slice(0, 5).map(p => ({
    nombre: p.nombre.length > 14 ? p.nombre.slice(0, 14) + "…" : p.nombre,
    cantidad: Number(p.cantidad ?? 0),
  }));

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader title={`Hola, ${fullName || "bienvenido"}`} description="Resumen general del sistema" />

      {/* ── Tarjetas ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Ventas hoy"       value={String(stats.ventasHoy  ?? 0)} sub={money(stats.totalHoy  ?? 0)} icon={ShoppingCart} />
        <StatCard label="Ventas mes"       value={String(stats.ventasMes  ?? 0)} sub={money(stats.totalMes  ?? 0)} icon={TrendingUp}   accent="bg-green-500/10 text-green-600" />
        {isAdmin && <StatCard label="Ingresos hoy"     value={money(stats.totalHoy      ?? 0)} icon={DollarSign} accent="bg-blue-500/10 text-blue-600" />}
        {isAdmin && <StatCard label="Ingresos mes"     value={money(stats.totalMes      ?? 0)} icon={DollarSign} accent="bg-indigo-500/10 text-indigo-600" />}
        {isAdmin && <StatCard label="Valor inventario" value={money(stats.valorInventario ?? 0)} icon={Boxes}   accent="bg-purple-500/10 text-purple-600" />}
        <StatCard label="Bajo stock"       value={String(stats.bajoStock  ?? 0)} icon={Package}       accent="bg-orange-500/10 text-orange-600" />
        <StatCard label="Por vencer"       value={String(stats.porVencer  ?? 0)} icon={AlertTriangle} accent="bg-destructive/10 text-destructive" />
      </div>

      {/* ── Líneas: ingresos por día ── */}
      {ventasPorDia.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Ingresos — últimos 30 días</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ventasPorDia} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(Number(v) / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [money(v), "Ingresos"]} labelFormatter={l => `Fecha: ${l}`} />
              <Legend />
              <Line type="monotone" dataKey="total" name="Ingresos ($)" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Barras: top 5 productos ── */}
        {top5Bar.length > 0 && (
          <Card className="p-5">
            <h2 className="font-semibold mb-4">Top 5 productos más vendidos</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={top5Bar} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="nombre" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="cantidad" name="Unidades" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* ── Pastel: método de pago ── */}
        {ventasPorMetodo.length > 0 && (
          <Card className="p-5">
            <h2 className="font-semibold mb-4">Ventas por método de pago</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={ventasPorMetodo}
                  dataKey="cantidad"
                  nameKey="metodo"
                  cx="50%" cy="50%"
                  outerRadius={85}
                  label={({ metodo, percent }) => `${metodo} ${(percent * 100).toFixed(0)}%`}
                >
                  {ventasPorMetodo.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [v, "Ventas"]} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Próximos a vencer ── */}
        <Card className="p-5">
          <h2 className="font-semibold mb-3">Próximos a vencer</h2>
          {proximosVencer.length === 0
            ? <p className="text-sm text-muted-foreground">No hay productos próximos a vencer.</p>
            : <ul className="divide-y text-sm">
                {proximosVencer.slice(0, 8).map((p, i) => (
                  <li key={i} className="flex justify-between py-2 gap-2">
                    <span className="truncate">{p.nombre} <span className="text-muted-foreground">· {p.lote || "—"}</span></span>
                    <Badge variant="destructive" className="shrink-0 text-xs">{p.fechaVencimiento}</Badge>
                  </li>
                ))}
              </ul>}
        </Card>

        {/* ── Ventas recientes ── */}
        <Card className="p-5">
          <h2 className="font-semibold mb-3">Ventas recientes</h2>
          {ventasRecientes.length === 0
            ? <p className="text-sm text-muted-foreground">Sin ventas registradas.</p>
            : <ul className="divide-y text-sm">
                {ventasRecientes.map((v, i) => (
                  <li key={i} className="flex justify-between py-2">
                    <span>#{v.numero} · <span className="capitalize">{v.metodoPago}</span></span>
                    <span className="font-medium">{money(v.total)}</span>
                  </li>
                ))}
              </ul>}
        </Card>
      </div>
    </div>
  );
}
