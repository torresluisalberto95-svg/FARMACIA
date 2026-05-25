import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/clientes")({
  component: ClientesPage,
});

function ClientesPage() {
  const { user, role } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", documento: "", telefono: "", direccion: "" });

  const load = async () => {
    const { data } = await supabase.from("clientes").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.nombre) return toast.error("Nombre requerido");
    const { error } = await supabase.from("clientes").insert({ ...form, created_by: user?.id });
    if (error) return toast.error(error.message);
    toast.success("Cliente registrado");
    setOpen(false); setForm({ nombre: "", documento: "", telefono: "", direccion: "" }); load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar?")) return;
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const filtered = items.filter(c => c.nombre.toLowerCase().includes(q.toLowerCase()) || (c.documento ?? "").includes(q));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Clientes"
        description="Registra y consulta clientes."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1"/>Nuevo cliente</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo cliente</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nombre*</Label><Input value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})}/></div>
                <div><Label>Documento</Label><Input value={form.documento} onChange={e=>setForm({...form, documento:e.target.value})}/></div>
                <div><Label>Teléfono</Label><Input value={form.telefono} onChange={e=>setForm({...form, telefono:e.target.value})}/></div>
                <div><Label>Dirección</Label><Input value={form.direccion} onChange={e=>setForm({...form, direccion:e.target.value})}/></div>
              </div>
              <DialogFooter><Button onClick={save}>Guardar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <Card className="p-4">
        <Input placeholder="Buscar por nombre o documento" value={q} onChange={e=>setQ(e.target.value)} className="mb-3 max-w-md"/>
        <Table>
          <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Documento</TableHead><TableHead>Teléfono</TableHead><TableHead>Dirección</TableHead><TableHead/></TableRow></TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nombre}</TableCell>
                <TableCell>{c.documento ?? "—"}</TableCell>
                <TableCell>{c.telefono ?? "—"}</TableCell>
                <TableCell>{c.direccion ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {role === "admin" && <Button size="icon" variant="ghost" onClick={()=>remove(c.id)}><Trash2 className="h-4 w-4"/></Button>}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin clientes</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
