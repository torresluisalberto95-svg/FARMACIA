import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/caja")({
  component: CajaPage,
});

function CajaPage() {
  const { user } = useAuth();
  const [actual, setActual] = useState<any | null>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [monto, setMonto] = useState(0);
  const [obs, setObs] = useState("");
  const [ventas, setVentas] = useState(0);

  const load = async () => {
    if (!user) return;
    const { data: act } = await supabase.from("cajas").select("*").eq("usuario_id", user.id).eq("estado", "abierta").maybeSingle();
    setActual(act);
    const { data: h } = await supabase.from("cajas").select("*").eq("usuario_id", user.id).order("abierta_at",{ascending:false}).limit(10);
    setHistorial(h ?? []);
    if (act) {
      const { data: v } = await supabase.from("ventas").select("total").eq("vendedor_id", user.id).gte("created_at", act.abierta_at);
      setVentas((v ?? []).reduce((s:number,r:any)=>s+Number(r.total),0));
    }
  };
  useEffect(() => { load(); }, [user]);

  const abrir = async () => {
    if (!user) return;
    const { error } = await supabase.from("cajas").insert({ usuario_id: user.id, monto_apertura: monto });
    if (error) return toast.error(error.message);
    toast.success("Caja abierta"); setMonto(0); load();
  };

  const cerrar = async () => {
    if (!actual) return;
    const { error } = await supabase.from("cajas").update({
      estado: "cerrada", monto_cierre: monto, cerrada_at: new Date().toISOString(), observaciones: obs,
    }).eq("id", actual.id);
    if (error) return toast.error(error.message);
    toast.success("Caja cerrada"); setMonto(0); setObs(""); load();
  };

  const money = (n: number) => `$ ${Number(n).toLocaleString("es-CO")}`;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Caja" description="Apertura, cierre y arqueo de tu caja." />
      <Card className="p-6 mb-6">
        {actual ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <Badge>Caja abierta</Badge>
                <p className="text-sm text-muted-foreground mt-1">Desde {new Date(actual.abierta_at).toLocaleString("es-CO")}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Apertura</p>
                <p className="text-xl font-bold">{money(actual.monto_apertura)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted">
              <div><p className="text-xs">Ventas en caja</p><p className="text-lg font-semibold">{money(ventas)}</p></div>
              <div><p className="text-xs">Esperado en caja</p><p className="text-lg font-semibold">{money(Number(actual.monto_apertura) + ventas)}</p></div>
            </div>
            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              <div><Label>Monto contado</Label><Input type="number" value={monto} onChange={e=>setMonto(Number(e.target.value))}/></div>
              <div><Label>Observaciones</Label><Input value={obs} onChange={e=>setObs(e.target.value)}/></div>
            </div>
            <Button className="mt-4" onClick={cerrar}>Cerrar caja</Button>
          </>
        ) : (
          <>
            <h3 className="font-semibold mb-3">Abrir caja</h3>
            <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
              <div><Label>Monto inicial</Label><Input type="number" value={monto} onChange={e=>setMonto(Number(e.target.value))}/></div>
              <Button onClick={abrir}>Abrir</Button>
            </div>
          </>
        )}
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold mb-3">Historial</h3>
        <ul className="divide-y text-sm">
          {historial.map(c => (
            <li key={c.id} className="py-2 flex justify-between">
              <span>{new Date(c.abierta_at).toLocaleDateString("es-CO")} · {c.estado}</span>
              <span>{money(c.monto_apertura)} → {c.monto_cierre != null ? money(c.monto_cierre) : "—"}</span>
            </li>
          ))}
          {historial.length===0 && <li className="py-2 text-muted-foreground">Sin movimientos</li>}
        </ul>
      </Card>
    </div>
  );
}
