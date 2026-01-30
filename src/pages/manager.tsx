import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Package, Loader2, RefreshCw, Info, Search, X, Download, Trash2, ArrowDownCircle, Lock, AlertTriangle, ExternalLink, Shield, Settings } from 'lucide-react';
import { useRouter } from 'next/router';
import PackageIcon from "../components/PackageIcon";
import { useApp } from '../context/AppContext';

interface PackageItem {
  name: string;
  version: string;
  repo?: string;
  description?: string;
  type?: string;
  installedSize?: string;
}

const ManagerPage: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    t,
    packages, ignoredPackages, orphans, icons, isDataLoading,
    refreshPackages
  } = useApp();
  const router = useRouter();

  const [uiState, setUiState] = useState<{
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
    searchTerm: string;
    filterType: 'all' | 'explicit' | 'implicit' | 'orphans';

    selectedPackage: PackageItem | null;
    leftPanelWidth: number;
    detailsPanelWidth: number;
    isResizing: boolean;
    isTogglingIgnore: boolean;
    showAdvancedRemove: boolean;
  }>({

    isLoading: false,
    isRefreshing: false,
    error: null,
    searchTerm: '',
    filterType: 'explicit',
    selectedPackage: null,
    leftPanelWidth: 450,
    detailsPanelWidth: 0,
    isResizing: false,
    isTogglingIgnore: false,
    showAdvancedRemove: false,
  });

  const [details, setDetails] = useState<{
    info: Record<string, string> | null;
    isLoading: boolean;
    launchable: boolean;
    operationStatus: { type: string, message: string } | null;
  }>({ info: null, isLoading: false, launchable: false, operationStatus: null });

  const detailsPanelRef = useRef<HTMLDivElement>(null);

  // -- Data Fetching (Replaced by Context) --

  const handleRefresh = async () => {
    setUiState(prev => ({ ...prev, isRefreshing: true }));
    await refreshPackages(true);
    setUiState(prev => ({ ...prev, isRefreshing: false }));
  };

  const handlePackageSelect = async (pkg: PackageItem) => {
    setUiState(prev => ({ ...prev, selectedPackage: pkg }));
    setDetails({ info: null, isLoading: true, launchable: false, operationStatus: null });

    try {
      const [launchRes, infoRes] = await Promise.all([
        window.api.pacman.checkDesktopFile(pkg.name),
        (async () => {
          let res = await window.api.aur.getInfo(pkg.name);
          if (res.error) res = await window.api.pacman.getPackageInfo(pkg.name);
          return res;
        })()
      ]);

      setDetails(prev => ({
        ...prev,
        isLoading: false,
        launchable: !!launchRes.launchable,
        info: infoRes.info || { Hata: infoRes.error || t('manager.no_info') }
      }));

    } catch (e) {
      setDetails(prev => ({ ...prev, isLoading: false, info: { Hata: t('manager.error_occurred') } }));
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    const { select } = router.query;
    if (select && typeof select === 'string') {
      const pkg = packages.find(p => p.name === select);
      if (pkg) {
        handlePackageSelect(pkg);
        router.replace('/manager', undefined, { shallow: true });
      }
    }
  }, [router.isReady, router.query.select, packages]);


  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (uiState.isResizing) {
        const newWidth = Math.min(Math.max(e.clientX - 20, 300), 800);
        setUiState(prev => ({ ...prev, leftPanelWidth: newWidth }));
      }
    };
    const handleUp = () => setUiState(prev => ({ ...prev, isResizing: false }));

    if (uiState.isResizing) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [uiState.isResizing]);

  useEffect(() => {
    if (!detailsPanelRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setUiState(prev => ({ ...prev, detailsPanelWidth: entry.contentRect.width }));
      }
    });
    observer.observe(detailsPanelRef.current);
    return () => observer.disconnect();
  }, []);

  const handleOperation = (action: 'install' | 'remove' | 'downgrade' | 'remove-params', target: string, params?: string) => {
    router.push({ pathname: '/terminal', query: { action, target, params } });
  };

  const toggleIgnore = async () => {
    if (!uiState.selectedPackage || uiState.isTogglingIgnore) return;
    const pkgName = uiState.selectedPackage.name;
    const isIgnored = ignoredPackages.includes(pkgName);

    setUiState(prev => ({ ...prev, isTogglingIgnore: true }));
    try {
      const res = await window.api.pacman.toggleIgnore(pkgName, !isIgnored);
      if (res.error) {
        setUiState(prev => ({ ...prev, error: (res.error as string) || t('manager.error_occurred') }));
      } else {
        await refreshPackages();
      }
    } catch (e: any) {
      setUiState(prev => ({ ...prev, error: e.message || t('manager.error_occurred') }));
    } finally {
      setUiState(prev => ({ ...prev, isTogglingIgnore: false }));
    }
  };

  const filteredData = useMemo(() => {
    let list = [...packages];
    if (uiState.searchTerm) {
      const lower = uiState.searchTerm.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(lower));
    }

    const filtered = (uiState.filterType === 'explicit')
      ? list.filter(p => p.type === 'explicit')
      : (uiState.filterType === 'implicit')
        ? list.filter(p => p.type !== 'explicit')
        : (uiState.filterType === 'orphans')
          ? list.filter(p => orphans.includes(p.name))
          : list;

    // SIRALAMA: 
    // 1. Önce Uygulamalar (explicit) sonra Bağımlılıklar (implicit)
    // 2. Her grup içinde; ikonu olanlar başta
    return filtered.sort((a, b) => {
      // 1. Explicit önceliği (Eğer tümü seçiliyse)
      if (uiState.filterType === 'all') {
        const aExp = a.type === 'explicit' ? 1 : 0;
        const bExp = b.type === 'explicit' ? 1 : 0;
        if (aExp !== bExp) return bExp - aExp;
      }

      // 2. İkon önceliği
      const aIcon = icons[a.name] ? 1 : 0;
      const bIcon = icons[b.name] ? 1 : 0;
      if (aIcon !== bIcon) return bIcon - aIcon;

      // 3. Alfabetik
      return a.name.localeCompare(b.name);
    });
  }, [packages, icons, uiState.searchTerm, uiState.filterType, orphans]);


  const explicitCount = useMemo(() => packages.filter(p => p.type === 'explicit').length, [packages]);
  const implicitCount = useMemo(() => packages.filter(p => p.type !== 'explicit').length, [packages]);

  const translateKey = (key: string) => t(`manager.details.${key.toLowerCase()}`);

  const getGridCols = () => {
    if (uiState.detailsPanelWidth < 600) return 'grid-cols-1';
    if (uiState.detailsPanelWidth < 900) return 'grid-cols-2';
    return 'grid-cols-3';
  };

  if (!mounted) return null;

  return (
    <div className="h-full flex flex-col overflow-hidden" onMouseUp={() => setUiState(prev => ({ ...prev, isResizing: false }))}>
      <div className="h-full flex flex-1 px-4 overflow-hidden relative">

        <div style={{ width: uiState.leftPanelWidth, minWidth: 300, maxWidth: 800 }} className="flex flex-col h-full overflow-hidden">
          {uiState.error && (
            <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 mb-4 shrink-0">
              {uiState.error}
            </div>
          )}

          <div className="flex gap-2 mb-4 shrink-0">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={t('manager.search')}
                value={uiState.searchTerm}
                onChange={(e) => setUiState(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="w-full p-3 pl-10 pr-10 bg-white/10 border border-white/20 rounded-full"
              />
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              {uiState.searchTerm && (
                <X size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer hover:text-white" onClick={() => setUiState(prev => ({ ...prev, searchTerm: '' }))} />
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={uiState.isRefreshing || uiState.isLoading}
              className={`p-4 bg-white/10 border border-white/20 rounded-full text-gray-400 hover:text-white hover:bg-white/20 transition-all ${uiState.isRefreshing ? 'opacity-50 cursor-wait' : ''}`}
            >
              <RefreshCw size={20} className={uiState.isRefreshing ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="flex justify-center space-x-2 mb-4 shrink-0">
            {/*<button onClick={() => setUiState(prev => ({ ...prev, filterType: 'all' }))} className={`px-3 py-1 rounded-full text-sm ${uiState.filterType === 'all' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>{t('manager.filter_all')} ({packages.length})</button>*/}
            <button onClick={() => setUiState(prev => ({ ...prev, filterType: 'explicit' }))} className={`px-3 py-1 rounded-full text-sm ${uiState.filterType === 'explicit' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>{t('manager.filter_explicit')} ({explicitCount})</button>
            <button onClick={() => setUiState(prev => ({ ...prev, filterType: 'implicit' }))} className={`px-3 py-1 rounded-full text-sm ${uiState.filterType === 'implicit' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>{t('manager.filter_implicit')} ({implicitCount})</button>
            <button onClick={() => setUiState(prev => ({ ...prev, filterType: 'orphans' }))} className={`px-3 py-1 rounded-full text-sm ${uiState.filterType === 'orphans' ? 'bg-orange-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>{t('manager.filter_orphans')} ({orphans.length})</button>
          </div>



          <div className="overflow-y-auto flex-1 scrollbar pb-20" dir="rtl">
            <div dir="ltr">
              {isDataLoading && packages.length === 0 && <div className="text-center py-10 text-gray-400 flex flex-col items-center"><Loader2 size={32} className="animate-spin mb-3" />{t('manager.loading_packages')}</div>}
              <div className={`grid gap-2 ${uiState.leftPanelWidth > 600 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {filteredData.map((pkg) => {
                  const isSelected = uiState.selectedPackage?.name === pkg.name;
                  const isIgnored = ignoredPackages.includes(pkg.name);
                  const iconUrl = icons[pkg.name];

                  const isChaotic = pkg.repo === 'chaotic-aur';
                  const isAUR = pkg.repo === 'aur' || pkg.repo?.includes('aur');

                  const getRepoBadgeColor = () => {
                    if (isChaotic) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
                    if (isAUR) return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
                    return 'text-gray-500 bg-white/5 border-white/10';
                  };

                  const repoBadgeClasses = getRepoBadgeColor();

                  return (
                    <div
                      key={pkg.name}
                      onClick={() => handlePackageSelect(pkg)}
                      className={`p-3 rounded-lg flex items-center cursor-pointer transition ${isSelected ? 'bg-blue-600/20 border border-blue-500/50' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
                    >
                      <div className="flex-shrink-0 mr-4 flex items-center justify-center w-8 h-8">
                        <PackageIcon
                          src={iconUrl}
                          name={pkg.name}
                          type={pkg.type}
                          className="w-full h-full object-contain rounded"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <p className="font-medium text-white truncate text-lg">{pkg.name}</p>
                        </div>
                        <p className="text-xs text-gray-400 truncate">v{pkg.version}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        {pkg.repo && (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter ${repoBadgeClasses}`}>{pkg.repo}</span>
                        )}
                        {pkg.installedSize && (
                          <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">{pkg.installedSize}</span>
                        )}
                        {isIgnored && <Lock size={14} className="text-yellow-400 opacity-80" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div
          className="w-4 hover:w-8 flex items-center justify-center cursor-col-resize z-20 group -ml-2 transition-all duration-300"
          onMouseDown={(e) => { e.preventDefault(); setUiState(prev => ({ ...prev, isResizing: true })); }}
        >
          <div className={`w-1 h-64 rounded-full bg-transparent group-hover:bg-blue-500/80 ${uiState.isResizing ? '!bg-blue-500' : ''}`}></div>
        </div>

        <div ref={detailsPanelRef} className="pt-5 px-5 pb-5 flex-1 h-full overflow-hidden bg-white/5 rounded-lg flex flex-col min-w-0">
          {uiState.selectedPackage ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-4 mb-4 border-b border-white/10 pb-4 shrink-0">
                <div className="w-16 h-16 rounded-xl bg-white/5 overflow-hidden flex items-center justify-center">
                  <PackageIcon
                    src={icons[uiState.selectedPackage.name]}
                    name={uiState.selectedPackage.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-white capitalize truncate">{uiState.selectedPackage.name.replace(/[-]/g, ' ')}</h3>
                    {uiState.selectedPackage.repo && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${uiState.selectedPackage.repo === 'chaotic-aur'
                        ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                        : (uiState.selectedPackage.repo === 'aur' || uiState.selectedPackage.repo?.includes('aur'))
                          ? 'text-orange-400 bg-orange-400/10 border-orange-400/20'
                          : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                        }`}>{uiState.selectedPackage.repo}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-gray-400 text-sm font-medium">v{uiState.selectedPackage.version}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {details.launchable && (
                    <button onClick={() => window.api.pacman.launchApp(uiState.selectedPackage!.name)} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded shadow-lg flex items-center justify-center gap-2"><ExternalLink size={16} /> {t('manager.launch')}</button>
                  )}
                  <button onClick={() => handleOperation('remove', uiState.selectedPackage!.name)} className="px-5 py-2 bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-400 text-sm font-medium rounded transition border border-white/10 flex items-center justify-center gap-2"><Trash2 size={16} /> {t('manager.remove')}</button>
                </div>
              </div>

              <div className="bg-black/20 rounded-xl p-4 flex-1 overflow-y-auto scrollbar">
                {details.isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500"><Loader2 size={32} className="animate-spin mb-3 opacity-50" /><p>{t('manager.fetching_info')}</p></div>
                ) : details.info ? (
                  <div className={`grid ${getGridCols()} gap-6`}>
                    {Object.entries(details.info).map(([key, value]) => {
                      if (key === 'iconUrl' || key === 'description') return null;
                      if (!value || value === 'Hiçbiri' || value === 'None') return null;

                      const valStr = String(value);
                      const isMultiLine = valStr.includes('\n') || valStr.length > 60;

                      return (
                        <div key={key} className={`flex flex-col gap-1 overflow-hidden ${isMultiLine ? 'col-span-full' : ''}`}>
                          <span className="text-xs font-semibold text-blue-400/80 uppercase tracking-wider truncate">{translateKey(key)}</span>
                          <span className={`text-sm text-gray-300 break-words leading-relaxed select-text ${isMultiLine ? 'whitespace-pre-wrap bg-white/5 p-3 rounded-lg border border-white/5' : ''}`}>
                            {valStr}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : <div className="text-center text-gray-500">{t('manager.no_info')}</div>}
              </div>
            </div>
          ) : <div className="flex flex-col items-center justify-center h-full text-gray-400"><Info size={48} className="mb-4 opacity-50" /><p>{t('manager.select_package')}</p></div>}
        </div>
      </div>
    </div>
  );
};

export default ManagerPage;