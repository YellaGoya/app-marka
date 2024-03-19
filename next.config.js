// eslint-disable-next-line @typescript-eslint/no-var-requires
const withPWA = require('next-pwa')({
  dest: 'public',
});

const nextConfig = {
  basePath: '/app-marka',
  reactStrictMode: false,
};

module.exports = withPWA(nextConfig);
