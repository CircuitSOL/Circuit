import { z } from "zod";

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
  const result = ConfigSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid configuration:", result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}
