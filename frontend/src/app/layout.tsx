import type { Metadata } from "next";

import { AuthProvider } from "@/components/layout/auth-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "TERRANOVA AI",
  description: "Urban planning platform authentication module",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
