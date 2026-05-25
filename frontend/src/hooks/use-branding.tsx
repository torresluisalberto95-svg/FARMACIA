import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import defaultLogo from "@/assets/logo.png";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

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
      // Use native fetch (no Axios interceptors) so a 401 response never
      // triggers the redirect-to-login loop on the unauthenticated login page
      const res = await fetch(`${BASE_URL}/api/configuracion`);
      if (res.ok) {
        const data = await res.json();
        setBrandName(data.brandName || "MD FarmaSalud");
        setLogoUrl(data.logoUrl || defaultLogo);
      }
    } catch {
      // keep defaults on any network error
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
