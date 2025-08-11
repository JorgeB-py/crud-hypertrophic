import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "CRUD hypertrophic",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="bg-[url('/fondo.png')] bg-cover bg-center"
      >
        <main className="min-h-screen grid grid-rows-[auto_1fr_auto]">
          {children}
        </main>
      </body>
    </html>
  );
}
