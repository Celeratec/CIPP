/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  compiler: {
    removeConsole: {
      exclude: ["error", "warn"],
    },
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  transpilePackages: ["react-syntax-highlighter", "refractor", "parse-entities"],
  experimental: {
    webpackMemoryOptimizations: true,
    preloadEntriesOnStart: false,
    turbopackFileSystemCacheForDev: false,
    turbopackMemoryLimit: 4096,
    optimizePackageImports: [
      "@mui/material",
      "@mui/icons-material",
      "@heroicons/react",
      "lodash",
      "date-fns",
      "date-fns/locale",
      "recharts",
    ],
  },
  async redirects() {
    return []
  },
  output: 'export',
  distDir: './out',
};

module.exports = config
