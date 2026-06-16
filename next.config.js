/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["sequelize", "pg", "pg-hstore", "pg-pool", "node-cron"],
};

module.exports = nextConfig;
