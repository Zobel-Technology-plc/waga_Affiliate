import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from '../components/layouts/Header'
import {GlobalProvider} from './GlobalProvider'
import BottomNav from "@/components/BottomNav/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Waga Affiliate",
  
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <GlobalProvider>
      <Header />
      {children}
      <BottomNav/>
    </GlobalProvider>
        </body>
    </html>
  );
}
