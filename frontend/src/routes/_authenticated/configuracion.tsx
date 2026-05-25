import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { configuracionApi } from "@/api/configuracion";
import { useAuth } from "@/hooks/use-auth";
import { useBranding } from "@/hooks/use-branding";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/page-header";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/configuracion")({ component: ConfiguracionPage });

function ConfiguracionPage() {
  const { role } = useAuth();
  const { brandName, logoUrl, refresh } = useBranding();
  const navigate = useNavigate();
  const [name, setName] = useState(brandName);
  const [saving, setSaving] = useState(false);

  useEffect(() => setName(brandName), [brandName]);
  useEffect(() => { if (role && role !== "admin") navigate({ to: "/dashboard" }); }, [role, navigate]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await configuracionApi.update({ brandName: name });
      toast.success("Nombre actualizado"); refresh();
    } catch (err: any) {
      toast.error(err.response?.data ?? "Error");
    } finally { setSaving(false); }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <PageHeader title="Configuración" description="Personaliza la marca visible en todo el sistema." />
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden border">
            <img src={logoUrl} alt="Logo actual" className="max-h-full max-w-full object-contain" />
          </div>
        </div>
      </Card>
      <Card className="p-6">
        <form onSubmit={guardar} className="space-y-4">
          <h2 className="font-semibold">Nombre de la farmacia</h2>
          <div>
            <Label htmlFor="brand">Nombre</Label>
            <Input id="brand" required value={name} maxLength={80} onChange={e => setName(e.target.value)} />
          </div>
          <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
        </form>
      </Card>
    </div>
  );
}
