import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { productosApi, type Producto } from "@/api/productos";
import { clientesApi, type Cliente } from "@/api/clientes";
import { ventasApi, type Venta } from "@/api/ventas";
import { useBranding } from "@/hooks/use-branding";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";
import { Plus, Minus, Trash2, ScanLine, Printer, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ventas")({ component: VentasPage });

type Item = { producto: Producto; cantidad: number };
type ClienteForm = { tipoDocumento: string; documento: string; nombre: string; telefono: string };
type PrintCliente = { nombre: string; tipoDocumento: string; documento: string; telefono?: string | null } | null;
type PrintItem = { nombre: string; cantidad: number; precioUnitario: number };
type PrintData = { venta: Venta; cliente: PrintCliente; items: PrintItem[]; subtotal: number; iva: number; descuento: number; total: number };

function esc(s: string) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function generarDocumento(
  win: Window,
  venta: { numero?: number | null; tipoVenta: string; numeroFactura?: string | null; metodoPago: string; createdAt: string },
  cliente: PrintCliente,
  items: PrintItem[],
  subtotal: number,
  iva: number,
  descuento: number,
  total: number,
  brandName: string,
) {
  const esFactura = venta.tipoVenta === "FACTURADA";
  const fecha = new Date(venta.createdAt).toLocaleString("es-CO");
  const money = (n: number) => `$ ${Number(n).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

  let html: string;

  if (esFactura) {
    const filas = items.map(it => `
      <tr>
        <td>${esc(it.nombre)}</td>
        <td class="c">${it.cantidad}</td>
        <td class="r">${money(it.precioUnitario)}</td>
        <td class="r">${money(it.precioUnitario * it.cantidad)}</td>
      </tr>`).join("");

    html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>Factura ${esc(String(venta.numeroFactura ?? venta.numero ?? ""))}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:11px;color:#000;padding:20px}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:12px}
.brand{font-size:20px;font-weight:bold}.brand-sub{font-size:10px;color:#666;margin-top:2px}
.fnum{font-size:15px;font-weight:bold;text-align:right}.fsub{text-align:right;margin-top:4px}
.info{display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#f9f9f9;border:1px solid #ddd;border-radius:4px;padding:10px;margin-bottom:12px}
.lbl{font-weight:bold;font-size:9px;color:#555;text-transform:uppercase;margin-bottom:2px}
table{width:100%;border-collapse:collapse;margin-bottom:12px}
th{background:#333;color:#fff;padding:6px 8px;font-size:10px;text-transform:uppercase;text-align:left}
td{padding:6px 8px;border-bottom:1px solid #eee}
tr:nth-child(even) td{background:#fafafa}
.c{text-align:center}.r{text-align:right}
.tot{width:260px;margin-left:auto}
.tot td{border:none;padding:3px 8px}
.tot-total{font-weight:bold;font-size:14px;border-top:2px solid #000}
.footer{text-align:center;font-size:10px;color:#888;margin-top:20px;border-top:1px dashed #ccc;padding-top:10px}
@media print{body{padding:10px}}
</style></head><body>
<div class="hdr">
  <div><div class="brand">${esc(brandName)}</div><div class="brand-sub">Farmacia · Sistema de Gestión</div></div>
  <div>
    <div class="fnum">FACTURA DE VENTA</div>
    <div class="fsub"><strong>N°:</strong> ${esc(String(venta.numeroFactura ?? venta.numero ?? ""))}</div>
    <div class="fsub"><strong>Fecha:</strong> ${fecha}</div>
    <div class="fsub"><strong>Pago:</strong> ${esc(venta.metodoPago)}</div>
  </div>
</div>
<div class="info">
  <div>
    <div class="lbl">Cliente</div>
    <div><strong>${esc(cliente?.nombre ?? "Consumidor Final")}</strong></div>
    <div>${esc(cliente?.tipoDocumento ?? "CC")}: ${esc(cliente?.documento ?? "222222222222")}</div>
    ${cliente?.telefono ? `<div>Tel: ${esc(cliente.telefono)}</div>` : ""}
  </div>
  <div>
    <div class="lbl">Datos de factura</div>
    <div>N° Venta: ${venta.numero ?? ""}</div>
    <div>Estado: Completada</div>
  </div>
</div>
<table>
  <thead><tr><th>Producto</th><th class="c">Cant.</th><th class="r">Precio unit.</th><th class="r">Total</th></tr></thead>
  <tbody>${filas}</tbody>
</table>
<table class="tot">
  <tr><td>Subtotal:</td><td class="r">${money(subtotal)}</td></tr>
  <tr><td>IVA:</td><td class="r">${money(iva)}</td></tr>
  ${descuento > 0 ? `<tr><td>Descuento:</td><td class="r">− ${money(descuento)}</td></tr>` : ""}
  <tr class="tot-total"><td><strong>TOTAL:</strong></td><td class="r"><strong>${money(total)}</strong></td></tr>
</table>
<div class="footer">${esc(brandName)} · Gracias por su compra</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;
  } else {
    const filas = items.map(it => `
      <div class="item"><span>${esc(it.nombre)}</span><span>${money(it.precioUnitario * it.cantidad)}</span></div>
      <div class="det">${it.cantidad} × ${money(it.precioUnitario)}</div>`).join("");

    html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>Ticket #${venta.numero ?? ""}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:monospace;font-size:12px;width:300px;margin:0 auto;color:#000;padding:8px}
h1{font-size:15px;font-weight:bold;text-align:center;margin-bottom:2px}
.sub{font-size:11px;text-align:center;color:#555}
.c{text-align:center}
.div{border-top:1px dashed #555;margin:8px 0}
.item{display:flex;justify-content:space-between;font-size:11px;margin-top:4px}
.det{font-size:10px;color:#666;margin-bottom:2px}
.total{font-weight:bold;font-size:13px}
.thanks{font-size:10px;text-align:center;margin-top:8px}
@media print{body{width:300px}}
</style></head><body>
<h1>${esc(brandName)}</h1>
<div class="sub">Farmacia</div>
<div class="div"></div>
<div class="c">Ticket #${venta.numero ?? ""}</div>
<div class="c">${fecha}</div>
<div class="c">Pago: ${esc(venta.metodoPago)}</div>
<div class="div"></div>
${filas}
<div class="div"></div>
${descuento > 0 ? `<div class="item"><span>Descuento:</span><span>− ${money(descuento)}</span></div>` : ""}
<div class="item total"><span>TOTAL:</span><span>${money(total)}</span></div>
<div class="div"></div>
<div class="c">Consumidor Final</div>
<div class="c">Doc: 222222222222</div>
<div class="div"></div>
<div class="thanks">¡Gracias por su compra!</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;
  }

  win.document.write(html);
  win.document.close();
  win.focus();
}

function VentasPage() {
  const { brandName } = useBranding();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [cliente, setCliente] = useState("ninguno");
  const [tipoVenta, setTipoVenta] = useState<"CONSUMIDOR_FINAL" | "FACTURADA">("CONSUMIDOR_FINAL");
  const [metodo, setMetodo] = useState("efectivo");
  const [descuento, setDescuento] = useState(0);
  const [historial, setHistorial] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);
  const [openNuevoCliente, setOpenNuevoCliente] = useState(false);
  const [clienteForm, setClienteForm] = useState<ClienteForm>({ tipoDocumento: "CC", documento: "", nombre: "", telefono: "" });
  const [savingCliente, setSavingCliente] = useState(false);
  const [ventaParaImprimir, setVentaParaImprimir] = useState<PrintData | null>(null);
  const [qHistorial, setQHistorial] = useState("");
  const [reimprimiendo, setReimprimiendo] = useState<string | null>(null);

  const load = async () => {
    const [p, c, v] = await Promise.all([
      productosApi.disponibles(),
      clientesApi.listar(),
      ventasApi.listar(),
    ]);
    setProductos(p); setClientes(c); setHistorial(v);
  };
  useEffect(() => { load(); }, []);

  const filtrados = useMemo(() => {
    if (!q) return productos.slice(0, 8);
    const s = q.toLowerCase();
    return productos.filter(p =>
      p.nombre.toLowerCase().includes(s) ||
      p.codigo.toLowerCase().includes(s) ||
      (p.codigoBarras ?? "").includes(q)
    ).slice(0, 8);
  }, [q, productos]);

  const historialFiltrado = useMemo(() => {
    if (!qHistorial) return historial;
    const s = qHistorial.toLowerCase();
    return historial.filter(v =>
      String(v.numero).includes(s) ||
      v.metodoPago.toLowerCase().includes(s) ||
      (v.numeroFactura ?? "").toLowerCase().includes(s)
    );
  }, [historial, qHistorial]);

  const addProd = (p: Producto) => {
    setItems(prev => {
      const i = prev.find(x => x.producto.id === p.id);
      if (i) {
        if (i.cantidad >= p.stock) { toast.error("Stock insuficiente"); return prev; }
        return prev.map(x => x.producto.id === p.id ? { ...x, cantidad: x.cantidad + 1 } : x);
      }
      return [...prev, { producto: p, cantidad: 1 }];
    });
    setQ("");
  };

  const cambiar = (id: string, delta: number) =>
    setItems(prev => prev.flatMap(it => {
      if (it.producto.id !== id) return [it];
      const nueva = it.cantidad + delta;
      if (nueva <= 0) return [];
      if (nueva > it.producto.stock) { toast.error("Stock insuficiente"); return [it]; }
      return [{ ...it, cantidad: nueva }];
    }));

  const subtotal = items.reduce((s, it) => s + Number(it.producto.precioVenta) * it.cantidad, 0);
  const iva = items.reduce((s, it) => s + Number(it.producto.precioVenta) * it.cantidad * (Number(it.producto.iva) / 100), 0);
  const total = Math.max(0, subtotal + iva - descuento);

  const guardarNuevoCliente = async () => {
    if (!clienteForm.documento || !clienteForm.nombre) return toast.error("Documento y nombre son obligatorios");
    setSavingCliente(true);
    try {
      const c = await clientesApi.crear({
        tipoDocumento: clienteForm.tipoDocumento,
        documento: clienteForm.documento,
        nombre: clienteForm.nombre,
        telefono: clienteForm.telefono || undefined,
      });
      toast.success("Cliente registrado");
      setClientes(prev => [...prev, c]);
      setCliente(c.id);
      setOpenNuevoCliente(false);
      setClienteForm({ tipoDocumento: "CC", documento: "", nombre: "", telefono: "" });
    } catch (err: any) {
      toast.error(err.response?.data ?? "Error al registrar cliente");
    } finally {
      setSavingCliente(false);
    }
  };

  const confirmar = async () => {
    if (items.length === 0) return toast.error("Agrega al menos un producto");
    if (tipoVenta === "FACTURADA" && cliente === "ninguno")
      return toast.error("Selecciona un cliente para generar la factura");
    setLoading(true);
    try {
      const venta = await ventasApi.crear({
        clienteId: tipoVenta === "FACTURADA" ? cliente : null,
        items: items.map(it => ({ productoId: it.producto.id, cantidad: it.cantidad, precioUnitario: Number(it.producto.precioVenta) })),
        descuento, metodoPago: metodo, tipoVenta,
      });
      toast.success("Venta registrada correctamente");
      const clienteObj = tipoVenta === "FACTURADA" ? (clientes.find(c => c.id === cliente) ?? null) : null;
      const snap = { items: [...items], subtotal, iva, descuento, total };
      setItems([]); setDescuento(0); setCliente("ninguno"); setTipoVenta("CONSUMIDOR_FINAL");
      load();
      setVentaParaImprimir({
        venta,
        cliente: clienteObj ? { nombre: clienteObj.nombre, tipoDocumento: clienteObj.tipoDocumento ?? "CC", documento: clienteObj.documento ?? "", telefono: clienteObj.telefono } : null,
        items: snap.items.map(it => ({ nombre: it.producto.nombre, cantidad: it.cantidad, precioUnitario: Number(it.producto.precioVenta) })),
        subtotal: snap.subtotal, iva: snap.iva, descuento: snap.descuento, total: snap.total,
      });
    } catch (err: any) {
      toast.error(err.response?.data ?? err.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  const reimprimir = async (ventaId: string) => {
    setReimprimiendo(ventaId);
    try {
      const detalle = await ventasApi.obtenerDetalle(ventaId);
      const win = window.open("", "_blank");
      if (!win) { toast.error("Activa ventanas emergentes para reimprimir"); return; }
      generarDocumento(
        win, detalle,
        detalle.clienteNombre ? { nombre: detalle.clienteNombre, tipoDocumento: detalle.clienteTipoDocumento ?? "CC", documento: detalle.clienteDocumento ?? "" } : null,
        detalle.items.map(it => ({ nombre: it.productoNombre, cantidad: it.cantidad, precioUnitario: Number(it.precioUnitario) })),
        Number(detalle.subtotal), Number(detalle.iva), Number(detalle.descuento), Number(detalle.total),
        brandName,
      );
    } catch {
      toast.error("Error al cargar los datos de la venta");
    } finally {
      setReimprimiendo(null);
    }
  };

  const money = (n: number) => `$ ${n.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <PageHeader title="Punto de venta" description="Registra ventas y consulta el historial." />
      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        <div className="space-y-4">
          {/* Búsqueda */}
          <Card className="p-4">
            <Label className="text-xs">Buscar producto o escanear código</Label>
            <div className="relative mt-1">
              <ScanLine className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" autoFocus placeholder="Nombre, código o código de barras…" value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && filtrados[0]) addProd(filtrados[0]); }} />
            </div>
            {q && (
              <div className="mt-2 border rounded-md divide-y bg-card">
                {filtrados.map(p => (
                  <button key={p.id} className="w-full px-3 py-2 text-left hover:bg-muted" onClick={() => addProd(p)}>
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.nombre}<span className="text-xs text-muted-foreground"> · {p.codigo}</span></div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                          {p.marca && <span>Marca: {p.marca}</span>}
                          {p.lote && <span>Lote: {p.lote}</span>}
                        </div>
                      </div>
                      <div className="text-sm text-right whitespace-nowrap">
                        <div>{money(Number(p.precioVenta))}</div>
                        <div className="text-muted-foreground text-xs">stock {p.stock}</div>
                      </div>
                    </div>
                  </button>
                ))}
                {filtrados.length === 0 && <p className="px-3 py-3 text-sm text-muted-foreground">Sin resultados</p>}
              </div>
            )}
          </Card>

          {/* Carrito */}
          <Card className="p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(it => (
                    <TableRow key={it.producto.id}>
                      <TableCell className="font-medium">{it.producto.nombre}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-center">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => cambiar(it.producto.id, -1)}><Minus className="h-3 w-3" /></Button>
                          <span className="w-8 text-center">{it.cantidad}</span>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => cambiar(it.producto.id, 1)}><Plus className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{money(Number(it.producto.precioVenta))}</TableCell>
                      <TableCell className="text-right font-medium">{money(Number(it.producto.precioVenta) * it.cantidad)}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => setItems(items.filter(x => x.producto.id !== it.producto.id))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Agrega productos al carrito</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Historial de ventas */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <h3 className="text-sm font-semibold shrink-0">Historial de ventas</h3>
              <Input
                placeholder="Buscar por #, método o factura…"
                value={qHistorial}
                onChange={e => setQHistorial(e.target.value)}
                className="h-8 text-sm max-w-[230px]"
              />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historialFiltrado.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-xs">{v.numero}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{new Date(v.createdAt).toLocaleString("es-CO")}</TableCell>
                      <TableCell>
                        {v.tipoVenta === "FACTURADA"
                          ? <Badge variant="default" className="text-xs">{v.numeroFactura ?? "Factura"}</Badge>
                          : <Badge variant="secondary" className="text-xs">Consumidor</Badge>}
                      </TableCell>
                      <TableCell className="text-xs capitalize">{v.metodoPago}</TableCell>
                      <TableCell className="text-right text-xs font-medium">{money(Number(v.total))}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1"
                          onClick={() => reimprimir(v.id)}
                          disabled={reimprimiendo === v.id}
                        >
                          <Printer className="h-3 w-3" />
                          {reimprimiendo === v.id ? "…" : "Reimprimir"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {historialFiltrado.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Sin ventas</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Panel resumen */}
        <Card className="p-5 h-fit sticky top-4" style={{ boxShadow: "var(--shadow-soft)" }}>
          <h2 className="font-semibold mb-4">Resumen</h2>
          <div className="space-y-3 mb-4">
            {/* ¿Desea factura? */}
            <div>
              <Label className="text-xs mb-1 block">¿Desea factura?</Label>
              <div className="flex rounded-md border overflow-hidden text-sm font-medium">
                <button type="button"
                  onClick={() => { setTipoVenta("CONSUMIDOR_FINAL"); setCliente("ninguno"); }}
                  className={`flex-1 px-3 py-2 transition-colors ${tipoVenta === "CONSUMIDOR_FINAL" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                  No
                </button>
                <button type="button"
                  onClick={() => setTipoVenta("FACTURADA")}
                  className={`flex-1 px-3 py-2 border-l transition-colors ${tipoVenta === "FACTURADA" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                  Sí
                </button>
              </div>
            </div>

            {/* Cliente */}
            {tipoVenta === "FACTURADA" ? (
              <div>
                <Label className="text-xs">Cliente *</Label>
                <div className="flex gap-2 mt-1">
                  <Select value={cliente} onValueChange={setCliente}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar cliente…" /></SelectTrigger>
                    <SelectContent>
                      {clientes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre} · {c.tipoDocumento} {c.documento}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="outline" onClick={() => setOpenNuevoCliente(true)} title="Registrar nuevo cliente">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {cliente === "ninguno" && <p className="text-xs text-destructive mt-1">Requerido para generar factura</p>}
              </div>
            ) : (
              <div>
                <Label className="text-xs">Cliente</Label>
                <div className="mt-1 px-3 py-2 rounded-md bg-muted text-sm text-muted-foreground border">
                  Consumidor Final · Doc: 222222222222
                </div>
              </div>
            )}

            {/* Método de pago */}
            <div>
              <Label className="text-xs">Método de pago</Label>
              <Select value={metodo} onValueChange={setMetodo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="nequi">Nequi</SelectItem>
                  <SelectItem value="daviplata">Daviplata</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Descuento */}
            <div>
              <Label className="text-xs">Descuento ($)</Label>
              <Input type="number" value={descuento} onChange={e => setDescuento(Number(e.target.value) || 0)} />
            </div>
          </div>

          {/* Totales */}
          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="flex justify-between"><span>IVA</span><span>{money(iva)}</span></div>
            <div className="flex justify-between"><span>Descuento</span><span>− {money(descuento)}</span></div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2">
              <span>Total</span><span>{money(total)}</span>
            </div>
          </div>

          <div className="mt-3 mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Printer className="h-3 w-3" />
            <span>{tipoVenta === "FACTURADA" ? "Se generará factura PDF" : "Se generará ticket de venta"}</span>
          </div>

          <Button className="w-full mt-2" size="lg" onClick={confirmar} disabled={loading || items.length === 0}>
            {loading ? "Procesando…" : "Confirmar venta"}
          </Button>
        </Card>
      </div>

      {/* Diálogo: ¿Desea imprimir? */}
      <Dialog open={!!ventaParaImprimir} onOpenChange={v => !v && setVentaParaImprimir(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Venta registrada
            </DialogTitle>
          </DialogHeader>
          {ventaParaImprimir && (
            <div className="text-center py-3 space-y-2">
              <div className="text-3xl font-bold">{money(ventaParaImprimir.total)}</div>
              <div className="text-sm text-muted-foreground">Venta #{ventaParaImprimir.venta.numero}</div>
              <div>
                {ventaParaImprimir.venta.tipoVenta === "FACTURADA"
                  ? <Badge variant="default">{ventaParaImprimir.venta.numeroFactura ?? "Factura"}</Badge>
                  : <Badge variant="secondary">Consumidor Final</Badge>}
              </div>
            </div>
          )}
          <p className="text-sm text-center text-muted-foreground">¿Desea imprimir el documento?</p>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setVentaParaImprimir(null)}>
              No, cerrar
            </Button>
            <Button className="flex-1" onClick={() => {
              if (!ventaParaImprimir) return;
              const win = window.open("", "_blank");
              if (win) generarDocumento(win, ventaParaImprimir.venta, ventaParaImprimir.cliente, ventaParaImprimir.items, ventaParaImprimir.subtotal, ventaParaImprimir.iva, ventaParaImprimir.descuento, ventaParaImprimir.total, brandName);
              else toast.error("Activa ventanas emergentes para imprimir");
              setVentaParaImprimir(null);
            }}>
              <Printer className="h-4 w-4 mr-1" />
              Sí, imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: Registrar nuevo cliente */}
      <Dialog open={openNuevoCliente} onOpenChange={v => { setOpenNuevoCliente(v); if (!v) setClienteForm({ tipoDocumento: "CC", documento: "", nombre: "", telefono: "" }); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Registrar cliente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Tipo de documento</Label>
              <Select value={clienteForm.tipoDocumento} onValueChange={v => setClienteForm({ ...clienteForm, tipoDocumento: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CC">Cédula de ciudadanía (CC)</SelectItem>
                  <SelectItem value="NIT">NIT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">N° de documento *</Label>
              <Input value={clienteForm.documento} onChange={e => setClienteForm({ ...clienteForm, documento: e.target.value })} placeholder="Ej: 1234567890" />
            </div>
            <div>
              <Label className="text-xs">Nombre completo *</Label>
              <Input value={clienteForm.nombre} onChange={e => setClienteForm({ ...clienteForm, nombre: e.target.value })} placeholder="Nombre del cliente" />
            </div>
            <div>
              <Label className="text-xs">Teléfono</Label>
              <Input value={clienteForm.telefono} onChange={e => setClienteForm({ ...clienteForm, telefono: e.target.value })} placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={guardarNuevoCliente} disabled={savingCliente} className="w-full">
              {savingCliente ? "Guardando…" : "Guardar cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
