import { loadConfig } from "./lib/config.js";
import { setLogLevel } from "./lib/logger.js";
import { runAgentLoop } from "./agent/loop.js";
import { logger } from "./lib/logger.js";

async function main(): Promise<void> {
  const config = loadConfig();
  setLogLevel(config.LOG_LEVEL);
  logger.info("Circuit starting - DeFi risk circuit breaker");
  logger.info(`Wallet: ${config.WALLET_ADDRESS.slice(0, 8)}...`);
  logger.info(`Auto-exit: ${config.AUTO_EXIT ? "ENABLED" : "DISABLED (alert-only)"}`);

  async function check(): Promise<void> {
    const startedAt = Date.now();

    try {
      await runAgentLoop(config);
    } catch (err) {
      logger.error("Check error:", err);
    } finally {
      const durationMs = Date.now() - startedAt;
      logger.info("Risk check complete", { durationMs });

      if (durationMs > config.CHECK_INTERVAL_MS) {
        logger.warn("Risk check exceeded configured interval", {
          durationMs,
          intervalMs: config.CHECK_INTERVAL_MS,
        });
      }
    }
  }

  const runLoop = async (): Promise<void> => {
    await check();
    setTimeout(() => {
      void runLoop();
    }, config.CHECK_INTERVAL_MS);
  };

  await runLoop();
  logger.info(`Monitoring every ${config.CHECK_INTERVAL_MS / 1000}s...`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
