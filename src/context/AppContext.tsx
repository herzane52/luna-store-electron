import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface Settings {
  theme: string;
  language: string;
  defaultPage: string;
  preferredPackageManager: string;
  customAccentColor: string;
  windowManager: string;
  setupComplete: boolean;
  distro?: string;
  packageManagers?: any;
}

export interface PackageItem {
  name: string;
  version: string;
  repo?: string;
  description?: string;
  type?: string;
  installedSize?: string;
}

export interface UpdateItem {
  name: string;
  currentVersion: string;
  newVersion: string;
  repo?: string;
  type?: 'explicit' | 'dependency';
  description?: string;
  downloadSize?: string;
}

interface AppContextType {
  settings: Settings | null;
  t: (key: string) => string;
  updateSettings: (newSettings: Partial<Settings>) => void;
  isLoading: boolean;
  availableLanguages: Language[];
  setAppData: (data: any) => void;
  packages: PackageItem[];
  updates: UpdateItem[];
  ignoredPackages: string[];
  orphans: string[];
  icons: Record<string, string>;
  isDataLoading: boolean;
  showDevNote: boolean;
  refreshPackages: (force?: boolean) => Promise<void>;
  refreshUpdates: (force?: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [localizedStrings, setLocalizedStrings] = useState<any>(null);
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [ignoredPackages, setIgnoredPackages] = useState<string[]>([]);
  const [orphans, setOrphans] = useState<string[]>([]);
  const [icons, setIcons] = useState<Record<string, string>>({});
  const [showDevNote, setShowDevNote] = useState(false);

  useEffect(() => {
    const checkDevStatus = async () => {
      try {
        // luna.herzane.tr üzerindeki API'yi kontrol et
        const res = await fetch("https://luna.herzane.tr/api/dev", {
          cache: 'no-store' // Önbelleği devre dışı bırak
        });

        if (!res.ok) throw new Error("API error");

        const data = await res.json();

        // API { status: true } veya direkt true dönerse göster
        const isEnabled = data === true || data?.status === true;
        setShowDevNote(isEnabled);

        console.log("Dev note status:", isEnabled);
      } catch (e) {
        // Hata durumunda veya internet yoksa gizli kalsın
        console.warn("Could not fetch dev status, hidden by default.");
        setShowDevNote(false);
      }
    };
    checkDevStatus();
  }, []);

  const loadStrings = useCallback(async (lang: string) => {
    try {
      let strings = null;
      if (typeof window !== "undefined" && window.api) {
        strings = await window.api.settings.getLocale(lang);
      }

      setLocalizedStrings(strings);
    } catch (e) {
      console.error(`Failed to load locale: ${lang}`, e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (typeof window !== "undefined" && window.api) {
        try {
          const data = await window.api.settings.get();
          const langs = await window.api.settings.listLocales();
          setAvailableLanguages(langs);
          setSettings(data as Settings);
          await loadStrings(data.language || "tr");
        } catch (e) {
          console.error("Init failed", e);
        }
      }
      setIsLoading(false);
    };
    init();
  }, [loadStrings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    if (!settings) return;
    const updated = { ...settings, ...newSettings } as Settings;
    setSettings(updated);

    if (newSettings.language) {
      loadStrings(newSettings.language);
    }

    if (window.api) {
      window.api.settings.save(updated).catch(console.error);
    }
  };

  const t = (key: string) => {
    if (!localizedStrings) return key;
    const keys = key.split(".");
    let value: any = localizedStrings;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const setAppData = useCallback((data: any) => {
    if (data.packages) setPackages(data.packages);
    if (data.updates) setUpdates(data.updates);
    if (data.ignored) setIgnoredPackages(data.ignored);
    if (data.orphans) setOrphans(data.orphans);
    if (data.icons) setIcons((prev: any) => ({ ...prev, ...data.icons }));
  }, []);

  const refreshPackages = async (force = false) => {
    if (!window.api) return;
    setIsDataLoading(true);
    try {
      const pkg = await window.api.pacman.getInstalledPackages(force);
      if (pkg.packages) setPackages(pkg.packages as any);
    } finally {
      setIsDataLoading(false);
    }
  };

  const refreshUpdates = async (force = false) => {
    if (!window.api) return;
    setIsDataLoading(true);
    try {
      const [pacmanRes, aurRes] = await Promise.all([
        window.api.pacman.getUpdates(force),
        window.api.aur.getUpdates().catch(() => ({ updates: [], count: 0 }))
      ]);

      const pacmanUpdates = pacmanRes.updates || [];
      const aurUpdates = aurRes.updates || [];

      setUpdates([...pacmanUpdates, ...aurUpdates] as any);
    } catch (error) {
      console.error("Failed to refresh updates:", error);
    } finally {
      setIsDataLoading(false);
    }
  };

  return (
    <AppContext.Provider value={{
      settings, t, updateSettings, isLoading, availableLanguages,
      packages, updates, ignoredPackages, orphans, icons, isDataLoading,
      refreshPackages, refreshUpdates, setAppData, showDevNote
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
