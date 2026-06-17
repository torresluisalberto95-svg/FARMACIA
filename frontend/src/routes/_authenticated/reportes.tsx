import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { dashboardApi, type DashboardStats } from "@/api/dashboard";
import { useBranding } from "@/hooks/use-branding";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Package, ShoppingCart, TrendingUp, Boxes, FileDown, Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar,
  PieChart, Pie, Cell,
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reportes")({ component: ReportesPage });

const PIE_COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#db2777"];
const money = (n: number) => `$${Number(n ?? 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

async function descargarReportePDF(
  data: DashboardStats,
  brandName: string,
  logoUrl: string,
  config: { nit?: string | null; direccion?: string | null; telefono?: string | null; email?: string | null; regInvima?: string | null; qfResponsable?: string | null } | null
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const margin = 14;
  const colW = (W - margin * 2 - 6) / 2;
  let y = margin;

  const fecha = new Date().toLocaleString("es-CO", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const topProductos   = Array.isArray(data.topProductos)    ? data.topProductos    : [];
  const bajoStockLista = Array.isArray(data.bajoStockLista)   ? data.bajoStockLista  : [];
  const proximosVencer = Array.isArray(data.proximosVencer)   ? data.proximosVencer  : [];
  const ventasPorMetodo= Array.isArray(data.ventasPorMetodo)  ? data.ventasPorMetodo : [];
  const ventasPorDia   = Array.isArray(data.ventasPorDia)     ? data.ventasPorDia    : [];

  // ── Logo ──────────────────────────────────────────────────────
  const isDataUrl = logoUrl.startsWith("data:image");
  if (isDataUrl) {
    try {
      const fmt = logoUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(logoUrl, fmt, margin, y, 22, 22);
    } catch { /* skip logo on error */ }
  }

  // ── Encabezado ────────────────────────────────────────────────
  const infoX = isDataUrl ? margin + 26 : margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(29, 78, 216);
  doc.text(brandName, infoX, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  let infoY = y + 11;
  const infoLines = [
    config?.nit        ? `NIT: ${config.nit}`                     : null,
    config?.direccion  ? config.direccion                          : null,
    config?.telefono   ? `Tel: ${config.telefono}${config.email ? "  ·  " + config.email : ""}` : config?.email ? config.email : null,
    config?.regInvima  ? `Reg. INVIMA: ${config.regInvima}`        : null,
    config?.qfResponsable ? `Q.F. Responsable: ${config.qfResponsable}` : null,
  ].filter(Boolean) as string[];
  infoLines.forEach(l => { doc.text(l, infoX, infoY); infoY += 4; });

  // Título derecha
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(29, 78, 216);
  doc.text("REPORTE GENERAL", W - margin, y + 6, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(fecha, W - margin, y + 11, { align: "right" });

  // Línea separadora
  y = Math.max(y + 26, infoY + 2);
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 6;

  // ── Estadísticas (3 × 2) ──────────────────────────────────────
  const stats = [
    { label: "Ventas hoy",       value: String(data.ventasHoy ?? 0),             sub: money(Number(data.totalHoy ?? 0)) },
    { label: "Ventas del mes",   value: String(data.ventasMes ?? 0),             sub: money(Number(data.totalMes ?? 0)) },
    { label: "Ingresos hoy",     value: money(Number(data.totalHoy ?? 0)),       sub: "" },
    { label: "Ingresos del mes", value: money(Number(data.totalMes ?? 0)),       sub: "" },
    { label: "Valor inventario", value: money(Number(data.valorInventario ?? 0)),sub: "" },
    { label: "Bajo stock",       value: String(data.bajoStock ?? 0),             sub: "productos" },
  ];
  const boxW = (W - margin * 2 - 10) / 3;
  const boxH = 16;
  stats.forEach((s, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bx = margin + col * (boxW + 5);
    const by = y + row * (boxH + 3);
    doc.setFillColor(245, 247, 255);
    doc.setDrawColor(200, 210, 240);
    doc.roundedRect(bx, by, boxW, boxH, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(s.label.toUpperCase(), bx + 3, by + 4.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(s.value, bx + 3, by + 10.5);
    if (s.sub) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(s.sub, bx + 3, by + 14.5);
    }
  });
  y += boxH * 2 + 3 * 3 + 4;

  // ── Helper: título de sección ─────────────────────────────────
  const sectionTitle = (title: string, yPos: number, x: number = margin, lineEnd: number = W - margin) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(29, 78, 216);
    doc.text(title, x, yPos);
    doc.setDrawColor(191, 219, 254);
    doc.setLineWidth(0.3);
    doc.line(x, yPos + 1, lineEnd, yPos + 1);
    return yPos + 5;
  };

  const tableStyles = {
    headStyles: { fillColor: [29, 78, 216] as [number,number,number], textColor: 255, fontSize: 7.5, fontStyle: "bold" as const },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] as [number,number,number] },
    alternateRowStyles: { fillColor: [248, 250, 252] as [number,number,number] },
    margin: { left: margin, right: margin },
  };

  // ── Método de pago + Evolución (2 columnas) ───────────────────
  const rightColX = margin + colW + 6;
  const startTwoCols = y;
  y = sectionTitle("Ventas por método de pago", startTwoCols, margin, margin + colW);
  autoTable(doc, {
    ...tableStyles,
    startY: y,
    tableWidth: colW,
    margin: { left: margin, right: W - margin - colW },
    head: [["Método", "Transacc.", "Total"]],
    body: ventasPorMetodo.length
      ? ventasPorMetodo.map(m => [String(m.metodo ?? ""), Number(m.cantidad ?? 0).toLocaleString("es-CO"), money(Number(m.total ?? 0))])
      : [["Sin datos", "", ""]],
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
  });
  const afterMetodo = (doc as any).lastAutoTable.finalY + 2;

  const y2 = sectionTitle("Evolución reciente (últimos 15 días)", startTwoCols, rightColX, W - margin);
  autoTable(doc, {
    ...tableStyles,
    startY: y2,
    tableWidth: colW,
    margin: { left: rightColX, right: margin },
    head: [["Fecha", "Ventas", "Ingresos"]],
    body: ventasPorDia.length
      ? ventasPorDia.slice(-15).map(d => [String(d.fecha ?? ""), Number(d.cantidad ?? 0).toLocaleString("es-CO"), money(Number(d.total ?? 0))])
      : [["Sin datos", "", ""]],
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
  });
  const afterEvolucion = (doc as any).lastAutoTable.finalY + 2;

  y = Math.max(afterMetodo, afterEvolucion) + 4;

  // ── Top productos ─────────────────────────────────────────────
  y = sectionTitle("Top 20 productos más vendidos", y);
  autoTable(doc, {
    ...tableStyles,
    startY: y,
    head: [["#", "Producto", "Unidades", "Total vendido"]],
    body: topProductos.length
      ? topProductos.map((p, i) => [i + 1, p.nombre, Number(p.cantidad ?? 0).toLocaleString("es-CO"), money(Number(p.total ?? 0))])
      : [["", "Sin ventas registradas", "", ""]],
    columnStyles: { 0: { cellWidth: 8, halign: "center" }, 2: { halign: "right" }, 3: { halign: "right" } },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // ── Bajo stock + Vencer (2 columnas) ─────────────────────────
  const startLastCols = y;
  y = sectionTitle("Productos con bajo stock", startLastCols, margin, margin + colW);
  autoTable(doc, {
    ...tableStyles,
    startY: y,
    tableWidth: colW,
    margin: { left: margin, right: W - margin - colW },
    head: [["Producto", "Laboratorio", "Stock", "Mín."]],
    body: bajoStockLista.length
      ? bajoStockLista.map(p => [p.nombre, p.laboratorio ?? "—", p.stock, p.stockMinimo])
      : [["Sin productos", "", "", ""]],
    columnStyles: { 2: { halign: "right" }, 3: { halign: "right" } },
    didParseCell: (d: any) => {
      if (d.section === "body" && d.column.index === 2 && Number(d.cell.raw) <= 0)
        d.cell.styles.textColor = [220, 38, 38];
    },
  });

  const yV = sectionTitle("Próximos a vencer (60 días)", startLastCols, rightColX, W - margin);
  autoTable(doc, {
    ...tableStyles,
    startY: yV,
    tableWidth: colW,
    margin: { left: rightColX, right: margin },
    head: [["Producto", "Lote", "Vence", "Stock"]],
    body: proximosVencer.length
      ? proximosVencer.map(p => [p.nombre, p.lote ?? "—", p.fechaVencimiento ?? "—", p.stock])
      : [["Sin productos", "", "", ""]],
    columnStyles: { 2: { halign: "right" }, 3: { halign: "right" } },
  });

  // ── Footer ───────────────────────────────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = 297;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 10, W - margin, pageH - 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`${brandName} · Reporte generado el ${fecha}`, margin, pageH - 6);
    doc.text(`Página ${i} de ${pageCount}`, W - margin, pageH - 6, { align: "right" });
  }

  doc.save(`reporte-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ className?: string }>; accent?: string;
}) {
  return (
    <Card className="p-3 sm:p-4">
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground leading-tight">{label}</p>
          <p className="text-sm sm:text-2xl font-bold mt-0.5 sm:mt-1 leading-tight">{value}</p>
          {sub && <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">{sub}</p>}
        </div>
        <div className={`h-7 w-7 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center shrink-0 ${accent ?? "bg-primary/10 text-primary"}`}>
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
      </div>
    </Card>
  );
}

function ReportesPage() {
  const { brandName, logoUrl, config } = useBranding();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [error, setError] = useState(false);
  const [generando, setGenerando] = useState(false);

  const handleDescargar = async () => {
    if (!data) return;
    setGenerando(true);
    try {
      await descargarReportePDF(data, brandName, logoUrl, config);
      toast.success("Reporte descargado");
    } catch {
      toast.error("Error al generar el PDF");
    } finally {
      setGenerando(false);
    }
  };

  useEffect(() => {
    dashboardApi.reportes()
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) return <div className="p-6 text-destructive">Error al cargar los reportes.</div>;
  if (!data) return <div className="p-6 text-muted-foreground">Cargando…</div>;

  const ventasPorDia    = Array.isArray(data.ventasPorDia)    ? data.ventasPorDia    : [];
  const topProductos    = Array.isArray(data.topProductos)    ? data.topProductos    : [];
  const ventasPorMetodo = Array.isArray(data.ventasPorMetodo) ? data.ventasPorMetodo : [];
  const proximosVencer  = Array.isArray(data.proximosVencer)  ? data.proximosVencer  : [];
  const bajoStockLista  = Array.isArray(data.bajoStockLista)  ? data.bajoStockLista  : [];

  const top20Bar = topProductos.map(p => ({
    nombre: p.nombre.length > 12 ? p.nombre.slice(0, 12) + "…" : p.nombre,
    cantidad: Number(p.cantidad ?? 0),
  }));

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Reportes"
        description="Visión consolidada de la operación."
        actions={
          <Button onClick={handleDescargar} disabled={generando}>
            {generando
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generando…</>
              : <><FileDown className="h-4 w-4 mr-2" />Descargar reporte</>}
          </Button>
        }
      />

      {/* ── Tarjetas ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Ventas hoy"       value={String(data.ventasHoy  ?? 0)} sub={money(data.totalHoy  ?? 0)} icon={ShoppingCart} />
        <StatCard label="Ventas mes"       value={String(data.ventasMes  ?? 0)} sub={money(data.totalMes  ?? 0)} icon={TrendingUp}   accent="bg-green-500/10 text-green-600" />
        <StatCard label="Ingresos hoy"     value={money(data.totalHoy    ?? 0)} icon={DollarSign}                accent="bg-blue-500/10 text-blue-600" />
        <StatCard label="Ingresos mes"     value={money(data.totalMes    ?? 0)} icon={DollarSign}                accent="bg-indigo-500/10 text-indigo-600" />
        <StatCard label="Valor inventario" value={money(data.valorInventario ?? 0)} icon={Boxes}                accent="bg-purple-500/10 text-purple-600" />
        <StatCard label="Bajo stock"       value={String(data.bajoStock  ?? 0)} icon={Package}                  accent="bg-orange-500/10 text-orange-600" />
      </div>

      {/* ── Líneas: evolución 30 días ── */}
      {ventasPorDia.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Evolución de ventas — últimos 30 días</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={ventasPorDia} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(Number(v) / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number, name) => [name === "Ingresos ($)" ? money(v) : v, name]} labelFormatter={l => `Fecha: ${l}`} />
              <Legend />
              <Line type="monotone" dataKey="total"    name="Ingresos ($)" stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cantidad" name="Nº ventas"    stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Barras horizontales: top 20 ── */}
        {top20Bar.length > 0 && (
          <Card className="p-5">
            <h2 className="font-semibold mb-4">Top 20 productos más vendidos</h2>
            <ResponsiveContainer width="100%" height={Math.max(300, top20Bar.length * 22)}>
              <BarChart data={top20Bar} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10 }} width={80} />
                <Tooltip formatter={(v: number) => [v, "Unidades"]} />
                <Bar dataKey="cantidad" name="Unidades" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* ── Pastel: método de pago ── */}
        {ventasPorMetodo.length > 0 && (
          <Card className="p-5">
            <h2 className="font-semibold mb-4">Distribución por método de pago</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ventasPorMetodo}
                  dataKey="cantidad"
                  nameKey="metodo"
                  cx="50%" cy="45%"
                  outerRadius={100}
                  label={({ metodo, percent }) => `${metodo} ${(percent * 100).toFixed(0)}%`}
                >
                  {ventasPorMetodo.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [v + " ventas", "Cantidad"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* ── Tabla Top 20 ── */}
      {topProductos.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold mb-3">Top 20 productos vendidos</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead className="text-right">Total vendido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProductos.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground font-mono text-xs">{i + 1}</TableCell>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell className="text-right">{Number(p.cantidad ?? 0).toLocaleString("es-CO")}</TableCell>
                    <TableCell className="text-right font-medium">{money(p.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Bajo stock ── */}
        <Card className="p-5">
          <h2 className="font-semibold mb-3">Productos con bajo stock</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bajoStockLista.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="font-medium">{p.nombre}</div>
                      {p.laboratorio && <div className="text-xs text-muted-foreground">{p.laboratorio}</div>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={p.stock <= 0 ? "destructive" : "secondary"}>{p.stock}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{p.stockMinimo}</TableCell>
                  </TableRow>
                ))}
                {bajoStockLista.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Sin productos con bajo stock</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* ── Próximos a vencer ── */}
        <Card className="p-5">
          <h2 className="font-semibold mb-3">Próximos a vencer (60 días)</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead className="text-right">Vence</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proximosVencer.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{p.lote || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive" className="text-xs">{p.fechaVencimiento}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{p.stock}</TableCell>
                  </TableRow>
                ))}
                {proximosVencer.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Sin productos próximos a vencer</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
