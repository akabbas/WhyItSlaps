/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/welcome",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
