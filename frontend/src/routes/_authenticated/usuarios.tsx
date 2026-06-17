import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { usuariosApi, type Usuario } from "@/api/usuarios";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, UserPlus, KeyRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/usuarios")({ component: UsuariosPage });

function UsuariosPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<Usuario[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState({ email: "", password: "", fullName: "", role: "empleado" });
  const [editForm, setEditForm] = useState({ fullName: "", password: "" });
  const [busy, setBusy] = useState(false);

  const load = () => usuariosApi.listar().then(setUsers).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      await usuariosApi.crear(form);
      toast.success("Usuario creado"); setOpenCreate(false);
      setForm({ email: "", password: "", fullName: "", role: "empleado" }); load();
    } catch (err: any) { toast.error(err.response?.data ?? "Error"); }
    finally { setBusy(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editing) return; setBusy(true);
    try {
      await usuariosApi.actualizar(editing.id, { fullName: editForm.fullName || undefined, password: editForm.password || undefined });
      toast.success("Actualizado"); setEditing(null); load();
    } catch (err: any) { toast.error(err.response?.data ?? "Error"); }
    finally { setBusy(false); }
  };

  const cambiarRol = async (id: string, role: string) => {
    try { await usuariosApi.cambiarRol(id, role); toast.success("Rol actualizado"); load(); }
    catch (err: any) { toast.error(err.response?.data ?? "Error"); }
  };

  const eliminar = async (u: Usuario) => {
    if (!confirm(`¿Eliminar a ${u.fullName || u.email}?`)) return;
    try { await usuariosApi.eliminar(u.id); toast.success("Eliminado"); load(); }
    catch (err: any) { toast.error(err.response?.data ?? "Error"); }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <PageHeader title="Usuarios" description="Crea, edita o elimina cuentas y asigna roles."
        actions={
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild><Button><UserPlus className="h-4 w-4 mr-2" />Nuevo usuario</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Crear usuario</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-3">
                <div><Label>Nombre completo</Label><Input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></div>
                <div><Label>Correo</Label><Input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Contraseña</Label><Input type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                <div><Label>Rol</Label>
                  <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="empleado">Empleado</SelectItem><SelectItem value="admin">Administrador</SelectItem></SelectContent>
                  </Select>
                </div>
                <DialogFooter><Button type="submit" disabled={busy}>{busy ? "Creando…" : "Crear"}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <Card className="p-4">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Correo</TableHead>
              <TableHead className="hidden sm:table-cell">Rol</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  {u.fullName || "—"}
                  <div className="text-xs text-muted-foreground sm:hidden">{u.email}</div>
                  <div className="sm:hidden mt-1"><Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs">{u.role}</Badge></div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{u.email}</TableCell>
                <TableCell className="hidden sm:table-cell"><Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 sm:gap-2">
                    <Select value={u.role} onValueChange={v => cambiarRol(u.id, v)}>
                      <SelectTrigger className="w-28 sm:w-36 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="admin">Administrador</SelectItem><SelectItem value="empleado">Empleado</SelectItem></SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => { setEditing(u); setEditForm({ fullName: u.fullName || "", password: "" }); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" disabled={u.id === currentUser?.userId} onClick={() => eliminar(u)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Sin usuarios</TableCell></TableRow>}
          </TableBody>
        </Table>
        </div>
      </Card>
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar usuario</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={handleUpdate} className="space-y-3">
              <div><Label>Correo</Label><Input value={editing.email} disabled /></div>
              <div><Label>Nombre completo</Label><Input value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} /></div>
              <div><Label className="flex items-center gap-1"><KeyRound className="h-3 w-3" />Nueva contraseña (opcional)</Label>
                <Input type="password" minLength={6} placeholder="Dejar vacío para no cambiar" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} /></div>
              <DialogFooter><Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
