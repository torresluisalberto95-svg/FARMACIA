import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Pencil, Trash2, UserPlus, KeyRound } from "lucide-react";
import { createEmpleado, deleteEmpleado, updateEmpleado, cambiarRolEmpleado } from "@/lib/users.functions";

export const Route = createFileRoute("/_authenticated/usuarios")({
  component: UsuariosPage,
});

function UsuariosPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ email: "", password: "", fullName: "", role: "empleado" as "admin" | "empleado" });
  const [editForm, setEditForm] = useState({ fullName: "", password: "" });
  const [busy, setBusy] = useState(false);

  const createFn = useServerFn(createEmpleado);
  const updateFn = useServerFn(updateEmpleado);
  const deleteFn = useServerFn(deleteEmpleado);
  const rolFn = useServerFn(cambiarRolEmpleado);

  const load = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at",{ascending:false});
    const { data: roles } = await supabase.from("user_roles").select("*");
    const merged = (profiles ?? []).map((p:any) => ({
      ...p, role: roles?.find((r:any)=>r.user_id===p.id)?.role ?? "empleado",
    }));
    setUsers(merged);
  };
  useEffect(() => { load(); }, []);

  const cambiarRol = async (userId: string, newRole: "admin" | "empleado") => {
    try {
      await rolFn({ data: { userId, role: newRole } });
      toast.success("Rol actualizado");
      load();
    } catch (err: any) {
      toast.error(err.message ?? "No se pudo cambiar el rol");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createFn({ data: form });
      toast.success("Empleado creado");
      setOpenCreate(false);
      setForm({ email: "", password: "", fullName: "", role: "empleado" });
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Error al crear");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      await updateFn({
        data: {
          userId: editing.id,
          fullName: editForm.fullName || undefined,
          password: editForm.password || undefined,
        },
      });
      toast.success("Empleado actualizado");
      setEditing(null);
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Error al actualizar");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (u: any) => {
    if (!confirm(`¿Eliminar a ${u.full_name || u.email}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteFn({ data: { userId: u.id } });
      toast.success("Empleado eliminado");
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Error al eliminar");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Usuarios"
        description="Crea, edita o elimina cuentas de empleados y asigna roles."
        actions={
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button><UserPlus className="h-4 w-4 mr-2" />Nuevo usuario</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Crear usuario</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <Label>Nombre completo</Label>
                  <Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                </div>
                <div>
                  <Label>Correo</Label>
                  <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <Label>Contraseña</Label>
                  <Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <div>
                  <Label>Rol</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empleado">Empleado</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={busy}>{busy ? "Creando…" : "Crear"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <Card className="p-4">
        <Table>
          <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Correo</TableHead><TableHead>Rol</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell><Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Select value={u.role} onValueChange={(v)=>cambiarRol(u.id, v as any)}>
                      <SelectTrigger className="w-36"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="empleado">Empleado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => { setEditing(u); setEditForm({ fullName: u.full_name || "", password: "" }); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={u.id === currentUser?.id}
                      onClick={() => handleDelete(u)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users.length===0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Sin usuarios</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar usuario</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <Label>Correo</Label>
                <Input value={editing.email} disabled />
              </div>
              <div>
                <Label>Nombre completo</Label>
                <Input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
              </div>
              <div>
                <Label className="flex items-center gap-1"><KeyRound className="h-3 w-3" />Nueva contraseña (opcional)</Label>
                <Input type="password" minLength={6} placeholder="Dejar vacío para no cambiar" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
