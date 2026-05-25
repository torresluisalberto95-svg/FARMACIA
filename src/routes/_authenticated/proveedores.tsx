import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/proveedores")({
  component: ProveedoresPage,
});

function ProveedoresPage() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nit: "", nombre: "", telefono: "", direccion: "", correo: "" });

  const load = async () => {
    const { data } = await supabase.from("proveedores").select("*").order("nombre");
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.nombre) return toast.error("Nombre requerido");
    const { error } = await supabase.from("proveedores").insert(form);
    if (error) return toast.error(error.message);
    toast.success("Proveedor guardado");
    setOpen(false); setForm({ nit:"", nombre:"", telefono:"", direccion:"", correo:"" }); load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar?")) return;
    await supabase.from("proveedores").delete().eq("id", id);
    load();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Proveedores" description="Gestión de proveedores."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>Nuevo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo proveedor</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>NIT</Label><Input value={form.nit} onChange={e=>setForm({...form, nit:e.target.value})}/></div>
                <div><Label>Nombre*</Label><Input value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})}/></div>
                <div><Label>Teléfono</Label><Input value={form.telefono} onChange={e=>setForm({...form, telefono:e.target.value})}/></div>
                <div><Label>Correo</Label><Input value={form.correo} onChange={e=>setForm({...form, correo:e.target.value})}/></div>
                <div><Label>Dirección</Label><Input value={form.direccion} onChange={e=>setForm({...form, direccion:e.target.value})}/></div>
              </div>
              <DialogFooter><Button onClick={save}>Guardar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }/>
      <Card className="p-4">
        <Table>
          <TableHeader><TableRow><TableHead>NIT</TableHead><TableHead>Nombre</TableHead><TableHead>Teléfono</TableHead><TableHead>Correo</TableHead><TableHead/></TableRow></TableHeader>
          <TableBody>
            {items.map(p => (
              <TableRow key={p.id}>
                <TableCell>{p.nit ?? "—"}</TableCell>
                <TableCell className="font-medium">{p.nombre}</TableCell>
                <TableCell>{p.telefono ?? "—"}</TableCell>
                <TableCell>{p.correo ?? "—"}</TableCell>
                <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={()=>remove(p.id)}><Trash2 className="h-4 w-4"/></Button></TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin proveedores</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
