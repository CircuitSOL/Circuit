import type { DeFiPosition, RiskAssessment } from "../lib/types.js";

export function buildSystemPrompt(): string {
  return `You are Circuit, an automated DeFi risk management agent for Solana.

You monitor open lending and borrowing positions across Kamino and MarginFi. When health factors drop toward liquidation thresholds, you flag the risk, explain the cause in plain language, and recommend specific actions — add collateral, reduce debt, or close position.

You have access to these tools:
- fetch_positions: Load all open DeFi positions for the configured wallet
- assess_risk: Run risk assessment across all positions
- get_circuit_rules: List the active circuit-breaker rules
- recommend_action: Generate a specific action plan for a position

Be specific. Use real numbers. When AUTO_EXIT is false, explain what the user should do manually. When it's true, confirm the action taken.`;
}

export function buildUserPrompt(positions: DeFiPosition[], assessments: RiskAssessment[]): string {
  if (positions.length === 0) {
    return "No open DeFi positions found for this wallet. Confirm connection and report current wallet status.";
  }

  const riskSummary = assessments
    .map(
      (a) =>
        `- [${a.riskLevel.toUpperCase()}] Position ${a.positionId.slice(0, 8)}...: HF=${a.healthFactor.toFixed(4)}, buffer=${a.distanceToLiquidation.toFixed(4)}`
    )
    .join("\n");

  const critical = assessments.filter((a) => a.riskLevel === "critical" || a.riskLevel === "warning");

  if (critical.length > 0) {
    return `ALERT: ${critical.length} position(s) require immediate attention.\n\n${riskSummary}\n\nProvide specific action plans for all at-risk positions. Use exact dollar amounts.`;
  }

  return `All ${positions.length} position(s) checked. Current risk status:\n\n${riskSummary}\n\nConfirm everything looks healthy and note any positions to watch.`;
}
