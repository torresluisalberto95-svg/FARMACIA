import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { productosApi, type Producto } from "@/api/productos";
import { proveedoresApi, type Proveedor } from "@/api/proveedores";
import { comprasApi, type Compra } from "@/api/compras";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/compras")({ component: ComprasPage });

function ComprasPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [historial, setHistorial] = useState<Compra[]>([]);
  const [proveedor, setProveedor] = useState<string>("");
  const [items, setItems] = useState<{ productoId: string; cantidad: number; precio: number }[]>([]);
  const [pid, setPid] = useState(""); const [cant, setCant] = useState(1); const [precio, setPrecio] = useState(0);

  const load = async () => {
    const [p, pr, h] = await Promise.all([productosApi.listar(), proveedoresApi.listar(), comprasApi.listar()]);
    setProductos(p); setProveedores(pr); setHistorial(h);
  };
  useEffect(() => { load(); }, []);

  const total = useMemo(() => items.reduce((s, i) => s + i.cantidad * i.precio, 0), [items]);

  const addItem = () => {
    if (!pid || cant <= 0 || precio <= 0) return toast.error("Producto, cantidad y precio requeridos");
    setItems([...items, { productoId: pid, cantidad: cant, precio }]);
    setPid(""); setCant(1); setPrecio(0);
  };

  const guardar = async () => {
    if (items.length === 0) return toast.error("Agrega productos");
    try {
      const c = await comprasApi.crear({
        proveedorId: proveedor || null,
        items: items.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, precioUnitario: i.precio })),
      });
      toast.success(`Compra #${c.numero} registrada (stock actualizado)`);
      setItems([]); setProveedor(""); load();
    } catch (err: any) {
      toast.error(err.response?.data ?? err.message ?? "Error");
    }
  };

  const money = (n: number) => `$ ${n.toLocaleString("es-CO")}`;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader title="Compras" description="Registra compras a proveedores. El stock se actualiza automáticamente." />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-semibold mb-3">Nueva compra</h2>
          <Label>Proveedor</Label>
          <Select value={proveedor} onValueChange={setProveedor}>
            <SelectTrigger><SelectValue placeholder="Sin proveedor" /></SelectTrigger>
            <SelectContent>{proveedores.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
          </Select>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-[1fr_80px_120px_auto] gap-2 items-end">
            <div><Label className="text-xs">Producto</Label>
              <Select value={pid} onValueChange={v => { setPid(v); const p = productos.find(x => x.id === v); if (p) setPrecio(Number(p.precioCompra)); }}>
                <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                <SelectContent>{productos.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Cant.</Label><Input type="number" value={cant} onChange={e => setCant(Number(e.target.value))} /></div>
            <div><Label className="text-xs">Precio</Label><Input type="number" value={precio} onChange={e => setPrecio(Number(e.target.value))} /></div>
            <Button size="icon" onClick={addItem}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="overflow-x-auto mt-4"><Table>
            <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead>Cant</TableHead><TableHead>Precio</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {items.map((it, i) => {
                const p = productos.find(x => x.id === it.productoId);
                return <TableRow key={i}><TableCell>{p?.nombre}</TableCell><TableCell>{it.cantidad}</TableCell><TableCell>{money(it.precio)}</TableCell>
                  <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => setItems(items.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>;
              })}
              {items.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">Sin productos</TableCell></TableRow>}
            </TableBody>
          </Table></div>
          <div className="flex justify-between items-center mt-4 border-t pt-4">
            <span className="font-semibold">Total: {money(total)}</span>
            <Button onClick={guardar} disabled={items.length === 0}>Registrar compra</Button>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold mb-3">Historial</h2>
          <ul className="divide-y text-sm">
            {historial.map(h => (
              <li key={h.id} className="py-2 flex justify-between">
                <span>#{h.numero} · {new Date(h.createdAt).toLocaleDateString("es-CO")}</span>
                <span className="font-medium">{money(Number(h.total))}</span>
              </li>
            ))}
            {historial.length === 0 && <li className="py-4 text-muted-foreground">Sin compras</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
