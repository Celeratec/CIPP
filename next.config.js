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
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  transpilePackages: ["react-syntax-highlighter", "refractor", "parse-entities"],
  output: "export",
  distDir: "./out",
  experimental: {
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
};

module.exports = config;
