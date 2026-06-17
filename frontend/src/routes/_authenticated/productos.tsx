import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { productosApi, type Producto } from "@/api/productos";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/page-header";
import { Plus, Pencil, Trash2, Download, Upload, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/productos")({ component: ProductosPage });

const empty: Partial<Producto> = { codigo: "", nombre: "", precioCompra: 0, precioVenta: 0, iva: 19, stock: 0, stockMinimo: 5, activo: true, tipoMedicamento: "comercial" };

function ProductosPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [items, setItems] = useState<Producto[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Producto>>(empty);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmTodos, setConfirmTodos] = useState(false);
  const [deletingTodos, setDeletingTodos] = useState(false);

  const load = () => productosApi.listar().then(setItems).catch(console.error);
  useEffect(() => { load(); }, []);

  const filtered = items.filter(p =>
    p.nombre.toLowerCase().includes(q.toLowerCase()) ||
    p.codigo.toLowerCase().includes(q.toLowerCase()) ||
    (p.codigoBarras ?? "").includes(q)
  );

  const save = async () => {
    if (!editing.codigo || !editing.nombre) return toast.error("Código y nombre son obligatorios");
    try {
      if (editing.id) {
        await productosApi.actualizar(editing.id, editing);
      } else {
        await productosApi.crear(editing);
      }
      toast.success("Producto guardado");
      setOpen(false); setEditing(empty); load();
    } catch (err: any) {
      toast.error(err.response?.data ?? err.message ?? "Error");
    }
  };

  const remove = async (id: string) => {
    try {
      await productosApi.eliminar(id);
      toast.success("Producto eliminado");
      load();
    } catch (err: any) {
      toast.error(err.response?.data ?? "Error al eliminar");
    } finally {
      setConfirmDelete(null);
    }
  };

  const eliminarTodos = async () => {
    setDeletingTodos(true);
    try {
      const msg = await productosApi.eliminarTodos();
      toast.success(msg ?? "Inventario eliminado");
      load();
    } catch (err: any) {
      toast.error(err.response?.data ?? "Error al eliminar inventario");
    } finally {
      setDeletingTodos(false);
      setConfirmTodos(false);
    }
  };

  const exportarExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = items.map(p => ({
      codigo: p.codigo, codigo_barras: p.codigoBarras ?? "", nombre: p.nombre,
      tipo_medicamento: p.tipoMedicamento, marca: p.marca ?? "", laboratorio: p.laboratorio ?? "",
      registro_invima: p.registroInvima ?? "", lote: p.lote ?? "",
      fecha_vencimiento: p.fechaVencimiento ?? "", precio_compra: p.precioCompra,
      precio_venta: p.precioVenta, iva: p.iva, stock: p.stock, stock_minimo: p.stockMinimo,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Inventario exportado");
  };

  const importarExcel = async (file: File) => {
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      // cellDates:true convierte fechas seriales de Excel en objetos Date
      const wb = XLSX.read(buf, { cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
      if (!rows.length) return toast.error("Archivo vacío");

      // Normaliza clave: minúsculas + sin tildes + espacios→guión bajo
      const norm = (s: string) =>
        s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "_");

      // Busca el valor de una celda probando múltiples nombres de columna posibles.
      // Fase 1: coincidencia exacta (prioridad). Fase 2: prefijo (tolera nombres truncados).
      const col = (r: Record<string, any>, ...keys: string[]): any => {
        const normed = Object.entries(r).map(([k, v]) => [norm(k), v] as [string, any]);
        for (const k2 of keys) {
          const nk2 = norm(k2);
          const found = normed.find(([nk]) => nk === nk2);
          if (found) return found[1];
        }
        for (const k2 of keys) {
          const nk2 = norm(k2);
          const found = normed.find(([nk]) => nk !== nk2 && nk2.startsWith(nk));
          if (found) return found[1];
        }
        return undefined;
      };

      // Convierte fecha: serialDate, Date object o string ISO → "YYYY-MM-DD" o null
      const fmtDate = (v: any): string | null => {
        if (!v && v !== 0) return null;
        if (v instanceof Date) return v.toISOString().slice(0, 10);
        const s = String(v).trim();
        // Fecha ISO ya formateada
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
        // Número serial de Excel (días desde 1900)
        const n = Number(s);
        if (!isNaN(n) && n > 1000) {
          const d = XLSX.SSF.parse_date_code(n);
          if (d) return `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`;
        }
        return null;
      };

      let autoIdx = 1;
      const payload: Partial<Producto>[] = rows.map(r => {
        const nombre = String(
          col(r, "nombre","name","producto","medicamento","articulo","descripcion","description") ?? ""
        ).trim();
        if (!nombre) return null;
        const codigoRaw = col(r, "codigo","code","cod","ref","referencia","sku","id_producto");
        const codigo = codigoRaw ? String(codigoRaw).trim() : `PROD-${String(autoIdx++).padStart(4,"0")}`;
        return {
          codigo,
          codigoBarras: col(r,"codigo_barras","barcode","ean","upc") ? String(col(r,"codigo_barras","barcode","ean","upc")) : null,
          nombre,
          tipoMedicamento: String(col(r,"tipo_medicamento","tipo_medica","tipo","type") ?? "comercial").toLowerCase() === "generico" ? "generico" : "comercial",
          marca: col(r,"marca","brand","fabricante") ? String(col(r,"marca","brand","fabricante")) : null,
          laboratorio: col(r,"laboratorio","lab","manufacturer") ? String(col(r,"laboratorio","lab","manufacturer")) : null,
          registroInvima: col(r,"registro_invima","invima","registro") ? String(col(r,"registro_invima","invima","registro")) : null,
          lote: col(r,"lote","batch","lot","lote_numero") ? String(col(r,"lote","batch","lot","lote_numero")) : null,
          fechaVencimiento: fmtDate(col(r,"fecha_vencimiento","vencimiento","expiry","expiracion","vence","fecha_exp")),
          precioCompra: Number(col(r,"precio_compra","costo","cost","precio_costo","p_compra")) || 0,
          precioVenta: Number(col(r,"precio_venta","precio","price","pvp","valor","p_venta")) || 0,
          iva: Number(col(r,"iva","tax","impuesto")) || 0,
          stock: Number(col(r,"stock","cantidad","quantity","existencias","existencia","unidades")) || 0,
          stockMinimo: Number(col(r,"stock_minimo","min_stock","minimo","stock_min")) || 5,
          activo: col(r,"activo","active") !== undefined ? Boolean(col(r,"activo","active")) : true,
        };
      }).filter(Boolean) as Partial<Producto>[];

      if (!payload.length) return toast.error("No se encontraron filas válidas. El archivo debe tener al menos una columna 'nombre'.");
      await productosApi.importar(payload);
      toast.success(`${payload.length} productos importados`);
      load();
    } catch (e: any) {
      toast.error(e.response?.data ?? e.message ?? "Error al importar");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <PageHeader title="Inventario" description={isAdmin ? "Gestiona productos." : "Consulta de productos."}
        actions={isAdmin && (<>
          <Button variant="outline" onClick={exportarExcel}><Download className="h-4 w-4 mr-1" />Exportar</Button>
          <label>
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { importarExcel(f); e.target.value = ""; } }} />
            <Button variant="outline" asChild><span><Upload className="h-4 w-4 mr-1" />Importar</span></Button>
          </label>
          <Button variant="destructive" onClick={() => setConfirmTodos(true)}>
            <Trash2 className="h-4 w-4 mr-1" />Eliminar inventario
          </Button>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(empty); }}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nuevo producto</Button></DialogTrigger>
            <DialogContent className="max-w-2xl w-[95vw] sm:w-auto">
              <DialogHeader><DialogTitle>{editing.id ? "Editar" : "Nuevo"} producto</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <F label="Código*"><Input value={editing.codigo ?? ""} onChange={e => setEditing({ ...editing, codigo: e.target.value })} /></F>
                <F label="Código de barras"><Input value={editing.codigoBarras ?? ""} onChange={e => setEditing({ ...editing, codigoBarras: e.target.value })} /></F>
                <F label="Nombre*" wide><Input value={editing.nombre ?? ""} onChange={e => setEditing({ ...editing, nombre: e.target.value })} /></F>
                <F label="Tipo">
                  <Select value={editing.tipoMedicamento ?? "comercial"} onValueChange={v => setEditing({ ...editing, tipoMedicamento: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generico">Genérico</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                </F>
                <F label="Marca"><Input value={editing.marca ?? ""} onChange={e => setEditing({ ...editing, marca: e.target.value })} /></F>
                <F label="Laboratorio"><Input value={editing.laboratorio ?? ""} onChange={e => setEditing({ ...editing, laboratorio: e.target.value })} /></F>
                <F label="Registro INVIMA"><Input value={editing.registroInvima ?? ""} onChange={e => setEditing({ ...editing, registroInvima: e.target.value })} /></F>
                <F label="Precio compra"><Input type="number" value={editing.precioCompra ?? 0} onChange={e => setEditing({ ...editing, precioCompra: Number(e.target.value) })} /></F>
                <F label="Precio venta"><Input type="number" value={editing.precioVenta ?? 0} onChange={e => setEditing({ ...editing, precioVenta: Number(e.target.value) })} /></F>
                <F label="IVA (%)"><Input type="number" value={editing.iva ?? 0} onChange={e => setEditing({ ...editing, iva: Number(e.target.value) })} /></F>
                <F label="Stock"><Input type="number" value={editing.stock ?? 0} onChange={e => setEditing({ ...editing, stock: Number(e.target.value) })} /></F>
                <F label="Stock mínimo"><Input type="number" value={editing.stockMinimo ?? 0} onChange={e => setEditing({ ...editing, stockMinimo: Number(e.target.value) })} /></F>
                <F label="Lote"><Input value={editing.lote ?? ""} onChange={e => setEditing({ ...editing, lote: e.target.value })} /></F>
                <F label="Fecha vencimiento"><Input type="date" value={editing.fechaVencimiento ?? ""} onChange={e => setEditing({ ...editing, fechaVencimiento: e.target.value })} /></F>
                <F label="Descripción" wide><Input value={editing.descripcion ?? ""} onChange={e => setEditing({ ...editing, descripcion: e.target.value })} /></F>
              </div>
              <DialogFooter><Button onClick={save}>Guardar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>)}
      />
      <Card className="p-4">
        <Input placeholder="Buscar por nombre, código o código de barras…" value={q} onChange={e => setQ(e.target.value)} className="mb-3 w-full" />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Lote</TableHead>
                <TableHead className="hidden md:table-cell">Vence</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="hidden sm:table-cell font-mono text-xs">{p.codigo}</TableCell>
                  <TableCell className="font-medium">
                    {p.nombre}
                    <div className="text-xs text-muted-foreground">{p.laboratorio}</div>
                    <div className="text-xs text-muted-foreground sm:hidden">{p.codigo}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{p.lote ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{p.fechaVencimiento ?? "—"}</TableCell>
                  <TableCell className="text-right text-sm">$ {Number(p.precioVenta).toLocaleString("es-CO")}</TableCell>
                  <TableCell className="text-right">
                    {p.stock <= p.stockMinimo ? <Badge variant="destructive">{p.stock}</Badge> : <Badge variant="secondary">{p.stock}</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin && (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin productos</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Diálogo: confirmar eliminar producto individual */}
      <Dialog open={!!confirmDelete} onOpenChange={v => !v && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Eliminar producto
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Si el producto tiene ventas asociadas, quedará desactivado en lugar de eliminarse.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1" onClick={() => confirmDelete && remove(confirmDelete)}>
              Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: confirmar eliminar TODO el inventario */}
      <Dialog open={confirmTodos} onOpenChange={v => !v && setConfirmTodos(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Eliminar todo el inventario
            </DialogTitle>
            <DialogDescription>
              Se eliminarán <strong>todos los productos</strong>. Los que tengan ventas registradas quedarán desactivados. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmTodos(false)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1" disabled={deletingTodos} onClick={eliminarTodos}>
              {deletingTodos ? "Eliminando…" : "Sí, eliminar todo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function F({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <div className={wide ? "col-span-full sm:col-span-2" : ""}><Label className="text-xs">{label}</Label>{children}</div>;
}
