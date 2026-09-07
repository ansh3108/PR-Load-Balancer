/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Add this line to tell Next.js to stop trying to bundle Prisma
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default config;