import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import React from "react";

export const metadata: Metadata = {
  title: "disapyr.link",
  description: "Secure one-time secret sharing with automatic expiration",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Calling headers().get('x-nonce') registers the request nonce with
  // Next.js's SSR pipeline so it annotates its own inline hydration
  // scripts with the correct nonce attribute. We intentionally do NOT
  // expose this value via DOM attributes, meta tags, or script overrides
  // — those patterns allow injected scripts to read the nonce and bypass CSP.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const nonce = (await headers()).get('x-nonce');

  return (
    <html lang="en">
      <head />
      <body>
        {children}
      </body>
    </html>
  );
}
