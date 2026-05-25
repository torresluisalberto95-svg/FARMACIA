import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/dashboard" });
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("Bienvenido");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? err.message ?? "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex md:w-1/2 flex-col justify-between p-12 text-sidebar-foreground" style={{ background: "var(--gradient-brand)" }}>
        <div className="flex items-center gap-3">
          <img src={logo} alt="MD FarmaSalud" width={48} height={48} className="rounded-xl bg-white/10 p-1.5" />
          <span className="text-xl font-semibold tracking-tight">MD FarmaSalud</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">Gestiona tu farmacia<br />con precisión clínica.</h1>
          <p className="mt-4 text-base opacity-80 max-w-md">
            Ventas, inventario, lotes y vencimientos en un solo lugar. Seguro, rápido y diseñado para el día a día.
          </p>
        </div>
        <p className="text-xs opacity-60">© {new Date().getFullYear()} MD FarmaSalud</p>
      </aside>
      <main className="flex-1 flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md p-8" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="md:hidden flex items-center gap-2 mb-6">
            <img src={logo} alt="MD FarmaSalud" width={36} height={36} />
            <span className="font-semibold">MD FarmaSalud</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">Acceso al sistema</h2>
          <p className="text-sm text-muted-foreground mb-6">Ingresa con las credenciales asignadas por el administrador.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
