import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value:
      "default-src 'self'; script-src 'self' ; object-src 'none'; base-uri 'none'; frame-ancestors 'none';",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
