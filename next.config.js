/** @type {import('next').NextConfig} */
const stylexPlugin = require('@stylexjs/nextjs-plugin');

const nextConfig = {
  basePath: '/app-key-event-viewer',
  output: 'export',

  // Configure `pageExtensions` to include MDX files
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  transpilePackages: ['@stylexjs/open-props'],
  // Optionally, add any other Next.js config below
};

module.exports = stylexPlugin({
  rootDir: __dirname,
})(nextConfig);
