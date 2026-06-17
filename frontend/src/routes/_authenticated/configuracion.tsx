import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { configuracionApi } from "@/api/configuracion";
import { useAuth } from "@/hooks/use-auth";
import { useBranding } from "@/hooks/use-branding";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/page-header";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/configuracion")({ component: ConfiguracionPage });

type Form = {
  brandName: string;
  nit: string;
  direccion: string;
  telefono: string;
  email: string;
  regInvima: string;
  qfResponsable: string;
  resolucionDian: string;
  habilitacionPos: string;
  personaNaturalNombre: string;
  personaNaturalCC: string;
  personaNaturalCelular: string;
  personaNaturalDir: string;
};

function ConfiguracionPage() {
  const { role } = useAuth();
  const { logoUrl, config, refresh } = useBranding();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Form>({
    brandName: "", nit: "", direccion: "", telefono: "", email: "",
    regInvima: "", qfResponsable: "", resolucionDian: "", habilitacionPos: "",
    personaNaturalNombre: "", personaNaturalCC: "", personaNaturalCelular: "", personaNaturalDir: "",
  });
  const [nuevoLogo, setNuevoLogo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setForm({
        brandName: config.brandName ?? "",
        nit: config.nit ?? "",
        direccion: config.direccion ?? "",
        telefono: config.telefono ?? "",
        email: config.email ?? "",
        regInvima: config.regInvima ?? "",
        qfResponsable: config.qfResponsable ?? "",
        resolucionDian: config.resolucionDian ?? "",
        habilitacionPos: config.habilitacionPos ?? "",
        personaNaturalNombre: config.personaNaturalNombre ?? "",
        personaNaturalCC: config.personaNaturalCC ?? "",
        personaNaturalCelular: config.personaNaturalCelular ?? "",
        personaNaturalDir: config.personaNaturalDir ?? "",
      });
    }
  }, [config]);

  useEffect(() => { if (role && role !== "admin") navigate({ to: "/dashboard" }); }, [role, navigate]);

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("El logo no debe superar 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setNuevoLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const quitarLogo = () => {
    setNuevoLogo("__REMOVE__");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        brandName: form.brandName,
        nit: form.nit || undefined,
        direccion: form.direccion || undefined,
        telefono: form.telefono || undefined,
        email: form.email || undefined,
        regInvima: form.regInvima || undefined,
        qfResponsable: form.qfResponsable || undefined,
        resolucionDian: form.resolucionDian || undefined,
        habilitacionPos: form.habilitacionPos || undefined,
        personaNaturalNombre: form.personaNaturalNombre || undefined,
        personaNaturalCC: form.personaNaturalCC || undefined,
        personaNaturalCelular: form.personaNaturalCelular || undefined,
        personaNaturalDir: form.personaNaturalDir || undefined,
      };
      if (nuevoLogo === "__REMOVE__") payload.logoUrl = "";
      else if (nuevoLogo) payload.logoUrl = nuevoLogo;

      await configuracionApi.update(payload);
      toast.success("Configuración guardada");
      setNuevoLogo(null);
      refresh();
    } catch (err: any) {
      toast.error(err.response?.data ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const logoMostrado = nuevoLogo === "__REMOVE__" ? null : (nuevoLogo ?? logoUrl);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <PageHeader title="Configuración" description="Datos de la farmacia que aparecen en los recibos POS." />

      {/* Logo */}
      <Card className="p-6 mb-6">
        <h2 className="font-semibold text-base mb-4">Logo de la farmacia</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="h-28 w-28 rounded-xl bg-muted flex items-center justify-center overflow-hidden border shrink-0">
            {logoMostrado
              ? <img src={logoMostrado} alt="Logo" className="max-h-full max-w-full object-contain" />
              : <ImagePlus className="h-8 w-8 text-muted-foreground" />}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Se mostrará en el encabezado del recibo POS y en la pantalla de acceso.<br />
              Formato: PNG, JPG o SVG — máximo 2 MB.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="h-4 w-4 mr-1" />
                {logoMostrado ? "Cambiar logo" : "Subir logo"}
              </Button>
              {logoMostrado && (
                <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={quitarLogo}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Quitar logo
                </Button>
              )}
            </div>
            {nuevoLogo && nuevoLogo !== "__REMOVE__" && (
              <p className="text-xs text-green-600 font-medium">Nueva imagen seleccionada — guarda para aplicar.</p>
            )}
            {nuevoLogo === "__REMOVE__" && (
              <p className="text-xs text-orange-500 font-medium">Logo se eliminará al guardar.</p>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={handleLogoChange}
        />
      </Card>

      <Card className="p-6">
        <form onSubmit={guardar} className="space-y-5">
          <h2 className="font-semibold text-base border-b pb-2">Datos generales</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brandName">Nombre de la farmacia *</Label>
              <Input id="brandName" required value={form.brandName} maxLength={80} onChange={set("brandName")} />
            </div>
            <div>
              <Label htmlFor="nit">NIT</Label>
              <Input id="nit" placeholder="900.123.456-7" value={form.nit} maxLength={20} onChange={set("nit")} />
            </div>
            <div>
              <Label htmlFor="direccion">Dirección / Ciudad</Label>
              <Input id="direccion" placeholder="Cartagena, Bolivar" value={form.direccion} onChange={set("direccion")} />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" placeholder="+57 300 000 0000" value={form.telefono} onChange={set("telefono")} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="contacto@farmacia.com" value={form.email} onChange={set("email")} />
            </div>
            <div>
              <Label htmlFor="regInvima">Reg. INVIMA</Label>
              <Input id="regInvima" placeholder="NSOH00000000" value={form.regInvima} onChange={set("regInvima")} />
            </div>
            <div>
              <Label htmlFor="qfResponsable">Q.F. Responsable</Label>
              <Input id="qfResponsable" placeholder="Nombre - T.P. 0000" value={form.qfResponsable} onChange={set("qfResponsable")} />
            </div>
          </div>

          <h2 className="font-semibold text-base border-b pb-2 pt-2">Persona Natural (Propietario)</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="personaNaturalNombre">Nombre completo</Label>
              <Input id="personaNaturalNombre" placeholder="Jorge Elian Agamez Fuentes" value={form.personaNaturalNombre} onChange={set("personaNaturalNombre")} />
            </div>
            <div>
              <Label htmlFor="personaNaturalCC">Cédula (CC)</Label>
              <Input id="personaNaturalCC" placeholder="1.004.499.532" value={form.personaNaturalCC} onChange={set("personaNaturalCC")} />
            </div>
            <div>
              <Label htmlFor="personaNaturalCelular">Celular</Label>
              <Input id="personaNaturalCelular" placeholder="3014061803" value={form.personaNaturalCelular} onChange={set("personaNaturalCelular")} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="personaNaturalDir">Dirección del propietario</Label>
              <Input id="personaNaturalDir" placeholder="Barrio Las Palmeras Mzna 11 Lote 20" value={form.personaNaturalDir} onChange={set("personaNaturalDir")} />
            </div>
          </div>

          <h2 className="font-semibold text-base border-b pb-2 pt-2">Facturación DIAN</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="resolucionDian">Resolución DIAN</Label>
              <Input id="resolucionDian" placeholder="N. 18764000000 de 2025" value={form.resolucionDian} onChange={set("resolucionDian")} />
            </div>
            <div>
              <Label htmlFor="habilitacionPos">Habilitación POS</Label>
              <Input id="habilitacionPos" placeholder="del 1 al 10000" value={form.habilitacionPos} onChange={set("habilitacionPos")} />
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? "Guardando…" : "Guardar configuración"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
