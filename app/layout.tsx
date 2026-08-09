import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "sonner";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "Nutricare CRM",
    template: "%s | Nutricare CRM",
  },
  description:
    "Production-grade logistics, finance, and inventory management system for Nutricare.",
  applicationName: "Nutricare CRM",
  // Next serves the manifest from app/manifest.ts; this is the explicit link.
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Nutricare",
    // Matches the app background so the iOS status bar doesn't sit on a black
    // strip when launched from the home screen.
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // Stops iOS Safari turning order numbers and quantities into call links.
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#4a0b79",
  width: "device-width",
  initialScale: 1,
  // Installed apps should feel fixed, but pinch-zoom stays available — capping
  // it outright is an accessibility regression for staff who need to zoom.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full bg-background text-foreground">
        {children}
        <ServiceWorkerRegister />
        <InstallPrompt />
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
