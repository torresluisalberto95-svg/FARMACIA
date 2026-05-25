import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/page-header";
import { Plus, Pencil, Trash2, Download, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/productos")({
  component: ProductosPage,
});

type Producto = {
  id: string; codigo: string; codigo_barras: string|null; nombre: string; descripcion: string|null;
  categoria_id: string|null; laboratorio: string|null; marca: string|null; tipo_medicamento: string;
  precio_compra: number; precio_venta: number; iva: number;
  stock: number; stock_minimo: number; lote: string|null; fecha_vencimiento: string|null;
  registro_invima: string|null; activo: boolean;
};

const empty: Partial<Producto> = { codigo: "", nombre: "", precio_compra: 0, precio_venta: 0, iva: 19, stock: 0, stock_minimo: 5, activo: true, tipo_medicamento: "comercial" };

function ProductosPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [items, setItems] = useState<Producto[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Producto>>(empty);

  const load = async () => {
    const { data } = await supabase.from("productos").select("*").order("nombre");
    setItems((data as Producto[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(p =>
    p.nombre.toLowerCase().includes(q.toLowerCase()) ||
    p.codigo.toLowerCase().includes(q.toLowerCase()) ||
    (p.codigo_barras ?? "").includes(q)
  );

  const save = async () => {
    if (!editing.codigo || !editing.nombre) return toast.error("Código y nombre son obligatorios");
    const payload = {
      codigo: editing.codigo, codigo_barras: editing.codigo_barras || null,
      nombre: editing.nombre, descripcion: editing.descripcion || null,
      laboratorio: editing.laboratorio || null,
      marca: editing.marca || null,
      tipo_medicamento: editing.tipo_medicamento || "comercial",
      precio_compra: Number(editing.precio_compra) || 0,
      precio_venta: Number(editing.precio_venta) || 0,
      iva: Number(editing.iva) || 0,
      stock: Number(editing.stock) || 0,
      stock_minimo: Number(editing.stock_minimo) || 0,
      lote: editing.lote || null,
      fecha_vencimiento: editing.fecha_vencimiento || null,
      registro_invima: editing.registro_invima || null,
      activo: editing.activo ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("productos").update(payload).eq("id", editing.id)
      : await supabase.from("productos").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Producto guardado");
    setOpen(false); setEditing(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar producto?")) return;
    const { error } = await supabase.from("productos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado"); load();
  };

  const exportarExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = items.map(p => ({
      codigo: p.codigo,
      codigo_barras: p.codigo_barras ?? "",
      nombre: p.nombre,
      descripcion: p.descripcion ?? "",
      tipo_medicamento: p.tipo_medicamento,
      marca: p.marca ?? "",
      laboratorio: p.laboratorio ?? "",
      registro_invima: p.registro_invima ?? "",
      lote: p.lote ?? "",
      fecha_vencimiento: p.fecha_vencimiento ?? "",
      precio_compra: p.precio_compra,
      precio_venta: p.precio_venta,
      iva: p.iva,
      stock: p.stock,
      stock_minimo: p.stock_minimo,
      activo: p.activo,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, `inventario_${new Date().toISOString().slice(0,10)}.xlsx`);
    toast.success("Inventario exportado");
  };

  const importarExcel = async (file: File) => {
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
      if (!rows.length) return toast.error("Archivo vacío");
      const payload = rows.map((r: Record<string, any>) => ({
        codigo: String(r.codigo ?? r.Codigo ?? "").trim(),
        codigo_barras: r.codigo_barras ? String(r.codigo_barras) : null,
        nombre: String(r.nombre ?? r.Nombre ?? "").trim(),
        descripcion: r.descripcion ?? null,
        tipo_medicamento: (r.tipo_medicamento ?? "comercial").toString().toLowerCase() === "generico" ? "generico" : "comercial",
        marca: r.marca ?? null,
        laboratorio: r.laboratorio ?? null,
        registro_invima: r.registro_invima ? String(r.registro_invima) : null,
        lote: r.lote ? String(r.lote) : null,
        fecha_vencimiento: r.fecha_vencimiento ? String(r.fecha_vencimiento).slice(0,10) : null,
        precio_compra: Number(r.precio_compra) || 0,
        precio_venta: Number(r.precio_venta) || 0,
        iva: Number(r.iva) || 0,
        stock: Number(r.stock) || 0,
        stock_minimo: Number(r.stock_minimo) || 5,
        activo: r.activo === undefined ? true : Boolean(r.activo),
      })).filter(p => p.codigo && p.nombre);
      if (!payload.length) return toast.error("No hay filas válidas (código y nombre requeridos)");
      const { error } = await supabase.from("productos").upsert(payload, { onConflict: "codigo" });
      if (error) return toast.error(error.message);
      toast.success(`${payload.length} productos importados`);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Error al importar");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Inventario"
        description={isAdmin ? "Gestiona productos, lotes y vencimientos." : "Consulta de productos disponibles."}
        actions={isAdmin && (<>
          <Button variant="outline" onClick={exportarExcel}><Download className="h-4 w-4 mr-1"/>Exportar</Button>
          <label>
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e)=>{const f=e.target.files?.[0]; if(f){importarExcel(f); e.target.value="";}}}/>
            <Button variant="outline" asChild><span><Upload className="h-4 w-4 mr-1"/>Importar</span></Button>
          </label>
          <Dialog open={open} onOpenChange={(o)=>{setOpen(o); if(!o) setEditing(empty);}}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>Nuevo producto</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editing.id ? "Editar" : "Nuevo"} producto</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Código*"><Input value={editing.codigo ?? ""} onChange={e=>setEditing({...editing, codigo:e.target.value})}/></Field>
                <Field label="Código de barras"><Input value={editing.codigo_barras ?? ""} onChange={e=>setEditing({...editing, codigo_barras:e.target.value})}/></Field>
                <Field label="Nombre*" wide><Input value={editing.nombre ?? ""} onChange={e=>setEditing({...editing, nombre:e.target.value})}/></Field>
                <Field label="Tipo">
                  <Select value={editing.tipo_medicamento ?? "comercial"} onValueChange={(v)=>setEditing({...editing, tipo_medicamento:v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generico">Genérico</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Marca"><Input value={editing.marca ?? ""} onChange={e=>setEditing({...editing, marca:e.target.value})}/></Field>
                <Field label="Laboratorio"><Input value={editing.laboratorio ?? ""} onChange={e=>setEditing({...editing, laboratorio:e.target.value})}/></Field>
                <Field label="Registro INVIMA"><Input value={editing.registro_invima ?? ""} onChange={e=>setEditing({...editing, registro_invima:e.target.value})}/></Field>
                <Field label="Precio compra"><Input type="number" value={editing.precio_compra ?? 0} onChange={e=>setEditing({...editing, precio_compra:Number(e.target.value)})}/></Field>
                <Field label="Precio venta"><Input type="number" value={editing.precio_venta ?? 0} onChange={e=>setEditing({...editing, precio_venta:Number(e.target.value)})}/></Field>
                <Field label="IVA (%)"><Input type="number" value={editing.iva ?? 0} onChange={e=>setEditing({...editing, iva:Number(e.target.value)})}/></Field>
                <Field label="Stock"><Input type="number" value={editing.stock ?? 0} onChange={e=>setEditing({...editing, stock:Number(e.target.value)})}/></Field>
                <Field label="Stock mínimo"><Input type="number" value={editing.stock_minimo ?? 0} onChange={e=>setEditing({...editing, stock_minimo:Number(e.target.value)})}/></Field>
                <Field label="Lote"><Input value={editing.lote ?? ""} onChange={e=>setEditing({...editing, lote:e.target.value})}/></Field>
                <Field label="Fecha vencimiento"><Input type="date" value={editing.fecha_vencimiento ?? ""} onChange={e=>setEditing({...editing, fecha_vencimiento:e.target.value})}/></Field>
                <Field label="Descripción" wide><Input value={editing.descripcion ?? ""} onChange={e=>setEditing({...editing, descripcion:e.target.value})}/></Field>
              </div>
              <DialogFooter><Button onClick={save}>Guardar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>)}
      />
      <Card className="p-4">
        <Input placeholder="Buscar por nombre, código o código de barras…" value={q} onChange={(e)=>setQ(e.target.value)} className="mb-3 max-w-md"/>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead><TableHead>Nombre</TableHead><TableHead>Lote</TableHead>
                <TableHead>Vence</TableHead><TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Stock</TableHead><TableHead/>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.codigo}</TableCell>
                  <TableCell className="font-medium">{p.nombre}<div className="text-xs text-muted-foreground">{p.laboratorio}</div></TableCell>
                  <TableCell>{p.lote ?? "—"}</TableCell>
                  <TableCell>{p.fecha_vencimiento ?? "—"}</TableCell>
                  <TableCell className="text-right">$ {Number(p.precio_venta).toLocaleString("es-CO")}</TableCell>
                  <TableCell className="text-right">
                    {p.stock <= p.stock_minimo
                      ? <Badge variant="destructive">{p.stock}</Badge>
                      : <Badge variant="secondary">{p.stock}</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin && (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={()=>{setEditing(p); setOpen(true);}}><Pencil className="h-4 w-4"/></Button>
                        <Button size="icon" variant="ghost" onClick={()=>remove(p.id)}><Trash2 className="h-4 w-4"/></Button>
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
    </div>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
