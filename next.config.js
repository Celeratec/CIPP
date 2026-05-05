const disableOptimizePackageImports = process.env.NEXT_DISABLE_OPTIMIZE_PACKAGE_IMPORTS === '1'

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: disableOptimizePackageImports
      ? []
      : [
          '@mui/material',
          '@mui/icons-material',
          '@mui/lab',
          '@mui/system',
          '@mui/x-date-pickers',
          '@heroicons/react',
          'material-react-table',
          'mui-tiptap',
          'recharts',
          '@react-pdf/renderer',
          'lodash',
          'date-fns',
          'date-fns/locale',
        ],
    webpackMemoryOptimizations: true,
    preloadEntriesOnStart: false,
    turbopackFileSystemCacheForDev: false,
    turbopackMemoryLimit: 4096,
  },
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
  transpilePackages: ["react-syntax-highlighter", "refractor", "parse-entities", "devlop", "hast-util-to-text", "unist-util-find-after"],
  serverExternalPackages: [],
  async redirects() {
    return []
  },
  output: 'export',
  distDir: './out',
};

module.exports = config
