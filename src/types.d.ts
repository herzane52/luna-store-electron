// Global window.api'nin varlığını varsayıyoruz (preload.js'ten geliyor)
declare global {
  interface Window {
    api: {
      getAppVersion: () => Promise<string>;
      relaunch: () => Promise<void>;
      quit: () => Promise<void>;
      pacman: {
        getInstalledPackages: (force?: boolean) => Promise<{ packages?: { name: string; version: string; repo?: string; type?: string; }[]; error?: string; fromCache?: boolean }>;
        search: (query: string) => Promise<{ results?: any[]; error?: string }>;
        getPackageInfo: (packageName: string) => Promise<{ info?: Record<string, string>; error?: string }>;
        getBatchIcons: (packageNames: string[]) => Promise<{ icons?: Record<string, string>; error?: string }>;
        getBatchInfo: (packageNames: string[]) => Promise<{ results: Record<string, any>; error?: string }>;
        install: (packageName: string, options?: { inTerminal?: boolean }) => Promise<{ success?: boolean; code?: number; error?: string; cancelled?: boolean }>;
        remove: (packageName: string, options?: { inTerminal?: boolean }) => Promise<{ success?: boolean; code?: number; error?: string; cancelled?: boolean }>;
        toggleIgnore: (packageName: string, shouldIgnore: boolean) => Promise<{ success?: boolean; error?: string }>;
        getIgnoredPackages: () => Promise<{ packages?: string[]; error?: string }>;
        getUpdates: (force?: boolean) => Promise<{ updates?: { name: string; currentVersion: string; newVersion: string; type: 'explicit' | 'dependency'; repo: string; description: string; }[]; count?: number; error?: string; fromCache?: boolean }>;
        checkUpdates: (force?: boolean) => Promise<{ updates?: { name: string; currentVersion: string; newVersion: string; type: 'explicit' | 'dependency'; repo: string; description: string; }[]; count?: number; error?: string; fromCache?: boolean }>;
        updateSystem: (options?: { inTerminal?: boolean }) => Promise<{ success?: boolean; code?: number; error?: string; cancelled?: boolean }>;
        launchApp: (packageName: string) => Promise<{ success: boolean; error?: string }>;
        checkDesktopFile: (packageName: string) => Promise<{ launchable: boolean; error?: string }>;
        syncAppCache: () => Promise<{ success: boolean; error?: string }>;
        onCacheUpdated: (callback: () => void) => (() => void);
        getOrphans: () => Promise<{ packages?: string[]; error?: string }>;
        checkCommand: (command: string) => Promise<{ exists: boolean }>;
        getPackageIcon: (packageName: string) => Promise<{ iconUrl?: string; error?: string }>;
        refreshDatabase: () => Promise<{ success: boolean; error?: string; cancelled?: boolean }>;
        sendInput: (data: string) => Promise<{ success?: boolean; error?: string }>;
      };
      aur: {
        search: (query: string) => Promise<{ results?: any[]; error?: string }>;
        getBatchInfo: (packageNames: string[]) => Promise<{ results: Record<string, any>; error?: string }>;
        getInfo: (packageName: string) => Promise<{ info?: Record<string, string>; error?: string }>;
        getIcon: (packageName: string) => Promise<{ iconUrl?: string; error?: string }>;
        getUpdates: () => Promise<{ updates?: { name: string; currentVersion: string; newVersion: string; type: 'explicit' | 'dependency'; repo: string; description: string; }[]; count?: number; error?: string }>;
        install: (packageName: string, options?: { inTerminal?: boolean }) => Promise<{ success?: boolean; code?: number; error?: string }>;
      };
      window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
        openExternal: (url: string) => Promise<void>;
      };
      settings: {
        get: () => Promise<{
          theme?: string;
          language?: string;
          defaultPage?: string;
          setupComplete?: boolean;
          preferredPackageManager?: string;
          customAccentColor?: string;
          windowManager?: string;
          distro?: string;
          packageManagers?: {
            pacman: boolean;
            yay: boolean;
            paru: boolean;
          };
        }>;
        save: (settings: any) => Promise<boolean>;
        resetSetup: () => Promise<boolean>;
        clearCache: () => Promise<{ success: boolean; error?: string }>;
        checkArch: () => Promise<boolean>;
        checkCommand: (cmd: string) => Promise<boolean>;
        listLocales: () => Promise<any[]>;
        getLocale: (lang: string) => Promise<any>;
      };
      terminal: {
        create: () => Promise<boolean>;
        write: (data: string) => Promise<void>;
        resize: (cols: number, rows: number) => Promise<void>;
        onData: (callback: (data: string) => void) => (() => void);
        onExit: (callback: () => void) => (() => void);
      };
    };
  };
}

declare module '*.css' {
  const content: any;
  export default content;
}

export { };
