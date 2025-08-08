import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "disapyr.link",
  description: "Secure one-time secret sharing with automatic expiration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the nonce injected by middleware so we can apply it to any
  // Next-managed scripts via the nonce prop.
  const nonce = typeof window === 'undefined'
    ? (require('next/headers').headers().get('x-nonce') ?? undefined)
    : undefined;

  return (
    <html lang="en">
      <body>
        {/* Apply nonce to any custom scripts if added in the future */}
        <Script id="noop" nonce={nonce} strategy="beforeInteractive">{``}</Script>
        {children}
      </body>
    </html>
  );
}
