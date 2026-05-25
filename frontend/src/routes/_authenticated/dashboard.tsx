import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { dashboardApi, type DashboardStats } from "@/api/dashboard";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { useAuth } from "@/hooks/use-auth";
import { DollarSign, Package, AlertTriangle, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Stat({ label, value, icon: Icon, accent }: { label: string; value: string; icon: any; accent?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accent ?? "bg-primary/10 text-primary"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function Dashboard() {
  const { role, fullName } = useAuth();
  const isAdmin = role === "admin";
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    dashboardApi.stats().then(setStats).catch(console.error);
  }, []);

  const money = (n: number) => `$ ${Number(n).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

  if (!stats) return <div className="p-6">Cargando…</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title={`Hola, ${fullName || "bienvenido"}`} description="Resumen del día" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Ventas hoy" value={String(stats.ventasHoy)} icon={ShoppingCart} />
        {isAdmin && <Stat label="Ingresos hoy" value={money(stats.totalHoy)} icon={DollarSign} accent="bg-accent/15 text-accent" />}
        <Stat label="Productos" value={String(stats.totalProductos)} icon={Package} />
        <Stat label="Bajo stock / Por vencer" value={`${stats.bajoStock} / ${stats.porVencer}`} icon={AlertTriangle} accent="bg-destructive/10 text-destructive" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Próximos a vencer</h2>
          {stats.proximosVencer.length === 0 && <p className="text-sm text-muted-foreground">No hay productos próximos a vencer.</p>}
          <ul className="space-y-2">
            {stats.proximosVencer.map((p, i) => (
              <li key={i} className="flex justify-between text-sm border-b last:border-0 pb-2">
                <span>{p.nombre} <span className="text-muted-foreground">· lote {p.lote || "—"}</span></span>
                <span className="text-destructive font-medium">{p.fechaVencimiento}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Ventas recientes</h2>
          {stats.ventasRecientes.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay ventas registradas.</p>}
          <ul className="space-y-2">
            {stats.ventasRecientes.map((v, i) => (
              <li key={i} className="flex justify-between text-sm border-b last:border-0 pb-2">
                <span>#{v.numero} · {v.metodoPago}</span>
                <span className="font-medium">{money(v.total)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
