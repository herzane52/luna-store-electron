"use client";

import { Cpu, Box, MousePointer2, CheckCircle, Shield, Palette } from "lucide-react";

import { useApp } from "../context/AppContext";

const AdvancedSettings = () => {
    const { settings, updateSettings, t, isLoading } = useApp();

    if (isLoading || !settings) return null;

    return (
        <div className="p-4 space-y-6 max-h-96 overflow-y-auto scrollbar">
            <h1 className="text-xl font-bold text-white mb-4">{t("advanced.title")}</h1>

            {/* Paket Yöneticisi */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-white">
                    <Box size={18} />
                    <h2 className="text-base font-semibold">{t("advanced.packageManager")}</h2>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {["yay", "paru"].map((pm) => (
                        <button
                            key={pm}
                            onClick={() => updateSettings({ preferredPackageManager: pm })}
                            className={`px-3 py-2 rounded-full transition-all text-xs font-bold uppercase ${settings.preferredPackageManager === pm
                                ? "bg-blue-500 text-white"
                                : "bg-white/10 text-gray-300 hover:bg-white/20"
                                }`}
                        >
                            {pm}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tehlikeli Alan */}
            <div className="space-y-3 pt-4 border-t border-red-500/20">
                <div className="flex items-center gap-2 text-red-400">
                    <Shield size={18} />
                    <h2 className="text-base font-semibold">{t("advanced.dangerousArea")}</h2>
                </div>
                <button
                    onClick={async () => {
                        if (confirm(t("advanced.clearCacheConfirm"))) {
                            const res = await window.api.settings.clearCache();
                            if (res.success) {
                                alert(t("advanced.clearCacheSuccess"));
                            } else {
                                alert(t("advanced.clearCacheError") + res.error);
                            }
                        }
                    }}
                    className="w-full p-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-bold transition-all mb-2"
                >
                    {t("advanced.clearCache")}
                </button>

                <button
                    onClick={async () => {
                        if (confirm(t("advanced.resetSetupConfirm") + "\n\n" + t("setup.restart_manual"))) {
                            await window.api.settings.resetSetup();
                            await window.api.relaunch();
                        }
                    }}
                    className="w-full p-3 rounded-full border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold transition-all"
                >
                    {t("advanced.resetSetup")}
                </button>
            </div>
        </div>
    );
};

// Internal Palette placeholder if not imported

export default AdvancedSettings;
