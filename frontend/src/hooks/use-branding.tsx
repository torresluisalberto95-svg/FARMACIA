import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import defaultLogo from "@/assets/logo.png";
import type { Configuracion } from "@/api/configuracion";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

interface Branding {
  brandName: string;
  logoUrl: string;
  config: Configuracion | null;
  refresh: () => Promise<void>;
}

const Ctx = createContext<Branding | null>(null);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [brandName, setBrandName] = useState("MD FarmaSalud");
  const [logoUrl, setLogoUrl] = useState<string>(defaultLogo);
  const [config, setConfig] = useState<Configuracion | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/configuracion`);
      if (res.ok) {
        const data: Configuracion = await res.json();
        setBrandName(data.brandName || "MD FarmaSalud");
        setLogoUrl(data.logoUrl || defaultLogo);
        setConfig(data);
      }
    } catch {
      // keep defaults on any network error
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return <Ctx.Provider value={{ brandName, logoUrl, config, refresh }}>{children}</Ctx.Provider>;
}

export function useBranding() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBranding must be inside BrandingProvider");
  return ctx;
}
