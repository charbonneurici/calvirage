/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['upload.wikimedia.org', 'cdn.lnr.fr'],
  },
};
module.exports = nextConfig;
