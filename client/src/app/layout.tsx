import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AppProvider } from "@/context/AppProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "var(--toast-bg, #18181b)",
                color: "var(--toast-color, #fafafa)",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
              },
              success: {
                iconTheme: {
                  primary: "#22c55e",
                  secondary: "#fafafa",
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

