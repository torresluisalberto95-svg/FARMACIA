import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { clientesApi, type Cliente } from "@/api/clientes";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/clientes")({ component: ClientesPage });

const empty: Partial<Cliente> = { documento: "", nombre: "", telefono: "", direccion: "" };

function ClientesPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [items, setItems] = useState<Cliente[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Cliente>>(empty);

  const load = () => clientesApi.listar().then(setItems).catch(console.error);
  useEffect(() => { load(); }, []);

  const filtered = items.filter(c =>
    c.nombre.toLowerCase().includes(q.toLowerCase()) ||
    (c.documento ?? "").toLowerCase().includes(q.toLowerCase())
  );

  const save = async () => {
    if (!editing.nombre) return toast.error("Nombre es obligatorio");
    try {
      if (editing.id) {
        await clientesApi.actualizar(editing.id, editing);
      } else {
        await clientesApi.crear(editing);
      }
      toast.success("Cliente guardado");
      setOpen(false); setEditing(empty); load();
    } catch (err: any) {
      toast.error(err.response?.data ?? "Error");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar cliente?")) return;
    try {
      await clientesApi.eliminar(id);
      toast.success("Eliminado"); load();
    } catch (err: any) {
      toast.error(err.response?.data ?? "Error");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <PageHeader title="Clientes" description="Directorio de clientes."
        actions={
          <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setEditing(empty); }}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nuevo cliente</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing.id ? "Editar" : "Nuevo"} cliente</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nombre*</Label><Input required value={editing.nombre ?? ""} onChange={e => setEditing({ ...editing, nombre: e.target.value })} /></div>
                <div><Label>Documento</Label><Input value={editing.documento ?? ""} onChange={e => setEditing({ ...editing, documento: e.target.value })} /></div>
                <div><Label>Teléfono</Label><Input value={editing.telefono ?? ""} onChange={e => setEditing({ ...editing, telefono: e.target.value })} /></div>
                <div><Label>Dirección</Label><Input value={editing.direccion ?? ""} onChange={e => setEditing({ ...editing, direccion: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={save}>Guardar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <Card className="p-4">
        <Input placeholder="Buscar por nombre o documento…" value={q} onChange={e => setQ(e.target.value)} className="mb-3 w-full" />
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Documento</TableHead>
              <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
              <TableHead className="hidden md:table-cell">Dirección</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  {c.nombre}
                  <div className="text-xs text-muted-foreground sm:hidden">{c.documento ?? ""} {c.telefono ? `· ${c.telefono}` : ""}</div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{c.documento ?? "—"}</TableCell>
                <TableCell className="hidden sm:table-cell">{c.telefono ?? "—"}</TableCell>
                <TableCell className="hidden md:table-cell">{c.direccion ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    {isAdmin && <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin clientes</TableCell></TableRow>}
          </TableBody>
        </Table>
        </div>
      </Card>
    </div>
  );
}
