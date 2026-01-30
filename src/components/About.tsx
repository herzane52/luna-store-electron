"use client";

import { useState, useEffect } from "react";
import { Info, Loader2, Github, Globe } from "lucide-react";

import { useApp } from "../context/AppContext";

const About = () => {
  const { settings, t, isLoading } = useApp();
  const [githubData, setGithubData] = useState<any>(null);
  const [isGithubLoading, setIsGithubLoading] = useState(true);

  if (isLoading || !settings) return null;

  useEffect(() => {
    const fetchGithub = async () => {
      try {
        const res = await fetch("https://api.github.com/users/herzane52");
        const data = await res.json();
        setGithubData(data);
      } catch (e) {
        console.error("Github fetch error:", e);
      } finally {
        setIsGithubLoading(false);
      }
    };
    fetchGithub();
  }, []);

  return (
    <div className="p-4 space-y-4 max-h-96 overflow-y-auto scrollbar">
      <div className="flex items-center gap-2 text-white mb-4">
        <Info size={20} />
        <h1 className="text-xl font-bold">{t("about.title")}</h1>
      </div>

      {/* Geliştirici Kartı (GitHub) */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/10 relative overflow-hidden group">
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative">
            {isGithubLoading ? (
              <div className="w-16 h-16 bg-white/10 rounded-full animate-pulse flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-gray-400" />
              </div>
            ) : (
              <img
                src={githubData?.avatar_url || "luna.svg"}
                alt="Developer"
                className="w-16 h-16 rounded-full border-2 border-white/20 shadow-xl"
              />
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-black rounded-full" title="Online"></div>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-lg truncate">
              {isGithubLoading ? "..." : (githubData?.name || "herzane52")}
            </h2>
            <p className="text-blue-400 text-xs font-medium mb-2">@{githubData?.login || "herzane52"}</p>

          </div>

          {/* Bağlantılar */}
          <div className="grid grid-cols-1 gap-2 pt-2">
            <button
              onClick={() => window.open(githubData?.html_url || "https://github.com/herzane52/luna-store-electron", "_blank")}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-full transition-all text-xs font-bold border border-white/5"
            >
              <Github size={14} />
              {t("about.sourceCode")}
            </button>
            <button
              onClick={() => window.open("https://luna.herzane.tr", "_blank")}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-full transition-all text-xs font-bold border border-white/5"
            >
              <Globe size={14} />
              {t("about.website")}
            </button>
          </div>
        </div>
      </div>


    </div>
  );
};

export default About;