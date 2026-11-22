import type { Metadata, Viewport } from "next";
import { Carlito } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { InstellingenProvider } from "@/lib/instellingen/InstellingenProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WEERGAVE_SCRIPT } from "@/components/weergaveScript";
import { THEMA_SCRIPT } from "@/lib/instellingen/themaScript";

const carlito = Carlito({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-app",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Open E-lab — Digitale werkvormen voor elke les",
  description:
    "Open-source omgeving voor didactisch onderbouwde digitale oefeningen, interactieve werkvormen en klastools voor leraren en cursisten.",
  applicationName: "Open E-lab",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Open E-lab",
  },
};

export const viewport: Viewport = {
  themeColor: "#2f6fde",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: het thema- en weergavescript hieronder zetten variabelen
    // en data-attributen op <html> vóór React hydrateert.
    <html lang="nl" className={carlito.variable} suppressHydrationWarning>
      <head>
        {/* Zet kleurschema en weergavekeuze vóór de eerste tekening, anders springt de pagina om. */}
        <script dangerouslySetInnerHTML={{ __html: THEMA_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: WEERGAVE_SCRIPT }} />
      </head>
      <body className="min-h-dvh flex flex-col antialiased">
        <InstellingenProvider>
          <AuthProvider>
            <Header />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </InstellingenProvider>
      </body>
    </html>
  );
}
