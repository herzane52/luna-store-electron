import "@/styles/globals.css";
import { useEffect } from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { AppProvider } from "../context/AppContext";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const checkBoot = async () => {
      // Prevent running on server/during build
      if (typeof window === "undefined" || !window.api) return;

      try {
        const settings = await window.api.settings.get();

        // 1. If Setup not done -> Go to Setup
        if (!settings.setupComplete && router.pathname !== "/setup") {
          router.push("/setup");
          return;
        }

        // 2. If Setup done, but haven't shown Boot Screen this session -> Go to Loading
        // We use sessionStorage to ensure we only show "Loading..." once per app launch (or refresh)
        const hasBooted = sessionStorage.getItem("hasBooted");
        if (settings.setupComplete && !hasBooted && router.pathname !== "/loading" && router.pathname !== "/setup") {
          sessionStorage.setItem("hasBooted", "true");
          router.push({
            pathname: "/loading",
            query: { lang: settings.language, theme: settings.theme }
          });
          return;
        }
      } catch (e) {
        console.error("Boot check failed", e);
      }
    };

    checkBoot();
  }, [router.pathname]);

  // Special pages without Layout
  if (router.pathname === "/test" || router.pathname === "/setup" || router.pathname === "/loading") {
    return (
      <AppProvider>
        <Component {...pageProps} />
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AppProvider>
  );
}
