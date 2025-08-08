import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  compiler: {
    // Enables the styled-components SWC transform
    // styledComponents: true,
  },
  async headers() {
    return [
      {
        source: '/:path*', // Applies to all paths
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
