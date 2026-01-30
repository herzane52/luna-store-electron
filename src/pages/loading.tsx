import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { Loader2, Info, Github, Globe, AlertTriangle } from "lucide-react";
import { THEMES } from "../constants/themes";
import WindowTitleBar from "../components/WindowTitleBar";
import { useApp } from "../context/AppContext";

export default function LoadingPage() {
    const router = useRouter();
    const { settings, t, setAppData, isLoading: appLoading, showDevNote } = useApp();

    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const [mounted, setMounted] = useState(false);
    const isRunning = React.useRef(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Context yüklendiğinde mesajı ayarla
    useEffect(() => {
        if (!appLoading && !statusMessage) {
            setStatusMessage(t("boot.checking_connection"));
        }
    }, [appLoading, t]);

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const initAndCheckConnection = async () => {
        setStatusMessage(t("boot.checking_connection"));
        await wait(800);
        setProgress(15);
    };

    const loadConfigAndDatabase = async () => {
        setStatusMessage(t("boot.loading_config"));
        await wait(300);
        setProgress(20);

        try {
            setStatusMessage(t("boot.scanning_packages"));
            const dbResult = await window.api.pacman.refreshDatabase();

            if (dbResult && dbResult.cancelled) {
                console.warn("Veritabanı yenileme kullanıcı tarafından iptal edildi, mevcut verilerle devam ediliyor.");
            }

            const [pkgResult, ignoredResult, orphansResult] = await Promise.all([
                window.api.pacman.getInstalledPackages(true),
                window.api.pacman.getIgnoredPackages(),
                window.api.pacman.getOrphans()
            ]);

            const installedPackages = pkgResult.packages || [];
            const ignoredPackages = ignoredResult.packages || [];
            const orphans = orphansResult.packages || [];

            setAppData({ packages: installedPackages, ignored: ignoredPackages, orphans: orphans });
            setProgress(40);

            setStatusMessage(t("boot.checking_updates"));
            const [pacmanRes, aurRes] = await Promise.all([
                window.api.pacman.checkUpdates(true),
                window.api.aur.getUpdates().catch(() => ({ updates: [] }))
            ]);

            const pacmanUpdates = pacmanRes.updates || [];
            const aurUpdates = (aurRes.updates || []).filter(
                (au: any) => !pacmanUpdates.some((pu: any) => pu.name === au.name)
            );
            const combinedUpdates = [...pacmanUpdates, ...aurUpdates];

            setAppData({ updates: combinedUpdates });
            setProgress(60);

            setStatusMessage(t("boot.indexing_apps"));
            await window.api.pacman.syncAppCache();
            setProgress(75);

            if (installedPackages.length > 0) {
                const names = installedPackages
                    .filter((p: any) => p.type === 'explicit')
                    .map((p: any) => p.name);

                const total = names.length;
                setStatusMessage(t("boot.preparing_icons_count").replace("{current}", "0").replace("{total}", total.toString()));

                const chunkSize = 50;
                for (let i = 0; i < total; i += chunkSize) {
                    const chunk = names.slice(i, i + chunkSize);
                    const iconRes = await window.api.pacman.getBatchIcons(chunk);
                    if (iconRes.icons) {
                        setAppData({ icons: iconRes.icons });
                    }

                    const currentProgress = 75 + Math.floor(((i + chunk.length) / total) * 20);
                    setProgress(currentProgress);
                    const currentCount = Math.min(i + chunk.length, total);
                    setStatusMessage(t("boot.preparing_icons_count").replace("{current}", currentCount.toString()).replace("{total}", total.toString()));
                }
            }
            setProgress(95);
        } catch (error) {
            console.error("Yükleme sırasında hata:", error);
            setStatusMessage(t("boot.load_error"));
        }

        setStatusMessage(t("boot.ready"));
        setProgress(100);
        await wait(300);
    };

    useEffect(() => {
        if (isRunning.current || appLoading) return;
        isRunning.current = true;

        if (typeof window !== 'undefined') {
            sessionStorage.setItem("hasBooted", "true");
        }

        const runBootSequence = async () => {
            await initAndCheckConnection();
            setSettingsLoaded(true);
            await loadConfigAndDatabase();
            const target = settings?.defaultPage === 'update' ? '/update' : '/manager';
            router.push(target);
        };

        runBootSequence();
    }, [router, appLoading, t]);

    if (!mounted || !settingsLoaded || appLoading) {
        return (
            <div className={`h-screen w-screen ${THEMES[settings?.theme || 'dark']?.class || 'bg-neutral-950'}`}>
                <WindowTitleBar />
            </div>
        );
    }

    return (
        <div className={`h-screen w-screen flex items-center justify-center ${THEMES[settings?.theme || 'dark']?.class || 'bg-neutral-950'} transition-colors duration-0 rounded-xl`}>
            <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden select-none text-white font-sans rounded-xl shadow-2xl">
                <WindowTitleBar />

                <div className="z-10 flex flex-col items-center gap-2 w-full max-w-2xl text-center">
                    <div className="relative">
                        <img
                            src="luna-logo.svg"
                            alt="Luna"
                            className="h-[500px] w-auto select-none pointer-events-none"
                        />
                    </div>

                    <div className="space-y-6 w-full px-8 -mt-20">
                        <div className="h-12 flex flex-col items-center justify-center">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={progress === 100 ? "ready" : "loading"}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-4 text-white font-semibold text-2xl tracking-wide"
                                >
                                    {progress < 100 && <Loader2 className="animate-spin text-blue-400" size={24} />}
                                    <span className="drop-shadow-lg">{statusMessage}</span>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="w-full max-w-md mx-auto space-y-2">
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/10 backdrop-blur-md relative">
                                <motion.div
                                    className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ ease: "linear", duration: 0.2 }}
                                />
                            </div>
                            <div className="flex justify-end">
                                <span className="text-[10px] font-black text-white/30 tracking-widest uppercase">
                                    {Math.round(progress)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute px-10 bottom-0 w-full">
                    <div className="overflow-hidden">
                        {/* Not Kısmı */}
                        {showDevNote && (
                            <div className="flex items-center justify-center gap-4">
                                <div className="flex items-center gap-1">
                                    <div className="p-1.5 rounded-lg text-blue-500">
                                        <Info size={16} />
                                    </div>
                                    <div className="text-[14px] font-medium text-blue-500">
                                        {t("setup.dev_note")}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => window.api.window.openExternal("https://github.com/herzane52/luna-store")}
                                        className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition bg-white/5 rounded-full border border-white/5 hover:border-white/20 hover:scale-110 active:scale-95"
                                        title="GitHub"
                                    >
                                        <Github size={14} />
                                    </button>
                                    <button
                                        onClick={() => window.api.window.openExternal("https://luna.herzane.tr")}
                                        className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition bg-white/5 rounded-full border border-white/5 hover:border-white/20 hover:scale-110 active:scale-95"
                                        title="luna.herzane.tr"
                                    >
                                        <Globe size={14} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Uyarı Kısmı */}
                        <div className="p-4 flex flex-col">
                            <div className="flex items-center pb-1 justify-center gap-2 text-red-400 font-black text-[13px] uppercase tracking-widest text-center">
                                <AlertTriangle size={14} /> {t("setup.disclaimer_title")}
                            </div>
                            <p className="text-[12px] text-gray-400 leading-relaxed font-medium text-center px-10" style={{ textWrap: 'balance' } as any}>
                                {t("setup.disclaimer_text")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
