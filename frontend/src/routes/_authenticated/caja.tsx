import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cajaApi, type Caja } from "@/api/caja";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/caja")({ component: CajaPage });

function CajaPage() {
  const [actual, setActual] = useState<Caja | null>(null);
  const [historial, setHistorial] = useState<Caja[]>([]);
  const [ventas, setVentas] = useState(0);
  const [monto, setMonto] = useState(0);
  const [obs, setObs] = useState("");

  const load = async () => {
    const data = await cajaApi.estado();
    setActual(data.actual);
    setHistorial(data.historial);
    setVentas(Number(data.ventasEnCaja));
  };
  useEffect(() => { load(); }, []);

  const abrir = async () => {
    try { await cajaApi.abrir(monto); toast.success("Caja abierta"); setMonto(0); load(); }
    catch (err: any) { toast.error(err.response?.data ?? "Error"); }
  };

  const cerrar = async () => {
    if (!actual) return;
    try { await cajaApi.cerrar(actual.id, monto, obs); toast.success("Caja cerrada"); setMonto(0); setObs(""); load(); }
    catch (err: any) { toast.error(err.response?.data ?? "Error"); }
  };

  const money = (n: number) => `$ ${Number(n).toLocaleString("es-CO")}`;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <PageHeader title="Caja" description="Apertura, cierre y arqueo de tu caja." />
      <Card className="p-6 mb-6">
        {actual ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div><Badge>Caja abierta</Badge><p className="text-sm text-muted-foreground mt-1">Desde {new Date(actual.abiertaAt).toLocaleString("es-CO")}</p></div>
              <div className="text-right"><p className="text-xs text-muted-foreground">Apertura</p><p className="text-xl font-bold">{money(actual.montoApertura)}</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted">
              <div><p className="text-xs">Ventas en caja</p><p className="text-lg font-semibold">{money(ventas)}</p></div>
              <div><p className="text-xs">Esperado en caja</p><p className="text-lg font-semibold">{money(Number(actual.montoApertura) + ventas)}</p></div>
            </div>
            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              <div><Label>Monto contado</Label><Input type="number" value={monto} onChange={e => setMonto(Number(e.target.value))} /></div>
              <div><Label>Observaciones</Label><Input value={obs} onChange={e => setObs(e.target.value)} /></div>
            </div>
            <Button className="mt-4" onClick={cerrar}>Cerrar caja</Button>
          </>
        ) : (
          <>
            <h3 className="font-semibold mb-3">Abrir caja</h3>
            <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
              <div><Label>Monto inicial</Label><Input type="number" value={monto} onChange={e => setMonto(Number(e.target.value))} /></div>
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
              <span>{new Date(c.abiertaAt).toLocaleDateString("es-CO")} · {c.estado}</span>
              <span>{money(c.montoApertura)} → {c.montoCierre != null ? money(c.montoCierre) : "—"}</span>
            </li>
          ))}
          {historial.length === 0 && <li className="py-2 text-muted-foreground">Sin movimientos</li>}
        </ul>
      </Card>
    </div>
  );
}
