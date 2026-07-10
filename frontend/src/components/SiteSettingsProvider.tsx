"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getVilla } from "@/lib/api";

interface SiteSettings {
  contactEmail: string;
  contactPhone: string;
}

// İletişim bilgileri dilden bağımsızdır; bir kez çekilir.
const DEFAULTS: SiteSettings = {
  contactEmail: "ahmethafi@gmail.com",
  contactPhone: "+90 533 590 05 90",
};

const SiteSettingsContext = createContext<SiteSettings>(DEFAULTS);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);

  useEffect(() => {
    getVilla()
      .then((v) =>
        setSettings({
          contactEmail: v.contactEmail || DEFAULTS.contactEmail,
          contactPhone: v.contactPhone || DEFAULTS.contactPhone,
        })
      )
      .catch(() => {
        /* varsayılanlar kalır */
      });
  }, []);

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
