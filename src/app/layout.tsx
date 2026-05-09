import "@/app/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "2026 서중한합회 청소년 페스티벌",
  description: "2026 서중한합회 청소년 페스티벌 운영 웹앱"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
