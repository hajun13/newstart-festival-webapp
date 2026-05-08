import "@/app/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEWSTART 생명의 열쇠",
  description: "2026 하계 청소년 페스티벌 운영 웹앱"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
