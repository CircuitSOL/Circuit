import { loadConfig } from "./lib/config.js";
import { setLogLevel } from "./lib/logger.js";
import { runAgentLoop } from "./agent/loop.js";
import { logger } from "./lib/logger.js";

async function main(): Promise<void> {
  const config = loadConfig();
  setLogLevel(config.LOG_LEVEL);
  logger.info("Circuit starting — DeFi risk circuit breaker");
  logger.info(`Wallet: ${config.WALLET_ADDRESS.slice(0, 8)}...`);
  logger.info(`Auto-exit: ${config.AUTO_EXIT ? "ENABLED" : "DISABLED (alert-only)"}`);

  async function check(): Promise<void> {
    try { await runAgentLoop(config); } catch (err) { logger.error("Check error:", err); }
  }

  await check();
  setInterval(check, config.CHECK_INTERVAL_MS);
  logger.info(`Monitoring every ${config.CHECK_INTERVAL_MS / 1000}s...`);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
