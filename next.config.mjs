/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverMinification: false,
  },
  serverExternalPackages: ["nodemailer", "mongodb"],
  // ✅ Force all server routes to use Node.js runtime
  runtime: "node",
};

export default nextConfig;
