import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DG Stats",
  description: "Disc golf player and round analytics"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
