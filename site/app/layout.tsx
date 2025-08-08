import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "disapyr.link",
  description: "Secure one-time secret sharing with automatic expiration",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get the nonce from headers set by middleware
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') || undefined;

  return (
    <html lang="en">
      <head>
        {/* This meta tag helps Next.js apply nonces to its internal scripts */}
        {nonce && <meta name="csp-nonce" content={nonce} />}
      </head>
      <body>
        {/* Add a script with nonce to help Next.js understand CSP requirements */}
        {nonce && (
          <Script
            id="csp-nonce-helper"
            nonce={nonce}
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.__CSP_NONCE__ = "${nonce}";`,
            }}
          />
        )}
        {children}
      </body>
    </html>
  );
}
