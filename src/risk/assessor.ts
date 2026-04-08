import type { DeFiPosition, RiskAssessment, RiskLevel } from "../lib/types.js";
import { loadConfig } from "../lib/config.js";

function classifyRisk(hf: number, threshold: number): RiskLevel {
  const config = loadConfig();
  if (hf <= config.CRITICAL_HEALTH_FACTOR_THRESHOLD || hf <= threshold + 0.02) return "critical";
  if (hf <= config.WARNING_HEALTH_FACTOR_THRESHOLD || hf <= threshold + 0.08) return "warning";
  if (hf <= config.WATCH_HEALTH_FACTOR_THRESHOLD || hf <= threshold + 0.15) return "watch";
  return "safe";
}

function estimateTimeToLiquidation(hf: number, threshold: number): number | undefined {
  if (hf <= threshold) return 0;
  const buffer = hf - threshold;
  const decayRate = 0.02;
  return Math.round(buffer / decayRate) * 3600 * 1000;
}

function buildRecommendations(pos: DeFiPosition, riskLevel: RiskLevel): string[] {
  const recs: string[] = [];

  if (riskLevel === "critical") {
    recs.push(`URGENT: Add collateral immediately or close position to avoid liquidation`);
    recs.push(`Health factor ${pos.healthFactor.toFixed(3)} is dangerously close to ${pos.liquidationThreshold.toFixed(3)}`);
  } else if (riskLevel === "warning") {
    recs.push(`Consider adding ${((pos.debtUsd * 0.2)).toFixed(0)} USD in collateral to raise health factor above 1.3`);
    recs.push(`Reduce debt by partial repayment to improve buffer`);
  } else if (riskLevel === "watch") {
    recs.push(`Position is healthy but monitor price action on ${pos.debtToken}`);
    recs.push(`Set a price alert if ${pos.debtToken} rises more than 10%`);
  } else {
    recs.push(`Position is in good health — no action needed`);
  }

  return recs;
}

export function assessPosition(pos: DeFiPosition): RiskAssessment {
  const riskLevel = classifyRisk(pos.healthFactor, pos.liquidationThreshold);

  return {
    positionId: pos.id,
    riskLevel,
    healthFactor: pos.healthFactor,
    distanceToLiquidation: pos.healthFactor - pos.liquidationThreshold,
    estimatedTimeToLiquidation: estimateTimeToLiquidation(pos.healthFactor, pos.liquidationThreshold),
    recommendations: buildRecommendations(pos, riskLevel),
    generatedAt: Date.now(),
  };
}

export function assessAll(positions: DeFiPosition[]): RiskAssessment[] {
  return positions
    .map(assessPosition)
    .sort((a, b) => a.distanceToLiquidation - b.distanceToLiquidation);
}
