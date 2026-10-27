import { DM_Sans, Playfair_Display } from "next/font/google";
import type { Metadata } from "next";
import { LoadingProvider } from "@/components/LoadingProvider";
import { NavigationProgress } from "@/components/NavigationProgress";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Valora Imóveis | O lugar certo para viver",
    template: "%s | Valora Imóveis",
  },
  description:
    "Redefinindo a experiência imobiliária com sofisticação, transparência e foco total na valorização do seu patrimônio.",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "256x256", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon-32.png",
    apple: [{ url: "/favicon.png", sizes: "256x256", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${playfair.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <LoadingProvider>
          <NavigationProgress />
          {children}
        </LoadingProvider>
      </body>
    </html>
  );
}
