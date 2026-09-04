/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración limpia y moderna para Next.js 15/16
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdpzjslfbdaccotfzgim.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig
