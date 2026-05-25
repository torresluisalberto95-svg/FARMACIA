import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  const [stats, setStats] = useState({ ventasHoy: 0, totalHoy: 0, productos: 0, bajoStock: 0, porVencer: 0 });
  const [vencer, setVencer] = useState<any[]>([]);
  const [recientes, setRecientes] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const hoy = new Date(); hoy.setHours(0,0,0,0);
      const en30 = new Date(); en30.setDate(en30.getDate() + 30);
      const [{ data: ventas }, { count: cantProd }, { data: bajos }, { data: prox }, { data: rec }] = await Promise.all([
        supabase.from("ventas").select("total, created_at").gte("created_at", hoy.toISOString()),
        supabase.from("productos").select("*", { count: "exact", head: true }),
        supabase.from("productos").select("id").lte("stock", 5),
        supabase.from("productos").select("nombre, lote, fecha_vencimiento, stock").not("fecha_vencimiento","is",null).lte("fecha_vencimiento", en30.toISOString().slice(0,10)).order("fecha_vencimiento").limit(5),
        supabase.from("ventas").select("numero,total,metodo_pago,created_at").order("created_at",{ascending:false}).limit(5),
      ]);
      setStats({
        ventasHoy: ventas?.length ?? 0,
        totalHoy: (ventas ?? []).reduce((s, v: any) => s + Number(v.total), 0),
        productos: cantProd ?? 0,
        bajoStock: bajos?.length ?? 0,
        porVencer: prox?.length ?? 0,
      });
      setVencer(prox ?? []);
      setRecientes(rec ?? []);
    })();
  }, []);

  const money = (n: number) => `$ ${n.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title={`Hola, ${fullName || "bienvenido"}`} description="Resumen del día" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Ventas hoy" value={String(stats.ventasHoy)} icon={ShoppingCart} />
        {isAdmin && <Stat label="Ingresos hoy" value={money(stats.totalHoy)} icon={DollarSign} accent="bg-accent/15 text-accent" />}
        <Stat label="Productos" value={String(stats.productos)} icon={Package} />
        <Stat label="Bajo stock / Por vencer" value={`${stats.bajoStock} / ${stats.porVencer}`} icon={AlertTriangle} accent="bg-destructive/10 text-destructive" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Próximos a vencer</h2>
          {vencer.length === 0 && <p className="text-sm text-muted-foreground">No hay productos próximos a vencer.</p>}
          <ul className="space-y-2">
            {vencer.map((p, i) => (
              <li key={i} className="flex justify-between text-sm border-b last:border-0 pb-2">
                <span>{p.nombre} <span className="text-muted-foreground">· lote {p.lote ?? "—"}</span></span>
                <span className="text-destructive font-medium">{p.fecha_vencimiento}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Ventas recientes</h2>
          {recientes.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay ventas registradas.</p>}
          <ul className="space-y-2">
            {recientes.map((v, i) => (
              <li key={i} className="flex justify-between text-sm border-b last:border-0 pb-2">
                <span>#{v.numero} · {v.metodo_pago}</span>
                <span className="font-medium">{money(Number(v.total))}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
