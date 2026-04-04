import type { DeFiPosition, RiskAssessment } from "../lib/types.js";

const RISK_ICON: Record<RiskAssessment["riskLevel"], string> = {
  safe: "[ OK ]",
  watch: "[WATCH]",
  warning: "[WARN ]",
  critical: "[CRIT ]",
};

export function printRiskBoard(positions: DeFiPosition[], assessments: RiskAssessment[]): void {
  const assessMap = new Map(assessments.map((a) => [a.positionId, a]));
  const line = "─".repeat(66);

  console.log(`\n${"═".repeat(66)}`);
  console.log(`  CIRCUIT  —  Position Risk Monitor`);
  console.log(`  ${new Date().toUTCString()}`);
  console.log(`${"═".repeat(66)}`);

  for (const pos of positions) {
    const a = assessMap.get(pos.id);
    if (!a) continue;

    console.log(`\n  ${RISK_ICON[a.riskLevel]}  ${pos.protocol.toUpperCase()}  ${pos.collateralToken} / ${pos.debtToken}`);
    console.log(`  Health Factor: ${a.healthFactor.toFixed(4)}  (liq at ${pos.liquidationThreshold.toFixed(4)})`);
    console.log(`  Collateral:    $${pos.collateralUsd.toLocaleString()}   Debt: $${pos.debtUsd.toLocaleString()}`);
    console.log(`  Buffer:        ${a.distanceToLiquidation.toFixed(4)} HF units`);

    if (a.riskLevel !== "safe") {
      console.log(`  ─ Recommendations:`);
      for (const r of a.recommendations) {
        console.log(`    • ${r}`);
      }
    }
    console.log(line);
  }

  const critCount = assessments.filter((a) => a.riskLevel === "critical").length;
  const warnCount = assessments.filter((a) => a.riskLevel === "warning").length;
  console.log(`\n  Summary: ${positions.length} position(s)  |  ${critCount} critical  |  ${warnCount} warning\n`);
}
