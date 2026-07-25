/**
 * Cloudflare Workers (via Nitro's cloudflare preset) exposes dashboard
 * environment variables on `globalThis.__env__` per-request, NOT on
 * `process.env` like a normal Node server. This helper checks both so the
 * same code works locally (Node/`bun run dev`) and once deployed to
 * Cloudflare Workers.
 */
export function getEnv(key: string): string | undefined {
  const cfEnv = (globalThis as any).__env__;
  if (cfEnv && key in cfEnv && cfEnv[key] !== undefined) return cfEnv[key];
  return typeof process !== "undefined" ? process.env[key] : undefined;
}
