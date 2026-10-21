import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lyoria ReviewOps",
  description: "Turn restaurant reviews into evidence-linked actions and human-approved replies.",
  icons: {
    icon: "/lyoria-favicon.ico",
    apple: "/lyoria-favicon-192.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
