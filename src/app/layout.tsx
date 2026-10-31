import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "NoHands Log: speak a recap, get a decision board",
  description:
    "One spoken paragraph per meeting → a finished decision board of decisions, actions, owners and open questions — shareable with one zero-signup link.",
  openGraph: {
    title: "NoHands Log: speak a recap, get a decision board",
    description:
      "One spoken paragraph per meeting → a finished decision board of decisions, actions, owners and open questions — shareable with one zero-signup link.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#18181b",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
