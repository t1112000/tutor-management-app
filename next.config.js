/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["sequelize", "pg", "pg-hstore", "pg-pool", "node-cron", "web-push"],
  allowedDevOrigins: ["192.168.1.52"],
};

module.exports = nextConfig;
