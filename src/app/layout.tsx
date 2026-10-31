import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: `${BRAND.name}: speak a recap, get a decision board`,
  description:
    "One spoken paragraph per meeting → a finished decision board of decisions, actions, owners and open questions — shareable with one zero-signup link.",
  openGraph: {
    title: `${BRAND.name}: speak a recap, get a decision board`,
    description:
      "One spoken paragraph per meeting → a finished decision board of decisions, actions, owners and open questions — shareable with one zero-signup link.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FCFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#04141C" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="aura" aria-hidden>
          <i />
          <i />
          <i />
        </div>
        <div className="relative z-10 flex min-h-full flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
