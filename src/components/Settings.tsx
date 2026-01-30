"use client";

import React from "react";
import { Palette, Home, Globe } from "lucide-react";
import { THEMES } from "../constants/themes";
import { useApp } from "../context/AppContext";
import LanguageSelector from "./LanguageSelector";

const themeClasses = Object.fromEntries(
  Object.entries(THEMES).map(([key, value]) => [key, value.class])
);

const Settings = () => {
  const { settings, updateSettings, t, isLoading } = useApp();

  if (isLoading || !settings) return null;

  return (
    <div className="p-4 space-y-6 max-h-96 overflow-y-auto scrollbar">
      <h1 className="text-xl font-bold text-white mb-4">{t("settings.title")}</h1>

      {/* Dil Seçimi */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-white">
          <Globe size={18} />
          <h2 className="text-base font-semibold">{t("settings.language")}</h2>
        </div>
        <div className="grid gap-2">
          <LanguageSelector />
        </div>
      </div>


      {/* Tema Seçimi */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-white">
          <Palette size={18} />
          <h2 className="text-base font-semibold">{t("settings.theme")}</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(themeClasses).map((color) => (
            <button
              key={color}
              onClick={() => updateSettings({ theme: color })}
              className={`h-12 rounded-full transition-all border-2 flex items-center justify-center ${settings.theme === color ? "border-blue-500/50 scale-95" : "border-transparent hover:scale-105"
                } ${themeClasses[color]} cursor-pointer`}
              title={t(`themes.${color}`)}
            >
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-tighter">{t(`themes.${color}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Başlangıç Sayfası Seçimi */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-white">
          <Home size={18} />
          <h2 className="text-base font-semibold">{t("settings.defaultPage")}</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "update", label: t("settings.updates") },
            { key: "manager", label: t("settings.manager") },
          ].map((page) => (
            <button
              key={page.key}
              onClick={() => updateSettings({ defaultPage: page.key })}
              className={`px-3 py-2 rounded-full transition-all text-sm ${settings.defaultPage === page.key
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
            >
              {page.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;