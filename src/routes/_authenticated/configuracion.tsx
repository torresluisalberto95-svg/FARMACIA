import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/page-header";
import { useAuth } from "@/hooks/use-auth";
import { useBranding } from "@/hooks/use-branding";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/configuracion")({
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  const { role } = useAuth();
  const { brandName, logoUrl, refresh } = useBranding();
  const navigate = useNavigate();
  const [name, setName] = useState(brandName);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => setName(brandName), [brandName]);

  useEffect(() => {
    if (role && role !== "admin") navigate({ to: "/dashboard" });
  }, [role, navigate]);

  const guardarNombre = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("configuracion")
      .update({ brand_name: name, updated_at: new Date().toISOString() })
      .eq("singleton", true);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Nombre actualizado");
    refresh();
  };

  const subirLogo = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("branding").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("branding").getPublicUrl(path);
      const { error } = await supabase
        .from("configuracion")
        .update({ logo_url: data.publicUrl, updated_at: new Date().toISOString() })
        .eq("singleton", true);
      if (error) throw error;
      toast.success("Logo actualizado");
      refresh();
    } catch (e: any) {
      toast.error(e.message ?? "No se pudo subir el logo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title="Configuración" description="Personaliza la marca visible en todo el sistema." />

      <Card className="p-6 mb-6">
        <h2 className="font-semibold mb-4">Logo</h2>
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden border">
            <img src={logoUrl} alt="Logo actual" className="max-h-full max-w-full object-contain" />
          </div>
          <div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={(e) => e.target.files?.[0] && subirLogo(e.target.files[0])}
              />
              <Button asChild variant="outline" disabled={uploading}>
                <span><Upload className="h-4 w-4 mr-2" />{uploading ? "Subiendo…" : "Cambiar logo"}</span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-2">PNG, JPG, SVG o WebP. Máx. 2 MB.</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <form onSubmit={guardarNombre} className="space-y-4">
          <h2 className="font-semibold">Nombre de la farmacia</h2>
          <div>
            <Label htmlFor="brand">Nombre</Label>
            <Input id="brand" required value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
        </form>
      </Card>
    </div>
  );
}