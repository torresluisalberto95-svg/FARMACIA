import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { configuracionApi } from "@/api/configuracion";
import defaultLogo from "@/assets/logo.png";

interface Branding {
  brandName: string;
  logoUrl: string;
  refresh: () => Promise<void>;
}

const Ctx = createContext<Branding | null>(null);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [brandName, setBrandName] = useState("MD FarmaSalud");
  const [logoUrl, setLogoUrl] = useState<string>(defaultLogo);

  const refresh = useCallback(async () => {
    try {
      const data = await configuracionApi.get();
      if (data) {
        setBrandName(data.brandName || "MD FarmaSalud");
        setLogoUrl(data.logoUrl || defaultLogo);
      }
    } catch {
      // ignore — use defaults
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return <Ctx.Provider value={{ brandName, logoUrl, refresh }}>{children}</Ctx.Provider>;
}

export function useBranding() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBranding must be inside BrandingProvider");
  return ctx;
}
