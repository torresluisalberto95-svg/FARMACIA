import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
    const { data } = await supabase
      .from("configuracion")
      .select("brand_name, logo_url")
      .maybeSingle();
    if (data) {
      setBrandName(data.brand_name || "MD FarmaSalud");
      setLogoUrl(data.logo_url || defaultLogo);
    }
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("configuracion-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "configuracion" }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return <Ctx.Provider value={{ brandName, logoUrl, refresh }}>{children}</Ctx.Provider>;
}

export function useBranding() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBranding must be inside BrandingProvider");
  return ctx;
}