import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import localFont from "next/font/local";
import { Cormorant_Garamond, DM_Mono } from "next/font/google";
import { PatnaAssistant } from "@/components/patna-assistant";
import { isRtlLocale } from "@/lib/locales";
import "./globals.css";

const plusJakartaSans = localFont({
  src: [
    { path: "./fonts/plus-jakarta-sans-400.ttf", weight: "400", style: "normal" },
    { path: "./fonts/plus-jakarta-sans-500.ttf", weight: "500", style: "normal" },
    { path: "./fonts/plus-jakarta-sans-600.ttf", weight: "600", style: "normal" },
    { path: "./fonts/plus-jakarta-sans-700.ttf", weight: "700", style: "normal" },
    { path: "./fonts/plus-jakarta-sans-800.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: {
    default: "The PATNA Initiative",
    template: "%s | The PATNA Initiative",
  },
  description:
    "African-centred climate action, maritime decarbonisation, and energy transition coordination through evidence, convenings, and institutional collaboration.",
  icons: {
    icon: "/brand/patna-icon.png",
    shortcut: "/brand/patna-icon.png",
    apple: "/brand/patna-icon.png",
  },
};

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body suppressHydrationWarning className={`${plusJakartaSans.variable} ${cormorantGaramond.variable} ${dmMono.variable}`}>
        <NextIntlClientProvider messages={messages}>
          {children}
          <PatnaAssistant />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
