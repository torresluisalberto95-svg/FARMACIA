import { Link, useLocation, useNavigate, Outlet } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { useBranding } from "@/hooks/use-branding";
import { useInactivityTimer } from "@/hooks/use-inactivity-timer";
import { useEffect, useCallback } from "react";
import {
  LayoutDashboard, ShoppingCart, Package, Users,
  Truck, FileText, Wallet, BarChart3, UserCog, Settings, LogOut, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; roles: AppRole[] };

const NAV: Item[] = [
  { to: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard, roles: ["admin", "empleado"] },
  { to: "/ventas",       label: "Ventas",        icon: ShoppingCart,    roles: ["admin", "empleado"] },
  { to: "/productos",    label: "Inventario",    icon: Package,         roles: ["admin", "empleado"] },
  { to: "/clientes",     label: "Clientes",      icon: Users,           roles: ["admin", "empleado"] },
  { to: "/proveedores",  label: "Proveedores",   icon: Truck,           roles: ["admin"] },
  { to: "/compras",      label: "Compras",        icon: FileText,        roles: ["admin"] },
  { to: "/caja",         label: "Caja",           icon: Wallet,          roles: ["admin", "empleado"] },
  { to: "/reportes",     label: "Reportes",       icon: BarChart3,       roles: ["admin"] },
  { to: "/usuarios",     label: "Usuarios",       icon: UserCog,         roles: ["admin"] },
  { to: "/configuracion",label: "Configuración", icon: Settings,        roles: ["admin"] },
];

export function AppLayout() {
  const { user, role, fullName, loading, signOut } = useAuth();
  const { brandName, logoUrl } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = useCallback(() => {
    signOut();
    navigate({ to: "/login" });
  }, [signOut, navigate]);

  const { showWarning, countdown, continuar, cerrarAhora } = useInactivityTimer(handleLogout);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user || !role) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Cargando…</div>;
  }

  const items = NAV.filter(i => i.roles.includes(role));

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar desktop */}
      <aside className="w-64 shrink-0 hidden lg:flex flex-col bg-sidebar text-sidebar-foreground">
        <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
          <img src={logoUrl} alt={brandName} width={36} height={36} className="rounded-lg bg-white/10 p-1 object-contain" />
          <div>
            <p className="font-semibold leading-tight">{brandName}</p>
            <p className="text-[10px] uppercase tracking-wider opacity-60">Gestión farmacéutica</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-auto">
          {items.map(({ to, label, icon: Icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link key={to} to={to} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}>
                <Icon className="h-4 w-4" />{label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-2 py-2">
            <p className="text-sm font-medium truncate">{fullName || user.email}</p>
            <p className="text-xs opacity-60 capitalize">{role}</p>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b bg-card">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="" width={28} height={28} className="object-contain" />
            <span className="font-semibold">{brandName}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button>
        </header>
        <main className="flex-1 overflow-auto"><Outlet /></main>
        <nav className="lg:hidden border-t bg-card flex overflow-x-auto">
          {items.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex-1 min-w-[72px] flex flex-col items-center py-2 text-xs text-muted-foreground [&.active]:text-primary" activeProps={{ className: "active" }}>
              <Icon className="h-5 w-5 mb-0.5" />{label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Diálogo de inactividad */}
      <Dialog open={showWarning} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-500">
              <Clock className="h-5 w-5" />
              Sesión por expirar
            </DialogTitle>
            <DialogDescription className="pt-1">
              Su sesión se cerrará automáticamente en{" "}
              <span className="font-bold text-foreground text-lg">{countdown}</span>{" "}
              segundo{countdown !== 1 ? "s" : ""} por inactividad.
              <br />¿Desea continuar trabajando?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="destructive" className="flex-1" onClick={cerrarAhora}>
              Cerrar sesión
            </Button>
            <Button className="flex-1" onClick={continuar}>
              Continuar trabajando
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
