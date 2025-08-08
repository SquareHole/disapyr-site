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
    <html lang="en" data-csp-nonce={nonce}>
      <head>
        {/* Essential meta tags for Next.js CSP integration */}
        {nonce && <meta name="csp-nonce" content={nonce} />}
        {nonce && <meta name="next-head-nonce" content={nonce} />}
      </head>
      <body>
        {/* Critical nonce injection for Next.js internal scripts */}
        {nonce && (
          <Script
            id="nextjs-csp-nonce"
            nonce={nonce}
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.__NEXT_CSP_NONCE__ = "${nonce}";
                window.__CSP_NONCE__ = "${nonce}";
                // Ensure all dynamically created scripts get the nonce
                (function() {
                  const originalCreateElement = document.createElement;
                  document.createElement = function(tagName) {
                    const element = originalCreateElement.call(this, tagName);
                    if (tagName.toLowerCase() === 'script') {
                      element.nonce = "${nonce}";
                    }
                    return element;
                  };
                })();
              `,
            }}
          />
        )}
        {children}
      </body>
    </html>
  );
}
