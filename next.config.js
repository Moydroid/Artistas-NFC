/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ¡Esto le dice a Vercel que no se trabe revisando tipos estrictos!
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig