import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SquawkAI – Turn Your Content into Conversations",
  description:
    "SquawkAI transforms your static content into intelligent, conversational experiences. Upload files, ask questions, and get instant answers powered by AI.",
  keywords: [
    "SquawkAI",
    "AI content assistant",
    "file chatbot",
    "RAG chatbot",
    "conversational AI",
    "intelligent document search",
    "chat with files",
    "AI knowledge base",
    "smart file viewer",
  ],
  openGraph: {
    title: "SquawkAI – Turn Your Content into Conversations",
    description:
      "Talk to your documents with SquawkAI. Transform static files into intelligent chat experiences powered by AI.",
    url: "https://www.sumitnalavade.com",
    siteName: "SquawkAI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SquawkAI Preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SquawkAI – Turn Your Content into Conversations",
    description:
      "SquawkAI turns your documents into dialogue. Upload files and ask questions – powered by intelligent AI.",
    images: ["/og-image.png"],
    creator: "@squawk_ai",
  },
  icons: {
    icon: "/favicon.ico",
  },
  metadataBase: new URL("https://www.sumitnalavade.com"),
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
          {children}
      </body>
    </html>
  );
}
