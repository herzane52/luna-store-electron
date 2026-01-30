"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Package, Activity, Info } from "lucide-react";
import PackageIcon from "./PackageIcon";
import { useApp } from "../context/AppContext";

interface SearchResult {
    name: string;
    repo: string;
    version: string;
    description: string;
    download_size?: string;
    installed_size?: string;
    isDetailedLoading?: boolean;
    isInstalled?: boolean;
    icon?: string | null;
    type?: string;
}

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    lang: string;
    queryPrefix?: string;
}

const Toggle = ({ enabled, onChange, label, activeColor }: { enabled: boolean, onChange: () => void, label: string, activeColor: string }) => (
    <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={onChange}>
        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${enabled ? "text-white" : "text-gray-500 group-hover:text-gray-400"}`}>{label}</span>
        <div className={`w-10 h-5.5 rounded-full p-1 transition-colors duration-300 ease-in-out relative ${enabled ? activeColor : "bg-white/10"}`}>
            <motion.div
                animate={{ x: enabled ? 18 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-3.5 h-3.5 bg-white rounded-full shadow-md"
            />
        </div>
    </div>
);

const SearchOverlay = ({ isOpen, onClose, lang, queryPrefix = "" }: SearchOverlayProps) => {
    const { t } = useApp();
    const router = useRouter();
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPacmanEnabled, setIsPacmanEnabled] = useState(true);
    const [isAurEnabled, setIsAurEnabled] = useState(true);
    const searchId = useRef(0);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
    const detailTimeout = useRef<NodeJS.Timeout | null>(null);

    const clearTimeouts = () => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (detailTimeout.current) clearTimeout(detailTimeout.current);
    };

    useEffect(() => {
        if (!isOpen) {
            setResults([]);
            setIsLoading(false);
            clearTimeouts();
            searchId.current++; // Invalidate any ongoing searches
            return;
        }
        // queryPrefix değiştiğinde aramayı başlat
        if (queryPrefix && queryPrefix.length > 1) {
            clearTimeouts();
            searchTimeout.current = setTimeout(() => {
                performSearch(queryPrefix);
            }, 300);
        } else {
            // Sorgu kısaldığında veya silindiğinde anında temizle (takılmeyi önler)
            clearTimeouts();
            setResults([]);
            setIsLoading(false);
            searchId.current++;
        }
    }, [isOpen, queryPrefix, isPacmanEnabled, isAurEnabled]);

    const performSearch = async (val: string) => {
        if (!val.trim() || val.length < 2) {
            setResults([]);
            setIsLoading(false);
            return;
        }

        const currentSearchId = ++searchId.current;
        setIsLoading(true);

        let finalQuery = val.trim();
        let forceAUR = false;

        if (finalQuery.includes("--aur")) {
            finalQuery = finalQuery.replace("--aur", "").trim();
            forceAUR = true;
        }

        try {
            const searchPromises = [];

            if (isPacmanEnabled && !forceAUR) {
                searchPromises.push(window.api.pacman.search(finalQuery));
            } else {
                searchPromises.push(Promise.resolve({ results: [] }));
            }

            if (isAurEnabled || forceAUR) {
                searchPromises.push(window.api.aur.search(finalQuery));
            } else {
                searchPromises.push(Promise.resolve({ results: [] }));
            }

            const [pacmanRes, aurRes] = await Promise.all(searchPromises);

            // Eğer yeni bir arama başlatıldıysa bu sonuçları göz ardı et
            if (currentSearchId !== searchId.current) return;

            const merged = [
                ...(pacmanRes.results || []),
                ...(aurRes.results || [])
            ].map((pkg: any) => ({
                ...pkg,
                isDetailedLoading: true
            }));

            // Sıralama...
            merged.sort((a, b) => {
                const queryLower = finalQuery.toLowerCase().replace(/[-]/g, ' ');
                const aNameNormal = a.name.toLowerCase().replace(/[-]/g, ' ');
                const bNameNormal = b.name.toLowerCase().replace(/[-]/g, ' ');

                const aStart = aNameNormal.startsWith(queryLower);
                const bStart = bNameNormal.startsWith(queryLower);

                if (aStart && !bStart) return -1;
                if (!aStart && bStart) return 1;
                return a.name.length - b.name.length;
            });

            // İlk 50 sonucu al (Performans ve düzen için)
            const sliced = merged.slice(0, 50);

            setResults(sliced);
            setIsLoading(false);

            if (detailTimeout.current) clearTimeout(detailTimeout.current);
            detailTimeout.current = setTimeout(() => {
                if (currentSearchId === searchId.current) {
                    fetchDetailedInfo(sliced, currentSearchId);
                }
            }, 1000); // Gecikme biraz düşürüldü

        } catch (error) {
            console.error("Arama hatası:", error);
            if (currentSearchId === searchId.current) {
                setIsLoading(false);
            }
        }
    };

    const fetchDetailedInfo = async (currentResults: SearchResult[], currentSearchId: number) => {
        const pacmanNames = currentResults.filter(r => r.repo !== 'aur').map(r => r.name);
        const aurNames = currentResults.filter(r => r.repo === 'aur').map(r => r.name);

        try {
            const [pacmanDetails, aurDetails] = await Promise.all([
                pacmanNames.length > 0 ? window.api.pacman.getBatchInfo(pacmanNames) : { results: {} },
                aurNames.length > 0 ? window.api.aur.getBatchInfo(aurNames) : { results: {} }
            ]);

            if (currentSearchId !== searchId.current) return;

            setResults(prev => prev.map(pkg => {
                const pResults = (pacmanDetails.results || {}) as any;
                const aResults = (aurDetails.results || {}) as any;
                const details = pkg.repo === 'aur'
                    ? (aResults[pkg.name] || aResults[pkg.name.toLowerCase()])
                    : (pResults[pkg.name] || pResults[pkg.name.toLowerCase()]);

                if (details) {
                    return {
                        ...pkg,
                        download_size: details.download_size || details.downloadsize || "---",
                        installed_size: details.installed_size || details.installedsize || "---",
                        isInstalled: details.isInstalled || false,
                        icon: details.icon || null,
                        type: details.type || 'unknown',
                        isDetailedLoading: false
                    };
                }
                return { ...pkg, isDetailedLoading: false };
            }));
        } catch (error) {
            console.error("Detay alma hatası:", error);
        }
    };

    const handleAction = (pkg: SearchResult) => {
        onClose();
        if (pkg.isInstalled) {
            router.push(`/manager?select=${pkg.name}`);
        } else {
            router.push({
                pathname: '/terminal',
                query: { action: 'install', target: pkg.name, isAUR: pkg.repo === 'aur' }
            });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[45] flex flex-col items-center pointer-events-none pt-16 px-4">
                    {/* Arkaplan tıklama alanı */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-auto"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.98 }}
                        className="w-full max-w-6xl bg-black/50 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl relative z-10 overflow-hidden flex flex-col pointer-events-auto"
                        style={{ maxHeight: 'calc(100vh - 120px)' }}
                    >
                        {/* Sonuç Alanı */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-hidden">
                            {isLoading && results.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Activity size={40} />
                                    </motion.div>
                                    <p className="text-lg italic">{t("search.loading")}</p>
                                </div>
                            ) : results.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                                    {results.map((pkg, idx) => (
                                        <motion.div
                                            key={`${pkg.name}-${idx}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                                            className="group relative bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-blue-500/30 transition-all overflow-hidden flex flex-col h-full"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12  flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                    <PackageIcon
                                                        src={pkg.icon}
                                                        name={pkg.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h3 className="text-white font-bold truncate text-base">{pkg.name}</h3>
                                                        {!pkg.isDetailedLoading && (
                                                            <button
                                                                onClick={() => handleAction(pkg)}
                                                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all shadow-lg ${pkg.isInstalled ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/40" : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"}`}
                                                            >
                                                                {pkg.isInstalled ? t("action.manage") : t("action.install")}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${pkg.repo === 'aur'
                                                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                                            : pkg.repo === 'chaotic-aur'
                                                                ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                                                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                            }`}>
                                                            {pkg.repo}
                                                        </span>
                                                        <span className="text-gray-400 text-[10px] truncate">{pkg.version}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-gray-400 text-xs mt-3 line-clamp-2 h-8 italic opacity-80">
                                                {pkg.description || "---"}
                                            </p>

                                            <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                                                {pkg.isDetailedLoading ? (
                                                    <div className="animate-pulse bg-white/10 h-5 rounded w-16" />
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-1.5">
                                                            {pkg.download_size && pkg.download_size !== "---" && (
                                                                <span className="text-blue-400 font-mono text-[10px] bg-blue-400/5 px-1.5 py-0.5 rounded border border-blue-400/20 uppercase font-bold flex items-center gap-1">
                                                                    <Download size={10} /> {pkg.download_size}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            {pkg.installed_size && pkg.installed_size !== "---" && (
                                                                <span className="text-emerald-400 font-mono text-[10px] bg-emerald-400/5 px-1.5 py-0.5 rounded border border-emerald-400/20 uppercase font-bold flex items-center gap-1">
                                                                    <Package size={10} /> {pkg.installed_size}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
                                    <Info size={40} className="text-white/10" />
                                    <p className="text-lg italic">{t("search.noResults")}</p>
                                </div>
                            )}
                        </div>

                        {/* Alt Bilgi Barı */}
                        <div className="px-6 py-3 bg-white/5 border-t border-white/10 flex justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                            <div className="flex items-center gap-2">
                                <span>{results.length} {t("search.results_found")} {results.length === 50 && <span className="text-yellow-500/80 ml-2">({t("search.limit")})</span>} </span>
                            </div>
                            <div className="flex items-center gap-6">
                                <Toggle
                                    enabled={isPacmanEnabled}
                                    onChange={() => setIsPacmanEnabled(!isPacmanEnabled)}
                                    label={t("search.official")}
                                    activeColor="bg-blue-600"
                                />
                                <Toggle
                                    enabled={isAurEnabled}
                                    onChange={() => setIsAurEnabled(!isAurEnabled)}
                                    label={t("search.aur")}
                                    activeColor="bg-orange-600"
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SearchOverlay;
