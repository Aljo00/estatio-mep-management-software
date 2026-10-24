import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Estatio | MEP Operations",
  description: "Project operations and control for Estatio MEP.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
