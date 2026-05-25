import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/reportes")({
  component: ReportesPage,
});

function ReportesPage() {
  const [resumen, setResumen] = useState({ hoy: 0, mes: 0, totalHoy: 0, totalMes: 0, ganancia: 0 });
  const [top, setTop] = useState<any[]>([]);
  const [agotados, setAgotados] = useState<any[]>([]);
  const [vencidos, setVencidos] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const hoy = new Date(); hoy.setHours(0,0,0,0);
      const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0,0,0,0);
      const [{ data: vh }, { data: vm }, { data: det }, { data: ago }, { data: ven }] = await Promise.all([
        supabase.from("ventas").select("total").gte("created_at", hoy.toISOString()),
        supabase.from("ventas").select("total").gte("created_at", inicioMes.toISOString()),
        supabase.from("detalle_ventas").select("cantidad, subtotal, productos(nombre, precio_compra)").gte("created_at", inicioMes.toISOString()),
        supabase.from("productos").select("nombre, stock").lte("stock", 0),
        supabase.from("productos").select("nombre, lote, fecha_vencimiento").lt("fecha_vencimiento", new Date().toISOString().slice(0,10)),
      ]);
      const totalHoy = (vh??[]).reduce((s:number,r:any)=>s+Number(r.total),0);
      const totalMes = (vm??[]).reduce((s:number,r:any)=>s+Number(r.total),0);
      const ganancia = (det??[]).reduce((s:number,r:any)=>s + (Number(r.subtotal) - r.cantidad * Number(r.productos?.precio_compra ?? 0)), 0);
      const map = new Map<string, number>();
      (det??[]).forEach((r:any) => { const n = r.productos?.nombre ?? "—"; map.set(n, (map.get(n) ?? 0) + r.cantidad); });
      setTop([...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10));
      setAgotados(ago ?? []); setVencidos(ven ?? []);
      setResumen({ hoy: vh?.length ?? 0, mes: vm?.length ?? 0, totalHoy, totalMes, ganancia });
    })();
  }, []);

  const money = (n: number) => `$ ${Number(n).toLocaleString("es-CO")}`;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Reportes" description="Visión consolidada de la operación." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Ventas hoy</p><p className="text-2xl font-bold">{resumen.hoy}</p><p className="text-sm">{money(resumen.totalHoy)}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Ventas del mes</p><p className="text-2xl font-bold">{resumen.mes}</p><p className="text-sm">{money(resumen.totalMes)}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Ganancia estimada (mes)</p><p className="text-2xl font-bold">{money(resumen.ganancia)}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Alertas</p><p className="text-2xl font-bold">{agotados.length + vencidos.length}</p><p className="text-sm">{agotados.length} agotados · {vencidos.length} vencidos</p></Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Productos más vendidos (mes)</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead className="text-right">Unidades</TableHead></TableRow></TableHeader>
            <TableBody>
              {top.map(([n, c]) => <TableRow key={n}><TableCell>{n}</TableCell><TableCell className="text-right font-semibold">{c}</TableCell></TableRow>)}
              {top.length===0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-6">Sin datos</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Productos vencidos</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead>Lote</TableHead><TableHead>Vence</TableHead></TableRow></TableHeader>
            <TableBody>
              {vencidos.map((p,i) => <TableRow key={i}><TableCell>{p.nombre}</TableCell><TableCell>{p.lote ?? "—"}</TableCell><TableCell className="text-destructive">{p.fecha_vencimiento}</TableCell></TableRow>)}
              {vencidos.length===0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Sin vencidos</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
