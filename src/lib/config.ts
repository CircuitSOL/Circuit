import { z } from "zod";


const TEST_ENV = process.env.NODE_ENV === "test" || process.env.VITEST === "true";

const ConfigSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1),
  WALLET_ADDRESS: z.string().min(32),
  CHECK_INTERVAL_MS: z.coerce.number().default(15_000),
  WATCH_HEALTH_FACTOR_THRESHOLD: z.coerce.number().default(1.2),
  WARNING_HEALTH_FACTOR_THRESHOLD: z.coerce.number().default(1.1),
  CRITICAL_HEALTH_FACTOR_THRESHOLD: z.coerce.number().default(1.05),
  AUTO_EXIT: z.coerce.boolean().default(false),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  const env = TEST_ENV
    ? {
        ANTHROPIC_API_KEY: "test-anthropic-key",
        WALLET_ADDRESS: "TestWallet111111111111111111111111111111",
        ...process.env,
      }
    : process.env;
  const result = ConfigSchema.safeParse(env);
  if (!result.success) {
    console.error("Invalid configuration:", result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}
