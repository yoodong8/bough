import "./globals.css";

export const metadata = {
  title: "Bough",
  description: "Branch your thinking, follow the bough.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
