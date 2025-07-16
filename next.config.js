/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Uncomment and update this if your repo name is different from 'nickita-website'
  // basePath: '/nickita-website',
}

module.exports = nextConfig 