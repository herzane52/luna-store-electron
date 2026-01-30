"use client";

import { useState, useEffect, ReactNode, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { RefreshCw, Download, Settings, Info, Terminal, Minus, Square, X as CloseIcon, Search as SearchIcon, X } from "lucide-react";
import SettingsComponent from "./Settings";
import AdvancedSettings from "./AdvancedSettings";
import About from "./About";
import SearchOverlay from "./SearchOverlay";
import dynamic from "next/dynamic";
import { useApp } from "../context/AppContext";

import { THEMES } from "../constants/themes";

// Persistable Page Imports (Dynamic with SSR disabled to fix 'self is not defined')
const TerminalPage = dynamic(() => import("../pages/terminal"), { ssr: false });
const ManagerPage = dynamic(() => import("../pages/manager"), { ssr: false });
const UpdatePage = dynamic(() => import("../pages/update"), { ssr: false });

interface LayoutProps {
  children: ReactNode;
}

const themeClasses = Object.fromEntries(
  Object.entries(THEMES).map(([key, value]) => [key, value.class])
);

const Layout = ({ children }: LayoutProps) => {
  const { settings, t, updateSettings, isLoading } = useApp();
  const router = useRouter();
  const pathname = router.pathname;

  // Map pathname to activeTab
  const getActiveTab = () => {
    if (pathname === "/" || pathname === "/terminal") return "terminal";
    if (pathname === "/update") return "update";
    if (pathname === "/manager") return "manager";
    return "manager"; // default
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [pathname]);

  const allTabs = ['terminal', 'update', 'manager'];

  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuTab, setActiveMenuTab] = useState<"settings" | "advanced" | "about">("settings");

  // Map tabs to their components (Memoize to keep element identity stable)
  const views = useMemo(() => ({
    terminal: <TerminalPage />,
    manager: <ManagerPage />,
    update: <UpdatePage />
  }), []);

  // Ayarlar yüklenmeden render etme (Theme Flash önlemi)
  if (isLoading || !settings) return null;

  // Render logic for persistent views
  const renderPersistentView = () => {
    // Determine if we should show the children (for special pages) 
    // or if we use our internal persistent logic.
    const isSpecialPage = ["/testmanager", "/debug"].includes(pathname);

    if (isSpecialPage) {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      );
    }

    return (
      <div className="relative w-full h-full overflow-hidden">
        {Object.entries(views).map(([tab, component]) => (
          <div
            key={tab}
            className={`absolute inset-0 transition-all duration-500 ${activeTab === tab
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto z-10"
              : "opacity-0 translate-y-4 scale-95 pointer-events-none z-0"
              }`}
          >
            {component as ReactNode}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`scrollbar-hidden h-screen flex flex-col text-gray-100 transition-all duration-500
                 ${themeClasses[settings.theme] || "bg-neutral-950"} relative rounded-xl overflow-hidden`}>


      {/* Üst bar - Sürüklenebilir Alan */}
      <header className="z-50 pl-3 pr-3 py-3 flex items-center select-none relative" style={{ WebkitAppRegion: 'drag' } as any}>
        {/* Logo ve Sürükleme Başlığı */}
        <div className="relative flex items-center gap-3 overflow-hidden flex-shrink-0 px-2 py-1 rounded-lg">
          <div className="w-[40px] h-[40px] relative">
            <img
              src="luna.svg"
              alt="Luna Logo"
              className="w-full h-full"
            />
          </div>
          <span className="text-white font-extrabold text-xl tracking-widest drop-shadow-md uppercase hidden sm:inline">LUNA STORE</span>
        </div>

        {/* Orta Kısım: Arama Çubuğu (Tıklanabilir - No Drag) */}
        <div className="flex-1 flex justify-center" >
          <div className="w-full max-w-md relative group" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (val.length > 1) setShowSearch(true);
                  else setShowSearch(false);
                }}
                placeholder={t("common.search_placeholder")}
                className="w-full bg-white/10 border border-white/20 rounded-full py-2 pl-12 pr-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm backdrop-blur-md"
                onFocus={() => { if (searchQuery.length > 1) setShowSearch(true); }}
              />
              <SearchIcon className="absolute left-4 text-gray-400 group-focus-within:text-blue-400 transition-colors pointer-events-none z-10" size={18} />
              {searchQuery && (
                <div className="absolute right-3 flex items-center z-10">
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setShowSearch(false);
                    }}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    title={t("common.clear")}
                  >
                    <X size={16} className="text-gray-400 hover:text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sağ tarafta butonlar (Tıklanabilir - No Drag) */}
        <div className="flex items-center gap-2 flex-shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>


          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-lg text-sm transition flex items-center gap-1 cursor-pointer"
            >
              <Settings size={16} /> {t("common.settings")}
            </button>

          </div>

          {/* Ayarlar Menüsü (Centered in Header) */}
          <AnimatePresence>
            {showMenu && (
              <>
                {/* Dışarı tıklamayı yakalamak için görünmez arka plan */}
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, x: "-50%", scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
                  exit={{ opacity: 0, y: -10, x: "-50%", scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-1/2 top-full mt-2 w-[500px] bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl z-50 overflow-hidden"
                >
                  {/* Sekme Başlıkları */}
                  <div className="flex border-b border-white/10">
                    <button
                      onClick={() => setActiveMenuTab("settings")}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${activeMenuTab === "settings"
                        ? "bg-white/20 text-white"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                        }`}
                    >
                      <Settings size={16} className="inline mr-2" />
                      {t("common.settings")}
                    </button>
                    <button
                      onClick={() => setActiveMenuTab("advanced")}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${activeMenuTab === "advanced"
                        ? "bg-white/20 text-white"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                        }`}
                    >
                      <Terminal size={16} className="inline mr-2" />
                      {t("settings.advanced")}
                    </button>
                    <button
                      onClick={() => setActiveMenuTab("about")}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${activeMenuTab === "about"
                        ? "bg-white/20 text-white"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                        }`}
                    >
                      <Info size={16} className="inline mr-2" />
                      {t("common.about")}
                    </button>
                  </div>

                  <div className="max-h-[500px] overflow-hidden">
                    {activeMenuTab === "settings" ? (
                      <SettingsComponent />
                    ) : activeMenuTab === "advanced" ? (
                      <AdvancedSettings />
                    ) : (
                      <About />
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-0.5 ml-2">
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.api) {
                  window.api.window.minimize();
                }
              }}
              className="w-8 h-8 rounded-full hover:bg-white/10 backdrop-blur-lg transition flex items-center justify-center cursor-pointer hover:scale-105"
              title={t("window.minimize")}
            >
              <Minus size={14} strokeWidth={3} />
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.api) {
                  window.api.window.maximize();
                }
              }}
              className="w-8 h-8 rounded-full hover:bg-white/10 backdrop-blur-lg transition flex items-center justify-center cursor-pointer hover:scale-105"
              title={t("window.maximize")}
            >
              <Square size={12} strokeWidth={3} />
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.api) {
                  window.api.window.close();
                }
              }}
              className="w-8 h-8 rounded-full hover:bg-red-500/80 backdrop-blur-lg transition flex items-center justify-center cursor-pointer hover:scale-105 group"
              title={t("window.close")}
            >
              <CloseIcon size={14} strokeWidth={3} className="text-white group-hover:scale-110" />
            </button>
          </div>
        </div>
      </header>

      {/* İçerik Alanı */}
      <main className="relative z-10 flex-1 overflow-hidden mb-3">
        {renderPersistentView()}
      </main>

      {/* Alt Navigasyon */}
      <footer className="absolute z-40 w-full flex justify-center p-2 bottom-0 pointer-events-none">
        <div className="w-[350px] bg-white/20 border border-blue-500/40 rounded-full h-15 backdrop-blur-md overflow-hidden shadow-full group pointer-events-auto">
          <div className="grid h-full grid-cols-3">
            {allTabs.map(tab => {
              const isActive = activeTab === tab;
              const icons: any = {
                terminal: <Terminal size={20} />,
                update: <Download size={20} />,
                manager: <RefreshCw size={20} />
              };
              const labels: any = {
                terminal: t("nav.terminal"),
                update: t("nav.update"),
                manager: t("nav.manager")
              };
              const paths: any = {
                terminal: "/terminal",
                update: "/update",
                manager: "/manager"
              };

              return (
                <button
                  key={tab}
                  onClick={() => router.push(paths[tab])}
                  className={`flex flex-col items-center justify-center transition-all p-2 rounded-lg ${isActive
                    ? "text-blue-400 scale-110"
                    : "text-gray-300 hover:text-white hover:bg-white/10 hover:scale-105"
                    }`}
                >
                  {icons[tab]}
                  <span className="text-xs mt-1">{labels[tab]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </footer>

      {/* Arama Sonuçları Overlay (Dropdown Mantığı) */}
      <SearchOverlay
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        lang={settings.language}
        queryPrefix={searchQuery}
      />
    </div>
  );
};

export default Layout;
