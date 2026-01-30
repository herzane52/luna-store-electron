"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

const LanguageSelector: React.FC = () => {
    const { settings, updateSettings, availableLanguages } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentLanguage = availableLanguages.find(l => l.code === settings?.language) || availableLanguages[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleSelect = (code: string) => {
        updateSettings({ language: code });
        setIsOpen(false);
    };

    if (!currentLanguage) return null;

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Buton */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-3 bg-white/5  hover:bg-white/10 border border-white/10 rounded-xl transition-all w-full text-white"
            >
                <img
                    src={currentLanguage.flag?.startsWith('http') ? currentLanguage.flag : `https://flagcdn.com/${currentLanguage.flag || 'tr'}.svg`}
                    className="w-6 h-4 object-cover rounded-sm shadow-sm"
                />
                <span className="flex-1 text-left font-bold">{currentLanguage.nativeName}</span>
                <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Liste (Açılır Menü) */}
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-black backdrop-blur-3xl border border-white/10 rounded-xl shadow-2xl z-[9999] overflow-hidden">
                    <div className="max-h-60 overflow-y-auto scrollbar-hide">
                        {availableLanguages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleSelect(lang.code)}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left ${settings?.language === lang.code ? 'bg-blue-600/20' : ''}`}
                            >
                                <img
                                    src={lang.flag?.startsWith('http') ? lang.flag : `https://flagcdn.com/${lang.flag || 'gb'}.svg`}
                                    className="w-6 h-4 object-cover rounded-sm shadow-sm"
                                />
                                <div className="flex-1">
                                    <div className={`text-sm font-bold ${settings?.language === lang.code ? 'text-blue-400' : 'text-gray-200'}`}>
                                        {lang.nativeName}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{lang.name}</div>
                                </div>
                                {settings?.language === lang.code && <Check size={16} className="text-blue-400" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;
