"use client";

import React from "react";
import { Minus, Square, X as CloseIcon } from "lucide-react";
import { useApp } from "../context/AppContext";

interface WindowTitleBarProps {
    title?: string;
    showLogo?: boolean;
}

const WindowTitleBar: React.FC<WindowTitleBarProps> = ({ title = "LUNA STORE", showLogo = true }) => {
    const { t } = useApp();

    const handleMinimize = () => {
        if (typeof window !== 'undefined' && window.api) {
            window.api.window.minimize();
        }
    };

    const handleMaximize = () => {
        if (typeof window !== 'undefined' && window.api) {
            window.api.window.maximize();
        }
    };

    const handleClose = () => {
        if (typeof window !== 'undefined' && window.api) {
            window.api.window.close();
        }
    };

    return (
        <header
            className="absolute top-0 left-0 right-0 z-[100] pl-4 pr-4 py-3 flex items-center select-none"
            style={{ WebkitAppRegion: 'drag' } as any}
        >
            {/* Logo ve Başlık */}
            <div className="relative flex items-center gap-2 overflow-hidden flex-shrink-0">
                {showLogo && (
                    <div className="w-8 h-8 relative">
                        <img
                            src="luna.svg"
                            alt="Luna Logo"
                            className="w-full h-full"
                        />
                    </div>
                )}
                <span className="text-white font-black text-sm tracking-[0.2em] drop-shadow-md uppercase opacity-80">
                    {title}
                </span>
            </div>

            <div className="flex-1"></div>

            {/* Kontrol Butonları */}
            <div className="flex items-center gap-1 flex-shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <button
                    onClick={handleMinimize}
                    className="w-8 h-8 rounded-lg hover:bg-white/10 transition flex items-center justify-center cursor-pointer"
                    title={t("window.minimize")}
                >
                    <Minus size={14} strokeWidth={2.5} className="text-white/70" />
                </button>
                <button
                    onClick={handleMaximize}
                    className="w-8 h-8 rounded-lg hover:bg-white/10 transition flex items-center justify-center cursor-pointer"
                    title={t("window.maximize")}
                >
                    <Square size={12} strokeWidth={2.5} className="text-white/70" />
                </button>
                <button
                    onClick={handleClose}
                    className="w-8 h-8 rounded-lg hover:bg-red-500/80 transition flex items-center justify-center cursor-pointer group"
                    title={t("window.close")}
                >
                    <CloseIcon size={14} strokeWidth={2.5} className="text-white/70 group-hover:text-white" />
                </button>
            </div>
        </header>
    );
};

export default WindowTitleBar;
