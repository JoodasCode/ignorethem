/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Suppress Prisma instrumentation warnings from Sentry
    config.ignoreWarnings = [
      {
        module: /node_modules\/@prisma\/instrumentation/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ]
    return config
  },
}

export default nextConfig