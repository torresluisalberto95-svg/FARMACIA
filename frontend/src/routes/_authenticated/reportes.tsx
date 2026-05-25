import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/api/client";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/reportes")({ component: ReportesPage });

interface ReporteData {
  ventasHoy: number; ventasMes: number; totalHoy: number; totalMes: number;
  agotados: { nombre: string; stock: number }[];
  vencidos: { nombre: string; lote: string; fechaVencimiento: string }[];
}

function ReportesPage() {
  const [data, setData] = useState<ReporteData | null>(null);

  useEffect(() => {
    api.get<ReporteData>("/api/reportes").then(r => setData(r.data)).catch(console.error);
  }, []);

  const money = (n: number) => `$ ${Number(n).toLocaleString("es-CO")}`;
  if (!data) return <div className="p-6">Cargando…</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Reportes" description="Visión consolidada de la operación." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Ventas hoy</p><p className="text-2xl font-bold">{data.ventasHoy}</p><p className="text-sm">{money(data.totalHoy)}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Ventas del mes</p><p className="text-2xl font-bold">{data.ventasMes}</p><p className="text-sm">{money(data.totalMes)}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Agotados</p><p className="text-2xl font-bold">{data.agotados.length}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Vencidos</p><p className="text-2xl font-bold">{data.vencidos.length}</p></Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Productos agotados</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead className="text-right">Stock</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.agotados.map((p, i) => <TableRow key={i}><TableCell>{p.nombre}</TableCell><TableCell className="text-right font-semibold">{p.stock}</TableCell></TableRow>)}
              {data.agotados.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-6">Sin agotados</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Productos vencidos</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead>Lote</TableHead><TableHead>Vence</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.vencidos.map((p, i) => <TableRow key={i}><TableCell>{p.nombre}</TableCell><TableCell>{p.lote || "—"}</TableCell><TableCell className="text-destructive">{p.fechaVencimiento}</TableCell></TableRow>)}
              {data.vencidos.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Sin vencidos</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
