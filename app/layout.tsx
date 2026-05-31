import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IssueCompass",
  description: "AI first mate for open-source maintainers powered by Coral SQL joins"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
