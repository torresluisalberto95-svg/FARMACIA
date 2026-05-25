import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { productosApi, type Producto } from "@/api/productos";
import { clientesApi, type Cliente } from "@/api/clientes";
import { ventasApi, type Venta } from "@/api/ventas";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";
import { Plus, Minus, Trash2, ScanLine } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ventas")({ component: VentasPage });

type Item = { producto: Producto; cantidad: number };

function VentasPage() {
  const { user } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [cliente, setCliente] = useState<string>("ninguno");
  const [metodo, setMetodo] = useState("efectivo");
  const [descuento, setDescuento] = useState(0);
  const [historial, setHistorial] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);

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
    return productos.filter(p => p.nombre.toLowerCase().includes(s) || p.codigo.toLowerCase().includes(s) || (p.codigoBarras ?? "").includes(q)).slice(0, 8);
  }, [q, productos]);

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

  const confirmar = async () => {
    if (items.length === 0) return toast.error("Agrega al menos un producto");
    setLoading(true);
    try {
      const venta = await ventasApi.crear({
        clienteId: cliente === "ninguno" ? null : cliente,
        items: items.map(it => ({ productoId: it.producto.id, cantidad: it.cantidad, precioUnitario: Number(it.producto.precioVenta) })),
        descuento, metodoPago: metodo,
      });
      toast.success(`Venta #${venta.numero} registrada`);
      setItems([]); setDescuento(0); setCliente("ninguno"); load();
    } catch (err: any) {
      toast.error(err.response?.data ?? err.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  const money = (n: number) => `$ ${n.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Punto de venta" description="Registra ventas y genera tickets." />
      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        <div className="space-y-4">
          <Card className="p-4">
            <Label className="text-xs">Buscar producto o escanear código</Label>
            <div className="relative">
              <ScanLine className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" autoFocus placeholder="Nombre, código o código de barras…" value={q} onChange={e => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && filtrados[0]) addProd(filtrados[0]); }} />
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
          <Card className="p-4">
            <Table>
              <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead className="text-center">Cant.</TableHead><TableHead className="text-right">Precio</TableHead><TableHead className="text-right">Subtotal</TableHead><TableHead /></TableRow></TableHeader>
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
                    <TableCell><Button size="icon" variant="ghost" onClick={() => setItems(items.filter(x => x.producto.id !== it.producto.id))}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Agrega productos al carrito</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-2">Últimas ventas</h3>
            <ul className="text-sm divide-y">
              {historial.map(v => (
                <li key={v.id} className="flex justify-between py-2">
                  <span>#{v.numero} · {v.metodoPago} · {new Date(v.createdAt).toLocaleString("es-CO")}</span>
                  <span className="font-medium">{money(Number(v.total))}</span>
                </li>
              ))}
              {historial.length === 0 && <li className="py-2 text-muted-foreground">Sin ventas</li>}
            </ul>
          </Card>
        </div>
        <Card className="p-5 h-fit sticky top-4" style={{ boxShadow: "var(--shadow-soft)" }}>
          <h2 className="font-semibold mb-4">Resumen</h2>
          <div className="space-y-3 mb-4">
            <div>
              <Label className="text-xs">Cliente</Label>
              <Select value={cliente} onValueChange={setCliente}>
                <SelectTrigger><SelectValue placeholder="Consumidor final" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno">Consumidor final</SelectItem>
                  {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
            <div>
              <Label className="text-xs">Descuento</Label>
              <Input type="number" value={descuento} onChange={e => setDescuento(Number(e.target.value) || 0)} />
            </div>
          </div>
          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="flex justify-between"><span>IVA</span><span>{money(iva)}</span></div>
            <div className="flex justify-between"><span>Descuento</span><span>− {money(descuento)}</span></div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2"><span>Total</span><span>{money(total)}</span></div>
          </div>
          <Button className="w-full mt-4" size="lg" onClick={confirmar} disabled={loading || items.length === 0}>
            {loading ? "Procesando…" : "Confirmar venta"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
