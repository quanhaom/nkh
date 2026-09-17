import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Bản đồ tìm kiếm hài cốt liệt sĩ",
  description:
    "Bản đồ tương tác về các địa điểm tìm kiếm và phát hiện hài cốt liệt sĩ tại Việt Nam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={montserrat.variable}
    >
      <body>{children}</body>
    </html>
  );
}