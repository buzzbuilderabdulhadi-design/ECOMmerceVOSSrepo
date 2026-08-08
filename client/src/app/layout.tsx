import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AppProvider } from "@/context/AppProvider";
import { CustomCursor } from "@/components/animations/CustomCursor";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VOSS — Luxury Fashion E-Commerce",
  description:
    "Discover curated luxury fashion at VOSS. Shop premium clothing, accessories, and more with an unparalleled shopping experience.",
  keywords: [
    "luxury fashion",
    "ecommerce",
    "clothing",
    "accessories",
    "premium fashion",
  ],
  openGraph: {
    title: "VOSS — Luxury Fashion E-Commerce",
    description:
      "Discover curated luxury fashion at VOSS. Shop premium clothing, accessories, and more.",
    type: "website",
    siteName: "VOSS",
  },
  twitter: {
    card: "summary_large_image",
    title: "VOSS — Luxury Fashion E-Commerce",
    description:
      "Discover curated luxury fashion at VOSS. Shop premium clothing, accessories, and more.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gradient-luxury">
        <AppProvider>
          <CustomCursor />
          <LoadingScreen />
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#112C47",
                color: "#F5F0E6",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
              },
              success: {
                iconTheme: {
                  primary: "#C4A86A",
                  secondary: "#112C47",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fafafa",
                },
              },
            }}
          />
        </AppProvider>
      </body>
    </html>
  );
}
