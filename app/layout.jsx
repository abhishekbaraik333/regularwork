import { Archivo, Montserrat } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin", "cyrillic"],
  variable: "--font-archivo",
});

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-montserrat",
});

export const metadata = {
  title: "Внутрішнє відправлення | InPost Szybkie Nadania",
  description: "Надсилайте посилки швидко та зручно в межах Польщі та за кордон з InPost.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl" className={`${archivo.variable} ${montserrat.variable}`}>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
