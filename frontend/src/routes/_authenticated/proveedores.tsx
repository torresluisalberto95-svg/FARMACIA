import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { proveedoresApi, type Proveedor } from "@/api/proveedores";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/proveedores")({ component: ProveedoresPage });

const empty: Partial<Proveedor> = { nit: "", nombre: "", telefono: "", direccion: "", correo: "" };

function ProveedoresPage() {
  const [items, setItems] = useState<Proveedor[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Proveedor>>(empty);

  const load = () => proveedoresApi.listar().then(setItems).catch(console.error);
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing.nombre) return toast.error("Nombre es obligatorio");
    try {
      if (editing.id) await proveedoresApi.actualizar(editing.id, editing);
      else await proveedoresApi.crear(editing);
      toast.success("Proveedor guardado");
      setOpen(false); setEditing(empty); load();
    } catch (err: any) { toast.error(err.response?.data ?? "Error"); }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar proveedor?")) return;
    try { await proveedoresApi.eliminar(id); toast.success("Eliminado"); load(); }
    catch (err: any) { toast.error(err.response?.data ?? "Error"); }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <PageHeader title="Proveedores" description="Gestiona tus proveedores."
        actions={
          <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setEditing(empty); }}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nuevo proveedor</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing.id ? "Editar" : "Nuevo"} proveedor</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nombre*</Label><Input required value={editing.nombre ?? ""} onChange={e => setEditing({ ...editing, nombre: e.target.value })} /></div>
                <div><Label>NIT</Label><Input value={editing.nit ?? ""} onChange={e => setEditing({ ...editing, nit: e.target.value })} /></div>
                <div><Label>Teléfono</Label><Input value={editing.telefono ?? ""} onChange={e => setEditing({ ...editing, telefono: e.target.value })} /></div>
                <div><Label>Dirección</Label><Input value={editing.direccion ?? ""} onChange={e => setEditing({ ...editing, direccion: e.target.value })} /></div>
                <div><Label>Correo</Label><Input type="email" value={editing.correo ?? ""} onChange={e => setEditing({ ...editing, correo: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={save}>Guardar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <Card className="p-4">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>NIT</TableHead><TableHead>Teléfono</TableHead><TableHead>Correo</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {items.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nombre}</TableCell>
                <TableCell>{p.nit ?? "—"}</TableCell>
                <TableCell>{p.telefono ?? "—"}</TableCell>
                <TableCell>{p.correo ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin proveedores</TableCell></TableRow>}
          </TableBody>
        </Table>
        </div>
      </Card>
    </div>
  );
}
