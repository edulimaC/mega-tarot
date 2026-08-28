import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MegaTarot — uma leitura para voltar a ouvir você mesma",
  description: "Escolha seu tema e receba uma leitura intuitiva personalizada.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
        <script
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          data-utmify-prevent-xcod-sck=""
          data-utmify-prevent-subids=""
          async
          defer
        />
      </body>
    </html>
  );
}
