import React, { useState, useEffect } from "react";
import { CheckCircle, ChevronRight, Loader2, Info, Shield, Globe, Rocket, Layout as LayoutIcon, AlertTriangle, Github } from "lucide-react";
import { THEMES } from "../constants/themes";
import WindowTitleBar from "../components/WindowTitleBar";
import { useApp } from "../context/AppContext";
import LanguageSelector from "../components/LanguageSelector";

interface CheckItem {
    id: string;
    name: string;
    status: "pending" | "success" | "error";
    message?: string;
    link?: string;
}

export default function SetupPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const { settings: appSettings, updateSettings: updateAppSettings, t, showDevNote } = useApp();
    const [step, setStep] = useState(0);
    const [theme, setTheme] = useState<keyof typeof THEMES>("vscode");
    const [defaultPage, setDefaultPage] = useState<string>("manager");
    const [preferredHelper, setPreferredHelper] = useState<string>("pacman");
    const [checks, setChecks] = useState<CheckItem[]>([
        { id: "arch", name: "Arch Linux", status: "pending" },
        { id: "yay", name: "Yay (AUR)", status: "pending" },
        { id: "paru", name: "Paru (AUR)", status: "pending" },
    ]);

    useEffect(() => {
        if (step === 3) { // System Check step
            const runChecks = async () => {
                const settings = await window.api.settings.get();

                const isArch = settings.distro === 'arch';
                setChecks(prev => prev.map(c => c.id === "arch" ? { ...c, status: isArch ? "success" : "error", message: isArch ? t("setup.detected") : t("setup.not_found") } : c));

                const yayExists = settings.packageManagers?.yay;
                setChecks(prev => prev.map(c => c.id === "yay" ? { ...c, status: yayExists ? "success" : "error", message: yayExists ? t("setup.detected") : t("setup.not_found") } : c));

                const paruExists = settings.packageManagers?.paru;
                setChecks(prev => prev.map(c => c.id === "paru" ? { ...c, status: paruExists ? "success" : "error", message: paruExists ? t("setup.detected") : t("setup.not_found") } : c));

                const downgradeExists = (settings.packageManagers as any)?.downgrade;
                setChecks(prev => prev.map(c => c.id === "downgrade" ? { ...c, status: downgradeExists ? "success" : "error", message: downgradeExists ? t("setup.detected") : t("setup.not_found") } : c));

                // Varsayılan helper seçimi
                if (yayExists) setPreferredHelper("yay");
                else if (paruExists) setPreferredHelper("paru");
                else setPreferredHelper("pacman");
            };
            runChecks();
        }
    }, [step, appSettings?.language]);

    if (!mounted) return null;

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(Math.max(0, step - 1));

    const finishSetup = async () => {
        if (window.api && window.api.settings) {
            // AppContext'teki en güncel ayarları kullan
            await window.api.settings.save({
                ...appSettings,
                theme,
                defaultPage,
                preferredPackageManager: preferredHelper,
                setupComplete: true,
            });
            await window.api.relaunch();
        }
    };

    const hasMultipleHelpers = checks.filter(c => (c.id === 'yay' || c.id === 'paru') && c.status === 'success').length > 1;

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-transparent transition-colors duration-700">
            <div className={`w-full h-full ${THEMES[theme].class} flex flex-col items-center justify-center relative overflow-hidden select-none text-white font-sans rounded-xl shadow-2xl`}>
                <WindowTitleBar />
                <div className="absolute inset-0 z-0 pointer-events-none"></div>

                <div className="z-10 w-full px-10 flex flex-col items-center">
                    <div className="w-full max-w-4xl">
                        {/* STEP 0: LANGUAGE & DISCLAIMER */}
                        {step === 0 && (
                            <div className="space-y-8 text-center">
                                <div className="space-y-4 flex flex-col items-center">
                                    <div className="mb-6 w-full max-w-xs">
                                        <LanguageSelector />
                                    </div>
                                    <h1 className="text-4xl font-black">{t("setup.welcome")}</h1>
                                </div>

                                <button onClick={nextStep} className="px-10 py-3 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition active:scale-95 flex items-center gap-2 mx-auto mt-8">
                                    {t("setup.continue")} <ChevronRight size={20} />
                                </button>
                            </div>
                        )}

                        {/* STEP 1: THEME */}
                        {step === 1 && (
                            <div className="space-y-8 text-center w-full">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold">{t("setup.theme_title")}</h2>
                                    <p className="text-gray-400 text-sm">{t("setup.theme_desc")}</p>
                                </div>
                                <div className="grid grid-cols-3 gap-6 w-full">
                                    {Object.entries(THEMES).map(([key, val]) => (
                                        <button key={key} onClick={() => setTheme(key as any)} className={`relative h-32 rounded-2xl border-2 transition-all p-4 flex flex-col items-center justify-center gap-2 ${theme === key ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                                            <div className={`w-10 h-10 rounded-full ${val.color} border border-white/20`}></div>
                                            <span className="font-bold text-base">{t(`themes.${key}`)}</span>
                                            {theme === key && <CheckCircle size={18} className="text-blue-400" />}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-4 justify-center mt-6">
                                    <button onClick={prevStep} className="px-6 py-2 text-gray-400 hover:text-white transition">{t("common.back")}</button>
                                    <button onClick={nextStep} className="px-8 py-2 bg-white text-black rounded-full font-bold hover:scale-105 transition flex items-center gap-2">
                                        {t("setup.continue")} <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: START PAGE */}
                        {step === 2 && (
                            <div className="space-y-8 text-center w-full">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold">{t("setup.select_page")}</h2>
                                    <p className="text-gray-400 text-sm">{t("setup.page_desc")}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => setDefaultPage("manager")} className={`p-6 rounded-2xl border-2 transition flex flex-col items-center gap-4 ${defaultPage === "manager" ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                                        <LayoutIcon size={32} className={defaultPage === "manager" ? "text-blue-400" : "text-gray-400"} />
                                        <div className="text-center font-bold">{t("nav.manager")}</div>
                                    </button>
                                    <button onClick={() => setDefaultPage("update")} className={`p-6 rounded-2xl border-2 transition flex flex-col items-center gap-4 ${defaultPage === "update" ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                                        <Rocket size={32} className={defaultPage === "update" ? "text-blue-400" : "text-gray-400"} />
                                        <div className="text-center font-bold">{t("nav.update")}</div>
                                    </button>
                                </div>
                                <div className="flex gap-4 justify-center mt-6">
                                    <button onClick={prevStep} className="px-6 py-2 text-gray-400 hover:text-white transition">{t("common.back")}</button>
                                    <button onClick={nextStep} className="px-8 py-2 bg-white text-black rounded-full font-bold hover:scale-105 transition flex items-center gap-2">
                                        {t("setup.continue")} <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: SYSTEM CHECKS */}
                        {step === 3 && (
                            <div className="space-y-6 w-full">
                                <div className="grid grid-cols-1 gap-3">
                                    {checks.filter(c => c.id === 'arch').map(check => (
                                        <div key={check.id} className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5 group">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${check.status === 'success' ? 'bg-green-500/20 text-green-400' : check.status === 'error' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    <Shield size={24} />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-bold text-lg tracking-tight text-center">{check.name}</div>
                                                    <div className="text-sm text-gray-400 text-center">{check.status === 'error' ? t("setup.arch_error") : check.message || t("setup.checking")}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {check.status === 'pending' ? <Loader2 size={24} className="animate-spin text-blue-400" /> : check.status === 'success' ? <CheckCircle size={24} className="text-green-400" /> : <AlertTriangle size={24} className="text-yellow-500" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {hasMultipleHelpers && (
                                    <div className="mt-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                                        <div className="text-xs font-bold text-blue-400 mb-3 flex items-center gap-2">
                                            <Shield size={14} /> {t("setup.select_helper")}
                                        </div>
                                        <div className="flex gap-2">
                                            {['yay', 'paru'].map(h => {
                                                const exists = checks.find(c => c.id === h)?.status === 'success';
                                                if (!exists) return null;
                                                return (
                                                    <button key={h} onClick={() => setPreferredHelper(h)} className={`flex-1 py-1.5 rounded-xl border transition-all font-bold text-xs ${preferredHelper === h ? 'bg-blue-600/30 border-blue-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                                                        {h.toUpperCase()}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 justify-center mt-6">
                                    <button onClick={prevStep} className="px-6 py-2 text-gray-400 hover:text-white transition">{t("common.back")}</button>
                                    <button onClick={nextStep} className="px-8 py-2 bg-white text-black rounded-full font-bold hover:scale-105 transition flex items-center gap-2">
                                        {t("setup.continue")} <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: FINISH */}
                        {step === 4 && (
                            <div className="space-y-8 text-center">
                                <div className="w-20 h-20 bg-white/5 border border-white/5 rounded-full mx-auto flex items-center justify-center">
                                    <CheckCircle size={40} className="text-green-400" />
                                </div>
                                <div className="space-y-3">
                                    <h2 className="text-3xl font-black">{t("setup.finish")}</h2>
                                    <p className="text-gray-400 leading-relaxed text-sm">{t("setup.finish_desc")}</p>
                                    <p className="text-blue-400 font-bold text-sm animate-pulse">{t("setup.restart_manual")}</p>
                                </div>
                                <button onClick={finishSetup} className="w-full py-4 bg-white text-black rounded-2xl font-black text-xl shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:scale-105 transition active:scale-95 flex items-center justify-center gap-3">
                                    {t("setup.close_and_exit")} <Rocket size={24} />
                                </button>
                            </div>
                        )}
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
