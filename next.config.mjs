/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co", pathname: "/**" },
      { protocol: "https", hostname: "mosaic.scdn.co", pathname: "/**" },
      { protocol: "https", hostname: "**.spotifycdn.com", pathname: "/**" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/welcome",
        destination: "/",
        permanent: true,
      },
      {
        source: "/draft/history",
        destination: "/?mode=history",
        permanent: false,
      },
      {
        source: "/draft/detect",
        destination: "/?mode=music",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
