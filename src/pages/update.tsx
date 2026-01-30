"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { RefreshCw, UploadCloud, CheckCircle, ArrowRight, Search, X, CheckSquare, Square, WifiOff } from 'lucide-react';
import PackageIcon from '../components/PackageIcon';
import { useApp } from '../context/AppContext';

interface UpdateItem {
    name: string;
    currentVersion: string;
    newVersion: string;
    repo?: string;
    type?: 'explicit' | 'dependency';
    description?: string;
    downloadSize?: string;
}

const UpdatePage: React.FC = () => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const {
        settings, t,
        updates, icons, isDataLoading,
        refreshUpdates
    } = useApp();
    const router = useRouter();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'explicit' | 'dependency'>('all');
    const [colCount, setColCount] = useState(3);
    const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const handleConnectionChange = () => setIsOffline(!navigator.onLine);
        window.addEventListener('online', handleConnectionChange);
        window.addEventListener('offline', handleConnectionChange);
        setIsOffline(!navigator.onLine);

        return () => {
            window.removeEventListener('online', handleConnectionChange);
            window.removeEventListener('offline', handleConnectionChange);
        };
    }, []);

    const handleFullRefresh = async () => {
        await refreshUpdates(true);
    };

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 640) setColCount(1);
            else if (width < 1024) setColCount(2);
            else if (width < 1440) setColCount(3);
            else if (width < 1920) setColCount(4);
            else setColCount(5);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleUpdateSystem = async () => {
        router.push({ pathname: '/terminal', query: { action: 'updateSystem' } });
    };

    const handleUpdateSelected = async () => {
        if (selectedPackages.length === 0) return;
        const selectedObjects = updates.filter(u => selectedPackages.includes(u.name));
        const hasAUR = selectedObjects.some(u => u.repo === 'aur');
        router.push({
            pathname: '/terminal',
            query: { action: 'install', target: selectedPackages.join(' '), isAUR: hasAUR ? 'true' : 'false' }
        });
    };

    const sortedUpdates = useMemo(() => {
        const filtered = updates.filter(pkg => {
            const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterType === 'all' || pkg.type === filterType;
            return matchesSearch && matchesFilter;
        });

        return [...filtered].sort((a, b) => {
            const iconA = icons[a.name];
            const iconB = icons[b.name];
            if (iconA && !iconB) return -1;
            if (!iconA && iconB) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [updates, searchTerm, filterType, icons]);

    const explicitUpdates = useMemo(() => sortedUpdates.filter(u => u.type === 'explicit'), [sortedUpdates]);
    const dependencyUpdates = useMemo(() => sortedUpdates.filter(u => u.type !== 'explicit'), [sortedUpdates]);

    const renderPackageCard = (pkg: UpdateItem) => {
        const isSelected = selectedPackages.includes(pkg.name);
        const icon = icons[pkg.name];
        const isChaotic = pkg.repo === 'chaotic-aur';
        const isAUR = pkg.repo === 'aur' || pkg.repo?.includes('aur');
        const badgeClasses = isChaotic ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' : (isAUR ? 'text-orange-400 bg-orange-400/10 border-orange-400/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/10');

        return (
            <div
                key={pkg.name}
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPackages(prev => prev.includes(pkg.name) ? prev.filter(n => n !== pkg.name) : [...prev, pkg.name]);
                }}
                className={`group relative p-4 rounded-sm transition-all duration-300 border flex flex-col gap-4 cursor-pointer select-none h-full ${isSelected
                    ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)] scale-[0.98]'
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
            >
                <div className="absolute top-3 right-3 z-10">
                    {isSelected
                        ? <CheckSquare size={18} className="text-blue-500 fill-blue-500/10" />
                        : <Square size={18} className="text-gray-400 group-hover:text-gray-100" />
                    }
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center overflow-hidden">
                        <PackageIcon src={icon} name={pkg.name} type={pkg.type} className="w-10 h-10 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate text-base">{pkg.name}</p>
                        {pkg.description && <p className="text-xs text-gray-400 truncate mt-0.5">{pkg.description}</p>}
                    </div>
                </div>

                <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="text-white/40 line-through truncate max-w-[60px] font-mono">{pkg.currentVersion}</span>
                            <ArrowRight size={10} className="text-gray-600 flex-shrink-0" />
                            <span className={`${badgeClasses} font-bold px-1.5 py-0.5 rounded border font-mono truncate max-w-[60px]`}>{pkg.newVersion}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {pkg.repo && <span className={`${badgeClasses} font-mono px-1.5 py-0.5 rounded border text-[10px] uppercase font-bold`}>{pkg.repo}</span>}
                        {pkg.downloadSize && <span className={`${badgeClasses} font-mono px-1.5 py-0.5 rounded border`}>{pkg.downloadSize}</span>}
                    </div>
                </div>
            </div>
        );
    };

    const explicitCount = updates.filter(p => p.type === 'explicit').length;
    const dependencyCount = updates.filter(p => p.type !== 'explicit').length;

    if (!mounted) return null;

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {isOffline && (
                <div className=" absolute inset-0 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500">
                    <div className="bg-blue-500 border border-white/10 p-12 rounded-[40px] flex flex-col items-center gap-8 max-w-md text-center shadow-2xl">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-400/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                            <div className="relative w-24 h-24 bg-blue-400/10 border border-blue-400/30 rounded-3xl flex items-center justify-center text-white">
                                <WifiOff size={48} strokeWidth={1.5} />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-white">{t("updates.offline_title")}</h2>
                        <button onClick={() => refreshUpdates(false)} className="px-10 py-4 bg-white text-blue-600 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl">{t("updates.retry")}</button>
                    </div>
                </div>
            )}

            <div className="px-8 pt-8 pb-4 flex flex-col gap-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder={t("updates.search_placeholder")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 pl-10 pr-10 bg-white/10 border border-white/20 rounded-full text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                        />
                        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                        {searchTerm && (
                            <X size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer hover:text-white" onClick={() => setSearchTerm('')} />
                        )}
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-full border border-white/10 shrink-0">
                        <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${filterType === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>{t("updates.filter_all")} ({updates.length})</button>
                        <button onClick={() => setFilterType('explicit')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${filterType === 'explicit' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>{t("updates.filter_explicit")} ({explicitCount})</button>
                        <button onClick={() => setFilterType('dependency')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${filterType === 'dependency' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>{t("updates.filter_dependency")} ({dependencyCount})</button>
                    </div>

                    <button
                        onClick={handleFullRefresh}
                        disabled={isDataLoading}
                        className={`p-3 bg-white/10 border border-white/20 rounded-full text-gray-400 hover:text-white hover:bg-white/20 transition-all active:scale-95 shrink-0 ${isDataLoading ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        <RefreshCw size={20} className={isDataLoading ? "animate-spin" : ""} />
                    </button>

                    <button
                        onClick={handleUpdateSystem}
                        disabled={isDataLoading || updates.length === 0}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2 border border-blue-400/30 shrink-0"
                    >
                        <UploadCloud size={18} />
                        {t("updates.update_all")}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-32 scrollbar-hidden">
                {(!isDataLoading && updates.length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center mb-6 border border-white/10"><CheckCircle size={48} className="text-green-500 opacity-50" /></div>
                        <h3 className="text-2xl font-bold text-white mb-2">{t("updates.no_updates")}</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">{t("updates.no_updates_desc")}</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-10">
                        {(filterType === 'all' || filterType === 'explicit') && explicitUpdates.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-px flex-1 bg-white/5"></div>
                                    <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">{t("updates.filter_explicit")}</h2>
                                    <div className="h-px flex-1 bg-white/5"></div>
                                </div>
                                <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}>
                                    {explicitUpdates.map(renderPackageCard)}
                                </div>
                            </div>
                        )}
                        {(filterType === 'all' || filterType === 'dependency') && dependencyUpdates.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-px flex-1 bg-white/5"></div>
                                    <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">{t("updates.filter_dependency")}</h2>
                                    <div className="h-px flex-1 bg-white/5"></div>
                                </div>
                                <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}>
                                    {dependencyUpdates.map(renderPackageCard)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selectedPackages.length > 0 && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="bg-white/10 border border-white/10 shadow-full rounded-full p-2 flex items-center gap-4 backdrop-blur-xl px-6 py-3">
                        <div className="flex flex-col text-center">
                            <span className="text-blue-400 font-black text-lg leading-none">{selectedPackages.length}</span>
                            <span className="text-blue-400 font-black text-lg leading-none">{t("updates.selected_count")}</span>
                        </div>
                        <div className="h-8 w-px bg-white/10"></div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleUpdateSelected} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-full font-bold transition-all shadow-xl shadow-blue-500/20 active:scale-95">{t("updates.update_selected")}</button>
                            <button onClick={() => setSelectedPackages([])} className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-4 py-2.5 rounded-full font-bold transition-all border border-white/5 active:scale-95 text-xs truncate max-w-[140px]">{t("updates.deselect_all")}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UpdatePage;
