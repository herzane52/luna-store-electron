"use client";

import { useEffect, useRef, useState } from "react";
import type { Terminal as XTermType } from "xterm";
import type { FitAddon as FitAddonType } from "xterm-addon-fit";
import { useRouter } from "next/router";
import "xterm/css/xterm.css";

const TerminalPage = () => {
    const [mounted, setMounted] = useState(false);
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTermType | null>(null);
    const fitAddonRef = useRef<FitAddonType | null>(null);
    const [isTerminalReady, setIsTerminalReady] = useState(false);
    const router = useRouter();
    const processedRef = useRef("");

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Sayfa navigasyonu tespiti (Tab değiştiğinde veya sayfa açıldığında odakla)
    useEffect(() => {
        if (router.pathname === "/terminal" && xtermRef.current) {
            const timer = setTimeout(() => {
                xtermRef.current?.focus();
                if (fitAddonRef.current) {
                    try { fitAddonRef.current.fit(); } catch (e) { }
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [router.pathname, isTerminalReady]);

    // Otomatik komut çalıştırma (Router query bazlı)
    useEffect(() => {
        if (!router.isReady || !isTerminalReady) return;

        const { action, target, path, params } = router.query;
        if (!action) {
            processedRef.current = "";
            return;
        }

        const operationKey = `${action}-${target}-${path}`;
        if (processedRef.current === operationKey) return;

        processedRef.current = operationKey;

        const execute = async () => {
            // Otomatik komut 
            await new Promise(resolve => setTimeout(resolve, 800));

            try {
                if (typeof target === 'string') {
                    if (action === 'install') {
                        router.query.isAUR === 'true'
                            ? await window.api.aur.install(target, { inTerminal: true })
                            : await window.api.pacman.install(target, { inTerminal: true });
                    } else if (action === 'remove' || action === 'remove-params') {
                        const p = Array.isArray(params) ? params[0] : params;
                        await window.api.pacman.remove(target, { params: p || '-R', inTerminal: true } as any);
                    }
                } else if (action === 'updateSystem') {
                    await window.api.pacman.updateSystem({ inTerminal: true });
                }
            } catch (e) {
                console.error("[Terminal] Otomatik komut hatası:", e);
            }
            router.replace('/terminal', undefined, { shallow: true });
        };

        execute();
    }, [router.isReady, router.query, isTerminalReady]);

    // Terminal İlk Hazırlık
    useEffect(() => {
        if (!mounted || !terminalRef.current) return;

        let term: XTermType | null = null;
        let fitAddon: FitAddonType | null = null;
        let resizeObserver: ResizeObserver | null = null;
        let cleanupIpc: (() => void) | null = null;

        const initTerminal = async () => {
            console.log('[Terminal] Başlatılıyor...');

            const { Terminal: XTerm } = await import('xterm');
            const { FitAddon } = await import('xterm-addon-fit');

            term = new XTerm({
                cursorBlink: true,
                fontSize: 14,
                fontFamily: '"Fira Code", monospace',
                theme: {
                    background: "rgba(0, 0, 0, 0)",
                    foreground: "#ffffff",
                    cursor: "#ffffff",
                    selectionBackground: "rgba(255, 255, 255, 0.3)",
                },
                allowTransparency: true,
            });

            fitAddon = new FitAddon();
            term.loadAddon(fitAddon);

            if (terminalRef.current) {
                term.open(terminalRef.current);
                xtermRef.current = term;
                fitAddonRef.current = fitAddon;
                term.write('\x1b[1;32m[Luna Terminal]\x1b[0m\r\n');
                term.focus();
            }

            const handleResize = () => {
                if (!term || !fitAddon || !terminalRef.current) return;
                try {
                    fitAddon.fit();
                    window.api.terminal.resize(term.cols, term.rows);
                } catch (e) { }
            };

            window.addEventListener("resize", handleResize);
            resizeObserver = new ResizeObserver(() => handleResize());
            resizeObserver.observe(terminalRef.current!);

            if (window.api && window.api.terminal) {
                await window.api.terminal.create();
                console.log('[Terminal] PTY Süreci Hazır');
                setIsTerminalReady(true);

                const dataSub = window.api.terminal.onData((data: string) => {
                    if (term) term.write(data);
                });

                const exitSub = window.api.terminal.onExit(() => {
                    if (term) term.write('\r\n\x1b[1;31m[Süreç Bitti]\x1b[0m\r\n');
                });

                cleanupIpc = () => {
                    dataSub();
                    exitSub();
                };

                term.onData(data => window.api.terminal.write(data));

                setTimeout(handleResize, 500);
                setTimeout(() => term?.focus(), 600);
            }
        };

        // Pencere odağı kontrolü
        const handleWindowFocus = () => {
            if (xtermRef.current) {
                xtermRef.current.focus();
            }
        };

        window.addEventListener('focus', handleWindowFocus);
        const timer = setTimeout(initTerminal, 300);

        return () => {
            console.log('[Terminal] Temizleniyor...');
            window.removeEventListener('focus', handleWindowFocus);
            clearTimeout(timer);
            if (cleanupIpc) cleanupIpc();
            if (resizeObserver) resizeObserver.disconnect();
            if (term) term.dispose();
            xtermRef.current = null;
            fitAddonRef.current = null;
        };
    }, [mounted]);

    const handleGlobalClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'BUTTON') {
            if (xtermRef.current) {
                xtermRef.current.focus();
            }
        }
    };

    if (!mounted) return null;

    return (
        <div
            className="h-full w-full flex flex-col px-4 animate-in fade-in duration-500"
            onClick={handleGlobalClick}
        >
            {/* Container */}
            <div className="flex-1 flex flex-col border border-white/10 rounded-2xl overflow-hidden bg-black/40 backdrop-blur-xl relative">

                {!isTerminalReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                            <span className="text-white/20 text-xs font-mono tracking-widest">Loading...</span>
                        </div>
                    </div>
                )}

                <div className="flex-1 relative p-1">
                    <div ref={terminalRef} className="h-full w-full" style={{ minHeight: '300px' }} />
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] opacity-20" />
                </div>
            </div>

            <div className="h-4"></div>

            <style jsx global>{`
                .xterm-viewport::-webkit-scrollbar {
                    width: 6px;
                }
                .xterm-viewport::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .xterm-viewport::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                .xterm-screen {
                    padding: 4px;
                }
            `}</style>
        </div>
    );
};

export default TerminalPage;
