import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/api/tts": ["./scripts/tts.py"], "/*": ["./app/learning/schema.sql"] },
  outputFileTracingExcludes: { "/api/tts": ["./.venv/**/*"] },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
