/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ['react-leaflet', 'leaflet', 'leaflet.markercluster', '@react-leaflet/core'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'tokkobroker.com' },
      { protocol: 'https', hostname: '*.tokkobroker.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/dashboard/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
    ]
  },
}

export default nextConfig
